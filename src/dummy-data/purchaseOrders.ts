// ============================================================
// FINMATRIX - Purchase Orders Dummy Data
// ============================================================
// 10 POs: 2 draft, 3 sent, 2 partially_received, 2 fully_received, 1 closed
// Math: line.amount = line.quantity * line.unitCost
//       subtotal    = Σ line.amount
//       taxAmount   = Σ (line.quantity * line.unitCost * 0.10)  (10% default)
//       total       = subtotal + taxAmount

export interface POLine {
  lineId: string;
  itemId: string | null;
  itemName: string;
  description: string;
  quantity: number;
  receivedQuantity: number;
  unitCost: number;
  amount: number;        // quantity * unitCost
  taxRate: number;
}

export type POStatus =
  | 'draft'
  | 'sent'
  | 'partially_received'
  | 'fully_received'
  | 'closed';

export interface PurchaseOrder {
  poId: string;
  companyId: string;
  vendorId: string;
  vendorName: string;
  poNumber: string;
  date: string;
  expectedDate: string;
  lines: POLine[];
  subtotal: number;
  taxAmount: number;
  total: number;
  status: POStatus;
  notes: string;
  createdAt: string;
}

export const purchaseOrders: PurchaseOrder[] = [
  // ── 1  PO-001  Draft ──────────────────────────────────────
  {
    poId: 'po_001',
    companyId: 'company_1',
    vendorId: 'vnd_001',
    vendorName: 'Office Depot',
    poNumber: 'PO-001',
    date: '2026-03-10',
    expectedDate: '2026-03-25',
    lines: [
      { lineId: 'pol_001_1', itemId: 'item_001', itemName: 'Printer Paper (Box)', description: 'A4 white, 10 reams', quantity: 20, receivedQuantity: 0, unitCost: 25, amount: 500, taxRate: 10 },
      { lineId: 'pol_001_2', itemId: 'item_002', itemName: 'Toner Cartridge', description: 'Black HP LaserJet', quantity: 8, receivedQuantity: 0, unitCost: 45, amount: 360, taxRate: 10 },
    ],
    subtotal: 860,       // 500 + 360
    taxAmount: 86,        // 50 + 36
    total: 946,           // 860 + 86
    status: 'draft',
    notes: 'Monthly office supplies replenishment.',
    createdAt: '2026-03-10T08:00:00Z',
  },

  // ── 2  PO-002  Draft ──────────────────────────────────────
  {
    poId: 'po_002',
    companyId: 'company_1',
    vendorId: 'vnd_002',
    vendorName: 'TechSupply Co',
    poNumber: 'PO-002',
    date: '2026-03-12',
    expectedDate: '2026-03-28',
    lines: [
      { lineId: 'pol_002_1', itemId: 'item_003', itemName: 'USB-C Docking Station', description: 'Dell WD19S', quantity: 5, receivedQuantity: 0, unitCost: 180, amount: 900, taxRate: 10 },
      { lineId: 'pol_002_2', itemId: 'item_004', itemName: 'Wireless Keyboard', description: 'Logitech MX Keys', quantity: 10, receivedQuantity: 0, unitCost: 95, amount: 950, taxRate: 10 },
      { lineId: 'pol_002_3', itemId: 'item_005', itemName: 'Monitor Stand', description: 'Ergonomic adjustable', quantity: 10, receivedQuantity: 0, unitCost: 42, amount: 420, taxRate: 10 },
    ],
    subtotal: 2270,       // 900 + 950 + 420
    taxAmount: 227,        // 90 + 95 + 42
    total: 2497,           // 2270 + 227
    status: 'draft',
    notes: 'New hire equipment for Q2 onboarding.',
    createdAt: '2026-03-12T10:15:00Z',
  },

  // ── 3  PO-003  Sent ───────────────────────────────────────
  {
    poId: 'po_003',
    companyId: 'company_1',
    vendorId: 'vnd_003',
    vendorName: 'Global Parts Inc',
    poNumber: 'PO-003',
    date: '2026-03-08',
    expectedDate: '2026-03-22',
    lines: [
      { lineId: 'pol_003_1', itemId: 'item_006', itemName: 'Server Rack (42U)', description: 'Black steel, lockable', quantity: 2, receivedQuantity: 0, unitCost: 1200, amount: 2400, taxRate: 10 },
      { lineId: 'pol_003_2', itemId: 'item_007', itemName: 'UPS Battery Backup', description: 'APC 1500VA', quantity: 4, receivedQuantity: 0, unitCost: 350, amount: 1400, taxRate: 10 },
    ],
    subtotal: 3800,       // 2400 + 1400
    taxAmount: 380,        // 240 + 140
    total: 4180,           // 3800 + 380
    status: 'sent',
    notes: 'Data center expansion project.',
    createdAt: '2026-03-08T14:00:00Z',
  },

  // ── 4  PO-004  Sent ───────────────────────────────────────
  {
    poId: 'po_004',
    companyId: 'company_1',
    vendorId: 'vnd_004',
    vendorName: 'BuildRight Materials',
    poNumber: 'PO-004',
    date: '2026-03-06',
    expectedDate: '2026-03-20',
    lines: [
      { lineId: 'pol_004_1', itemId: 'item_008', itemName: 'Standing Desk Frame', description: 'Electric dual motor', quantity: 6, receivedQuantity: 0, unitCost: 320, amount: 1920, taxRate: 10 },
      { lineId: 'pol_004_2', itemId: 'item_009', itemName: 'Desktop Surface (60")', description: 'Walnut laminate', quantity: 6, receivedQuantity: 0, unitCost: 110, amount: 660, taxRate: 10 },
    ],
    subtotal: 2580,       // 1920 + 660
    taxAmount: 258,        // 192 + 66
    total: 2838,           // 2580 + 258
    status: 'sent',
    notes: 'Office furniture upgrade — standing desks for engineering team.',
    createdAt: '2026-03-06T09:30:00Z',
  },

  // ── 5  PO-005  Sent ───────────────────────────────────────
  {
    poId: 'po_005',
    companyId: 'company_1',
    vendorId: 'vnd_005',
    vendorName: 'CleanPro Services',
    poNumber: 'PO-005',
    date: '2026-03-04',
    expectedDate: '2026-03-18',
    lines: [
      { lineId: 'pol_005_1', itemId: 'item_010', itemName: 'Hand Sanitizer (Gallon)', description: 'Bulk pump refill', quantity: 12, receivedQuantity: 0, unitCost: 18, amount: 216, taxRate: 10 },
      { lineId: 'pol_005_2', itemId: 'item_011', itemName: 'Disinfectant Wipes', description: '75 ct canisters', quantity: 30, receivedQuantity: 0, unitCost: 8, amount: 240, taxRate: 10 },
      { lineId: 'pol_005_3', itemId: 'item_012', itemName: 'Trash Bags (50 Gal)', description: '100 bags per roll', quantity: 10, receivedQuantity: 0, unitCost: 22, amount: 220, taxRate: 10 },
    ],
    subtotal: 676,         // 216 + 240 + 220
    taxAmount: 67.6,       // 21.6 + 24 + 22
    total: 743.6,          // 676 + 67.6
    status: 'sent',
    notes: 'Quarterly janitorial supplies restock.',
    createdAt: '2026-03-04T11:00:00Z',
  },

  // ── 6  PO-006  Partially Received ─────────────────────────
  {
    poId: 'po_006',
    companyId: 'company_1',
    vendorId: 'vnd_002',
    vendorName: 'TechSupply Co',
    poNumber: 'PO-006',
    date: '2026-02-25',
    expectedDate: '2026-03-10',
    lines: [
      { lineId: 'pol_006_1', itemId: 'item_013', itemName: 'Laptop (Dell Latitude)', description: '14" i7 16GB', quantity: 8, receivedQuantity: 5, unitCost: 1100, amount: 8800, taxRate: 10 },
      { lineId: 'pol_006_2', itemId: 'item_014', itemName: 'Laptop Bag', description: 'Nylon 15.6"', quantity: 8, receivedQuantity: 5, unitCost: 35, amount: 280, taxRate: 10 },
      { lineId: 'pol_006_3', itemId: 'item_015', itemName: 'Wireless Mouse', description: 'Logitech M720 Triathlon', quantity: 8, receivedQuantity: 8, unitCost: 50, amount: 400, taxRate: 10 },
    ],
    subtotal: 9480,        // 8800 + 280 + 400
    taxAmount: 948,         // 880 + 28 + 40
    total: 10428,           // 9480 + 948
    status: 'partially_received',
    notes: 'Laptops arriving in two batches — 5 received, 3 pending.',
    createdAt: '2026-02-25T08:45:00Z',
  },

  // ── 7  PO-007  Partially Received ─────────────────────────
  {
    poId: 'po_007',
    companyId: 'company_1',
    vendorId: 'vnd_003',
    vendorName: 'Global Parts Inc',
    poNumber: 'PO-007',
    date: '2026-02-20',
    expectedDate: '2026-03-05',
    lines: [
      { lineId: 'pol_007_1', itemId: 'item_016', itemName: 'Ethernet Cable (50ft)', description: 'Cat6a shielded', quantity: 50, receivedQuantity: 50, unitCost: 12, amount: 600, taxRate: 10 },
      { lineId: 'pol_007_2', itemId: 'item_017', itemName: 'Network Switch (24-port)', description: 'Cisco SG350', quantity: 3, receivedQuantity: 1, unitCost: 420, amount: 1260, taxRate: 10 },
      { lineId: 'pol_007_3', itemId: 'item_018', itemName: 'Patch Panel (48-port)', description: 'Keystone', quantity: 2, receivedQuantity: 0, unitCost: 65, amount: 130, taxRate: 10 },
    ],
    subtotal: 1990,        // 600 + 1260 + 130
    taxAmount: 199,         // 60 + 126 + 13
    total: 2189,            // 1990 + 199
    status: 'partially_received',
    notes: 'Network infrastructure order — cables received, switches and patch panels pending.',
    createdAt: '2026-02-20T13:20:00Z',
  },

  // ── 8  PO-008  Fully Received ─────────────────────────────
  {
    poId: 'po_008',
    companyId: 'company_1',
    vendorId: 'vnd_001',
    vendorName: 'Office Depot',
    poNumber: 'PO-008',
    date: '2026-02-15',
    expectedDate: '2026-02-28',
    lines: [
      { lineId: 'pol_008_1', itemId: 'item_019', itemName: 'Whiteboard (6x4)', description: 'Magnetic dry-erase', quantity: 4, receivedQuantity: 4, unitCost: 150, amount: 600, taxRate: 10 },
      { lineId: 'pol_008_2', itemId: 'item_020', itemName: 'Whiteboard Markers (12pk)', description: 'Assorted colors', quantity: 10, receivedQuantity: 10, unitCost: 14, amount: 140, taxRate: 10 },
    ],
    subtotal: 740,         // 600 + 140
    taxAmount: 74,          // 60 + 14
    total: 814,             // 740 + 74
    status: 'fully_received',
    notes: 'Conference room supplies — all items received.',
    createdAt: '2026-02-15T10:00:00Z',
  },

  // ── 9  PO-009  Fully Received ─────────────────────────────
  {
    poId: 'po_009',
    companyId: 'company_1',
    vendorId: 'vnd_004',
    vendorName: 'BuildRight Materials',
    poNumber: 'PO-009',
    date: '2026-02-10',
    expectedDate: '2026-02-25',
    lines: [
      { lineId: 'pol_009_1', itemId: 'item_021', itemName: 'Office Chair (Ergonomic)', description: 'Herman Miller Aeron', quantity: 5, receivedQuantity: 5, unitCost: 890, amount: 4450, taxRate: 10 },
      { lineId: 'pol_009_2', itemId: 'item_022', itemName: 'Floor Mat', description: 'Anti-fatigue standing mat', quantity: 5, receivedQuantity: 5, unitCost: 55, amount: 275, taxRate: 10 },
    ],
    subtotal: 4725,        // 4450 + 275
    taxAmount: 472.5,       // 445 + 27.5
    total: 5197.5,          // 4725 + 472.5
    status: 'fully_received',
    notes: 'Ergonomic furniture batch — all delivered successfully.',
    createdAt: '2026-02-10T15:30:00Z',
  },

  // ── 10  PO-010  Closed ────────────────────────────────────
  {
    poId: 'po_010',
    companyId: 'company_1',
    vendorId: 'vnd_005',
    vendorName: 'CleanPro Services',
    poNumber: 'PO-010',
    date: '2026-01-20',
    expectedDate: '2026-02-05',
    lines: [
      { lineId: 'pol_010_1', itemId: 'item_023', itemName: 'Floor Cleaner (5 Gal)', description: 'Industrial grade concentrate', quantity: 4, receivedQuantity: 4, unitCost: 48, amount: 192, taxRate: 10 },
      { lineId: 'pol_010_2', itemId: 'item_024', itemName: 'Mop Head (Commercial)', description: 'Microfiber 18"', quantity: 6, receivedQuantity: 6, unitCost: 15, amount: 90, taxRate: 10 },
    ],
    subtotal: 282,         // 192 + 90
    taxAmount: 28.2,        // 19.2 + 9
    total: 310.2,           // 282 + 28.2
    status: 'closed',
    notes: 'January janitorial order — received and billed.',
    createdAt: '2026-01-20T09:00:00Z',
  },
];
