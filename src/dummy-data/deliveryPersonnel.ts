// ============================================================
// FINMATRIX - Delivery Personnel Dummy Data  (5 persons)
// ============================================================

export interface DeliveryPerson {
  userId: string;
  displayName: string;
  email: string;
  phone: string;
  password: string;
  role: 'delivery';
  companyId: string;
  isAvailable: boolean;
  currentLoad: number;
  maxLoad: number;
  rating: number;
  totalDeliveries: number;
  onTimeRate: number;
  photoUrl: string | null;
  status: 'active' | 'inactive' | 'on_leave';
  vehicleType: 'motorcycle' | 'van' | 'truck';
  vehicleNumber: string;
  zones: string[];
  joinedAt: string;
}

export const deliveryPersonnel: DeliveryPerson[] = [
  {
    userId: 'dp_001',
    displayName: 'Imran Sheikh',
    email: 'imran@finmatrix.pk',
    phone: '+92-301-1112233',
    password: 'deliver123',
    role: 'delivery',
    companyId: 'company_1',
    isAvailable: true,
    currentLoad: 3,
    maxLoad: 15,
    rating: 4.8,
    totalDeliveries: 245,
    onTimeRate: 96,
    photoUrl: null,
    status: 'active',
    vehicleType: 'motorcycle',
    vehicleNumber: 'LHR-1234',
    zones: ['Zone A', 'Zone B'],
    joinedAt: '2025-06-15T09:00:00Z',
  },
  {
    userId: 'dp_002',
    displayName: 'Hassan Raza',
    email: 'hassan@finmatrix.pk',
    phone: '+92-302-4445566',
    password: 'deliver123',
    role: 'delivery',
    companyId: 'company_1',
    isAvailable: true,
    currentLoad: 5,
    maxLoad: 15,
    rating: 4.5,
    totalDeliveries: 189,
    onTimeRate: 92,
    photoUrl: null,
    status: 'active',
    vehicleType: 'van',
    vehicleNumber: 'LHR-5678',
    zones: ['Zone B', 'Zone C'],
    joinedAt: '2025-07-20T09:00:00Z',
  },
  {
    userId: 'dp_003',
    displayName: 'Usman Tariq',
    email: 'usman@finmatrix.pk',
    phone: '+92-303-7778899',
    password: 'deliver123',
    role: 'delivery',
    companyId: 'company_1',
    isAvailable: false,
    currentLoad: 0,
    maxLoad: 15,
    rating: 4.2,
    totalDeliveries: 156,
    onTimeRate: 88,
    photoUrl: null,
    status: 'on_leave',
    vehicleType: 'motorcycle',
    vehicleNumber: 'FSD-9012',
    zones: ['Zone A'],
    joinedAt: '2025-08-10T09:00:00Z',
  },
  {
    userId: 'dp_004',
    displayName: 'Ali Abbas',
    email: 'ali@finmatrix.pk',
    phone: '+92-304-1234567',
    password: 'deliver123',
    role: 'delivery',
    companyId: 'company_1',
    isAvailable: true,
    currentLoad: 7,
    maxLoad: 15,
    rating: 4.6,
    totalDeliveries: 312,
    onTimeRate: 94,
    photoUrl: null,
    status: 'active',
    vehicleType: 'truck',
    vehicleNumber: 'ISB-3456',
    zones: ['Zone C', 'Zone D'],
    joinedAt: '2025-05-01T09:00:00Z',
  },
  {
    userId: 'dp_005',
    displayName: 'Kamran Malik',
    email: 'kamran@finmatrix.pk',
    phone: '+92-305-9876543',
    password: 'deliver123',
    role: 'delivery',
    companyId: 'company_1',
    isAvailable: true,
    currentLoad: 2,
    maxLoad: 15,
    rating: 4.9,
    totalDeliveries: 278,
    onTimeRate: 97,
    photoUrl: null,
    status: 'active',
    vehicleType: 'motorcycle',
    vehicleNumber: 'LHR-7890',
    zones: ['Zone A', 'Zone D'],
    joinedAt: '2025-09-05T09:00:00Z',
  },
];
