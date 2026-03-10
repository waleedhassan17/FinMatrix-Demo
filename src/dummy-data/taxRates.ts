// ============================================================
// FINMATRIX - Tax Rates Dummy Data
// ============================================================

export interface TaxRate {
  taxId: string;
  name: string;
  rate: number;
  type: 'sales' | 'gst' | 'vat';
  isActive: boolean;
}

export const taxRates: TaxRate[] = [
  {
    taxId: 'tax_001',
    name: 'Sales Tax',
    rate: 7.5,
    type: 'sales',
    isActive: true,
  },
  {
    taxId: 'tax_002',
    name: 'State Tax',
    rate: 5,
    type: 'sales',
    isActive: true,
  },
  {
    taxId: 'tax_003',
    name: 'City Tax',
    rate: 2.5,
    type: 'sales',
    isActive: true,
  },
  {
    taxId: 'tax_004',
    name: 'GST',
    rate: 10,
    type: 'gst',
    isActive: true,
  },
  {
    taxId: 'tax_005',
    name: 'Service Tax',
    rate: 3,
    type: 'vat',
    isActive: false,
  },
];

export interface TaxPayment {
  paymentId: string;
  taxId: string;
  taxName: string;
  amount: number;
  date: string;
  bankAccountId: string;
  bankAccountName: string;
  reference: string;
  createdAt: string;
}

export const taxPayments: TaxPayment[] = [
  {
    paymentId: 'tp_001',
    taxId: 'tax_001',
    taxName: 'Sales Tax',
    amount: 1200,
    date: '2026-01-31',
    bankAccountId: 'acc_002',
    bankAccountName: 'Checking Account',
    reference: 'TAX-2026-001',
    createdAt: '2026-01-31T14:00:00Z',
  },
  {
    paymentId: 'tp_002',
    taxId: 'tax_002',
    taxName: 'State Tax',
    amount: 800,
    date: '2026-01-31',
    bankAccountId: 'acc_002',
    bankAccountName: 'Checking Account',
    reference: 'TAX-2026-002',
    createdAt: '2026-01-31T14:05:00Z',
  },
  {
    paymentId: 'tp_003',
    taxId: 'tax_004',
    taxName: 'GST',
    amount: 650,
    date: '2026-02-28',
    bankAccountId: 'acc_002',
    bankAccountName: 'Checking Account',
    reference: 'TAX-2026-003',
    createdAt: '2026-02-28T10:30:00Z',
  },
];
