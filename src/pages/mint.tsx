import Base from '@/components/ui/base';
import Button from '@/components/ui/button';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { useMidenSdk } from '@/lib/hooks/use-miden-sdk';
import type { NextPageWithLayout } from '@/types';
import {
  ConsumeTransaction,
  NoteTypeString,
  WalletNotConnectedError,
  useWallet,
  MidenWalletAdapter,
} from '@demox-labs/miden-wallet-adapter';
import { NextSeo } from 'next-seo';
import {
  FormEvent,
  SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { sha3_256 } from 'js-sha3';

interface FaucetMetadata {
  id: string;
  asset_amount_options: number[];
}

const MintPage: NextPageWithLayout = () => {
  const { wallet, publicKey } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | undefined>();
  const [faucetState, setFaucetState] = useState<FaucetMetadata | undefined>();
  const [client, setClient] = useState<any>(null);

  const { Miden, createClient } = useMidenSdk();

  let [amount, setAmount] = useState<number | undefined>(100);

  useEffect(() => {
    let mounted = true;

    const initClient = async () => {
      if (!mounted) return;

      try {
        // Create a new client instance
        const newClient = await createClient();
        if (!newClient || !mounted) return;
        setClient(newClient);
      } catch (error) {
        console.error('Error initializing client:', error);
        if (mounted) {
          setStatus('Error initializing. Please refresh the page.');
        }
      }
    };

    initClient();

    return () => {
      mounted = false;
    };
  }, [createClient]);

  const fetchFaucetState = useCallback(async () => {
    fetch('https://faucet.testnet.miden.io/get_metadata')
      .then((response) => response.json())
      .then((data) => {
        setFaucetState(data);
      })
      .catch((error) => {
        console.error('Error fetching faucet metadata:', error);
      });
  }, [setFaucetState]);

  useEffect(() => {
    if (faucetState) {
      return;
    }
    fetchFaucetState();
  }, [fetchFaucetState, faucetState]);

  // Function to find a valid nonce for proof of work using the new challenge format
  async function findValidNonce(challenge: string, target: string) {
    let nonce = 0;
    let targetNum = BigInt(target);

    while (true) {
      // Generate a random nonce
      nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);

      try {
        // Compute hash using SHA3 with the challenge and nonce
        let hash = sha3_256.create();
        hash.update(challenge); // Use the hex-encoded challenge string directly

        // Convert nonce to 8-byte big-endian format to match backend
        const nonceBytes = new ArrayBuffer(8);
        const nonceView = new DataView(nonceBytes);
        nonceView.setBigUint64(0, BigInt(nonce), false); // false = big-endian
        const nonceByteArray = new Uint8Array(nonceBytes);
        hash.update(nonceByteArray);

        // Take the first 8 bytes of the hash and parse them as u64 in big-endian
        let digest = BigInt('0x' + hash.hex().slice(0, 16));

        // Check if the hash is less than the target
        if (digest < targetNum) {
          return nonce;
        }
      } catch (error: any) {
        console.error('Error computing hash:', error);
        throw new Error('Failed to compute hash: ' + error.message);
      }

      // Yield to browser to prevent freezing
      if (nonce % 1000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    }
  }

  async function powChallenge() {
    let powResponse;
    try {
      powResponse = await fetch(
        'https://faucet.testnet.miden.io/pow?' +
          new URLSearchParams({
            account_id: publicKey!,
          }),
        {
          method: 'GET',
        }
      );
    } catch (error) {
      setStatus('Connection failed.');
      return { challenge: '', nonce: 0 };
    }

    if (!powResponse.ok) {
      const message = await powResponse.text();
      setStatus(message);
      setIsLoading(false);
      return { challenge: '', nonce: 0 };
    }
    setIsLoading(true);

    const powData = await powResponse.json();

    const nonce = await findValidNonce(powData.challenge, powData.target);
    return { challenge: powData.challenge, nonce };
  }

  async function requestNote(
    isPrivateNote: boolean,
    amount: number,
    challenge: string,
    nonce: number
  ) {
    try {
      const params = {
        account_id: publicKey!,
        is_private_note: String(isPrivateNote),
        asset_amount: amount.toString(),
        challenge: challenge,
        nonce: nonce.toString(),
      };
      const noteDataRegex = /"data_base64":"([^"]+)"/;
      const noteIdRegex = /"note_id":"([^"]+)"/;
      let noteData = '';
      let noteId = '';

      const response = await fetch(
        'https://faucet.testnet.miden.io/get_tokens?' +
          new URLSearchParams(params),
        {
          method: 'GET',
          headers: {
            'Content-Type': 'text/event-stream',
          },
        }
      );
      const text = await response.text();
      const noteDataMatch = noteDataRegex.exec(text);
      const noteIdMatch = noteIdRegex.exec(text);
      if (noteDataMatch) {
        noteData = noteDataMatch[1];
      }
      if (noteIdMatch) {
        noteId = noteIdMatch[1];
      }

      return { noteData, noteId };
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const handleSubmit = async (event: any, noteType: NoteTypeString) => {
    event.preventDefault();
    if (!publicKey) throw new WalletNotConnectedError();
    if (!Miden || !client) return;
    setIsLoading(true);

    const isPrivateNote = noteType === 'private';
    setStatus('Minting note from remote faucet...');
    try {
      const { challenge, nonce } = await powChallenge();

      const noteResponse = await requestNote(
        isPrivateNote,
        amount!,
        challenge,
        nonce
      );
      let transaction: ConsumeTransaction;

      if (isPrivateNote) {
        // Decode base64
        const binaryString = atob(noteResponse!.noteData);
        const byteArray = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          byteArray[i] = binaryString.charCodeAt(i);
        }

        const buffer = new ArrayBuffer(byteArray.byteLength);
        const bytesCopy = new Uint8Array(buffer);
        bytesCopy.set(byteArray);
        const noteId = await client.importNote(byteArray);
        transaction = new ConsumeTransaction(
          faucetState!.id,
          noteId,
          noteType,
          amount!,
          bytesCopy
        );
        console.log(transaction);
      } else {
        transaction = new ConsumeTransaction(
          faucetState!.id,
          noteResponse!.noteId,
          noteType,
          amount!
        );
      }

      setStatus('Submitting consume transaction request...');
      const txId =
        (await (wallet?.adapter as MidenWalletAdapter).requestConsume(
          transaction
        )) || '';
      setIsLoading(false);
      setStatus(`Transaction ID: ${txId}`);
    } catch (error: any) {
      setIsLoading(false);
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleAmountChange = (event: any) => {
    event.preventDefault();
    setAmount(event.currentTarget.value);
  };

  return (
    <>
      <NextSeo
        title="Miden Wallet Request Mint"
        description="Request Mint from the Miden Wallet"
      />
      <Base>
        <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full text-xs text-white sm:text-sm">
          {`Mint from Miden Faucet${faucetState ? `: ${faucetState.id}` : ''}`}
        </div>
        <form
          className="relative flex w-full flex-col rounded-full md:w-auto"
          noValidate
          role="search"
        >
          <label className="flex w-full items-center justify-between py-4">
            <select
              className="h-11 w-1/2 appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-4 rtl:pr-4 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              autoComplete="off"
              onChange={(event: FormEvent<Element>) =>
                handleAmountChange(event)
              }
              value={amount}
            >
              {faucetState?.asset_amount_options.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="flex items-center justify-center">
              <Button
                disabled={!publicKey || !amount || !Miden || !client}
                type="submit"
                color="white"
                className="ml-4 shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
                isLoading={isLoading}
                onClick={async (event: SyntheticEvent<HTMLButtonElement>) => {
                  await handleSubmit(event, 'public');
                }}
              >
                {!publicKey ? 'Connect Your Wallet' : 'Mint Public Note'}
              </Button>
              {publicKey && (
                <Button
                  disabled={!publicKey || !amount || !Miden || !client}
                  type="submit"
                  color="white"
                  className="ml-4 shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
                  isLoading={isLoading}
                  onClick={async (event: SyntheticEvent<HTMLButtonElement>) => {
                    await handleSubmit(event, 'private');
                  }}
                >
                  Mint Private Note
                </Button>
              )}
            </div>
          </label>
        </form>
        {status && (
          <div className="mt-5 inline-flex w-full items-center rounded-full bg-white shadow-card dark:bg-light-dark xl:mt-6">
            <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full text-xs text-white sm:text-sm">
              {status}
            </div>
          </div>
        )}
      </Base>
    </>
  );
};

MintPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default MintPage;
