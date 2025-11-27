import { NextSeo } from 'next-seo';
import { SyntheticEvent, useState } from 'react';

import {
  InputNoteDetails,
  WalletNotConnectedError,
} from '@demox-labs/miden-wallet-adapter-base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';

import Base from '@/components/ui/base';
import Button from '@/components/ui/button';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import type { NextPageWithLayout } from '@/types';

const ConsumableNotesPage: NextPageWithLayout = () => {
  const { address, requestConsumableNotes } = useWallet();

  const [loading, setLoading] = useState(false);
  const [notes, setNotes] = useState<InputNoteDetails[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event?: SyntheticEvent) => {
    event?.preventDefault?.();
    try {
      setError(null);
      if (!address) throw new WalletNotConnectedError();

      setLoading(true);
      console.log('Requesting consumable notes...');

      const notes = (await requestConsumableNotes!()) || [];
      setNotes(notes);
      setSubmitted(true);
    } catch (error: any) {
      console.error(error);
      setError(error?.message ?? String(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NextSeo
        title="Miden Wallet Get Consumable Notes"
        description="Request Consumable Notes from the Miden Wallet"
      />
      <Base>
        <div className="flex items-center justify-center">
          {!address ? (
            <Button
              color="primary"
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              Connect Your Wallet
            </Button>
          ) : (
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
            >
              {loading ? 'Requesting…' : 'Request Consumable Notes'}
            </Button>
          )}
        </div>

        {error && <p className="mt-4 text-center text-red-600">{error}</p>}

        {submitted && notes.length === 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">
              No consumable notes found on this account
            </h2>
          </div>
        )}

        {notes.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">Consumable Notes</h2>
            <ul className="space-y-2">
              {notes.map((note, i) => (
                <li
                  key={i}
                  className="rounded-md border p-3 dark:border-gray-700"
                >
                  {typeof note === 'string' && note}
                  {typeof note === 'object' && (
                    <>
                      <pre>{JSON.stringify(note, null, 2)}</pre>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Base>
    </>
  );
};

ConsumableNotesPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default ConsumableNotesPage;
