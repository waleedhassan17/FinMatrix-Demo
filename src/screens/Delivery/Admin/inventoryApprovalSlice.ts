// ============================================================
// FINMATRIX - Inventory Approval Redux Slice
// ============================================================
// Shadow inventory concept — approving a request also
// dispatches updateInventoryItem to sync real inventory.

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  InventoryUpdateRequest,
  InventoryRequestStatus,
} from '../../../dummy-data/inventoryUpdateRequests';
import {
  getInventoryRequestsAPI,
  approveRequestAPI,
  rejectRequestAPI,
} from './inventoryApprovalNetwork';
import { updateInventoryItem } from '../../Inventory/inventorySlice';
import type { AppDispatch } from '../../../store/store';

// ─── Types ──────────────────────────────────────────────────
export type ApprovalFilterKey = 'pending' | 'approved' | 'rejected' | 'all';

interface InventoryApprovalState {
  requests: InventoryUpdateRequest[];
  filter: ApprovalFilterKey;
  isLoading: boolean;
  isProcessing: boolean;
  error: string | null;
}

const initialState: InventoryApprovalState = {
  requests: [],
  filter: 'pending',
  isLoading: false,
  isProcessing: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────

export const fetchApprovalRequests = createAsyncThunk(
  'inventoryApproval/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      return await getInventoryRequestsAPI();
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to load requests');
    }
  }
);

// Approve + cross-slice: update real inventory quantities
export const approveRequest = createAsyncThunk<
  InventoryUpdateRequest,
  { requestId: string; reviewedBy: string },
  { dispatch: AppDispatch }
>(
  'inventoryApproval/approve',
  async ({ requestId, reviewedBy }, { dispatch, getState, rejectWithValue }) => {
    try {
      const approved = await approveRequestAPI(requestId, reviewedBy);

      // Cross-slice: apply each change to real inventory
      for (const change of approved.changes) {
        await dispatch(
          updateInventoryItem({
            id: change.itemId,
            data: { quantityOnHand: change.quantityAfter },
          })
        ).unwrap();
      }

      return approved;
    } catch (e: any) {
      return rejectWithValue(e.message || 'Approval failed');
    }
  }
);

export const rejectRequest = createAsyncThunk(
  'inventoryApproval/reject',
  async (
    { requestId, reviewedBy, adminNotes }: { requestId: string; reviewedBy: string; adminNotes: string },
    { rejectWithValue }
  ) => {
    try {
      return await rejectRequestAPI(requestId, reviewedBy, adminNotes);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Rejection failed');
    }
  }
);

// ─── Slice ──────────────────────────────────────────────────
const inventoryApprovalSlice = createSlice({
  name: 'inventoryApproval',
  initialState,
  reducers: {
    setApprovalFilter(state, action: PayloadAction<ApprovalFilterKey>) {
      state.filter = action.payload;
    },
    clearApprovalError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch
    builder
      .addCase(fetchApprovalRequests.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchApprovalRequests.fulfilled, (state, action) => {
        state.isLoading = false;
        state.requests = action.payload;
      })
      .addCase(fetchApprovalRequests.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Approve
    builder
      .addCase(approveRequest.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(approveRequest.fulfilled, (state, action) => {
        state.isProcessing = false;
        const idx = state.requests.findIndex((r) => r.requestId === action.payload.requestId);
        if (idx !== -1) state.requests[idx] = action.payload;
      })
      .addCase(approveRequest.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      });

    // Reject
    builder
      .addCase(rejectRequest.pending, (state) => {
        state.isProcessing = true;
        state.error = null;
      })
      .addCase(rejectRequest.fulfilled, (state, action) => {
        state.isProcessing = false;
        const idx = state.requests.findIndex((r) => r.requestId === action.payload.requestId);
        if (idx !== -1) state.requests[idx] = action.payload;
      })
      .addCase(rejectRequest.rejected, (state, action) => {
        state.isProcessing = false;
        state.error = action.payload as string;
      });
  },
});

export const { setApprovalFilter, clearApprovalError } = inventoryApprovalSlice.actions;
export default inventoryApprovalSlice.reducer;
