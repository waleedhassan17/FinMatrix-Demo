// ============================================================
// FINMATRIX - Inventory Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { InventoryItem, Category } from '../../dummy-data/inventoryItems';
import { AdjustmentRecord } from '../../dummy-data/adjustments';
import { TransferRecord } from '../../dummy-data/transfers';
import {
  getInventoryItemsAPI,
  createInventoryItemAPI,
  updateInventoryItemAPI,
  toggleInventoryActiveAPI,
  adjustQuantityAPI,
  deleteInventoryItemAPI,
  createAdjustmentAPI,
  getAdjustmentsForItemAPI,
  createTransferAPI,
  getTransfersForItemAPI,
} from '../../network/inventoryNetwork';

// ─── Types ──────────────────────────────────────────────────
export type StockFilter = 'all' | 'in_stock' | 'low_stock' | 'out_of_stock';
export type InventorySortKey = 'name' | 'sku' | 'qty' | 'value';
export type SortDirection = 'asc' | 'desc';
export type ViewMode = 'list' | 'grid';

// ─── Filter Helper ──────────────────────────────────────────
const applyFilters = (
  list: InventoryItem[],
  search: string,
  stockFilter: StockFilter,
  category: Category | 'all',
  sortKey: InventorySortKey,
  sortDirection: SortDirection = 'asc'
): InventoryItem[] => {
  let filtered = [...list];

  // Active only (inactive hidden from normal list by default, unless searching)
  // We keep all items in `items` but only show active in filtered by default
  // Actually, let's show all and let stockFilter handle it

  // Stock filter
  switch (stockFilter) {
    case 'in_stock':
      filtered = filtered.filter(
        (i) => i.isActive && i.quantityOnHand > i.reorderPoint
      );
      break;
    case 'low_stock':
      filtered = filtered.filter(
        (i) => i.isActive && i.quantityOnHand > 0 && i.quantityOnHand <= i.reorderPoint
      );
      break;
    case 'out_of_stock':
      filtered = filtered.filter(
        (i) => i.isActive && i.quantityOnHand === 0
      );
      break;
    default:
      break;
  }

  // Category
  if (category !== 'all') {
    filtered = filtered.filter((i) => i.category === category);
  }

  // Search
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        i.sku.toLowerCase().includes(q)
    );
  }

  // Sort
  const dir = sortDirection === 'asc' ? 1 : -1;
  switch (sortKey) {
    case 'name':
      filtered.sort((a, b) => dir * a.name.localeCompare(b.name));
      break;
    case 'sku':
      filtered.sort((a, b) => dir * a.sku.localeCompare(b.sku));
      break;
    case 'qty':
      filtered.sort((a, b) => dir * (a.quantityOnHand - b.quantityOnHand));
      break;
    case 'value':
      filtered.sort(
        (a, b) =>
          dir * (a.quantityOnHand * a.unitCost - b.quantityOnHand * b.unitCost)
      );
      break;
  }

  return filtered;
};

// ─── State ──────────────────────────────────────────────────
interface InventoryState {
  items: InventoryItem[];
  filteredItems: InventoryItem[];
  searchQuery: string;
  stockFilter: StockFilter;
  categoryFilter: Category | 'all';
  sortKey: InventorySortKey;
  sortDirection: SortDirection;
  viewMode: ViewMode;
  isLoading: boolean;
  error: string | null;
}

const initialState: InventoryState = {
  items: [],
  filteredItems: [],
  searchQuery: '',
  stockFilter: 'all',
  categoryFilter: 'all',
  sortKey: 'name',
  sortDirection: 'asc',
  viewMode: 'list',
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchInventory = createAsyncThunk(
  'inventory/fetch',
  async (_, { rejectWithValue }) => {
    try { return await getInventoryItemsAPI(); }
    catch (e: any) { return rejectWithValue(e.message || 'Failed to load inventory'); }
  }
);

export const createInventoryItem = createAsyncThunk(
  'inventory/create',
  async (data: Omit<InventoryItem, 'itemId' | 'lastUpdated'>, { rejectWithValue }) => {
    try { return await createInventoryItemAPI(data); }
    catch (e: any) { return rejectWithValue(e.message || 'Failed to create item'); }
  }
);

export const updateInventoryItem = createAsyncThunk(
  'inventory/update',
  async ({ id, data }: { id: string; data: Partial<InventoryItem> }, { rejectWithValue }) => {
    try { return await updateInventoryItemAPI(id, data); }
    catch (e: any) { return rejectWithValue(e.message || 'Failed to update item'); }
  }
);

export const toggleInventoryActive = createAsyncThunk(
  'inventory/toggleActive',
  async (id: string, { rejectWithValue }) => {
    try { return await toggleInventoryActiveAPI(id); }
    catch (e: any) { return rejectWithValue(e.message || 'Toggle failed'); }
  }
);

export const adjustInventoryQty = createAsyncThunk(
  'inventory/adjustQty',
  async (
    { id, adjustment, reason }: { id: string; adjustment: number; reason: string },
    { rejectWithValue }
  ) => {
    try { return await adjustQuantityAPI(id, adjustment, reason); }
    catch (e: any) { return rejectWithValue(e.message || 'Adjustment failed'); }
  }
);

export const deleteInventoryItem = createAsyncThunk(
  'inventory/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await deleteInventoryItemAPI(id);
      return id;
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to delete item');
    }
  }
);

export const createAdjustment = createAsyncThunk(
  'inventory/createAdjustment',
  async (
    { record, adjustment }: {
      record: Omit<AdjustmentRecord, 'id' | 'reference'>;
      adjustment: number;
    },
    { rejectWithValue, dispatch }
  ) => {
    try {
      // 1. Adjust the item quantity
      await dispatch(
        adjustInventoryQty({ id: record.itemId, adjustment, reason: record.reason })
      ).unwrap();
      // 2. Persist the adjustment record
      const adj = await createAdjustmentAPI(record);
      return adj;
    } catch (e: any) {
      return rejectWithValue(e.message || 'Adjustment failed');
    }
  }
);

export const fetchAdjustmentsForItem = createAsyncThunk(
  'inventory/fetchAdjustmentsForItem',
  async (itemId: string, { rejectWithValue }) => {
    try { return await getAdjustmentsForItemAPI(itemId); }
    catch (e: any) { return rejectWithValue(e.message || 'Failed to load adjustments'); }
  }
);

export const createTransfer = createAsyncThunk(
  'inventory/createTransfer',
  async (
    data: Omit<TransferRecord, 'id' | 'reference'>,
    { rejectWithValue }
  ) => {
    try { return await createTransferAPI(data); }
    catch (e: any) { return rejectWithValue(e.message || 'Transfer failed'); }
  }
);

export const fetchTransfersForItem = createAsyncThunk(
  'inventory/fetchTransfersForItem',
  async (itemId: string, { rejectWithValue }) => {
    try { return await getTransfersForItemAPI(itemId); }
    catch (e: any) { return rejectWithValue(e.message || 'Failed to load transfers'); }
  }
);

// ─── Slice ──────────────────────────────────────────────────
const refilter = (state: InventoryState) => {
  state.filteredItems = applyFilters(
    state.items,
    state.searchQuery,
    state.stockFilter,
    state.categoryFilter,
    state.sortKey,
    state.sortDirection
  );
};

const inventorySlice = createSlice({
  name: 'inventory',
  initialState,
  reducers: {
    setInventorySearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      refilter(state);
    },
    setStockFilter(state, action: PayloadAction<StockFilter>) {
      state.stockFilter = action.payload;
      refilter(state);
    },
    setCategoryFilter(state, action: PayloadAction<Category | 'all'>) {
      state.categoryFilter = action.payload;
      refilter(state);
    },
    setInventorySortKey(state, action: PayloadAction<InventorySortKey>) {
      state.sortKey = action.payload;
      refilter(state);
    },
    setSortDirection(state, action: PayloadAction<SortDirection>) {
      state.sortDirection = action.payload;
      refilter(state);
    },
    setViewMode(state, action: PayloadAction<ViewMode>) {
      state.viewMode = action.payload;
    },
    clearInventoryError(state) {
      state.error = null;
    },
    /** Called when admin approves a shadow→real inventory update.
     *  Subtracts delivered quantities and adds returned quantities. */
    applyDeliveryChanges(
      state,
      action: PayloadAction<{ changes: { itemId: string; quantityDelivered: number; quantityReturned: number }[] }>,
    ) {
      for (const ch of action.payload.changes) {
        const idx = state.items.findIndex((i) => i.itemId === ch.itemId);
        if (idx !== -1) {
          state.items[idx].quantityOnHand =
            state.items[idx].quantityOnHand - ch.quantityDelivered + ch.quantityReturned;
          if (state.items[idx].quantityOnHand < 0) state.items[idx].quantityOnHand = 0;
          state.items[idx].lastUpdated = new Date().toISOString();
        }
      }
      refilter(state);
    },
    /** Bulk-upsert items coming from agency inventory into the main system. */
    syncAgencyItems(
      state,
      action: PayloadAction<{ items: InventoryItem[] }>,
    ) {
      for (const incoming of action.payload.items) {
        const idx = state.items.findIndex((i) => i.itemId === incoming.itemId);
        if (idx !== -1) {
          state.items[idx] = { ...state.items[idx], ...incoming, lastUpdated: new Date().toISOString() };
        } else {
          state.items.push({ ...incoming, lastUpdated: new Date().toISOString() });
        }
      }
      refilter(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload;
        refilter(state);
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    builder
      .addCase(createInventoryItem.pending, (state) => { state.error = null; })
      .addCase(createInventoryItem.fulfilled, (state, action) => {
        state.items.push(action.payload);
        refilter(state);
      })
      .addCase(createInventoryItem.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    builder
      .addCase(updateInventoryItem.pending, (state) => { state.error = null; })
      .addCase(updateInventoryItem.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.itemId === action.payload.itemId);
        if (idx >= 0) state.items[idx] = action.payload;
        refilter(state);
      })
      .addCase(updateInventoryItem.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    builder
      .addCase(toggleInventoryActive.pending, (state) => { state.error = null; })
      .addCase(toggleInventoryActive.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.itemId === action.payload.itemId);
        if (idx >= 0) state.items[idx] = action.payload;
        refilter(state);
      })
      .addCase(toggleInventoryActive.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    builder
      .addCase(adjustInventoryQty.pending, (state) => { state.error = null; })
      .addCase(adjustInventoryQty.fulfilled, (state, action) => {
        const idx = state.items.findIndex((i) => i.itemId === action.payload.itemId);
        if (idx >= 0) state.items[idx] = action.payload;
        refilter(state);
      })
      .addCase(adjustInventoryQty.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    builder
      .addCase(deleteInventoryItem.pending, (state) => { state.error = null; })
      .addCase(deleteInventoryItem.fulfilled, (state, action) => {
        state.items = state.items.filter((i) => i.itemId !== action.payload);
        refilter(state);
      })
      .addCase(deleteInventoryItem.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const {
  setInventorySearch,
  setStockFilter,
  setCategoryFilter,
  setInventorySortKey,
  setSortDirection,
  setViewMode,
  clearInventoryError,
  applyDeliveryChanges,
  syncAgencyItems,
} = inventorySlice.actions;

export default inventorySlice.reducer;
