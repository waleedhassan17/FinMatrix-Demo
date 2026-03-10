// ============================================================
// FINMATRIX - Payroll Runs Dummy Data  (3 runs)
// ============================================================
// Calculations: salary gross = payRate / 24 (semi-monthly)
//               hourly gross = hours * rate + overtimeHours * overtimeRate
//               each deduction = gross * deduction.rate
// 2 processed, 1 draft. Only active employees included.

import { employees, Employee } from './employees';

// ─── Types ──────────────────────────────────────────────────
export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  hoursWorked: number | null;
  overtimeHours: number | null;
  grossPay: number;
  federalTax: number;
  stateTax: number;
  socialSecurity: number;
  medicare: number;
  healthInsurance: number;
  retirement: number;
  totalDeductions: number;
  netPay: number;
}

export type PayrollStatus = 'draft' | 'processed';

export interface PayrollRun {
  payrollId: string;
  companyId: string;
  payPeriodStart: string;
  payPeriodEnd: string;
  payDate: string;
  entries: PayrollEntry[];
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  status: PayrollStatus;
  createdBy: string;
  createdAt: string;
}

// ─── Helpers ────────────────────────────────────────────────
const r2 = (n: number) => Math.round(n * 100) / 100;

const findRate = (emp: Employee, type: string): number =>
  emp.deductions.find((d) => d.type === type)?.rate ?? 0;

const buildEntry = (
  emp: Employee,
  hours: number | null,
  overtimeHours: number | null,
): PayrollEntry => {
  // Gross
  let grossPay: number;
  if (emp.payType === 'salary') {
    grossPay = r2(emp.payRate / 24);
  } else {
    const regular = (hours ?? 0) * emp.payRate;
    const ot = (overtimeHours ?? 0) * (emp.overtimeRate ?? 0);
    grossPay = r2(regular + ot);
  }

  // Deductions
  const federalTax = r2(grossPay * findRate(emp, 'Federal Tax'));
  const stateTax = r2(grossPay * findRate(emp, 'State Tax'));
  const socialSecurity = r2(grossPay * findRate(emp, 'Social Security'));
  const medicare = r2(grossPay * findRate(emp, 'Medicare'));
  const healthInsurance = r2(grossPay * findRate(emp, 'Health Insurance'));
  const retirement = r2(grossPay * findRate(emp, '401k'));
  const totalDeductions = r2(
    federalTax + stateTax + socialSecurity + medicare + healthInsurance + retirement,
  );
  const netPay = r2(grossPay - totalDeductions);

  return {
    employeeId: emp.employeeId,
    employeeName: `${emp.firstName} ${emp.lastName}`,
    hoursWorked: emp.payType === 'hourly' ? hours : null,
    overtimeHours: emp.payType === 'hourly' ? overtimeHours : null,
    grossPay,
    federalTax,
    stateTax,
    socialSecurity,
    medicare,
    healthInsurance,
    retirement,
    totalDeductions,
    netPay,
  };
};

const buildRun = (
  id: string,
  start: string,
  end: string,
  payDate: string,
  status: PayrollStatus,
  hourlyHours: Record<string, [number, number]>,  // employeeId -> [hours, OT]
  createdAt: string,
): PayrollRun => {
  const activeEmps = employees.filter((e) => e.isActive);
  const entries = activeEmps.map((emp) => {
    const [h, ot] = hourlyHours[emp.employeeId] ?? [null, null];
    return buildEntry(emp, h, ot);
  });

  const totalGross = r2(entries.reduce((s, e) => s + e.grossPay, 0));
  const totalDeductions = r2(entries.reduce((s, e) => s + e.totalDeductions, 0));
  const totalNet = r2(entries.reduce((s, e) => s + e.netPay, 0));

  return {
    payrollId: id,
    companyId: 'comp_001',
    payPeriodStart: start,
    payPeriodEnd: end,
    payDate,
    entries,
    totalGross,
    totalDeductions,
    totalNet,
    status,
    createdBy: 'admin_001',
    createdAt,
  };
};

// ─── Data ───────────────────────────────────────────────────
export const payrollRuns: PayrollRun[] = [
  // Run 1 — Jan 1-15 2026, processed
  buildRun(
    'pr_001',
    '2026-01-01',
    '2026-01-15',
    '2026-01-20',
    'processed',
    { emp_008: [80, 5], emp_010: [80, 8] },
    '2026-01-18T10:00:00Z',
  ),
  // Run 2 — Jan 16-31 2026, processed
  buildRun(
    'pr_002',
    '2026-01-16',
    '2026-01-31',
    '2026-02-05',
    'processed',
    { emp_008: [82, 6], emp_010: [78, 4] },
    '2026-02-02T09:30:00Z',
  ),
  // Run 3 — Feb 1-15 2026, draft
  buildRun(
    'pr_003',
    '2026-02-01',
    '2026-02-15',
    '2026-02-20',
    'draft',
    { emp_008: [80, 3], emp_010: [80, 6] },
    '2026-02-16T14:00:00Z',
  ),
];
