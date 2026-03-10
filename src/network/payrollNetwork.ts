// ============================================================
// FINMATRIX - Payroll Network Layer
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { payrollRuns, PayrollRun, PayrollEntry } from '../dummy-data/payrollRuns';
import { employees } from '../dummy-data/employees';

// In-memory store for simulated mutations
let payrollStore: PayrollRun[] = payrollRuns.map((r) => ({
  ...r,
  entries: r.entries.map((e) => ({ ...e })),
}));

const r2 = (n: number) => Math.round(n * 100) / 100;

export const getPayrollRunsAPI = async (): Promise<PayrollRun[]> => {
  await delay(500);
  return payrollStore
    .map((r) => ({ ...r, entries: r.entries.map((e) => ({ ...e })) }))
    .sort(
      (a, b) =>
        new Date(b.payPeriodStart).getTime() - new Date(a.payPeriodStart).getTime(),
    );
};

export const getPayrollByIdAPI = async (id: string): Promise<PayrollRun> => {
  await delay(400);
  const run = payrollStore.find((r) => r.payrollId === id);
  if (!run) throw new Error('Payroll run not found');
  return { ...run, entries: run.entries.map((e) => ({ ...e })) };
};

export const createPayrollRunAPI = async (
  data: Omit<PayrollRun, 'payrollId' | 'createdAt'>,
): Promise<PayrollRun> => {
  await delay(600);
  const newRun: PayrollRun = {
    ...data,
    payrollId: `pr_${Date.now()}`,
    createdAt: new Date().toISOString(),
    entries: data.entries.map((e) => ({ ...e })),
  };
  payrollStore.push(newRun);
  return { ...newRun, entries: newRun.entries.map((e) => ({ ...e })) };
};

export const processPayrollAPI = async (id: string): Promise<PayrollRun> => {
  await delay(800);
  const idx = payrollStore.findIndex((r) => r.payrollId === id);
  if (idx === -1) throw new Error('Payroll run not found');
  payrollStore[idx] = { ...payrollStore[idx], status: 'processed' };
  return { ...payrollStore[idx], entries: payrollStore[idx].entries.map((e) => ({ ...e })) };
};

/**
 * Generate a fresh set of entries for all active employees.
 * Salary employees get their standard semi-monthly gross.
 * Hourly employees default to 80 regular + 0 OT (editable in wizard).
 */
export const generatePayrollEntriesAPI = async (): Promise<PayrollEntry[]> => {
  await delay(400);
  const activeEmployees = employees.filter((e) => e.isActive);
  return activeEmployees.map((emp) => {
    const findRate = (type: string) =>
      emp.deductions.find((d) => d.type === type)?.rate ?? 0;

    let grossPay: number;
    let hoursWorked: number | null = null;
    let overtimeHours: number | null = null;

    if (emp.payType === 'salary') {
      grossPay = r2(emp.payRate / 24);
    } else {
      hoursWorked = 80;
      overtimeHours = 0;
      grossPay = r2(hoursWorked * emp.payRate);
    }

    const federalTax = r2(grossPay * findRate('Federal Tax'));
    const stateTax = r2(grossPay * findRate('State Tax'));
    const socialSecurity = r2(grossPay * findRate('Social Security'));
    const medicare = r2(grossPay * findRate('Medicare'));
    const healthInsurance = r2(grossPay * findRate('Health Insurance'));
    const retirement = r2(grossPay * findRate('401k'));
    const totalDeductions = r2(
      federalTax + stateTax + socialSecurity + medicare + healthInsurance + retirement,
    );
    const netPay = r2(grossPay - totalDeductions);

    return {
      employeeId: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      hoursWorked,
      overtimeHours,
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
  });
};
