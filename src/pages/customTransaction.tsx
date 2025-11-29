import { FormEvent, useCallback, useEffect, useState } from 'react';
import { NextSeo } from 'next-seo';

import type { AccountId, WebClient } from '@demox-labs/miden-sdk';
import {
  CustomTransaction,
  TransactionType,
  WalletNotConnectedError,
} from '@demox-labs/miden-wallet-adapter-base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';

import Base from '@/components/ui/base';
import Button from '@/components/ui/button';
import { FAUCET_API_URL } from '@/constants';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { useMidenSdk } from '@/lib/hooks/use-miden-sdk';
import { FaucetMetadata, NextPageWithLayout } from '@/types';

const CustomTransactionPage: NextPageWithLayout = () => {
  const { address, requestTransaction } = useWallet();
  const { Miden, createClient } = useMidenSdk();

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | undefined>();
  const [faucetState, setFaucetState] = useState<FaucetMetadata | undefined>();
  let [client, setClient] = useState<WebClient | null>(null);

  let [toAddress, setToAddress] = useState<string>('');

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
    fetch(`${FAUCET_API_URL}/get_metadata`)
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

  function bech32ToAccountId(bech32str: string) {
    return Miden.Address.fromBech32(bech32str).accountId();
  }

  function accountIdToBech32(accountId: AccountId) {
    return Miden.Address.fromAccountId(accountId, 'BasicWallet').toBech32(
      Miden.NetworkId.Testnet
    );
  }

  async function createCustomTransaction(): Promise<CustomTransaction> {
    console.log('Creating custom transaction... 1');
    console.log('address', address);
    console.log('toAddress', toAddress);
    console.log('faucetState', faucetState);
    console.log('client', client);

    // Validate inputs
    if (!address || !toAddress || !faucetState || !client)
      throw new WalletNotConnectedError();

    console.log('Creating custom transaction... 1.5');
    const walletAccountId = bech32ToAccountId(address);
    console.log('custom transaction 2');
    const recipientAccountId = bech32ToAccountId(toAddress);
    console.log('custom transaction 3');
    const faucetAccountId = bech32ToAccountId(faucetState!.id);
    console.log('custom transaction 4');
    const amount = BigInt(10 * 10 ** faucetState!.decimals);

    // Creating Custom Note which needs the following:
    // - Note Assets
    // - Note Metadata
    // - Note Recipient

    // Creating NOTE_ARGS
    let felt1 = new Miden.Felt(BigInt(9));
    let felt2 = new Miden.Felt(BigInt(12));
    let felt3 = new Miden.Felt(BigInt(18));
    let felt4 = new Miden.Felt(BigInt(3));
    let felt5 = new Miden.Felt(BigInt(3));
    let felt6 = new Miden.Felt(BigInt(18));
    let felt7 = new Miden.Felt(BigInt(12));
    let felt8 = new Miden.Felt(BigInt(9));

    console.log('custom transaction 5');

    let noteArgs = [felt1, felt2, felt3, felt4, felt5, felt6, felt7, felt8];
    let feltArray = new Miden.MidenArrays.FeltArray();
    noteArgs.forEach((felt) => {
      feltArray.push(felt);
    });

    console.log('custom transaction 6');

    const asset = new Miden.FungibleAsset(faucetAccountId, amount);
    let noteAssets = new Miden.NoteAssets([asset]);

    console.log('custom transaction 7');

    let noteMetadata = new Miden.NoteMetadata(
      walletAccountId,
      Miden.NoteType.Public,
      Miden.NoteTag.fromAccountId(recipientAccountId),
      Miden.NoteExecutionHint.none(),
      undefined
    );

    console.log('custom transaction 8');

    let expectedNoteArgs = noteArgs.map((felt) => felt.asInt());
    let memAddress = '1000';
    let memAddress2 = '1004';
    let expectedNoteArg1 = expectedNoteArgs.slice(0, 4).join('.');
    let expectedNoteArg2 = expectedNoteArgs.slice(4, 8).join('.');
    console.log('custom transaction 9');
    let noteScript = `
        # Custom P2ID note script
        #
        # This note script asserts that the note args are exactly the same as passed
        # (currently defined as {expected_note_arg_1} and {expected_note_arg_2}).
        # Since the args are too big to fit in a single note arg, we provide them via advice inputs and
        # address them via their commitment (noted as NOTE_ARG)
        # This note script is based off of the P2ID note script because notes currently need to have
        # assets, otherwise it could have been boiled down to the assert.

        use.miden::native_account
        use.miden::active_note
        use.miden::contracts::wallets::basic->wallet
        use.std::mem

        begin
            # push data from the advice map into the advice stack
            adv.push_mapval
            # => [NOTE_ARG]

            # memory address where to write the data
            push.${memAddress}
            # => [target_mem_addr, NOTE_ARG_COMMITMENT]
            # number of words
            push.2
            # => [number_of_words, target_mem_addr, NOTE_ARG_COMMITMENT]
            exec.mem::pipe_preimage_to_memory
            # => [target_mem_addr']
            dropw
            # => []

            # read first word
            push.${memAddress}
            # => [data_mem_address]
            mem_loadw_be
            # => [NOTE_ARG_1]

            push.${expectedNoteArg1} assert_eqw.err="First note argument didn't match expected"
            # => []

            # read second word
            push.${memAddress2}
            # => [data_mem_address_2]
            mem_loadw_be
            # => [NOTE_ARG_2]

            push.${expectedNoteArg2} assert_eqw.err="Second note argument didn't match expected"
            # => []

            # store the note inputs to memory starting at address 0
            push.0 exec.active_note::get_inputs
            # => [num_inputs, inputs_ptr]

            # make sure the number of inputs is 2
            eq.2 assert.err="P2ID script expects exactly 2 note inputs"
            # => [inputs_ptr]

            # read the target account id from the note inputs
            mem_load
            # => [target_account_id_prefix]

            exec.native_account::get_id swap drop
            # => [account_id_prefix, target_account_id_prefix, ...]

            # ensure account_id = target_account_id, fails otherwise
            assert_eq.err="P2ID's target account address and transaction address do not match"
            # => [...]

            exec.active_note::add_assets_to_account
            # => [...]
        end
    `;

    let builder = client.createScriptBuilder();
    let compiledNoteScript = builder.compileNoteScript(noteScript);
    let noteInputs = new Miden.NoteInputs(
      new Miden.MidenArrays.FeltArray([
        recipientAccountId.prefix(),
        recipientAccountId.suffix(),
      ])
    );
    console.log('custom transaction 10');

    const serialNum = new Miden.Word(
      new BigUint64Array([BigInt(1), BigInt(2), BigInt(3), BigInt(4)])
    );
    let noteRecipient = new Miden.NoteRecipient(
      serialNum,
      compiledNoteScript,
      noteInputs
    );

    console.log('custom transaction 11');

    let note = new Miden.Note(noteAssets, noteMetadata, noteRecipient);

    console.log('custom transaction 12');

    // Creating First Custom Transaction Request to Mint the Custom Note
    let transactionRequest = new Miden.TransactionRequestBuilder()
      .withOwnOutputNotes(
        new Miden.MidenArrays.OutputNoteArray([Miden.OutputNote.full(note)])
      )
      .build();

    console.log('custom transaction 13');

    return new CustomTransaction(
      accountIdToBech32(walletAccountId),
      accountIdToBech32(recipientAccountId),
      transactionRequest,
      [],
      []
    );
  }

  const handleToAddressChange = (event: any) => {
    event.preventDefault();
    setToAddress(event.currentTarget.value);
  };

  const handleSubmit = async (event: any) => {
    console.log('handleSubmit called');
    event.preventDefault();
    console.log('handleSubmit called 2');
    if (!address) throw new WalletNotConnectedError();
    if (!Miden || !client) return;
    setIsLoading(true);

    setStatus('Creating custom transaction...');
    try {
      console.log('handleSubmit called 3');
      const tx = await createCustomTransaction();
      console.log('handleSubmit called 4');
      const txId = await requestTransaction!({
        type: TransactionType.Custom,
        payload: tx,
      });
      console.log('handleSubmit called 5');
      setIsLoading(false);
      setStatus(`Transaction ${txId} submitted`);
    } catch (error: any) {
      setIsLoading(false);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <NextSeo
        title="Miden Wallet Request Custom Transaction"
        description="Request Custom Transaction from the Miden Wallet"
      />
      <Base>
        <h2 className="text-2xl font-bold">Custom Transaction</h2>
        <p className="text-sm text-gray-500">
          Send custom transactions from your account
        </p>
        <form onSubmit={handleSubmit} className="mt-4">
          <label className="flex w-full flex-col items-start justify-between py-4">
            <p className="mb-2">To Address</p>
            <input
              className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 px-5 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              placeholder="e.g., mtst1apuf6ly9ssj4yyzvn6jq52vupv8qaxem_qruqqypuyph"
              autoComplete="off"
              onChange={(event: FormEvent<Element>) =>
                handleToAddressChange(event)
              }
              value={toAddress}
            />
          </label>
          <div className="mt-4 flex items-start justify-start">
            <Button
              disabled={!address || !toAddress || !Miden || !client}
              type="submit"
              color="primary"
              isLoading={isLoading}
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
              onClick={handleSubmit}
            >
              {!address ? 'Connect Your Wallet' : 'Submit Custom Transaction'}
            </Button>
          </div>
        </form>
        {status && (
          <div className="mt-5 inline-flex w-full items-center rounded-full bg-white dark:bg-light-dark xl:mt-6">
            <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full text-xs text-white sm:text-sm">
              {status}
            </div>
          </div>
        )}
      </Base>
    </>
  );
};

CustomTransactionPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default CustomTransactionPage;
