// ============================================================
// FINMATRIX - Employees Dummy Data  (10 records)
// ============================================================
// Mix: 7 salary + 3 hourly, 8 active + 2 inactive
// Departments: Sales, Operations, Delivery, Admin, Finance

import { Department, PayType, DeductionType } from '../models/employeeModel';

export interface EmployeeDeduction {
  type: DeductionType;
  rate: number;
}

export interface EmployeeBankAccount {
  bankName: string;
  accountNumberMasked: string;
  routingNumberMasked: string;
}

export interface Employee {
  employeeId: string;
  companyId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: Department;
  position: string;
  hireDate: string;
  payType: PayType;
  payRate: number;
  overtimeRate: number | null;
  deductions: EmployeeDeduction[];
  bankAccount: EmployeeBankAccount;
  isActive: boolean;
  ytdGross: number;
  ytdDeductions: number;
  ytdNet: number;
}

const STD_DEDUCTIONS: EmployeeDeduction[] = [
  { type: 'Federal Tax', rate: 0.22 },
  { type: 'State Tax', rate: 0.05 },
  { type: 'Social Security', rate: 0.062 },
  { type: 'Medicare', rate: 0.0145 },
  { type: 'Health Insurance', rate: 0.03 },
  { type: '401k', rate: 0.06 },
];

const BASIC_DEDUCTIONS: EmployeeDeduction[] = [
  { type: 'Federal Tax', rate: 0.12 },
  { type: 'State Tax', rate: 0.04 },
  { type: 'Social Security', rate: 0.062 },
  { type: 'Medicare', rate: 0.0145 },
];

const MID_DEDUCTIONS: EmployeeDeduction[] = [
  { type: 'Federal Tax', rate: 0.22 },
  { type: 'State Tax', rate: 0.05 },
  { type: 'Social Security', rate: 0.062 },
  { type: 'Medicare', rate: 0.0145 },
  { type: 'Health Insurance', rate: 0.04 },
];

export const employees: Employee[] = [
  // ═══ SALARY (7) ═══════════════════════════════════════════
  {
    employeeId: 'emp_001',
    companyId: 'comp_001',
    firstName: 'Sarah',
    lastName: 'Mitchell',
    email: 'sarah.mitchell@finmatrix.io',
    phone: '(555) 100-2001',
    department: 'Sales',
    position: 'Sales Director',
    hireDate: '2021-03-15',
    payType: 'salary',
    payRate: 95000,
    overtimeRate: null,
    deductions: STD_DEDUCTIONS,
    bankAccount: { bankName: 'Chase Bank', accountNumberMasked: '****4521', routingNumberMasked: '****7890' },
    isActive: true,
    ytdGross: 71250,
    ytdDeductions: 27337.50,
    ytdNet: 43912.50,
  },
  {
    employeeId: 'emp_002',
    companyId: 'comp_001',
    firstName: 'David',
    lastName: 'Chen',
    email: 'david.chen@finmatrix.io',
    phone: '(555) 100-2002',
    department: 'Finance',
    position: 'Senior Accountant',
    hireDate: '2020-08-01',
    payType: 'salary',
    payRate: 82000,
    overtimeRate: null,
    deductions: STD_DEDUCTIONS,
    bankAccount: { bankName: 'Bank of America', accountNumberMasked: '****3387', routingNumberMasked: '****1234' },
    isActive: true,
    ytdGross: 61500,
    ytdDeductions: 23595,
    ytdNet: 37905,
  },
  {
    employeeId: 'emp_003',
    companyId: 'comp_001',
    firstName: 'Maria',
    lastName: 'Gonzalez',
    email: 'maria.gonzalez@finmatrix.io',
    phone: '(555) 100-2003',
    department: 'Operations',
    position: 'Operations Manager',
    hireDate: '2019-11-20',
    payType: 'salary',
    payRate: 88000,
    overtimeRate: null,
    deductions: MID_DEDUCTIONS,
    bankAccount: { bankName: 'Wells Fargo', accountNumberMasked: '****6712', routingNumberMasked: '****5678' },
    isActive: true,
    ytdGross: 66000,
    ytdDeductions: 24156,
    ytdNet: 41844,
  },
  {
    employeeId: 'emp_004',
    companyId: 'comp_001',
    firstName: 'James',
    lastName: 'Patterson',
    email: 'james.patterson@finmatrix.io',
    phone: '(555) 100-2004',
    department: 'Admin',
    position: 'Office Administrator',
    hireDate: '2022-01-10',
    payType: 'salary',
    payRate: 55000,
    overtimeRate: null,
    deductions: BASIC_DEDUCTIONS,
    bankAccount: { bankName: 'US Bank', accountNumberMasked: '****9981', routingNumberMasked: '****4321' },
    isActive: true,
    ytdGross: 41250,
    ytdDeductions: 10918.13,
    ytdNet: 30331.87,
  },
  {
    employeeId: 'emp_005',
    companyId: 'comp_001',
    firstName: 'Lisa',
    lastName: 'Thompson',
    email: 'lisa.thompson@finmatrix.io',
    phone: '(555) 100-2005',
    department: 'Sales',
    position: 'Account Executive',
    hireDate: '2023-04-05',
    payType: 'salary',
    payRate: 72000,
    overtimeRate: null,
    deductions: MID_DEDUCTIONS,
    bankAccount: { bankName: 'Citibank', accountNumberMasked: '****2245', routingNumberMasked: '****8765' },
    isActive: true,
    ytdGross: 54000,
    ytdDeductions: 19764,
    ytdNet: 34236,
  },
  {
    employeeId: 'emp_006',
    companyId: 'comp_001',
    firstName: 'Robert',
    lastName: 'Williams',
    email: 'robert.williams@finmatrix.io',
    phone: '(555) 100-2006',
    department: 'Finance',
    position: 'Payroll Specialist',
    hireDate: '2021-07-12',
    payType: 'salary',
    payRate: 62000,
    overtimeRate: null,
    deductions: STD_DEDUCTIONS,
    bankAccount: { bankName: 'PNC Bank', accountNumberMasked: '****5503', routingNumberMasked: '****6543' },
    isActive: false,       // ← inactive
    ytdGross: 31000,
    ytdDeductions: 11893,
    ytdNet: 19107,
  },
  {
    employeeId: 'emp_007',
    companyId: 'comp_001',
    firstName: 'Emily',
    lastName: 'Davis',
    email: 'emily.davis@finmatrix.io',
    phone: '(555) 100-2007',
    department: 'Delivery',
    position: 'Logistics Coordinator',
    hireDate: '2022-09-18',
    payType: 'salary',
    payRate: 58000,
    overtimeRate: null,
    deductions: BASIC_DEDUCTIONS,
    bankAccount: { bankName: 'TD Bank', accountNumberMasked: '****8877', routingNumberMasked: '****2109' },
    isActive: true,
    ytdGross: 43500,
    ytdDeductions: 11510.25,
    ytdNet: 31989.75,
  },

  // ═══ HOURLY (3) ═══════════════════════════════════════════
  {
    employeeId: 'emp_008',
    companyId: 'comp_001',
    firstName: 'Kevin',
    lastName: 'Brown',
    email: 'kevin.brown@finmatrix.io',
    phone: '(555) 100-2008',
    department: 'Delivery',
    position: 'Delivery Driver',
    hireDate: '2023-06-01',
    payType: 'hourly',
    payRate: 22,
    overtimeRate: 33,
    deductions: BASIC_DEDUCTIONS,
    bankAccount: { bankName: 'Chase Bank', accountNumberMasked: '****1190', routingNumberMasked: '****3456' },
    isActive: true,
    ytdGross: 34320,
    ytdDeductions: 9082.44,
    ytdNet: 25237.56,
  },
  {
    employeeId: 'emp_009',
    companyId: 'comp_001',
    firstName: 'Angela',
    lastName: 'Martinez',
    email: 'angela.martinez@finmatrix.io',
    phone: '(555) 100-2009',
    department: 'Operations',
    position: 'Warehouse Associate',
    hireDate: '2024-01-15',
    payType: 'hourly',
    payRate: 19,
    overtimeRate: 28.5,
    deductions: BASIC_DEDUCTIONS,
    bankAccount: { bankName: 'Regions Bank', accountNumberMasked: '****4456', routingNumberMasked: '****7891' },
    isActive: false,       // ← inactive
    ytdGross: 14820,
    ytdDeductions: 3923.49,
    ytdNet: 10896.51,
  },
  {
    employeeId: 'emp_010',
    companyId: 'comp_001',
    firstName: 'Marcus',
    lastName: 'Johnson',
    email: 'marcus.johnson@finmatrix.io',
    phone: '(555) 100-2010',
    department: 'Delivery',
    position: 'Delivery Driver',
    hireDate: '2023-11-01',
    payType: 'hourly',
    payRate: 21,
    overtimeRate: 31.5,
    deductions: MID_DEDUCTIONS,
    bankAccount: { bankName: 'Fifth Third Bank', accountNumberMasked: '****7723', routingNumberMasked: '****0987' },
    isActive: true,
    ytdGross: 28560,
    ytdDeductions: 10449.96,
    ytdNet: 18110.04,
  },
];
