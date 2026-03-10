// ============================================================
// FINMATRIX - Delivery Personnel Redux Slice
// ============================================================
// State for the driver-facing delivery execution flow:
// myDeliveries[], activeDelivery, currentSignature

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Delivery, DeliveryStatus } from '../../../dummy-data/deliveries';
import {
  getMyDeliveriesAPI,
  updateDeliveryStatusAPI,
  saveSignatureAPI,
  confirmDeliveryAPI,
  createInventoryRequestAPI,
  getShadowInventoryAPI,
  submitShadowUpdatesAPI,
} from './deliveryPersonnelNetwork';
import { ShadowInventoryItem } from '../../../dummy-data/shadowInventory';

// ─── Types ──────────────────────────────────────────────────
export interface SignaturePoint {
  x: number;
  y: number;
}

export type SignaturePath = SignaturePoint[][];

export type ItemConfirmStatus = 'delivered' | 'damaged' | 'returned';

export interface DeliveryItemConfirmation {
  itemId: string;
  itemName: string;
  orderedQty: number;
  deliveredQty: number;
  status: ItemConfirmStatus;
  notes: string;
}

interface DeliveryPersonnelState {
  myDeliveries: Delivery[];
  activeDelivery: Delivery | null;
  currentSignature: SignaturePath;
  itemConfirmations: DeliveryItemConfirmation[];
  deliveryPhotoUrls: string[];
  shadowItems: ShadowInventoryItem[];
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

const initialState: DeliveryPersonnelState = {
  myDeliveries: [],
  activeDelivery: null,
  currentSignature: [],
  itemConfirmations: [],
  deliveryPhotoUrls: [],
  shadowItems: [],
  isLoading: false,
  isUpdating: false,
  error: null,
};

// ─── Thunks ─────────────────────────────────────────────────

export const fetchMyDeliveries = createAsyncThunk(
  'deliveryPersonnel/fetchMine',
  async (personId: string, { rejectWithValue }) => {
    try {
      return await getMyDeliveriesAPI(personId);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch deliveries');
    }
  },
);

export const advanceDeliveryStatus = createAsyncThunk(
  'deliveryPersonnel/advanceStatus',
  async (
    { deliveryId, status }: { deliveryId: string; status: DeliveryStatus },
    { rejectWithValue },
  ) => {
    try {
      return await updateDeliveryStatusAPI(deliveryId, status);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Status update failed');
    }
  },
);

export const captureSignature = createAsyncThunk(
  'deliveryPersonnel/captureSignature',
  async (
    { deliveryId, signatureData }: { deliveryId: string; signatureData: string },
    { rejectWithValue },
  ) => {
    try {
      return await saveSignatureAPI(deliveryId, signatureData);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to save signature');
    }
  },
);

export const confirmDelivery = createAsyncThunk(
  'deliveryPersonnel/confirmDelivery',
  async (deliveryId: string, { getState, rejectWithValue }) => {
    try {
      const confirmed = await confirmDeliveryAPI(deliveryId);
      // Auto-create inventory update request for admin approval
      await createInventoryRequestAPI(confirmed);
      return confirmed;
    } catch (e: any) {
      return rejectWithValue(e.message || 'Confirmation failed');
    }
  },
);

export const fetchShadowInventory = createAsyncThunk(
  'deliveryPersonnel/fetchShadow',
  async (personId: string, { rejectWithValue }) => {
    try {
      return await getShadowInventoryAPI(personId);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to fetch shadow inventory');
    }
  },
);

export const submitShadowUpdates = createAsyncThunk(
  'deliveryPersonnel/submitShadow',
  async (items: ShadowInventoryItem[], { rejectWithValue }) => {
    try {
      return await submitShadowUpdatesAPI(items);
    } catch (e: any) {
      return rejectWithValue(e.message || 'Failed to submit shadow updates');
    }
  },
);

// ─── Slice ──────────────────────────────────────────────────

const deliveryPersonnelSlice = createSlice({
  name: 'deliveryPersonnel',
  initialState,
  reducers: {
    setActiveDelivery(state, action: PayloadAction<Delivery | null>) {
      state.activeDelivery = action.payload;
    },
    setCurrentSignature(state, action: PayloadAction<SignaturePath>) {
      state.currentSignature = action.payload;
    },
    clearSignature(state) {
      state.currentSignature = [];
    },
    clearPersonnelError(state) {
      state.error = null;
    },
    setItemConfirmations(state, action: PayloadAction<DeliveryItemConfirmation[]>) {
      state.itemConfirmations = action.payload;
    },
    setDeliveryPhotoUrls(state, action: PayloadAction<string[]>) {
      state.deliveryPhotoUrls = action.payload;
    },
    clearItemConfirmations(state) {
      state.itemConfirmations = [];
      state.deliveryPhotoUrls = [];
    },
  },
  extraReducers: (builder) => {
    // ── Fetch my deliveries
    builder
      .addCase(fetchMyDeliveries.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyDeliveries.fulfilled, (state, action) => {
        state.isLoading = false;
        state.myDeliveries = action.payload;
      })
      .addCase(fetchMyDeliveries.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Advance status
    builder
      .addCase(advanceDeliveryStatus.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(advanceDeliveryStatus.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updated = action.payload;
        // Update in list
        const idx = state.myDeliveries.findIndex(
          (d) => d.deliveryId === updated.deliveryId,
        );
        if (idx !== -1) state.myDeliveries[idx] = updated;
        // Update active
        if (state.activeDelivery?.deliveryId === updated.deliveryId) {
          state.activeDelivery = updated;
        }
      })
      .addCase(advanceDeliveryStatus.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // ── Capture signature
    builder
      .addCase(captureSignature.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(captureSignature.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updated = action.payload;
        const idx = state.myDeliveries.findIndex(
          (d) => d.deliveryId === updated.deliveryId,
        );
        if (idx !== -1) state.myDeliveries[idx] = updated;
        if (state.activeDelivery?.deliveryId === updated.deliveryId) {
          state.activeDelivery = updated;
        }
      })
      .addCase(captureSignature.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // ── Confirm delivery
    builder
      .addCase(confirmDelivery.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(confirmDelivery.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updated = action.payload;
        const idx = state.myDeliveries.findIndex(
          (d) => d.deliveryId === updated.deliveryId,
        );
        if (idx !== -1) state.myDeliveries[idx] = updated;
        if (state.activeDelivery?.deliveryId === updated.deliveryId) {
          state.activeDelivery = updated;
        }
      })
      .addCase(confirmDelivery.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // ── Fetch shadow inventory
    builder
      .addCase(fetchShadowInventory.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchShadowInventory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.shadowItems = action.payload;
      })
      .addCase(fetchShadowInventory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // ── Submit shadow updates
    builder
      .addCase(submitShadowUpdates.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(submitShadowUpdates.fulfilled, (state, action) => {
        state.isUpdating = false;
        // Update statuses of submitted items to 'pending'
        for (const updated of action.payload) {
          const idx = state.shadowItems.findIndex((s) => s.shadowId === updated.shadowId);
          if (idx >= 0) state.shadowItems[idx] = updated;
        }
      })
      .addCase(submitShadowUpdates.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setActiveDelivery,
  setCurrentSignature,
  clearSignature,
  clearPersonnelError,
  setItemConfirmations,
  setDeliveryPhotoUrls,
  clearItemConfirmations,
} = deliveryPersonnelSlice.actions;

export default deliveryPersonnelSlice.reducer;
