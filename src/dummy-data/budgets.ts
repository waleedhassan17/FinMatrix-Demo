// ============================================================
// FINMATRIX - Budget Dummy Data
// ============================================================
// One annual budget (2026) with monthly breakdown per expense account.

export interface BudgetLineItem {
  accountId: string;
  accountNumber: string;
  accountName: string;
  monthly: number[];        // 12 months (Jan=0 … Dec=11)
  annualTotal: number;
}

export interface Budget {
  budgetId: string;
  companyId: string;
  name: string;
  year: number;
  status: 'draft' | 'active' | 'closed';
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
  lineItems: BudgetLineItem[];
}

// ─── Helper ─────────────────────────────────────────────────
const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0);

const mkLine = (
  id: string,
  num: string,
  name: string,
  monthly: number[],
): BudgetLineItem => ({
  accountId: id,
  accountNumber: num,
  accountName: name,
  monthly,
  annualTotal: sum(monthly),
});

// ─── 2026 Budget ────────────────────────────────────────────
const lineItems: BudgetLineItem[] = [
  // COGS – seasonal: peaks in Mar, Jun, Sep, Nov
  mkLine('acc_021', '5000', 'Cost of Goods Sold', [
    4800, 5100, 5800, 5200, 5000, 5900, 5400, 5100, 5700, 5300, 5600, 5100,
  ]),
  // Purchase Discounts (contra – budgeted as negative)
  mkLine('acc_022', '5100', 'Purchase Discounts', [
    -150, -150, -160, -150, -150, -160, -150, -150, -160, -150, -160, -150,
  ]),
  // Rent – flat
  mkLine('acc_023', '6000', 'Rent Expense', [
    1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500, 1500,
  ]),
  // Utilities – seasonal (higher summer/winter)
  mkLine('acc_024', '6100', 'Utilities Expense', [
    420, 380, 340, 310, 320, 360, 410, 430, 390, 350, 370, 420,
  ]),
  // Salaries – flat base + Q4 bonus bump
  mkLine('acc_025', '6200', 'Salaries Expense', [
    7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000, 7000, 7200, 7800,
  ]),
  // Office Supplies – small, slightly higher Q1
  mkLine('acc_026', '6300', 'Office Supplies', [
    220, 200, 180, 160, 150, 150, 160, 150, 170, 180, 190, 200,
  ]),
  // Insurance – flat
  mkLine('acc_027', '6400', 'Insurance Expense', [
    520, 520, 520, 520, 520, 520, 520, 520, 520, 520, 520, 520,
  ]),
  // Depreciation – flat
  mkLine('acc_028', '6500', 'Depreciation Expense', [
    312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312, 312,
  ]),
  // Marketing – ramps up mid-year
  mkLine('acc_029', '6600', 'Marketing Expense', [
    600, 650, 700, 750, 800, 900, 950, 900, 850, 800, 750, 700,
  ]),
  // Travel – sporadic
  mkLine('acc_030', '6700', 'Travel Expense', [
    200, 250, 350, 280, 300, 400, 350, 280, 320, 250, 200, 300,
  ]),
  // Professional Fees – quarterly spikes (audit / tax)
  mkLine('acc_031', '6800', 'Professional Fees', [
    300, 300, 800, 300, 300, 800, 300, 300, 800, 300, 300, 800,
  ]),
  // Delivery Expenses – grows with sales
  mkLine('acc_032', '6900', 'Delivery Expenses', [
    550, 580, 640, 620, 650, 700, 720, 680, 710, 660, 690, 650,
  ]),
  // Interest – flat (on notes payable)
  mkLine('acc_033', '7000', 'Interest Expense', [
    200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200, 200,
  ]),
  // Miscellaneous
  mkLine('acc_035', '7200', 'Miscellaneous Expense', [
    40, 35, 45, 30, 40, 50, 35, 40, 45, 35, 40, 45,
  ]),
];

const totalBudget = lineItems.reduce((s, li) => s + li.annualTotal, 0);

export const budgets: Budget[] = [
  {
    budgetId: 'budget_001',
    companyId: 'company_1',
    name: 'Annual Operating Budget 2026',
    year: 2026,
    status: 'active',
    totalBudget,
    createdAt: '2025-12-15T10:00:00Z',
    updatedAt: '2026-01-05T14:30:00Z',
    lineItems,
  },
];
