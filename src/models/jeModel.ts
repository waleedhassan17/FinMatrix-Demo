// ============================================================
// FINMATRIX - Journal Entry Validation Model
// ============================================================

import { JournalLine } from '../dummy-data/journalEntries';

export interface JEFormLine {
  lineId: string;
  accountId: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JEFormData {
  date: string;
  reference: string;
  memo: string;
  lines: JEFormLine[];
}

export interface JEValidationResult {
  isValid: boolean;
  canPost: boolean;
  errors: Record<string, string>;
  lineErrors: Record<number, Record<string, string>>;
}

/**
 * Validates a journal entry for saving (draft) and posting.
 *
 * Draft requirements: date, reference, at least 2 lines, every line has accountId,
 * every line has either debit > 0 OR credit > 0 (not both).
 *
 * Post requirements: all draft requirements + total debits == total credits.
 */
export const validateJournalEntry = (data: JEFormData): JEValidationResult => {
  const errors: Record<string, string> = {};
  const lineErrors: Record<number, Record<string, string>> = {};

  // ─── Header Validation ────────────────────────────────
  if (!data.date) {
    errors.date = 'Date is required';
  }

  if (!data.reference.trim()) {
    errors.reference = 'Reference number is required';
  }

  // ─── Line Count ───────────────────────────────────────
  if (data.lines.length < 2) {
    errors.lines = 'At least 2 lines are required';
  }

  // ─── Line-Level Validation ────────────────────────────
  let totalDebits = 0;
  let totalCredits = 0;

  data.lines.forEach((line, index) => {
    const le: Record<string, string> = {};

    if (!line.accountId) {
      le.accountId = 'Account is required';
    }

    if (line.debit > 0 && line.credit > 0) {
      le.amount = 'Line cannot have both debit and credit';
    }

    if (line.debit <= 0 && line.credit <= 0) {
      le.amount = 'Line must have a debit or credit amount';
    }

    if (line.debit < 0) {
      le.debit = 'Debit cannot be negative';
    }

    if (line.credit < 0) {
      le.credit = 'Credit cannot be negative';
    }

    if (Object.keys(le).length > 0) {
      lineErrors[index] = le;
    }

    totalDebits += line.debit > 0 ? line.debit : 0;
    totalCredits += line.credit > 0 ? line.credit : 0;
  });

  // ─── Balance Check (for posting) ──────────────────────
  const isBalanced =
    Math.abs(totalDebits - totalCredits) < 0.01 && totalDebits > 0;

  // Draft is valid if no header/line errors
  const hasErrors =
    Object.keys(errors).length > 0 || Object.keys(lineErrors).length > 0;

  const isValid = !hasErrors;
  const canPost = isValid && isBalanced;

  if (!isBalanced && isValid) {
    errors.balance = `Unbalanced: Debits ($${totalDebits.toFixed(2)}) ≠ Credits ($${totalCredits.toFixed(2)})`;
  }

  return { isValid, canPost, errors, lineErrors };
};

/**
 * Generates the next reference number based on existing entries.
 */
export const generateNextReference = (existingRefs: string[]): string => {
  let max = 0;
  existingRefs.forEach((ref) => {
    const match = ref.match(/JE-(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > max) max = num;
    }
  });
  return `JE-${String(max + 1).padStart(3, '0')}`;
};

/**
 * Create a blank journal line.
 */
export const createBlankLine = (): JEFormLine => ({
  lineId: `jl_new_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  accountId: '',
  description: '',
  debit: 0,
  credit: 0,
});
