// ============================================================
// FINMATRIX - Settings Redux Slice (Local Preferences)
// ============================================================

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ─── Types ──────────────────────────────────────────────────
type DateFormat = 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
type NumberFormat = '1,234.56' | '1.234,56';
type Currency = 'USD' | 'EUR' | 'GBP';

interface NotificationPrefs {
  invoices: boolean;
  payments: boolean;
  overdue: boolean;
  inventory: boolean;
  payroll: boolean;
}

type FiscalYear = 'jan-dec' | 'apr-mar' | 'jul-jun' | 'oct-sep';

interface SettingsState {
  dateFormat: DateFormat;
  numberFormat: NumberFormat;
  currency: Currency;
  fiscalYear: FiscalYear;
  invoicePrefix: string;
  invoiceStartNumber: number;
  defaultTerms: string;
  defaultNotes: string;
  notificationPrefs: NotificationPrefs;
  demoMode: boolean;
}

const initialState: SettingsState = {
  dateFormat: 'MM/DD/YYYY',
  numberFormat: '1,234.56',
  currency: 'USD',
  fiscalYear: 'jan-dec',
  invoicePrefix: 'INV-',
  invoiceStartNumber: 1001,
  defaultTerms: 'Net 30',
  defaultNotes: 'Thank you for your business!',
  notificationPrefs: {
    invoices: true,
    payments: true,
    overdue: true,
    inventory: false,
    payroll: true,
  },
  demoMode: __DEV__,
};

// ─── Slice ──────────────────────────────────────────────────
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setDateFormat(state, action: PayloadAction<DateFormat>) {
      state.dateFormat = action.payload;
    },
    setNumberFormat(state, action: PayloadAction<NumberFormat>) {
      state.numberFormat = action.payload;
    },
    setCurrency(state, action: PayloadAction<Currency>) {
      state.currency = action.payload;
    },
    setInvoicePrefix(state, action: PayloadAction<string>) {
      state.invoicePrefix = action.payload;
    },
    setInvoiceStartNumber(state, action: PayloadAction<number>) {
      state.invoiceStartNumber = action.payload;
    },
    setDefaultTerms(state, action: PayloadAction<string>) {
      state.defaultTerms = action.payload;
    },
    setDefaultNotes(state, action: PayloadAction<string>) {
      state.defaultNotes = action.payload;
    },
    toggleNotificationPref(state, action: PayloadAction<keyof NotificationPrefs>) {
      const key = action.payload;
      state.notificationPrefs[key] = !state.notificationPrefs[key];
    },
    setFiscalYear(state, action: PayloadAction<FiscalYear>) {
      state.fiscalYear = action.payload;
    },
    toggleDemoMode(state) {
      state.demoMode = !state.demoMode;
    },
    resetSettings() {
      return initialState;
    },
  },
});

export const {
  setDateFormat,
  setNumberFormat,
  setCurrency,
  setInvoicePrefix,
  setInvoiceStartNumber,
  setDefaultTerms,
  setDefaultNotes,
  toggleNotificationPref,
  setFiscalYear,
  toggleDemoMode,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;
