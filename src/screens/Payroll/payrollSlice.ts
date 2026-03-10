// ============================================================
// FINMATRIX - Payroll Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PayrollRun, PayrollStatus } from '../../dummy-data/payrollRuns';
import {
  getPayrollRunsAPI,
  getPayrollByIdAPI,
  createPayrollRunAPI,
  processPayrollAPI,
} from '../../network/payrollNetwork';

// ─── Helpers ────────────────────────────────────────────────
type SortKey = 'date' | 'amount';
type StatusFilter = 'all' | PayrollStatus;

const applyFilters = (
  list: PayrollRun[],
  search: string,
  statusFilter: StatusFilter,
  sortKey: SortKey,
): PayrollRun[] => {
  let filtered = [...list];

  if (statusFilter !== 'all') {
    filtered = filtered.filter((r) => r.status === statusFilter);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (r) =>
        r.payrollId.toLowerCase().includes(q) ||
        r.payPeriodStart.includes(q) ||
        r.payPeriodEnd.includes(q),
    );
  }

  switch (sortKey) {
    case 'date':
      filtered.sort(
        (a, b) =>
          new Date(b.payPeriodStart).getTime() - new Date(a.payPeriodStart).getTime(),
      );
      break;
    case 'amount':
      filtered.sort((a, b) => b.totalGross - a.totalGross);
      break;
  }

  return filtered;
};

// ─── State ──────────────────────────────────────────────────
interface PayrollState {
  payrollRuns: PayrollRun[];
  filteredRuns: PayrollRun[];
  currentRun: PayrollRun | null;
  searchQuery: string;
  statusFilter: StatusFilter;
  sortKey: SortKey;
  isLoading: boolean;
  error: string | null;
}

const initialState: PayrollState = {
  payrollRuns: [],
  filteredRuns: [],
  currentRun: null,
  searchQuery: '',
  statusFilter: 'all',
  sortKey: 'date',
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchPayrollRuns = createAsyncThunk(
  'payroll/fetchPayrollRuns',
  async (_, { rejectWithValue }) => {
    try {
      return await getPayrollRunsAPI();
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch payroll runs');
    }
  },
);

export const fetchPayrollById = createAsyncThunk(
  'payroll/fetchPayrollById',
  async (id: string, { rejectWithValue }) => {
    try {
      return await getPayrollByIdAPI(id);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch payroll run');
    }
  },
);

export const createPayrollRun = createAsyncThunk(
  'payroll/createPayrollRun',
  async (
    data: Omit<PayrollRun, 'payrollId' | 'createdAt'>,
    { rejectWithValue },
  ) => {
    try {
      return await createPayrollRunAPI(data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to create payroll run');
    }
  },
);

export const processPayroll = createAsyncThunk(
  'payroll/processPayroll',
  async (id: string, { rejectWithValue }) => {
    try {
      return await processPayrollAPI(id);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to process payroll');
    }
  },
);

// ─── Slice ──────────────────────────────────────────────────
const payrollSlice = createSlice({
  name: 'payroll',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredRuns = applyFilters(
        state.payrollRuns,
        action.payload,
        state.statusFilter,
        state.sortKey,
      );
    },
    setStatusFilter(state, action: PayloadAction<StatusFilter>) {
      state.statusFilter = action.payload;
      state.filteredRuns = applyFilters(
        state.payrollRuns,
        state.searchQuery,
        action.payload,
        state.sortKey,
      );
    },
    setSortKey(state, action: PayloadAction<SortKey>) {
      state.sortKey = action.payload;
      state.filteredRuns = applyFilters(
        state.payrollRuns,
        state.searchQuery,
        state.statusFilter,
        action.payload,
      );
    },
    clearCurrentRun(state) {
      state.currentRun = null;
    },
  },
  extraReducers: (builder) => {
    // fetch all
    builder
      .addCase(fetchPayrollRuns.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayrollRuns.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payrollRuns = action.payload;
        state.filteredRuns = applyFilters(
          action.payload,
          state.searchQuery,
          state.statusFilter,
          state.sortKey,
        );
      })
      .addCase(fetchPayrollRuns.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // fetch by id
    builder
      .addCase(fetchPayrollById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayrollById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentRun = action.payload;
      })
      .addCase(fetchPayrollById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // create
    builder.addCase(createPayrollRun.fulfilled, (state, action) => {
      state.payrollRuns.push(action.payload);
      state.filteredRuns = applyFilters(
        state.payrollRuns,
        state.searchQuery,
        state.statusFilter,
        state.sortKey,
      );
    });

    // process
    builder.addCase(processPayroll.fulfilled, (state, action) => {
      const idx = state.payrollRuns.findIndex(
        (r) => r.payrollId === action.payload.payrollId,
      );
      if (idx !== -1) state.payrollRuns[idx] = action.payload;
      state.currentRun = action.payload;
      state.filteredRuns = applyFilters(
        state.payrollRuns,
        state.searchQuery,
        state.statusFilter,
        state.sortKey,
      );
    });
  },
});

export const { setSearchQuery, setStatusFilter, setSortKey, clearCurrentRun } =
  payrollSlice.actions;
export default payrollSlice.reducer;
