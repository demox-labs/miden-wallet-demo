import { useState, FormEvent, SyntheticEvent } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Base from '@/components/ui/base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { MidenWalletAdapter } from '@demox-labs/miden-wallet-adapter-miden';
import {
  SendTransaction,
  WalletNotConnectedError,
} from '@demox-labs/miden-wallet-adapter-base';
import Button from '@/components/ui/button';
import { MIDEN_METADATA } from '@/types';

const SendPage: NextPageWithLayout = () => {
  const { wallet, address } = useWallet();

  let [toAddress, setToAddress] = useState('');
  let [amount, setAmount] = useState<number | undefined>(undefined);
  let [faucetId, setFaucetId] = useState<string>('');
  let [sharePrivately, setSharePrivately] = useState<boolean>(false);
  let [recallBlocks, setRecallBlocks] = useState<number | undefined>();

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!address) throw new WalletNotConnectedError();

    const midenTransaction = new SendTransaction(
      address,
      toAddress,
      faucetId,
      sharePrivately ? 'private' : 'public',
      amount! * 10 ** MIDEN_METADATA.decimals
    );

    const txId =
      (await (wallet?.adapter as MidenWalletAdapter).requestSend(
        midenTransaction
      )) || '';
    if (event.target?.elements[0]?.value) {
      event.target.elements[0].value = '';
    }
  };

  const handleToAddressChange = (event: any) => {
    event.preventDefault();
    setToAddress(event.currentTarget.value);
  };
  const handleFaucetIdChange = (event: any) => {
    event.preventDefault();
    setFaucetId(event.currentTarget.value);
  };
  const handleAmountChange = (event: any) => {
    event.preventDefault();
    setAmount(event.currentTarget.value);
  };
  const handleRecallBlocksChange = (event: any) => {
    event.preventDefault();
    setRecallBlocks(event.currentTarget.value);
  };

  return (
    <>
      <NextSeo
        title="Miden Wallet Request Send"
        description="Request Send from the Miden Wallet"
      />
      <Base>
        <h2 className="text-2xl font-bold">Send</h2>
        <p className="text-sm text-gray-500">
          Transfer MIDEN to another account
        </p>
        <form
          className="relative flex w-full flex-col rounded-full pt-4 md:w-auto"
          noValidate
          role="search"
          onSubmit={async (event: SyntheticEvent<HTMLFormElement>) => {
            await handleSubmit(event);
          }}
        >
          <label className="flex w-full flex-col items-start justify-between py-2">
            <p className="mb-2 text-sm">To Address</p>
            <input
              className="h-11 w-full appearance-none rounded-lg border-2 border-gray-300 bg-transparent py-1 px-5 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-700 focus:border-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              placeholder="e.g., mtst1apuf6ly9ssj4yyzvn6jq52vupv8qaxem_qruqqypuyph"
              autoComplete="off"
              onChange={(event: FormEvent<Element>) =>
                handleToAddressChange(event)
              }
              value={toAddress}
            />
          </label>
          <label className="flex w-full flex-col items-start justify-between py-2">
            <p className="mb-2 text-sm">Faucet ID</p>
            <input
              className="h-11 w-full appearance-none rounded-lg border-2 border-gray-300 bg-transparent py-1 px-5 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-700 focus:border-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              placeholder="e.g., mtst1ap2t7nsjausqsgrswk9syfzkcu328yna"
              autoComplete="off"
              onChange={(event: FormEvent<Element>) =>
                handleFaucetIdChange(event)
              }
              value={faucetId}
            />
          </label>
          <label className="flex w-full flex-col items-start justify-between py-2">
            <p className="mb-2 text-sm">Amount</p>
            <input
              className="h-11 w-full appearance-none rounded-lg border-2 border-gray-300 bg-transparent py-1 px-5 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-700 focus:border-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              placeholder="e.g., 101"
              autoComplete="off"
              onChange={(event: FormEvent<Element>) =>
                handleAmountChange(event)
              }
              value={amount}
            />
          </label>
          <label className="flex w-full flex-col items-start justify-between py-2">
            <p className="mb-2 text-sm">Recall Blocks</p>
            <input
              className="h-11 w-full appearance-none rounded-lg border-2 border-gray-300 bg-transparent py-1 px-5 tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-700 focus:border-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
              placeholder="e.g., 10"
              autoComplete="off"
              onChange={(event: FormEvent<Element>) =>
                handleRecallBlocksChange(event)
              }
              value={recallBlocks}
            />
            <p className="mt-2 text-xs text-gray-500">{`Blocks before note will be recalled`}</p>
          </label>
          <label className="flex items-start py-2">
            <input
              type="checkbox"
              className="h-5 w-5 rounded text-gray-700 transition duration-150 ease-in-out"
              onChange={() => setSharePrivately(!sharePrivately)}
              checked={sharePrivately}
            />
            <p className="ml-2 text-sm">Share Privately</p>
          </label>
          <div className="mt-4 flex items-start justify-start">
            <Button
              disabled={!address || !toAddress || !amount || !faucetId}
              type="submit"
              color="primary"
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              {!address ? 'Connect Your Wallet' : 'Submit'}
            </Button>
          </div>
        </form>
      </Base>
    </>
  );
};

SendPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SendPage;
