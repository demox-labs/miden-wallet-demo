import { useState, SyntheticEvent } from 'react';
import { NextSeo } from 'next-seo';

import {
  Asset,
  WalletNotConnectedError,
} from '@demox-labs/miden-wallet-adapter-base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';

import Base from '@/components/ui/base';
import Button from '@/components/ui/button';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { NextPageWithLayout } from '@/types';

const AssetsPage: NextPageWithLayout = () => {
  const { accountId, requestAssets } = useWallet();

  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (event?: SyntheticEvent) => {
    event?.preventDefault?.();
    try {
      setError(null);
      if (!accountId) throw new WalletNotConnectedError();

      setLoading(true);
      console.log('Requesting assets...');

      const assets = (await requestAssets!()) || [];
      setAssets(assets);
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
        title="Miden Wallet Get Assets"
        description="Request Assets from the Miden Wallet"
      />
      <Base>
        <div className="flex items-center justify-center">
          {!accountId ? (
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
              {loading ? 'Requesting…' : 'Request Assets'}
            </Button>
          )}
        </div>

        {/* Errors */}
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}

        {/* Assets list */}
        {assets.length > 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">Assets</h2>
            <ul className="space-y-2">
              {assets.map((asset, i) => (
                <li
                  key={i}
                  className="rounded-md border p-3 dark:border-gray-700"
                >
                  <div className="space-y-1">
                    <div>
                      <strong>Faucet ID:</strong> {asset.faucetId}
                    </div>
                    <div>
                      <strong>Amount:</strong> {asset.amount}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {submitted && assets.length === 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">
              No assets found on this account
            </h2>
          </div>
        )}
      </Base>
    </>
  );
};

AssetsPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default AssetsPage;
