// ============================================================
// FINMATRIX - Vendors Dummy Data
// ============================================================
// 12 vendors with full vendor shape.

export interface VendorAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type PaymentTerms = 'net_15' | 'net_30' | 'net_45' | 'net_60';

export interface Vendor {
  vendorId: string;
  companyId: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: VendorAddress;
  paymentTerms: PaymentTerms;
  taxId: string | null;
  defaultExpenseAccountId: string | null;
  balance: number;
  totalPurchases: number;
  isActive: boolean;
  createdAt: string;
}

export const vendors: Vendor[] = [
  // ── 1  Office Depot ───────────────────────────────────────
  {
    vendorId: 'vnd_001',
    companyId: 'company_1',
    companyName: 'Office Depot',
    contactPerson: 'Sarah Mitchell',
    email: 'sarah.m@officedepot.com',
    phone: '(800) 463-3768',
    address: { street: '6600 N Military Trail', city: 'Boca Raton', state: 'FL', zipCode: '33496', country: 'US' },
    paymentTerms: 'net_30',
    taxId: '59-1684790',
    defaultExpenseAccountId: 'acct_office_supplies',
    balance: 890,
    totalPurchases: 14500,
    isActive: true,
    createdAt: '2025-06-15T09:00:00Z',
  },
  // ── 2  TechSupply Co ──────────────────────────────────────
  {
    vendorId: 'vnd_002',
    companyId: 'company_1',
    companyName: 'TechSupply Co',
    contactPerson: 'James Rodriguez',
    email: 'james@techsupplyco.com',
    phone: '(415) 555-0192',
    address: { street: '1200 Innovation Blvd', city: 'San Jose', state: 'CA', zipCode: '95110', country: 'US' },
    paymentTerms: 'net_30',
    taxId: '94-3201567',
    defaultExpenseAccountId: 'acct_equipment',
    balance: 2340,
    totalPurchases: 28750,
    isActive: true,
    createdAt: '2025-04-20T14:30:00Z',
  },
  // ── 3  Logistics Partners ─────────────────────────────────
  {
    vendorId: 'vnd_003',
    companyId: 'company_1',
    companyName: 'Logistics Partners',
    contactPerson: 'Maria Chen',
    email: 'maria.chen@logisticspartners.com',
    phone: '(312) 555-0478',
    address: { street: '4500 Distribution Way', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'US' },
    paymentTerms: 'net_45',
    taxId: '36-7892014',
    defaultExpenseAccountId: 'acct_shipping',
    balance: 1200,
    totalPurchases: 32100,
    isActive: true,
    createdAt: '2025-03-10T11:15:00Z',
  },
  // ── 4  CloudHost Inc ──────────────────────────────────────
  {
    vendorId: 'vnd_004',
    companyId: 'company_1',
    companyName: 'CloudHost Inc',
    contactPerson: 'Kevin Park',
    email: 'kevin.park@cloudhost.io',
    phone: '(206) 555-0331',
    address: { street: '800 Cloud Center Dr', city: 'Seattle', state: 'WA', zipCode: '98101', country: 'US' },
    paymentTerms: 'net_30',
    taxId: '91-4567823',
    defaultExpenseAccountId: 'acct_cloud_services',
    balance: 450,
    totalPurchases: 18200,
    isActive: true,
    createdAt: '2025-05-01T08:45:00Z',
  },
  // ── 5  Insurance Corp ─────────────────────────────────────
  {
    vendorId: 'vnd_005',
    companyId: 'company_1',
    companyName: 'Insurance Corp',
    contactPerson: 'Linda Foster',
    email: 'linda.foster@insurancecorp.com',
    phone: '(212) 555-0699',
    address: { street: '350 Park Avenue', city: 'New York', state: 'NY', zipCode: '10022', country: 'US' },
    paymentTerms: 'net_30',
    taxId: '13-5678901',
    defaultExpenseAccountId: 'acct_insurance',
    balance: 0,
    totalPurchases: 24000,
    isActive: true,
    createdAt: '2025-01-15T10:00:00Z',
  },
  // ── 6  Marketing Agency ───────────────────────────────────
  {
    vendorId: 'vnd_006',
    companyId: 'company_1',
    companyName: 'Marketing Agency',
    contactPerson: 'David Kim',
    email: 'david.kim@marketingagency.com',
    phone: '(323) 555-0845',
    address: { street: '9200 Sunset Blvd', city: 'Los Angeles', state: 'CA', zipCode: '90069', country: 'US' },
    paymentTerms: 'net_30',
    taxId: '95-2345678',
    defaultExpenseAccountId: 'acct_marketing',
    balance: 2100,
    totalPurchases: 45600,
    isActive: true,
    createdAt: '2025-02-28T13:20:00Z',
  },
  // ── 7  Janitorial Services ────────────────────────────────
  {
    vendorId: 'vnd_007',
    companyId: 'company_1',
    companyName: 'Janitorial Services',
    contactPerson: 'Rosa Garcia',
    email: 'rosa@janitorialservices.net',
    phone: '(713) 555-0241',
    address: { street: '2100 Maintenance Rd', city: 'Houston', state: 'TX', zipCode: '77001', country: 'US' },
    paymentTerms: 'net_15',
    taxId: '76-1234567',
    defaultExpenseAccountId: 'acct_maintenance',
    balance: 340,
    totalPurchases: 8900,
    isActive: true,
    createdAt: '2025-07-10T16:00:00Z',
  },
  // ── 8  Equipment Leasing ──────────────────────────────────
  {
    vendorId: 'vnd_008',
    companyId: 'company_1',
    companyName: 'Equipment Leasing',
    contactPerson: 'Tom Williams',
    email: 'tom@equipleasing.com',
    phone: '(602) 555-0174',
    address: { street: '500 Lease Center Way', city: 'Phoenix', state: 'AZ', zipCode: '85001', country: 'US' },
    paymentTerms: 'net_60',
    taxId: '86-9876543',
    defaultExpenseAccountId: 'acct_equipment_lease',
    balance: 1800,
    totalPurchases: 52000,
    isActive: true,
    createdAt: '2025-01-20T09:30:00Z',
  },
  // ── 9  Software Solutions ─────────────────────────────────
  {
    vendorId: 'vnd_009',
    companyId: 'company_1',
    companyName: 'Software Solutions',
    contactPerson: 'Emily Zhang',
    email: 'emily.zhang@softsolutions.com',
    phone: '(512) 555-0388',
    address: { street: '700 Tech Park Dr', city: 'Austin', state: 'TX', zipCode: '78701', country: 'US' },
    paymentTerms: 'net_30',
    taxId: '74-6543210',
    defaultExpenseAccountId: 'acct_software',
    balance: 630,
    totalPurchases: 21300,
    isActive: true,
    createdAt: '2025-05-18T12:00:00Z',
  },
  // ── 10  Professional Consulting ───────────────────────────
  {
    vendorId: 'vnd_010',
    companyId: 'company_1',
    companyName: 'Professional Consulting',
    contactPerson: 'Michael Brown',
    email: 'michael@proconsulting.com',
    phone: '(617) 555-0522',
    address: { street: '100 Advisory Lane', city: 'Boston', state: 'MA', zipCode: '02101', country: 'US' },
    paymentTerms: 'net_45',
    taxId: '04-8765432',
    defaultExpenseAccountId: 'acct_consulting',
    balance: 1500,
    totalPurchases: 38000,
    isActive: true,
    createdAt: '2025-03-05T10:45:00Z',
  },
  // ── 11  Auto Parts Depot ──────────────────────────────────
  {
    vendorId: 'vnd_011',
    companyId: 'company_1',
    companyName: 'Auto Parts Depot',
    contactPerson: 'Carlos Hernandez',
    email: 'carlos@autopartsdepot.com',
    phone: '(305) 555-0917',
    address: { street: '3300 Motor Blvd', city: 'Miami', state: 'FL', zipCode: '33101', country: 'US' },
    paymentTerms: 'net_30',
    taxId: '65-3456789',
    defaultExpenseAccountId: 'acct_vehicle_expense',
    balance: 780,
    totalPurchases: 11200,
    isActive: false,
    createdAt: '2025-08-01T15:30:00Z',
  },
  // ── 12  Raw Materials Ltd ─────────────────────────────────
  {
    vendorId: 'vnd_012',
    companyId: 'company_1',
    companyName: 'Raw Materials Ltd',
    contactPerson: 'Anika Patel',
    email: 'anika@rawmaterialsltd.com',
    phone: '(404) 555-0663',
    address: { street: '8000 Industrial Pkwy', city: 'Atlanta', state: 'GA', zipCode: '30301', country: 'US' },
    paymentTerms: 'net_45',
    taxId: '58-2109876',
    defaultExpenseAccountId: 'acct_raw_materials',
    balance: 3200,
    totalPurchases: 67500,
    isActive: true,
    createdAt: '2025-02-10T08:15:00Z',
  },
];
