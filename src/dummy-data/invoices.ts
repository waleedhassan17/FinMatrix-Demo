// ============================================================
// FINMATRIX - Invoices Dummy Data
// ============================================================
// 20 invoices: 3 draft, 4 sent, 2 viewed, 5 paid, 4 overdue, 2 cancelled
// Math: line.amount = qty * rate
//       subtotal  = Σ line.amount
//       taxAmount = Σ (line.quantity * line.rate * line.taxRate / 100)
//       total     = subtotal + taxAmount − actualDiscount
//         where actualDiscount = discountType==='percentage'
//                                ? subtotal * discountAmount / 100
//                                : discountAmount
//       amountPaid ≤ total

export interface InvoiceLine {
  lineId: string;
  itemId: string | null;
  description: string;
  quantity: number;
  rate: number;
  amount: number;       // qty * rate
  taxRate: number;       // 0 | 5 | 10 | 15
}

export type InvoiceStatus =
  | 'draft'
  | 'sent'
  | 'viewed'
  | 'paid'
  | 'overdue'
  | 'cancelled';

export interface Invoice {
  invoiceId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  lines: InvoiceLine[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;   // raw input: 5 means 5% or $5
  discountType: 'percentage' | 'fixed';
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  notes: string;
  paymentTerms: string;
  createdAt: string;
}

export const invoices: Invoice[] = [
  // ── 1  INV-1001  Draft ────────────────────────────────────
  {
    invoiceId: 'inv_001',
    companyId: 'company_1',
    customerId: 'cust_001',
    customerName: 'Acme Corp',
    invoiceNumber: 'INV-1001',
    date: '2026-02-28',
    dueDate: '2026-03-30',
    lines: [
      { lineId: 'l_001_1', itemId: null, description: 'Consulting Services', quantity: 10, rate: 150, amount: 1500, taxRate: 10 },
      { lineId: 'l_001_2', itemId: null, description: 'Software License (Annual)', quantity: 2, rate: 250, amount: 500, taxRate: 0 },
    ],
    subtotal: 2000,   // 1500 + 500
    taxAmount: 150,    // 150 + 0
    discountAmount: 0,
    discountType: 'fixed',
    total: 2150,       // 2000 + 150 − 0
    amountPaid: 0,
    status: 'draft',
    notes: 'Initial consulting engagement for Q1.',
    paymentTerms: 'net_30',
    createdAt: '2026-02-28T09:00:00Z',
  },

  // ── 2  INV-1002  Draft ────────────────────────────────────
  {
    invoiceId: 'inv_002',
    companyId: 'company_1',
    customerId: 'cust_003',
    customerName: 'Gamma Industries',
    invoiceNumber: 'INV-1002',
    date: '2026-02-25',
    dueDate: '2026-04-11',
    lines: [
      { lineId: 'l_002_1', itemId: null, description: 'Network Infrastructure Setup', quantity: 3, rate: 450, amount: 1350, taxRate: 10 },
      { lineId: 'l_002_2', itemId: null, description: 'Ethernet Cabling (per 100 ft)', quantity: 20, rate: 15, amount: 300, taxRate: 0 },
    ],
    subtotal: 1650,   // 1350 + 300
    taxAmount: 135,    // 135 + 0
    discountAmount: 0,
    discountType: 'fixed',
    total: 1785,       // 1650 + 135 − 0
    amountPaid: 0,
    status: 'draft',
    notes: 'Site survey completed. Installation pending approval.',
    paymentTerms: 'net_45',
    createdAt: '2026-02-25T11:30:00Z',
  },

  // ── 3  INV-1003  Draft ────────────────────────────────────
  {
    invoiceId: 'inv_003',
    companyId: 'company_1',
    customerId: 'cust_009',
    customerName: 'Kappa Foods',
    invoiceNumber: 'INV-1003',
    date: '2026-03-01',
    dueDate: '2026-03-31',
    lines: [
      { lineId: 'l_003_1', itemId: null, description: 'Menu Consultation', quantity: 1, rate: 800, amount: 800, taxRate: 10 },
    ],
    subtotal: 800,
    taxAmount: 80,     // 800 * 10 / 100
    discountAmount: 0,
    discountType: 'fixed',
    total: 880,        // 800 + 80 − 0
    amountPaid: 0,
    status: 'draft',
    notes: '',
    paymentTerms: 'net_30',
    createdAt: '2026-03-01T08:15:00Z',
  },

  // ── 4  INV-1004  Sent ─────────────────────────────────────
  {
    invoiceId: 'inv_004',
    companyId: 'company_1',
    customerId: 'cust_004',
    customerName: 'Delta Services',
    invoiceNumber: 'INV-1004',
    date: '2026-02-15',
    dueDate: '2026-03-17',
    lines: [
      { lineId: 'l_004_1', itemId: null, description: 'Monthly Retainer (February)', quantity: 1, rate: 2000, amount: 2000, taxRate: 0 },
      { lineId: 'l_004_2', itemId: null, description: 'Travel Expenses', quantity: 1, rate: 450, amount: 450, taxRate: 0 },
    ],
    subtotal: 2450,
    taxAmount: 0,
    discountAmount: 0,
    discountType: 'fixed',
    total: 2450,
    amountPaid: 0,
    status: 'sent',
    notes: 'Travel to Denver facility included.',
    paymentTerms: 'net_30',
    createdAt: '2026-02-15T10:00:00Z',
  },

  // ── 5  INV-1005  Sent  (partially paid) ───────────────────
  {
    invoiceId: 'inv_005',
    companyId: 'company_1',
    customerId: 'cust_005',
    customerName: 'Epsilon Tech',
    invoiceNumber: 'INV-1005',
    date: '2026-02-10',
    dueDate: '2026-03-12',
    lines: [
      { lineId: 'l_005_1', itemId: null, description: 'Cloud Migration (Phase 1)', quantity: 40, rate: 125, amount: 5000, taxRate: 10 },
    ],
    subtotal: 5000,
    taxAmount: 500,    // 5000 * 10 / 100
    discountAmount: 0,
    discountType: 'fixed',
    total: 5500,
    amountPaid: 2000,
    status: 'sent',
    notes: 'Phase 1 of 3. Partial payment received.',
    paymentTerms: 'net_30',
    createdAt: '2026-02-10T14:00:00Z',
  },

  // ── 6  INV-1006  Sent  (10% discount) ─────────────────────
  {
    invoiceId: 'inv_006',
    companyId: 'company_1',
    customerId: 'cust_007',
    customerName: 'Theta Manufacturing',
    invoiceNumber: 'INV-1006',
    date: '2026-02-18',
    dueDate: '2026-03-20',
    lines: [
      { lineId: 'l_006_1', itemId: null, description: 'Equipment Calibration', quantity: 5, rate: 400, amount: 2000, taxRate: 10 },
      { lineId: 'l_006_2', itemId: null, description: 'Replacement Parts', quantity: 4, rate: 150, amount: 600, taxRate: 10 },
    ],
    subtotal: 2600,    // 2000 + 600
    taxAmount: 260,    // 200 + 60
    discountAmount: 10,
    discountType: 'percentage',  // actualDiscount = 2600 * 10 / 100 = 260
    total: 2600,       // 2600 + 260 − 260
    amountPaid: 0,
    status: 'sent',
    notes: '10% volume discount applied.',
    paymentTerms: 'net_30',
    createdAt: '2026-02-18T09:30:00Z',
  },

  // ── 7  INV-1007  Sent  (partially paid) ───────────────────
  {
    invoiceId: 'inv_007',
    companyId: 'company_1',
    customerId: 'cust_014',
    customerName: 'Omicron Retail',
    invoiceNumber: 'INV-1007',
    date: '2026-02-22',
    dueDate: '2026-02-22',
    lines: [
      { lineId: 'l_007_1', itemId: null, description: 'POS System Setup', quantity: 3, rate: 600, amount: 1800, taxRate: 10 },
      { lineId: 'l_007_2', itemId: null, description: 'Staff Training', quantity: 4, rate: 200, amount: 800, taxRate: 0 },
    ],
    subtotal: 2600,    // 1800 + 800
    taxAmount: 180,    // 180 + 0
    discountAmount: 0,
    discountType: 'fixed',
    total: 2780,       // 2600 + 180 − 0
    amountPaid: 1000,
    status: 'sent',
    notes: 'Deposit received. Balance due on delivery.',
    paymentTerms: 'due_on_receipt',
    createdAt: '2026-02-22T11:00:00Z',
  },

  // ── 8  INV-1008  Viewed  (partially paid) ─────────────────
  {
    invoiceId: 'inv_008',
    companyId: 'company_1',
    customerId: 'cust_008',
    customerName: 'Iota Consulting',
    invoiceNumber: 'INV-1008',
    date: '2026-02-12',
    dueDate: '2026-03-14',
    lines: [
      { lineId: 'l_008_1', itemId: null, description: 'Strategic Planning Session', quantity: 8, rate: 250, amount: 2000, taxRate: 10 },
      { lineId: 'l_008_2', itemId: null, description: 'Market Research Report', quantity: 1, rate: 500, amount: 500, taxRate: 10 },
    ],
    subtotal: 2500,    // 2000 + 500
    taxAmount: 250,    // 200 + 50
    discountAmount: 0,
    discountType: 'fixed',
    total: 2750,       // 2500 + 250 − 0
    amountPaid: 500,
    status: 'viewed',
    notes: 'Client reviewed. Awaiting payment.',
    paymentTerms: 'net_30',
    createdAt: '2026-02-12T08:45:00Z',
  },

  // ── 9  INV-1009  Viewed ───────────────────────────────────
  {
    invoiceId: 'inv_009',
    companyId: 'company_1',
    customerId: 'cust_015',
    customerName: 'Pi Energy',
    invoiceNumber: 'INV-1009',
    date: '2026-02-05',
    dueDate: '2026-03-22',
    lines: [
      { lineId: 'l_009_1', itemId: null, description: 'Energy Audit (Commercial)', quantity: 1, rate: 2200, amount: 2200, taxRate: 10 },
      { lineId: 'l_009_2', itemId: null, description: 'Compliance Report', quantity: 1, rate: 500, amount: 500, taxRate: 10 },
    ],
    subtotal: 2700,    // 2200 + 500
    taxAmount: 270,    // 220 + 50
    discountAmount: 0,
    discountType: 'fixed',
    total: 2970,       // 2700 + 270 − 0
    amountPaid: 0,
    status: 'viewed',
    notes: 'Audit completed. Report delivered.',
    paymentTerms: 'net_45',
    createdAt: '2026-02-05T15:00:00Z',
  },

  // ── 10  INV-1010  Paid ────────────────────────────────────
  {
    invoiceId: 'inv_010',
    companyId: 'company_1',
    customerId: 'cust_002',
    customerName: 'Beta LLC',
    invoiceNumber: 'INV-1010',
    date: '2026-01-10',
    dueDate: '2026-02-09',
    lines: [
      { lineId: 'l_010_1', itemId: null, description: 'Website Redesign', quantity: 1, rate: 3500, amount: 3500, taxRate: 10 },
    ],
    subtotal: 3500,
    taxAmount: 350,
    discountAmount: 0,
    discountType: 'fixed',
    total: 3850,
    amountPaid: 3850,
    status: 'paid',
    notes: 'Paid in full via bank transfer.',
    paymentTerms: 'net_30',
    createdAt: '2026-01-10T10:00:00Z',
  },

  // ── 11  INV-1011  Paid  (5% discount) ─────────────────────
  {
    invoiceId: 'inv_011',
    companyId: 'company_1',
    customerId: 'cust_011',
    customerName: 'Mu Healthcare',
    invoiceNumber: 'INV-1011',
    date: '2026-01-05',
    dueDate: '2026-02-04',
    lines: [
      { lineId: 'l_011_1', itemId: null, description: 'IT Support Contract (Q1)', quantity: 1, rate: 4500, amount: 4500, taxRate: 10 },
    ],
    subtotal: 4500,
    taxAmount: 450,     // 4500 * 10 / 100
    discountAmount: 5,
    discountType: 'percentage',  // actualDiscount = 4500 * 5 / 100 = 225
    total: 4725,        // 4500 + 450 − 225
    amountPaid: 4725,
    status: 'paid',
    notes: 'Early payment discount applied.',
    paymentTerms: 'net_30',
    createdAt: '2026-01-05T09:00:00Z',
  },

  // ── 12  INV-1012  Paid ────────────────────────────────────
  {
    invoiceId: 'inv_012',
    companyId: 'company_1',
    customerId: 'cust_012',
    customerName: 'Nu Construction',
    invoiceNumber: 'INV-1012',
    date: '2026-01-15',
    dueDate: '2026-02-14',
    lines: [
      { lineId: 'l_012_1', itemId: null, description: 'Project Management (January)', quantity: 20, rate: 175, amount: 3500, taxRate: 10 },
      { lineId: 'l_012_2', itemId: null, description: 'Safety Inspection', quantity: 2, rate: 500, amount: 1000, taxRate: 0 },
    ],
    subtotal: 4500,    // 3500 + 1000
    taxAmount: 350,    // 350 + 0
    discountAmount: 0,
    discountType: 'fixed',
    total: 4850,       // 4500 + 350 − 0
    amountPaid: 4850,
    status: 'paid',
    notes: 'Paid via check #4812.',
    paymentTerms: 'net_30',
    createdAt: '2026-01-15T13:00:00Z',
  },

  // ── 13  INV-1013  Paid ────────────────────────────────────
  {
    invoiceId: 'inv_013',
    companyId: 'company_1',
    customerId: 'cust_001',
    customerName: 'Acme Corp',
    invoiceNumber: 'INV-1013',
    date: '2026-01-20',
    dueDate: '2026-02-19',
    lines: [
      { lineId: 'l_013_1', itemId: null, description: 'Annual Support Plan', quantity: 1, rate: 4800, amount: 4800, taxRate: 10 },
    ],
    subtotal: 4800,
    taxAmount: 480,
    discountAmount: 0,
    discountType: 'fixed',
    total: 5280,
    amountPaid: 5280,
    status: 'paid',
    notes: 'Annual plan renewed.',
    paymentTerms: 'net_30',
    createdAt: '2026-01-20T11:00:00Z',
  },

  // ── 14  INV-1014  Paid  ($250 discount) ───────────────────
  {
    invoiceId: 'inv_014',
    companyId: 'company_1',
    customerId: 'cust_006',
    customerName: 'Zeta Logistics',
    invoiceNumber: 'INV-1014',
    date: '2025-12-15',
    dueDate: '2026-01-14',
    lines: [
      { lineId: 'l_014_1', itemId: null, description: 'Initial System Setup', quantity: 1, rate: 3000, amount: 3000, taxRate: 10 },
      { lineId: 'l_014_2', itemId: null, description: 'Data Migration', quantity: 1, rate: 1500, amount: 1500, taxRate: 10 },
    ],
    subtotal: 4500,    // 3000 + 1500
    taxAmount: 450,    // 300 + 150
    discountAmount: 250,
    discountType: 'fixed',
    total: 4700,       // 4500 + 450 − 250
    amountPaid: 4700,
    status: 'paid',
    notes: 'Long-term client discount.',
    paymentTerms: 'net_30',
    createdAt: '2025-12-15T09:00:00Z',
  },

  // ── 15  INV-1015  Overdue  (partially paid) ───────────────
  {
    invoiceId: 'inv_015',
    companyId: 'company_1',
    customerId: 'cust_005',
    customerName: 'Epsilon Tech',
    invoiceNumber: 'INV-1015',
    date: '2026-01-02',
    dueDate: '2026-02-01',
    lines: [
      { lineId: 'l_015_1', itemId: null, description: 'Cloud Backup Configuration', quantity: 1, rate: 1200, amount: 1200, taxRate: 10 },
      { lineId: 'l_015_2', itemId: null, description: 'Storage Expansion (500 GB)', quantity: 2, rate: 350, amount: 700, taxRate: 10 },
    ],
    subtotal: 1900,    // 1200 + 700
    taxAmount: 190,    // 120 + 70
    discountAmount: 0,
    discountType: 'fixed',
    total: 2090,       // 1900 + 190 − 0
    amountPaid: 500,
    status: 'overdue',
    notes: 'Partial payment received. Follow up required.',
    paymentTerms: 'net_30',
    createdAt: '2026-01-02T08:30:00Z',
  },

  // ── 16  INV-1016  Overdue ─────────────────────────────────
  {
    invoiceId: 'inv_016',
    companyId: 'company_1',
    customerId: 'cust_010',
    customerName: 'Lambda Design',
    invoiceNumber: 'INV-1016',
    date: '2025-12-20',
    dueDate: '2026-01-19',
    lines: [
      { lineId: 'l_016_1', itemId: null, description: 'Brand Identity Package', quantity: 1, rate: 2800, amount: 2800, taxRate: 10 },
    ],
    subtotal: 2800,
    taxAmount: 280,
    discountAmount: 0,
    discountType: 'fixed',
    total: 3080,
    amountPaid: 0,
    status: 'overdue',
    notes: 'Account inactive. Escalated to collections.',
    paymentTerms: 'net_30',
    createdAt: '2025-12-20T14:00:00Z',
  },

  // ── 17  INV-1017  Overdue  (partially paid) ───────────────
  {
    invoiceId: 'inv_017',
    companyId: 'company_1',
    customerId: 'cust_013',
    customerName: 'Xi Education',
    invoiceNumber: 'INV-1017',
    date: '2025-12-01',
    dueDate: '2026-01-15',
    lines: [
      { lineId: 'l_017_1', itemId: null, description: 'LMS Platform Setup', quantity: 1, rate: 1800, amount: 1800, taxRate: 10 },
      { lineId: 'l_017_2', itemId: null, description: 'Content Migration', quantity: 1, rate: 600, amount: 600, taxRate: 10 },
    ],
    subtotal: 2400,    // 1800 + 600
    taxAmount: 240,    // 180 + 60
    discountAmount: 0,
    discountType: 'fixed',
    total: 2640,       // 2400 + 240 − 0
    amountPaid: 800,
    status: 'overdue',
    notes: 'Partial payment received Dec 15.',
    paymentTerms: 'net_45',
    createdAt: '2025-12-01T10:00:00Z',
  },

  // ── 18  INV-1018  Overdue ─────────────────────────────────
  {
    invoiceId: 'inv_018',
    companyId: 'company_1',
    customerId: 'cust_006',
    customerName: 'Zeta Logistics',
    invoiceNumber: 'INV-1018',
    date: '2026-01-08',
    dueDate: '2026-02-07',
    lines: [
      { lineId: 'l_018_1', itemId: null, description: 'Fleet Tracking Module', quantity: 1, rate: 1500, amount: 1500, taxRate: 10 },
    ],
    subtotal: 1500,
    taxAmount: 150,
    discountAmount: 0,
    discountType: 'fixed',
    total: 1650,
    amountPaid: 0,
    status: 'overdue',
    notes: 'Payment reminder sent.',
    paymentTerms: 'net_30',
    createdAt: '2026-01-08T11:30:00Z',
  },

  // ── 19  INV-1019  Cancelled ───────────────────────────────
  {
    invoiceId: 'inv_019',
    companyId: 'company_1',
    customerId: 'cust_002',
    customerName: 'Beta LLC',
    invoiceNumber: 'INV-1019',
    date: '2026-02-01',
    dueDate: '2026-03-03',
    lines: [
      { lineId: 'l_019_1', itemId: null, description: 'Marketing Campaign', quantity: 1, rate: 2500, amount: 2500, taxRate: 10 },
    ],
    subtotal: 2500,
    taxAmount: 250,
    discountAmount: 0,
    discountType: 'fixed',
    total: 2750,
    amountPaid: 0,
    status: 'cancelled',
    notes: 'Client cancelled project scope.',
    paymentTerms: 'net_30',
    createdAt: '2026-02-01T09:00:00Z',
  },

  // ── 20  INV-1020  Cancelled  (5% discount) ────────────────
  {
    invoiceId: 'inv_020',
    companyId: 'company_1',
    customerId: 'cust_004',
    customerName: 'Delta Services',
    invoiceNumber: 'INV-1020',
    date: '2026-01-25',
    dueDate: '2026-02-24',
    lines: [
      { lineId: 'l_020_1', itemId: null, description: 'Custom Development Sprint', quantity: 30, rate: 100, amount: 3000, taxRate: 10 },
    ],
    subtotal: 3000,
    taxAmount: 300,     // 3000 * 10 / 100
    discountAmount: 5,
    discountType: 'percentage',  // actualDiscount = 3000 * 5 / 100 = 150
    total: 3150,        // 3000 + 300 − 150
    amountPaid: 0,
    status: 'cancelled',
    notes: 'Development scope changed. Replaced by INV-1004.',
    paymentTerms: 'net_30',
    createdAt: '2026-01-25T16:00:00Z',
  },
];
