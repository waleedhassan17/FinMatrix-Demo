// ============================================================
// FINMATRIX - Shadow Inventory Dummy Data  (8 items)
// ============================================================
// Each delivery person works on a "shadow" copy of inventory.
// Changes are tracked per delivery and submitted for admin review.

export type ShadowInventoryStatus = 'synced' | 'pending' | 'rejected';

export interface ShadowInventoryChange {
  changeId: string;
  deliveryId: string;
  deliveryCustomer: string;
  quantityChanged: number;
  timestamp: string;
}

export interface ShadowInventoryItem {
  shadowId: string;
  companyId: string;
  deliveryPersonId: string;
  itemId: string;
  itemName: string;
  originalQuantity: number;
  currentQuantity: number;
  changes: ShadowInventoryChange[];
  status: ShadowInventoryStatus;
}

export const shadowInventory: ShadowInventoryItem[] = [
  // ═══ SYNCED (3) ═══════════════════════════════════════════
  {
    shadowId: 'shd_001',
    companyId: 'comp_001',
    deliveryPersonId: 'dp_001',
    itemId: 'inv_001',
    itemName: 'Wireless Bluetooth Mouse',
    originalQuantity: 150,
    currentQuantity: 100,
    changes: [
      {
        changeId: 'chg_001',
        deliveryId: 'del_014',
        deliveryCustomer: 'TechStart Inc',
        quantityChanged: -30,
        timestamp: '2026-02-26T14:30:00Z',
      },
      {
        changeId: 'chg_002',
        deliveryId: 'del_016',
        deliveryCustomer: 'Acme Corp',
        quantityChanged: -20,
        timestamp: '2026-02-24T15:45:00Z',
      },
    ],
    status: 'synced',
  },
  {
    shadowId: 'shd_002',
    companyId: 'comp_001',
    deliveryPersonId: 'dp_001',
    itemId: 'inv_004',
    itemName: 'Mechanical Keyboard RGB',
    originalQuantity: 90,
    currentQuantity: 60,
    changes: [
      {
        changeId: 'chg_003',
        deliveryId: 'del_006',
        deliveryCustomer: 'Acme Corp',
        quantityChanged: -30,
        timestamp: '2026-03-02T10:00:00Z',
      },
    ],
    status: 'synced',
  },
  {
    shadowId: 'shd_003',
    companyId: 'comp_001',
    deliveryPersonId: 'dp_001',
    itemId: 'inv_006',
    itemName: 'Webcam 1080p',
    originalQuantity: 60,
    currentQuantity: 40,
    changes: [
      {
        changeId: 'chg_004',
        deliveryId: 'del_014',
        deliveryCustomer: 'TechStart Inc',
        quantityChanged: -20,
        timestamp: '2026-02-26T14:30:00Z',
      },
    ],
    status: 'synced',
  },

  // ═══ PENDING (3) ══════════════════════════════════════════
  {
    shadowId: 'shd_004',
    companyId: 'comp_001',
    deliveryPersonId: 'dp_001',
    itemId: 'inv_020',
    itemName: 'Aluminum Rod 1"x10ft',
    originalQuantity: 200,
    currentQuantity: 160,
    changes: [
      {
        changeId: 'chg_005',
        deliveryId: 'del_010',
        deliveryCustomer: 'Greenfield Manufacturing',
        quantityChanged: -40,
        timestamp: '2026-03-01T08:00:00Z',
      },
    ],
    status: 'pending',
  },
  {
    shadowId: 'shd_005',
    companyId: 'comp_001',
    deliveryPersonId: 'dp_001',
    itemId: 'inv_015',
    itemName: 'Bookshelf 5-Tier',
    originalQuantity: 25,
    currentQuantity: 17,
    changes: [
      {
        changeId: 'chg_006',
        deliveryId: 'del_011',
        deliveryCustomer: 'Acme Corp',
        quantityChanged: -8,
        timestamp: '2026-02-28T14:00:00Z',
      },
    ],
    status: 'pending',
  },
  {
    shadowId: 'shd_006',
    companyId: 'comp_001',
    deliveryPersonId: 'dp_001',
    itemId: 'inv_025',
    itemName: 'Assembled Circuit Board v3',
    originalQuantity: 300,
    currentQuantity: 250,
    changes: [
      {
        changeId: 'chg_007',
        deliveryId: 'del_013',
        deliveryCustomer: 'Bright Horizons Design',
        quantityChanged: -50,
        timestamp: '2026-02-27T16:00:00Z',
      },
    ],
    status: 'pending',
  },

  // ═══ REJECTED (2) ═════════════════════════════════════════
  {
    shadowId: 'shd_007',
    companyId: 'comp_001',
    deliveryPersonId: 'dp_001',
    itemId: 'inv_017',
    itemName: 'Monitor Stand Riser',
    originalQuantity: 45,
    currentQuantity: 37,
    changes: [
      {
        changeId: 'chg_008',
        deliveryId: 'del_018',
        deliveryCustomer: 'Bright Horizons Design',
        quantityChanged: -8,
        timestamp: '2026-02-20T09:00:00Z',
      },
    ],
    status: 'rejected',
  },
  {
    shadowId: 'shd_008',
    companyId: 'comp_001',
    deliveryPersonId: 'dp_001',
    itemId: 'inv_023',
    itemName: 'Plywood Sheet 4x8ft',
    originalQuantity: 80,
    currentQuantity: 50,
    changes: [
      {
        changeId: 'chg_009',
        deliveryId: 'del_019',
        deliveryCustomer: 'Greenfield Manufacturing',
        quantityChanged: -30,
        timestamp: '2026-02-19T14:00:00Z',
      },
    ],
    status: 'rejected',
  },
];
