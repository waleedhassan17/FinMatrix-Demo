// ============================================================
// FINMATRIX - Journal Entries Network Layer
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { journalEntries, JournalEntry } from '../dummy-data/journalEntries';

// In-memory store for simulated mutations
let entriesStore: JournalEntry[] = [...journalEntries];

export const getJournalEntriesAPI = async (): Promise<JournalEntry[]> => {
  await delay(600);
  return [...entriesStore].sort(
    (a, b) => b.date.localeCompare(a.date) || b.entryId.localeCompare(a.entryId)
  );
};

export const getJournalEntryByIdAPI = async (
  id: string
): Promise<JournalEntry> => {
  await delay(400);
  const entry = entriesStore.find((e) => e.entryId === id);
  if (!entry) throw new Error('Journal entry not found');
  return { ...entry, lines: entry.lines.map((l) => ({ ...l })) };
};

export const createJournalEntryAPI = async (
  data: Omit<JournalEntry, 'entryId' | 'createdAt'>
): Promise<JournalEntry> => {
  await delay(600);
  const newEntry: JournalEntry = {
    ...data,
    entryId: `je_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  entriesStore.push(newEntry);
  return newEntry;
};

export const updateJournalEntryAPI = async (
  id: string,
  data: Partial<JournalEntry>
): Promise<JournalEntry> => {
  await delay(600);
  const index = entriesStore.findIndex((e) => e.entryId === id);
  if (index === -1) throw new Error('Journal entry not found');
  entriesStore[index] = { ...entriesStore[index], ...data };
  return { ...entriesStore[index] };
};

export const postJournalEntryAPI = async (id: string): Promise<JournalEntry> => {
  await delay(600);
  const index = entriesStore.findIndex((e) => e.entryId === id);
  if (index === -1) throw new Error('Journal entry not found');
  if (entriesStore[index].status !== 'draft')
    throw new Error('Only draft entries can be posted');
  entriesStore[index] = { ...entriesStore[index], status: 'posted' };
  return { ...entriesStore[index] };
};

export const voidJournalEntryAPI = async (id: string): Promise<JournalEntry> => {
  await delay(600);
  const index = entriesStore.findIndex((e) => e.entryId === id);
  if (index === -1) throw new Error('Journal entry not found');
  if (entriesStore[index].status !== 'posted')
    throw new Error('Only posted entries can be voided');
  entriesStore[index] = { ...entriesStore[index], status: 'void' };
  return { ...entriesStore[index] };
};
