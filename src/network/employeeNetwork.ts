// ============================================================
// FINMATRIX - Employee Network Layer
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { employees, Employee } from '../dummy-data/employees';

// In-memory store for simulated mutations
let employeesStore: Employee[] = [...employees];

export const getEmployeesAPI = async (): Promise<Employee[]> => {
  await delay(500);
  return [...employeesStore].sort((a, b) =>
    `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
  );
};

export const getEmployeeByIdAPI = async (id: string): Promise<Employee> => {
  await delay(400);
  const emp = employeesStore.find((e) => e.employeeId === id);
  if (!emp) throw new Error('Employee not found');
  return {
    ...emp,
    deductions: emp.deductions.map((d) => ({ ...d })),
    bankAccount: { ...emp.bankAccount },
  };
};

export const createEmployeeAPI = async (
  data: Omit<Employee, 'employeeId'>,
): Promise<Employee> => {
  await delay(600);
  const newEmp: Employee = {
    ...data,
    employeeId: `emp_${Date.now()}`,
    deductions: data.deductions.map((d) => ({ ...d })),
    bankAccount: { ...data.bankAccount },
  };
  employeesStore.push(newEmp);
  return { ...newEmp };
};

export const updateEmployeeAPI = async (
  id: string,
  data: Partial<Employee>,
): Promise<Employee> => {
  await delay(600);
  const index = employeesStore.findIndex((e) => e.employeeId === id);
  if (index === -1) throw new Error('Employee not found');
  employeesStore[index] = { ...employeesStore[index], ...data };
  return {
    ...employeesStore[index],
    deductions: employeesStore[index].deductions.map((d) => ({ ...d })),
    bankAccount: { ...employeesStore[index].bankAccount },
  };
};

export const toggleEmployeeActiveAPI = async (id: string): Promise<Employee> => {
  await delay(400);
  const index = employeesStore.findIndex((e) => e.employeeId === id);
  if (index === -1) throw new Error('Employee not found');
  employeesStore[index] = {
    ...employeesStore[index],
    isActive: !employeesStore[index].isActive,
  };
  return { ...employeesStore[index] };
};
