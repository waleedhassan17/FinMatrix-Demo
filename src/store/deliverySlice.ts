// ============================================================
// FINMATRIX - Unified Delivery Slice  (Single Source of Truth)
// ============================================================
// Both admin and delivery personnel read/write from this ONE slice.
// No backend — pure Redux state sharing drives "real-time" behavior.
//
// State shape:
//   deliveries[]               – ALL deliveries across all statuses
//   deliveryPersonnel[]        – ALL delivery staff
//   shadowInventory            – { [personId]: ShadowItem[] }
//   inventoryUpdateRequests[]  – Pending / approved / rejected
//   notifications              – { admin: N[], [personId]: N[] }
//   UI bookkeeping (activeTab, filters, active delivery, signature, etc.)
// ============================================================

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Delivery, DeliveryStatus, DeliveryPriority } from '../dummy-data/deliveries';
import { DeliveryPerson } from '../dummy-data/deliveryPersonnel';
import {
  ShadowInventoryItem,
  ShadowInventoryChange,
} from '../dummy-data/shadowInventory';
import {
  InventoryUpdateRequest,
  InventoryChangeItem,
} from '../dummy-data/inventoryUpdateRequests';
import { updateInventoryItem } from '../screens/Inventory/inventorySlice';
import type { AppDispatch } from './store';

// ─── Re-export types used by screens ────────────────────────
export interface SignaturePoint { x: number; y: number }
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

export type DeliveryTabKey = 'assign' | 'monitor' | 'approvals';
export type StatusFilter = 'all' | DeliveryStatus;
export type ApprovalFilterKey = 'pending' | 'approved' | 'rejected' | 'all';

export interface DeliveryNotification {
  id: string;
  title: string;
  body: string;
  type: 'assignment' | 'status_update' | 'inventory_approval' | 'general';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// ─── State ──────────────────────────────────────────────────
interface DeliveryState {
  // Core data
  deliveries: Delivery[];
  deliveryPersonnel: DeliveryPerson[];
  shadowInventory: Record<string, ShadowInventoryItem[]>;
  inventoryUpdateRequests: InventoryUpdateRequest[];
  notifications: Record<string, DeliveryNotification[]>; // 'admin' | personId

  // Admin UI
  activeTab: DeliveryTabKey;
  statusFilter: StatusFilter;
  searchQuery: string;
  approvalFilter: ApprovalFilterKey;

  // Personnel UI
  activeDelivery: Delivery | null;
  currentSignature: SignaturePath;
  itemConfirmations: DeliveryItemConfirmation[];
  deliveryPhotoUrls: string[];

  // Loading flags
  isLoading: boolean;
  isAssigning: boolean;
  isUpdating: boolean;
  isProcessing: boolean;
  error: string | null;
}

// ─── Seed data imports ──────────────────────────────────────
import { deliveries as seedDeliveries } from '../dummy-data/deliveries';
import { deliveryPersonnel as seedPersonnel } from '../dummy-data/deliveryPersonnel';
import { shadowInventory as seedShadow } from '../dummy-data/shadowInventory';
import { inventoryUpdateRequests as seedRequests } from '../dummy-data/inventoryUpdateRequests';

// Build shadow inventory map from seed
const buildShadowMap = (items: ShadowInventoryItem[]): Record<string, ShadowInventoryItem[]> => {
  const map: Record<string, ShadowInventoryItem[]> = {};
  for (const item of items) {
    if (!map[item.deliveryPersonId]) map[item.deliveryPersonId] = [];
    map[item.deliveryPersonId].push(item);
  }
  return map;
};

const initialState: DeliveryState = {
  deliveries: [...seedDeliveries],
  deliveryPersonnel: [...seedPersonnel],
  shadowInventory: buildShadowMap(seedShadow),
  inventoryUpdateRequests: [...seedRequests],
  notifications: {
    admin: [],
  },

  activeTab: 'assign',
  statusFilter: 'all',
  searchQuery: '',
  approvalFilter: 'pending',

  activeDelivery: null,
  currentSignature: [],
  itemConfirmations: [],
  deliveryPhotoUrls: [],

  isLoading: false,
  isAssigning: false,
  isUpdating: false,
  isProcessing: false,
  error: null,
};

// ─── Helper: notification factory ───────────────────────────
const makeNotif = (
  title: string,
  body: string,
  type: DeliveryNotification['type'],
  data?: Record<string, any>,
): DeliveryNotification => ({
  id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
  title,
  body,
  type,
  data,
  isRead: false,
  createdAt: new Date().toISOString(),
});

// ─── Slice ──────────────────────────────────────────────────
const deliverySlice = createSlice({
  name: 'delivery',
  initialState,
  reducers: {
    // ============ ADMIN ACTIONS ============

    setActiveTab(state, action: PayloadAction<DeliveryTabKey>) {
      state.activeTab = action.payload;
    },
    setStatusFilter(state, action: PayloadAction<StatusFilter>) {
      state.statusFilter = action.payload;
    },
    setDeliverySearch(state, action: PayloadAction<string>) {
      state.searchQuery = action.payload;
    },
    setApprovalFilter(state, action: PayloadAction<ApprovalFilterKey>) {
      state.approvalFilter = action.payload;
    },

    /** Admin creates a new delivery → status = "unassigned" */
    createDelivery(state, action: PayloadAction<Omit<Delivery, 'deliveryId'>>) {
      const del: Delivery = { ...action.payload, deliveryId: `del_${Date.now()}` };
      state.deliveries.unshift(del);
    },

    /** Admin assigns deliveries to a person */
    assignDeliveries(
      state,
      action: PayloadAction<{ deliveryIds: string[]; deliveryPersonId: string }>,
    ) {
      const { deliveryIds, deliveryPersonId } = action.payload;
      const person = state.deliveryPersonnel.find((p) => p.userId === deliveryPersonId);
      if (!person) return;

      const assignedDeliveries: Delivery[] = [];

      for (const did of deliveryIds) {
        const idx = state.deliveries.findIndex((d) => d.deliveryId === did);
        if (idx === -1) continue;
        const assignmentId = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        state.deliveries[idx] = {
          ...state.deliveries[idx],
          assignmentId,
          status: 'pending',
          deliveryPersonId: person.userId,
          deliveryPersonName: person.displayName,
        };
        assignedDeliveries.push(state.deliveries[idx]);

        // Create shadow inventory items for this delivery's items
        if (!state.shadowInventory[deliveryPersonId]) {
          state.shadowInventory[deliveryPersonId] = [];
        }
        for (const item of state.deliveries[idx].items) {
          const existing = state.shadowInventory[deliveryPersonId].find(
            (s) => s.itemId === item.itemId,
          );
          if (!existing) {
            state.shadowInventory[deliveryPersonId].push({
              shadowId: `shd_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
              companyId: state.deliveries[idx].companyId,
              deliveryPersonId,
              itemId: item.itemId,
              itemName: item.itemName,
              originalQuantity: item.quantity * 2, // mock: pretend warehouse had double
              currentQuantity: item.quantity * 2 - item.quantity,
              changes: [{
                changeId: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                deliveryId: did,
                deliveryCustomer: state.deliveries[idx].customerName,
                quantityChanged: -item.quantity,
                timestamp: new Date().toISOString(),
              }],
              status: 'synced',
            });
          }
        }
      }

      // Increment person's load
      const pIdx = state.deliveryPersonnel.findIndex((p) => p.userId === deliveryPersonId);
      if (pIdx !== -1) {
        state.deliveryPersonnel[pIdx].currentLoad += deliveryIds.length;
      }

      // Notification → delivery person
      const notif = makeNotif(
        'New Deliveries Assigned',
        `${deliveryIds.length} new ${deliveryIds.length === 1 ? 'delivery' : 'deliveries'} assigned to you.`,
        'assignment',
        { deliveryIds, assignedBy: 'admin' },
      );
      if (!state.notifications[deliveryPersonId]) state.notifications[deliveryPersonId] = [];
      state.notifications[deliveryPersonId].push(notif);
    },

    /** Auto-assign unassigned deliveries by round-robin across available personnel */
    autoAssignDeliveries(state, action: PayloadAction<string[]>) {
      const deliveryIds = action.payload;
      const available = state.deliveryPersonnel
        .filter((p) => p.isAvailable && p.currentLoad < p.maxLoad)
        .sort((a, b) => a.currentLoad - b.currentLoad);

      if (available.length === 0) return;

      let pIdx = 0;
      for (const did of deliveryIds) {
        const person = available[pIdx % available.length];
        const dIdx = state.deliveries.findIndex((d) => d.deliveryId === did);
        if (dIdx === -1) continue;

        const assignmentId = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        state.deliveries[dIdx] = {
          ...state.deliveries[dIdx],
          assignmentId,
          status: 'pending',
          deliveryPersonId: person.userId,
          deliveryPersonName: person.displayName,
        };

        // Increment load in the available array view
        const personMainIdx = state.deliveryPersonnel.findIndex((p) => p.userId === person.userId);
        if (personMainIdx !== -1) {
          state.deliveryPersonnel[personMainIdx].currentLoad += 1;
          // Also update our local sorted copy so round-robin works
          available[pIdx % available.length] = state.deliveryPersonnel[personMainIdx];
        }

        // Shadow inventory
        if (!state.shadowInventory[person.userId]) state.shadowInventory[person.userId] = [];
        for (const item of state.deliveries[dIdx].items) {
          const existing = state.shadowInventory[person.userId].find((s) => s.itemId === item.itemId);
          if (!existing) {
            state.shadowInventory[person.userId].push({
              shadowId: `shd_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
              companyId: state.deliveries[dIdx].companyId,
              deliveryPersonId: person.userId,
              itemId: item.itemId,
              itemName: item.itemName,
              originalQuantity: item.quantity * 2,
              currentQuantity: item.quantity * 2 - item.quantity,
              changes: [{
                changeId: `chg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
                deliveryId: did,
                deliveryCustomer: state.deliveries[dIdx].customerName,
                quantityChanged: -item.quantity,
                timestamp: new Date().toISOString(),
              }],
              status: 'synced',
            });
          }
        }

        // Notification → person
        if (!state.notifications[person.userId]) state.notifications[person.userId] = [];
        state.notifications[person.userId].push(
          makeNotif(
            'New Delivery Assigned',
            `A new delivery has been assigned to you.`,
            'assignment',
            { deliveryId: did },
          ),
        );

        pIdx++;
      }
    },

    // ============ DELIVERY PERSON ACTIONS ============

    /** Update delivery status (pick up → in transit → arrived → etc.) */
    updateDeliveryStatus(
      state,
      action: PayloadAction<{ deliveryId: string; status: DeliveryStatus; timestamp?: string }>,
    ) {
      const { deliveryId, status, timestamp } = action.payload;
      const idx = state.deliveries.findIndex((d) => d.deliveryId === deliveryId);
      if (idx === -1) return;
      state.deliveries[idx].status = status;

      // Also update active delivery if it matches
      if (state.activeDelivery?.deliveryId === deliveryId) {
        state.activeDelivery = { ...state.deliveries[idx] };
      }

      // Notification → admin
      const personName = state.deliveries[idx].deliveryPersonName || 'Delivery person';
      state.notifications.admin.push(
        makeNotif(
          'Delivery Status Updated',
          `${personName} updated delivery ${deliveryId} to "${status}".`,
          'status_update',
          { deliveryId, status },
        ),
      );
    },

    /** Capture customer signature */
    captureSignature(
      state,
      action: PayloadAction<{ deliveryId: string; signatureData: string }>,
    ) {
      const { deliveryId, signatureData } = action.payload;
      const idx = state.deliveries.findIndex((d) => d.deliveryId === deliveryId);
      if (idx === -1) return;
      state.deliveries[idx].signatureUrl = signatureData;
      state.deliveries[idx].signedAt = new Date().toISOString();
      if (state.activeDelivery?.deliveryId === deliveryId) {
        state.activeDelivery = { ...state.deliveries[idx] };
      }
    },

    /** Confirm delivery (final step — marks delivered, auto-creates InventoryUpdateRequest) */
    confirmDelivery(
      state,
      action: PayloadAction<{ deliveryId: string; customerVerified: boolean }>,
    ) {
      const { deliveryId, customerVerified } = action.payload;
      const idx = state.deliveries.findIndex((d) => d.deliveryId === deliveryId);
      if (idx === -1) return;

      const now = new Date().toISOString();
      state.deliveries[idx].status = 'delivered';
      state.deliveries[idx].customerVerified = customerVerified;
      state.deliveries[idx].customerVerifiedAt = now;
      state.deliveries[idx].deliveredAt = now;

      if (state.activeDelivery?.deliveryId === deliveryId) {
        state.activeDelivery = { ...state.deliveries[idx] };
      }

      // Auto-create InventoryUpdateRequest
      const del = state.deliveries[idx];
      const changes: InventoryChangeItem[] = del.items.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantityBefore: item.quantity * 2,
        quantityDelivered: item.quantity,
        quantityReturned: 0,
        quantityAfter: item.quantity,
      }));
      const request: InventoryUpdateRequest = {
        requestId: `iur_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        companyId: del.companyId,
        deliveryId,
        deliveryPersonId: del.deliveryPersonId || '',
        deliveryPersonName: del.deliveryPersonName || '',
        customerName: del.customerName,
        changes,
        status: 'pending',
        adminNotes: null,
        reviewedBy: null,
        reviewedAt: null,
        createdAt: now,
      };
      state.inventoryUpdateRequests.unshift(request);

      // Notification → admin
      state.notifications.admin.push(
        makeNotif(
          'Inventory Update Pending',
          `Inventory update pending from ${del.deliveryPersonName || 'delivery person'} for delivery to ${del.customerName}.`,
          'inventory_approval',
          { deliveryId, requestId: request.requestId },
        ),
      );

      // Decrement person's load
      if (del.deliveryPersonId) {
        const pIdx = state.deliveryPersonnel.findIndex((p) => p.userId === del.deliveryPersonId);
        if (pIdx !== -1 && state.deliveryPersonnel[pIdx].currentLoad > 0) {
          state.deliveryPersonnel[pIdx].currentLoad -= 1;
          state.deliveryPersonnel[pIdx].totalDeliveries += 1;
        }
      }
    },

    /** Submit shadow inventory changes for admin review */
    submitShadowInventoryUpdate(
      state,
      action: PayloadAction<{ deliveryPersonId: string; shadowIds: string[] }>,
    ) {
      const { deliveryPersonId, shadowIds } = action.payload;
      const items = state.shadowInventory[deliveryPersonId];
      if (!items) return;

      for (const sid of shadowIds) {
        const idx = items.findIndex((s) => s.shadowId === sid);
        if (idx === -1) continue;
        items[idx].status = 'pending';

        // Create inventory update request for each
        const item = items[idx];
        const request: InventoryUpdateRequest = {
          requestId: `iur_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          companyId: item.companyId,
          deliveryId: item.changes[0]?.deliveryId || 'manual',
          deliveryPersonId,
          deliveryPersonName:
            state.deliveryPersonnel.find((p) => p.userId === deliveryPersonId)?.displayName || '',
          customerName: item.changes[0]?.deliveryCustomer || '',
          changes: [{
            itemId: item.itemId,
            itemName: item.itemName,
            quantityBefore: item.originalQuantity,
            quantityDelivered: item.originalQuantity - item.currentQuantity,
            quantityReturned: 0,
            quantityAfter: item.currentQuantity,
          }],
          status: 'pending',
          adminNotes: null,
          reviewedBy: null,
          reviewedAt: null,
          createdAt: new Date().toISOString(),
        };
        state.inventoryUpdateRequests.unshift(request);
      }

      // Notification → admin
      const personName =
        state.deliveryPersonnel.find((p) => p.userId === deliveryPersonId)?.displayName || 'Delivery person';
      state.notifications.admin.push(
        makeNotif(
          'Shadow Inventory Update Submitted',
          `${personName} submitted ${shadowIds.length} inventory update(s) for review.`,
          'inventory_approval',
          { deliveryPersonId, shadowIds },
        ),
      );
    },

    // ============ ADMIN APPROVAL ACTIONS ============

    /** Approve an inventory update request */
    approveInventoryUpdate(
      state,
      action: PayloadAction<{ requestId: string; adminNotes?: string }>,
    ) {
      const { requestId, adminNotes } = action.payload;
      const idx = state.inventoryUpdateRequests.findIndex((r) => r.requestId === requestId);
      if (idx === -1) return;

      const now = new Date().toISOString();
      state.inventoryUpdateRequests[idx].status = 'approved';
      state.inventoryUpdateRequests[idx].reviewedBy = 'admin';
      state.inventoryUpdateRequests[idx].reviewedAt = now;
      if (adminNotes) state.inventoryUpdateRequests[idx].adminNotes = adminNotes;

      // Update shadow inventory items to 'synced'
      const req = state.inventoryUpdateRequests[idx];
      const personShadow = state.shadowInventory[req.deliveryPersonId];
      if (personShadow) {
        for (const change of req.changes) {
          const sIdx = personShadow.findIndex((s) => s.itemId === change.itemId);
          if (sIdx !== -1) personShadow[sIdx].status = 'synced';
        }
      }

      // Notification → delivery person
      if (req.deliveryPersonId) {
        if (!state.notifications[req.deliveryPersonId]) state.notifications[req.deliveryPersonId] = [];
        state.notifications[req.deliveryPersonId].push(
          makeNotif(
            'Inventory Update Approved',
            `Your inventory update for delivery to ${req.customerName} has been approved.`,
            'inventory_approval',
            { requestId, deliveryId: req.deliveryId, status: 'approved' },
          ),
        );
      }
    },

    /** Reject an inventory update request */
    rejectInventoryUpdate(
      state,
      action: PayloadAction<{ requestId: string; adminNotes: string }>,
    ) {
      const { requestId, adminNotes } = action.payload;
      const idx = state.inventoryUpdateRequests.findIndex((r) => r.requestId === requestId);
      if (idx === -1) return;

      const now = new Date().toISOString();
      state.inventoryUpdateRequests[idx].status = 'rejected';
      state.inventoryUpdateRequests[idx].reviewedBy = 'admin';
      state.inventoryUpdateRequests[idx].reviewedAt = now;
      state.inventoryUpdateRequests[idx].adminNotes = adminNotes;

      // Update shadow inventory items to 'rejected'
      const req = state.inventoryUpdateRequests[idx];
      const personShadow = state.shadowInventory[req.deliveryPersonId];
      if (personShadow) {
        for (const change of req.changes) {
          const sIdx = personShadow.findIndex((s) => s.itemId === change.itemId);
          if (sIdx !== -1) personShadow[sIdx].status = 'rejected';
        }
      }

      // Notification → delivery person
      if (req.deliveryPersonId) {
        if (!state.notifications[req.deliveryPersonId]) state.notifications[req.deliveryPersonId] = [];
        state.notifications[req.deliveryPersonId].push(
          makeNotif(
            'Inventory Update Rejected',
            `Your inventory update was rejected: ${adminNotes}`,
            'inventory_approval',
            { requestId, deliveryId: req.deliveryId, status: 'rejected', reason: adminNotes },
          ),
        );
      }
    },

    // ============ PERSONNEL MANAGEMENT ============

    addPersonnel(state, action: PayloadAction<DeliveryPerson>) {
      state.deliveryPersonnel.push(action.payload);
    },
    updatePersonnel(
      state,
      action: PayloadAction<{ userId: string; data: Partial<DeliveryPerson> }>,
    ) {
      const { userId, data } = action.payload;
      const idx = state.deliveryPersonnel.findIndex((p) => p.userId === userId);
      if (idx !== -1) {
        state.deliveryPersonnel[idx] = { ...state.deliveryPersonnel[idx], ...data };
      }
    },
    removePersonnel(state, action: PayloadAction<string>) {
      state.deliveryPersonnel = state.deliveryPersonnel.filter(
        (p) => p.userId !== action.payload,
      );
    },

    // ============ NOTIFICATION ACTIONS ============

    markNotificationRead(
      state,
      action: PayloadAction<{ recipientId: string; notificationId: string }>,
    ) {
      const { recipientId, notificationId } = action.payload;
      const list = state.notifications[recipientId];
      if (!list) return;
      const idx = list.findIndex((n) => n.id === notificationId);
      if (idx !== -1) list[idx].isRead = true;
    },

    // ============ PERSONNEL UI ACTIONS ============

    setActiveDelivery(state, action: PayloadAction<Delivery | null>) {
      state.activeDelivery = action.payload;
    },
    setCurrentSignature(state, action: PayloadAction<SignaturePath>) {
      state.currentSignature = action.payload;
    },
    clearSignature(state) {
      state.currentSignature = [];
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
    clearDeliveryError(state) {
      state.error = null;
    },
  },
});

// ─── Thunk: approve with cross-slice real inventory update ──
export const approveAndSyncInventory = createAsyncThunk<
  void,
  { requestId: string; adminNotes?: string },
  { dispatch: AppDispatch }
>(
  'delivery/approveAndSync',
  async ({ requestId, adminNotes }, { dispatch, getState }) => {
    // First approve in our slice
    dispatch(approveInventoryUpdate({ requestId, adminNotes }));

    // Then sync to real inventory
    const state = (getState() as any).delivery as DeliveryState;
    const req = state.inventoryUpdateRequests.find((r) => r.requestId === requestId);
    if (req) {
      for (const change of req.changes) {
        await dispatch(
          updateInventoryItem({
            id: change.itemId,
            data: { quantityOnHand: change.quantityAfter },
          }),
        ).unwrap();
      }
    }
  },
);

// ─── Export actions ─────────────────────────────────────────
export const {
  setActiveTab,
  setStatusFilter,
  setDeliverySearch,
  setApprovalFilter,
  createDelivery,
  assignDeliveries,
  autoAssignDeliveries,
  updateDeliveryStatus,
  captureSignature,
  confirmDelivery,
  submitShadowInventoryUpdate,
  approveInventoryUpdate,
  rejectInventoryUpdate,
  addPersonnel,
  updatePersonnel,
  removePersonnel,
  markNotificationRead,
  setActiveDelivery,
  setCurrentSignature,
  clearSignature,
  setItemConfirmations,
  setDeliveryPhotoUrls,
  clearItemConfirmations,
  clearDeliveryError,
} = deliverySlice.actions;

// ─── Selectors ──────────────────────────────────────────────
export const selectAllDeliveries = (state: { delivery: DeliveryState }) =>
  state.delivery.deliveries;

export const selectDeliveriesForPerson = (personId: string) =>
  (state: { delivery: DeliveryState }) =>
    state.delivery.deliveries.filter((d) => d.deliveryPersonId === personId);

export const selectUnassignedDeliveries = (state: { delivery: DeliveryState }) =>
  state.delivery.deliveries.filter((d) => d.status === 'unassigned');

export const selectPendingApprovals = (state: { delivery: DeliveryState }) =>
  state.delivery.inventoryUpdateRequests.filter((r) => r.status === 'pending');

export const selectAdminNotifications = (state: { delivery: DeliveryState }) =>
  state.delivery.notifications.admin || [];

export const selectPersonnelNotifications = (personId: string) =>
  (state: { delivery: DeliveryState }) =>
    state.delivery.notifications[personId] || [];

export const selectPersonnel = (state: { delivery: DeliveryState }) =>
  state.delivery.deliveryPersonnel;

export const selectShadowInventory = (personId: string) =>
  (state: { delivery: DeliveryState }) =>
    state.delivery.shadowInventory[personId] || [];

export default deliverySlice.reducer;
