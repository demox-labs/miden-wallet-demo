import { useCallback, useEffect, useState } from 'react';
import { NextSeo } from 'next-seo';

import {
  SignKind,
  WalletNotConnectedError,
} from '@demox-labs/miden-wallet-adapter-base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';

import Base from '@/components/ui/base';
import Button from '@/components/ui/button';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { useMidenSdk } from '@/lib/hooks/use-miden-sdk';
import { NextPageWithLayout } from '@/types';

/** Helper: bytes -> hex string */
function bytesToHex(u8: Uint8Array): string {
  let s = '';
  for (let i = 0; i < u8.length; i++) {
    const h = u8[i].toString(16).padStart(2, '0');
    s += h;
  }
  return s;
}

const SignDataPage: NextPageWithLayout = () => {
  const { address, signBytes } = useWallet();
  const { Miden, createClient } = useMidenSdk();

  let [client, setClient] = useState<any>(null);
  const [status, setStatus] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!address) throw new WalletNotConnectedError();
    if (!Miden || !client) return;

    setIsLoading(true);
    setStatus('Signing Data...');

    try {
      const transactionSummaryBytes = new Uint8Array([
        230, 95, 239, 218, 246, 133, 89, 160, 6, 98, 120, 124, 236, 253, 39, 0,
        3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 232, 3, 0, 0, 0, 0, 0, 0, 1, 115, 64, 31, 180, 195, 14, 197, 79,
        225, 169, 180, 22, 236, 42, 92, 91, 226, 38, 36, 234, 181, 169, 144,
        143, 244, 240, 197, 194, 231, 33, 133, 163, 2, 128, 150, 152, 0, 0, 0,
        0, 0, 8, 0, 0, 0, 0, 0, 0, 0, 151, 206, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 1, 1, 1, 1, 77, 65, 83, 84, 0, 0, 0, 0, 15, 1, 7, 4, 0, 0,
        0, 5, 0, 0, 0, 6, 0, 0, 0, 13, 11, 41, 41, 41, 41, 48, 0, 0, 0, 0, 0, 0,
        0, 48, 178, 98, 32, 6, 170, 240, 39, 101, 1, 149, 172, 33, 225, 161,
        187, 112, 137, 125, 93, 161, 61, 139, 16, 2, 244, 185, 16, 245, 1, 15,
        122, 121, 0, 0, 0, 0, 0, 0, 0, 128, 173, 221, 56, 163, 223, 140, 190,
        122, 168, 234, 225, 178, 180, 214, 63, 24, 79, 180, 144, 160, 27, 78,
        36, 203, 37, 193, 116, 175, 186, 192, 8, 17, 1, 0, 0, 0, 0, 0, 0, 0, 4,
        143, 164, 85, 239, 74, 96, 86, 245, 66, 1, 1, 237, 167, 56, 65, 103,
        222, 140, 75, 185, 83, 165, 150, 71, 39, 123, 9, 4, 237, 37, 12, 0, 0,
        0, 0, 0, 0, 0, 128, 111, 182, 161, 240, 104, 9, 31, 34, 161, 4, 176,
        193, 144, 74, 110, 217, 207, 241, 203, 255, 133, 94, 32, 28, 206, 129,
        228, 214, 122, 34, 145, 18, 3, 0, 0, 128, 0, 0, 0, 0, 151, 39, 28, 67,
        127, 151, 21, 179, 127, 224, 34, 222, 2, 131, 160, 147, 163, 248, 159,
        93, 188, 145, 137, 112, 201, 60, 90, 179, 152, 184, 99, 211, 0, 0, 0, 0,
        0, 0, 0, 128, 152, 133, 106, 98, 51, 225, 197, 62, 105, 200, 170, 212,
        66, 48, 225, 19, 128, 129, 92, 149, 65, 19, 133, 205, 209, 166, 201,
        100, 233, 38, 220, 110, 0, 0, 0, 0, 0, 0, 0, 128, 60, 242, 250, 15, 236,
        53, 196, 99, 238, 40, 184, 15, 113, 156, 128, 150, 53, 130, 72, 10, 113,
        213, 236, 60, 156, 70, 27, 180, 24, 202, 152, 139, 1, 1, 1, 1, 1, 3, 1,
        1, 1, 1, 2, 151, 39, 28, 67, 127, 151, 21, 179, 127, 224, 34, 222, 2,
        131, 160, 147, 163, 248, 159, 93, 188, 145, 137, 112, 201, 60, 90, 179,
        152, 184, 99, 211, 1, 1, 60, 242, 250, 15, 236, 53, 196, 99, 238, 40,
        184, 15, 113, 156, 128, 150, 53, 130, 72, 10, 113, 213, 236, 60, 156,
        70, 27, 180, 24, 202, 152, 139, 2, 1, 152, 133, 106, 98, 51, 225, 197,
        62, 105, 200, 170, 212, 66, 48, 225, 19, 128, 129, 92, 149, 65, 19, 133,
        205, 209, 166, 201, 100, 233, 38, 220, 110, 2, 1, 1, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 1, 0, 0, 160, 89, 133, 246, 218, 239, 95, 230, 65, 39, 253,
        236, 124, 120, 98, 6, 0, 0, 82, 215, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        1, 230, 95, 239, 218, 246, 133, 89, 160, 6, 98, 120, 124, 236, 253, 39,
        232, 3, 0, 0, 0, 0, 0, 0, 77, 65, 83, 84, 0, 0, 0, 0, 27, 1, 3, 12, 0,
        0, 0, 119, 19, 91, 0, 0, 0, 128, 0, 0, 0, 0, 91, 254, 255, 255, 255, 0,
        0, 0, 0, 45, 41, 48, 48, 48, 48, 48, 13, 91, 2, 0, 0, 0, 0, 0, 0, 0, 33,
        32, 249, 145, 51, 97, 221, 67, 50, 167, 44, 41, 41, 3, 32, 57, 224, 97,
        252, 48, 86, 206, 232, 0, 0, 0, 0, 0, 0, 0, 128, 49, 168, 166, 194, 99,
        56, 150, 120, 142, 71, 203, 112, 103, 40, 216, 176, 85, 209, 85, 56,
        173, 11, 109, 209, 216, 28, 34, 147, 203, 120, 1, 237, 0, 0, 0, 0, 0, 0,
        0, 48, 152, 45, 133, 236, 62, 234, 172, 144, 42, 147, 14, 215, 140, 153,
        180, 122, 4, 143, 240, 20, 118, 191, 143, 144, 240, 251, 136, 113, 64,
        61, 5, 208, 0, 0, 0, 0, 0, 0, 0, 128, 57, 254, 212, 21, 162, 235, 95,
        192, 2, 250, 30, 115, 227, 62, 22, 177, 5, 219, 132, 12, 207, 227, 71,
        238, 90, 57, 114, 242, 243, 0, 100, 186, 26, 0, 0, 0, 0, 0, 0, 48, 216,
        44, 132, 80, 216, 32, 108, 113, 116, 143, 64, 56, 172, 5, 165, 204, 225,
        94, 100, 41, 6, 150, 88, 131, 223, 8, 161, 31, 208, 155, 114, 167, 0, 0,
        0, 0, 0, 0, 0, 128, 111, 156, 207, 242, 132, 17, 174, 255, 78, 33, 9,
        131, 40, 223, 60, 66, 113, 220, 136, 82, 113, 173, 10, 66, 221, 91, 0,
        207, 81, 45, 68, 220, 0, 0, 0, 0, 0, 0, 0, 128, 34, 247, 27, 160, 10,
        218, 99, 123, 0, 89, 13, 45, 218, 85, 121, 143, 233, 149, 118, 147, 67,
        131, 90, 108, 6, 80, 46, 242, 63, 245, 165, 2, 49, 0, 0, 0, 0, 0, 0, 48,
        24, 88, 236, 46, 106, 189, 241, 209, 68, 116, 116, 229, 171, 142, 19,
        19, 196, 249, 50, 118, 232, 47, 59, 170, 201, 160, 86, 214, 236, 220,
        12, 155, 0, 0, 0, 64, 0, 0, 0, 0, 48, 174, 157, 254, 13, 51, 182, 14,
        103, 9, 103, 69, 232, 204, 206, 129, 78, 160, 13, 182, 249, 34, 181, 5,
        219, 210, 95, 166, 112, 145, 7, 73, 2, 0, 0, 192, 0, 0, 0, 0, 248, 26,
        93, 208, 179, 108, 79, 45, 138, 110, 68, 139, 199, 228, 226, 1, 221,
        240, 249, 248, 4, 67, 76, 132, 14, 193, 30, 17, 225, 88, 254, 18, 6, 0,
        0, 0, 1, 0, 0, 0, 114, 71, 225, 194, 75, 69, 152, 33, 245, 87, 67, 56,
        254, 79, 67, 13, 64, 62, 17, 166, 42, 211, 251, 41, 110, 197, 81, 223,
        159, 110, 133, 36, 8, 0, 0, 192, 1, 0, 0, 0, 190, 222, 178, 238, 5, 222,
        128, 195, 114, 20, 245, 158, 242, 150, 120, 255, 64, 205, 238, 161, 34,
        219, 173, 34, 251, 85, 74, 95, 78, 198, 7, 35, 5, 0, 0, 64, 2, 0, 0, 0,
        74, 110, 114, 74, 165, 49, 149, 18, 203, 77, 214, 152, 5, 209, 218, 240,
        158, 104, 140, 202, 243, 204, 235, 231, 192, 215, 45, 93, 48, 158, 70,
        115, 11, 0, 0, 128, 2, 0, 0, 0, 99, 138, 233, 153, 1, 186, 10, 219, 176,
        153, 137, 55, 224, 117, 191, 102, 246, 81, 25, 26, 101, 33, 197, 217,
        195, 195, 36, 200, 11, 245, 82, 144, 1, 5, 249, 145, 51, 97, 221, 67,
        50, 167, 79, 80, 50, 73, 68, 32, 110, 111, 116, 101, 32, 101, 120, 112,
        101, 99, 116, 115, 32, 101, 120, 97, 99, 116, 108, 121, 32, 50, 32, 110,
        111, 116, 101, 32, 105, 110, 112, 117, 116, 115, 57, 224, 97, 252, 48,
        86, 206, 232, 133, 80, 50, 73, 68, 39, 115, 32, 116, 97, 114, 103, 101,
        116, 32, 97, 99, 99, 111, 117, 110, 116, 32, 97, 100, 100, 114, 101,
        115, 115, 32, 97, 110, 100, 32, 116, 114, 97, 110, 115, 97, 99, 116,
        105, 111, 110, 32, 97, 100, 100, 114, 101, 115, 115, 32, 100, 111, 32,
        110, 111, 116, 32, 109, 97, 116, 99, 104, 1, 1, 1, 7, 3, 1, 7, 1, 13, 1,
        1, 1, 12, 0, 0, 0, 2, 0, 45, 228, 24, 211, 222, 198, 46, 144, 80, 182,
        7, 244, 90, 72, 93, 186, 69, 159, 168, 18, 250, 52, 135, 166, 232, 30,
        219, 92, 13, 187, 11, 224, 49, 27, 219, 86, 9, 251, 231, 19, 1, 194,
        203, 124, 155, 177, 17, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        174, 71, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0,
      ]);
      console.log('before deserializing transaction summary');
      const transactionSummary = Miden.TransactionSummary.deserialize(
        transactionSummaryBytes
      );
      console.log('transactionSummary', transactionSummary);
      const signingInputs =
        Miden.SigningInputs.newTransactionSummary(transactionSummary);
      console.log('signingInputs', signingInputs);
      const signingInputsBytes = signingInputs.serialize();
      console.log('signingInputsBytes', signingInputsBytes);
      const sigBytes =
        (await signBytes!(signingInputsBytes, 'signingInputs')) ||
        new Uint8Array();
      console.log('sigBytes', sigBytes);
      const signatureHex = bytesToHex(sigBytes);
      console.log(signatureHex);
      setStatus(`Data signed successfully!`);
    } catch (error) {
      setStatus('Error importing note');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <NextSeo
        title="Miden Wallet Sign Data"
        description="Sign data with the Miden Wallet"
      />
      <Base>
        <h2 className="text-2xl font-bold">Sign Data</h2>
        <p className="text-sm text-gray-500">
          Sign arbitrary data for verification
        </p>
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-col items-start justify-center space-y-4"
        >
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
              disabled={!address || !Miden || !client}
              type="submit"
              color="primary"
              isLoading={isLoading}
              className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
              onClick={handleSubmit}
            >
              {isLoading ? 'Signing Data...' : 'Sign Data'}
            </Button>
          )}
        </form>
        {status && (
          <div className="mt-5 inline-flex w-full items-center justify-center rounded-full bg-white shadow-card dark:bg-light-dark xl:mt-6">
            <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full text-xs text-white sm:text-sm">
              {status}
            </div>
          </div>
        )}
      </Base>
    </>
  );
};

SignDataPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SignDataPage;
