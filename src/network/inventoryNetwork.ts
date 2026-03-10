// ============================================================
// FINMATRIX - Inventory Network Layer  (dummy API)
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { InventoryItem, inventoryItems as seed } from '../dummy-data/inventoryItems';
import { AdjustmentRecord, adjustments as seedAdj } from '../dummy-data/adjustments';
import { TransferRecord, transfers as seedXfr } from '../dummy-data/transfers';
import { LOCATION_LABELS } from '../models/inventoryModel';

let store: InventoryItem[] = [...seed];
let adjustmentStore: AdjustmentRecord[] = [...seedAdj];
let transferStore: TransferRecord[] = [...seedXfr];
let nextAdjRef = 1011;
let nextXfrRef = 2006;

// ─── Fetch All ──────────────────────────────────────────────
export const getInventoryItemsAPI = async (): Promise<InventoryItem[]> => {
  await delay(400);
  return [...store].sort((a, b) => a.name.localeCompare(b.name));
};

// ─── Fetch One ──────────────────────────────────────────────
export const getInventoryItemByIdAPI = async (
  id: string
): Promise<InventoryItem> => {
  await delay(300);
  const item = store.find((x) => x.itemId === id);
  if (!item) throw new Error('Inventory item not found');
  return { ...item };
};

// ─── Create ─────────────────────────────────────────────────
export const createInventoryItemAPI = async (
  data: Omit<InventoryItem, 'itemId' | 'lastUpdated'>
): Promise<InventoryItem> => {
  await delay(500);
  const newItem: InventoryItem = {
    ...data,
    itemId: `inv_${Date.now()}`,
    lastUpdated: new Date().toISOString(),
  };
  store.push(newItem);
  return { ...newItem };
};

// ─── Update ─────────────────────────────────────────────────
export const updateInventoryItemAPI = async (
  id: string,
  data: Partial<InventoryItem>
): Promise<InventoryItem> => {
  await delay(500);
  const idx = store.findIndex((x) => x.itemId === id);
  if (idx === -1) throw new Error('Inventory item not found');
  store[idx] = { ...store[idx], ...data, lastUpdated: new Date().toISOString() };
  return { ...store[idx] };
};

// ─── Toggle Active ──────────────────────────────────────────
export const toggleInventoryActiveAPI = async (
  id: string
): Promise<InventoryItem> => {
  await delay(300);
  const idx = store.findIndex((x) => x.itemId === id);
  if (idx === -1) throw new Error('Inventory item not found');
  store[idx] = {
    ...store[idx],
    isActive: !store[idx].isActive,
    lastUpdated: new Date().toISOString(),
  };
  return { ...store[idx] };
};

// ─── Adjust Quantity ────────────────────────────────────────
export const adjustQuantityAPI = async (
  id: string,
  adjustment: number,
  _reason: string
): Promise<InventoryItem> => {
  await delay(400);
  const idx = store.findIndex((x) => x.itemId === id);
  if (idx === -1) throw new Error('Inventory item not found');
  const newQty = store[idx].quantityOnHand + adjustment;
  if (newQty < 0) throw new Error('Adjustment would result in negative qty');
  store[idx] = {
    ...store[idx],
    quantityOnHand: newQty,
    lastUpdated: new Date().toISOString(),
  };
  return { ...store[idx] };
};

// ─── Delete ─────────────────────────────────────────────────
export const deleteInventoryItemAPI = async (
  id: string
): Promise<{ success: true }> => {
  await delay(400);
  const idx = store.findIndex((x) => x.itemId === id);
  if (idx === -1) throw new Error('Inventory item not found');
  store.splice(idx, 1);
  return { success: true };
};

// ─── Transfer Stock ─────────────────────────────────────────
export const transferStockAPI = async (
  id: string,
  toLocationId: string,
  qty: number
): Promise<InventoryItem> => {
  await delay(400);
  const idx = store.findIndex((x) => x.itemId === id);
  if (idx === -1) throw new Error('Inventory item not found');
  if (store[idx].quantityOnHand < qty) throw new Error('Insufficient stock for transfer');
  // Deduct qty from source item (in a real system this would create a new item at the destination)
  store[idx] = {
    ...store[idx],
    quantityOnHand: store[idx].quantityOnHand - qty,
    lastUpdated: new Date().toISOString(),
  };
  // Check if item already exists at destination
  const destIdx = store.findIndex(
    (x) => x.sku === store[idx].sku && x.locationId === toLocationId
  );
  if (destIdx >= 0 && destIdx !== idx) {
    store[destIdx] = {
      ...store[destIdx],
      quantityOnHand: store[destIdx].quantityOnHand + qty,
      lastUpdated: new Date().toISOString(),
    };
  }
  return { ...store[idx] };
};

// ─── Adjustment Records ─────────────────────────────────────
export const createAdjustmentAPI = async (
  record: Omit<AdjustmentRecord, 'id' | 'reference'>
): Promise<AdjustmentRecord> => {
  await delay(300);
  const newRec: AdjustmentRecord = {
    ...record,
    id: `adj_${Date.now()}`,
    reference: `ADJ-${nextAdjRef++}`,
  };
  adjustmentStore.push(newRec);
  return { ...newRec };
};

export const getAdjustmentsAPI = async (): Promise<AdjustmentRecord[]> => {
  await delay(200);
  return [...adjustmentStore].sort((a, b) => b.date.localeCompare(a.date));
};

export const getAdjustmentsForItemAPI = async (
  itemId: string
): Promise<AdjustmentRecord[]> => {
  await delay(200);
  return adjustmentStore
    .filter((a) => a.itemId === itemId)
    .sort((a, b) => b.date.localeCompare(a.date));
};

// ─── Transfer Records ───────────────────────────────────────
export const createTransferAPI = async (
  data: Omit<TransferRecord, 'id' | 'reference'>
): Promise<TransferRecord> => {
  await delay(400);
  const newRec: TransferRecord = {
    ...data,
    id: `xfr_${Date.now()}`,
    reference: `XFR-${nextXfrRef++}`,
  };
  transferStore.push(newRec);
  return { ...newRec };
};

export const getTransfersAPI = async (): Promise<TransferRecord[]> => {
  await delay(200);
  return [...transferStore].sort((a, b) => b.date.localeCompare(a.date));
};

export const getTransfersForItemAPI = async (
  itemId: string
): Promise<TransferRecord[]> => {
  await delay(200);
  return transferStore
    .filter((t) => t.items.some((i) => i.itemId === itemId))
    .sort((a, b) => b.date.localeCompare(a.date));
};
