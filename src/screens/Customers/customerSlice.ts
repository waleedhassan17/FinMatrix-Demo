// ============================================================
// FINMATRIX - Customers Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Customer } from '../../dummy-data/customers';
import {
  getCustomersAPI,
  createCustomerAPI,
  updateCustomerAPI,
  toggleCustomerActiveAPI,
} from '../../network/customerNetwork';

// ─── Helpers ────────────────────────────────────────────────
type SortKey = 'name' | 'balance' | 'recent';
type ActiveFilter = 'all' | 'active' | 'inactive';

const applyFilters = (
  list: Customer[],
  search: string,
  activeFilter: ActiveFilter,
  sortKey: SortKey
): Customer[] => {
  let filtered = [...list];

  // Active filter
  if (activeFilter === 'active') {
    filtered = filtered.filter((c) => c.isActive);
  } else if (activeFilter === 'inactive') {
    filtered = filtered.filter((c) => !c.isActive);
  }

  // Search
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }

  // Sort
  switch (sortKey) {
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'balance':
      filtered.sort((a, b) => b.balance - a.balance);
      break;
    case 'recent':
      filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      break;
  }

  return filtered;
};

// ─── State ──────────────────────────────────────────────────
interface CustomerState {
  customers: Customer[];
  filteredCustomers: Customer[];
  searchQuery: string;
  activeFilter: ActiveFilter;
  sortKey: SortKey;
  isLoading: boolean;
  error: string | null;
}

const initialState: CustomerState = {
  customers: [],
  filteredCustomers: [],
  searchQuery: '',
  activeFilter: 'all',
  sortKey: 'name',
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      return await getCustomersAPI();
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch customers');
    }
  }
);

export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (data: Omit<Customer, 'customerId' | 'createdAt'>, { rejectWithValue }) => {
    try {
      return await createCustomerAPI(data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to create customer');
    }
  }
);

export const updateCustomer = createAsyncThunk(
  'customers/updateCustomer',
  async (
    { id, data }: { id: string; data: Partial<Customer> },
    { rejectWithValue }
  ) => {
    try {
      return await updateCustomerAPI(id, data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to update customer');
    }
  }
);

export const toggleCustomerActive = createAsyncThunk(
  'customers/toggleCustomerActive',
  async (id: string, { rejectWithValue }) => {
    try {
      return await toggleCustomerActiveAPI(id);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to toggle customer status');
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────
const customerSlice = createSlice({
  name: 'customers',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredCustomers = applyFilters(
        state.customers,
        action.payload,
        state.activeFilter,
        state.sortKey
      );
    },
    setActiveFilter(state, action: PayloadAction<ActiveFilter>) {
      state.activeFilter = action.payload;
      state.filteredCustomers = applyFilters(
        state.customers,
        state.searchQuery,
        action.payload,
        state.sortKey
      );
    },
    setSortKey(state, action: PayloadAction<SortKey>) {
      state.sortKey = action.payload;
      state.filteredCustomers = applyFilters(
        state.customers,
        state.searchQuery,
        state.activeFilter,
        action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // fetch
    builder
      .addCase(fetchCustomers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customers = action.payload;
        state.filteredCustomers = applyFilters(
          action.payload,
          state.searchQuery,
          state.activeFilter,
          state.sortKey
        );
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // create
    builder.addCase(createCustomer.fulfilled, (state, action) => {
      state.customers.push(action.payload);
      state.filteredCustomers = applyFilters(
        state.customers,
        state.searchQuery,
        state.activeFilter,
        state.sortKey
      );
    });

    // update
    builder.addCase(updateCustomer.fulfilled, (state, action) => {
      const idx = state.customers.findIndex(
        (c) => c.customerId === action.payload.customerId
      );
      if (idx !== -1) state.customers[idx] = action.payload;
      state.filteredCustomers = applyFilters(
        state.customers,
        state.searchQuery,
        state.activeFilter,
        state.sortKey
      );
    });

    // toggle active
    builder.addCase(toggleCustomerActive.fulfilled, (state, action) => {
      const idx = state.customers.findIndex(
        (c) => c.customerId === action.payload.customerId
      );
      if (idx !== -1) state.customers[idx] = action.payload;
      state.filteredCustomers = applyFilters(
        state.customers,
        state.searchQuery,
        state.activeFilter,
        state.sortKey
      );
    });
  },
});

export const { setSearchQuery, setActiveFilter, setSortKey } =
  customerSlice.actions;
export default customerSlice.reducer;
