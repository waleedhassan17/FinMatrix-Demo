// ============================================================
// FINMATRIX - Dashboard Dummy Data
// ============================================================

export interface DashboardStats {
  totalRevenue: { value: string; trend: string; trendType: 'positive' | 'negative' };
  totalExpenses: { value: string; trend: string; trendType: 'positive' | 'negative' };
  netProfit: { value: string; trend: string; trendType: 'positive' | 'negative' };
  cashOnHand: { value: string };
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
}

export interface DeliveryOverview {
  assigned: number;
  inTransit: number;
  delivered: number;
  pending: number;
  total: number;
}

export interface Alert {
  id: string;
  title: string;
  type: 'warning' | 'danger' | 'info';
  icon: string;
}

export const dashboardStats: DashboardStats = {
  totalRevenue: {
    value: '$48,520',
    trend: '+12.5%',
    trendType: 'positive',
  },
  totalExpenses: {
    value: '$22,340',
    trend: '-3.2%',
    trendType: 'positive', // negative expenses is good
  },
  netProfit: {
    value: '$26,180',
    trend: '+18.7%',
    trendType: 'positive',
  },
  cashOnHand: {
    value: '$34,200',
  },
};

export const recentTransactions: Transaction[] = [
  {
    id: '1',
    type: 'income',
    description: 'Invoice #1024 - Acme Corp',
    amount: 3200,
    date: 'Today',
    category: 'Sales',
  },
  {
    id: '2',
    type: 'expense',
    description: 'Office Supplies Bulk Order',
    amount: 450,
    date: 'Yesterday',
    category: 'Expenses',
  },
  {
    id: '3',
    type: 'income',
    description: 'Invoice #1023 - Beta LLC',
    amount: 1800,
    date: '2 days ago',
    category: 'Sales',
  },
  {
    id: '4',
    type: 'expense',
    description: 'Payroll Run - March W1',
    amount: 12400,
    date: '3 days ago',
    category: 'Payroll',
  },
  {
    id: '5',
    type: 'income',
    description: 'Invoice #1022 - Gamma Inc',
    amount: 5600,
    date: '4 days ago',
    category: 'Sales',
  },
];

export const deliveryOverview: DeliveryOverview = {
  assigned: 12,
  inTransit: 4,
  delivered: 6,
  pending: 2,
  total: 12,
};

export const alerts: Alert[] = [
  {
    id: '1',
    title: '3 items below reorder point',
    type: 'warning',
    icon: '⚠️',
  },
  {
    id: '2',
    title: '5 invoices overdue ($4,200)',
    type: 'danger',
    icon: '🚨',
  },
  {
    id: '3',
    title: '2 inventory updates pending approval',
    type: 'info',
    icon: 'ℹ️',
  },
];
