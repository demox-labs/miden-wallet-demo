import { useState } from 'react';
import { NextSeo } from 'next-seo';

import type { AccountId, WebClient } from '@demox-labs/miden-sdk';
import {
  ConsumeTransaction,
  WalletNotConnectedError,
} from '@demox-labs/miden-wallet-adapter-base';
import { MidenWalletAdapter } from '@demox-labs/miden-wallet-adapter-miden';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';

import FaucetConfigForm from '@/components/forms/faucet-config-form';
import NoteForm from '@/components/forms/note-form';
import Base from '@/components/ui/base';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { useMidenSdk } from '@/lib/hooks/use-miden-sdk';
import type { NextPageWithLayout } from '@/types';

interface FaucetConfig {
  storageMode: 'public' | 'private';
  nonFungible: boolean;
  assetSymbol: string;
  decimals: number;
  totalSupply: bigint;
}

const FaucetPage: NextPageWithLayout = () => {
  const { accountId, wallet } = useWallet();
  const { Miden, createClient, createFaucet } = useMidenSdk();
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [client, setClient] = useState<WebClient | null>(null);
  const [faucetId, setFaucetId] = useState<AccountId | null>(null);
  const [status, setStatus] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateFaucet = async (faucetConfig: FaucetConfig) => {
    if (!accountId) throw new WalletNotConnectedError();
    if (!Miden) return;
    setIsLoading(true);

    try {
      setStatus('Creating new client...');
      const newClient = await createClient();
      if (!newClient) throw new Error('Failed to create client');

      setStatus('Creating faucet...');
      const newFaucetId = await createFaucet(
        newClient,
        faucetConfig.storageMode === 'public'
          ? Miden.AccountStorageMode.public()
          : Miden.AccountStorageMode.private(),
        faucetConfig.nonFungible,
        faucetConfig.assetSymbol,
        faucetConfig.decimals,
        faucetConfig.totalSupply
      );
      setClient(newClient);
      setFaucetId(newFaucetId);
      setShowNoteForm(true);
      setStatus('');
    } catch (error: any) {
      setStatus(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitNote = async (
    event: any,
    address: string,
    amount: number,
    sharePrivately: boolean
  ) => {
    if (!accountId) throw new WalletNotConnectedError();
    if (!Miden || !client || !faucetId) return;
    setIsLoading(true);

    try {
      await client.syncState();

      const midenAccountId = Miden.AccountId.fromHex(accountId);
      const noteType = sharePrivately
        ? Miden.NoteType.Private
        : Miden.NoteType.Public;
      const noteTypeString = sharePrivately ? 'private' : 'public';

      setStatus('Minting note...');
      const mintTxnReq = await client.newMintTransactionRequest(
        midenAccountId,
        faucetId,
        noteType,
        BigInt(amount)
      );
      const mintTxn = await client.newTransaction(faucetId, mintTxnReq);
      await client.submitTransaction(mintTxn);

      const noteId = mintTxn.createdNotes().notes()[0].id();
      const noteIdString = noteId.toString();

      if (address === accountId) {
        try {
          let transaction: ConsumeTransaction;
          if (sharePrivately) {
            const buffer = await client.exportNoteFile(noteIdString, 'Partial');
            const noteBytes = new Uint8Array(buffer);
            transaction = new ConsumeTransaction(
              faucetId.toString(),
              noteIdString,
              noteTypeString,
              amount!,
              noteBytes
            );
          } else {
            transaction = new ConsumeTransaction(
              faucetId.toString(),
              noteIdString,
              noteTypeString,
              amount!
            );
          }

          setStatus('Submitting consume transaction request...');
          const txId =
            (await (wallet?.adapter as MidenWalletAdapter).requestConsume(
              transaction
            )) || '';
          setStatus(`Transaction ID: ${txId}`);
          if (event.target?.elements[0]?.value) {
            event.target.elements[0].value = '';
          }
        } catch (error: any) {
          throw new Error(`Failed to consume note: ${error}`);
        }
      } else if (sharePrivately) {
        try {
          setStatus('Downloading note...');
          const noteBytes = await client.exportNoteFile(
            noteIdString,
            'Partial'
          );
          const blob = new Blob([noteBytes], {
            type: 'application/octet-stream',
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `midenNote${noteIdString.slice(0, 6)}.mno`;

          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);

          setStatus('Note downloaded successfully');
        } catch (error: any) {
          throw new Error(`Failed to download note: ${error}`);
        }
      }
    } catch (error: any) {
      console.error('Error in handleSubmitNote:', error);
      setStatus(`Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NextSeo
        title="Miden Wallet Request Mint"
        description="Request Mint from the Miden Wallet"
      />
      <Base>
        {!showNoteForm ? (
          <FaucetConfigForm
            onCreateFaucet={handleCreateFaucet}
            onStatusChange={setStatus}
            isLoading={isLoading}
            isDisabled={!Miden}
          />
        ) : (
          <NoteForm
            faucetId={faucetId}
            onStatusChange={setStatus}
            onSubmitNote={handleSubmitNote}
            isLoading={isLoading}
            isDisabled={!accountId || !Miden || !client || !faucetId}
          />
        )}
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

FaucetPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default FaucetPage;
