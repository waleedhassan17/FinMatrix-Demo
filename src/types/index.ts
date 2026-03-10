// ============================================================
// FINMATRIX - Type Definitions
// ============================================================

// ---- User & Auth Types ----
export type UserRole = 'administrator' | 'delivery_personnel';

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyId: string;
  phoneNumber?: string;
  photoURL?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt: string;
  isActive: boolean;
  fcmToken?: string;
}

export interface Company {
  companyId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  fiscalYearStart: string;
  currency: string;
  taxId?: string;
  industry?: string;
  createdAt: string;
  settings: CompanySettings;
}

export interface CompanySettings {
  dateFormat: string;
  numberFormat: string;
  defaultPaymentTerms: string;
  invoicePrefix: string;
  poPrefix: string;
  soPrefix: string;
}

// ---- Auth State Types ----
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  selectedRole: UserRole | null;
  isOnboarded: boolean;
  error: string | null;
  signUpSuccess: boolean;
}

// ---- Navigation Types ----
export type RootStackParamList = {
  Onboarding: undefined;
  RoleSelection: undefined;
  SignIn: { role: UserRole };
  SignUp: { role: UserRole };
  ForgotPassword: { role: UserRole };
  AdminMain: undefined;
  DeliveryMain: undefined;
};

export type AdminTabParamList = {
  Dashboard: undefined;
  Transactions: undefined;
  Reports: undefined;
  Inventory: undefined;
  More: undefined;
};

export type DeliveryTabParamList = {
  DeliveryDashboard: undefined;
  MyDeliveries: undefined;
  ShadowInventory: undefined;
  DeliveryProfile: undefined;
};

// ---- Accounting Types ----
export type AccountType = 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';

export interface Account {
  accountId: string;
  companyId: string;
  accountNumber: string;
  name: string;
  type: AccountType;
  subType: string;
  parentAccountId?: string;
  description: string;
  isActive: boolean;
  openingBalance: number;
  currentBalance: number;
}

export interface JournalEntry {
  entryId: string;
  companyId: string;
  date: string;
  reference: string;
  memo: string;
  lines: JournalLine[];
  status: 'draft' | 'posted' | 'void';
  createdBy: string;
  createdAt: string;
}

export interface JournalLine {
  accountId: string;
  accountName: string;
  debit: number;
  credit: number;
  memo?: string;
}

// ---- Customer & Vendor Types ----
export interface Customer {
  customerId: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  billingAddress: Address;
  shippingAddress: Address;
  creditLimit: number;
  paymentTerms: string;
  balance: number;
  isActive: boolean;
}

export interface Vendor {
  vendorId: string;
  companyId: string;
  name: string;
  email: string;
  phone: string;
  address: Address;
  paymentTerms: string;
  balance: number;
  taxId?: string;
  isActive: boolean;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

// ---- Invoice Types ----
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';

export interface Invoice {
  invoiceId: string;
  companyId: string;
  customerId: string;
  customerName: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  lines: InvoiceLine[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  total: number;
  amountPaid: number;
  status: InvoiceStatus;
  notes: string;
  createdAt: string;
}

export interface InvoiceLine {
  lineId: string;
  itemId?: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate: number;
}

// ---- Inventory Types ----
export type CostMethod = 'fifo' | 'lifo' | 'average' | 'specific';

export interface InventoryItem {
  itemId: string;
  companyId: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  unitOfMeasure: string;
  costMethod: CostMethod;
  unitCost: number;
  sellingPrice: number;
  quantityOnHand: number;
  quantityOnOrder: number;
  quantityCommitted: number;
  reorderPoint: number;
  reorderQuantity: number;
  minStock: number;
  maxStock: number;
  isActive: boolean;
  serialTracking: boolean;
  lotTracking: boolean;
  barcodeData?: string;
  locationId?: string;
  imageUrl?: string;
  sourceAgencyId?: string;
}

export interface ShadowInventory {
  shadowId: string;
  companyId: string;
  deliveryPersonId: string;
  itemId: string;
  itemName: string;
  originalQuantity: number;
  currentQuantity: number;
  changes: ShadowInventoryChange[];
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ShadowInventoryChange {
  changeId: string;
  deliveryId: string;
  quantityChanged: number;
  reason: string;
  timestamp: string;
}

// ---- Delivery Types ----
export type DeliveryStatus = 'pending' | 'picked_up' | 'in_transit' | 'arrived' | 'delivered' | 'failed' | 'returned';

export interface DeliveryAssignment {
  assignmentId: string;
  companyId: string;
  date: string;
  deliveryPersonId: string;
  deliveryPersonName: string;
  deliveries: string[];
  status: 'active' | 'completed' | 'cancelled';
  createdBy: string;
  createdAt: string;
}

export interface Delivery {
  deliveryId: string;
  companyId: string;
  assignmentId: string;
  customerId: string;
  customerName: string;
  customerAddress: Address;
  customerPhone: string;
  items: DeliveryItem[];
  status: DeliveryStatus;
  deliveryPersonId: string;
  signatureUrl?: string;
  signedAt?: string;
  customerVerified: boolean;
  customerVerifiedAt?: string;
  notes: string;
  photoUrls: string[];
  deliveredAt?: string;
  createdAt: string;
}

export interface DeliveryItem {
  itemId: string;
  itemName: string;
  quantity: number;
  description: string;
}

export interface InventoryUpdateRequest {
  requestId: string;
  companyId: string;
  deliveryId: string;
  deliveryPersonId: string;
  deliveryPersonName: string;
  changes: InventoryChange[];
  status: 'pending' | 'approved' | 'rejected';
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  createdAt: string;
}

export interface InventoryChange {
  itemId: string;
  itemName: string;
  quantityDelivered: number;
  quantityReturned: number;
}

// ---- Employee & Payroll Types ----
export interface Employee {
  employeeId: string;
  companyId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  department: string;
  position: string;
  hireDate: string;
  payType: 'salary' | 'hourly';
  payRate: number;
  isActive: boolean;
}

// ---- Report Types ----
export interface FinancialReport {
  reportType: string;
  title: string;
  dateRange: { start: string; end: string };
  data: any;
  generatedAt: string;
}

// ---- Notification Types ----
export interface AppNotification {
  notificationId: string;
  companyId: string;
  recipientId: string;
  title: string;
  body: string;
  type: 'delivery_update' | 'inventory_approval' | 'invoice_overdue' | 'low_stock' | 'general';
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}
