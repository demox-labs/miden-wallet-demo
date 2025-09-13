import React from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/layouts/dashboard/_dashboard';

// Build a purely client-side version of the page.
// Nothing browser-specific (wallet, wasm, crypto) is imported at the top level.
const SignPage = dynamic(
  async () => {
    const React = await import('react');
    const { useState, useCallback } = React;

    const { NextSeo } = await import('next-seo');

    // UI bits loaded client-side
    const Base = (await import('@/components/ui/base')).default;
    const Button = (await import('@/components/ui/button')).default;
    const { Check } = await import('@/components/icons/check');
    const { Copy } = await import('@/components/icons/copy');
    const { useCopyToClipboard } = await import(
      '@/lib/hooks/use-copy-to-clipboard'
    );

    // Wallet + errors only on client
    const { WalletNotConnectedError } = await import(
      '@demox-labs/miden-wallet-adapter-base'
    );
    const { useWallet } = await import(
      '@demox-labs/miden-wallet-adapter-react'
    );

    /** Helper: bytes -> hex string */
    function bytesToHex(u8: Uint8Array): string {
      let s = '';
      for (let i = 0; i < u8.length; i++) {
        const h = u8[i].toString(16).padStart(2, '0');
        s += h;
      }
      return s;
    }

    /** Build a random Word from 32 CSPRNG bytes (4×u64 little-endian) – client-only */
    async function generateRandomWord(): Promise<{
      hex: string;
      bytes: Uint8Array;
    }> {
      // Lazily import the WASM SDK only in the browser.
      const { Word } = await import('@demox-labs/miden-sdk');

      // 1) 32 secure random bytes
      if (typeof crypto === 'undefined' || !crypto.getRandomValues) {
        throw new Error(
          'Secure random generator is unavailable in this environment.'
        );
      }
      const rand = crypto.getRandomValues(new Uint8Array(32));

      // 2) Split into 4 little-endian u64 limbs (JS BigInt)
      const dv = new DataView(rand.buffer, rand.byteOffset, rand.byteLength);
      const limbs = [
        dv.getBigUint64(0, true),
        dv.getBigUint64(8, true),
        dv.getBigUint64(16, true),
        dv.getBigUint64(24, true),
      ];

      // 3) Construct the WASM Word
      const word = new Word(BigUint64Array.from(limbs));

      // 4) Present-friendly hex, and codec bytes for transport
      const hex = word.toHex();
      const bytes: Uint8Array = word.serialize(); // 32 bytes
      return { hex, bytes };
    }

    // ---------- Client component ----------
    const Page: React.FC = () => {
      const { accountId, signMessage } = useWallet();

      const [wordHex, setWordHex] = useState<string>('');
      const [wordBytes, setWordBytes] = useState<Uint8Array | null>(null);

      const [signatureHex, setSignatureHex] = useState<string>('');
      const [copyButtonStatus, setCopyButtonStatus] = useState(false);
      const [, copyToClipboard] = useCopyToClipboard();

      const onGenerate = useCallback(async () => {
        const { hex, bytes } = await generateRandomWord();
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

      const handleSubmit = async (event?: React.SyntheticEvent) => {
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

    return Page;
  },
  {
    ssr: false,
    loading: () => (
      <div className="p-6 text-sm text-gray-600 dark:text-gray-300">
        Loading signing UI…
      </div>
    ),
  }
);

// Keep your existing layout integration
(SignPage as any).getLayout = function getLayout(page: React.ReactElement) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SignPage;
