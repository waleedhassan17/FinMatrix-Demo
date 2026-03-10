// ============================================================
// FINMATRIX - Journal Entries Dummy Data
// ============================================================

export interface JournalLine {
  lineId: string;
  accountId: string;
  accountName: string;
  accountNumber: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntry {
  entryId: string;
  companyId: string;
  date: string;
  reference: string;
  memo: string;
  lines: JournalLine[];
  status: 'draft' | 'posted' | 'void';
  createdBy: string;
  createdAt: string;
}

export const journalEntries: JournalEntry[] = [
  // ─── 1. Opening Balance - Assets ─────────────────────────
  {
    entryId: 'je_001',
    companyId: 'company_1',
    date: '2026-01-01',
    reference: 'JE-001',
    memo: 'Opening balances - Assets',
    lines: [
      { lineId: 'jl_001a', accountId: 'acc_001', accountName: 'Cash', accountNumber: '1000', description: 'Opening cash balance', debit: 15000, credit: 0 },
      { lineId: 'jl_001b', accountId: 'acc_002', accountName: 'Checking Account', accountNumber: '1010', description: 'Opening checking balance', debit: 42000, credit: 0 },
      { lineId: 'jl_001c', accountId: 'acc_018', accountName: 'Owner\'s Equity', accountNumber: '3000', description: 'Owner\'s capital contribution', debit: 0, credit: 57000 },
    ],
    status: 'posted',
    createdBy: 'admin',
    createdAt: '2026-01-01T08:00:00Z',
  },

  // ─── 2. Opening Balance - Receivables ────────────────────
  {
    entryId: 'je_002',
    companyId: 'company_1',
    date: '2026-01-01',
    reference: 'JE-002',
    memo: 'Opening balances - Accounts Receivable',
    lines: [
      { lineId: 'jl_002a', accountId: 'acc_004', accountName: 'Accounts Receivable', accountNumber: '1100', description: 'Opening AR balance', debit: 28500, credit: 0 },
      { lineId: 'jl_002b', accountId: 'acc_018', accountName: 'Owner\'s Equity', accountNumber: '3000', description: 'Capital contribution', debit: 0, credit: 28500 },
    ],
    status: 'posted',
    createdBy: 'admin',
    createdAt: '2026-01-01T08:05:00Z',
  },

  // ─── 3. Sales - Consulting Invoice ───────────────────────
  {
    entryId: 'je_003',
    companyId: 'company_1',
    date: '2026-02-05',
    reference: 'JE-003',
    memo: 'Invoice #1042 - Acme Corp consulting services',
    lines: [
      { lineId: 'jl_003a', accountId: 'acc_004', accountName: 'Accounts Receivable', accountNumber: '1100', description: 'Acme Corp - consulting', debit: 8500, credit: 0 },
      { lineId: 'jl_003b', accountId: 'acc_020', accountName: 'Service Revenue', accountNumber: '4000', description: 'Consulting revenue', debit: 0, credit: 8500 },
    ],
    status: 'posted',
    createdBy: 'admin',
    createdAt: '2026-02-05T10:30:00Z',
  },

  // ─── 4. Sales - Product Sale ─────────────────────────────
  {
    entryId: 'je_004',
    companyId: 'company_1',
    date: '2026-02-12',
    reference: 'JE-004',
    memo: 'Invoice #1043 - Beta LLC product sale',
    lines: [
      { lineId: 'jl_004a', accountId: 'acc_004', accountName: 'Accounts Receivable', accountNumber: '1100', description: 'Beta LLC - product sale', debit: 4200, credit: 0 },
      { lineId: 'jl_004b', accountId: 'acc_021', accountName: 'Product Sales', accountNumber: '4100', description: 'Product revenue', debit: 0, credit: 3600 },
      { lineId: 'jl_004c', accountId: 'acc_023', accountName: 'Sales Tax Payable', accountNumber: '2100', description: 'Sales tax collected', debit: 0, credit: 600 },
    ],
    status: 'posted',
    createdBy: 'admin',
    createdAt: '2026-02-12T14:00:00Z',
  },

  // ─── 5. Bank Deposit ─────────────────────────────────────
  {
    entryId: 'je_005',
    companyId: 'company_1',
    date: '2026-02-15',
    reference: 'JE-005',
    memo: 'Customer payment deposit - Acme Corp',
    lines: [
      { lineId: 'jl_005a', accountId: 'acc_002', accountName: 'Checking Account', accountNumber: '1010', description: 'Deposit from Acme Corp', debit: 8500, credit: 0 },
      { lineId: 'jl_005b', accountId: 'acc_004', accountName: 'Accounts Receivable', accountNumber: '1100', description: 'Payment received', debit: 0, credit: 8500 },
    ],
    status: 'posted',
    createdBy: 'admin',
    createdAt: '2026-02-15T09:00:00Z',
  },

  // ─── 6. Expense - Rent ───────────────────────────────────
  {
    entryId: 'je_006',
    companyId: 'company_1',
    date: '2026-02-01',
    reference: 'JE-006',
    memo: 'Office rent payment - February 2026',
    lines: [
      { lineId: 'jl_006a', accountId: 'acc_027', accountName: 'Rent Expense', accountNumber: '5100', description: 'Feb office rent', debit: 4500, credit: 0 },
      { lineId: 'jl_006b', accountId: 'acc_002', accountName: 'Checking Account', accountNumber: '1010', description: 'Rent payment', debit: 0, credit: 4500 },
    ],
    status: 'posted',
    createdBy: 'admin',
    createdAt: '2026-02-01T08:00:00Z',
  },

  // ─── 7. Expense - Utilities ──────────────────────────────
  {
    entryId: 'je_007',
    companyId: 'company_1',
    date: '2026-02-10',
    reference: 'JE-007',
    memo: 'Utility bill payment - Electricity & Water',
    lines: [
      { lineId: 'jl_007a', accountId: 'acc_028', accountName: 'Utilities Expense', accountNumber: '5200', description: 'Electricity', debit: 650, credit: 0 },
      { lineId: 'jl_007b', accountId: 'acc_028', accountName: 'Utilities Expense', accountNumber: '5200', description: 'Water', debit: 180, credit: 0 },
      { lineId: 'jl_007c', accountId: 'acc_002', accountName: 'Checking Account', accountNumber: '1010', description: 'Utility payment', debit: 0, credit: 830 },
    ],
    status: 'posted',
    createdBy: 'admin',
    createdAt: '2026-02-10T11:00:00Z',
  },

  // ─── 8. Payroll ──────────────────────────────────────────
  {
    entryId: 'je_008',
    companyId: 'company_1',
    date: '2026-02-28',
    reference: 'JE-008',
    memo: 'February payroll run',
    lines: [
      { lineId: 'jl_008a', accountId: 'acc_026', accountName: 'Salaries & Wages', accountNumber: '5000', description: 'Gross salaries', debit: 18500, credit: 0 },
      { lineId: 'jl_008b', accountId: 'acc_002', accountName: 'Checking Account', accountNumber: '1010', description: 'Net payroll disbursement', debit: 0, credit: 15200 },
      { lineId: 'jl_008c', accountId: 'acc_015', accountName: 'Accounts Payable', accountNumber: '2000', description: 'Payroll taxes payable', debit: 0, credit: 3300 },
    ],
    status: 'posted',
    createdBy: 'admin',
    createdAt: '2026-02-28T16:00:00Z',
  },

  // ─── 9. Inventory Purchase ───────────────────────────────
  {
    entryId: 'je_009',
    companyId: 'company_1',
    date: '2026-02-20',
    reference: 'JE-009',
    memo: 'Inventory purchase - Raw materials from Gamma Inc',
    lines: [
      { lineId: 'jl_009a', accountId: 'acc_005', accountName: 'Inventory', accountNumber: '1200', description: 'Raw materials', debit: 12000, credit: 0 },
      { lineId: 'jl_009b', accountId: 'acc_015', accountName: 'Accounts Payable', accountNumber: '2000', description: 'Gamma Inc - vendor bill', debit: 0, credit: 12000 },
    ],
    status: 'posted',
    createdBy: 'admin',
    createdAt: '2026-02-20T13:00:00Z',
  },

  // ─── 10. Depreciation ────────────────────────────────────
  {
    entryId: 'je_010',
    companyId: 'company_1',
    date: '2026-02-28',
    reference: 'JE-010',
    memo: 'Monthly depreciation - February 2026',
    lines: [
      { lineId: 'jl_010a', accountId: 'acc_031', accountName: 'Depreciation Expense', accountNumber: '5500', description: 'Office equipment depreciation', debit: 3000, credit: 0 },
      { lineId: 'jl_010b', accountId: 'acc_031', accountName: 'Depreciation Expense', accountNumber: '5500', description: 'Vehicle depreciation', debit: 1980, credit: 0 },
      { lineId: 'jl_010c', accountId: 'acc_009', accountName: 'Accumulated Depreciation', accountNumber: '1510', description: 'Accumulated depreciation', debit: 0, credit: 4980 },
    ],
    status: 'posted',
    createdBy: 'admin',
    createdAt: '2026-02-28T17:00:00Z',
  },

  // ─── 11. Draft - March Rent ──────────────────────────────
  {
    entryId: 'je_011',
    companyId: 'company_1',
    date: '2026-03-01',
    reference: 'JE-011',
    memo: 'Office rent payment - March 2026',
    lines: [
      { lineId: 'jl_011a', accountId: 'acc_027', accountName: 'Rent Expense', accountNumber: '5100', description: 'March office rent', debit: 4500, credit: 0 },
      { lineId: 'jl_011b', accountId: 'acc_002', accountName: 'Checking Account', accountNumber: '1010', description: 'Rent payment', debit: 0, credit: 4500 },
    ],
    status: 'draft',
    createdBy: 'admin',
    createdAt: '2026-03-01T08:00:00Z',
  },

  // ─── 12. Draft - Office Supplies ─────────────────────────
  {
    entryId: 'je_012',
    companyId: 'company_1',
    date: '2026-03-02',
    reference: 'JE-012',
    memo: 'Office supplies purchase - Staples order',
    lines: [
      { lineId: 'jl_012a', accountId: 'acc_030', accountName: 'Office Supplies', accountNumber: '5400', description: 'Paper & printer cartridges', debit: 320, credit: 0 },
      { lineId: 'jl_012b', accountId: 'acc_001', accountName: 'Cash', accountNumber: '1000', description: 'Cash payment', debit: 0, credit: 320 },
    ],
    status: 'draft',
    createdBy: 'admin',
    createdAt: '2026-03-02T10:00:00Z',
  },

  // ─── 13. Void - Duplicate Entry ──────────────────────────
  {
    entryId: 'je_013',
    companyId: 'company_1',
    date: '2026-02-08',
    reference: 'JE-013',
    memo: 'VOID - Duplicate utility payment (see JE-007)',
    lines: [
      { lineId: 'jl_013a', accountId: 'acc_028', accountName: 'Utilities Expense', accountNumber: '5200', description: 'Duplicate electricity', debit: 650, credit: 0 },
      { lineId: 'jl_013b', accountId: 'acc_002', accountName: 'Checking Account', accountNumber: '1010', description: 'Duplicate payment', debit: 0, credit: 650 },
    ],
    status: 'void',
    createdBy: 'admin',
    createdAt: '2026-02-08T14:00:00Z',
  },

  // ─── 14. Draft - New Consulting Invoice ──────────────────
  {
    entryId: 'je_014',
    companyId: 'company_1',
    date: '2026-03-03',
    reference: 'JE-014',
    memo: 'Invoice #1044 - Delta Corp annual subscription',
    lines: [
      { lineId: 'jl_014a', accountId: 'acc_004', accountName: 'Accounts Receivable', accountNumber: '1100', description: 'Delta Corp subscription', debit: 15000, credit: 0 },
      { lineId: 'jl_014b', accountId: 'acc_020', accountName: 'Service Revenue', accountNumber: '4000', description: 'Subscription revenue', debit: 0, credit: 15000 },
    ],
    status: 'draft',
    createdBy: 'admin',
    createdAt: '2026-03-03T09:00:00Z',
  },

  // ─── 15. Closing Entry - Revenue to Retained Earnings ────
  {
    entryId: 'je_015',
    companyId: 'company_1',
    date: '2026-01-31',
    reference: 'JE-015',
    memo: 'January closing - Transfer revenue to retained earnings',
    lines: [
      { lineId: 'jl_015a', accountId: 'acc_020', accountName: 'Service Revenue', accountNumber: '4000', description: 'Close service revenue', debit: 5200, credit: 0 },
      { lineId: 'jl_015b', accountId: 'acc_019', accountName: 'Retained Earnings', accountNumber: '3100', description: 'Transfer to retained earnings', debit: 0, credit: 5200 },
    ],
    status: 'posted',
    createdBy: 'admin',
    createdAt: '2026-01-31T23:00:00Z',
  },
];
