// ============================================================
// FINMATRIX - Banking Network (Mock API)
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { bankAccounts, BankAccount } from '../dummy-data/bankAccounts';
import {
  bankTransactions,
  BankTransaction,
  BankTxType,
} from '../dummy-data/bankTransactions';

let localAccounts = [...bankAccounts];
let localTransactions = [...bankTransactions];

// ─── Bank Accounts ──────────────────────────────────────────

export const getBankAccountsAPI = async (): Promise<BankAccount[]> => {
  await delay();
  return [...localAccounts];
};

export const getBankAccountByIdAPI = async (
  id: string,
): Promise<BankAccount | undefined> => {
  await delay(200);
  return localAccounts.find((a) => a.accountId === id);
};

// ─── Bank Transactions ──────────────────────────────────────

export const getBankTransactionsAPI = async (
  bankAccountId: string,
): Promise<BankTransaction[]> => {
  await delay();
  return localTransactions
    .filter((t) => t.bankAccountId === bankAccountId)
    .sort((a, b) => b.date.localeCompare(a.date));
};

export const createBankTransactionAPI = async (
  tx: Omit<BankTransaction, 'txId'>,
): Promise<BankTransaction> => {
  await delay();
  const newTx: BankTransaction = {
    ...tx,
    txId: `btx_${String(localTransactions.length + 1).padStart(3, '0')}`,
  };
  localTransactions.push(newTx);

  // Update account balance
  const acct = localAccounts.find((a) => a.accountId === tx.bankAccountId);
  if (acct) {
    acct.currentBalance += tx.amount;
  }

  return newTx;
};

export const createTransferAPI = async (payload: {
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  date: string;
  memo: string;
}): Promise<{ fromTx: BankTransaction; toTx: BankTransaction }> => {
  await delay();

  const fromAccount = localAccounts.find(
    (a) => a.accountId === payload.fromAccountId,
  );
  const toAccount = localAccounts.find(
    (a) => a.accountId === payload.toAccountId,
  );
  if (!fromAccount || !toAccount) throw new Error('Account not found');

  const nextId = localTransactions.length + 1;
  const refNum = `TRF-${String(3000 + nextId).padStart(4, '0')}`;

  const fromTx: BankTransaction = {
    txId: `btx_${String(nextId).padStart(3, '0')}`,
    bankAccountId: payload.fromAccountId,
    date: payload.date,
    payee: `Transfer to ${toAccount.name}`,
    description: payload.memo || `Transfer to ${toAccount.name}`,
    type: 'transfer' as BankTxType,
    amount: -Math.abs(payload.amount),
    checkNumber: null,
    category: 'Transfer',
    accountId: toAccount.coaAccountId,
    isCleared: false,
    isReconciled: false,
    referenceNumber: refNum,
  };

  const toTx: BankTransaction = {
    txId: `btx_${String(nextId + 1).padStart(3, '0')}`,
    bankAccountId: payload.toAccountId,
    date: payload.date,
    payee: `Transfer from ${fromAccount.name}`,
    description: payload.memo || `Transfer from ${fromAccount.name}`,
    type: 'transfer' as BankTxType,
    amount: Math.abs(payload.amount),
    checkNumber: null,
    category: 'Transfer',
    accountId: fromAccount.coaAccountId,
    isCleared: false,
    isReconciled: false,
    referenceNumber: refNum,
  };

  localTransactions.push(fromTx, toTx);
  fromAccount.currentBalance -= Math.abs(payload.amount);
  toAccount.currentBalance += Math.abs(payload.amount);

  return { fromTx, toTx };
};

export const getNextRefNumberAPI = async (
  type: BankTxType,
): Promise<string> => {
  await delay(100);
  const prefixMap: Record<string, string> = {
    check: 'CHK',
    deposit: 'DEP',
    transfer: 'TRF',
    card_charge: 'CC',
    fee: 'FEE',
    interest: 'INT',
  };
  const prefix = prefixMap[type] || 'REF';
  const count = localTransactions.filter((t) => t.type === type).length;
  return `${prefix}-${String(1000 + count + 1).padStart(4, '0')}`;
};
