// ============================================================
// FINMATRIX - Payments Dummy Data
// ============================================================
// 12 payments linked to the paid & partially-paid invoices.
// Each payment.amount = Σ appliedTo[].amount

export interface PaymentApplication {
  invoiceId: string;
  invoiceNumber: string;
  amount: number;
}

export type PaymentMethod =
  | 'cash'
  | 'check'
  | 'credit_card'
  | 'bank_transfer';

export interface Payment {
  paymentId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  date: string;
  method: PaymentMethod;
  referenceNumber: string;
  amount: number;
  appliedTo: PaymentApplication[];
  createdAt: string;
}

export const payments: Payment[] = [
  // ── 1  Beta LLC  →  INV-1010 ($3,850 paid) ───────────────
  {
    paymentId: 'pay_001',
    companyId: 'company_1',
    customerId: 'cust_002',
    customerName: 'Beta LLC',
    date: '2026-02-05',
    method: 'bank_transfer',
    referenceNumber: 'BT-20260205-001',
    amount: 3850,
    appliedTo: [
      { invoiceId: 'inv_010', invoiceNumber: 'INV-1010', amount: 3850 },
    ],
    createdAt: '2026-02-05T10:30:00Z',
  },

  // ── 2  Mu Healthcare  →  INV-1011 ($4,725 paid) ──────────
  {
    paymentId: 'pay_002',
    companyId: 'company_1',
    customerId: 'cust_011',
    customerName: 'Mu Healthcare',
    date: '2026-01-28',
    method: 'credit_card',
    referenceNumber: 'CC-4521',
    amount: 4725,
    appliedTo: [
      { invoiceId: 'inv_011', invoiceNumber: 'INV-1011', amount: 4725 },
    ],
    createdAt: '2026-01-28T14:00:00Z',
  },

  // ── 3  Nu Construction  →  INV-1012 ($4,850 paid) ────────
  {
    paymentId: 'pay_003',
    companyId: 'company_1',
    customerId: 'cust_012',
    customerName: 'Nu Construction',
    date: '2026-02-10',
    method: 'check',
    referenceNumber: 'CHK-4812',
    amount: 4850,
    appliedTo: [
      { invoiceId: 'inv_012', invoiceNumber: 'INV-1012', amount: 4850 },
    ],
    createdAt: '2026-02-10T09:15:00Z',
  },

  // ── 4  Acme Corp  →  INV-1013 ($5,280 paid) ──────────────
  {
    paymentId: 'pay_004',
    companyId: 'company_1',
    customerId: 'cust_001',
    customerName: 'Acme Corp',
    date: '2026-02-12',
    method: 'bank_transfer',
    referenceNumber: 'BT-20260212-004',
    amount: 5280,
    appliedTo: [
      { invoiceId: 'inv_013', invoiceNumber: 'INV-1013', amount: 5280 },
    ],
    createdAt: '2026-02-12T11:30:00Z',
  },

  // ── 5  Zeta Logistics  →  INV-1014 ($4,700 paid) ─────────
  {
    paymentId: 'pay_005',
    companyId: 'company_1',
    customerId: 'cust_006',
    customerName: 'Zeta Logistics',
    date: '2026-01-10',
    method: 'bank_transfer',
    referenceNumber: 'BT-20260110-005',
    amount: 4700,
    appliedTo: [
      { invoiceId: 'inv_014', invoiceNumber: 'INV-1014', amount: 4700 },
    ],
    createdAt: '2026-01-10T10:00:00Z',
  },

  // ── 6  Epsilon Tech  →  INV-1005 partial ($2,000) ────────
  {
    paymentId: 'pay_006',
    companyId: 'company_1',
    customerId: 'cust_005',
    customerName: 'Epsilon Tech',
    date: '2026-02-20',
    method: 'credit_card',
    referenceNumber: 'CC-8891',
    amount: 2000,
    appliedTo: [
      { invoiceId: 'inv_005', invoiceNumber: 'INV-1005', amount: 2000 },
    ],
    createdAt: '2026-02-20T13:45:00Z',
  },

  // ── 7  Omicron Retail  →  INV-1007 partial ($1,000) ──────
  {
    paymentId: 'pay_007',
    companyId: 'company_1',
    customerId: 'cust_014',
    customerName: 'Omicron Retail',
    date: '2026-02-22',
    method: 'cash',
    referenceNumber: 'CASH-0222',
    amount: 1000,
    appliedTo: [
      { invoiceId: 'inv_007', invoiceNumber: 'INV-1007', amount: 1000 },
    ],
    createdAt: '2026-02-22T12:00:00Z',
  },

  // ── 8  Iota Consulting  →  INV-1008 partial ($500) ───────
  {
    paymentId: 'pay_008',
    companyId: 'company_1',
    customerId: 'cust_008',
    customerName: 'Iota Consulting',
    date: '2026-02-25',
    method: 'bank_transfer',
    referenceNumber: 'BT-20260225-008',
    amount: 500,
    appliedTo: [
      { invoiceId: 'inv_008', invoiceNumber: 'INV-1008', amount: 500 },
    ],
    createdAt: '2026-02-25T16:00:00Z',
  },

  // ── 9  Epsilon Tech  →  INV-1015 partial ($500) ──────────
  {
    paymentId: 'pay_009',
    companyId: 'company_1',
    customerId: 'cust_005',
    customerName: 'Epsilon Tech',
    date: '2026-01-20',
    method: 'check',
    referenceNumber: 'CHK-3009',
    amount: 500,
    appliedTo: [
      { invoiceId: 'inv_015', invoiceNumber: 'INV-1015', amount: 500 },
    ],
    createdAt: '2026-01-20T09:30:00Z',
  },

  // ── 10  Xi Education  →  INV-1017 partial ($800) ─────────
  {
    paymentId: 'pay_010',
    companyId: 'company_1',
    customerId: 'cust_013',
    customerName: 'Xi Education',
    date: '2025-12-15',
    method: 'bank_transfer',
    referenceNumber: 'BT-20251215-010',
    amount: 800,
    appliedTo: [
      { invoiceId: 'inv_017', invoiceNumber: 'INV-1017', amount: 800 },
    ],
    createdAt: '2025-12-15T10:00:00Z',
  },

  // ── 11  Acme Corp  →  split across two old invoices ──────
  {
    paymentId: 'pay_011',
    companyId: 'company_1',
    customerId: 'cust_001',
    customerName: 'Acme Corp',
    date: '2025-11-30',
    method: 'cash',
    referenceNumber: 'CASH-1130',
    amount: 1500,
    appliedTo: [
      { invoiceId: 'inv_013', invoiceNumber: 'INV-1013', amount: 1000 },
      { invoiceId: 'inv_001', invoiceNumber: 'INV-1001', amount: 500 },
    ],
    createdAt: '2025-11-30T15:00:00Z',
  },

  // ── 12  Delta Services  →  advance deposit ───────────────
  {
    paymentId: 'pay_012',
    companyId: 'company_1',
    customerId: 'cust_004',
    customerName: 'Delta Services',
    date: '2026-02-14',
    method: 'credit_card',
    referenceNumber: 'CC-7102',
    amount: 750,
    appliedTo: [
      { invoiceId: 'inv_004', invoiceNumber: 'INV-1004', amount: 750 },
    ],
    createdAt: '2026-02-14T08:45:00Z',
  },
];
