// ============================================================
// FINMATRIX - Employee Validation Model
// ============================================================

export type Department = 'Sales' | 'Operations' | 'Delivery' | 'Admin' | 'Finance';
export type PayType = 'salary' | 'hourly';
export type DeductionType =
  | 'Federal Tax'
  | 'State Tax'
  | 'Social Security'
  | 'Medicare'
  | 'Health Insurance'
  | '401k';

export const DEPARTMENTS: Department[] = ['Sales', 'Operations', 'Delivery', 'Admin', 'Finance'];
export const DEDUCTION_TYPES: DeductionType[] = [
  'Federal Tax',
  'State Tax',
  'Social Security',
  'Medicare',
  'Health Insurance',
  '401k',
];

export const DEPARTMENT_COLORS: Record<Department, string> = {
  Sales: '#2E75B6',
  Operations: '#E67E22',
  Delivery: '#27AE60',
  Admin: '#8E44AD',
  Finance: '#1B3A5C',
};

export interface EmployeeFormData {
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
  deductions: { type: DeductionType; rate: number }[];
  bankName: string;
  accountNumber: string;
  routingNumber: string;
  isActive: boolean;
}

export interface EmployeeValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates employee form data.
 * Required: firstName, lastName.
 */
export const validateEmployee = (
  data: EmployeeFormData,
): EmployeeValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  }
  if (!data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  }
  if (data.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
    errors.email = 'Invalid email format';
  }
  if (data.payRate <= 0) {
    errors.payRate = 'Pay rate must be greater than 0';
  }
  if (data.payType === 'hourly' && data.overtimeRate != null && data.overtimeRate <= 0) {
    errors.overtimeRate = 'Overtime rate must be greater than 0';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
};
