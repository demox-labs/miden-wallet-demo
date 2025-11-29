import { useState, FormEvent } from 'react';
import Button from '@/components/ui/button';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import type { AccountId } from '@demox-labs/miden-sdk';

interface NoteFormProps {
  faucetId: AccountId | null;
  assetSymbol: string | null;
  onStatusChange: (status: string) => void;
  onSubmitNote: (
    event: any,
    address: string,
    amount: number,
    sharePrivately: boolean
  ) => Promise<void>;
  isLoading: boolean;
  isDisabled: boolean;
}

export default function NoteForm({
  faucetId,
  assetSymbol,
  onStatusChange,
  onSubmitNote,
  isLoading,
  isDisabled,
}: NoteFormProps) {
  const { address } = useWallet();
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [amount, setAmount] = useState<number | undefined>(100);
  const [sharePrivately, setSharePrivately] = useState<boolean>(false);

  const handleAmountChange = (event: FormEvent<Element>) => {
    event.preventDefault();
    setAmount(Number((event.target as HTMLInputElement).value));
  };

  const handleAddressChange = (event: FormEvent<Element>) => {
    event.preventDefault();
    setRecipientAddress((event.target as HTMLInputElement).value);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    try {
      await onSubmitNote(event, recipientAddress, amount!, sharePrivately);
    } catch (error: any) {
      onStatusChange(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <h3 className="text-lg font-bold">Mint {assetSymbol} Note</h3>
      <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full sm:text-sm">
        {faucetId ? 'Faucet ID: ' + faucetId.toString() : 'Creating faucet...'}
      </div>
      <form
        className="relative flex w-full flex-col rounded-full md:w-auto"
        noValidate
        role="search"
        onSubmit={handleSubmit}
      >
        <label className="flex w-full flex-col items-start justify-between pt-4">
          <p className="mb-2">To Address</p>
          <input
            className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 px-5 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="e.g., mtst1apuf6ly9ssj4yyzvn6jq52vupv8qaxem_qruqqypuyph"
            autoComplete="off"
            onChange={handleAddressChange}
            value={recipientAddress}
          />
        </label>
        <label className="flex w-full flex-col items-start justify-between pt-4">
          <p className="mb-2">Amount</p>
          <input
            className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 px-5 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="e.g., 100"
            autoComplete="off"
            onChange={handleAmountChange}
            value={amount}
          />
        </label>
        <label className="flex items-start pt-4">
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
            disabled={isDisabled || !amount || !recipientAddress}
            name="public"
            type="submit"
            color="primary"
            className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            isLoading={isLoading}
          >
            {!address
              ? 'Connect Your Wallet'
              : `Mint ${sharePrivately ? 'Private' : 'Public'} Note`}
          </Button>
        </div>
      </form>
    </>
  );
}
