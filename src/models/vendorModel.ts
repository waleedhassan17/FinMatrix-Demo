// ============================================================
// FINMATRIX - Vendor Validation Model
// ============================================================

import { VendorAddress } from '../dummy-data/vendors';

export interface VendorFormData {
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: VendorAddress;
  paymentTerms: string;
  taxId: string;
  defaultExpenseAccountId: string;
}

export interface VendorValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateVendor = (
  data: VendorFormData
): VendorValidationResult => {
  const errors: Record<string, string> = {};

  if (!data.companyName.trim()) {
    errors.companyName = 'Company name is required';
  }

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!EMAIL_REGEX.test(data.email.trim())) {
    errors.email = 'Invalid email format';
  }

  if (!data.address.street.trim()) {
    errors.street = 'Street is required';
  }
  if (!data.address.city.trim()) {
    errors.city = 'City is required';
  }
  if (!data.address.state.trim()) {
    errors.state = 'State is required';
  }
  if (!data.address.zipCode.trim()) {
    errors.zipCode = 'ZIP code is required';
  }
  if (!data.address.country.trim()) {
    errors.country = 'Country is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

export const VENDOR_PAYMENT_TERMS_OPTIONS = [
  { label: 'Net 15', value: 'net_15' },
  { label: 'Net 30', value: 'net_30' },
  { label: 'Net 45', value: 'net_45' },
  { label: 'Net 60', value: 'net_60' },
];

export const VENDOR_PAYMENT_TERMS_LABELS: Record<string, string> = {
  net_15: 'Net 15',
  net_30: 'Net 30',
  net_45: 'Net 45',
  net_60: 'Net 60',
};

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

export const blankVendorAddress = (): VendorAddress => ({
  street: '',
  city: '',
  state: '',
  zipCode: '',
  country: 'US',
});
