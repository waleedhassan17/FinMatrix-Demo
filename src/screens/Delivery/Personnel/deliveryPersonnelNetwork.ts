// ============================================================
// FINMATRIX - Delivery Personnel Network Layer  (dummy API)
// ============================================================
import { dummyDelay as delay } from '../../../utils/dummyApiConfig';

// Re-uses the shared in-memory delivery store from admin network
// so mutations are visible across both roles.

import {
  Delivery,
  DeliveryStatus,
} from '../../../dummy-data/deliveries';
import {
  InventoryUpdateRequest,
  InventoryChangeItem,
} from '../../../dummy-data/inventoryUpdateRequests';
import {
  ShadowInventoryItem,
  shadowInventory,
} from '../../../dummy-data/shadowInventory';
import {
  getDeliveriesAPI,
  updateDeliveryAPI,
} from '../Admin/deliveryAdminNetwork';
import { requestStore } from '../Admin/inventoryApprovalNetwork';
import type { DeliveryItemConfirmation } from './deliveryPersonnelSlice';

// In-memory shadow store per driver
let shadowStore: ShadowInventoryItem[] = [...shadowInventory];

// ─── Fetch shadow inventory for a driver ────────────────────
export const getShadowInventoryAPI = async (
  personId: string,
): Promise<ShadowInventoryItem[]> => {
  await delay(250);
  return shadowStore.filter((s) => s.deliveryPersonId === personId);
};

// ─── Submit shadow items as inventory update requests ───────
export const submitShadowUpdatesAPI = async (
  items: ShadowInventoryItem[],
): Promise<ShadowInventoryItem[]> => {
  await delay(400);

  const updated: ShadowInventoryItem[] = [];
  for (const item of items) {
    // Build an InventoryUpdateRequest for each pending item
    const request: InventoryUpdateRequest = {
      requestId: `iur_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      companyId: item.companyId,
      deliveryId: item.changes[0]?.deliveryId || 'manual',
      deliveryPersonId: item.deliveryPersonId,
      deliveryPersonName: '',
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

    // Push into the shared approval store
    requestStore.push(request);

    // Mark the shadow item as pending
    const idx = shadowStore.findIndex((s) => s.shadowId === item.shadowId);
    if (idx >= 0) {
      shadowStore[idx] = { ...shadowStore[idx], status: 'pending' };
      updated.push(shadowStore[idx]);
    }
  }

  return updated;
};

// ─── Fetch deliveries assigned to a specific person ─────────
export const getMyDeliveriesAPI = async (
  personId: string,
): Promise<Delivery[]> => {
  const all = await getDeliveriesAPI();
  return all.filter((d) => d.deliveryPersonId === personId);
};

// ─── Update delivery status with timestamp ──────────────────
export const updateDeliveryStatusAPI = async (
  deliveryId: string,
  status: DeliveryStatus,
): Promise<Delivery> => {
  return await updateDeliveryAPI(deliveryId, { status });
};

// ─── Save signature data ────────────────────────────────────
export const saveSignatureAPI = async (
  deliveryId: string,
  signatureData: string,
): Promise<Delivery> => {
  return await updateDeliveryAPI(deliveryId, {
    signatureUrl: signatureData,
    signedAt: new Date().toISOString(),
  });
};

// ─── Confirm delivery (customer confirmation step) ──────────
export const confirmDeliveryAPI = async (
  deliveryId: string,
): Promise<Delivery> => {
  return await updateDeliveryAPI(deliveryId, {
    status: 'delivered',
    customerVerified: true,
    customerVerifiedAt: new Date().toISOString(),
    deliveredAt: new Date().toISOString(),
  });
};

// ─── Auto-create inventory update request on delivery ───────
export const createInventoryRequestAPI = async (
  delivery: Delivery,
): Promise<InventoryUpdateRequest> => {
  await delay(300);

  const changes: InventoryChangeItem[] = delivery.items.map((item) => ({
    itemId: item.itemId,
    itemName: item.itemName,
    quantityBefore: item.quantity + item.quantity, // mock: pretend stock was double
    quantityDelivered: item.quantity,
    quantityReturned: 0,
    quantityAfter: item.quantity, // mock: remaining = original
  }));

  const request: InventoryUpdateRequest = {
    requestId: `iur_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    companyId: delivery.companyId,
    deliveryId: delivery.deliveryId,
    deliveryPersonId: delivery.deliveryPersonId || '',
    deliveryPersonName: delivery.deliveryPersonName || '',
    customerName: delivery.customerName,
    changes,
    status: 'pending',
    adminNotes: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date().toISOString(),
  };

  // Push into the shared approval store so admin can see it
  requestStore.push(request);

  return request;
};

// ─── Save per-item confirmations + photo URLs on delivery ───
export const saveItemConfirmationsAPI = async (
  deliveryId: string,
  confirmations: DeliveryItemConfirmation[],
  photoUrls: string[],
): Promise<Delivery> => {
  await delay(300);
  return await updateDeliveryAPI(deliveryId, {
    photoUrls,
    notes: confirmations
      .filter((c) => c.notes.trim())
      .map((c) => `[${c.itemName}] ${c.notes}`)
      .join(' | '),
  } as Partial<Delivery>);
};
