// ============================================================
// FINMATRIX - Inventory Adjustments Dummy Data  (10 records)
// ============================================================

export interface AdjustmentRecord {
  id: string;
  itemId: string;
  itemName: string;
  date: string;
  quantityBefore: number;
  quantityAfter: number;
  reason: 'Physical Count' | 'Damage' | 'Theft' | 'Return' | 'Received' | 'Other';
  reference: string;
  createdBy: string;
}

export const adjustments: AdjustmentRecord[] = [
  {
    id: 'adj_001',
    itemId: 'inv_001',
    itemName: 'Wireless Bluetooth Mouse',
    date: '2026-02-28T14:00:00Z',
    quantityBefore: 155,
    quantityAfter: 150,
    reason: 'Damage',
    reference: 'ADJ-1001',
    createdBy: 'admin@finmatrix.com',
  },
  {
    id: 'adj_002',
    itemId: 'inv_007',
    itemName: 'Premium Copy Paper A4',
    date: '2026-02-27T10:30:00Z',
    quantityBefore: 310,
    quantityAfter: 320,
    reason: 'Received',
    reference: 'ADJ-1002',
    createdBy: 'admin@finmatrix.com',
  },
  {
    id: 'adj_003',
    itemId: 'inv_013',
    itemName: 'Ergonomic Office Chair',
    date: '2026-02-25T09:15:00Z',
    quantityBefore: 24,
    quantityAfter: 22,
    reason: 'Physical Count',
    reference: 'ADJ-1003',
    createdBy: 'warehouse@finmatrix.com',
  },
  {
    id: 'adj_004',
    itemId: 'inv_019',
    itemName: 'Steel Sheet 4x8ft',
    date: '2026-02-24T16:45:00Z',
    quantityBefore: 55,
    quantityAfter: 60,
    reason: 'Return',
    reference: 'ADJ-1004',
    createdBy: 'admin@finmatrix.com',
  },
  {
    id: 'adj_005',
    itemId: 'inv_025',
    itemName: 'Custom Tool Kit',
    date: '2026-02-22T11:00:00Z',
    quantityBefore: 48,
    quantityAfter: 45,
    reason: 'Theft',
    reference: 'ADJ-1005',
    createdBy: 'admin@finmatrix.com',
  },
  {
    id: 'adj_006',
    itemId: 'inv_004',
    itemName: 'Webcam HD 1080p',
    date: '2026-02-20T08:30:00Z',
    quantityBefore: 3,
    quantityAfter: 5,
    reason: 'Received',
    reference: 'ADJ-1006',
    createdBy: 'warehouse@finmatrix.com',
  },
  {
    id: 'adj_007',
    itemId: 'inv_010',
    itemName: 'Whiteboard Markers (8-Pack)',
    date: '2026-02-18T13:20:00Z',
    quantityBefore: 12,
    quantityAfter: 8,
    reason: 'Physical Count',
    reference: 'ADJ-1007',
    createdBy: 'warehouse@finmatrix.com',
  },
  {
    id: 'adj_008',
    itemId: 'inv_022',
    itemName: 'Acrylic Resin',
    date: '2026-02-15T15:00:00Z',
    quantityBefore: 10,
    quantityAfter: 7,
    reason: 'Damage',
    reference: 'ADJ-1008',
    createdBy: 'admin@finmatrix.com',
  },
  {
    id: 'adj_009',
    itemId: 'inv_026',
    itemName: 'LED Desk Lamp',
    date: '2026-02-12T10:45:00Z',
    quantityBefore: 60,
    quantityAfter: 65,
    reason: 'Return',
    reference: 'ADJ-1009',
    createdBy: 'admin@finmatrix.com',
  },
  {
    id: 'adj_010',
    itemId: 'inv_016',
    itemName: 'Bookshelf 5-Tier',
    date: '2026-02-10T09:00:00Z',
    quantityBefore: 4,
    quantityAfter: 2,
    reason: 'Other',
    reference: 'ADJ-1010',
    createdBy: 'warehouse@finmatrix.com',
  },
];
