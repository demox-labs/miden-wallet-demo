import { FormEvent, useCallback, useEffect, useState } from 'react';
import { NextSeo } from 'next-seo';

import type {
  AccountId,
  TransactionScript,
  WebClient,
} from '@demox-labs/miden-sdk';
import {
  CustomTransaction,
  TransactionType,
  WalletNotConnectedError,
} from '@demox-labs/miden-wallet-adapter-base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';

import Base from '@/components/ui/base';
import Button from '@/components/ui/button';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { useMidenSdk } from '@/lib/hooks/use-miden-sdk';
import { FaucetMetadata, NextPageWithLayout } from '@/types';

const TestPage: NextPageWithLayout = () => {
  const { accountId, requestTransaction } = useWallet();
  const { Miden, createClient } = useMidenSdk();

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string | undefined>();
  const [faucetState, setFaucetState] = useState<FaucetMetadata | undefined>();
  let [client, setClient] = useState<WebClient | null>(null);

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

  function bech32ToAccountId(bech32str: string) {
    return Miden.Address.fromBech32(bech32str).accountId();
  }

  function accountIdToBech32(accountId: AccountId) {
    return Miden.Address.fromAccountId(accountId, 'Unspecified').toBech32(
      Miden.NetworkId.Testnet
    );
  }

  function getTransactionScript(script: string): TransactionScript {
    let assembler = Miden.TransactionKernel.assembler();

    const transactionScript = assembler.compileTransactionScript(script);

    return transactionScript;
  }

  async function createCustomTransaction(): Promise<CustomTransaction> {
    if (!accountId || !faucetState || !client)
      throw new WalletNotConnectedError();

    const disperseScript = `use.miden::tx
    use.miden::contracts::wallets::basic
    
    begin
      push.13343494213668738079.18219008855015346022.541966559252317604.4048106520815729434
      push.0
      push.2
      push.0
      push.4177657856
      call.tx::create_note
    
      push.1000000.0.5612536876145777184.7471207677728535552
      call.basic::move_asset_to_note dropw
      dropw dropw dropw drop
    
    end`;

    const transactionScript = getTransactionScript(disperseScript);

    const transactionRequest = new Miden.TransactionRequestBuilder()
      .withCustomScript(transactionScript)
      .build();

    const transaction = new CustomTransaction(
      accountId,
      accountId,
      transactionRequest
    );

    // const txClass = new Transaction(
    //     TransactionType.Custom,
    //     transaction,
    // );

    // await requestTransaction(txClass)

    return transaction;
  }

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!accountId) throw new WalletNotConnectedError();
    if (!Miden || !client) return;
    setIsLoading(true);

    setStatus('Creating custom transaction...');
    try {
      const tx = await createCustomTransaction();
      const txId = await requestTransaction!({
        type: TransactionType.Custom,
        payload: tx,
      });
      setIsLoading(false);
      setStatus(`Transaction ${txId} submitted`);
    } catch (error: any) {
      setIsLoading(false);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <>
      <NextSeo title="Miden Wallet Test" description="Test the Miden Wallet" />
      <Base>
        <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full text-xs text-white sm:text-sm">
          {`Test`}
        </div>
        <form onSubmit={handleSubmit}>
          <Button
            disabled={!accountId || !Miden || !client}
            type="submit"
            color="white"
            isLoading={isLoading}
            className="ml-4 shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            onClick={handleSubmit}
          >
            Test
          </Button>
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

TestPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default TestPage;
