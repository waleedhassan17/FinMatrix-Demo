// ============================================================
// FINMATRIX - Estimate Network Layer
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { estimates, Estimate } from '../dummy-data/estimates';

let estimatesStore: Estimate[] = [...estimates];

/** Fetch all estimates sorted newest first. */
export const getEstimatesAPI = async (): Promise<Estimate[]> => {
  await delay(500);
  return [...estimatesStore].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

/** Fetch a single estimate by ID. */
export const getEstimateByIdAPI = async (id: string): Promise<Estimate> => {
  await delay(400);
  const est = estimatesStore.find((e) => e.estimateId === id);
  if (!est) throw new Error('Estimate not found');
  return { ...est, lines: est.lines.map((l) => ({ ...l })) };
};

/** Create a new estimate. */
export const createEstimateAPI = async (
  data: Omit<Estimate, 'estimateId' | 'createdAt'>,
): Promise<Estimate> => {
  await delay(600);
  const newEst: Estimate = {
    ...data,
    lines: data.lines.map((l) => ({ ...l })),
    estimateId: `est_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  estimatesStore.push(newEst);
  return { ...newEst, lines: newEst.lines.map((l) => ({ ...l })) };
};

/** Update an existing estimate. */
export const updateEstimateAPI = async (
  id: string,
  data: Partial<Estimate>,
): Promise<Estimate> => {
  await delay(600);
  const idx = estimatesStore.findIndex((e) => e.estimateId === id);
  if (idx === -1) throw new Error('Estimate not found');
  estimatesStore[idx] = {
    ...estimatesStore[idx],
    ...data,
    lines: (data.lines ?? estimatesStore[idx].lines).map((l) => ({ ...l })),
  };
  return {
    ...estimatesStore[idx],
    lines: estimatesStore[idx].lines.map((l) => ({ ...l })),
  };
};

/** Get next estimate number. */
export const getNextEstimateNumberAPI = async (): Promise<string> => {
  await delay(200);
  const maxNum = estimatesStore.reduce((max, e) => {
    const n = parseInt(e.estimateNumber.replace('EST-', ''), 10);
    return n > max ? n : max;
  }, 0);
  return `EST-${maxNum + 1}`;
};
