// ============================================================
// FINMATRIX - Chart of Accounts Network Layer
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { chartOfAccounts, Account } from '../dummy-data/chartOfAccounts';

// In-memory copy for simulated mutations
let accountsStore: Account[] = [...chartOfAccounts];

export const getAccountsAPI = async (): Promise<Account[]> => {
  await delay(800);
  return [...accountsStore];
};

export const createAccountAPI = async (
  data: Omit<Account, 'accountId'>
): Promise<Account> => {
  await delay(800);
  const newAccount: Account = {
    ...data,
    accountId: `acc_${Date.now()}`,
  };
  accountsStore.push(newAccount);
  return newAccount;
};

export const updateAccountAPI = async (
  id: string,
  data: Partial<Account>
): Promise<Account> => {
  await delay(800);
  const index = accountsStore.findIndex((a) => a.accountId === id);
  if (index === -1) throw new Error('Account not found');
  accountsStore[index] = { ...accountsStore[index], ...data };
  return accountsStore[index];
};

export const toggleAccountAPI = async (id: string): Promise<Account> => {
  await delay(800);
  const index = accountsStore.findIndex((a) => a.accountId === id);
  if (index === -1) throw new Error('Account not found');
  accountsStore[index] = {
    ...accountsStore[index],
    isActive: !accountsStore[index].isActive,
  };
  return accountsStore[index];
};
