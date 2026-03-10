// ============================================================
// FINMATRIX - Pre-seeded Warehouse Agencies
// ============================================================

export interface AgencyInventoryItem {
  itemId: string;
  name: string;
  sku: string;
  unitCost: number;
  sellingPrice: number;
  quantityOnHand: number;
  reorderPoint: number;
}

export interface AgencyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface WarehouseAgency {
  agencyId: string;
  companyId: string;
  name: string;
  type: 'manufacturing' | 'supply' | 'distribution';
  description: string;
  address: AgencyAddress;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  inventoryItems: AgencyInventoryItem[];
  isActive: boolean;
  createdAt: string;
}

export const preSeededAgencies: WarehouseAgency[] = [
  {
    agencyId: 'agency_dalda',
    companyId: '',
    name: 'Dalda Cooking Oil',
    type: 'manufacturing',
    description: 'Premium cooking oil manufacturing and distribution',
    address: {
      street: 'Industrial Area Block 7',
      city: 'Karachi',
      state: 'Sindh',
      zipCode: '75500',
    },
    contactPerson: 'Ahmed Khan',
    contactPhone: '+92-321-1234567',
    contactEmail: 'ops@dalda.pk',
    inventoryItems: [
      {
        itemId: 'dalda_001',
        name: 'Dalda Cooking Oil 1L',
        sku: 'DCO-1L',
        unitCost: 450,
        sellingPrice: 520,
        quantityOnHand: 500,
        reorderPoint: 100,
      },
      {
        itemId: 'dalda_002',
        name: 'Dalda Cooking Oil 5L',
        sku: 'DCO-5L',
        unitCost: 2100,
        sellingPrice: 2450,
        quantityOnHand: 200,
        reorderPoint: 50,
      },
      {
        itemId: 'dalda_003',
        name: 'Dalda Banaspati Ghee 1kg',
        sku: 'DBG-1K',
        unitCost: 580,
        sellingPrice: 650,
        quantityOnHand: 350,
        reorderPoint: 80,
      },
      {
        itemId: 'dalda_004',
        name: 'Dalda Banaspati Ghee 2.5kg',
        sku: 'DBG-2.5K',
        unitCost: 1400,
        sellingPrice: 1580,
        quantityOnHand: 150,
        reorderPoint: 40,
      },
      {
        itemId: 'dalda_005',
        name: 'Dalda Sunflower Oil 1L',
        sku: 'DSO-1L',
        unitCost: 520,
        sellingPrice: 600,
        quantityOnHand: 300,
        reorderPoint: 70,
      },
    ],
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    agencyId: 'agency_water',
    companyId: '',
    name: 'AquaPure Water Supply',
    type: 'supply',
    description: 'Mineral water bottles and dispensers supply chain',
    address: {
      street: 'Main Boulevard Phase 5',
      city: 'Lahore',
      state: 'Punjab',
      zipCode: '54000',
    },
    contactPerson: 'Bilal Hussain',
    contactPhone: '+92-300-9876543',
    contactEmail: 'supply@aquapure.pk',
    inventoryItems: [
      {
        itemId: 'water_001',
        name: 'AquaPure 500ml Pack (24)',
        sku: 'AP-500-24',
        unitCost: 280,
        sellingPrice: 360,
        quantityOnHand: 800,
        reorderPoint: 200,
      },
      {
        itemId: 'water_002',
        name: 'AquaPure 1.5L Pack (6)',
        sku: 'AP-1500-6',
        unitCost: 320,
        sellingPrice: 400,
        quantityOnHand: 600,
        reorderPoint: 150,
      },
      {
        itemId: 'water_003',
        name: 'AquaPure 19L Dispenser Bottle',
        sku: 'AP-19L',
        unitCost: 120,
        sellingPrice: 180,
        quantityOnHand: 1000,
        reorderPoint: 300,
      },
      {
        itemId: 'water_004',
        name: 'AquaPure 330ml Pack (12)',
        sku: 'AP-330-12',
        unitCost: 180,
        sellingPrice: 240,
        quantityOnHand: 400,
        reorderPoint: 100,
      },
      {
        itemId: 'water_005',
        name: 'AquaPure 5L Bottle',
        sku: 'AP-5L',
        unitCost: 90,
        sellingPrice: 130,
        quantityOnHand: 700,
        reorderPoint: 200,
      },
    ],
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    agencyId: 'agency_detergent',
    companyId: '',
    name: 'SparkClean Detergents',
    type: 'distribution',
    description: 'Household cleaning products and detergents distribution',
    address: {
      street: 'SITE Industrial Area',
      city: 'Faisalabad',
      state: 'Punjab',
      zipCode: '38000',
    },
    contactPerson: 'Farhan Ali',
    contactPhone: '+92-333-5556677',
    contactEmail: 'dist@sparkclean.pk',
    inventoryItems: [
      {
        itemId: 'det_001',
        name: 'SparkClean Washing Powder 1kg',
        sku: 'SC-WP-1K',
        unitCost: 220,
        sellingPrice: 280,
        quantityOnHand: 600,
        reorderPoint: 150,
      },
      {
        itemId: 'det_002',
        name: 'SparkClean Liquid Detergent 1L',
        sku: 'SC-LD-1L',
        unitCost: 350,
        sellingPrice: 420,
        quantityOnHand: 400,
        reorderPoint: 100,
      },
      {
        itemId: 'det_003',
        name: 'SparkClean Dishwash Bar 3-Pack',
        sku: 'SC-DW-3P',
        unitCost: 150,
        sellingPrice: 200,
        quantityOnHand: 800,
        reorderPoint: 200,
      },
      {
        itemId: 'det_004',
        name: 'SparkClean Floor Cleaner 500ml',
        sku: 'SC-FC-500',
        unitCost: 180,
        sellingPrice: 230,
        quantityOnHand: 350,
        reorderPoint: 80,
      },
      {
        itemId: 'det_005',
        name: 'SparkClean Bleach 1L',
        sku: 'SC-BL-1L',
        unitCost: 130,
        sellingPrice: 170,
        quantityOnHand: 500,
        reorderPoint: 120,
      },
    ],
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
];
