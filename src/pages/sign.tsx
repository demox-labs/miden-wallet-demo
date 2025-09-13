import { useState, SyntheticEvent, useCallback } from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Base from '@/components/ui/base';
import { WalletNotConnectedError } from '@demox-labs/miden-wallet-adapter-base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import { Check } from '@/components/icons/check';
import Button from '@/components/ui/button';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { Copy } from '@/components/icons/copy';
import { Word } from '@demox-labs/miden-sdk';

/** Helper: bytes -> hex string */
function bytesToHex(u8: Uint8Array): string {
  let s = '';
  for (let i = 0; i < u8.length; i++) {
    const h = u8[i].toString(16).padStart(2, '0');
    s += h;
  }
  return s;
}

/** Build a random Word from 32 CSPRNG bytes (4×u64 little-endian) */
function generateRandomWord(): { word: Word; hex: string; bytes: Uint8Array } {
  // 1) 32 secure random bytes
  const rand = crypto.getRandomValues(new Uint8Array(32));

  // 2) Split into 4 little-endian u64 limbs (JS BigInt)
  const dv = new DataView(rand.buffer, rand.byteOffset, rand.byteLength);
  const limbs = [
    dv.getBigUint64(0, true),
    dv.getBigUint64(8, true),
    dv.getBigUint64(16, true),
    dv.getBigUint64(24, true),
  ];

  // 3) Construct the WASM Word: constructor takes Vec<u64> (JS BigInt[])
  //    If your TS types complain, keep the cast.
  const word = new Word(new BigUint64Array(limbs));

  // 4) Present-friendly hex, and keep codec bytes for transport
  const hex = word.toHex();
  const bytes: Uint8Array = word.serialize(); // 32 bytes
  return { word, hex, bytes };
}

const SignPage: NextPageWithLayout = () => {
  const { accountId, signMessage } = useWallet();

  const [wordHex, setWordHex] = useState<string>('');
  const [wordBytes, setWordBytes] = useState<Uint8Array | null>(null);

  const [signatureHex, setSignatureHex] = useState<string>('');
  const [copyButtonStatus, setCopyButtonStatus] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard();

  const onGenerate = useCallback(() => {
    const { hex, bytes } = generateRandomWord();
    setWordHex(hex);
    setWordBytes(bytes);
    setSignatureHex(''); // clear any prior signature
  }, []);

  const handleCopyToClipboard = () => {
    if (!signatureHex) return;
    copyToClipboard(signatureHex);
    setCopyButtonStatus(true);
    setTimeout(() => setCopyButtonStatus(false), 1500);
  };

  // You said you'll handle submit; this shows the typical flow.
  // Feel free to replace the inside with your own logic.
  const handleSubmit = async (event?: SyntheticEvent) => {
    event?.preventDefault?.();
    if (!accountId) throw new WalletNotConnectedError();
    if (!wordBytes) return;

    // signMessage likely expects Uint8Array — keep it as typed array.
    const sigBytes = (await signMessage!(wordBytes)) || new Uint8Array();
    setSignatureHex(bytesToHex(sigBytes));
  };

  return (
    <>
      <NextSeo
        title="Leo Wallet Sign"
        description="Sign Messages with the Leo Wallet"
      />
      <Base>
        {/* Top action row: Generate + Sign */}
        <form
          className="relative flex w-full items-center gap-3 md:w-auto"
          noValidate
          role="form"
          onSubmit={handleSubmit}
        >
          <Button
            type="button"
            color="white"
            onClick={onGenerate}
            className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
          >
            Generate Random Word
          </Button>

          <Button
            disabled={!accountId || !wordBytes}
            type="submit"
            color="white"
            className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
          >
            {!accountId ? 'Connect Your Wallet' : 'Sign'}
          </Button>
        </form>

        {/* Display the generated Word (hex) */}
        <div className="mt-4 rounded-lg border-2 border-gray-200 p-3 dark:border-gray-600">
          <div className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
            Word (hex)
          </div>
          <div className="break-all rounded bg-gray-100 p-2 font-mono text-xs text-gray-800 dark:bg-light-dark dark:text-gray-200">
            {wordHex || (
              <span className="text-gray-500">
                Click “Generate Random Word”
              </span>
            )}
          </div>
        </div>

        {/* Signature panel */}
        {signatureHex && (
          <div className="mt-5 inline-flex h-9 items-center rounded-full bg-white shadow-card dark:bg-light-dark xl:mt-6">
            <div className="inline-flex h-full shrink-0 grow-0 items-center rounded-full bg-gray-900 px-4 text-xs text-white sm:text-sm">
              Signature (hex):
            </div>
            <div className="text w-28 grow-0 truncate text-ellipsis bg-center text-xs text-gray-500 ltr:pl-4 rtl:pr-4 dark:text-gray-300 sm:w-64 sm:text-sm">
              {signatureHex}
            </div>
            <div
              className="flex cursor-pointer items-center px-4 text-gray-500 transition hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
              title="Copy Signature"
              onClick={handleCopyToClipboard}
            >
              {copyButtonStatus ? (
                <Check className="h-auto w-3.5 text-green-500" />
              ) : (
                <Copy className="h-auto w-3.5" />
              )}
            </div>
          </div>
        )}
      </Base>
    </>
  );
};

SignPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SignPage;
