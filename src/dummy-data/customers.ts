// ============================================================
// FINMATRIX - Customers Dummy Data
// ============================================================

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface Customer {
  customerId: string;
  companyId: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  address: Address;
  billingAddress: Address;
  shippingAddress: Address;
  creditLimit: number;
  paymentTerms: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt';
  balance: number;
  totalPurchases: number;
  isActive: boolean;
  createdAt: string;
}

export const customers: Customer[] = [
  // ─── 1. Acme Corp ────────────────────────────────────────
  {
    customerId: 'cust_001',
    companyId: 'company_1',
    name: 'John Mitchell',
    company: 'Acme Corp',
    email: 'john.mitchell@acmecorp.com',
    phone: '(555) 100-2001',
    address: { street: '123 Industrial Blvd', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'US' },
    billingAddress: { street: '123 Industrial Blvd', city: 'Chicago', state: 'IL', zipCode: '60601', country: 'US' },
    shippingAddress: { street: '456 Warehouse Ln', city: 'Chicago', state: 'IL', zipCode: '60602', country: 'US' },
    creditLimit: 25000,
    paymentTerms: 'net_30',
    balance: 3200,
    totalPurchases: 48750,
    isActive: true,
    createdAt: '2025-06-15T10:00:00Z',
  },

  // ─── 2. Beta LLC ─────────────────────────────────────────
  {
    customerId: 'cust_002',
    companyId: 'company_1',
    name: 'Sarah Johnson',
    company: 'Beta LLC',
    email: 'sarah.j@betallc.com',
    phone: '(555) 200-3002',
    address: { street: '789 Commerce St', city: 'Austin', state: 'TX', zipCode: '73301', country: 'US' },
    billingAddress: { street: '789 Commerce St', city: 'Austin', state: 'TX', zipCode: '73301', country: 'US' },
    shippingAddress: { street: '789 Commerce St', city: 'Austin', state: 'TX', zipCode: '73301', country: 'US' },
    creditLimit: 15000,
    paymentTerms: 'net_30',
    balance: 1800,
    totalPurchases: 22400,
    isActive: true,
    createdAt: '2025-07-22T14:30:00Z',
  },

  // ─── 3. Gamma Industries ─────────────────────────────────
  {
    customerId: 'cust_003',
    companyId: 'company_1',
    name: 'Robert Chen',
    company: 'Gamma Industries',
    email: 'r.chen@gamma-ind.com',
    phone: '(555) 300-4003',
    address: { street: '1500 Tech Park Dr', city: 'San Jose', state: 'CA', zipCode: '95110', country: 'US' },
    billingAddress: { street: '1500 Tech Park Dr', city: 'San Jose', state: 'CA', zipCode: '95110', country: 'US' },
    shippingAddress: { street: '1502 Tech Park Dr, Unit B', city: 'San Jose', state: 'CA', zipCode: '95110', country: 'US' },
    creditLimit: 50000,
    paymentTerms: 'net_45',
    balance: 5600,
    totalPurchases: 87300,
    isActive: true,
    createdAt: '2025-04-10T09:15:00Z',
  },

  // ─── 4. Delta Services (paid up) ─────────────────────────
  {
    customerId: 'cust_004',
    companyId: 'company_1',
    name: 'Maria Garcia',
    company: 'Delta Services',
    email: 'maria@deltaservices.io',
    phone: '(555) 400-5004',
    address: { street: '220 Main St', city: 'Denver', state: 'CO', zipCode: '80201', country: 'US' },
    billingAddress: { street: '220 Main St', city: 'Denver', state: 'CO', zipCode: '80201', country: 'US' },
    shippingAddress: { street: '220 Main St', city: 'Denver', state: 'CO', zipCode: '80201', country: 'US' },
    creditLimit: 10000,
    paymentTerms: 'net_15',
    balance: 0,
    totalPurchases: 15600,
    isActive: true,
    createdAt: '2025-08-05T11:45:00Z',
  },

  // ─── 5. Epsilon Tech (overdue) ───────────────────────────
  {
    customerId: 'cust_005',
    companyId: 'company_1',
    name: 'David Park',
    company: 'Epsilon Tech',
    email: 'dpark@epsilontech.com',
    phone: '(555) 500-6005',
    address: { street: '900 Silicon Ave', city: 'Palo Alto', state: 'CA', zipCode: '94301', country: 'US' },
    billingAddress: { street: '900 Silicon Ave', city: 'Palo Alto', state: 'CA', zipCode: '94301', country: 'US' },
    shippingAddress: { street: '905 Silicon Ave, Suite 200', city: 'Palo Alto', state: 'CA', zipCode: '94301', country: 'US' },
    creditLimit: 30000,
    paymentTerms: 'net_30',
    balance: 4200,
    totalPurchases: 62100,
    isActive: true,
    createdAt: '2025-03-18T08:00:00Z',
  },

  // ─── 6. Zeta Logistics ───────────────────────────────────
  {
    customerId: 'cust_006',
    companyId: 'company_1',
    name: 'Emily Watson',
    company: 'Zeta Logistics',
    email: 'ewatson@zetalogistics.com',
    phone: '(555) 600-7006',
    address: { street: '3400 Harbor Blvd', city: 'Long Beach', state: 'CA', zipCode: '90801', country: 'US' },
    billingAddress: { street: '3400 Harbor Blvd', city: 'Long Beach', state: 'CA', zipCode: '90801', country: 'US' },
    shippingAddress: { street: '3400 Harbor Blvd', city: 'Long Beach', state: 'CA', zipCode: '90801', country: 'US' },
    creditLimit: 40000,
    paymentTerms: 'net_60',
    balance: 8900,
    totalPurchases: 124500,
    isActive: true,
    createdAt: '2025-02-10T13:00:00Z',
  },

  // ─── 7. Theta Manufacturing ───────────────────────────────
  {
    customerId: 'cust_007',
    companyId: 'company_1',
    name: 'James O\'Brien',
    company: 'Theta Manufacturing',
    email: 'jobrien@thetamfg.com',
    phone: '(555) 700-8007',
    address: { street: '1800 Factory Rd', city: 'Detroit', state: 'MI', zipCode: '48201', country: 'US' },
    billingAddress: { street: '1800 Factory Rd', city: 'Detroit', state: 'MI', zipCode: '48201', country: 'US' },
    shippingAddress: { street: '1850 Factory Rd, Dock 3', city: 'Detroit', state: 'MI', zipCode: '48201', country: 'US' },
    creditLimit: 35000,
    paymentTerms: 'net_45',
    balance: 2750,
    totalPurchases: 56800,
    isActive: true,
    createdAt: '2025-05-28T16:20:00Z',
  },

  // ─── 8. Iota Consulting ───────────────────────────────────
  {
    customerId: 'cust_008',
    companyId: 'company_1',
    name: 'Lisa Thompson',
    company: 'Iota Consulting',
    email: 'lisa@iotaconsulting.co',
    phone: '(555) 800-9008',
    address: { street: '55 Park Ave, Floor 12', city: 'New York', state: 'NY', zipCode: '10016', country: 'US' },
    billingAddress: { street: '55 Park Ave, Floor 12', city: 'New York', state: 'NY', zipCode: '10016', country: 'US' },
    shippingAddress: { street: '55 Park Ave, Floor 12', city: 'New York', state: 'NY', zipCode: '10016', country: 'US' },
    creditLimit: 20000,
    paymentTerms: 'net_30',
    balance: 0,
    totalPurchases: 31200,
    isActive: true,
    createdAt: '2025-09-01T10:30:00Z',
  },

  // ─── 9. Kappa Foods ──────────────────────────────────────
  {
    customerId: 'cust_009',
    companyId: 'company_1',
    name: 'Carlos Rivera',
    company: 'Kappa Foods',
    email: 'crivera@kappafoods.com',
    phone: '(555) 900-1009',
    address: { street: '2200 Culinary Pkwy', city: 'Miami', state: 'FL', zipCode: '33101', country: 'US' },
    billingAddress: { street: '2200 Culinary Pkwy', city: 'Miami', state: 'FL', zipCode: '33101', country: 'US' },
    shippingAddress: { street: '2210 Culinary Pkwy, Cold Storage', city: 'Miami', state: 'FL', zipCode: '33101', country: 'US' },
    creditLimit: 18000,
    paymentTerms: 'net_15',
    balance: 1250,
    totalPurchases: 19800,
    isActive: true,
    createdAt: '2025-10-12T07:45:00Z',
  },

  // ─── 10. Lambda Design (inactive) ────────────────────────
  {
    customerId: 'cust_010',
    companyId: 'company_1',
    name: 'Amy Nguyen',
    company: 'Lambda Design',
    email: 'amy@lambdadesign.com',
    phone: '(555) 010-2010',
    address: { street: '650 Creative Blvd', city: 'Portland', state: 'OR', zipCode: '97201', country: 'US' },
    billingAddress: { street: '650 Creative Blvd', city: 'Portland', state: 'OR', zipCode: '97201', country: 'US' },
    shippingAddress: { street: '650 Creative Blvd', city: 'Portland', state: 'OR', zipCode: '97201', country: 'US' },
    creditLimit: 8000,
    paymentTerms: 'net_30',
    balance: 450,
    totalPurchases: 7200,
    isActive: false,
    createdAt: '2025-01-20T15:00:00Z',
  },

  // ─── 11. Mu Healthcare ───────────────────────────────────
  {
    customerId: 'cust_011',
    companyId: 'company_1',
    name: 'Dr. Steven Patel',
    company: 'Mu Healthcare',
    email: 'spatel@muhealthcare.org',
    phone: '(555) 110-3011',
    address: { street: '400 Medical Center Dr', city: 'Houston', state: 'TX', zipCode: '77001', country: 'US' },
    billingAddress: { street: '400 Medical Center Dr', city: 'Houston', state: 'TX', zipCode: '77001', country: 'US' },
    shippingAddress: { street: '410 Medical Center Dr, Receiving', city: 'Houston', state: 'TX', zipCode: '77001', country: 'US' },
    creditLimit: 60000,
    paymentTerms: 'net_60',
    balance: 12400,
    totalPurchases: 156000,
    isActive: true,
    createdAt: '2024-11-08T09:00:00Z',
  },

  // ─── 12. Nu Construction ─────────────────────────────────
  {
    customerId: 'cust_012',
    companyId: 'company_1',
    name: 'Frank Kowalski',
    company: 'Nu Construction',
    email: 'frank@nuconstruction.com',
    phone: '(555) 120-4012',
    address: { street: '88 Builder Way', city: 'Phoenix', state: 'AZ', zipCode: '85001', country: 'US' },
    billingAddress: { street: '88 Builder Way', city: 'Phoenix', state: 'AZ', zipCode: '85001', country: 'US' },
    shippingAddress: { street: '90 Builder Way, Lot C', city: 'Phoenix', state: 'AZ', zipCode: '85001', country: 'US' },
    creditLimit: 45000,
    paymentTerms: 'net_45',
    balance: 6300,
    totalPurchases: 93400,
    isActive: true,
    createdAt: '2025-03-05T12:15:00Z',
  },

  // ─── 13. Xi Education (inactive) ─────────────────────────
  {
    customerId: 'cust_013',
    companyId: 'company_1',
    name: 'Rachel Kim',
    company: 'Xi Education',
    email: 'rkim@xieducation.edu',
    phone: '(555) 130-5013',
    address: { street: '1000 Campus Dr', city: 'Boston', state: 'MA', zipCode: '02101', country: 'US' },
    billingAddress: { street: '1000 Campus Dr', city: 'Boston', state: 'MA', zipCode: '02101', country: 'US' },
    shippingAddress: { street: '1000 Campus Dr', city: 'Boston', state: 'MA', zipCode: '02101', country: 'US' },
    creditLimit: 12000,
    paymentTerms: 'due_on_receipt',
    balance: 0,
    totalPurchases: 4800,
    isActive: false,
    createdAt: '2025-06-30T14:00:00Z',
  },

  // ─── 14. Omicron Retail ───────────────────────────────────
  {
    customerId: 'cust_014',
    companyId: 'company_1',
    name: 'Kevin Brooks',
    company: 'Omicron Retail',
    email: 'kbrooks@omicronretail.com',
    phone: '(555) 140-6014',
    address: { street: '3300 Shopping Center Rd', city: 'Atlanta', state: 'GA', zipCode: '30301', country: 'US' },
    billingAddress: { street: '3300 Shopping Center Rd', city: 'Atlanta', state: 'GA', zipCode: '30301', country: 'US' },
    shippingAddress: { street: '3305 Shopping Center Rd, Loading Bay', city: 'Atlanta', state: 'GA', zipCode: '30301', country: 'US' },
    creditLimit: 22000,
    paymentTerms: 'net_30',
    balance: 3850,
    totalPurchases: 41200,
    isActive: true,
    createdAt: '2025-07-14T11:30:00Z',
  },

  // ─── 15. Pi Energy ───────────────────────────────────────
  {
    customerId: 'cust_015',
    companyId: 'company_1',
    name: 'Natasha Volkov',
    company: 'Pi Energy',
    email: 'nvolkov@pienergy.com',
    phone: '(555) 150-7015',
    address: { street: '700 Renewable Way', city: 'Seattle', state: 'WA', zipCode: '98101', country: 'US' },
    billingAddress: { street: '700 Renewable Way', city: 'Seattle', state: 'WA', zipCode: '98101', country: 'US' },
    shippingAddress: { street: '700 Renewable Way', city: 'Seattle', state: 'WA', zipCode: '98101', country: 'US' },
    creditLimit: 55000,
    paymentTerms: 'net_60',
    balance: 9800,
    totalPurchases: 178500,
    isActive: true,
    createdAt: '2024-12-01T08:30:00Z',
  },
];
