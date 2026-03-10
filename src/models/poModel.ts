// ============================================================
// FINMATRIX - Purchase Order Model (Validation & Calculations)
// ============================================================
import { PurchaseOrder, POLine } from '../dummy-data/purchaseOrders';

/* ── Tax Rate Options ────────────────────────────────────── */
export const PO_TAX_RATE_OPTIONS = [
  { label: '0%', value: 0 },
  { label: '5%', value: 5 },
  { label: '10%', value: 10 },
  { label: '15%', value: 15 },
];

/* ── Inventory Items Catalog (for PO line dropdowns) ─────── */
export const INVENTORY_ITEMS = [
  { itemId: 'item_001', itemName: 'Printer Paper (Box)', unitCost: 25 },
  { itemId: 'item_002', itemName: 'Toner Cartridge', unitCost: 45 },
  { itemId: 'item_003', itemName: 'USB-C Docking Station', unitCost: 180 },
  { itemId: 'item_004', itemName: 'Wireless Keyboard', unitCost: 95 },
  { itemId: 'item_005', itemName: 'Monitor Stand', unitCost: 42 },
  { itemId: 'item_006', itemName: 'Server Rack (42U)', unitCost: 1200 },
  { itemId: 'item_007', itemName: 'UPS Battery Backup', unitCost: 350 },
  { itemId: 'item_008', itemName: 'Standing Desk Frame', unitCost: 320 },
  { itemId: 'item_009', itemName: 'Desktop Surface (60")', unitCost: 110 },
  { itemId: 'item_010', itemName: 'Hand Sanitizer (Gallon)', unitCost: 18 },
  { itemId: 'item_011', itemName: 'Disinfectant Wipes', unitCost: 8 },
  { itemId: 'item_012', itemName: 'Trash Bags (50 Gal)', unitCost: 22 },
  { itemId: 'item_013', itemName: 'Laptop (Dell Latitude)', unitCost: 1100 },
  { itemId: 'item_014', itemName: 'Laptop Bag', unitCost: 35 },
  { itemId: 'item_015', itemName: 'Wireless Mouse', unitCost: 50 },
  { itemId: 'item_016', itemName: 'Ethernet Cable (50ft)', unitCost: 12 },
  { itemId: 'item_017', itemName: 'Network Switch (24-port)', unitCost: 420 },
  { itemId: 'item_018', itemName: 'Patch Panel (48-port)', unitCost: 65 },
  { itemId: 'item_019', itemName: 'Whiteboard (6x4)', unitCost: 150 },
  { itemId: 'item_020', itemName: 'Whiteboard Markers (12pk)', unitCost: 14 },
  { itemId: 'item_021', itemName: 'Office Chair (Ergonomic)', unitCost: 890 },
  { itemId: 'item_022', itemName: 'Floor Mat', unitCost: 55 },
  { itemId: 'item_023', itemName: 'Floor Cleaner (5 Gal)', unitCost: 48 },
  { itemId: 'item_024', itemName: 'Mop Head (Commercial)', unitCost: 15 },
];

export const ITEM_DROPDOWN_OPTIONS = INVENTORY_ITEMS.map((i) => ({
  label: `${i.itemName} ($${i.unitCost.toFixed(2)})`,
  value: i.itemId,
}));

/* ── Blank line factory ──────────────────────────────────── */
export const blankPOLine = (): POLine => ({
  lineId: `pol_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  itemId: null,
  itemName: '',
  description: '',
  quantity: 1,
  receivedQuantity: 0,
  unitCost: 0,
  amount: 0,
  taxRate: 10,
});

/* ── Calculations ────────────────────────────────────────── */
export const calcPOTotals = (
  lines: POLine[],
): { subtotal: number; taxAmount: number; total: number } => {
  let subtotal = 0;
  let taxAmount = 0;

  for (const line of lines) {
    const lineAmount = line.quantity * line.unitCost;
    subtotal += lineAmount;
    taxAmount += lineAmount * (line.taxRate / 100);
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    taxAmount: Math.round(taxAmount * 100) / 100,
    total: Math.round((subtotal + taxAmount) * 100) / 100,
  };
};

/* ── Validation ──────────────────────────────────────────── */
export const validatePO = (
  po: Partial<PurchaseOrder>,
): string[] => {
  const errors: string[] = [];

  if (!po.vendorId) errors.push('Vendor is required.');
  if (!po.date) errors.push('PO date is required.');
  if (!po.expectedDate) errors.push('Expected delivery date is required.');

  if (!po.lines || po.lines.length === 0) {
    errors.push('At least one line item is required.');
  } else {
    po.lines.forEach((line, i) => {
      if (!line.itemId && !line.itemName?.trim())
        errors.push(`Line ${i + 1}: Item is required.`);
      if (line.quantity <= 0)
        errors.push(`Line ${i + 1}: Quantity must be greater than 0.`);
      if (line.unitCost <= 0)
        errors.push(`Line ${i + 1}: Unit cost must be greater than 0.`);
    });
  }

  return errors;
};

/* ── Get item info from catalog ──────────────────────────── */
export const getItemById = (itemId: string) =>
  INVENTORY_ITEMS.find((i) => i.itemId === itemId);
