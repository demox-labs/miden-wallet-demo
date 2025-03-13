import Base from '@/components/ui/base';
import Button from '@/components/ui/button';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { useMidenSdk } from '@/lib/hooks/use-miden-sdk';
import type { NextPageWithLayout } from '@/types';
import {
  ConsumeTransaction,
  NoteTypeString,
  Transaction,
  WalletNotConnectedError,
} from '@demox-labs/miden-wallet-adapter-base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { TridentWalletAdapter } from '@demox-labs/miden-wallet-adapter-trident';
import { NextSeo } from 'next-seo';
import {
  FormEvent,
  SyntheticEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';

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

  async function requestNote(isPrivateNote: boolean, amount: number) {
    try {
      const response = await fetch(
        'https://faucet.testnet.miden.io/get_tokens',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            account_id: publicKey,
            is_private_note: isPrivateNote,
            asset_amount: amount,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      return response;
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
      const noteResponse = await requestNote(isPrivateNote, amount!);

      const noteBuffer = await noteResponse!.arrayBuffer();
      const noteBytes = new Uint8Array(noteBuffer);

      let transaction: ConsumeTransaction;

      if (isPrivateNote) {
        const buffer = new ArrayBuffer(noteBytes.byteLength);
        const bytesCopy = new Uint8Array(buffer);
        bytesCopy.set(noteBytes);
        const noteId = await client.importNote(noteBytes);
        transaction = new ConsumeTransaction(
          faucetState!.id,
          noteId,
          noteType,
          amount!,
          bytesCopy
        );
        console.log(transaction);
      } else {
        const noteId = await client.importNote(noteBytes);
        transaction = new ConsumeTransaction(
          faucetState!.id,
          noteId,
          noteType,
          amount!
        );
      }

      setStatus('Submitting consume transaction request...');
      const txId =
        (await (wallet?.adapter as TridentWalletAdapter).requestConsume(
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
        title="Trident Wallet Request Mint"
        description="Request Mint from the Trident Wallet"
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
