// ============================================================
// FINMATRIX - Payment Network Layer
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { payments, Payment } from '../dummy-data/payments';
import { Invoice } from '../dummy-data/invoices';
import { createLedgerEntriesAPI } from './glNetwork';

// In-memory store
let paymentsStore: Payment[] = [...payments];

/** Fetch all payments sorted by date (newest first). */
export const getPaymentsAPI = async (): Promise<Payment[]> => {
  await delay(500);
  return [...paymentsStore].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
};

/** Fetch payments applied to a specific invoice. */
export const getPaymentsForInvoiceAPI = async (
  invoiceId: string,
): Promise<Payment[]> => {
  await delay(300);
  return paymentsStore
    .filter((p) => p.appliedTo.some((a) => a.invoiceId === invoiceId))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/** Fetch payments by customer. */
export const getPaymentsForCustomerAPI = async (
  customerId: string,
): Promise<Payment[]> => {
  await delay(300);
  return paymentsStore
    .filter((p) => p.customerId === customerId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

/** Record a new payment. Also creates GL entries (Debit Cash, Credit AR). */
export const createPaymentAPI = async (
  data: Omit<Payment, 'paymentId' | 'createdAt'>,
): Promise<Payment> => {
  await delay(600);
  const newPayment: Payment = {
    ...data,
    appliedTo: data.appliedTo.map((a) => ({ ...a })),
    paymentId: `pay_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  paymentsStore.push(newPayment);

  // Cross-module: create GL entries for this payment
  const today = new Date().toISOString().slice(0, 10);
  const refNum = `PAY-${newPayment.paymentId.slice(-6)}`;
  const desc = `Payment received from ${data.customerName || 'customer'}`;
  try {
    await createLedgerEntriesAPI([
      {
        date: today,
        referenceNumber: refNum,
        description: desc,
        accountId: 'acc_002',
        accountName: 'Checking Account',
        accountNumber: '1010',
        debit: data.amount,
        credit: 0,
      },
      {
        date: today,
        referenceNumber: refNum,
        description: desc,
        accountId: 'acc_004',
        accountName: 'Accounts Receivable',
        accountNumber: '1100',
        debit: 0,
        credit: data.amount,
      },
    ]);
  } catch {
    // GL write is best-effort in dummy backend
  }

  return { ...newPayment, appliedTo: newPayment.appliedTo.map((a) => ({ ...a })) };
};

/** Get unpaid invoices for a customer (balance > 0, not cancelled/draft). */
export const getUnpaidInvoicesForCustomerAPI = async (
  customerId: string,
  allInvoices: Invoice[],
): Promise<Invoice[]> => {
  await delay(300);
  return allInvoices
    .filter(
      (inv) =>
        inv.customerId === customerId &&
        inv.amountPaid < inv.total &&
        !['draft', 'cancelled'].includes(inv.status),
    )
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
};
