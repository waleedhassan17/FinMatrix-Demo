// ============================================================
// FINMATRIX - Bill Model (Validation & Calculations)
// ============================================================
import { Bill, BillLine } from '../dummy-data/bills';

/* ── Tax Rate Options ────────────────────────────────────── */
export const TAX_RATE_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '10%', value: 10 },
  { label: '15%', value: 15 },
];

/* ── Payment Terms ───────────────────────────────────────── */
export const PAYMENT_TERMS_OPTIONS = [
  { label: 'Net 15', value: 'net_15' },
  { label: 'Net 30', value: 'net_30' },
  { label: 'Net 45', value: 'net_45' },
  { label: 'Net 60', value: 'net_60' },
  { label: 'Due on Receipt', value: 'due_on_receipt' },
];

export const PAYMENT_TERMS_DAYS: Record<string, number> = {
  net_15: 15,
  net_30: 30,
  net_45: 45,
  net_60: 60,
  due_on_receipt: 0,
};

/* ── Payment Method Options ──────────────────────────────── */
export const PAYMENT_METHOD_OPTIONS = [
  { label: 'Check', value: 'check' },
  { label: 'ACH Transfer', value: 'ach' },
  { label: 'Wire Transfer', value: 'wire' },
  { label: 'Credit Card', value: 'credit_card' },
  { label: 'Cash', value: 'cash' },
];

/* ── Bank Account Options (from COA asset accounts) ──────── */
export const BANK_ACCOUNT_OPTIONS = [
  { label: 'Cash (1000)', value: 'acc_001' },
  { label: 'Checking Account (1010)', value: 'acc_002' },
  { label: 'Savings Account (1020)', value: 'acc_003' },
];

/* ── Blank line factory ──────────────────────────────────── */
export const blankBillLine = (): BillLine => ({
  lineId: `bl_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  accountId: '',
  accountName: '',
  description: '',
  amount: 0,
  taxRate: 10,
});

/* ── Calculations ────────────────────────────────────────── */
export const calcBillTotals = (
  lines: BillLine[],
): { subtotal: number; taxAmount: number; total: number } => {
  let subtotal = 0;
  let taxAmount = 0;

  for (const line of lines) {
    subtotal += line.amount;
    taxAmount += line.amount * (line.taxRate / 100);
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
  };
};

/* ── Validation ──────────────────────────────────────────── */
export const validateBill = (
  bill: Partial<Bill>,
): string[] => {
  const errors: string[] = [];

  if (!bill.vendorId) errors.push('Vendor is required.');
  if (!bill.date) errors.push('Bill date is required.');
  if (!bill.dueDate) errors.push('Due date is required.');

  if (!bill.lines || bill.lines.length === 0) {
    errors.push('At least one line item is required.');
  } else {
    bill.lines.forEach((line, i) => {
      if (!line.accountId) errors.push(`Line ${i + 1}: Expense account is required.`);
      if (!line.description?.trim()) errors.push(`Line ${i + 1}: Description is required.`);
      if (line.amount <= 0) errors.push(`Line ${i + 1}: Amount must be greater than 0.`);
    });
  }

  return errors;
};
