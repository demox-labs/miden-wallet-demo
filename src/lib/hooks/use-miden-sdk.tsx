import {
  createContext,
  FC,
  useCallback,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';

import * as MidenSdk from '@demox-labs/miden-sdk/dist/index';

export interface MidenSdkContextState {
  isLoading: boolean;
  Miden: typeof MidenSdk;
  createClient: () => Promise<MidenSdk.WebClient>;
  createFaucet: (
    client: MidenSdk.WebClient,
    storageMode: MidenSdk.AccountStorageMode,
    nonFungible: boolean,
    assetSymbol: string,
    decimals: number,
    totalSupply: bigint
  ) => Promise<MidenSdk.AccountId>;
}

const defaultContext: {
  isLoading: boolean;
  Miden: any;
} = {
  isLoading: true,
  Miden: null,
};

export const MidenSdkContext = createContext<MidenSdkContextState>(
  defaultContext as MidenSdkContextState
);

export const useMidenSdk = (): MidenSdkContextState => {
  return useContext(MidenSdkContext);
};

export interface MidenSdkProviderProps {
  children: React.ReactNode;
}

export const MidenSdkProvider: FC<MidenSdkProviderProps> = ({ children }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [Miden, setMiden] = useState<any>(null);

  const loadSdk = useCallback(async () => {
    if (!isLoading && Miden !== null) return;
    const sdk: typeof import('@demox-labs/miden-sdk/dist/index') = await import(
      '@demox-labs/miden-sdk'
    );
    setIsLoading(false);
    setMiden(sdk);
  }, [isLoading, Miden, setIsLoading, setMiden]);

  const createClient = useCallback(async () => {
    if (!Miden) return null;
    return await Miden.WebClient.createClient('https://rpc.testnet.miden.io');
  }, [Miden]);

  const createFaucet = useCallback(
    async (
      client: MidenSdk.WebClient,
      storageMode: MidenSdk.AccountStorageMode,
      nonFungible: boolean,
      assetSymbol: string,
      decimals: number,
      totalSupply: bigint
    ): Promise<MidenSdk.AccountId> => {
      if (!Miden || !client)
        throw new Error('Miden SDK or client not initialized');

      try {
        // First sync the client state to ensure we're up to date
        await client.syncState();

        // Create the faucet with provided configuration
        const faucet = await client.newFaucet(
          storageMode,
          nonFungible,
          assetSymbol,
          decimals,
          totalSupply
        );

        // Get the faucet ID before any other operations
        const newFaucetId = faucet.id();

        // Add a delay to ensure proper initialization
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Sync state again after faucet creation
        await client.syncState();

        return newFaucetId;
      } catch (error) {
        console.error('Error creating faucet:', error);
        throw error;
      }
    },
    [Miden]
  );

  useEffect(() => {
    loadSdk();
  }, [loadSdk]);

  return (
    <MidenSdkContext.Provider
      value={{ isLoading, Miden, createClient, createFaucet }}
    >
      {children}
    </MidenSdkContext.Provider>
  );
};
