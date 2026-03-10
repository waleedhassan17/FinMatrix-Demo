// ============================================================
// FINMATRIX - Invoice Validation Model
// ============================================================

import { InvoiceLine } from '../dummy-data/invoices';

// ─── Form Data ──────────────────────────────────────────────
export interface InvoiceFormData {
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  lines: InvoiceLine[];
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  notes: string;
  paymentTerms: string;
}

export interface InvoiceValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ─── Validation ─────────────────────────────────────────────

/**
 * Validate an invoice form.
 * Rules:
 *   - customer required
 *   - at least one line item
 *   - every line needs description, rate > 0, qty > 0
 */
export const validateInvoice = (
  data: InvoiceFormData,
): InvoiceValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.customerId) {
    errors.customer = 'Customer is required';
  }

  if (!data.date) {
    errors.date = 'Invoice date is required';
  }

  if (data.lines.length === 0) {
    errors.lines = 'At least one line item is required';
  }

  data.lines.forEach((line, i) => {
    if (!line.description.trim()) {
      errors[`line_${i}_desc`] = `Line ${i + 1}: description is required`;
    }
    if (line.rate <= 0) {
      errors[`line_${i}_rate`] = `Line ${i + 1}: rate must be greater than 0`;
    }
    if (line.quantity <= 0) {
      errors[`line_${i}_qty`] = `Line ${i + 1}: quantity must be greater than 0`;
    }
  });

  if (data.discountAmount < 0) {
    errors.discount = 'Discount cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ─── Calculation helpers ────────────────────────────────────

/** Compute a single line amount (qty × rate). */
export const calcLineAmount = (qty: number, rate: number): number =>
  Math.round(qty * rate * 100) / 100;

/** Compute totals from lines + discount. */
export const calcInvoiceTotals = (
  lines: InvoiceLine[],
  discountAmount: number,
  discountType: 'percentage' | 'fixed',
) => {
  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const taxAmount = lines.reduce(
    (s, l) => s + (l.quantity * l.rate * l.taxRate) / 100,
    0,
  );
  const actualDiscount =
    discountType === 'percentage'
      ? Math.round(subtotal * discountAmount) / 100
      : discountAmount;
  const total = Math.round((subtotal + taxAmount - actualDiscount) * 100) / 100;

  return { subtotal, taxAmount: Math.round(taxAmount * 100) / 100, actualDiscount, total };
};

// ─── Constants ──────────────────────────────────────────────

export const TAX_RATE_OPTIONS = [
  { label: '0 %', value: '0' },
  { label: '5 %', value: '5' },
  { label: '10 %', value: '10' },
  { label: '15 %', value: '15' },
];

export const PAYMENT_TERMS_OPTIONS = [
  { label: 'Due on Receipt', value: 'due_on_receipt' },
  { label: 'Net 15', value: 'net_15' },
  { label: 'Net 30', value: 'net_30' },
  { label: 'Net 45', value: 'net_45' },
  { label: 'Net 60', value: 'net_60' },
];

export const PAYMENT_TERMS_DAYS: Record<string, number> = {
  due_on_receipt: 0,
  net_15: 15,
  net_30: 30,
  net_45: 45,
  net_60: 60,
};

/** Create a blank InvoiceLine */
export const blankLine = (): InvoiceLine => ({
  lineId: `line_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  itemId: null,
  description: '',
  quantity: 1,
  rate: 0,
  amount: 0,
  taxRate: 0,
});
