// ============================================================
// FINMATRIX - Journal Entries Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { JournalEntry } from '../../dummy-data/journalEntries';
import {
  getJournalEntriesAPI,
  createJournalEntryAPI,
  updateJournalEntryAPI,
  postJournalEntryAPI,
  voidJournalEntryAPI,
} from '../../network/jeNetwork';

// ─── Helpers ────────────────────────────────────────────────
const applyFilters = (
  entries: JournalEntry[],
  search: string,
  statusFilter: string
): JournalEntry[] => {
  let filtered = [...entries];

  if (statusFilter !== 'all') {
    filtered = filtered.filter((e) => e.status === statusFilter);
  }

  if (search.trim()) {
    const q = search.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.reference.toLowerCase().includes(q) ||
        e.memo.toLowerCase().includes(q)
    );
  }

  return filtered;
};

// ─── State ──────────────────────────────────────────────────
interface JEState {
  entries: JournalEntry[];
  filteredEntries: JournalEntry[];
  searchQuery: string;
  statusFilter: string; // 'all' | 'draft' | 'posted' | 'void'
  isLoading: boolean;
  error: string | null;
}

const initialState: JEState = {
  entries: [],
  filteredEntries: [],
  searchQuery: '',
  statusFilter: 'all',
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchJournalEntries = createAsyncThunk(
  'je/fetchJournalEntries',
  async (_, { rejectWithValue }) => {
    try {
      return await getJournalEntriesAPI();
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch journal entries');
    }
  }
);

export const createJournalEntry = createAsyncThunk(
  'je/createJournalEntry',
  async (data: Omit<JournalEntry, 'entryId' | 'createdAt'>, { rejectWithValue }) => {
    try {
      return await createJournalEntryAPI(data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to create journal entry');
    }
  }
);

export const updateJournalEntry = createAsyncThunk(
  'je/updateJournalEntry',
  async (
    { id, data }: { id: string; data: Partial<JournalEntry> },
    { rejectWithValue }
  ) => {
    try {
      return await updateJournalEntryAPI(id, data);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to update journal entry');
    }
  }
);

export const postJournalEntry = createAsyncThunk(
  'je/postJournalEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      return await postJournalEntryAPI(id);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to post journal entry');
    }
  }
);

export const voidJournalEntry = createAsyncThunk(
  'je/voidJournalEntry',
  async (id: string, { rejectWithValue }) => {
    try {
      return await voidJournalEntryAPI(id);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to void journal entry');
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────
const jeSlice = createSlice({
  name: 'je',
  initialState,
  reducers: {
    setSearchQuery(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
      state.filteredEntries = applyFilters(
        state.entries,
        action.payload,
        state.statusFilter
      );
    },
    setStatusFilter(state, action: PayloadAction<string>) {
      state.statusFilter = action.payload;
      state.filteredEntries = applyFilters(
        state.entries,
        state.searchQuery,
        action.payload
      );
    },
  },
  extraReducers: (builder) => {
    // fetchJournalEntries
    builder
      .addCase(fetchJournalEntries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchJournalEntries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.entries = action.payload;
        state.filteredEntries = applyFilters(
          action.payload,
          state.searchQuery,
          state.statusFilter
        );
      })
      .addCase(fetchJournalEntries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // createJournalEntry
    builder.addCase(createJournalEntry.fulfilled, (state, action) => {
      state.entries.unshift(action.payload);
      state.filteredEntries = applyFilters(
        state.entries,
        state.searchQuery,
        state.statusFilter
      );
    });

    // updateJournalEntry
    builder.addCase(updateJournalEntry.fulfilled, (state, action) => {
      const idx = state.entries.findIndex(
        (e) => e.entryId === action.payload.entryId
      );
      if (idx !== -1) state.entries[idx] = action.payload;
      state.filteredEntries = applyFilters(
        state.entries,
        state.searchQuery,
        state.statusFilter
      );
    });

    // postJournalEntry
    builder.addCase(postJournalEntry.fulfilled, (state, action) => {
      const idx = state.entries.findIndex(
        (e) => e.entryId === action.payload.entryId
      );
      if (idx !== -1) state.entries[idx] = action.payload;
      state.filteredEntries = applyFilters(
        state.entries,
        state.searchQuery,
        state.statusFilter
      );
    });

    // voidJournalEntry
    builder.addCase(voidJournalEntry.fulfilled, (state, action) => {
      const idx = state.entries.findIndex(
        (e) => e.entryId === action.payload.entryId
      );
      if (idx !== -1) state.entries[idx] = action.payload;
      state.filteredEntries = applyFilters(
        state.entries,
        state.searchQuery,
        state.statusFilter
      );
    });
  },
});

export const { setSearchQuery, setStatusFilter } = jeSlice.actions;
export default jeSlice.reducer;
