// ============================================================
// FINMATRIX - General Ledger Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { LedgerEntry } from '../../dummy-data/generalLedger';
import { getLedgerEntriesAPI } from '../../network/glNetwork';

// ─── Helpers ────────────────────────────────────────────────
const today = () => {
  const d = new Date();
  return d.toISOString().slice(0, 10);
};

const firstOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  return d.toISOString().slice(0, 10);
};

// ─── State ──────────────────────────────────────────────────
interface GLState {
  entries: LedgerEntry[];
  filteredEntries: LedgerEntry[];
  dateRange: { from: string; to: string };
  selectedAccountId: string; // '' means all accounts
  isLoading: boolean;
  error: string | null;
}

const initialState: GLState = {
  entries: [],
  filteredEntries: [],
  dateRange: { from: firstOfMonth(), to: today() },
  selectedAccountId: '',
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchLedgerEntries = createAsyncThunk(
  'gl/fetchLedgerEntries',
  async (
    params: { from: string; to: string; accountId?: string },
    { rejectWithValue }
  ) => {
    try {
      return await getLedgerEntriesAPI(params.from, params.to, params.accountId);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch ledger entries');
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────
const glSlice = createSlice({
  name: 'gl',
  initialState,
  reducers: {
    setDateRange(state, action: PayloadAction<{ from: string; to: string }>) {
      state.dateRange = action.payload;
    },
    setSelectedAccountId(state, action: PayloadAction<string>) {
      state.selectedAccountId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLedgerEntries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLedgerEntries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = action.payload;
        state.filteredEntries = action.payload;
      })
      .addCase(fetchLedgerEntries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setDateRange, setSelectedAccountId } = glSlice.actions;
export default glSlice.reducer;
