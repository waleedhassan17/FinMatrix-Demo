// ============================================================
// FINMATRIX - Inventory Update Requests Dummy Data  (8 records)
// ============================================================
// Shadow inventory concept: delivery personnel work on copies.
// Changes don't affect real inventory until admin approves.
// Distribution: 3 pending, 3 approved, 2 rejected

export type InventoryRequestStatus = 'pending' | 'approved' | 'rejected';

export interface InventoryChangeItem {
  itemId: string;
  itemName: string;
  quantityBefore: number;
  quantityDelivered: number;
  quantityReturned: number;
  quantityAfter: number;
}

export interface InventoryUpdateRequest {
  requestId: string;
  companyId: string;
  deliveryId: string;
  deliveryPersonId: string;
  deliveryPersonName: string;
  customerName: string;
  changes: InventoryChangeItem[];
  status: InventoryRequestStatus;
  adminNotes: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export const inventoryUpdateRequests: InventoryUpdateRequest[] = [
  // ═══ PENDING (3) — from today's deliveries ════════════════
  {
    requestId: 'iur_001',
    companyId: 'company_1',
    deliveryId: 'del_014',
    deliveryPersonId: 'dp_004',
    deliveryPersonName: 'Ali Abbas',
    customerName: 'Blue Area Mart',
    changes: [
      {
        itemId: 'dalda_001',
        itemName: 'Dalda Cooking Oil 1L',
        quantityBefore: 50,
        quantityDelivered: 25,
        quantityReturned: 0,
        quantityAfter: 25,
      },
      {
        itemId: 'dalda_003',
        itemName: 'Dalda Banaspati Ghee 1kg',
        quantityBefore: 30,
        quantityDelivered: 15,
        quantityReturned: 0,
        quantityAfter: 15,
      },
    ],
    status: 'pending',
    adminNotes: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: '2026-03-07T14:30:00Z',
  },
  {
    requestId: 'iur_002',
    companyId: 'company_1',
    deliveryId: 'del_015',
    deliveryPersonId: 'dp_004',
    deliveryPersonName: 'Ali Abbas',
    customerName: 'Rawalpindi Wholesale Hub',
    changes: [
      {
        itemId: 'spark_001',
        itemName: 'SparkClean Detergent 2kg',
        quantityBefore: 100,
        quantityDelivered: 50,
        quantityReturned: 0,
        quantityAfter: 50,
      },
      {
        itemId: 'spark_002',
        itemName: 'SparkClean Bleach 1L',
        quantityBefore: 60,
        quantityDelivered: 30,
        quantityReturned: 0,
        quantityAfter: 30,
      },
    ],
    status: 'pending',
    adminNotes: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: '2026-03-07T16:00:00Z',
  },
  {
    requestId: 'iur_003',
    companyId: 'company_1',
    deliveryId: 'del_016',
    deliveryPersonId: 'dp_004',
    deliveryPersonName: 'Ali Abbas',
    customerName: 'Peshawar Trading Co',
    changes: [
      {
        itemId: 'dalda_002',
        itemName: 'Dalda Cooking Oil 5L',
        quantityBefore: 30,
        quantityDelivered: 15,
        quantityReturned: 0,
        quantityAfter: 15,
      },
      {
        itemId: 'aqua_002',
        itemName: 'AquaPure Water Dispenser',
        quantityBefore: 10,
        quantityDelivered: 5,
        quantityReturned: 0,
        quantityAfter: 5,
      },
    ],
    status: 'pending',
    adminNotes: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: '2026-03-07T12:45:00Z',
  },

  // ═══ APPROVED (3) — from yesterday ════════════════════════
  {
    requestId: 'iur_004',
    companyId: 'company_1',
    deliveryId: 'del_011',
    deliveryPersonId: 'dp_002',
    deliveryPersonName: 'Hassan Raza',
    customerName: 'Faisal Town Supermarket',
    changes: [
      {
        itemId: 'dalda_003',
        itemName: 'Dalda Banaspati Ghee 1kg',
        quantityBefore: 40,
        quantityDelivered: 20,
        quantityReturned: 0,
        quantityAfter: 20,
      },
      {
        itemId: 'dalda_002',
        itemName: 'Dalda Cooking Oil 5L',
        quantityBefore: 20,
        quantityDelivered: 10,
        quantityReturned: 0,
        quantityAfter: 10,
      },
    ],
    status: 'approved',
    adminNotes: null,
    reviewedBy: 'admin_001',
    reviewedAt: '2026-03-06T16:30:00Z',
    createdAt: '2026-03-06T14:00:00Z',
  },
  {
    requestId: 'iur_005',
    companyId: 'company_1',
    deliveryId: 'del_012',
    deliveryPersonId: 'dp_002',
    deliveryPersonName: 'Hassan Raza',
    customerName: 'Model Town Pharmacy',
    changes: [
      {
        itemId: 'aqua_001',
        itemName: 'AquaPure Mineral Water 1.5L (Pack of 6)',
        quantityBefore: 80,
        quantityDelivered: 40,
        quantityReturned: 0,
        quantityAfter: 40,
      },
    ],
    status: 'approved',
    adminNotes: null,
    reviewedBy: 'admin_001',
    reviewedAt: '2026-03-06T17:00:00Z',
    createdAt: '2026-03-06T15:30:00Z',
  },
  {
    requestId: 'iur_006',
    companyId: 'company_1',
    deliveryId: 'del_013',
    deliveryPersonId: 'dp_002',
    deliveryPersonName: 'Hassan Raza',
    customerName: 'Johar Town Grocers',
    changes: [
      {
        itemId: 'spark_001',
        itemName: 'SparkClean Detergent 2kg',
        quantityBefore: 50,
        quantityDelivered: 25,
        quantityReturned: 0,
        quantityAfter: 25,
      },
      {
        itemId: 'spark_002',
        itemName: 'SparkClean Bleach 1L',
        quantityBefore: 36,
        quantityDelivered: 18,
        quantityReturned: 0,
        quantityAfter: 18,
      },
    ],
    status: 'approved',
    adminNotes: null,
    reviewedBy: 'admin_001',
    reviewedAt: '2026-03-06T18:15:00Z',
    createdAt: '2026-03-06T16:45:00Z',
  },

  // ═══ REJECTED (2) ═════════════════════════════════════════
  {
    requestId: 'iur_007',
    companyId: 'company_1',
    deliveryId: 'del_018',
    deliveryPersonId: 'dp_005',
    deliveryPersonName: 'Kamran Malik',
    customerName: 'Hyderabad Mini Market',
    changes: [
      {
        itemId: 'dalda_003',
        itemName: 'Dalda Banaspati Ghee 1kg',
        quantityBefore: 24,
        quantityDelivered: 12,
        quantityReturned: 12,
        quantityAfter: 24,
      },
    ],
    status: 'rejected',
    adminNotes: 'Quantity mismatch — customer reports receiving 18 not 20. Recount and resubmit with corrected figures.',
    reviewedBy: 'admin_001',
    reviewedAt: '2026-03-06T19:00:00Z',
    createdAt: '2026-03-06T17:30:00Z',
  },
  {
    requestId: 'iur_008',
    companyId: 'company_1',
    deliveryId: 'del_019',
    deliveryPersonId: 'dp_005',
    deliveryPersonName: 'Kamran Malik',
    customerName: 'Sukkur Provision Store',
    changes: [
      {
        itemId: 'aqua_001',
        itemName: 'AquaPure Mineral Water 1.5L (Pack of 6)',
        quantityBefore: 70,
        quantityDelivered: 35,
        quantityReturned: 0,
        quantityAfter: 35,
      },
      {
        itemId: 'aqua_003',
        itemName: 'AquaPure Water Filter Cartridge',
        quantityBefore: 24,
        quantityDelivered: 12,
        quantityReturned: 12,
        quantityAfter: 24,
      },
    ],
    status: 'rejected',
    adminNotes: 'Missing signature for partial delivery. Customer did not sign for items received. Re-verify and obtain proper documentation.',
    reviewedBy: 'admin_001',
    reviewedAt: '2026-03-06T20:00:00Z',
    createdAt: '2026-03-06T18:00:00Z',
  },
];
