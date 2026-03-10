// ============================================================
// FINMATRIX - Tax Network Layer (Simulated)
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { taxRates, taxPayments, TaxRate, TaxPayment } from '../dummy-data/taxRates';

// ─── Tax Rates ──────────────────────────────────────────────
export const getTaxRatesAPI = async (): Promise<TaxRate[]> => {
  await delay(300);
  return [...taxRates];
};

export const createTaxRateAPI = async (
  data: Omit<TaxRate, 'taxId'>,
): Promise<TaxRate> => {
  await delay(400);
  return {
    ...data,
    taxId: `tax_${Date.now()}`,
  };
};

export const updateTaxRateAPI = async (
  data: TaxRate,
): Promise<TaxRate> => {
  await delay(400);
  return { ...data };
};

export const deleteTaxRateAPI = async (
  taxId: string,
): Promise<string> => {
  await delay(300);
  return taxId;
};

// ─── Tax Payments ───────────────────────────────────────────
export const getTaxPaymentsAPI = async (): Promise<TaxPayment[]> => {
  await delay(300);
  return [...taxPayments];
};

export const createTaxPaymentAPI = async (
  data: Omit<TaxPayment, 'paymentId' | 'createdAt'>,
): Promise<TaxPayment> => {
  await delay(400);
  return {
    ...data,
    paymentId: `tp_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
};
