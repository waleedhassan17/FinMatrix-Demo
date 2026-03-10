// ============================================================
// FINMATRIX - Bank Accounts Dummy Data
// ============================================================

export type BankAccountType = 'checking' | 'savings' | 'credit_card';

export interface BankAccount {
  accountId: string;
  name: string;
  institution: string;
  accountType: BankAccountType;
  accountNumberMasked: string;
  currentBalance: number;
  coaAccountId: string;
  isActive: boolean;
}

export const bankAccounts: BankAccount[] = [
  {
    accountId: 'bank_001',
    name: 'Business Checking',
    institution: 'First National Bank',
    accountType: 'checking',
    accountNumberMasked: '****4521',
    currentBalance: 34200,
    coaAccountId: 'acc_002', // 1010 – Checking Account
    isActive: true,
  },
  {
    accountId: 'bank_002',
    name: 'Business Savings',
    institution: 'First National Bank',
    accountType: 'savings',
    accountNumberMasked: '****7893',
    currentBalance: 15000,
    coaAccountId: 'acc_003', // 1020 – Savings Account
    isActive: true,
  },
  {
    accountId: 'bank_003',
    name: 'Business Credit Card',
    institution: 'Chase',
    accountType: 'credit_card',
    accountNumberMasked: '****1234',
    currentBalance: -2340,
    coaAccountId: 'acc_010', // 2100 – Credit Card Payable
    isActive: true,
  },
];
