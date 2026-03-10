// ============================================================
// FINMATRIX - Payments Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Payment } from '../../dummy-data/payments';
import {
  getPaymentsAPI,
  createPaymentAPI,
  getPaymentsForInvoiceAPI,
  getPaymentsForCustomerAPI,
} from '../../network/paymentNetwork';

// ─── State ──────────────────────────────────────────────────
interface PaymentState {
  payments: Payment[];
  invoicePayments: Payment[];     // payments for a specific invoice
  isLoading: boolean;
  error: string | null;
}

const initialState: PaymentState = {
  payments: [],
  invoicePayments: [],
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────

export const fetchPayments = createAsyncThunk(
  'payments/fetchPayments',
  async (_, { rejectWithValue }) => {
    try {
      return await getPaymentsAPI();
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch payments');
    }
  },
);

export const fetchPaymentsForInvoice = createAsyncThunk(
  'payments/fetchPaymentsForInvoice',
  async (invoiceId: string, { rejectWithValue }) => {
    try {
      return await getPaymentsForInvoiceAPI(invoiceId);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch invoice payments');
    }
  },
);

export const createPayment = createAsyncThunk(
  'payments/createPayment',
  async (
    data: Omit<Payment, 'paymentId' | 'createdAt'>,
    { rejectWithValue },
  ) => {
    try {
      return await createPaymentAPI(data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to create payment');
    }
  },
);

// ─── Slice ──────────────────────────────────────────────────

const paymentSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    clearInvoicePayments(state) {
      state.invoicePayments = [];
    },
  },
  extraReducers: (builder) => {
    // ── Fetch all ──
    builder
      .addCase(fetchPayments.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments = action.payload;
      })
      .addCase(fetchPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Fetch for invoice ──
    builder
      .addCase(fetchPaymentsForInvoice.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPaymentsForInvoice.fulfilled, (state, action) => {
        state.isLoading = false;
        state.invoicePayments = action.payload;
      })
      .addCase(fetchPaymentsForInvoice.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Create ──
    builder.addCase(createPayment.fulfilled, (state, action) => {
      state.payments.unshift(action.payload);
    });
  },
});

export const { clearInvoicePayments } = paymentSlice.actions;

export default paymentSlice.reducer;
