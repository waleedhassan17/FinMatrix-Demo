// ============================================================
// FINMATRIX - Estimates Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Estimate, EstimateStatus } from '../../dummy-data/estimates';
import {
  getEstimatesAPI,
  createEstimateAPI,
  updateEstimateAPI,
} from '../../network/estimateNetwork';

type StatusFilter = 'all' | EstimateStatus;

const applyFilters = (
  list: Estimate[],
  filter: StatusFilter,
  search: string,
): Estimate[] => {
  let filtered = [...list];
  if (filter !== 'all') filtered = filtered.filter((e) => e.status === filter);
  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.estimateNumber.toLowerCase().includes(q) ||
        e.customerName.toLowerCase().includes(q),
    );
  }
  filtered.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  return filtered;
};

interface EstimateState {
  estimates: Estimate[];
  filteredEstimates: Estimate[];
  statusFilter: StatusFilter;
  searchQuery: string;
  isLoading: boolean;
  error: string | null;
}

const initialState: EstimateState = {
  estimates: [],
  filteredEstimates: [],
  statusFilter: 'all',
  searchQuery: '',
  isLoading: false,
  error: null,
};

export const fetchEstimates = createAsyncThunk(
  'estimates/fetchEstimates',
  async (_, { rejectWithValue }) => {
    try {
      return await getEstimatesAPI();
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch estimates');
    }
  },
);

export const createEstimate = createAsyncThunk(
  'estimates/createEstimate',
  async (data: Omit<Estimate, 'estimateId' | 'createdAt'>, { rejectWithValue }) => {
    try {
      return await createEstimateAPI(data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to create estimate');
    }
  },
);

export const updateEstimate = createAsyncThunk(
  'estimates/updateEstimate',
  async ({ id, data }: { id: string; data: Partial<Estimate> }, { rejectWithValue }) => {
    try {
      return await updateEstimateAPI(id, data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to update estimate');
    }
  },
);

const estimateSlice = createSlice({
  name: 'estimates',
  initialState,
  reducers: {
    setEstimateFilter(state, action: PayloadAction<StatusFilter>) {
      state.statusFilter = action.payload;
      state.filteredEstimates = applyFilters(state.estimates, action.payload, state.searchQuery);
    },
    setEstimateSearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredEstimates = applyFilters(state.estimates, state.statusFilter, action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEstimates.pending, (s) => { s.isLoading = true; s.error = null; })
      .addCase(fetchEstimates.fulfilled, (s, a) => {
        s.isLoading = false;
        s.estimates = a.payload;
        s.filteredEstimates = applyFilters(a.payload, s.statusFilter, s.searchQuery);
      })
      .addCase(fetchEstimates.rejected, (s, a) => { s.isLoading = false; s.error = a.payload as string; });

    builder.addCase(createEstimate.fulfilled, (s, a) => {
      s.estimates.unshift(a.payload);
      s.filteredEstimates = applyFilters(s.estimates, s.statusFilter, s.searchQuery);
    });

    builder.addCase(updateEstimate.fulfilled, (s, a) => {
      const idx = s.estimates.findIndex((e) => e.estimateId === a.payload.estimateId);
      if (idx !== -1) s.estimates[idx] = a.payload;
      s.filteredEstimates = applyFilters(s.estimates, s.statusFilter, s.searchQuery);
    });
  },
});

export const { setEstimateFilter, setEstimateSearch } = estimateSlice.actions;
export default estimateSlice.reducer;
