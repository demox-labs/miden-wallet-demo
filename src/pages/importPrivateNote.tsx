import { useCallback, useEffect, useState } from 'react';
import { NextSeo } from 'next-seo';

import type { WebClient } from '@demox-labs/miden-sdk';
import { WalletNotConnectedError } from '@demox-labs/miden-wallet-adapter-base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';

import Base from '@/components/ui/base';
import Button from '@/components/ui/button';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { useMidenSdk } from '@/lib/hooks/use-miden-sdk';
import { NextPageWithLayout } from '@/types';

const ImportPrivateNotePage: NextPageWithLayout = () => {
  const { address, importPrivateNote } = useWallet();
  const { Miden, createClient } = useMidenSdk();

  let [client, setClient] = useState<WebClient | null>(null);
  const [status, setStatus] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

  const [noteData, setNoteData] = useState<Uint8Array | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

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

  const handleFileChange = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = async (e: ProgressEvent<FileReader>) => {
      try {
        if (e.target?.result instanceof ArrayBuffer) {
          const noteBytesAsUint8Array = new Uint8Array(e.target.result);
          setNoteData(noteBytesAsUint8Array);
          setFileName(file.name);
        }
      } catch (error) {
        console.error('Error during note import:', error);
      }
    };
    reader.readAsArrayBuffer(file);
  }, []);

  const onUploadFile = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFileChange(file);
      }
    },
    [handleFileChange]
  );

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!address) throw new WalletNotConnectedError();
    if (!Miden || !client || !noteData) return;

    setIsLoading(true);
    setStatus('Importing private note...');

    try {
      const noteId = await importPrivateNote!(noteData);
      setStatus(`Note imported successfully: ${noteId}`);
    } catch (error) {
      console.error('Error during note import:', error);
      setStatus('Error importing note');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NextSeo
        title="Miden Wallet Import Private Note"
        description="Import a private note into your account on Miden Wallet"
      />
      <Base>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col items-center justify-center space-y-4"
        >
          <div className="flex items-center space-x-4">
            <label
              htmlFor="file-upload"
              className="flex cursor-pointer items-center justify-center rounded-full bg-brand text-white shadow-card transition-all hover:-translate-y-0.5 hover:shadow-large md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              <span>Upload File</span>
              <input
                id="file-upload"
                type="file"
                className="hidden"
                onChange={onUploadFile}
              />
            </label>
            <span>{fileName || 'No file selected'}</span>
          </div>
          {!address ? (
            <Button
              disabled
              color="primary"
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              Connect Your Wallet
            </Button>
          ) : (
            <Button
              disabled={!address || !noteData || !Miden || !client}
              type="submit"
              color="primary"
              isLoading={isLoading}
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
              onClick={handleSubmit}
            >
              {isLoading ? 'Importing...' : 'Import Private Note'}
            </Button>
          )}
        </form>
        {status && (
          <div className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white shadow-card dark:bg-light-dark xl:mt-6">
            <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full text-xs text-gray-900 sm:text-sm">
              {status}
            </div>
          </div>
        )}
      </Base>
    </>
  );
};

ImportPrivateNotePage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ImportPrivateNotePage;
