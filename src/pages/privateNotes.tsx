import {
  useState,
  SyntheticEvent,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import type { NextPageWithLayout } from '@/types';
import { NextSeo } from 'next-seo';
import DashboardLayout from '@/layouts/dashboard/_dashboard';
import Base from '@/components/ui/base';
import { useWallet } from '@demox-labs/miden-wallet-adapter-react';
import {
  InputNoteDetails,
  WalletNotConnectedError,
} from '@demox-labs/miden-wallet-adapter-base';
import Button from '@/components/ui/button';
import { useMidenSdk } from '@/lib/hooks/use-miden-sdk';
import type { NoteFilterTypes } from '@demox-labs/miden-sdk';

type NoteFilterOption = {
  key: string;
  value: number;
};

const PrivateNotesPage: NextPageWithLayout = () => {
  const { accountId, requestPrivateNotes } = useWallet();
  const { Miden, createClient } = useMidenSdk();

  const [noteFilterType, setNoteFilterType] = useState<number | undefined>(
    undefined
  );
  const [allNoteFilterTypes, setAllNoteFilterTypes] = useState<
    NoteFilterOption[]
  >([]);
  const [notes, setNotes] = useState<InputNoteDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [noteIdsText, setNoteIdsText] = useState('');
  const [noteIds, setNoteIds] = useState<string[]>([]);

  const noteFilterName = useMemo(() => {
    return allNoteFilterTypes.find((option) => option.value === noteFilterType)
      ?.key;
  }, [allNoteFilterTypes, noteFilterType]);

  useEffect(() => {
    if (!Miden) return;
    setNoteFilterType(Miden.NoteFilterTypes.All);
    setAllNoteFilterTypes(
      Object.keys(Miden.NoteFilterTypes)
        .filter(
          (key) =>
            typeof Miden.NoteFilterTypes[
              key as keyof typeof Miden.NoteFilterTypes
            ] === 'number'
        )
        .map((key) => ({
          key,
          value: Miden.NoteFilterTypes[
            key as keyof typeof Miden.NoteFilterTypes
          ] as number,
        }))
    );
  }, [Miden]);

  const handleSubmit = useCallback(
    async (event?: SyntheticEvent) => {
      event?.preventDefault?.();
      try {
        setError(null);
        if (!accountId) throw new WalletNotConnectedError();

        let idsArg: string[] | undefined = undefined;
        if (Miden && noteFilterType === Miden.NoteFilterTypes.List) {
          if (noteIds.length < 1) {
            setSubmitted(false);
            setError('Provide at least one note id for the List filter.');
            return;
          }
          idsArg = noteIds;
        } else if (Miden && noteFilterType === Miden.NoteFilterTypes.Unique) {
          if (noteIds.length !== 1) {
            setSubmitted(false);
            setError('Provide exactly one note id for the Unique filter.');
            return;
          }
          idsArg = noteIds;
        }

        setLoading(true);
        console.log('Requesting private notes...');

        const resp =
          (await requestPrivateNotes!(
            noteFilterType as NoteFilterTypes,
            idsArg
          )) || [];

        console.log('Private Notes Response:', resp);
        setNotes(resp);
        setSubmitted(true);
      } catch (e: any) {
        setError(e?.message ?? String(e));
      } finally {
        setLoading(false);
      }
    },
    [accountId, noteFilterType, requestPrivateNotes, noteIds, Miden]
  );

  const handleNoteFilterTypeChange = useCallback(
    (event: React.ChangeEvent<HTMLSelectElement>) => {
      const value = parseInt(event.target.value);
      setNoteFilterType(value);
      setSubmitted(false);
      setError(null);
      setNoteIdsText('');
      setNoteIds([]);
    },
    []
  );

  const handleNoteIdsChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const text = event.currentTarget.value;
      setNoteIdsText(text);
      const ids = text
        .split('\n')
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
      setNoteIds(ids);
      setSubmitted(false);
      setError(null);
    },
    []
  );

  return (
    <>
      <NextSeo
        title="Miden Wallet Get Private Notes"
        description="Request Private Notes from the Miden Wallet"
      />
      <Base>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
              Note Filter Type
              <select
                className="h-11 w-full appearance-none rounded-lg border-2 border-gray-300 bg-transparent py-1 text-sm tracking-tighter text-gray-900 outline-none transition-all placeholder:text-gray-700 focus:border-gray-900 ltr:pr-5 ltr:pl-10 rtl:pr-10 dark:border-gray-600 dark:text-white dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                onChange={handleNoteFilterTypeChange}
              >
                {allNoteFilterTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.key}
                  </option>
                ))}
              </select>
            </label>
            {Miden &&
              (noteFilterType === Miden.NoteFilterTypes.List ||
                noteFilterType === Miden.NoteFilterTypes.Unique) && (
                <div className="mt-2">
                  <label className="flex flex-col gap-2 text-sm font-medium text-gray-800">
                    Note IDs
                    <textarea
                      className="min-h-[96px] w-full rounded-lg border-2 border-gray-300 bg-transparent p-3 font-mono text-xs text-gray-900 outline-none transition-all placeholder:text-gray-600 focus:border-gray-900 dark:border-gray-600 dark:bg-light-dark dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
                      placeholder={
                        noteFilterType === Miden.NoteFilterTypes.Unique
                          ? 'Enter exactly one note id'
                          : 'Enter one or more note ids, one per line'
                      }
                      value={noteIdsText}
                      onChange={handleNoteIdsChange}
                    />
                  </label>
                </div>
              )}
          </div>
          <div className="mt-4 flex items-center justify-center">
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
                {loading ? 'Requesting…' : 'Request Private Notes'}
              </Button>
            )}
          </div>
        </form>

        {/* Errors */}
        {error && <p className="mt-4 text-center text-red-600">{error}</p>}

        {submitted && notes.length === 0 && (
          <div className="mt-6">
            <h2 className="mb-2 text-lg font-semibold">
              No private notes on this account with filter type:{' '}
              {noteFilterName}
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
