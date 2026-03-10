// ============================================================
// FINMATRIX - Vendor Network Layer  (dummy API)
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { Vendor, vendors as seed } from '../dummy-data/vendors';

let store: Vendor[] = [...seed];

export const getVendorsAPI = async (): Promise<Vendor[]> => {
  await delay(400);
  return [...store].sort((a, b) => a.companyName.localeCompare(b.companyName));
};

export const getVendorByIdAPI = async (id: string): Promise<Vendor> => {
  await delay(300);
  const v = store.find((x) => x.vendorId === id);
  if (!v) throw new Error('Vendor not found');
  return { ...v, address: { ...v.address } };
};

export const createVendorAPI = async (
  data: Omit<Vendor, 'vendorId' | 'createdAt'>
): Promise<Vendor> => {
  await delay(500);
  const newV: Vendor = {
    ...data,
    vendorId: `vnd_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  store.push(newV);
  return { ...newV };
};

export const updateVendorAPI = async (
  id: string,
  data: Partial<Vendor>
): Promise<Vendor> => {
  await delay(500);
  const idx = store.findIndex((x) => x.vendorId === id);
  if (idx === -1) throw new Error('Vendor not found');
  store[idx] = { ...store[idx], ...data };
  return { ...store[idx] };
};

export const toggleVendorActiveAPI = async (id: string): Promise<Vendor> => {
  await delay(300);
  const idx = store.findIndex((x) => x.vendorId === id);
  if (idx === -1) throw new Error('Vendor not found');
  store[idx] = { ...store[idx], isActive: !store[idx].isActive };
  return { ...store[idx] };
};
