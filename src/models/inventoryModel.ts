// ============================================================
// FINMATRIX - Inventory Validation Model
// ============================================================

import { Category, UnitOfMeasure, LocationId, InventoryItem } from '../dummy-data/inventoryItems';

// ─── Form Data ──────────────────────────────────────────────
export interface InventoryFormData {
  name: string;
  sku: string;
  description: string;
  category: Category;
  unitOfMeasure: UnitOfMeasure;
  costMethod: 'average';
  unitCost: number;
  sellingPrice: number;
  quantityOnHand: number;
  reorderPoint: number;
  reorderQuantity: number;
  minStock: number;
  maxStock: number;
  serialTracking: boolean;
  lotTracking: boolean;
  barcodeData: string;
  locationId: LocationId;
}

export interface InventoryValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

// ─── Validation ─────────────────────────────────────────────
export const validateInventoryItem = (
  data: InventoryFormData,
  existingItems: InventoryItem[],
  editingId?: string
): InventoryValidationResult => {
  const errors: Record<string, string> = {};

  // Name
  if (!data.name.trim()) {
    errors.name = 'Name is required';
  }

  // SKU
  if (!data.sku.trim()) {
    errors.sku = 'SKU is required';
  } else {
    const dup = existingItems.find(
      (i) => i.sku.toLowerCase() === data.sku.trim().toLowerCase() && i.itemId !== editingId
    );
    if (dup) {
      errors.sku = `SKU already in use by "${dup.name}"`;
    }
  }

  // Costs
  if (data.unitCost <= 0) {
    errors.unitCost = 'Unit cost must be greater than 0';
  }
  if (data.sellingPrice <= 0) {
    errors.sellingPrice = 'Selling price must be greater than 0';
  }

  // Stock
  if (data.quantityOnHand < 0) {
    errors.quantityOnHand = 'Quantity cannot be negative';
  }
  if (data.minStock < 0) {
    errors.minStock = 'Min stock cannot be negative';
  }
  if (data.maxStock <= 0) {
    errors.maxStock = 'Max stock must be greater than 0';
  }
  if (data.maxStock < data.minStock) {
    errors.maxStock = 'Max stock must be ≥ min stock';
  }
  if (data.reorderPoint < 0) {
    errors.reorderPoint = 'Reorder point cannot be negative';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};

// ─── Dropdown Options ───────────────────────────────────────
export const CATEGORY_OPTIONS = [
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Office Supplies', value: 'Office Supplies' },
  { label: 'Furniture', value: 'Furniture' },
  { label: 'Raw Materials', value: 'Raw Materials' },
  { label: 'Finished Goods', value: 'Finished Goods' },
];

export const UOM_OPTIONS = [
  { label: 'Each', value: 'each' },
  { label: 'Box', value: 'box' },
  { label: 'Kilogram', value: 'kg' },
  { label: 'Liter', value: 'liter' },
  { label: 'Set', value: 'set' },
];

export const LOCATION_OPTIONS = [
  { label: 'Warehouse 1', value: 'warehouse_1' },
  { label: 'Warehouse 2', value: 'warehouse_2' },
  { label: 'Store 1', value: 'store_1' },
];

export const LOCATION_LABELS: Record<string, string> = {
  warehouse_1: 'Warehouse 1',
  warehouse_2: 'Warehouse 2',
  store_1: 'Store 1',
};

// ─── Helpers ────────────────────────────────────────────────
export const generateSku = (existingItems: InventoryItem[]): string => {
  const nums = existingItems
    .map((i) => {
      const match = i.sku.match(/SKU-(\d+)/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => n > 0);
  const next = nums.length > 0 ? Math.max(...nums) + 1 : 1;
  return `SKU-${String(next).padStart(3, '0')}`;
};

export const calcMarkupPercent = (cost: number, sell: number): number => {
  if (cost <= 0) return 0;
  return Math.round(((sell - cost) / cost) * 100 * 100) / 100;
};

export const blankInventoryForm = (): InventoryFormData => ({
  name: '',
  sku: '',
  description: '',
  category: 'Finished Goods',
  unitOfMeasure: 'each',
  costMethod: 'average',
  unitCost: 0,
  sellingPrice: 0,
  quantityOnHand: 0,
  reorderPoint: 0,
  reorderQuantity: 0,
  minStock: 0,
  maxStock: 100,
  serialTracking: false,
  lotTracking: false,
  barcodeData: '',
  locationId: 'warehouse_1',
});
