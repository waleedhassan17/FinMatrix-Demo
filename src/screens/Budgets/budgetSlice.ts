// ============================================================
// FINMATRIX - Budgets Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Budget, budgets as SEED } from '../../dummy-data/budgets';

// ─── State ──────────────────────────────────────────────────
interface BudgetState {
  budgets: Budget[];
  currentBudget: Budget | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: BudgetState = {
  budgets: [],
  currentBudget: null,
  isLoading: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────
export const fetchBudgets = createAsyncThunk(
  'budgets/fetchBudgets',
  async () => {
    await new Promise((r) => setTimeout(r, 800));
    return SEED;
  },
);

export const createBudget = createAsyncThunk(
  'budgets/createBudget',
  async (budget: Omit<Budget, 'budgetId'>) => {
    await new Promise((r) => setTimeout(r, 600));
    const newBudget: Budget = {
      ...budget,
      budgetId: `budget_${Date.now()}`,
    };
    return newBudget;
  },
);

export const updateBudget = createAsyncThunk(
  'budgets/updateBudget',
  async (budget: Budget) => {
    await new Promise((r) => setTimeout(r, 600));
    return budget;
  },
);

// ─── Slice ──────────────────────────────────────────────────
const budgetSlice = createSlice({
  name: 'budgets',
  initialState,
  reducers: {
    setBudgets(state, action: PayloadAction<Budget[]>) {
      state.budgets = action.payload;
    },
    setCurrentBudget(state, action: PayloadAction<Budget | null>) {
      state.currentBudget = action.payload;
    },
    setLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },
    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    // fetchBudgets
    builder
      .addCase(fetchBudgets.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBudgets.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budgets = action.payload;
      })
      .addCase(fetchBudgets.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to fetch budgets';
      });

    // createBudget
    builder
      .addCase(createBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        state.budgets.push(action.payload);
      })
      .addCase(createBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to create budget';
      });

    // updateBudget
    builder
      .addCase(updateBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        const idx = state.budgets.findIndex((b) => b.budgetId === action.payload.budgetId);
        if (idx !== -1) state.budgets[idx] = action.payload;
        if (state.currentBudget?.budgetId === action.payload.budgetId) {
          state.currentBudget = action.payload;
        }
      })
      .addCase(updateBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message ?? 'Failed to update budget';
      });
  },
});

export const { setBudgets, setCurrentBudget, setLoading, setError } = budgetSlice.actions;
export default budgetSlice.reducer;
