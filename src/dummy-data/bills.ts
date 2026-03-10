// ============================================================
// FINMATRIX - Bills Dummy Data
// ============================================================
// 15 bills: 2 draft, 4 open, 2 partially_paid, 5 paid, 2 overdue
// Line items reference expense accounts from COA.

export interface BillLine {
  lineId: string;
  accountId: string;
  accountName: string;
  description: string;
  amount: number;
  taxRate: number;
}

export type BillStatus = 'draft' | 'open' | 'partially_paid' | 'paid' | 'overdue';

export interface Bill {
  billId: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  billNumber: string;
  date: string;
  dueDate: string;
  lines: BillLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  amountPaid: number;
  status: BillStatus;
  notes: string;
  createdAt: string;
}

export const bills: Bill[] = [
  // ── 1  BILL-001  Draft ────────────────────────────────────
  {
    billId: 'bill_001',
    companyId: 'company_1',
    vendorId: 'vnd_001',
    vendorName: 'Office Depot',
    billNumber: 'BILL-001',
    date: '2026-03-01',
    dueDate: '2026-03-31',
    lines: [
      { lineId: 'bl_001_1', accountId: 'acc_026', accountName: 'Office Supplies', description: 'Printer paper (10 reams)', amount: 250, taxRate: 10 },
      { lineId: 'bl_001_2', accountId: 'acc_026', accountName: 'Office Supplies', description: 'Toner cartridges (4 pack)', amount: 180, taxRate: 10 },
    ],
    subtotal: 430,      // 250 + 180
    taxAmount: 43,       // 25 + 18
    total: 473,          // 430 + 43
    amountPaid: 0,
    status: 'draft',
    notes: 'Monthly office supplies order.',
    createdAt: '2026-03-01T09:00:00Z',
  },

  // ── 2  BILL-002  Draft ────────────────────────────────────
  {
    billId: 'bill_002',
    companyId: 'company_1',
    vendorId: 'vnd_002',
    vendorName: 'TechSupply Co',
    billNumber: 'BILL-002',
    date: '2026-03-05',
    dueDate: '2026-04-04',
    lines: [
      { lineId: 'bl_002_1', accountId: 'acc_026', accountName: 'Office Supplies', description: 'USB-C docking stations (3)', amount: 450, taxRate: 10 },
      { lineId: 'bl_002_2', accountId: 'acc_026', accountName: 'Office Supplies', description: 'Wireless keyboards (5)', amount: 375, taxRate: 10 },
      { lineId: 'bl_002_3', accountId: 'acc_026', accountName: 'Office Supplies', description: 'Monitor stands (5)', amount: 200, taxRate: 10 },
    ],
    subtotal: 1025,      // 450 + 375 + 200
    taxAmount: 102.5,    // 45 + 37.5 + 20
    total: 1127.5,       // 1025 + 102.5
    amountPaid: 0,
    status: 'draft',
    notes: 'New employee onboarding equipment - awaiting manager approval.',
    createdAt: '2026-03-05T11:30:00Z',
  },

  // ── 3  BILL-003  Open ─────────────────────────────────────
  {
    billId: 'bill_003',
    companyId: 'company_1',
    vendorId: 'vnd_003',
    vendorName: 'Logistics Partners',
    billNumber: 'BILL-003',
    date: '2026-02-20',
    dueDate: '2026-04-05',
    lines: [
      { lineId: 'bl_003_1', accountId: 'acc_032', accountName: 'Delivery Expenses', description: 'Freight charges - February shipments', amount: 1800, taxRate: 0 },
      { lineId: 'bl_003_2', accountId: 'acc_032', accountName: 'Delivery Expenses', description: 'Warehouse pickup fees', amount: 350, taxRate: 0 },
    ],
    subtotal: 2150,      // 1800 + 350
    taxAmount: 0,        // 0 + 0
    total: 2150,         // 2150 + 0
    amountPaid: 0,
    status: 'open',
    notes: 'February shipping charges.',
    createdAt: '2026-02-20T10:00:00Z',
  },

  // ── 4  BILL-004  Open ─────────────────────────────────────
  {
    billId: 'bill_004',
    companyId: 'company_1',
    vendorId: 'vnd_004',
    vendorName: 'CloudHost Inc',
    billNumber: 'BILL-004',
    date: '2026-03-01',
    dueDate: '2026-03-31',
    lines: [
      { lineId: 'bl_004_1', accountId: 'acc_024', accountName: 'Utilities Expense', description: 'Cloud hosting - March (Pro Plan)', amount: 599, taxRate: 10 },
      { lineId: 'bl_004_2', accountId: 'acc_024', accountName: 'Utilities Expense', description: 'Additional storage (500 GB)', amount: 120, taxRate: 10 },
    ],
    subtotal: 719,       // 599 + 120
    taxAmount: 71.9,     // 59.9 + 12
    total: 790.9,        // 719 + 71.9
    amountPaid: 0,
    status: 'open',
    notes: 'Monthly cloud hosting invoice.',
    createdAt: '2026-03-01T08:00:00Z',
  },

  // ── 5  BILL-005  Open ─────────────────────────────────────
  {
    billId: 'bill_005',
    companyId: 'company_1',
    vendorId: 'vnd_005',
    vendorName: 'Insurance Corp',
    billNumber: 'BILL-005',
    date: '2026-02-15',
    dueDate: '2026-03-17',
    lines: [
      { lineId: 'bl_005_1', accountId: 'acc_027', accountName: 'Insurance Expense', description: 'General liability insurance - Q2', amount: 2400, taxRate: 0 },
      { lineId: 'bl_005_2', accountId: 'acc_027', accountName: 'Insurance Expense', description: 'Workers compensation - Q2', amount: 1600, taxRate: 0 },
    ],
    subtotal: 4000,      // 2400 + 1600
    taxAmount: 0,        // 0 + 0
    total: 4000,         // 4000 + 0
    amountPaid: 0,
    status: 'open',
    notes: 'Quarterly insurance premium.',
    createdAt: '2026-02-15T14:00:00Z',
  },

  // ── 6  BILL-006  Open ─────────────────────────────────────
  {
    billId: 'bill_006',
    companyId: 'company_1',
    vendorId: 'vnd_006',
    vendorName: 'Marketing Agency',
    billNumber: 'BILL-006',
    date: '2026-03-10',
    dueDate: '2026-04-09',
    lines: [
      { lineId: 'bl_006_1', accountId: 'acc_029', accountName: 'Marketing Expense', description: 'Social media campaign management', amount: 1500, taxRate: 10 },
      { lineId: 'bl_006_2', accountId: 'acc_029', accountName: 'Marketing Expense', description: 'Google Ads management fee', amount: 800, taxRate: 10 },
      { lineId: 'bl_006_3', accountId: 'acc_029', accountName: 'Marketing Expense', description: 'Content creation (4 blog posts)', amount: 600, taxRate: 10 },
    ],
    subtotal: 2900,      // 1500 + 800 + 600
    taxAmount: 290,      // 150 + 80 + 60
    total: 3190,         // 2900 + 290
    amountPaid: 0,
    status: 'open',
    notes: 'March marketing services.',
    createdAt: '2026-03-10T16:00:00Z',
  },

  // ── 7  BILL-007  Partially Paid ───────────────────────────
  {
    billId: 'bill_007',
    companyId: 'company_1',
    vendorId: 'vnd_008',
    vendorName: 'Equipment Leasing',
    billNumber: 'BILL-007',
    date: '2026-02-01',
    dueDate: '2026-03-03',
    lines: [
      { lineId: 'bl_007_1', accountId: 'acc_023', accountName: 'Rent Expense', description: 'Forklift lease - February', amount: 1200, taxRate: 10 },
      { lineId: 'bl_007_2', accountId: 'acc_023', accountName: 'Rent Expense', description: 'Pallet jack lease - February', amount: 400, taxRate: 10 },
    ],
    subtotal: 1600,      // 1200 + 400
    taxAmount: 160,      // 120 + 40
    total: 1760,         // 1600 + 160
    amountPaid: 1000,
    status: 'partially_paid',
    notes: 'Partial payment made. Remaining balance due by end of month.',
    createdAt: '2026-02-01T09:30:00Z',
  },

  // ── 8  BILL-008  Partially Paid ───────────────────────────
  {
    billId: 'bill_008',
    companyId: 'company_1',
    vendorId: 'vnd_010',
    vendorName: 'Professional Consulting',
    billNumber: 'BILL-008',
    date: '2026-02-10',
    dueDate: '2026-03-12',
    lines: [
      { lineId: 'bl_008_1', accountId: 'acc_031', accountName: 'Professional Fees', description: 'Tax advisory services - February', amount: 3500, taxRate: 0 },
      { lineId: 'bl_008_2', accountId: 'acc_031', accountName: 'Professional Fees', description: 'Bookkeeping review', amount: 1200, taxRate: 0 },
    ],
    subtotal: 4700,      // 3500 + 1200
    taxAmount: 0,        // 0 + 0
    total: 4700,         // 4700 + 0
    amountPaid: 2500,
    status: 'partially_paid',
    notes: 'First installment paid. Second payment due March 12.',
    createdAt: '2026-02-10T13:00:00Z',
  },

  // ── 9  BILL-009  Paid ─────────────────────────────────────
  {
    billId: 'bill_009',
    companyId: 'company_1',
    vendorId: 'vnd_001',
    vendorName: 'Office Depot',
    billNumber: 'BILL-009',
    date: '2026-01-15',
    dueDate: '2026-02-14',
    lines: [
      { lineId: 'bl_009_1', accountId: 'acc_026', accountName: 'Office Supplies', description: 'Printer paper (20 reams)', amount: 500, taxRate: 10 },
      { lineId: 'bl_009_2', accountId: 'acc_026', accountName: 'Office Supplies', description: 'Filing folders and labels', amount: 85, taxRate: 10 },
    ],
    subtotal: 585,       // 500 + 85
    taxAmount: 58.5,     // 50 + 8.5
    total: 643.5,        // 585 + 58.5
    amountPaid: 643.5,
    status: 'paid',
    notes: 'Paid via check #1042.',
    createdAt: '2026-01-15T09:00:00Z',
  },

  // ── 10  BILL-010  Paid ────────────────────────────────────
  {
    billId: 'bill_010',
    companyId: 'company_1',
    vendorId: 'vnd_004',
    vendorName: 'CloudHost Inc',
    billNumber: 'BILL-010',
    date: '2026-02-01',
    dueDate: '2026-03-03',
    lines: [
      { lineId: 'bl_010_1', accountId: 'acc_024', accountName: 'Utilities Expense', description: 'Cloud hosting - February (Pro Plan)', amount: 599, taxRate: 10 },
    ],
    subtotal: 599,       // 599
    taxAmount: 59.9,     // 59.9
    total: 658.9,        // 599 + 59.9
    amountPaid: 658.9,
    status: 'paid',
    notes: 'Paid on time via ACH.',
    createdAt: '2026-02-01T08:00:00Z',
  },

  // ── 11  BILL-011  Paid ────────────────────────────────────
  {
    billId: 'bill_011',
    companyId: 'company_1',
    vendorId: 'vnd_007',
    vendorName: 'Janitorial Services',
    billNumber: 'BILL-011',
    date: '2026-01-01',
    dueDate: '2026-01-31',
    lines: [
      { lineId: 'bl_011_1', accountId: 'acc_035', accountName: 'Miscellaneous Expense', description: 'Monthly janitorial service - January', amount: 750, taxRate: 0 },
      { lineId: 'bl_011_2', accountId: 'acc_026', accountName: 'Office Supplies', description: 'Cleaning supplies restock', amount: 120, taxRate: 10 },
    ],
    subtotal: 870,       // 750 + 120
    taxAmount: 12,       // 0 + 12
    total: 882,          // 870 + 12
    amountPaid: 882,
    status: 'paid',
    notes: 'Paid via check #1038.',
    createdAt: '2026-01-01T10:00:00Z',
  },

  // ── 12  BILL-012  Paid ────────────────────────────────────
  {
    billId: 'bill_012',
    companyId: 'company_1',
    vendorId: 'vnd_009',
    vendorName: 'Software Solutions',
    billNumber: 'BILL-012',
    date: '2026-01-10',
    dueDate: '2026-02-09',
    lines: [
      { lineId: 'bl_012_1', accountId: 'acc_024', accountName: 'Utilities Expense', description: 'CRM annual license renewal', amount: 2400, taxRate: 10 },
      { lineId: 'bl_012_2', accountId: 'acc_024', accountName: 'Utilities Expense', description: 'Additional user seats (5)', amount: 600, taxRate: 10 },
    ],
    subtotal: 3000,      // 2400 + 600
    taxAmount: 300,      // 240 + 60
    total: 3300,         // 3000 + 300
    amountPaid: 3300,
    status: 'paid',
    notes: 'Annual renewal paid in full.',
    createdAt: '2026-01-10T14:00:00Z',
  },

  // ── 13  BILL-013  Paid ────────────────────────────────────
  {
    billId: 'bill_013',
    companyId: 'company_1',
    vendorId: 'vnd_012',
    vendorName: 'Raw Materials Ltd',
    billNumber: 'BILL-013',
    date: '2026-01-20',
    dueDate: '2026-03-06',
    lines: [
      { lineId: 'bl_013_1', accountId: 'acc_021', accountName: 'Cost of Goods Sold', description: 'Steel sheets (500 kg)', amount: 4500, taxRate: 10 },
      { lineId: 'bl_013_2', accountId: 'acc_021', accountName: 'Cost of Goods Sold', description: 'Aluminum rods (200 units)', amount: 1800, taxRate: 10 },
      { lineId: 'bl_013_3', accountId: 'acc_032', accountName: 'Delivery Expenses', description: 'Shipping & handling', amount: 350, taxRate: 0 },
    ],
    subtotal: 6650,      // 4500 + 1800 + 350
    taxAmount: 630,      // 450 + 180 + 0
    total: 7280,         // 6650 + 630
    amountPaid: 7280,
    status: 'paid',
    notes: 'Paid via wire transfer. Ref: WT-20260125.',
    createdAt: '2026-01-20T11:00:00Z',
  },

  // ── 14  BILL-014  Overdue ─────────────────────────────────
  {
    billId: 'bill_014',
    companyId: 'company_1',
    vendorId: 'vnd_011',
    vendorName: 'Auto Parts Depot',
    billNumber: 'BILL-014',
    date: '2026-01-05',
    dueDate: '2026-02-04',
    lines: [
      { lineId: 'bl_014_1', accountId: 'acc_021', accountName: 'Cost of Goods Sold', description: 'Brake pads (100 sets)', amount: 3200, taxRate: 10 },
      { lineId: 'bl_014_2', accountId: 'acc_021', accountName: 'Cost of Goods Sold', description: 'Oil filters (200 units)', amount: 1400, taxRate: 10 },
    ],
    subtotal: 4600,      // 3200 + 1400
    taxAmount: 460,      // 320 + 140
    total: 5060,         // 4600 + 460
    amountPaid: 0,
    status: 'overdue',
    notes: 'Payment overdue. Vendor has sent reminder.',
    createdAt: '2026-01-05T15:00:00Z',
  },

  // ── 15  BILL-015  Overdue ─────────────────────────────────
  {
    billId: 'bill_015',
    companyId: 'company_1',
    vendorId: 'vnd_003',
    vendorName: 'Logistics Partners',
    billNumber: 'BILL-015',
    date: '2026-01-10',
    dueDate: '2026-02-24',
    lines: [
      { lineId: 'bl_015_1', accountId: 'acc_032', accountName: 'Delivery Expenses', description: 'Freight charges - January shipments', amount: 2200, taxRate: 0 },
      { lineId: 'bl_015_2', accountId: 'acc_030', accountName: 'Travel Expense', description: 'Courier express deliveries (12)', amount: 960, taxRate: 0 },
    ],
    subtotal: 3160,      // 2200 + 960
    taxAmount: 0,        // 0 + 0
    total: 3160,         // 3160 + 0
    amountPaid: 0,
    status: 'overdue',
    notes: 'Overdue since Feb 24. Dispute pending on courier charges.',
    createdAt: '2026-01-10T12:00:00Z',
  },
];
