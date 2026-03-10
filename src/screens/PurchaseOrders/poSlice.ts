// ============================================================
// FINMATRIX - Purchase Orders Redux Slice
// ============================================================
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { PurchaseOrder, POStatus } from '../../dummy-data/purchaseOrders';
import {
  getPurchaseOrdersAPI,
  createPurchaseOrderAPI,
  updatePurchaseOrderAPI,
  receiveItemsAPI,
} from '../../network/poNetwork';

/* ── Types ───────────────────────────────────────────────── */
export type POStatusFilter = 'all' | POStatus;

interface POState {
  purchaseOrders: PurchaseOrder[];
  filteredPurchaseOrders: PurchaseOrder[];
  statusFilter: POStatusFilter;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

/* ── Filter helper ───────────────────────────────────────── */
const applyFilters = (
  list: PurchaseOrder[],
  filter: POStatusFilter,
  search: string,
): PurchaseOrder[] => {
  let result = [...list];

  if (filter !== 'all') {
    result = result.filter((p) => p.status === filter);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter(
      (p) =>
        p.poNumber.toLowerCase().includes(q) ||
        p.vendorName.toLowerCase().includes(q),
    );
  }

  result.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  return result;
};

/* ── Initial state ───────────────────────────────────────── */
const initialState: POState = {
  purchaseOrders: [],
  filteredPurchaseOrders: [],
  statusFilter: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,
};

/* ── Thunks ──────────────────────────────────────────────── */
export const fetchPurchaseOrders = createAsyncThunk(
  'purchaseOrders/fetchPurchaseOrders',
  async () => getPurchaseOrdersAPI(),
);

export const createPurchaseOrder = createAsyncThunk(
  'purchaseOrders/createPurchaseOrder',
  async (po: PurchaseOrder) => createPurchaseOrderAPI(po),
);

export const updatePurchaseOrder = createAsyncThunk(
  'purchaseOrders/updatePurchaseOrder',
  async (po: PurchaseOrder) => updatePurchaseOrderAPI(po),
);

export const receiveItems = createAsyncThunk(
  'purchaseOrders/receiveItems',
  async ({
    poId,
    receivingLines,
  }: {
    poId: string;
    receivingLines: { lineId: string; quantityReceiving: number }[];
  }) => receiveItemsAPI(poId, receivingLines),
);

/* ── Slice ───────────────────────────────────────────────── */
const poSlice = createSlice({
  name: 'purchaseOrders',
  initialState,
  reducers: {
    setPOFilter(state, action: PayloadAction<POStatusFilter>) {
      state.statusFilter = action.payload;
      state.filteredPurchaseOrders = applyFilters(
        state.purchaseOrders,
        action.payload,
        state.searchQuery,
      );
    },
    setPOSearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredPurchaseOrders = applyFilters(
        state.purchaseOrders,
        state.statusFilter,
        action.payload,
      );
    },
  },
  extraReducers: (builder) => {
    /* ── fetchPurchaseOrders ──────────────────────────── */
    builder
      .addCase(fetchPurchaseOrders.pending, (s) => {
        s.isLoading = true;
        s.error = null;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (s, a) => {
        s.isLoading = false;
        s.purchaseOrders = a.payload;
        s.filteredPurchaseOrders = applyFilters(
          a.payload,
          s.statusFilter,
          s.searchQuery,
        );
      })
      .addCase(fetchPurchaseOrders.rejected, (s, a) => {
        s.isLoading = false;
        s.error = a.error.message || 'Failed to fetch purchase orders';
      });

    /* ── createPurchaseOrder ─────────────────────────── */
    builder.addCase(createPurchaseOrder.fulfilled, (s, a) => {
      s.purchaseOrders.unshift(a.payload);
      s.filteredPurchaseOrders = applyFilters(
        s.purchaseOrders,
        s.statusFilter,
        s.searchQuery,
      );
    });

    /* ── updatePurchaseOrder ─────────────────────────── */
    builder.addCase(updatePurchaseOrder.fulfilled, (s, a) => {
      const idx = s.purchaseOrders.findIndex(
        (p) => p.poId === a.payload.poId,
      );
      if (idx !== -1) s.purchaseOrders[idx] = a.payload;
      s.filteredPurchaseOrders = applyFilters(
        s.purchaseOrders,
        s.statusFilter,
        s.searchQuery,
      );
    });

    /* ── receiveItems ────────────────────────────────── */
    builder.addCase(receiveItems.fulfilled, (s, a) => {
      const idx = s.purchaseOrders.findIndex(
        (p) => p.poId === a.payload.poId,
      );
      if (idx !== -1) s.purchaseOrders[idx] = a.payload;
      s.filteredPurchaseOrders = applyFilters(
        s.purchaseOrders,
        s.statusFilter,
        s.searchQuery,
      );
    });
  },
});

export const { setPOFilter, setPOSearch } = poSlice.actions;
export default poSlice.reducer;
