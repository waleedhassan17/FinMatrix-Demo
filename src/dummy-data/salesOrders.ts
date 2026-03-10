// ============================================================
// FINMATRIX - Sales Orders Dummy Data
// ============================================================
// 6 SOs: 2 Open, 1 Partially Fulfilled, 2 Fulfilled, 1 Closed
// Lines: quantityOrdered, quantityFulfilled, rate, amount (ordered*rate)

export interface SOLine {
  lineId: string;
  itemId: string | null;
  description: string;
  quantityOrdered: number;
  quantityFulfilled: number;
  rate: number;
  amount: number;        // quantityOrdered * rate
  taxRate: number;
}

export type SOStatus =
  | 'open'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'closed';

export interface SalesOrder {
  salesOrderId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  soNumber: string;
  date: string;
  expectedDate: string;
  lines: SOLine[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  discountType: 'percentage' | 'fixed';
  total: number;
  status: SOStatus;
  notes: string;
  createdAt: string;
}

export const salesOrders: SalesOrder[] = [
  // ── 1  SO-3001  Open ──────────────────────────────────────
  {
    salesOrderId: 'so_001',
    companyId: 'company_1',
    customerId: 'cust_001',
    customerName: 'Acme Corp',
    soNumber: 'SO-3001',
    date: '2026-02-28',
    expectedDate: '2026-03-15',
    lines: [
      { lineId: 'sl_001_1', itemId: null, description: 'Server Rack (42U)', quantityOrdered: 2, quantityFulfilled: 0, rate: 1200, amount: 2400, taxRate: 10 },
      { lineId: 'sl_001_2', itemId: null, description: 'UPS Battery Backup', quantityOrdered: 4, quantityFulfilled: 0, rate: 350, amount: 1400, taxRate: 10 },
    ],
    subtotal: 3800,
    taxAmount: 380,
    discountAmount: 0,
    discountType: 'fixed',
    total: 4180,
    status: 'open',
    notes: 'Deliver to warehouse loading dock.',
    createdAt: '2026-02-28T10:00:00Z',
  },

  // ── 2  SO-3002  Open ──────────────────────────────────────
  {
    salesOrderId: 'so_002',
    companyId: 'company_1',
    customerId: 'cust_006',
    customerName: 'Zeta Logistics',
    soNumber: 'SO-3002',
    date: '2026-02-25',
    expectedDate: '2026-03-10',
    lines: [
      { lineId: 'sl_002_1', itemId: null, description: 'GPS Tracking Units', quantityOrdered: 30, quantityFulfilled: 0, rate: 120, amount: 3600, taxRate: 5 },
      { lineId: 'sl_002_2', itemId: null, description: 'Mounting Brackets', quantityOrdered: 30, quantityFulfilled: 0, rate: 15, amount: 450, taxRate: 0 },
    ],
    subtotal: 4050,
    taxAmount: 180,
    discountAmount: 0,
    discountType: 'fixed',
    total: 4230,
    status: 'open',
    notes: 'Phase 2 fleet expansion.',
    createdAt: '2026-02-25T14:00:00Z',
  },

  // ── 3  SO-3003  Partially Fulfilled ───────────────────────
  {
    salesOrderId: 'so_003',
    companyId: 'company_1',
    customerId: 'cust_002',
    customerName: 'Beta LLC',
    soNumber: 'SO-3003',
    date: '2026-02-18',
    expectedDate: '2026-03-05',
    lines: [
      { lineId: 'sl_003_1', itemId: null, description: 'Office Desks (Standing)', quantityOrdered: 20, quantityFulfilled: 12, rate: 450, amount: 9000, taxRate: 5 },
      { lineId: 'sl_003_2', itemId: null, description: 'Ergonomic Chairs', quantityOrdered: 20, quantityFulfilled: 20, rate: 280, amount: 5600, taxRate: 5 },
    ],
    subtotal: 14600,
    taxAmount: 730,
    discountAmount: 500,
    discountType: 'fixed',
    total: 14830,
    status: 'partially_fulfilled',
    notes: 'Chairs delivered. Remaining desks backordered.',
    createdAt: '2026-02-18T09:00:00Z',
  },

  // ── 4  SO-3004  Fulfilled ─────────────────────────────────
  {
    salesOrderId: 'so_004',
    companyId: 'company_1',
    customerId: 'cust_005',
    customerName: 'Epsilon Tech',
    soNumber: 'SO-3004',
    date: '2026-02-10',
    expectedDate: '2026-02-25',
    lines: [
      { lineId: 'sl_004_1', itemId: null, description: 'Development Laptops', quantityOrdered: 5, quantityFulfilled: 5, rate: 1800, amount: 9000, taxRate: 10 },
      { lineId: 'sl_004_2', itemId: null, description: 'External Monitors (27")', quantityOrdered: 10, quantityFulfilled: 10, rate: 400, amount: 4000, taxRate: 10 },
    ],
    subtotal: 13000,
    taxAmount: 1300,
    discountAmount: 0,
    discountType: 'fixed',
    total: 14300,
    status: 'fulfilled',
    notes: 'All items delivered and signed off.',
    createdAt: '2026-02-10T11:00:00Z',
  },

  // ── 5  SO-3005  Fulfilled ─────────────────────────────────
  {
    salesOrderId: 'so_005',
    companyId: 'company_1',
    customerId: 'cust_003',
    customerName: 'Gamma Industries',
    soNumber: 'SO-3005',
    date: '2026-02-05',
    expectedDate: '2026-02-20',
    lines: [
      { lineId: 'sl_005_1', itemId: null, description: 'Network Switches (48-port)', quantityOrdered: 3, quantityFulfilled: 3, rate: 850, amount: 2550, taxRate: 10 },
    ],
    subtotal: 2550,
    taxAmount: 255,
    discountAmount: 0,
    discountType: 'fixed',
    total: 2805,
    status: 'fulfilled',
    notes: 'Installed in server room B.',
    createdAt: '2026-02-05T15:00:00Z',
  },

  // ── 6  SO-3006  Closed ────────────────────────────────────
  {
    salesOrderId: 'so_006',
    companyId: 'company_1',
    customerId: 'cust_004',
    customerName: 'Delta Services',
    soNumber: 'SO-3006',
    date: '2026-01-20',
    expectedDate: '2026-02-05',
    lines: [
      { lineId: 'sl_006_1', itemId: null, description: 'Office Supplies Bundle', quantityOrdered: 50, quantityFulfilled: 50, rate: 25, amount: 1250, taxRate: 0 },
      { lineId: 'sl_006_2', itemId: null, description: 'Printer Toner (Black)', quantityOrdered: 20, quantityFulfilled: 20, rate: 45, amount: 900, taxRate: 0 },
    ],
    subtotal: 2150,
    taxAmount: 0,
    discountAmount: 0,
    discountType: 'fixed',
    total: 2150,
    status: 'closed',
    notes: 'Order complete and invoiced.',
    createdAt: '2026-01-20T10:00:00Z',
  },
];
