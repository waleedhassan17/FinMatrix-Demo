// ============================================================
// FINMATRIX - Chart of Accounts Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Account } from '../../dummy-data/chartOfAccounts';
import {
  getAccountsAPI,
  createAccountAPI,
  updateAccountAPI,
  toggleAccountAPI,
} from '../../network/coaNetwork';

// ─── State ──────────────────────────────────────────────────
interface COAState {
  accounts: Account[];
  filteredAccounts: Account[];
  searchQuery: string;
  activeFilter: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: COAState = {
  accounts: [],
  filteredAccounts: [],
  searchQuery: '',
  activeFilter: 'all',
  isLoading: false,
  error: null,
};

// ─── Helpers ────────────────────────────────────────────────
const applyFilters = (
  accounts: Account[],
  searchQuery: string,
  activeFilter: string
): Account[] => {
  let filtered = [...accounts];

  // Apply type filter
  if (activeFilter !== 'all') {
    filtered = filtered.filter((a) => a.type === activeFilter);
  }

  // Apply search
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.accountNumber.toLowerCase().includes(q)
    );
  }

  return filtered;
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchAccounts = createAsyncThunk(
  'coa/fetchAccounts',
  async (_, { rejectWithValue }) => {
    try {
      return await getAccountsAPI();
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch accounts');
    }
  }
);

export const createAccount = createAsyncThunk(
  'coa/createAccount',
  async (data: Omit<Account, 'accountId'>, { rejectWithValue }) => {
    try {
      return await createAccountAPI(data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to create account');
    }
  }
);

export const editAccount = createAsyncThunk(
  'coa/editAccount',
  async (
    { id, data }: { id: string; data: Partial<Account> },
    { rejectWithValue }
  ) => {
    try {
      return await updateAccountAPI(id, data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to update account');
    }
  }
);

export const toggleAccount = createAsyncThunk(
  'coa/toggleAccount',
  async (id: string, { rejectWithValue }) => {
    try {
      return await toggleAccountAPI(id);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to toggle account');
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────
const coaSlice = createSlice({
  name: 'coa',
  initialState,
  reducers: {
    setAccounts(state, action: PayloadAction<Account[]>) {
      state.accounts = action.payload;
      state.filteredAccounts = applyFilters(
        action.payload,
        state.searchQuery,
        state.activeFilter
      );
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredAccounts = applyFilters(
        state.accounts,
        action.payload,
        state.activeFilter
      );
    },
    setActiveFilter(state, action: PayloadAction<string>) {
      state.activeFilter = action.payload;
      state.filteredAccounts = applyFilters(
        state.accounts,
        state.searchQuery,
        action.payload
      );
    },
    addAccount(state, action: PayloadAction<Account>) {
      state.accounts.push(action.payload);
      state.filteredAccounts = applyFilters(
        state.accounts,
        state.searchQuery,
        state.activeFilter
      );
    },
    updateAccount(state, action: PayloadAction<Account>) {
      const idx = state.accounts.findIndex(
        (a) => a.accountId === action.payload.accountId
      );
      if (idx !== -1) state.accounts[idx] = action.payload;
      state.filteredAccounts = applyFilters(
        state.accounts,
        state.searchQuery,
        state.activeFilter
      );
    },
    toggleAccountActive(state, action: PayloadAction<string>) {
      const idx = state.accounts.findIndex(
        (a) => a.accountId === action.payload
      );
      if (idx !== -1) {
        state.accounts[idx].isActive = !state.accounts[idx].isActive;
      }
      state.filteredAccounts = applyFilters(
        state.accounts,
        state.searchQuery,
        state.activeFilter
      );
    },
  },
  extraReducers: (builder) => {
    // fetchAccounts
    builder
      .addCase(fetchAccounts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchAccounts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.accounts = action.payload;
        state.filteredAccounts = applyFilters(
          action.payload,
          state.searchQuery,
          state.activeFilter
        );
      })
      .addCase(fetchAccounts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // createAccount
    builder
      .addCase(createAccount.fulfilled, (state, action) => {
        state.accounts.push(action.payload);
        state.filteredAccounts = applyFilters(
          state.accounts,
          state.searchQuery,
          state.activeFilter
        );
      });

    // editAccount
    builder
      .addCase(editAccount.fulfilled, (state, action) => {
        const idx = state.accounts.findIndex(
          (a) => a.accountId === action.payload.accountId
        );
        if (idx !== -1) state.accounts[idx] = action.payload;
        state.filteredAccounts = applyFilters(
          state.accounts,
          state.searchQuery,
          state.activeFilter
        );
      });

    // toggleAccount
    builder
      .addCase(toggleAccount.fulfilled, (state, action) => {
        const idx = state.accounts.findIndex(
          (a) => a.accountId === action.payload.accountId
        );
        if (idx !== -1) state.accounts[idx] = action.payload;
        state.filteredAccounts = applyFilters(
          state.accounts,
          state.searchQuery,
          state.activeFilter
        );
      });
  },
});

export const {
  setAccounts,
  setSearchQuery,
  setActiveFilter,
  addAccount,
  updateAccount,
  toggleAccountActive,
} = coaSlice.actions;

export default coaSlice.reducer;
