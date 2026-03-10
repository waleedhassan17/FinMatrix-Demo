// ============================================================
// FINMATRIX - Invoice Network Layer
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { invoices, Invoice } from '../dummy-data/invoices';

// In-memory store for simulated mutations
let invoicesStore: Invoice[] = [...invoices];

/** Fetch all invoices sorted by date (newest first). */
export const getInvoicesAPI = async (): Promise<Invoice[]> => {
  await delay(500);
  return [...invoicesStore].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

/** Fetch a single invoice by ID. */
export const getInvoiceByIdAPI = async (id: string): Promise<Invoice> => {
  await delay(400);
  const inv = invoicesStore.find((i) => i.invoiceId === id);
  if (!inv) throw new Error('Invoice not found');
  return { ...inv, lines: inv.lines.map((l) => ({ ...l })) };
};

/** Create a new invoice. */
export const createInvoiceAPI = async (
  data: Omit<Invoice, 'invoiceId' | 'createdAt'>,
): Promise<Invoice> => {
  await delay(600);
  const newInvoice: Invoice = {
    ...data,
    lines: data.lines.map((l) => ({ ...l })),
    invoiceId: `inv_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  invoicesStore.push(newInvoice);
  return { ...newInvoice, lines: newInvoice.lines.map((l) => ({ ...l })) };
};

/** Update an existing invoice. */
export const updateInvoiceAPI = async (
  id: string,
  data: Partial<Invoice>,
): Promise<Invoice> => {
  await delay(600);
  const index = invoicesStore.findIndex((i) => i.invoiceId === id);
  if (index === -1) throw new Error('Invoice not found');
  invoicesStore[index] = {
    ...invoicesStore[index],
    ...data,
    lines: (data.lines ?? invoicesStore[index].lines).map((l) => ({ ...l })),
  };
  return {
    ...invoicesStore[index],
    lines: invoicesStore[index].lines.map((l) => ({ ...l })),
  };
};

/** Get next invoice number. */
export const getNextInvoiceNumberAPI = async (): Promise<string> => {
  await delay(200);
  const maxNum = invoicesStore.reduce((max, inv) => {
    const num = parseInt(inv.invoiceNumber.replace('INV-', ''), 10);
    return num > max ? num : max;
  }, 0);
  return `INV-${maxNum + 1}`;
};
