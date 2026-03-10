// ============================================================
// FINMATRIX - Inventory Approval Network Layer  (dummy API)
// ============================================================
import { dummyDelay as delay } from '../../../utils/dummyApiConfig';

// Shadow inventory: changes don't hit real inventory until
// admin approves via this approval flow.

import {
  InventoryUpdateRequest,
  InventoryRequestStatus,
  inventoryUpdateRequests as seed,
} from '../../../dummy-data/inventoryUpdateRequests';

let requestStore: InventoryUpdateRequest[] = [...seed];
export { requestStore };

// ─── Fetch all requests ─────────────────────────────────────
export const getInventoryRequestsAPI = async (): Promise<InventoryUpdateRequest[]> => {
  await delay(350);
  return [...requestStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

// ─── Approve a request ──────────────────────────────────────
export const approveRequestAPI = async (
  requestId: string,
  reviewedBy: string
): Promise<InventoryUpdateRequest> => {
  await delay(400);
  const idx = requestStore.findIndex((r) => r.requestId === requestId);
  if (idx === -1) throw new Error('Request not found');
  if (requestStore[idx].status !== 'pending') throw new Error('Request is not pending');

  requestStore[idx] = {
    ...requestStore[idx],
    status: 'approved',
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  };
  return { ...requestStore[idx] };
};

// ─── Reject a request ───────────────────────────────────────
export const rejectRequestAPI = async (
  requestId: string,
  reviewedBy: string,
  adminNotes: string
): Promise<InventoryUpdateRequest> => {
  await delay(400);
  const idx = requestStore.findIndex((r) => r.requestId === requestId);
  if (idx === -1) throw new Error('Request not found');
  if (requestStore[idx].status !== 'pending') throw new Error('Request is not pending');

  requestStore[idx] = {
    ...requestStore[idx],
    status: 'rejected',
    adminNotes,
    reviewedBy,
    reviewedAt: new Date().toISOString(),
  };
  return { ...requestStore[idx] };
};
