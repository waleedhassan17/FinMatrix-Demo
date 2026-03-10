// ============================================================
// FINMATRIX - Chart of Accounts Model & Validation
// ============================================================

import { Account } from '../dummy-data/chartOfAccounts';

// ─── SubType Options per Account Type ───────────────────────
export const SUB_TYPE_OPTIONS: Record<
  Account['type'],
  { label: string; value: string }[]
> = {
  asset: [
    { label: 'Cash', value: 'Cash' },
    { label: 'Bank', value: 'Bank' },
    { label: 'Accounts Receivable', value: 'Accounts Receivable' },
    { label: 'Inventory', value: 'Inventory' },
    { label: 'Prepaid', value: 'Prepaid' },
    { label: 'Fixed Asset', value: 'Fixed Asset' },
    { label: 'Other Asset', value: 'Other Asset' },
  ],
  liability: [
    { label: 'Accounts Payable', value: 'Accounts Payable' },
    { label: 'Credit Card', value: 'Credit Card' },
    { label: 'Payroll Liability', value: 'Payroll Liability' },
    { label: 'Tax Payable', value: 'Tax Payable' },
    { label: 'Notes Payable', value: 'Notes Payable' },
    { label: 'Other Liability', value: 'Other Liability' },
  ],
  equity: [
    { label: 'Owner Equity', value: 'Owner Equity' },
    { label: 'Retained Earnings', value: 'Retained Earnings' },
    { label: 'Owner Draws', value: 'Owner Draws' },
    { label: 'Other Equity', value: 'Other Equity' },
  ],
  revenue: [
    { label: 'Sales', value: 'Sales' },
    { label: 'Service', value: 'Service' },
    { label: 'Interest', value: 'Interest' },
    { label: 'Other Revenue', value: 'Other Revenue' },
  ],
  expense: [
    { label: 'Cost of Goods', value: 'Cost of Goods' },
    { label: 'Operating', value: 'Operating' },
    { label: 'Payroll', value: 'Payroll' },
    { label: 'Tax', value: 'Tax' },
    { label: 'Depreciation', value: 'Depreciation' },
    { label: 'Other Expense', value: 'Other Expense' },
  ],
};

// ─── Account Type Options ───────────────────────────────────
export const ACCOUNT_TYPE_OPTIONS: { label: string; value: Account['type'] }[] = [
  { label: 'Asset', value: 'asset' },
  { label: 'Liability', value: 'liability' },
  { label: 'Equity', value: 'equity' },
  { label: 'Revenue', value: 'revenue' },
  { label: 'Expense', value: 'expense' },
];

// ─── Number ranges per type for auto-suggest ────────────────
export const ACCOUNT_NUMBER_RANGES: Record<Account['type'], { start: number; end: number }> = {
  asset: { start: 1000, end: 1999 },
  liability: { start: 2000, end: 2999 },
  equity: { start: 3000, end: 3999 },
  revenue: { start: 4000, end: 4999 },
  expense: { start: 5000, end: 7999 },
};

/**
 * Suggest the next available account number for a given type.
 */
export const suggestNextAccountNumber = (
  type: Account['type'],
  existingAccounts: Account[]
): string => {
  const range = ACCOUNT_NUMBER_RANGES[type];
  const usedNumbers = existingAccounts
    .filter((a) => a.type === type)
    .map((a) => parseInt(a.accountNumber, 10))
    .filter((n) => !isNaN(n))
    .sort((a, b) => a - b);

  if (usedNumbers.length === 0) return String(range.start);

  // Find next gap or use last + 10
  const last = usedNumbers[usedNumbers.length - 1];
  const next = last + 10;
  if (next <= range.end) return String(next);

  // Fall back: find first gap in increments of 10
  for (let n = range.start; n <= range.end; n += 10) {
    if (!usedNumbers.includes(n)) return String(n);
  }

  return String(range.start);
};

// ─── Validation ─────────────────────────────────────────────
export interface AccountFormData {
  accountNumber: string;
  name: string;
  type: string;
  subType: string;
  parentAccountId: string | null;
  description: string;
  openingBalance: number;
  isActive: boolean;
}

/**
 * Validate account form data.
 * @param data - The form data to validate
 * @param existingAccounts - All existing accounts for uniqueness check
 * @param editingId - If editing, exclude this account from uniqueness check
 * @returns Record<string, string> - errors object (empty = valid)
 */
export const validateAccount = (
  data: AccountFormData,
  existingAccounts: Account[] = [],
  editingId?: string
): Record<string, string> => {
  const errors: Record<string, string> = {};

  // Account Number
  if (!data.accountNumber || !data.accountNumber.trim()) {
    errors.accountNumber = 'Account number is required';
  } else {
    const isDuplicate = existingAccounts.some(
      (a) =>
        a.accountNumber === data.accountNumber.trim() &&
        a.accountId !== editingId
    );
    if (isDuplicate) {
      errors.accountNumber = 'This account number already exists';
    }
  }

  // Name
  if (!data.name || !data.name.trim()) {
    errors.name = 'Account name is required';
  } else if (data.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  // Type
  if (!data.type) {
    errors.type = 'Account type is required';
  }

  // SubType
  if (!data.subType) {
    errors.subType = 'Sub type is required';
  }

  return errors;
};
