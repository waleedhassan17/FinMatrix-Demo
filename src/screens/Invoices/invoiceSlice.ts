// ============================================================
// FINMATRIX - Invoices Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Invoice, InvoiceStatus } from '../../dummy-data/invoices';
import {
  getInvoicesAPI,
  createInvoiceAPI,
  updateInvoiceAPI,
} from '../../network/invoiceNetwork';

// ─── Types ──────────────────────────────────────────────────
type StatusFilter = 'all' | InvoiceStatus;

// ─── Helpers ────────────────────────────────────────────────

const applyFilters = (
  list: Invoice[],
  filter: StatusFilter,
  search: string,
): Invoice[] => {
  let filtered = [...list];

  // Status filter
  if (filter !== 'all') {
    filtered = filtered.filter((i) => i.status === filter);
  }

  // Search by invoice number or customer name
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.invoiceNumber.toLowerCase().includes(q) ||
        i.customerName.toLowerCase().includes(q),
    );
  }

  // Sort newest first
  filtered.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );

  return filtered;
};

// ─── State ──────────────────────────────────────────────────
interface InvoiceState {
  invoices: Invoice[];
  filteredInvoices: Invoice[];
  statusFilter: StatusFilter;
  searchQuery: string;
  currentInvoice: Invoice | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: InvoiceState = {
  invoices: [],
  filteredInvoices: [],
  statusFilter: 'all',
  searchQuery: '',
  currentInvoice: null,
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────

export const fetchInvoices = createAsyncThunk(
  'invoices/fetchInvoices',
  async (_, { rejectWithValue }) => {
    try {
      return await getInvoicesAPI();
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch invoices');
    }
  },
);

export const createInvoice = createAsyncThunk(
  'invoices/createInvoice',
  async (
    data: Omit<Invoice, 'invoiceId' | 'createdAt'>,
    { rejectWithValue },
  ) => {
    try {
      return await createInvoiceAPI(data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to create invoice');
    }
  },
);

export const updateInvoice = createAsyncThunk(
  'invoices/updateInvoice',
  async (
    { id, data }: { id: string; data: Partial<Invoice> },
    { rejectWithValue },
  ) => {
    try {
      return await updateInvoiceAPI(id, data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to update invoice');
    }
  },
);

// ─── Slice ──────────────────────────────────────────────────

const invoiceSlice = createSlice({
  name: 'invoices',
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<StatusFilter>) {
      state.statusFilter = action.payload;
      state.filteredInvoices = applyFilters(
        state.invoices,
        action.payload,
        state.searchQuery,
      );
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredInvoices = applyFilters(
        state.invoices,
        state.statusFilter,
        action.payload,
      );
    },
    setCurrentInvoice(state, action: PayloadAction<Invoice | null>) {
      state.currentInvoice = action.payload;
    },
  },
  extraReducers: (builder) => {
    // ── Fetch ──
    builder
      .addCase(fetchInvoices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchInvoices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoices = action.payload;
        state.filteredInvoices = applyFilters(
          action.payload,
          state.statusFilter,
          state.searchQuery,
        );
      })
      .addCase(fetchInvoices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Create ──
    builder.addCase(createInvoice.fulfilled, (state, action) => {
      state.invoices.unshift(action.payload);
      state.filteredInvoices = applyFilters(
        state.invoices,
        state.statusFilter,
        state.searchQuery,
      );
    });

    // ── Update ──
    builder.addCase(updateInvoice.fulfilled, (state, action) => {
      const idx = state.invoices.findIndex(
        (i) => i.invoiceId === action.payload.invoiceId,
      );
      if (idx !== -1) state.invoices[idx] = action.payload;
      state.filteredInvoices = applyFilters(
        state.invoices,
        state.statusFilter,
        state.searchQuery,
      );
    });
  },
});

export const { setFilter, setSearchQuery, setCurrentInvoice } =
  invoiceSlice.actions;

export default invoiceSlice.reducer;
