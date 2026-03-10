// ============================================================
// FINMATRIX - Banking Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { BankAccount } from '../../dummy-data/bankAccounts';
import { BankTransaction } from '../../dummy-data/bankTransactions';
import {
  getBankAccountsAPI,
  getBankTransactionsAPI,
  createBankTransactionAPI,
  createTransferAPI,
} from '../../network/bankingNetwork';

// ─── State ──────────────────────────────────────────────────
interface BankingState {
  accounts: BankAccount[];
  transactions: BankTransaction[];
  activeAccountId: string | null;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: BankingState = {
  accounts: [],
  transactions: [],
  activeAccountId: null,
  searchQuery: '',
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchBankAccounts = createAsyncThunk(
  'banking/fetchAccounts',
  async () => getBankAccountsAPI(),
);

export const fetchBankTransactions = createAsyncThunk(
  'banking/fetchTransactions',
  async (bankAccountId: string) => {
    const txs = await getBankTransactionsAPI(bankAccountId);
    return { bankAccountId, txs };
  },
);

export const createBankTransaction = createAsyncThunk(
  'banking/createTransaction',
  async (tx: Omit<BankTransaction, 'txId'>) => createBankTransactionAPI(tx),
);

export const createTransfer = createAsyncThunk(
  'banking/createTransfer',
  async (payload: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    date: string;
    memo: string;
  }) => createTransferAPI(payload),
);

// ─── Slice ──────────────────────────────────────────────────
const bankingSlice = createSlice({
  name: 'banking',
  initialState,
  reducers: {
    setActiveAccount(state, action: PayloadAction<string | null>) {
      state.activeAccountId = action.payload;
    },
    setBankingSearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
  },
  extraReducers: (builder) => {
    // Fetch accounts
    builder.addCase(fetchBankAccounts.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchBankAccounts.fulfilled, (state, action) => {
      state.isLoading = false;
      state.accounts = action.payload;
    });
    builder.addCase(fetchBankAccounts.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to load accounts';
    });

    // Fetch transactions
    builder.addCase(fetchBankTransactions.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchBankTransactions.fulfilled, (state, action) => {
      state.isLoading = false;
      state.activeAccountId = action.payload.bankAccountId;
      state.transactions = action.payload.txs;
    });
    builder.addCase(fetchBankTransactions.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to load transactions';
    });

    // Create transaction
    builder.addCase(createBankTransaction.fulfilled, (state, action) => {
      state.transactions.unshift(action.payload);
      // Refresh account balance
      const acct = state.accounts.find(
        (a) => a.accountId === action.payload.bankAccountId,
      );
      if (acct) acct.currentBalance += action.payload.amount;
    });

    // Transfer
    builder.addCase(createTransfer.fulfilled, (state, action) => {
      const { fromTx, toTx } = action.payload;
      // Add both transactions
      state.transactions.unshift(fromTx);
      // Update balances
      const fromAcct = state.accounts.find(
        (a) => a.accountId === fromTx.bankAccountId,
      );
      const toAcct = state.accounts.find(
        (a) => a.accountId === toTx.bankAccountId,
      );
      if (fromAcct) fromAcct.currentBalance += fromTx.amount;
      if (toAcct) toAcct.currentBalance += toTx.amount;
    });
  },
});

export const { setActiveAccount, setBankingSearch } = bankingSlice.actions;
export default bankingSlice.reducer;
