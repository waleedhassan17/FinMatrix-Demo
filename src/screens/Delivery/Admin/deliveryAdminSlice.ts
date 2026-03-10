// ============================================================
// FINMATRIX - Delivery Admin Redux Slice
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Delivery, DeliveryStatus, DeliveryPriority } from '../../../dummy-data/deliveries';
import { DeliveryPerson } from '../../../dummy-data/deliveryPersonnel';
import {
  getDeliveriesAPI,
  createDeliveryAPI,
  updateDeliveryAPI,
  assignDeliveryAPI,
  batchAssignDeliveriesAPI,
  autoAssignDeliveriesAPI,
  getPersonnelAPI,
  updatePersonnelAPI,
  addPersonnelAPI,
  removePersonnelAPI,
} from './deliveryAdminNetwork';

// ─── Types ──────────────────────────────────────────────────
export type DeliveryTabKey = 'assign' | 'monitor' | 'approvals';
export type StatusFilter = 'all' | DeliveryStatus;

interface DeliveryAdminState {
  deliveries: Delivery[];
  personnel: DeliveryPerson[];
  activeTab: DeliveryTabKey;
  statusFilter: StatusFilter;
  searchQuery: string;
  isLoading: boolean;
  isAssigning: boolean;
  error: string | null;
}

const initialState: DeliveryAdminState = {
  deliveries: [],
  personnel: [],
  activeTab: 'assign',
  statusFilter: 'all',
  searchQuery: '',
  isLoading: false,
  isAssigning: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────

export const fetchDeliveries = createAsyncThunk(
  'deliveryAdmin/fetchDeliveries',
  async () => await getDeliveriesAPI()
);

export const fetchPersonnel = createAsyncThunk(
  'deliveryAdmin/fetchPersonnel',
  async () => await getPersonnelAPI()
);

export const createDelivery = createAsyncThunk(
  'deliveryAdmin/createDelivery',
  async (data: Omit<Delivery, 'deliveryId'>) => await createDeliveryAPI(data)
);

export const updateDelivery = createAsyncThunk(
  'deliveryAdmin/updateDelivery',
  async ({ id, data }: { id: string; data: Partial<Delivery> }) =>
    await updateDeliveryAPI(id, data)
);

export const assignDelivery = createAsyncThunk(
  'deliveryAdmin/assignDelivery',
  async ({ deliveryId, personId }: { deliveryId: string; personId: string }) =>
    await assignDeliveryAPI(deliveryId, personId)
);

export const batchAssignDeliveries = createAsyncThunk(
  'deliveryAdmin/batchAssign',
  async ({ deliveryIds, personId }: { deliveryIds: string[]; personId: string }) =>
    await batchAssignDeliveriesAPI(deliveryIds, personId)
);

export const autoAssignDeliveries = createAsyncThunk(
  'deliveryAdmin/autoAssign',
  async (deliveryIds: string[]) => await autoAssignDeliveriesAPI(deliveryIds)
);

export const updatePersonnel = createAsyncThunk(
  'deliveryAdmin/updatePersonnel',
  async ({ userId, data }: { userId: string; data: Partial<DeliveryPerson> }) =>
    await updatePersonnelAPI(userId, data)
);

export const addPersonnel = createAsyncThunk(
  'deliveryAdmin/addPersonnel',
  async (data: DeliveryPerson) => await addPersonnelAPI(data)
);

export const removePersonnel = createAsyncThunk(
  'deliveryAdmin/removePersonnel',
  async (userId: string) => await removePersonnelAPI(userId)
);

// ─── Slice ──────────────────────────────────────────────────

const deliveryAdminSlice = createSlice({
  name: 'deliveryAdmin',
  initialState,
  reducers: {
    setActiveTab(state, action: PayloadAction<DeliveryTabKey>) {
      state.activeTab = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<StatusFilter>) {
      state.statusFilter = action.payload;
    },
    setDeliverySearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    clearDeliveryError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── Fetch Deliveries
    builder
      .addCase(fetchDeliveries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDeliveries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.deliveries = action.payload;
      })
      .addCase(fetchDeliveries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch deliveries';
      });

    // ── Fetch Personnel
    builder
      .addCase(fetchPersonnel.pending, (state) => { state.isLoading = true; })
      .addCase(fetchPersonnel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.personnel = action.payload;
      })
      .addCase(fetchPersonnel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch personnel';
      });

    // ── Create Delivery
    builder.addCase(createDelivery.fulfilled, (state, action) => {
      state.deliveries.unshift(action.payload);
    });

    // ── Update Delivery
    builder.addCase(updateDelivery.fulfilled, (state, action) => {
      const idx = state.deliveries.findIndex(
        (d) => d.deliveryId === action.payload.deliveryId
      );
      if (idx !== -1) state.deliveries[idx] = action.payload;
    });

    // ── Assign (single)
    builder
      .addCase(assignDelivery.pending, (state) => { state.isAssigning = true; })
      .addCase(assignDelivery.fulfilled, (state, action) => {
        state.isAssigning = false;
        const idx = state.deliveries.findIndex(
          (d) => d.deliveryId === action.payload.deliveryId
        );
        if (idx !== -1) state.deliveries[idx] = action.payload;
      })
      .addCase(assignDelivery.rejected, (state, action) => {
        state.isAssigning = false;
        state.error = action.error.message || 'Assignment failed';
      });

    // ── Batch assign
    builder
      .addCase(batchAssignDeliveries.pending, (state) => { state.isAssigning = true; })
      .addCase(batchAssignDeliveries.fulfilled, (state, action) => {
        state.isAssigning = false;
        for (const updated of action.payload) {
          const idx = state.deliveries.findIndex(
            (d) => d.deliveryId === updated.deliveryId
          );
          if (idx !== -1) state.deliveries[idx] = updated;
        }
      })
      .addCase(batchAssignDeliveries.rejected, (state, action) => {
        state.isAssigning = false;
        state.error = action.error.message || 'Batch assignment failed';
      });

    // ── Auto assign
    builder
      .addCase(autoAssignDeliveries.pending, (state) => { state.isAssigning = true; })
      .addCase(autoAssignDeliveries.fulfilled, (state, action) => {
        state.isAssigning = false;
        for (const updated of action.payload) {
          const idx = state.deliveries.findIndex(
            (d) => d.deliveryId === updated.deliveryId
          );
          if (idx !== -1) state.deliveries[idx] = updated;
        }
      })
      .addCase(autoAssignDeliveries.rejected, (state, action) => {
        state.isAssigning = false;
        state.error = action.error.message || 'Auto-assignment failed';
      });

    // ── Update Personnel
    builder.addCase(updatePersonnel.fulfilled, (state, action) => {
      const idx = state.personnel.findIndex((p) => p.userId === action.payload.userId);
      if (idx !== -1) state.personnel[idx] = action.payload;
    });

    // ── Add Personnel
    builder.addCase(addPersonnel.fulfilled, (state, action) => {
      state.personnel.push(action.payload);
    });

    // ── Remove Personnel
    builder.addCase(removePersonnel.fulfilled, (state, action) => {
      state.personnel = state.personnel.filter((p) => p.userId !== action.payload);
    });
  },
});

export const {
  setActiveTab,
  setStatusFilter,
  setDeliverySearch,
  clearDeliveryError,
} = deliveryAdminSlice.actions;

export default deliveryAdminSlice.reducer;
