// ============================================================
// FINMATRIX - Credit Memo Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CreditMemo, CreditMemoStatus } from '../../dummy-data/creditMemos';
import { getCreditMemosAPI, createCreditMemoAPI, updateCreditMemoAPI } from '../../network/creditMemoNetwork';

interface CreditMemoState {
  creditMemos: CreditMemo[];
  filteredCreditMemos: CreditMemo[];
  statusFilter: CreditMemoStatus | 'all';
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: CreditMemoState = {
  creditMemos: [],
  filteredCreditMemos: [],
  statusFilter: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,
};

// ── Helpers ─────────────────────────────────────────────────
const applyFilters = (cms: CreditMemo[], status: CreditMemoStatus | 'all', query: string): CreditMemo[] => {
  let result = [...cms];
  if (status !== 'all') result = result.filter((c) => c.status === status);
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (c) =>
        c.creditMemoNumber.toLowerCase().includes(q) ||
        c.customerName.toLowerCase().includes(q) ||
        c.reason.toLowerCase().includes(q),
    );
  }
  result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return result;
};

// ── Thunks ──────────────────────────────────────────────────
export const fetchCreditMemos = createAsyncThunk('creditMemos/fetch', async () => getCreditMemosAPI());
export const createCreditMemo = createAsyncThunk('creditMemos/create', async (data: Omit<CreditMemo, 'creditMemoId' | 'createdAt'>) => createCreditMemoAPI(data));
export const updateCreditMemo = createAsyncThunk('creditMemos/update', async ({ id, data }: { id: string; data: Partial<CreditMemo> }) => updateCreditMemoAPI(id, data));

// ── Slice ───────────────────────────────────────────────────
const creditMemoSlice = createSlice({
  name: 'creditMemos',
  initialState,
  reducers: {
    setCMFilter(state, action: PayloadAction<CreditMemoStatus | 'all'>) {
      state.statusFilter = action.payload;
      state.filteredCreditMemos = applyFilters(state.creditMemos, action.payload, state.searchQuery);
    },
    setCMSearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredCreditMemos = applyFilters(state.creditMemos, state.statusFilter, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCreditMemos.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchCreditMemos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.creditMemos = action.payload;
        state.filteredCreditMemos = applyFilters(action.payload, state.statusFilter, state.searchQuery);
      })
      .addCase(fetchCreditMemos.rejected, (state, action) => { state.isLoading = false; state.error = action.error.message || 'Failed'; })
      .addCase(createCreditMemo.fulfilled, (state, action) => {
        state.creditMemos = [action.payload, ...state.creditMemos];
        state.filteredCreditMemos = applyFilters(state.creditMemos, state.statusFilter, state.searchQuery);
      })
      .addCase(updateCreditMemo.fulfilled, (state, action) => {
        const idx = state.creditMemos.findIndex((c) => c.creditMemoId === action.payload.creditMemoId);
        if (idx >= 0) state.creditMemos[idx] = action.payload;
        state.filteredCreditMemos = applyFilters(state.creditMemos, state.statusFilter, state.searchQuery);
      });
  },
});

export const { setCMFilter, setCMSearch } = creditMemoSlice.actions;
export default creditMemoSlice.reducer;
