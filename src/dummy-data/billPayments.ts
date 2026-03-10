// ============================================================
// FINMATRIX - Bill Payments Dummy Data
// ============================================================
// 8 bill payments linked to bills in bills.ts
// bank accounts reference COA asset accounts (acc_001, acc_002, acc_003)

export interface BillPaymentApplication {
  billId: string;
  billNumber: string;
  amount: number;
}

export type PaymentMethod = 'check' | 'ach' | 'wire' | 'credit_card' | 'cash';

export interface BillPayment {
  paymentId: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  date: string;
  method: PaymentMethod;
  bankAccountId: string;
  referenceNumber: string;
  amount: number;
  appliedTo: BillPaymentApplication[];
  createdAt: string;
}

export const billPayments: BillPayment[] = [
  // ── 1  Payment for BILL-009 (Office Depot - Paid) ─────────
  {
    paymentId: 'bpay_001',
    companyId: 'company_1',
    vendorId: 'vnd_001',
    vendorName: 'Office Depot',
    date: '2026-02-10',
    method: 'check',
    bankAccountId: 'acc_002',
    referenceNumber: 'CHK-1042',
    amount: 643.5,
    appliedTo: [
      { billId: 'bill_009', billNumber: 'BILL-009', amount: 643.5 },
    ],
    createdAt: '2026-02-10T10:00:00Z',
  },

  // ── 2  Payment for BILL-010 (CloudHost - Paid) ────────────
  {
    paymentId: 'bpay_002',
    companyId: 'company_1',
    vendorId: 'vnd_004',
    vendorName: 'CloudHost Inc',
    date: '2026-02-25',
    method: 'ach',
    bankAccountId: 'acc_002',
    referenceNumber: 'ACH-20260225',
    amount: 658.9,
    appliedTo: [
      { billId: 'bill_010', billNumber: 'BILL-010', amount: 658.9 },
    ],
    createdAt: '2026-02-25T08:30:00Z',
  },

  // ── 3  Payment for BILL-011 (Janitorial - Paid) ──────────
  {
    paymentId: 'bpay_003',
    companyId: 'company_1',
    vendorId: 'vnd_007',
    vendorName: 'Janitorial Services',
    date: '2026-01-28',
    method: 'check',
    bankAccountId: 'acc_002',
    referenceNumber: 'CHK-1038',
    amount: 882,
    appliedTo: [
      { billId: 'bill_011', billNumber: 'BILL-011', amount: 882 },
    ],
    createdAt: '2026-01-28T11:00:00Z',
  },

  // ── 4  Payment for BILL-012 (Software Solutions - Paid) ───
  {
    paymentId: 'bpay_004',
    companyId: 'company_1',
    vendorId: 'vnd_009',
    vendorName: 'Software Solutions',
    date: '2026-02-05',
    method: 'credit_card',
    bankAccountId: 'acc_002',
    referenceNumber: 'CC-88451',
    amount: 3300,
    appliedTo: [
      { billId: 'bill_012', billNumber: 'BILL-012', amount: 3300 },
    ],
    createdAt: '2026-02-05T14:30:00Z',
  },

  // ── 5  Payment for BILL-013 (Raw Materials - Paid) ────────
  {
    paymentId: 'bpay_005',
    companyId: 'company_1',
    vendorId: 'vnd_012',
    vendorName: 'Raw Materials Ltd',
    date: '2026-01-25',
    method: 'wire',
    bankAccountId: 'acc_002',
    referenceNumber: 'WT-20260125',
    amount: 7280,
    appliedTo: [
      { billId: 'bill_013', billNumber: 'BILL-013', amount: 7280 },
    ],
    createdAt: '2026-01-25T09:00:00Z',
  },

  // ── 6  Partial payment for BILL-007 (Equipment Leasing) ──
  {
    paymentId: 'bpay_006',
    companyId: 'company_1',
    vendorId: 'vnd_008',
    vendorName: 'Equipment Leasing',
    date: '2026-02-15',
    method: 'ach',
    bankAccountId: 'acc_002',
    referenceNumber: 'ACH-20260215',
    amount: 1000,
    appliedTo: [
      { billId: 'bill_007', billNumber: 'BILL-007', amount: 1000 },
    ],
    createdAt: '2026-02-15T10:00:00Z',
  },

  // ── 7  Partial payment for BILL-008 (Professional Consulting)
  {
    paymentId: 'bpay_007',
    companyId: 'company_1',
    vendorId: 'vnd_010',
    vendorName: 'Professional Consulting',
    date: '2026-02-20',
    method: 'check',
    bankAccountId: 'acc_002',
    referenceNumber: 'CHK-1045',
    amount: 2500,
    appliedTo: [
      { billId: 'bill_008', billNumber: 'BILL-008', amount: 2500 },
    ],
    createdAt: '2026-02-20T13:00:00Z',
  },

  // ── 8  Multi-bill batch payment (BILL-009 already paid, this
  //       is a separate historical batch from Logistics Partners)
  {
    paymentId: 'bpay_008',
    companyId: 'company_1',
    vendorId: 'vnd_003',
    vendorName: 'Logistics Partners',
    date: '2025-12-30',
    method: 'ach',
    bankAccountId: 'acc_003',
    referenceNumber: 'ACH-20251230',
    amount: 4500,
    appliedTo: [
      { billId: 'bill_legacy_001', billNumber: 'BILL-LG01', amount: 2800 },
      { billId: 'bill_legacy_002', billNumber: 'BILL-LG02', amount: 1700 },
    ],
    createdAt: '2025-12-30T16:00:00Z',
  },
];
