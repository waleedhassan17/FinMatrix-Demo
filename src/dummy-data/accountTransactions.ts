// ============================================================
// FINMATRIX - Account Transactions Dummy Data
// ============================================================

export interface AccountTransaction {
  id: string;
  date: string;
  reference: string;
  memo: string;
  debit: number;
  credit: number;
  balance: number;
}

/**
 * Returns 10 dummy transactions for a given account.
 * In production, this would be an API call filtered by accountId.
 */
export const getAccountTransactions = (
  accountId: string
): AccountTransaction[] => {
  // Seed a deterministic but varied set based on accountId
  const seed = accountId
    .split('')
    .reduce((sum, c) => sum + c.charCodeAt(0), 0);

  const templates = [
    {
      reference: 'INV-1042',
      memo: 'Invoice payment from Acme Corp',
      debit: 3200,
      credit: 0,
    },
    {
      reference: 'EXP-0318',
      memo: 'Office supplies - Staples order',
      debit: 0,
      credit: 450,
    },
    {
      reference: 'JE-0089',
      memo: 'Monthly depreciation entry',
      debit: 0,
      credit: 625,
    },
    {
      reference: 'INV-1038',
      memo: 'Service revenue - Beta LLC',
      debit: 1800,
      credit: 0,
    },
    {
      reference: 'PAY-0312',
      memo: 'Payroll run - Week 10',
      debit: 0,
      credit: 12400,
    },
    {
      reference: 'REC-0445',
      memo: 'Customer payment received',
      debit: 5600,
      credit: 0,
    },
    {
      reference: 'BILL-0221',
      memo: 'Vendor bill - Raw materials',
      debit: 0,
      credit: 2850,
    },
    {
      reference: 'TRF-0067',
      memo: 'Transfer to savings account',
      debit: 0,
      credit: 5000,
    },
    {
      reference: 'INV-1035',
      memo: 'Product sale - Gamma Inc',
      debit: 4200,
      credit: 0,
    },
    {
      reference: 'ADJ-0012',
      memo: 'Inventory adjustment',
      debit: 320,
      credit: 0,
    },
  ];

  let runningBalance = 10000 + (seed % 5000);
  const today = new Date();

  return templates.map((t, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (i * 3 + (seed % 3)));

    runningBalance = runningBalance + t.debit - t.credit;

    return {
      id: `txn_${accountId}_${i}`,
      date: date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      reference: t.reference,
      memo: t.memo,
      debit: t.debit,
      credit: t.credit,
      balance: runningBalance,
    };
  });
};
