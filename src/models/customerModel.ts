// ============================================================
// FINMATRIX - Customer Validation Model
// ============================================================

import { Address } from '../dummy-data/customers';

export interface CustomerFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  billingAddress: Address;
  shippingAddress: Address;
  sameAsShipping: boolean;
  creditLimit: number;
  paymentTerms: 'net_15' | 'net_30' | 'net_45' | 'net_60' | 'due_on_receipt';
  notes: string;
}

export interface CustomerValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates customer form data.
 * Required: name, email, billing street/city/state/zip/country.
 */
export const validateCustomer = (
  data: CustomerFormData
): CustomerValidationResult => {
  const errors: Record<string, string> = {};

  // ─── Basic Info ─────────────────────────────────────────
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Invalid email format';
  }

  // ─── Billing Address ────────────────────────────────────
  if (!data.billingAddress.street.trim()) {
    errors.billingStreet = 'Street is required';
  }
  if (!data.billingAddress.city.trim()) {
    errors.billingCity = 'City is required';
  }
  if (!data.billingAddress.state.trim()) {
    errors.billingState = 'State is required';
  }
  if (!data.billingAddress.zipCode.trim()) {
    errors.billingZip = 'ZIP code is required';
  }
  if (!data.billingAddress.country.trim()) {
    errors.billingCountry = 'Country is required';
  }

  // ─── Credit ─────────────────────────────────────────────
  if (data.creditLimit < 0) {
    errors.creditLimit = 'Credit limit cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const PAYMENT_TERMS_OPTIONS = [
  { label: 'Due on Receipt', value: 'due_on_receipt' },
  { label: 'Net 15', value: 'net_15' },
  { label: 'Net 30', value: 'net_30' },
  { label: 'Net 45', value: 'net_45' },
  { label: 'Net 60', value: 'net_60' },
];

export const COUNTRY_OPTIONS = [
  { label: 'United States', value: 'US' },
  { label: 'Canada', value: 'CA' },
  { label: 'United Kingdom', value: 'UK' },
  { label: 'Australia', value: 'AU' },
  { label: 'Germany', value: 'DE' },
  { label: 'France', value: 'FR' },
  { label: 'Japan', value: 'JP' },
  { label: 'Mexico', value: 'MX' },
];

export const PAYMENT_TERMS_LABELS: Record<string, string> = {
  due_on_receipt: 'Due on Receipt',
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_45: 'Net 45',
  net_60: 'Net 60',
};

export const blankAddress = (): Address => ({
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
});
