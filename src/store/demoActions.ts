// ============================================================
// FINMATRIX - Demo Actions (Simulation Helpers)
// ============================================================
// Thunks used by DemoToolbar to simulate real-time delivery
// events without manually going through each UI step.
// ============================================================

import { createAsyncThunk } from '@reduxjs/toolkit';
import type { RootState, AppDispatch } from './store';
import {
  updateDeliveryStatus,
  confirmDelivery,
  assignDeliveries,
  approveInventoryUpdate,
  rejectInventoryUpdate,
} from './deliverySlice';
import { applyDeliveryChanges } from '../screens/Inventory/inventorySlice';
import { addAuditEntry } from '../screens/AuditTrail/auditTrailSlice';
import type { AuditEntry } from '../dummy-data/auditTrail';
import { addRealtimeNotification } from '../screens/Notifications/notificationSlice';
import type { AppNotification } from '../dummy-data/notifications';

// ─── Helpers ────────────────────────────────────────────────
const uid = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

const makeGlobalNotif = (
  title: string,
  body: string,
  type: AppNotification['type'],
  data?: Record<string, any> | null,
): AppNotification => ({
  id: `notif_demo_${uid()}`,
  recipientId: 'admin',
  title,
  body,
  type,
  data: data ?? null,
  isRead: false,
  createdAt: new Date().toISOString(),
});

// ─── 1. Simulate Delivery Completion ────────────────────────
// Finds a random in_transit delivery, runs it through the full
// status chain (picked_up → in_transit already → arrived →
// delivered) then creates an InventoryUpdateRequest via
// confirmDelivery.
export const simulateDeliveryCompletion = createAsyncThunk<
  string, // returns deliveryId or message
  void,
  { state: RootState; dispatch: AppDispatch }
>('demo/simulateDeliveryCompletion', async (_, { getState, dispatch }) => {
  const state = getState();
  // Prefer in_transit, fall back to picked_up, then pending
  let candidates = state.delivery.deliveries.filter((d) => d.status === 'in_transit');
  if (candidates.length === 0) {
    candidates = state.delivery.deliveries.filter((d) => d.status === 'picked_up');
  }
  if (candidates.length === 0) {
    candidates = state.delivery.deliveries.filter((d) => d.status === 'pending');
  }
  if (candidates.length === 0) {
    return 'No eligible deliveries to complete.';
  }

  const del = candidates[Math.floor(Math.random() * candidates.length)];
  const now = new Date().toISOString();

  // Walk through statuses that haven't been reached yet
  const chain: Array<'picked_up' | 'in_transit' | 'arrived'> = ['picked_up', 'in_transit', 'arrived'];
  const statusOrder = ['unassigned', 'pending', 'picked_up', 'in_transit', 'arrived', 'delivered'];
  const currentIdx = statusOrder.indexOf(del.status);

  for (const s of chain) {
    if (statusOrder.indexOf(s) > currentIdx) {
      dispatch(updateDeliveryStatus({ deliveryId: del.deliveryId, status: s, timestamp: now }));
    }
  }

  // Final: confirm delivery (marks delivered + creates InventoryUpdateRequest)
  dispatch(confirmDelivery({ deliveryId: del.deliveryId, customerVerified: true }));

  // Global notification
  dispatch(
    addRealtimeNotification(
      makeGlobalNotif(
        'Delivery Completed (Simulated)',
        `${del.deliveryPersonName || 'Driver'} completed delivery to ${del.customerName}.`,
        'delivery_update',
        { deliveryId: del.deliveryId },
      ),
    ),
  );

  return del.deliveryId;
});

// ─── 2. Simulate New Assignment ─────────────────────────────
// Creates 3 pseudo-deliveries from unassigned pool and assigns
// to the person with the lowest load.
export const simulateNewAssignment = createAsyncThunk<
  string,
  void,
  { state: RootState; dispatch: AppDispatch }
>('demo/simulateNewAssignment', async (_, { getState, dispatch }) => {
  const state = getState();
  const unassigned = state.delivery.deliveries.filter((d) => d.status === 'unassigned');
  if (unassigned.length === 0) {
    return 'No unassigned deliveries available.';
  }

  // Pick person with lowest current load (active only)
  const available = [...state.delivery.deliveryPersonnel]
    .filter((p) => p.isAvailable && p.status === 'active' && p.currentLoad < p.maxLoad)
    .sort((a, b) => a.currentLoad - b.currentLoad);

  if (available.length === 0) {
    return 'No available delivery personnel.';
  }

  const person = available[0];
  const toAssign = unassigned.slice(0, Math.min(3, unassigned.length));
  const ids = toAssign.map((d) => d.deliveryId);

  dispatch(assignDeliveries({ deliveryIds: ids, deliveryPersonId: person.userId }));

  // Global notification
  dispatch(
    addRealtimeNotification(
      makeGlobalNotif(
        'Deliveries Assigned (Simulated)',
        `${ids.length} deliveries assigned to ${person.displayName}.`,
        'delivery_update',
        { deliveryIds: ids, personId: person.userId },
      ),
    ),
  );

  return `Assigned ${ids.length} deliveries to ${person.displayName}`;
});

// ─── 3. Simulate Approval ───────────────────────────────────
// Approves the oldest pending InventoryUpdateRequest and applies
// changes to real inventory + audit trail.
export const simulateApproval = createAsyncThunk<
  string,
  void,
  { state: RootState; dispatch: AppDispatch }
>('demo/simulateApproval', async (_, { getState, dispatch }) => {
  const state = getState();
  const pending = state.delivery.inventoryUpdateRequests.filter((r) => r.status === 'pending');
  if (pending.length === 0) {
    return 'No pending approval requests.';
  }

  // Oldest = last in array (newest are unshift'd to front)
  const req = pending[pending.length - 1];

  // 1. Approve in delivery slice
  dispatch(approveInventoryUpdate({ requestId: req.requestId }));

  // 2. Apply to real inventory
  dispatch(
    applyDeliveryChanges({
      changes: req.changes.map((c) => ({
        itemId: c.itemId,
        quantityDelivered: c.quantityDelivered,
        quantityReturned: c.quantityReturned,
      })),
    }),
  );

  // 3. Audit trail
  const entry: AuditEntry = {
    id: `aud_demo_${uid()}`,
    userId: 'admin',
    userName: 'Admin (Demo)',
    action: 'update',
    module: 'delivery',
    recordId: req.requestId,
    description: `[Demo] Approved inventory update for delivery ${req.deliveryId} (${req.customerName}).`,
    oldValue: null,
    newValue: null,
    timestamp: new Date().toISOString(),
  };
  dispatch(addAuditEntry(entry));

  // 4. Global notification
  dispatch(
    addRealtimeNotification(
      makeGlobalNotif(
        'Approval Processed (Simulated)',
        `Inventory update for ${req.customerName} approved. Real inventory updated.`,
        'inventory_approval',
        { requestId: req.requestId },
      ),
    ),
  );

  return `Approved request ${req.requestId} for ${req.customerName}`;
});

// ─── 4. Simulate Rejection ──────────────────────────────────
// Rejects the oldest pending request with a standard note.
export const simulateRejection = createAsyncThunk<
  string,
  void,
  { state: RootState; dispatch: AppDispatch }
>('demo/simulateRejection', async (_, { getState, dispatch }) => {
  const state = getState();
  const pending = state.delivery.inventoryUpdateRequests.filter((r) => r.status === 'pending');
  if (pending.length === 0) {
    return 'No pending requests to reject.';
  }

  const req = pending[pending.length - 1];

  dispatch(
    rejectInventoryUpdate({
      requestId: req.requestId,
      adminNotes: 'Quantity discrepancy',
    }),
  );

  // Audit trail
  const entry: AuditEntry = {
    id: `aud_demo_${uid()}`,
    userId: 'admin',
    userName: 'Admin (Demo)',
    action: 'update',
    module: 'delivery',
    recordId: req.requestId,
    description: `[Demo] Rejected inventory update for delivery ${req.deliveryId}. Reason: Quantity discrepancy`,
    oldValue: null,
    newValue: null,
    timestamp: new Date().toISOString(),
  };
  dispatch(addAuditEntry(entry));

  dispatch(
    addRealtimeNotification(
      makeGlobalNotif(
        'Request Rejected (Simulated)',
        `Inventory update for ${req.customerName} rejected: Quantity discrepancy.`,
        'inventory_approval',
        { requestId: req.requestId },
      ),
    ),
  );

  return `Rejected request ${req.requestId}`;
});
