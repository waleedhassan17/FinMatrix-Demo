// ============================================================
// FINMATRIX - General Ledger Network Layer
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import {
  generalLedgerEntries,
  LedgerEntry,
} from '../dummy-data/generalLedger';

// Mutable in-memory store so cross-module writes persist in same session
let glStore: LedgerEntry[] = [...generalLedgerEntries];
let glSeq = glStore.length + 1;

export const getLedgerEntriesAPI = async (
  from: string,
  to: string,
  accountId?: string
): Promise<LedgerEntry[]> => {
  await delay(600);

  let entries = [...glStore];

  // Filter by date range
  entries = entries.filter((e) => e.date >= from && e.date <= to);

  // Filter by account
  if (accountId) {
    entries = entries.filter((e) => e.accountId === accountId);
  }

  // Sort by date ascending, then by id
  entries.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

  return entries;
};

/**
 * Create GL entries for a transaction (e.g. payment recorded).
 * Each entry is a debit/credit pair.
 */
export const createLedgerEntriesAPI = async (
  entries: Omit<LedgerEntry, 'id'>[],
): Promise<LedgerEntry[]> => {
  await delay(400);
  const created: LedgerEntry[] = entries.map((e) => ({
    ...e,
    id: `gl_${String(glSeq++).padStart(3, '0')}`,
  }));
  glStore.push(...created);
  return created;
};
