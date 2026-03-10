// ============================================================
// FINMATRIX - Stock Transfers Dummy Data  (5 records)
// ============================================================

export interface TransferRecord {
  id: string;
  date: string;
  fromLocationId: string;
  fromLocationName: string;
  toLocationId: string;
  toLocationName: string;
  items: {
    itemId: string;
    itemName: string;
    sku: string;
    quantity: number;
  }[];
  reference: string;
  status: 'completed' | 'pending' | 'cancelled';
  createdBy: string;
}

export const transfers: TransferRecord[] = [
  {
    id: 'xfr_001',
    date: '2026-02-28T09:00:00Z',
    fromLocationId: 'warehouse_1',
    fromLocationName: 'Warehouse 1',
    toLocationId: 'store_1',
    toLocationName: 'Store 1',
    items: [
      { itemId: 'inv_001', itemName: 'Wireless Bluetooth Mouse', sku: 'SKU-001', quantity: 20 },
      { itemId: 'inv_008', itemName: 'Gel Pen Set (12-Pack)', sku: 'SKU-008', quantity: 30 },
    ],
    reference: 'XFR-2001',
    status: 'completed',
    createdBy: 'admin@finmatrix.com',
  },
  {
    id: 'xfr_002',
    date: '2026-02-25T14:30:00Z',
    fromLocationId: 'warehouse_2',
    fromLocationName: 'Warehouse 2',
    toLocationId: 'warehouse_1',
    toLocationName: 'Warehouse 1',
    items: [
      { itemId: 'inv_003', itemName: 'Noise-Cancelling Headphones', sku: 'SKU-003', quantity: 10 },
    ],
    reference: 'XFR-2002',
    status: 'completed',
    createdBy: 'warehouse@finmatrix.com',
  },
  {
    id: 'xfr_003',
    date: '2026-02-22T11:15:00Z',
    fromLocationId: 'warehouse_1',
    fromLocationName: 'Warehouse 1',
    toLocationId: 'warehouse_2',
    toLocationName: 'Warehouse 2',
    items: [
      { itemId: 'inv_019', itemName: 'Steel Sheet 4x8ft', sku: 'SKU-019', quantity: 15 },
      { itemId: 'inv_023', itemName: 'Plywood Sheet 4x8ft', sku: 'SKU-023', quantity: 8 },
      { itemId: 'inv_021', itemName: 'Copper Wire Spool 14AWG', sku: 'SKU-021', quantity: 5 },
    ],
    reference: 'XFR-2003',
    status: 'completed',
    createdBy: 'admin@finmatrix.com',
  },
  {
    id: 'xfr_004',
    date: '2026-02-18T16:00:00Z',
    fromLocationId: 'store_1',
    fromLocationName: 'Store 1',
    toLocationId: 'warehouse_1',
    toLocationName: 'Warehouse 1',
    items: [
      { itemId: 'inv_017', itemName: 'Monitor Stand Riser', sku: 'SKU-017', quantity: 5 },
    ],
    reference: 'XFR-2004',
    status: 'pending',
    createdBy: 'warehouse@finmatrix.com',
  },
  {
    id: 'xfr_005',
    date: '2026-02-14T10:00:00Z',
    fromLocationId: 'warehouse_1',
    fromLocationName: 'Warehouse 1',
    toLocationId: 'store_1',
    toLocationName: 'Store 1',
    items: [
      { itemId: 'inv_026', itemName: 'LED Desk Lamp', sku: 'SKU-026', quantity: 12 },
      { itemId: 'inv_030', itemName: 'Cable Management Kit', sku: 'SKU-030', quantity: 25 },
    ],
    reference: 'XFR-2005',
    status: 'completed',
    createdBy: 'admin@finmatrix.com',
  },
];
