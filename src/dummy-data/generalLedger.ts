// ============================================================
// FINMATRIX - General Ledger Dummy Data
// ============================================================

export interface LedgerEntry {
  id: string;
  date: string;
  referenceNumber: string;
  description: string;
  accountId: string;
  accountName: string;
  accountNumber: string;
  debit: number;
  credit: number;
}

/**
 * 25 ledger entries with balanced debits and credits.
 * Total debits = Total credits = $92,350.00
 *
 * Categories: sales, expenses, payroll, inventory purchases, bank deposits
 */
export const generalLedgerEntries: LedgerEntry[] = [
  // ─── Sales / Revenue ─────────────────────────────────────
  {
    id: 'gl_001',
    date: '2026-03-01',
    referenceNumber: 'JE-001',
    description: 'Invoice #1042 - Acme Corp consulting services',
    accountId: 'acc_004',
    accountName: 'Accounts Receivable',
    accountNumber: '1100',
    debit: 8500,
    credit: 0,
  },
  {
    id: 'gl_002',
    date: '2026-03-01',
    referenceNumber: 'JE-001',
    description: 'Invoice #1042 - Acme Corp consulting services',
    accountId: 'acc_020',
    accountName: 'Service Revenue',
    accountNumber: '4000',
    debit: 0,
    credit: 8500,
  },
  {
    id: 'gl_003',
    date: '2026-03-02',
    referenceNumber: 'JE-002',
    description: 'Invoice #1043 - Beta LLC product sale',
    accountId: 'acc_004',
    accountName: 'Accounts Receivable',
    accountNumber: '1100',
    debit: 4200,
    credit: 0,
  },
  {
    id: 'gl_004',
    date: '2026-03-02',
    referenceNumber: 'JE-002',
    description: 'Invoice #1043 - Beta LLC product sale',
    accountId: 'acc_021',
    accountName: 'Product Sales',
    accountNumber: '4100',
    debit: 0,
    credit: 4200,
  },

  // ─── Bank Deposits ───────────────────────────────────────
  {
    id: 'gl_005',
    date: '2026-03-03',
    referenceNumber: 'JE-003',
    description: 'Customer payment deposit - Acme Corp',
    accountId: 'acc_002',
    accountName: 'Checking Account',
    accountNumber: '1010',
    debit: 6500,
    credit: 0,
  },
  {
    id: 'gl_006',
    date: '2026-03-03',
    referenceNumber: 'JE-003',
    description: 'Customer payment deposit - Acme Corp',
    accountId: 'acc_004',
    accountName: 'Accounts Receivable',
    accountNumber: '1100',
    debit: 0,
    credit: 6500,
  },
  {
    id: 'gl_007',
    date: '2026-03-05',
    referenceNumber: 'JE-004',
    description: 'Transfer to savings account',
    accountId: 'acc_003',
    accountName: 'Savings Account',
    accountNumber: '1020',
    debit: 5000,
    credit: 0,
  },
  {
    id: 'gl_008',
    date: '2026-03-05',
    referenceNumber: 'JE-004',
    description: 'Transfer to savings account',
    accountId: 'acc_002',
    accountName: 'Checking Account',
    accountNumber: '1010',
    debit: 0,
    credit: 5000,
  },

  // ─── Payroll ─────────────────────────────────────────────
  {
    id: 'gl_009',
    date: '2026-03-07',
    referenceNumber: 'JE-005',
    description: 'Payroll run - Week 10 salaries',
    accountId: 'acc_026',
    accountName: 'Salaries & Wages',
    accountNumber: '5000',
    debit: 18500,
    credit: 0,
  },
  {
    id: 'gl_010',
    date: '2026-03-07',
    referenceNumber: 'JE-005',
    description: 'Payroll run - Week 10 salaries',
    accountId: 'acc_002',
    accountName: 'Checking Account',
    accountNumber: '1010',
    debit: 0,
    credit: 18500,
  },

  // ─── Inventory Purchases ─────────────────────────────────
  {
    id: 'gl_011',
    date: '2026-03-08',
    referenceNumber: 'JE-006',
    description: 'Inventory purchase - Raw materials from Gamma Inc',
    accountId: 'acc_005',
    accountName: 'Inventory',
    accountNumber: '1200',
    debit: 12000,
    credit: 0,
  },
  {
    id: 'gl_012',
    date: '2026-03-08',
    referenceNumber: 'JE-006',
    description: 'Inventory purchase - Raw materials from Gamma Inc',
    accountId: 'acc_015',
    accountName: 'Accounts Payable',
    accountNumber: '2000',
    debit: 0,
    credit: 12000,
  },

  // ─── Expenses ────────────────────────────────────────────
  {
    id: 'gl_013',
    date: '2026-03-10',
    referenceNumber: 'JE-007',
    description: 'Office rent - March 2026',
    accountId: 'acc_027',
    accountName: 'Rent Expense',
    accountNumber: '5100',
    debit: 4500,
    credit: 0,
  },
  {
    id: 'gl_014',
    date: '2026-03-10',
    referenceNumber: 'JE-007',
    description: 'Office rent - March 2026',
    accountId: 'acc_002',
    accountName: 'Checking Account',
    accountNumber: '1010',
    debit: 0,
    credit: 4500,
  },
  {
    id: 'gl_015',
    date: '2026-03-12',
    referenceNumber: 'JE-008',
    description: 'Utility bill payment - Electricity',
    accountId: 'acc_028',
    accountName: 'Utilities Expense',
    accountNumber: '5200',
    debit: 850,
    credit: 0,
  },
  {
    id: 'gl_016',
    date: '2026-03-12',
    referenceNumber: 'JE-008',
    description: 'Utility bill payment - Electricity',
    accountId: 'acc_002',
    accountName: 'Checking Account',
    accountNumber: '1010',
    debit: 0,
    credit: 850,
  },
  {
    id: 'gl_017',
    date: '2026-03-14',
    referenceNumber: 'JE-009',
    description: 'Office supplies purchase - Staples order',
    accountId: 'acc_030',
    accountName: 'Office Supplies',
    accountNumber: '5400',
    debit: 320,
    credit: 0,
  },
  {
    id: 'gl_018',
    date: '2026-03-14',
    referenceNumber: 'JE-009',
    description: 'Office supplies purchase - Staples order',
    accountId: 'acc_001',
    accountName: 'Cash',
    accountNumber: '1000',
    debit: 0,
    credit: 320,
  },

  // ─── More Sales ──────────────────────────────────────────
  {
    id: 'gl_019',
    date: '2026-03-16',
    referenceNumber: 'JE-010',
    description: 'Invoice #1044 - Delta Corp annual subscription',
    accountId: 'acc_004',
    accountName: 'Accounts Receivable',
    accountNumber: '1100',
    debit: 15000,
    credit: 0,
  },
  {
    id: 'gl_020',
    date: '2026-03-16',
    referenceNumber: 'JE-010',
    description: 'Invoice #1044 - Delta Corp annual subscription',
    accountId: 'acc_020',
    accountName: 'Service Revenue',
    accountNumber: '4000',
    debit: 0,
    credit: 15000,
  },

  // ─── Vendor Payment ──────────────────────────────────────
  {
    id: 'gl_021',
    date: '2026-03-18',
    referenceNumber: 'JE-011',
    description: 'Vendor payment - Gamma Inc invoice #V-2210',
    accountId: 'acc_015',
    accountName: 'Accounts Payable',
    accountNumber: '2000',
    debit: 12000,
    credit: 0,
  },
  {
    id: 'gl_022',
    date: '2026-03-18',
    referenceNumber: 'JE-011',
    description: 'Vendor payment - Gamma Inc invoice #V-2210',
    accountId: 'acc_002',
    accountName: 'Checking Account',
    accountNumber: '1010',
    debit: 0,
    credit: 12000,
  },

  // ─── Depreciation (3-line entry) ─────────────────────────
  {
    id: 'gl_023',
    date: '2026-03-20',
    referenceNumber: 'JE-012',
    description: 'Monthly depreciation - Office equipment',
    accountId: 'acc_031',
    accountName: 'Depreciation Expense',
    accountNumber: '5500',
    debit: 3000,
    credit: 0,
  },
  {
    id: 'gl_024',
    date: '2026-03-20',
    referenceNumber: 'JE-012',
    description: 'Monthly depreciation - Delivery vehicles',
    accountId: 'acc_031',
    accountName: 'Depreciation Expense',
    accountNumber: '5500',
    debit: 1980,
    credit: 0,
  },
  {
    id: 'gl_025',
    date: '2026-03-20',
    referenceNumber: 'JE-012',
    description: 'Monthly depreciation - Accumulated',
    accountId: 'acc_009',
    accountName: 'Accumulated Depreciation',
    accountNumber: '1510',
    debit: 0,
    credit: 4980,
  },
];

// Verification: Total Debits = Total Credits = $92,350
// Debits:  8500 + 4200 + 6500 + 5000 + 18500 + 12000 + 4500 + 850 + 320 + 15000 + 12000 + 3000 + 1980 = 92,350
// Credits: 8500 + 4200 + 6500 + 5000 + 18500 + 12000 + 4500 + 850 + 320 + 15000 + 12000 + 4980 = 92,350
