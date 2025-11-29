import { useState } from 'react';
import Button from '@/components/ui/button';

interface FaucetConfig {
  storageMode: 'public' | 'private';
  nonFungible: boolean;
  assetSymbol: string;
  decimals?: number;
  totalSupply?: bigint;
}

interface FaucetConfigFormProps {
  onCreateFaucet: (config: FaucetConfig) => Promise<void>;
  onStatusChange: (status: string) => void;
  isLoading: boolean;
  isDisabled: boolean;
}

export default function FaucetConfigForm({
  onCreateFaucet,
  onStatusChange,
  isLoading,
  isDisabled,
}: FaucetConfigFormProps) {
  const [faucetConfig, setFaucetConfig] = useState<FaucetConfig>({
    storageMode: 'public',
    nonFungible: false,
    assetSymbol: '',
  });

  const handleFaucetConfigChange = (field: keyof FaucetConfig, value: any) => {
    setFaucetConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    try {
      await onCreateFaucet(faucetConfig);
    } catch (error: any) {
      onStatusChange(`Error: ${error.message}`);
    }
  };

  return (
    <form
      className="relative flex w-full flex-col rounded-full md:w-auto"
      noValidate
      role="search"
      onSubmit={handleSubmit}
    >
      <h3 className="mb-4 text-lg font-bold">Configure Faucet Properties</h3>
      <div className="space-y-4">
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
          Storage Mode
          <select
            value={faucetConfig.storageMode}
            onChange={(e) =>
              setFaucetConfig({
                ...faucetConfig,
                storageMode: e.target.value as 'public' | 'private',
              })
            }
            className="h-11 w-full appearance-none rounded-lg border-2 border-gray-300 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-700 focus:border-gray-900 ltr:pr-5 ltr:pl-4 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
          Asset Symbol
          <input
            type="text"
            className="h-11 w-full appearance-none rounded-lg border-2 border-gray-300 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-700 focus:border-gray-900 ltr:pr-5 ltr:pl-4 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="e.g. TEST"
            value={faucetConfig.assetSymbol}
            onChange={(e) =>
              handleFaucetConfigChange('assetSymbol', e.target.value)
            }
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
          Number of Decimals
          <input
            type="text"
            className="h-11 w-full appearance-none rounded-lg border-2 border-gray-300 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-700 focus:border-gray-900 ltr:pr-5 ltr:pl-4 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="e.g., 10"
            value={faucetConfig.decimals}
            onChange={(e) =>
              handleFaucetConfigChange('decimals', parseInt(e.target.value))
            }
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
          Total Supply
          <input
            type="text"
            value={
              faucetConfig.totalSupply ? Number(faucetConfig.totalSupply) : ''
            }
            onChange={(e) =>
              setFaucetConfig({
                ...faucetConfig,
                totalSupply: BigInt(e.target.value),
              })
            }
            className="h-11 w-full appearance-none rounded-lg border-2 border-gray-300 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-700 focus:border-gray-900 ltr:pr-5 ltr:pl-4 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
            placeholder="e.g., 1000000"
          />
        </label>
      </div>
      <div className="mt-4 flex items-start justify-start">
        <Button
          disabled={isDisabled}
          type="submit"
          color="primary"
          className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
          isLoading={isLoading}
        >
          {isDisabled ? 'Connect Your Wallet' : 'Create Faucet'}
        </Button>
      </div>
    </form>
  );
}
