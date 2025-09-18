import { useState, SyntheticEvent } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Base from '@/components/ui/base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { WalletNotConnectedError } from '@demox-labs/miden-wallet-adapter-base';
import Button from '@/components/ui/button';

const PrivateNotesPage: NextPageWithLayout = () => {
  const { accountId, requestPrivateNotes } = useWallet();

  const [notes, setNotes] = useState<any[]>([]); // TODO: Define type for notes
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event?: SyntheticEvent) => {
    event?.preventDefault?.();
    try {
      setError(null);
      if (!accountId) throw new WalletNotConnectedError();

      setLoading(true);
      console.log('Requesting private notes...');

      const resp = (await requestPrivateNotes!()) || [];

      console.log('Private Notes Response:', resp);
      setNotes(resp);
      setSubmitted(true);
    } catch (e: any) {
      setError(e?.message ?? String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NextSeo
        title="Miden Wallet Get Private Notes"
        description="Request Private Notes from the Miden Wallet"
      />
      <Base>
        <div className="flex items-center justify-center">
          {!accountId ? (
            <Button
              color="white"
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
              {loading ? 'Requesting…' : 'Request Private Notes'}
            </Button>
          )}
        </div>

        {/* Errors */}
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}

        {submitted && notes.length === 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">
              No private notes on this account
            </h2>
          </div>
        )}

        {notes.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">Private Notes</h2>
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

PrivateNotesPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default PrivateNotesPage;
