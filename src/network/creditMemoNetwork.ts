// ============================================================
// FINMATRIX - Credit Memo Network  (dummy API layer)
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { CreditMemo, creditMemos as seed } from '../dummy-data/creditMemos';

let store: CreditMemo[] = [...seed];

export async function getCreditMemosAPI(): Promise<CreditMemo[]> {
  await delay(350);
  return [...store];
}

export async function getCreditMemoByIdAPI(id: string): Promise<CreditMemo> {
  await delay(200);
  const cm = store.find((c) => c.creditMemoId === id);
  if (!cm) throw new Error('Credit memo not found');
  return { ...cm };
}

export async function createCreditMemoAPI(data: Omit<CreditMemo, 'creditMemoId' | 'createdAt'>): Promise<CreditMemo> {
  await delay(400);
  const newCM: CreditMemo = {
    ...data,
    creditMemoId: `cm_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  store = [newCM, ...store];
  return newCM;
}

export async function updateCreditMemoAPI(id: string, data: Partial<CreditMemo>): Promise<CreditMemo> {
  await delay(300);
  const idx = store.findIndex((c) => c.creditMemoId === id);
  if (idx === -1) throw new Error('Credit memo not found');
  store[idx] = { ...store[idx], ...data };
  return { ...store[idx] };
}

export async function getNextCreditMemoNumberAPI(): Promise<string> {
  await delay(100);
  const nums = store.map((c) => parseInt(c.creditMemoNumber.replace('CM-', ''), 10)).filter(Boolean);
  const next = Math.max(...nums, 4000) + 1;
  return `CM-${next}`;
}
