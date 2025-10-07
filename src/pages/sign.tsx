import { useState, useCallback, useEffect } from 'react';
import { NextSeo } from 'next-seo';

import { WalletNotConnectedError } from '@demox-labs/miden-wallet-adapter-base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import type { Word } from '@demox-labs/miden-sdk';

import Base from '@/components/ui/base';
import Button from '@/components/ui/button';
import { Check } from '@/components/icons/check';
import { Copy } from '@/components/icons/copy';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';
import { useMidenSdk } from '@/lib/hooks/use-miden-sdk';
import { NextPageWithLayout } from '@/types';

const MESSAGE_WORD_BYTE_LENGTH = 32;

interface HexAndBytes {
  hex: string;
  bytes: Uint8Array | null;
}

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

const SignPage: NextPageWithLayout = () => {
  const { accountId, publicKey: walletPublicKey, signMessage } = useWallet();
  const { Miden } = useMidenSdk();

  const [message, setMessage] = useState<HexAndBytes>({ hex: '', bytes: null });
  const [signature, setSignature] = useState<HexAndBytes>({
    hex: '',
    bytes: null,
  });
  const [publicKey, setPublicKey] = useState<HexAndBytes>({
    hex: '',
    bytes: null,
  });
  const [publicKeyLength, setPublicKeyLength] = useState<number | null>(null);

  const [copyButtonStatus, setCopyButtonStatus] = useState(false);
  const [, copyToClipboard] = useCopyToClipboard();

  const [verificationStatus, setVerificationStatus] = useState<
    'idle' | 'success' | 'error'
  >('idle');
  const [verificationMessage, setVerificationMessage] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);

  const resetVerificationFeedback = useCallback(() => {
    setVerificationStatus('idle');
    setVerificationMessage('');
  }, []);

  useEffect(() => {
    if (walletPublicKey && walletPublicKey.length) {
      const cloned = new Uint8Array(walletPublicKey);
      setPublicKey({ hex: bytesToHex(cloned), bytes: cloned });
      setPublicKeyLength(cloned.length);
    } else {
      setPublicKey({ hex: '', bytes: null });
      setPublicKeyLength(null);
    }
  }, [walletPublicKey]);

  /** Build a random Word from 32 CSPRNG bytes (4×u64 little-endian) */
  function generateRandomWord(): {
    word: Word;
    hex: string;
    bytes: Uint8Array;
  } {
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
    const word = new Miden.Word(new BigUint64Array(limbs));

    // 4) Present-friendly hex, and keep codec bytes for transport
    const hex = word.toHex();
    const bytes: Uint8Array = word.serialize(); // 32 bytes
    return { word, hex, bytes };
  }

  const onGenerate = useCallback(
    async (event: React.SyntheticEvent) => {
      event?.preventDefault?.();
      if (!accountId) throw new WalletNotConnectedError();
      if (!Miden) return;

      const { hex, bytes } = generateRandomWord();
      setMessage({ hex, bytes });
      setSignature({ hex: '', bytes: null });
      resetVerificationFeedback();
    },
    [resetVerificationFeedback, accountId, Miden]
  );

  const handleCopyToClipboard = () => {
    if (!signature.hex) return;
    copyToClipboard(signature.hex);
    setCopyButtonStatus(true);
    setTimeout(() => setCopyButtonStatus(false), 1500);
  };

  const handleSubmit = async (event?: React.SyntheticEvent) => {
    event?.preventDefault?.();
    if (!accountId) throw new WalletNotConnectedError();
    if (!message.bytes) {
      setVerificationStatus('error');
      setVerificationMessage(
        'Provide a valid hex-encoded message before signing.'
      );
      return;
    }

    resetVerificationFeedback();

    // signMessage likely expects Uint8Array — keep it as typed array.
    const sigBytes = (await signMessage!(message.bytes)) || new Uint8Array();

    setSignature({
      hex: bytesToHex(sigBytes),
      bytes: new Uint8Array(sigBytes),
    });
  };

  const handleMessageChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.currentTarget.value;
      setMessage({ hex: value, bytes: hexToBytes(value) });
      resetVerificationFeedback();
    },
    [resetVerificationFeedback]
  );

  const handleSignatureChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.currentTarget.value;
      setSignature({ hex: value, bytes: hexToBytes(value) });
      resetVerificationFeedback();
    },
    [resetVerificationFeedback]
  );

  const handlePublicKeyChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const value = event.currentTarget.value;
      setPublicKey({ hex: value, bytes: hexToBytes(value) });
      setPublicKeyLength(hexToBytes(value)?.length ?? null);
      resetVerificationFeedback();
    },
    [resetVerificationFeedback]
  );

  const handleVerifySignature = useCallback(async () => {
    resetVerificationFeedback();

    const trimmedMessage = message.hex.trim();
    if (!trimmedMessage) {
      setVerificationStatus('error');
      setVerificationMessage('Enter a message to verify.');
      return;
    }
    if (!message.bytes) {
      setVerificationStatus('error');
      setVerificationMessage('Message must be a valid even-length hex string.');
      return;
    }
    if (message.bytes.length !== MESSAGE_WORD_BYTE_LENGTH) {
      setVerificationStatus('error');
      setVerificationMessage(
        `Message must decode to ${MESSAGE_WORD_BYTE_LENGTH} bytes (${
          MESSAGE_WORD_BYTE_LENGTH * 2
        } hex characters), but received ${message.bytes.length} bytes.`
      );
      return;
    }

    const trimmedSignature = signature.hex.trim();
    if (!trimmedSignature) {
      setVerificationStatus('error');
      setVerificationMessage('Enter a signature to verify.');
      return;
    }
    if (!signature.bytes) {
      setVerificationStatus('error');
      setVerificationMessage(
        'Signature must be a valid even-length hex string.'
      );
      return;
    }

    const trimmedPublicKey = publicKey.hex.trim();
    if (!trimmedPublicKey) {
      setVerificationStatus('error');
      setVerificationMessage('Enter a public key to verify with.');
      return;
    }
    if (!publicKey.bytes) {
      setVerificationStatus('error');
      setVerificationMessage(
        'Public key must be a valid even-length hex string.'
      );
      return;
    }
    if (
      publicKeyLength !== null &&
      publicKey.bytes.length !== publicKeyLength
    ) {
      setVerificationStatus('error');
      setVerificationMessage(
        `Public key must decode to ${publicKeyLength} bytes (${
          publicKeyLength * 2
        } hex characters), but received ${publicKey.bytes.length} bytes.`
      );
      return;
    }

    setIsVerifying(true);
    try {
      let messageWord;
      try {
        messageWord = Miden.Word.deserialize(message.bytes);
      } catch (error) {
        throw new Error(
          `Invalid message encoding: ${
            error instanceof Error
              ? error.message
              : 'unable to deserialize the message word.'
          }`
        );
      }

      let signatureObj;
      try {
        signatureObj = Miden.Signature.deserialize(signature.bytes);
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
        midenPublicKey = Miden.PublicKey.deserialize(publicKey.bytes);
      } catch (error) {
        throw new Error(
          `Invalid public key encoding: ${
            error instanceof Error
              ? error.message
              : 'unable to deserialize the public key.'
          }`
        );
      }

      const isValid = midenPublicKey.verify(messageWord, signatureObj);

      if (isValid) {
        setVerificationStatus('success');
        setVerificationMessage('Signature verified for the current message.');
      } else {
        setVerificationStatus('error');
        setVerificationMessage('Signature does not match the current message.');
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
    message,
    publicKey,
    resetVerificationFeedback,
    signature,
    publicKeyLength,
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
            disabled={!accountId || !message.bytes}
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
            {message.hex || (
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
                  value={message.hex}
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
                    value={signature.hex}
                    onChange={handleSignatureChange}
                  />
                  <Button
                    type="button"
                    color="white"
                    className="shrink-0 shadow-card dark:bg-gray-700 md:h-10 md:px-5"
                    onClick={handleCopyToClipboard}
                    disabled={!signature.hex}
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
                  value={publicKey.hex}
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

SignPage.getLayout = function getLayout(page) {
  return <DashboardLayout>{page}</DashboardLayout>;
};

export default SignPage;
