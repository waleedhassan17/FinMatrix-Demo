// ============================================================
// FINMATRIX - Vendor Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Vendor } from '../../dummy-data/vendors';
import {
  getVendorsAPI,
  createVendorAPI,
  updateVendorAPI,
  toggleVendorActiveAPI,
} from '../../network/vendorNetwork';

// ─── Helpers ────────────────────────────────────────────────
type SortKey = 'name' | 'balance';
type ActiveFilter = 'all' | 'active' | 'inactive';

const applyFilters = (
  list: Vendor[],
  search: string,
  activeFilter: ActiveFilter,
  sortKey: SortKey
): Vendor[] => {
  let filtered = [...list];

  if (activeFilter === 'active') {
    filtered = filtered.filter((v) => v.isActive);
  } else if (activeFilter === 'inactive') {
    filtered = filtered.filter((v) => !v.isActive);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (v) =>
        v.companyName.toLowerCase().includes(q) ||
        v.contactPerson.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q)
    );
  }

  switch (sortKey) {
    case 'name':
      filtered.sort((a, b) => a.companyName.localeCompare(b.companyName));
      break;
    case 'balance':
      filtered.sort((a, b) => b.balance - a.balance);
      break;
  }

  return filtered;
};

// ─── State ──────────────────────────────────────────────────
interface VendorState {
  vendors: Vendor[];
  filteredVendors: Vendor[];
  searchQuery: string;
  activeFilter: ActiveFilter;
  sortKey: SortKey;
  isLoading: boolean;
  error: string | null;
}

const initialState: VendorState = {
  vendors: [],
  filteredVendors: [],
  searchQuery: '',
  activeFilter: 'all',
  sortKey: 'name',
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchVendors = createAsyncThunk(
  'vendors/fetch',
  async (_, { rejectWithValue }) => {
    try { return await getVendorsAPI(); }
    catch (e: any) { return rejectWithValue(e.message || 'Failed to fetch vendors'); }
  }
);

export const createVendor = createAsyncThunk(
  'vendors/create',
  async (data: Omit<Vendor, 'vendorId' | 'createdAt'>, { rejectWithValue }) => {
    try { return await createVendorAPI(data); }
    catch (e: any) { return rejectWithValue(e.message || 'Failed to create vendor'); }
  }
);

export const updateVendor = createAsyncThunk(
  'vendors/update',
  async ({ id, data }: { id: string; data: Partial<Vendor> }, { rejectWithValue }) => {
    try { return await updateVendorAPI(id, data); }
    catch (e: any) { return rejectWithValue(e.message || 'Failed to update vendor'); }
  }
);

export const toggleVendorActive = createAsyncThunk(
  'vendors/toggleActive',
  async (id: string, { rejectWithValue }) => {
    try { return await toggleVendorActiveAPI(id); }
    catch (e: any) { return rejectWithValue(e.message || 'Toggle failed'); }
  }
);

// ─── Slice ──────────────────────────────────────────────────
const vendorSlice = createSlice({
  name: 'vendors',
  initialState,
  reducers: {
    setVendorSearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredVendors = applyFilters(state.vendors, action.payload, state.activeFilter, state.sortKey);
    },
    setVendorActiveFilter(state, action: PayloadAction<ActiveFilter>) {
      state.activeFilter = action.payload;
      state.filteredVendors = applyFilters(state.vendors, state.searchQuery, action.payload, state.sortKey);
    },
    setVendorSortKey(state, action: PayloadAction<SortKey>) {
      state.sortKey = action.payload;
      state.filteredVendors = applyFilters(state.vendors, state.searchQuery, state.activeFilter, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVendors.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(fetchVendors.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vendors = action.payload;
        state.filteredVendors = applyFilters(action.payload, state.searchQuery, state.activeFilter, state.sortKey);
      })
      .addCase(fetchVendors.rejected, (state, action) => { state.isLoading = false; state.error = action.payload as string; });

    builder.addCase(createVendor.fulfilled, (state, action) => {
      state.vendors.push(action.payload);
      state.filteredVendors = applyFilters(state.vendors, state.searchQuery, state.activeFilter, state.sortKey);
    });

    builder.addCase(updateVendor.fulfilled, (state, action) => {
      const idx = state.vendors.findIndex((v) => v.vendorId === action.payload.vendorId);
      if (idx >= 0) state.vendors[idx] = action.payload;
      state.filteredVendors = applyFilters(state.vendors, state.searchQuery, state.activeFilter, state.sortKey);
    });

    builder.addCase(toggleVendorActive.fulfilled, (state, action) => {
      const idx = state.vendors.findIndex((v) => v.vendorId === action.payload.vendorId);
      if (idx >= 0) state.vendors[idx] = action.payload;
      state.filteredVendors = applyFilters(state.vendors, state.searchQuery, state.activeFilter, state.sortKey);
    });
  },
});

export const { setVendorSearch, setVendorActiveFilter, setVendorSortKey } = vendorSlice.actions;
export default vendorSlice.reducer;
