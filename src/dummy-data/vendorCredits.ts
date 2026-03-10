// ============================================================
// FINMATRIX - Vendor Credits Dummy Data
// ============================================================
// 3 vendor credits applied against open bills.

export interface VendorCreditLine {
  lineId: string;
  accountId: string;
  accountName: string;
  description: string;
  amount: number;
  taxRate: number;
}

export type VendorCreditStatus = 'draft' | 'open' | 'applied' | 'void';

export interface VendorCredit {
  creditId: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  creditNumber: string;
  date: string;
  lines: VendorCreditLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountApplied: number;
  appliedToBillIds: string[];
  status: VendorCreditStatus;
  notes: string;
  createdAt: string;
}

export const vendorCredits: VendorCredit[] = [
  // ── 1  VC-001  Applied ────────────────────────────────────
  {
    creditId: 'vc_001',
    companyId: 'company_1',
    vendorId: 'vnd_001',
    vendorName: 'Office Depot',
    creditNumber: 'VC-001',
    date: '2026-03-05',
    lines: [
      {
        lineId: 'vcl_001_1',
        accountId: 'acc_026',
        accountName: 'Office Supplies',
        description: 'Returned defective toner cartridges (2 units)',
        amount: 90,
        taxRate: 10,
      },
    ],
    subtotal: 90,
    taxAmount: 9,
    total: 99,
    amountApplied: 99,
    appliedToBillIds: ['bill_003'],
    status: 'applied',
    notes: 'Credit for defective toner — applied to BILL-003.',
    createdAt: '2026-03-05T10:00:00Z',
  },

  // ── 2  VC-002  Open (unapplied) ──────────────────────────
  {
    creditId: 'vc_002',
    companyId: 'company_1',
    vendorId: 'vnd_002',
    vendorName: 'TechSupply Co',
    creditNumber: 'VC-002',
    date: '2026-03-08',
    lines: [
      {
        lineId: 'vcl_002_1',
        accountId: 'acc_026',
        accountName: 'Office Supplies',
        description: 'Overcharge on USB-C docking stations',
        amount: 150,
        taxRate: 10,
      },
      {
        lineId: 'vcl_002_2',
        accountId: 'acc_026',
        accountName: 'Office Supplies',
        description: 'Shipping damage — keyboard returned',
        amount: 95,
        taxRate: 10,
      },
    ],
    subtotal: 245,
    taxAmount: 24.5,
    total: 269.5,
    amountApplied: 0,
    appliedToBillIds: [],
    status: 'open',
    notes: 'Credit pending — can be applied to next TechSupply bill.',
    createdAt: '2026-03-08T14:30:00Z',
  },

  // ── 3  VC-003  Draft ──────────────────────────────────────
  {
    creditId: 'vc_003',
    companyId: 'company_1',
    vendorId: 'vnd_004',
    vendorName: 'BuildRight Materials',
    creditNumber: 'VC-003',
    date: '2026-03-12',
    lines: [
      {
        lineId: 'vcl_003_1',
        accountId: 'acc_028',
        accountName: 'Equipment & Furniture',
        description: 'Returned damaged standing desk frame',
        amount: 320,
        taxRate: 10,
      },
    ],
    subtotal: 320,
    taxAmount: 32,
    total: 352,
    amountApplied: 0,
    appliedToBillIds: [],
    status: 'draft',
    notes: 'Awaiting vendor confirmation for desk frame return.',
    createdAt: '2026-03-12T09:15:00Z',
  },
];
