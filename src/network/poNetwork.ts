// ============================================================
// FINMATRIX - Purchase Order Network Layer (Mock API)
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';
import {
  PurchaseOrder,
  POLine,
  purchaseOrders as seedPOs,
} from '../dummy-data/purchaseOrders';
import { adjustQuantityAPI } from './inventoryNetwork';

/* ── helpers ─────────────────────────────────────────────── */
let poStore: PurchaseOrder[] = [...seedPOs];

/* ── PO CRUD ─────────────────────────────────────────────── */
export const getPurchaseOrdersAPI = async (): Promise<PurchaseOrder[]> => {
  await delay();
  return [...poStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const getPurchaseOrderByIdAPI = async (
  id: string,
): Promise<PurchaseOrder | undefined> => {
  await delay(200);
  const po = poStore.find((p) => p.poId === id);
  return po
    ? { ...po, lines: po.lines.map((l) => ({ ...l })) }
    : undefined;
};

export const createPurchaseOrderAPI = async (
  po: PurchaseOrder,
): Promise<PurchaseOrder> => {
  await delay();
  poStore.unshift(po);
  return { ...po };
};

export const updatePurchaseOrderAPI = async (
  po: PurchaseOrder,
): Promise<PurchaseOrder> => {
  await delay();
  const idx = poStore.findIndex((p) => p.poId === po.poId);
  if (idx !== -1) poStore[idx] = { ...po };
  return { ...po };
};

export const getNextPONumberAPI = async (): Promise<string> => {
  await delay(150);
  const nums = poStore
    .map((p) => {
      const m = p.poNumber.match(/PO-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `PO-${String(next).padStart(3, '0')}`;
};

/* ── Receive Items ───────────────────────────────────────── */
export const receiveItemsAPI = async (
  poId: string,
  receivingLines: { lineId: string; quantityReceiving: number }[],
): Promise<PurchaseOrder> => {
  await delay();
  const po = poStore.find((p) => p.poId === poId);
  if (!po) throw new Error('PO not found');

  // Update received quantities and adjust inventory
  for (const recv of receivingLines) {
    const line = po.lines.find((l) => l.lineId === recv.lineId);
    if (line) {
      line.receivedQuantity = Math.min(
        line.quantity,
        line.receivedQuantity + recv.quantityReceiving,
      );

      // Cross-module: increase inventory on-hand for received items
      if (line.itemId) {
        try {
          await adjustQuantityAPI(
            line.itemId,
            recv.quantityReceiving,
            `PO ${po.poNumber} receive`,
          );
        } catch {
          // Inventory adjustment is best-effort in dummy backend
        }
      }
    }
  }

  // Determine new status
  const allReceived = po.lines.every((l) => l.receivedQuantity >= l.quantity);
  const someReceived = po.lines.some((l) => l.receivedQuantity > 0);

  if (allReceived) {
    po.status = 'fully_received';
  } else if (someReceived) {
    po.status = 'partially_received';
  }

  return { ...po, lines: po.lines.map((l) => ({ ...l })) };
};
