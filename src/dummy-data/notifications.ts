// ============================================================
// FINMATRIX - Notifications Dummy Data
// ============================================================

export type NotificationType =
  | 'delivery_update'
  | 'inventory_approval'
  | 'invoice_overdue'
  | 'low_stock'
  | 'general';

export interface AppNotification {
  id: string;
  recipientId: string;
  title: string;
  body: string;
  type: NotificationType;
  data: Record<string, any> | null;
  isRead: boolean;
  createdAt: string;
}

export const notifications: AppNotification[] = [
  // ── Recent & Unread ───────────────────────────────────────
  {
    id: 'notif_001',
    recipientId: 'usr_001',
    title: 'Delivery Completed',
    body: 'Order DEL-2048 was delivered to Acme Corp at 2:15 PM.',
    type: 'delivery_update',
    data: { deliveryId: 'del_012', orderId: 'SO-2048' },
    isRead: false,
    createdAt: '2026-03-03T14:15:00Z',
  },
  {
    id: 'notif_002',
    recipientId: 'usr_001',
    title: 'Invoice Overdue — INV-1005',
    body: 'Invoice INV-1005 for Riverstone LLC ($3,450.00) is 15 days past due.',
    type: 'invoice_overdue',
    data: { invoiceId: 'inv_005', invoiceNumber: 'INV-1005', amount: 3450 },
    isRead: false,
    createdAt: '2026-03-03T09:00:00Z',
  },
  {
    id: 'notif_003',
    recipientId: 'usr_001',
    title: 'Low Stock Alert',
    body: 'Widget Pro X (SKU: WPX-100) is below reorder point — 3 units remaining.',
    type: 'low_stock',
    data: { itemId: 'item_004', sku: 'WPX-100', quantityOnHand: 3 },
    isRead: false,
    createdAt: '2026-03-03T08:30:00Z',
  },
  {
    id: 'notif_004',
    recipientId: 'usr_001',
    title: 'Inventory Adjustment Pending',
    body: 'Sarah Chen submitted an adjustment for 12 units of Steel Bolts. Awaiting approval.',
    type: 'inventory_approval',
    data: { adjustmentId: 'adj_003', itemId: 'item_007', quantity: 12 },
    isRead: false,
    createdAt: '2026-03-02T16:45:00Z',
  },
  {
    id: 'notif_005',
    recipientId: 'usr_001',
    title: 'Delivery Out for Shipment',
    body: 'Order DEL-2051 is out for delivery to BrightStar Inc. ETA 4:30 PM.',
    type: 'delivery_update',
    data: { deliveryId: 'del_015', orderId: 'SO-2051' },
    isRead: false,
    createdAt: '2026-03-02T13:00:00Z',
  },

  // ── Recent & Read ─────────────────────────────────────────
  {
    id: 'notif_006',
    recipientId: 'usr_001',
    title: 'Invoice Paid — INV-1002',
    body: 'TechWave Solutions paid $8,200.00 for INV-1002.',
    type: 'general',
    data: { invoiceId: 'inv_002', invoiceNumber: 'INV-1002' },
    isRead: true,
    createdAt: '2026-03-02T10:20:00Z',
  },
  {
    id: 'notif_007',
    recipientId: 'usr_001',
    title: 'Delivery Failed',
    body: 'Delivery DEL-2046 could not be completed — recipient unavailable.',
    type: 'delivery_update',
    data: { deliveryId: 'del_010', status: 'failed' },
    isRead: true,
    createdAt: '2026-03-01T17:30:00Z',
  },
  {
    id: 'notif_008',
    recipientId: 'usr_001',
    title: 'Low Stock Alert',
    body: 'Copper Wire Spool (CWS-200) has only 5 units left.',
    type: 'low_stock',
    data: { itemId: 'item_009', sku: 'CWS-200', quantityOnHand: 5 },
    isRead: true,
    createdAt: '2026-03-01T11:00:00Z',
  },
  {
    id: 'notif_009',
    recipientId: 'usr_001',
    title: 'Invoice Overdue — INV-1008',
    body: 'Invoice INV-1008 for Greenfield Farms ($1,820.00) is 7 days past due.',
    type: 'invoice_overdue',
    data: { invoiceId: 'inv_008', invoiceNumber: 'INV-1008', amount: 1820 },
    isRead: true,
    createdAt: '2026-02-28T09:15:00Z',
  },
  {
    id: 'notif_010',
    recipientId: 'usr_001',
    title: 'New Vendor Registered',
    body: 'Pacific Supply Co has been added as a vendor by Sarah Chen.',
    type: 'general',
    data: { vendorId: 'ven_012' },
    isRead: true,
    createdAt: '2026-02-27T14:00:00Z',
  },

  // ── Older ─────────────────────────────────────────────────
  {
    id: 'notif_011',
    recipientId: 'usr_001',
    title: 'Inventory Adjustment Approved',
    body: 'Your adjustment for 20 units of Aluminum Sheets was approved.',
    type: 'inventory_approval',
    data: { adjustmentId: 'adj_001', itemId: 'item_002' },
    isRead: true,
    createdAt: '2026-02-25T10:30:00Z',
  },
  {
    id: 'notif_012',
    recipientId: 'usr_001',
    title: 'Payroll Processed',
    body: 'February 2026 payroll has been processed for 8 employees. Total: $34,500.',
    type: 'general',
    data: { payrollId: 'pr_feb_2026', total: 34500 },
    isRead: true,
    createdAt: '2026-02-24T16:00:00Z',
  },
  {
    id: 'notif_013',
    recipientId: 'usr_001',
    title: 'Delivery Route Optimized',
    body: '5 deliveries have been re-routed for the downtown zone, saving ~45 min.',
    type: 'delivery_update',
    data: { routeId: 'route_005', savings: 45 },
    isRead: true,
    createdAt: '2026-02-22T08:00:00Z',
  },
  {
    id: 'notif_014',
    recipientId: 'usr_001',
    title: 'System Backup Complete',
    body: 'Weekly system backup completed successfully at 3:00 AM.',
    type: 'general',
    data: null,
    isRead: true,
    createdAt: '2026-02-20T03:00:00Z',
  },
  {
    id: 'notif_015',
    recipientId: 'usr_001',
    title: 'Low Stock Alert',
    body: 'Rubber Gaskets (RBG-050) have dropped to 8 units. Consider reordering.',
    type: 'low_stock',
    data: { itemId: 'item_011', sku: 'RBG-050', quantityOnHand: 8 },
    isRead: true,
    createdAt: '2026-02-18T09:45:00Z',
  },
];
