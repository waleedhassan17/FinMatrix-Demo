// ============================================================
// FINMATRIX - Bills Redux Slice
// ============================================================
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Bill, BillStatus } from '../../dummy-data/bills';
import { BillPayment } from '../../dummy-data/billPayments';
import {
  getBillsAPI,
  createBillAPI,
  updateBillAPI,
  getBillPaymentsAPI,
  createBillPaymentAPI,
} from '../../network/billNetwork';

/* ── Types ───────────────────────────────────────────────── */
export type StatusFilter = 'all' | BillStatus;

interface BillsState {
  bills: Bill[];
  filteredBills: Bill[];
  billPayments: BillPayment[];
  statusFilter: StatusFilter;
  searchQuery: string;
  currentBill: Bill | null;
  isLoading: boolean;
  error: string | null;
}

/* ── Initial state ───────────────────────────────────────── */
const initialState: BillsState = {
  bills: [],
  filteredBills: [],
  billPayments: [],
  statusFilter: 'all',
  searchQuery: '',
  currentBill: null,
  isLoading: false,
  error: null,
};

/* ── Filter helper ───────────────────────────────────────── */
const applyFilters = (
  bills: Bill[],
  status: StatusFilter,
  query: string,
): Bill[] => {
  let result = [...bills];

  // Status filter
  if (status !== 'all') {
    result = result.filter((b) => b.status === status);
  }

  // Search filter (bill number or vendor name)
  if (query.trim()) {
    const q = query.toLowerCase();
    result = result.filter(
      (b) =>
        b.billNumber.toLowerCase().includes(q) ||
        b.vendorName.toLowerCase().includes(q),
    );
  }

  // Sort newest first
  result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return result;
};

/* ── Thunks ──────────────────────────────────────────────── */
export const fetchBills = createAsyncThunk('bills/fetchBills', async () => {
  return getBillsAPI();
});

export const createBill = createAsyncThunk(
  'bills/createBill',
  async (bill: Bill) => {
    return createBillAPI(bill);
  },
);

export const updateBill = createAsyncThunk(
  'bills/updateBill',
  async (bill: Bill) => {
    return updateBillAPI(bill);
  },
);

export const fetchBillPayments = createAsyncThunk(
  'bills/fetchBillPayments',
  async () => {
    return getBillPaymentsAPI();
  },
);

export const createBillPayment = createAsyncThunk(
  'bills/createBillPayment',
  async (payment: BillPayment) => {
    return createBillPaymentAPI(payment);
  },
);

/* ── Slice ───────────────────────────────────────────────── */
const billsSlice = createSlice({
  name: 'bills',
  initialState,
  reducers: {
    setFilter(state, action: PayloadAction<StatusFilter>) {
      state.statusFilter = action.payload;
      state.filteredBills = applyFilters(state.bills, action.payload, state.searchQuery);
    },
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredBills = applyFilters(state.bills, state.statusFilter, action.payload);
    },
    setCurrentBill(state, action: PayloadAction<Bill | null>) {
      state.currentBill = action.payload;
    },
  },
  extraReducers: (builder) => {
    /* ── fetchBills ────────────────────────────────────── */
    builder
      .addCase(fetchBills.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBills.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bills = action.payload;
        state.filteredBills = applyFilters(
          action.payload,
          state.statusFilter,
          state.searchQuery,
        );
      })
      .addCase(fetchBills.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch bills';
      });

    /* ── createBill ───────────────────────────────────── */
    builder.addCase(createBill.fulfilled, (state, action) => {
      state.bills.unshift(action.payload);
      state.filteredBills = applyFilters(
        state.bills,
        state.statusFilter,
        state.searchQuery,
      );
    });

    /* ── updateBill ───────────────────────────────────── */
    builder.addCase(updateBill.fulfilled, (state, action) => {
      const idx = state.bills.findIndex(
        (b) => b.billId === action.payload.billId,
      );
      if (idx !== -1) state.bills[idx] = action.payload;
      state.filteredBills = applyFilters(
        state.bills,
        state.statusFilter,
        state.searchQuery,
      );
    });

    /* ── fetchBillPayments ────────────────────────────── */
    builder
      .addCase(fetchBillPayments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchBillPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.billPayments = action.payload;
      })
      .addCase(fetchBillPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch payments';
      });

    /* ── createBillPayment ────────────────────────────── */
    builder.addCase(createBillPayment.fulfilled, (state, action) => {
      state.billPayments.unshift(action.payload);
      // Re-fetch bills to get updated amountPaid/status
      // (handled by component dispatching fetchBills after payment)
    });
  },
});

export const { setFilter, setSearchQuery, setCurrentBill } = billsSlice.actions;
export default billsSlice.reducer;
