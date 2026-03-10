// ============================================================
// FINMATRIX - Credit Memos Dummy Data
// ============================================================
// 4 Credit Memos: 2 Open, 1 Applied, 1 Void
// Credits customer account — can be applied to invoices.

export interface CreditMemoLine {
  lineId: string;
  itemId: string | null;
  description: string;
  quantity: number;
  rate: number;
  amount: number;        // quantity * rate
  taxRate: number;
}

export type CreditMemoStatus =
  | 'open'
  | 'applied'
  | 'void';

export interface CreditMemo {
  creditMemoId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  creditMemoNumber: string;
  date: string;
  lines: CreditMemoLine[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  amountApplied: number;    // how much has been applied to invoices
  amountRemaining: number;  // total - amountApplied
  appliedToInvoices: string[];  // invoice IDs
  status: CreditMemoStatus;
  reason: string;             // reason for credit
  notes: string;
  createdAt: string;
}

export const creditMemos: CreditMemo[] = [
  // ── 1  CM-4001  Open ──────────────────────────────────────
  {
    creditMemoId: 'cm_001',
    companyId: 'company_1',
    customerId: 'cust_001',
    customerName: 'Acme Corp',
    creditMemoNumber: 'CM-4001',
    date: '2026-03-10',
    lines: [
      { lineId: 'cml_001_1', itemId: null, description: 'Defective Laser Printer — Return', quantity: 1, rate: 450, amount: 450, taxRate: 10 },
      { lineId: 'cml_001_2', itemId: null, description: 'Shipping Overcharge Correction', quantity: 1, rate: 75, amount: 75, taxRate: 0 },
    ],
    subtotal: 525,
    taxAmount: 45,
    discountAmount: 0,
    discountType: 'fixed',
    total: 570,
    amountApplied: 0,
    amountRemaining: 570,
    appliedToInvoices: [],
    status: 'open',
    reason: 'Product return — defective printer',
    notes: 'Customer reported printer malfunctioning within warranty period.',
    createdAt: '2026-03-10T10:00:00Z',
  },
  // ── 2  CM-4002  Open ──────────────────────────────────────
  {
    creditMemoId: 'cm_002',
    companyId: 'company_1',
    customerId: 'cust_004',
    customerName: 'Zeta Solutions',
    creditMemoNumber: 'CM-4002',
    date: '2026-03-08',
    lines: [
      { lineId: 'cml_002_1', itemId: null, description: 'Pricing Error on INV-1003', quantity: 1, rate: 250, amount: 250, taxRate: 10 },
    ],
    subtotal: 250,
    taxAmount: 25,
    discountAmount: 0,
    discountType: 'fixed',
    total: 275,
    amountApplied: 0,
    amountRemaining: 275,
    appliedToInvoices: [],
    status: 'open',
    reason: 'Pricing error on original invoice',
    notes: 'Customer was overcharged for consulting services.',
    createdAt: '2026-03-08T14:30:00Z',
  },
  // ── 3  CM-4003  Applied ───────────────────────────────────
  {
    creditMemoId: 'cm_003',
    companyId: 'company_1',
    customerId: 'cust_002',
    customerName: 'Beta Industries',
    creditMemoNumber: 'CM-4003',
    date: '2026-02-20',
    lines: [
      { lineId: 'cml_003_1', itemId: null, description: 'Unused Software Licenses x3', quantity: 3, rate: 200, amount: 600, taxRate: 10 },
    ],
    subtotal: 600,
    taxAmount: 60,
    discountAmount: 0,
    discountType: 'fixed',
    total: 660,
    amountApplied: 660,
    amountRemaining: 0,
    appliedToInvoices: ['inv_002'],
    status: 'applied',
    reason: 'Unused software licenses returned',
    notes: 'Applied to INV-1002. Customer downgraded plan.',
    createdAt: '2026-02-20T09:15:00Z',
  },
  // ── 4  CM-4004  Void ──────────────────────────────────────
  {
    creditMemoId: 'cm_004',
    companyId: 'company_1',
    customerId: 'cust_005',
    customerName: 'Epsilon Ltd',
    creditMemoNumber: 'CM-4004',
    date: '2026-01-25',
    lines: [
      { lineId: 'cml_004_1', itemId: null, description: 'Duplicate Credit — Voided', quantity: 1, rate: 180, amount: 180, taxRate: 10 },
    ],
    subtotal: 180,
    taxAmount: 18,
    discountAmount: 0,
    discountType: 'fixed',
    total: 198,
    amountApplied: 0,
    amountRemaining: 0,
    appliedToInvoices: [],
    status: 'void',
    reason: 'Duplicate credit memo — voided',
    notes: 'Issued in error, immediately voided.',
    createdAt: '2026-01-25T11:20:00Z',
  },
];
