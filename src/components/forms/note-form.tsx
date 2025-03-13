import { useState, FormEvent } from 'react';
import Button from '@/components/ui/button';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { Check } from '@/components/icons/check';

interface NoteFormProps {
  client: any;
  faucetId: any;
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
  client,
  faucetId,
  onStatusChange,
  onSubmitNote,
  isLoading,
  isDisabled,
}: NoteFormProps) {
  const { publicKey } = useWallet();
  const [address, setAddress] = useState<string>('');
  const [amount, setAmount] = useState<number | undefined>(100);
  const [sharePrivately, setSharePrivately] = useState<boolean>(false);

  const handleAmountChange = (event: FormEvent<Element>) => {
    event.preventDefault();
    setAmount(Number((event.target as HTMLInputElement).value));
  };

  const handleAddressChange = (event: FormEvent<Element>) => {
    event.preventDefault();
    setAddress((event.target as HTMLInputElement).value);
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    try {
      await onSubmitNote(event, address, amount!, sharePrivately);
    } catch (error: any) {
      onStatusChange(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full text-xs text-white sm:text-sm">
        {faucetId ? 'Faucet ID: ' + faucetId.toString() : 'Creating faucet...'}
      </div>
      <form
        className="relative flex w-full flex-col rounded-full md:w-auto"
        noValidate
        role="search"
        onSubmit={handleSubmit}
      >
        <label className="flex w-full items-center py-4">
          <input
            className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="To address (e.g., 0x0b8a174d47e79b1000088ad423474e)"
            autoComplete="off"
            onChange={handleAddressChange}
            value={address}
          />
          <span className="pointer-events-none absolute flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
            <Check className="h-4 w-4" />
          </span>
        </label>
        <label className="flex w-full items-center py-4 text-sm font-medium text-white">
          <input
            className="h-11 w-full appearance-none rounded-lg border-2 border-gray-200 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="Amount: ie, 100"
            autoComplete="off"
            onChange={handleAmountChange}
            value={amount}
          />
          <span className="pointer-events-none absolute flex h-full w-8 cursor-pointer items-center justify-center text-gray-600 hover:text-gray-900 ltr:left-0 ltr:pl-2 rtl:right-0 rtl:pr-2 dark:text-gray-500 sm:ltr:pl-3 sm:rtl:pr-3">
            <Check className="h-4 w-4" />
          </span>
          <Button
            disabled={isDisabled || !amount || !address}
            name="public"
            type="submit"
            color="white"
            className="ml-4 shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            isLoading={isLoading}
          >
            {!publicKey
              ? 'Connect Your Wallet'
              : `Mint ${sharePrivately ? 'Private' : 'Public'} Note`}
          </Button>
        </label>
        <label className="flex items-center text-sm font-medium text-white">
          <span className="mr-2">Share Privately</span>
          <input
            type="checkbox"
            className="h-4 w-4 rounded border-none text-gray-700 transition duration-150 ease-in-out"
            onChange={() => setSharePrivately(!sharePrivately)}
            checked={sharePrivately}
          />
        </label>
      </form>
    </>
  );
}
