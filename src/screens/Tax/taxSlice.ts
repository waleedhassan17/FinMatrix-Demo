// ============================================================
// FINMATRIX - Tax Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { TaxRate, TaxPayment } from '../../dummy-data/taxRates';
import {
  getTaxRatesAPI,
  createTaxRateAPI,
  updateTaxRateAPI,
  deleteTaxRateAPI,
  getTaxPaymentsAPI,
  createTaxPaymentAPI,
} from '../../network/taxNetwork';

// ─── State ──────────────────────────────────────────────────
interface TaxState {
  rates: TaxRate[];
  payments: TaxPayment[];
  isLoading: boolean;
  error: string | null;
}

const initialState: TaxState = {
  rates: [],
  payments: [],
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchTaxRates = createAsyncThunk(
  'tax/fetchRates',
  async () => getTaxRatesAPI(),
);

export const addTaxRate = createAsyncThunk(
  'tax/addRate',
  async (data: Omit<TaxRate, 'taxId'>) => createTaxRateAPI(data),
);

export const editTaxRate = createAsyncThunk(
  'tax/editRate',
  async (data: TaxRate) => updateTaxRateAPI(data),
);

export const removeTaxRate = createAsyncThunk(
  'tax/removeRate',
  async (taxId: string) => deleteTaxRateAPI(taxId),
);

export const fetchTaxPayments = createAsyncThunk(
  'tax/fetchPayments',
  async () => getTaxPaymentsAPI(),
);

export const recordTaxPayment = createAsyncThunk(
  'tax/recordPayment',
  async (data: Omit<TaxPayment, 'paymentId' | 'createdAt'>) =>
    createTaxPaymentAPI(data),
);

// ─── Slice ──────────────────────────────────────────────────
const taxSlice = createSlice({
  name: 'tax',
  initialState,
  reducers: {
    clearTaxError(state) {
      state.error = null;
    },
    toggleRateActive(state, action: PayloadAction<string>) {
      const rate = state.rates.find((r) => r.taxId === action.payload);
      if (rate) rate.isActive = !rate.isActive;
    },
  },
  extraReducers: (builder) => {
    // Fetch rates
    builder
      .addCase(fetchTaxRates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTaxRates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.rates = action.payload;
      })
      .addCase(fetchTaxRates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to load tax rates';
      });

    // Add rate
    builder.addCase(addTaxRate.fulfilled, (state, action) => {
      state.rates.push(action.payload);
    });

    // Edit rate
    builder.addCase(editTaxRate.fulfilled, (state, action) => {
      const idx = state.rates.findIndex((r) => r.taxId === action.payload.taxId);
      if (idx >= 0) state.rates[idx] = action.payload;
    });

    // Remove rate
    builder.addCase(removeTaxRate.fulfilled, (state, action) => {
      state.rates = state.rates.filter((r) => r.taxId !== action.payload);
    });

    // Fetch payments
    builder
      .addCase(fetchTaxPayments.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchTaxPayments.fulfilled, (state, action) => {
        state.isLoading = false;
        state.payments = action.payload;
      })
      .addCase(fetchTaxPayments.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to load tax payments';
      });

    // Record payment
    builder.addCase(recordTaxPayment.fulfilled, (state, action) => {
      state.payments.push(action.payload);
    });
  },
});

export const { clearTaxError, toggleRateActive } = taxSlice.actions;
export default taxSlice.reducer;
