// ============================================================
// FINMATRIX - Sales Orders Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SalesOrder, SOStatus } from '../../dummy-data/salesOrders';
import {
  getSalesOrdersAPI,
  createSalesOrderAPI,
  updateSalesOrderAPI,
} from '../../network/salesOrderNetwork';

type StatusFilter = 'all' | SOStatus;

const applyFilters = (list: SalesOrder[], filter: StatusFilter, search: string): SalesOrder[] => {
  let filtered = [...list];
  if (filter !== 'all') filtered = filtered.filter((s) => s.status === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (s) => s.soNumber.toLowerCase().includes(q) || s.customerName.toLowerCase().includes(q),
    );
  }
  filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  return filtered;
};

interface SOState {
  salesOrders: SalesOrder[];
  filteredSalesOrders: SalesOrder[];
  statusFilter: StatusFilter;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: SOState = {
  salesOrders: [],
  filteredSalesOrders: [],
  statusFilter: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,
};

export const fetchSalesOrders = createAsyncThunk(
  'salesOrders/fetchSalesOrders',
  async (_, { rejectWithValue }) => {
    try { return await getSalesOrdersAPI(); }
    catch (e: any) { return rejectWithValue(e.message || 'Failed to fetch sales orders'); }
  },
);

export const createSalesOrder = createAsyncThunk(
  'salesOrders/createSalesOrder',
  async (data: Omit<SalesOrder, 'salesOrderId' | 'createdAt'>, { rejectWithValue }) => {
    try { return await createSalesOrderAPI(data); }
    catch (e: any) { return rejectWithValue(e.message || 'Failed to create sales order'); }
  },
);

export const updateSalesOrder = createAsyncThunk(
  'salesOrders/updateSalesOrder',
  async ({ id, data }: { id: string; data: Partial<SalesOrder> }, { rejectWithValue }) => {
    try { return await updateSalesOrderAPI(id, data); }
    catch (e: any) { return rejectWithValue(e.message || 'Failed to update sales order'); }
  },
);

const soSlice = createSlice({
  name: 'salesOrders',
  initialState,
  reducers: {
    setSOFilter(state, action: PayloadAction<StatusFilter>) {
      state.statusFilter = action.payload;
      state.filteredSalesOrders = applyFilters(state.salesOrders, action.payload, state.searchQuery);
    },
    setSOSearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredSalesOrders = applyFilters(state.salesOrders, state.statusFilter, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesOrders.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchSalesOrders.fulfilled, (s, a) => {
        s.isLoading = false;
        s.salesOrders = a.payload;
        s.filteredSalesOrders = applyFilters(a.payload, s.statusFilter, s.searchQuery);
      })
      .addCase(fetchSalesOrders.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });

    builder.addCase(createSalesOrder.fulfilled, (s, a) => {
      s.salesOrders.unshift(a.payload);
      s.filteredSalesOrders = applyFilters(s.salesOrders, s.statusFilter, s.searchQuery);
    });

    builder.addCase(updateSalesOrder.fulfilled, (s, a) => {
      const idx = s.salesOrders.findIndex((x) => x.salesOrderId === a.payload.salesOrderId);
      if (idx !== -1) s.salesOrders[idx] = a.payload;
      s.filteredSalesOrders = applyFilters(s.salesOrders, s.statusFilter, s.searchQuery);
    });
  },
});

export const { setSOFilter, setSOSearch } = soSlice.actions;
export default soSlice.reducer;
