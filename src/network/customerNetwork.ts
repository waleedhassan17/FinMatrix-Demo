// ============================================================
// FINMATRIX - Customer Network Layer
// ============================================================
import { dummyDelay as delay } from '../utils/dummyApiConfig';

import { customers, Customer } from '../dummy-data/customers';

// In-memory store for simulated mutations
let customersStore: Customer[] = [...customers];

export const getCustomersAPI = async (): Promise<Customer[]> => {
  await delay(500);
  return [...customersStore].sort((a, b) => a.name.localeCompare(b.name));
};

export const getCustomerByIdAPI = async (id: string): Promise<Customer> => {
  await delay(400);
  const customer = customersStore.find((c) => c.customerId === id);
  if (!customer) throw new Error('Customer not found');
  return {
    ...customer,
    address: { ...customer.address },
    billingAddress: { ...customer.billingAddress },
    shippingAddress: { ...customer.shippingAddress },
  };
};

export const createCustomerAPI = async (
  data: Omit<Customer, 'customerId' | 'createdAt'>
): Promise<Customer> => {
  await delay(600);
  const newCustomer: Customer = {
    ...data,
    customerId: `cust_${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  customersStore.push(newCustomer);
  return { ...newCustomer };
};

export const updateCustomerAPI = async (
  id: string,
  data: Partial<Customer>
): Promise<Customer> => {
  await delay(600);
  const index = customersStore.findIndex((c) => c.customerId === id);
  if (index === -1) throw new Error('Customer not found');
  customersStore[index] = { ...customersStore[index], ...data };
  return { ...customersStore[index] };
};

export const toggleCustomerActiveAPI = async (
  id: string
): Promise<Customer> => {
  await delay(400);
  const index = customersStore.findIndex((c) => c.customerId === id);
  if (index === -1) throw new Error('Customer not found');
  customersStore[index] = {
    ...customersStore[index],
    isActive: !customersStore[index].isActive,
  };
  return { ...customersStore[index] };
};
