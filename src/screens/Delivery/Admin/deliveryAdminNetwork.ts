// ============================================================
// FINMATRIX - Delivery Admin Network Layer  (dummy API)
// ============================================================
import { dummyDelay as delay } from '../../../utils/dummyApiConfig';

import { Delivery, deliveries as seedDeliveries } from '../../../dummy-data/deliveries';
import {
  DeliveryPerson,
  deliveryPersonnel as seedPersonnel,
} from '../../../dummy-data/deliveryPersonnel';

let deliveryStore: Delivery[] = [...seedDeliveries];
let personnelStore: DeliveryPerson[] = [...seedPersonnel];

// ─── Deliveries ─────────────────────────────────────────────

export const getDeliveriesAPI = async (): Promise<Delivery[]> => {
  await delay(400);
  return [...deliveryStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

export const createDeliveryAPI = async (
  data: Omit<Delivery, 'deliveryId'>
): Promise<Delivery> => {
  await delay(500);
  const newDel: Delivery = {
    ...data,
    deliveryId: `del_${Date.now()}`,
  };
  deliveryStore.push(newDel);
  return { ...newDel };
};

export const updateDeliveryAPI = async (
  id: string,
  data: Partial<Delivery>
): Promise<Delivery> => {
  await delay(400);
  const idx = deliveryStore.findIndex((d) => d.deliveryId === id);
  if (idx === -1) throw new Error('Delivery not found');
  deliveryStore[idx] = { ...deliveryStore[idx], ...data };
  return { ...deliveryStore[idx] };
};

export const assignDeliveryAPI = async (
  deliveryId: string,
  personId: string
): Promise<Delivery> => {
  await delay(400);
  const dIdx = deliveryStore.findIndex((d) => d.deliveryId === deliveryId);
  if (dIdx === -1) throw new Error('Delivery not found');
  const person = personnelStore.find((p) => p.userId === personId);
  if (!person) throw new Error('Delivery person not found');
  if (!person.isAvailable) throw new Error('Person is not available');
  if (person.currentLoad >= person.maxLoad) throw new Error('Person at max capacity');

  const assignmentId = `asgn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  deliveryStore[dIdx] = {
    ...deliveryStore[dIdx],
    assignmentId,
    status: 'pending',
    deliveryPersonId: person.userId,
    deliveryPersonName: person.displayName,
  };

  // Increment person's load
  const pIdx = personnelStore.findIndex((p) => p.userId === personId);
  personnelStore[pIdx] = {
    ...personnelStore[pIdx],
    currentLoad: personnelStore[pIdx].currentLoad + 1,
  };

  return { ...deliveryStore[dIdx] };
};

export const batchAssignDeliveriesAPI = async (
  deliveryIds: string[],
  personId: string
): Promise<Delivery[]> => {
  const results: Delivery[] = [];
  for (const did of deliveryIds) {
    const res = await assignDeliveryAPI(did, personId);
    results.push(res);
  }
  return results;
};

export const autoAssignDeliveriesAPI = async (
  deliveryIds: string[]
): Promise<Delivery[]> => {
  await delay(600);
  const available = personnelStore
    .filter((p) => p.isAvailable && p.currentLoad < p.maxLoad)
    .sort((a, b) => a.currentLoad - b.currentLoad);

  if (available.length === 0) throw new Error('No delivery persons available');

  const results: Delivery[] = [];
  let pIdx = 0;

  for (const did of deliveryIds) {
    // Round-robin across available persons
    const person = available[pIdx % available.length];
    const res = await assignDeliveryAPI(did, person.userId);
    results.push(res);
    // Refresh person object in available array
    const refreshed = personnelStore.find((p) => p.userId === person.userId);
    if (refreshed) available[pIdx % available.length] = refreshed;
    pIdx++;
  }

  return results;
};

// ─── Personnel ──────────────────────────────────────────────

export const getPersonnelAPI = async (): Promise<DeliveryPerson[]> => {
  await delay(300);
  return [...personnelStore].sort((a, b) => a.displayName.localeCompare(b.displayName));
};

export const updatePersonnelAPI = async (
  userId: string,
  data: Partial<DeliveryPerson>
): Promise<DeliveryPerson> => {
  await delay(300);
  const idx = personnelStore.findIndex((p) => p.userId === userId);
  if (idx === -1) throw new Error('Person not found');
  personnelStore[idx] = { ...personnelStore[idx], ...data };
  return { ...personnelStore[idx] };
};

export const addPersonnelAPI = async (
  data: DeliveryPerson
): Promise<DeliveryPerson> => {
  await delay(400);
  personnelStore.push({ ...data });
  return { ...data };
};

export const removePersonnelAPI = async (
  userId: string
): Promise<string> => {
  await delay(300);
  personnelStore = personnelStore.filter((p) => p.userId !== userId);
  return userId;
};
