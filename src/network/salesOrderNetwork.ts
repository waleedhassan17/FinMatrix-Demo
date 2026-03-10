// ============================================================
// FINMATRIX - Sales Order Network Layer
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { salesOrders, SalesOrder } from '../dummy-data/salesOrders';

let soStore: SalesOrder[] = [...salesOrders];

export const getSalesOrdersAPI = async (): Promise<SalesOrder[]> => {
  await delay(500);
  return [...soStore].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

export const getSalesOrderByIdAPI = async (id: string): Promise<SalesOrder> => {
  await delay(400);
  const so = soStore.find((s) => s.salesOrderId === id);
  if (!so) throw new Error('Sales order not found');
  return { ...so, lines: so.lines.map((l) => ({ ...l })) };
};

export const createSalesOrderAPI = async (
  data: Omit<SalesOrder, 'salesOrderId' | 'createdAt'>,
): Promise<SalesOrder> => {
  await delay(600);
  const newSO: SalesOrder = {
    ...data,
    lines: data.lines.map((l) => ({ ...l })),
    salesOrderId: `so_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  soStore.push(newSO);
  return { ...newSO, lines: newSO.lines.map((l) => ({ ...l })) };
};

export const updateSalesOrderAPI = async (
  id: string,
  data: Partial<SalesOrder>,
): Promise<SalesOrder> => {
  await delay(600);
  const idx = soStore.findIndex((s) => s.salesOrderId === id);
  if (idx === -1) throw new Error('Sales order not found');
  soStore[idx] = {
    ...soStore[idx],
    ...data,
    lines: (data.lines ?? soStore[idx].lines).map((l) => ({ ...l })),
  };
  return { ...soStore[idx], lines: soStore[idx].lines.map((l) => ({ ...l })) };
};

export const getNextSONumberAPI = async (): Promise<string> => {
  await delay(200);
  const maxNum = soStore.reduce((max, s) => {
    const n = parseInt(s.soNumber.replace('SO-', ''), 10);
    return n > max ? n : max;
  }, 0);
  return `SO-${maxNum + 1}`;
};
