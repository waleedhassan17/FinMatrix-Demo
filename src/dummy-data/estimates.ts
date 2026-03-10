// ============================================================
// FINMATRIX - Estimates Dummy Data
// ============================================================
// 8 estimates: 2 draft, 2 sent, 1 accepted, 1 declined, 2 expired
// Shape: like Invoice but no amountPaid, has expirationDate,
//        status values differ.

export interface EstimateLine {
  lineId: string;
  itemId: string | null;
  description: string;
  quantity: number;
  rate: number;
  amount: number;       // qty * rate
  taxRate: number;       // 0 | 5 | 10 | 15
}

export type EstimateStatus =
  | 'draft'
  | 'sent'
  | 'accepted'
  | 'declined'
  | 'expired';

export interface Estimate {
  estimateId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  estimateNumber: string;
  date: string;
  expirationDate: string;
  lines: EstimateLine[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  status: EstimateStatus;
  notes: string;
  createdAt: string;
}

export const estimates: Estimate[] = [
  // ── 1  EST-2001  Draft ────────────────────────────────────
  {
    estimateId: 'est_001',
    companyId: 'company_1',
    customerId: 'cust_001',
    customerName: 'Acme Corp',
    estimateNumber: 'EST-2001',
    date: '2026-02-28',
    expirationDate: '2026-03-30',
    lines: [
      { lineId: 'el_001_1', itemId: null, description: 'IT Infrastructure Assessment', quantity: 5, rate: 200, amount: 1000, taxRate: 10 },
      { lineId: 'el_001_2', itemId: null, description: 'Security Audit Report', quantity: 1, rate: 750, amount: 750, taxRate: 0 },
    ],
    subtotal: 1750,
    taxAmount: 100,    // 1000*10/100
    discountAmount: 0,
    discountType: 'fixed',
    total: 1850,
    status: 'draft',
    notes: 'Preliminary assessment for Q2 infrastructure upgrade.',
    createdAt: '2026-02-28T08:30:00Z',
  },

  // ── 2  EST-2002  Draft ────────────────────────────────────
  {
    estimateId: 'est_002',
    companyId: 'company_1',
    customerId: 'cust_004',
    customerName: 'Delta Services',
    estimateNumber: 'EST-2002',
    date: '2026-02-26',
    expirationDate: '2026-03-28',
    lines: [
      { lineId: 'el_002_1', itemId: null, description: 'Office Furniture Package', quantity: 10, rate: 300, amount: 3000, taxRate: 5 },
      { lineId: 'el_002_2', itemId: null, description: 'Delivery & Installation', quantity: 1, rate: 500, amount: 500, taxRate: 0 },
    ],
    subtotal: 3500,
    taxAmount: 150,    // 3000*5/100
    discountAmount: 5,
    discountType: 'percentage',
    total: 3475,       // 3500 + 150 − 175
    status: 'draft',
    notes: 'Bulk order quote for new office setup.',
    createdAt: '2026-02-26T11:00:00Z',
  },

  // ── 3  EST-2003  Sent ─────────────────────────────────────
  {
    estimateId: 'est_003',
    companyId: 'company_1',
    customerId: 'cust_002',
    customerName: 'Beta LLC',
    estimateNumber: 'EST-2003',
    date: '2026-02-20',
    expirationDate: '2026-03-22',
    lines: [
      { lineId: 'el_003_1', itemId: null, description: 'Web Application Development', quantity: 80, rate: 125, amount: 10000, taxRate: 0 },
      { lineId: 'el_003_2', itemId: null, description: 'UX/UI Design Package', quantity: 1, rate: 2500, amount: 2500, taxRate: 0 },
    ],
    subtotal: 12500,
    taxAmount: 0,
    discountAmount: 500,
    discountType: 'fixed',
    total: 12000,
    status: 'sent',
    notes: 'Full-stack web app with responsive design.',
    createdAt: '2026-02-20T14:00:00Z',
  },

  // ── 4  EST-2004  Sent ─────────────────────────────────────
  {
    estimateId: 'est_004',
    companyId: 'company_1',
    customerId: 'cust_006',
    customerName: 'Zeta Logistics',
    estimateNumber: 'EST-2004',
    date: '2026-02-18',
    expirationDate: '2026-03-20',
    lines: [
      { lineId: 'el_004_1', itemId: null, description: 'Fleet GPS Tracking System', quantity: 25, rate: 120, amount: 3000, taxRate: 10 },
      { lineId: 'el_004_2', itemId: null, description: 'Installation per Vehicle', quantity: 25, rate: 50, amount: 1250, taxRate: 0 },
    ],
    subtotal: 4250,
    taxAmount: 300,    // 3000*10/100
    discountAmount: 0,
    discountType: 'fixed',
    total: 4550,
    status: 'sent',
    notes: 'Fleet tracking with real-time dashboard.',
    createdAt: '2026-02-18T09:30:00Z',
  },

  // ── 5  EST-2005  Accepted ─────────────────────────────────
  {
    estimateId: 'est_005',
    companyId: 'company_1',
    customerId: 'cust_005',
    customerName: 'Epsilon Tech',
    estimateNumber: 'EST-2005',
    date: '2026-02-10',
    expirationDate: '2026-03-12',
    lines: [
      { lineId: 'el_005_1', itemId: null, description: 'Cloud Migration – Phase 1', quantity: 1, rate: 8000, amount: 8000, taxRate: 10 },
      { lineId: 'el_005_2', itemId: null, description: 'Training & Documentation', quantity: 4, rate: 300, amount: 1200, taxRate: 0 },
    ],
    subtotal: 9200,
    taxAmount: 800,    // 8000*10/100
    discountAmount: 0,
    discountType: 'fixed',
    total: 10000,
    status: 'accepted',
    notes: 'Phase 1 approved. Phase 2 to follow.',
    createdAt: '2026-02-10T10:00:00Z',
  },

  // ── 6  EST-2006  Declined ─────────────────────────────────
  {
    estimateId: 'est_006',
    companyId: 'company_1',
    customerId: 'cust_007',
    customerName: 'Eta Manufacturing',
    estimateNumber: 'EST-2006',
    date: '2026-02-05',
    expirationDate: '2026-03-07',
    lines: [
      { lineId: 'el_006_1', itemId: null, description: 'Factory Automation Consultation', quantity: 3, rate: 500, amount: 1500, taxRate: 10 },
    ],
    subtotal: 1500,
    taxAmount: 150,
    discountAmount: 0,
    discountType: 'fixed',
    total: 1650,
    status: 'declined',
    notes: 'Customer decided to go with competitor.',
    createdAt: '2026-02-05T16:00:00Z',
  },

  // ── 7  EST-2007  Expired ──────────────────────────────────
  {
    estimateId: 'est_007',
    companyId: 'company_1',
    customerId: 'cust_008',
    customerName: 'Theta Solutions',
    estimateNumber: 'EST-2007',
    date: '2026-01-10',
    expirationDate: '2026-02-10',
    lines: [
      { lineId: 'el_007_1', itemId: null, description: 'Data Analytics Platform', quantity: 1, rate: 5000, amount: 5000, taxRate: 10 },
      { lineId: 'el_007_2', itemId: null, description: 'Custom Dashboards (x3)', quantity: 3, rate: 800, amount: 2400, taxRate: 0 },
    ],
    subtotal: 7400,
    taxAmount: 500,
    discountAmount: 0,
    discountType: 'fixed',
    total: 7900,
    status: 'expired',
    notes: 'Quote expired. Customer may revisit in Q3.',
    createdAt: '2026-01-10T13:00:00Z',
  },

  // ── 8  EST-2008  Expired ──────────────────────────────────
  {
    estimateId: 'est_008',
    companyId: 'company_1',
    customerId: 'cust_003',
    customerName: 'Gamma Industries',
    estimateNumber: 'EST-2008',
    date: '2026-01-05',
    expirationDate: '2026-02-05',
    lines: [
      { lineId: 'el_008_1', itemId: null, description: 'Server Room Cooling Upgrade', quantity: 2, rate: 3500, amount: 7000, taxRate: 10 },
    ],
    subtotal: 7000,
    taxAmount: 700,
    discountAmount: 0,
    discountType: 'fixed',
    total: 7700,
    status: 'expired',
    notes: 'Expired. Follow-up scheduled.',
    createdAt: '2026-01-05T09:00:00Z',
  },
];
