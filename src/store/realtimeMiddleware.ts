// ============================================================
// FINMATRIX - Real-Time Simulation Middleware
// ============================================================
// The unified deliverySlice already generates cross-role
// notifications inside its reducers. This middleware handles
// any remaining edge cases — for example, bridging delivery
// slice notifications into the global notifications slice so
// they appear in the app-wide notification bell.
// ============================================================
import { Middleware } from '@reduxjs/toolkit';

/** Unique-ish ID generator for notifications */
const nid = () => 'notif_rt_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);

const now = () => new Date().toISOString();

// ── Middleware ───────────────────────────────────────────────
export const realtimeMiddleware: Middleware = (storeApi) => (next) => (action: any) => {
  const result = next(action);

  const type: string = action?.type ?? '';

  // ── Delivery assigned → push global notification ───────
  if (type === 'delivery/assignDeliveries' || type === 'delivery/autoAssignDeliveries') {
    const deliveryPersonId =
      action.payload?.deliveryPersonId ?? action.payload?.[0] ?? 'delivery';
    const count =
      type === 'delivery/assignDeliveries'
        ? action.payload?.deliveryIds?.length ?? 1
        : action.payload?.length ?? 0;

    storeApi.dispatch({
      type: 'notifications/addRealtimeNotification',
      payload: {
        id: nid(),
        recipientId: deliveryPersonId,
        title: 'New Deliveries Assigned',
        body: `${count} new ${count === 1 ? 'delivery' : 'deliveries'} assigned.`,
        type: 'delivery_update',
        data: { count, deliveryPersonId },
        isRead: false,
        createdAt: now(),
      },
    });
  }

  // ── Delivery status updated → push global notification ─
  if (type === 'delivery/updateDeliveryStatus') {
    const { deliveryId, status } = action.payload ?? {};
    storeApi.dispatch({
      type: 'notifications/addRealtimeNotification',
      payload: {
        id: nid(),
        recipientId: 'admin',
        title: 'Delivery Status Updated',
        body: `Delivery ${deliveryId} updated to "${status}".`,
        type: 'delivery_update',
        data: { deliveryId, status },
        isRead: false,
        createdAt: now(),
      },
    });
  }

  // ── Delivery confirmed → push global notification ──────
  if (type === 'delivery/confirmDelivery') {
    const { deliveryId } = action.payload ?? {};
    storeApi.dispatch({
      type: 'notifications/addRealtimeNotification',
      payload: {
        id: nid(),
        recipientId: 'admin',
        title: 'Delivery Confirmed',
        body: `Delivery ${deliveryId} has been confirmed and delivered.`,
        type: 'inventory_approval',
        data: { deliveryId },
        isRead: false,
        createdAt: now(),
      },
    });
  }

  // ── Inventory approval/rejection → push global notification
  if (type === 'delivery/approveInventoryUpdate' || type === 'delivery/rejectInventoryUpdate') {
    const { requestId } = action.payload ?? {};
    const state = storeApi.getState();
    const req = state.delivery?.inventoryUpdateRequests?.find(
      (r: any) => r.requestId === requestId,
    );
    const status = type.includes('approve') ? 'approved' : 'rejected';

    storeApi.dispatch({
      type: 'notifications/addRealtimeNotification',
      payload: {
        id: nid(),
        recipientId: req?.deliveryPersonId ?? 'delivery',
        title: `Inventory Update ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        body: `Your inventory update for ${req?.customerName ?? 'a delivery'} was ${status}.`,
        type: 'inventory_approval',
        data: { requestId, status },
        isRead: false,
        createdAt: now(),
      },
    });
  }

  return result;
};
