import React from 'react';
import dynamic from 'next/dynamic';
import DashboardLayout from '@/layouts/dashboard/_dashboard';

// Build a purely client-side version of the page.
// Nothing browser-specific (wallet, wasm, crypto) is imported at the top level.
const SignPage = dynamic(
  async () => {
    const React = await import('react');
    const { useState, useCallback, useEffect } = React;

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

    function normalizeHex(input: string): string {
      const trimmed = input.trim();
      const withoutPrefix =
        trimmed.startsWith('0x') || trimmed.startsWith('0X')
          ? trimmed.slice(2)
          : trimmed;
      return withoutPrefix.replace(/\s+/g, '').toLowerCase();
    }

    function hexToBytes(hex: string): Uint8Array | null {
      const normalized = normalizeHex(hex);
      if (!normalized) return null;
      if (normalized.length % 2 !== 0) return null;
      if (!/^[0-9a-f]+$/.test(normalized)) return null;
      const bytes = new Uint8Array(normalized.length / 2);
      for (let i = 0; i < normalized.length; i += 2) {
        bytes[i / 2] = parseInt(normalized.slice(i, i + 2), 16);
      }
      return bytes;
    }

    const MESSAGE_WORD_BYTE_LENGTH = 32;

    let _sdkPromise: Promise<typeof import('@demox-labs/miden-sdk')> | null =
      null;
    function getMidenSdk() {
      if (!_sdkPromise) _sdkPromise = import('@demox-labs/miden-sdk');
      return _sdkPromise;
    }

    /** Build a random Word from 32 CSPRNG bytes (4×u64 little-endian) – client-only */
    async function generateRandomWord(): Promise<{
      hex: string;
      bytes: Uint8Array;
    }> {
      // Lazily import the WASM SDK only in the browser.
      const { Word } = await getMidenSdk();

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
      const { accountId, publicKey, signMessage } = useWallet();

      const [messageHex, setMessageHex] = useState<string>('');
      const [messageBytes, setMessageBytes] = useState<Uint8Array | null>(null);

      const [signatureHex, setSignatureHex] = useState<string>('');
      const [signatureBytes, setSignatureBytes] = useState<Uint8Array | null>(
        null
      );
      const [publicKeyHex, setPublicKeyHex] = useState<string>('');
      const [publicKeyBytes, setPublicKeyBytes] = useState<Uint8Array | null>(
        null
      );
      const [walletPublicKeyLength, setWalletPublicKeyLength] = useState<
        number | null
      >(null);
      const [copyButtonStatus, setCopyButtonStatus] = useState(false);
      const [, copyToClipboard] = useCopyToClipboard();

      const [verificationStatus, setVerificationStatus] = useState<
        'idle' | 'success' | 'error'
      >('idle');
      const [verificationMessage, setVerificationMessage] =
        useState<string>('');
      const [isVerifying, setIsVerifying] = useState(false);

      const resetVerificationFeedback = useCallback(() => {
        setVerificationStatus('idle');
        setVerificationMessage('');
      }, []);

      useEffect(() => {
        if (publicKey && publicKey.length) {
          const cloned = new Uint8Array(publicKey);
          setPublicKeyHex(bytesToHex(cloned));
          setPublicKeyBytes(cloned);
          setWalletPublicKeyLength(cloned.length);
        } else {
          setPublicKeyHex('');
          setPublicKeyBytes(null);
          setWalletPublicKeyLength(null);
        }
      }, [publicKey]);

      const onGenerate = useCallback(async () => {
        const { hex, bytes } = await generateRandomWord();
        setMessageHex(hex);
        setMessageBytes(bytes);
        setSignatureHex(''); // clear any prior signature
        setSignatureBytes(null);
        resetVerificationFeedback();
      }, [resetVerificationFeedback]);

      const handleCopyToClipboard = () => {
        if (!signatureHex) return;
        copyToClipboard(signatureHex);
        setCopyButtonStatus(true);
        setTimeout(() => setCopyButtonStatus(false), 1500);
      };

      const handleSubmit = async (event?: React.SyntheticEvent) => {
        event?.preventDefault?.();
        if (!accountId) throw new WalletNotConnectedError();
        if (!messageBytes) {
          setVerificationStatus('error');
          setVerificationMessage(
            'Provide a valid hex-encoded message before signing.'
          );
          return;
        }

        resetVerificationFeedback();

        // signMessage likely expects Uint8Array — keep it as typed array.
        const sigBytes = (await signMessage!(messageBytes)) || new Uint8Array();

        setSignatureHex(bytesToHex(sigBytes));
        setSignatureBytes(new Uint8Array(sigBytes));
      };

      const handleMessageChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
          const value = event.currentTarget.value;
          setMessageHex(value);
          setMessageBytes(hexToBytes(value));
          resetVerificationFeedback();
        },
        [resetVerificationFeedback]
      );

      const handleSignatureChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
          const value = event.currentTarget.value;
          setSignatureHex(value);
          setSignatureBytes(hexToBytes(value));
          resetVerificationFeedback();
        },
        [resetVerificationFeedback]
      );

      const handlePublicKeyChange = useCallback(
        (event: React.ChangeEvent<HTMLTextAreaElement>) => {
          const value = event.currentTarget.value;
          setPublicKeyHex(value);
          setPublicKeyBytes(hexToBytes(value));
          resetVerificationFeedback();
        },
        [resetVerificationFeedback]
      );

      const handleVerifySignature = useCallback(async () => {
        resetVerificationFeedback();

        const trimmedMessage = messageHex.trim();
        if (!trimmedMessage) {
          setVerificationStatus('error');
          setVerificationMessage('Enter a message to verify.');
          return;
        }
        if (!messageBytes) {
          setVerificationStatus('error');
          setVerificationMessage(
            'Message must be a valid even-length hex string.'
          );
          return;
        }
        if (messageBytes.length !== MESSAGE_WORD_BYTE_LENGTH) {
          setVerificationStatus('error');
          setVerificationMessage(
            `Message must decode to ${MESSAGE_WORD_BYTE_LENGTH} bytes (${
              MESSAGE_WORD_BYTE_LENGTH * 2
            } hex characters), but received ${messageBytes.length} bytes.`
          );
          return;
        }

        const trimmedSignature = signatureHex.trim();
        if (!trimmedSignature) {
          setVerificationStatus('error');
          setVerificationMessage('Enter a signature to verify.');
          return;
        }
        if (!signatureBytes) {
          setVerificationStatus('error');
          setVerificationMessage(
            'Signature must be a valid even-length hex string.'
          );
          return;
        }

        const trimmedPublicKey = publicKeyHex.trim();
        if (!trimmedPublicKey) {
          setVerificationStatus('error');
          setVerificationMessage('Enter a public key to verify with.');
          return;
        }
        if (!publicKeyBytes) {
          setVerificationStatus('error');
          setVerificationMessage(
            'Public key must be a valid even-length hex string.'
          );
          return;
        }
        if (
          walletPublicKeyLength !== null &&
          publicKeyBytes.length !== walletPublicKeyLength
        ) {
          setVerificationStatus('error');
          setVerificationMessage(
            `Public key must decode to ${walletPublicKeyLength} bytes (${
              walletPublicKeyLength * 2
            } hex characters), but received ${publicKeyBytes.length} bytes.`
          );
          return;
        }

        setIsVerifying(true);
        try {
          const { PublicKey, Signature, Word } = await getMidenSdk();

          let messageWord;
          try {
            messageWord = Word.deserialize(messageBytes);
          } catch (error) {
            throw new Error(
              `Invalid message encoding: ${
                error instanceof Error
                  ? error.message
                  : 'unable to deserialize the message word.'
              }`
            );
          }

          let signature;
          try {
            signature = Signature.deserialize(signatureBytes);
          } catch (error) {
            throw new Error(
              `Invalid signature encoding: ${
                error instanceof Error
                  ? error.message
                  : 'unable to deserialize the signature.'
              }`
            );
          }

          let midenPublicKey;
          try {
            midenPublicKey = PublicKey.deserialize(publicKeyBytes);
          } catch (error) {
            throw new Error(
              `Invalid public key encoding: ${
                error instanceof Error
                  ? error.message
                  : 'unable to deserialize the public key.'
              }`
            );
          }

          const isValid = midenPublicKey.verify(messageWord, signature);

          if (isValid) {
            setVerificationStatus('success');
            setVerificationMessage(
              'Signature verified for the current message.'
            );
          } else {
            setVerificationStatus('error');
            setVerificationMessage(
              'Signature does not match the current message.'
            );
          }
        } catch (error) {
          setVerificationStatus('error');
          setVerificationMessage(
            error instanceof Error ? error.message : 'Verification failed.'
          );
        } finally {
          setIsVerifying(false);
        }
      }, [
        messageHex,
        messageBytes,
        publicKeyBytes,
        publicKeyHex,
        resetVerificationFeedback,
        signatureBytes,
        signatureHex,
        walletPublicKeyLength,
      ]);

      return (
        <>
          <NextSeo
            title="Miden Wallet Sign"
            description="Sign Messages with the Miden Wallet"
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
                disabled={!accountId || !messageBytes}
                type="submit"
                color="white"
                className="shadow-card dark:bg-gray-700 md:h-10 md:px-5 xl:h-12 xl:px-7"
              >
                {!accountId ? 'Connect Your Wallet' : 'Sign'}
              </Button>
            </form>

            {/* Display the generated Message (hex) */}
            <div className="mt-4 rounded-lg border-2 border-gray-200 p-3 dark:border-gray-600">
              <div className="mb-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                Message (hex)
              </div>
              <div className="break-all rounded bg-gray-100 p-2 font-mono text-xs text-gray-800 dark:bg-light-dark dark:text-gray-200">
                {messageHex || (
                  <span className="text-gray-500">
                    Click “Generate Random Word”
                  </span>
                )}
              </div>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-lg border-2 border-gray-200 p-4 dark:border-gray-600">
                <div className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Verify Signature
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      Message (hex)
                    </label>
                    <textarea
                      className="min-h-[96px] w-full rounded-lg border-2 border-gray-200 bg-transparent p-3 font-mono text-xs text-gray-800 outline-none transition-all placeholder:text-gray-500 focus:border-gray-900 dark:border-gray-600 dark:bg-light-dark dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                      placeholder="Hex-encoded message word"
                      value={messageHex}
                      onChange={handleMessageChange}
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      Signature (hex)
                    </label>
                    <div className="flex flex-col gap-3 sm:flex-row">
                      <textarea
                        className="min-h-[96px] w-full flex-1 rounded-lg border-2 border-gray-200 bg-transparent p-3 font-mono text-xs text-gray-800 outline-none transition-all placeholder:text-gray-500 focus:border-gray-900 dark:border-gray-600 dark:bg-light-dark dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                        placeholder="Hex-encoded signature"
                        value={signatureHex}
                        onChange={handleSignatureChange}
                      />
                      <Button
                        type="button"
                        color="white"
                        className="shrink-0 shadow-card dark:bg-gray-700 md:h-10 md:px-5"
                        onClick={handleCopyToClipboard}
                        disabled={!signatureHex}
                      >
                        <span className="inline-flex items-center gap-2 text-xs sm:text-sm">
                          {copyButtonStatus ? (
                            <>
                              <Check className="h-auto w-3.5 text-green-500" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-auto w-3.5" />
                              Copy
                            </>
                          )}
                        </span>
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-gray-600 dark:text-gray-400">
                      Public Key (hex)
                    </label>
                    <textarea
                      className="min-h-[96px] w-full rounded-lg border-2 border-gray-200 bg-transparent p-3 font-mono text-xs text-gray-800 outline-none transition-all placeholder:text-gray-500 focus:border-gray-900 dark:border-gray-600 dark:bg-light-dark dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                      placeholder="Hex-encoded public key"
                      value={publicKeyHex}
                      onChange={handlePublicKeyChange}
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm">
                    <Button
                      type="button"
                      color="white"
                      className="shadow-card dark:bg-gray-700 md:h-10 md:px-5"
                      onClick={handleVerifySignature}
                      disabled={isVerifying}
                    >
                      {isVerifying ? 'Verifying…' : 'Verify Signature'}
                    </Button>
                    {verificationStatus === 'success' && (
                      <span className="text-green-600 dark:text-green-400">
                        {verificationMessage}
                      </span>
                    )}
                    {verificationStatus === 'error' && verificationMessage && (
                      <span className="text-red-600 dark:text-red-400">
                        {verificationMessage}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
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
