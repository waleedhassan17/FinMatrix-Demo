// ============================================================
// FINMATRIX - Bill Network Layer (Mock API)
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';
import { Bill, BillStatus, bills as seedBills } from '../dummy-data/bills';
import {
  BillPayment,
  billPayments as seedPayments,
} from '../dummy-data/billPayments';

/* ── helpers ─────────────────────────────────────────────── */
let billStore: Bill[] = [...seedBills];
let paymentStore: BillPayment[] = [...seedPayments];

/* ── Bills CRUD ──────────────────────────────────────────── */
export const getBillsAPI = async (): Promise<Bill[]> => {
  await delay();
  return [...billStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const getBillByIdAPI = async (id: string): Promise<Bill | undefined> => {
  await delay(200);
  const bill = billStore.find((b) => b.billId === id);
  return bill ? { ...bill, lines: bill.lines.map((l: typeof bill.lines[number]) => ({ ...l })) } : undefined;
};

export const createBillAPI = async (bill: Bill): Promise<Bill> => {
  await delay();
  billStore.unshift(bill);
  return { ...bill };
};

export const updateBillAPI = async (bill: Bill): Promise<Bill> => {
  await delay();
  const idx = billStore.findIndex((b) => b.billId === bill.billId);
  if (idx !== -1) billStore[idx] = { ...bill };
  return { ...bill };
};

export const getNextBillNumberAPI = async (): Promise<string> => {
  await delay(150);
  const nums = billStore
    .map((b) => {
      const m = b.billNumber.match(/BILL-(\d+)/);
      return m ? parseInt(m[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `BILL-${String(next).padStart(3, '0')}`;
};

/* ── Bill Payments ───────────────────────────────────────── */
export const getBillPaymentsAPI = async (): Promise<BillPayment[]> => {
  await delay();
  return [...paymentStore].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

export const getBillPaymentsForBillAPI = async (
  billId: string,
): Promise<BillPayment[]> => {
  await delay(200);
  return paymentStore.filter((p) =>
    p.appliedTo.some((a: { billId: string }) => a.billId === billId),
  );
};

export const createBillPaymentAPI = async (
  payment: BillPayment,
): Promise<BillPayment> => {
  await delay();
  paymentStore.unshift(payment);

  // Update bill amountPaid + status
  for (const app of payment.appliedTo) {
    const bill = billStore.find((b) => b.billId === app.billId);
    if (bill) {
      bill.amountPaid += app.amount;
      if (bill.amountPaid >= bill.total) {
        bill.status = 'paid';
      } else if (bill.amountPaid > 0) {
        bill.status = 'partially_paid';
      }
    }
  }

  return { ...payment };
};
