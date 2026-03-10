// ============================================================
// FINMATRIX - Audit Trail Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { auditTrail as SEED, AuditEntry } from '../../dummy-data/auditTrail';

// ─── Types ──────────────────────────────────────────────────
interface DateRange {
  from: string; // 'YYYY-MM-DD'
  to: string;
}

interface AuditFilters {
  dateRange: DateRange;
  userId: string | null;
  module: string | null;
  action: string | null;
}

interface AuditTrailState {
  entries: AuditEntry[];
  filteredEntries: AuditEntry[];
  filters: AuditFilters;
  isLoading: boolean;
}

const initialState: AuditTrailState = {
  entries: [],
  filteredEntries: [],
  filters: {
    dateRange: { from: '2026-02-01', to: '2026-03-03' },
    userId: null,
    module: null,
    action: null,
  },
  isLoading: false,
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchAuditTrail = createAsyncThunk(
  'auditTrail/fetchAuditTrail',
  async () => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return [...SEED].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  },
);

// ─── Helpers ────────────────────────────────────────────────
function applyAllFilters(entries: AuditEntry[], filters: AuditFilters): AuditEntry[] {
  let result = entries;

  // Date range
  if (filters.dateRange.from) {
    result = result.filter((e) => e.timestamp >= filters.dateRange.from);
  }
  if (filters.dateRange.to) {
    result = result.filter((e) => e.timestamp <= filters.dateRange.to + 'T23:59:59Z');
  }

  // User
  if (filters.userId) {
    result = result.filter((e) => e.userName === filters.userId);
  }

  // Module
  if (filters.module) {
    result = result.filter((e) => e.module === filters.module);
  }

  // Action
  if (filters.action) {
    result = result.filter((e) => e.action === filters.action);
  }

  return result;
}

// ─── Slice ──────────────────────────────────────────────────
const auditTrailSlice = createSlice({
  name: 'auditTrail',
  initialState,
  reducers: {
    setDateFilter(state, action: PayloadAction<DateRange>) {
      state.filters.dateRange = action.payload;
      state.filteredEntries = applyAllFilters(state.entries, state.filters);
    },
    setUserFilter(state, action: PayloadAction<string | null>) {
      state.filters.userId = action.payload;
      state.filteredEntries = applyAllFilters(state.entries, state.filters);
    },
    setModuleFilter(state, action: PayloadAction<string | null>) {
      state.filters.module = action.payload;
      state.filteredEntries = applyAllFilters(state.entries, state.filters);
    },
    setActionFilter(state, action: PayloadAction<string | null>) {
      state.filters.action = action.payload;
      state.filteredEntries = applyAllFilters(state.entries, state.filters);
    },
    applyFilters(state) {
      state.filteredEntries = applyAllFilters(state.entries, state.filters);
    },
    /** Add a new audit entry (used by approval workflows, etc.) */
    addAuditEntry(state, action: PayloadAction<AuditEntry>) {
      state.entries.unshift(action.payload);
      state.filteredEntries = applyAllFilters(state.entries, state.filters);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAuditTrail.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchAuditTrail.fulfilled, (state, action) => {
        state.entries = action.payload;
        state.filteredEntries = applyAllFilters(action.payload, state.filters);
        state.isLoading = false;
      })
      .addCase(fetchAuditTrail.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const {
  setDateFilter,
  setUserFilter,
  setModuleFilter,
  setActionFilter,
  applyFilters,
  addAuditEntry,
} = auditTrailSlice.actions;

export default auditTrailSlice.reducer;
