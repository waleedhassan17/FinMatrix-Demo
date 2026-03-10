// ============================================================
// FINMATRIX - Company Redux Slice
// ============================================================
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WarehouseAgency } from '../dummy-data/warehouseAgencies';
import type { RootState } from './store';

export interface CompanyAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface CompanyMember {
  userId: string;
  displayName?: string;
  role: 'administrator' | 'delivery_personnel';
  joinedAt: string;
}

export interface Company {
  companyId: string;
  name: string;
  industry: string;
  legalStructure?: string;
  address: CompanyAddress;
  phone: string;
  email: string;
  website?: string;
  taxId: string;
  logo: string;
  inviteCode: string;
  fiscalYearStart?: string;
  currency?: string;
  dateFormat?: string;
  coaTemplate?: string;
  agencies: WarehouseAgency[];
  members: CompanyMember[];
  createdAt: string;
  lastAccessedAt?: string;
}

export interface CompanyState {
  companies: Company[];
  activeCompanyId: string | null;
  isLoading: boolean;
}

const initialState: CompanyState = {
  companies: [],
  activeCompanyId: null,
  isLoading: false,
};

const generateCompanyId = (): string => {
  return `company_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
};

const generateInviteCode = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const companySlice = createSlice({
  name: 'company',
  initialState,
  reducers: {
    createCompany: (
      state,
      action: PayloadAction<{
        name: string;
        industry: string;
        address: CompanyAddress;
        phone: string;
        email: string;
        taxId: string;
        agencies: WarehouseAgency[];
        userId: string;
        userRole: 'administrator' | 'delivery_personnel';
        legalStructure?: string;
        website?: string;
        fiscalYearStart?: string;
        currency?: string;
        dateFormat?: string;
        coaTemplate?: string;
      }>
    ) => {
      const companyId = generateCompanyId();
      const inviteCode = generateInviteCode();
      const now = new Date().toISOString();

      const agenciesWithCompany = action.payload.agencies.map((a) => ({
        ...a,
        companyId,
      }));

      const newCompany: Company = {
        companyId,
        name: action.payload.name,
        industry: action.payload.industry,
        legalStructure: action.payload.legalStructure,
        address: action.payload.address,
        phone: action.payload.phone,
        email: action.payload.email,
        website: action.payload.website,
        taxId: action.payload.taxId,
        logo: '',
        inviteCode,
        fiscalYearStart: action.payload.fiscalYearStart,
        currency: action.payload.currency,
        dateFormat: action.payload.dateFormat,
        coaTemplate: action.payload.coaTemplate,
        agencies: agenciesWithCompany,
        members: [
          {
            userId: action.payload.userId,
            role: action.payload.userRole,
            joinedAt: now,
          },
        ],
        createdAt: now,
        lastAccessedAt: now,
      };

      state.companies.push(newCompany);
      state.activeCompanyId = companyId;
    },

    joinCompany: (
      state,
      action: PayloadAction<{
        inviteCode: string;
        userId: string;
        userRole: 'administrator' | 'delivery_personnel';
      }>
    ) => {
      const company = state.companies.find(
        (c) => c.inviteCode === action.payload.inviteCode
      );
      if (company) {
        const alreadyMember = company.members.some(
          (m) => m.userId === action.payload.userId
        );
        if (!alreadyMember) {
          company.members.push({
            userId: action.payload.userId,
            role: action.payload.userRole,
            joinedAt: new Date().toISOString(),
          });
        }
        state.activeCompanyId = company.companyId;
        company.lastAccessedAt = new Date().toISOString();
      }
    },

    setActiveCompany: (state, action: PayloadAction<string>) => {
      state.activeCompanyId = action.payload;
    },

    switchCompany: (state, action: PayloadAction<string>) => {
      const company = state.companies.find(
        (c) => c.companyId === action.payload
      );
      if (company) {
        state.activeCompanyId = action.payload;
        company.lastAccessedAt = new Date().toISOString();
      }
    },

    updateCompany: (
      state,
      action: PayloadAction<{
        companyId: string;
        updates: Partial<Omit<Company, 'companyId' | 'inviteCode' | 'members' | 'agencies' | 'createdAt'>>;
      }>
    ) => {
      const company = state.companies.find(
        (c) => c.companyId === action.payload.companyId
      );
      if (company) {
        Object.assign(company, action.payload.updates);
      }
    },

    deleteCompany: (state, action: PayloadAction<string>) => {
      state.companies = state.companies.filter(
        (c) => c.companyId !== action.payload
      );
      if (state.activeCompanyId === action.payload) {
        state.activeCompanyId =
          state.companies.length > 0 ? state.companies[0].companyId : null;
      }
    },

    addMember: (
      state,
      action: PayloadAction<{
        companyId: string;
        member: CompanyMember;
      }>
    ) => {
      const company = state.companies.find(
        (c) => c.companyId === action.payload.companyId
      );
      if (company) {
        const alreadyMember = company.members.some(
          (m) => m.userId === action.payload.member.userId
        );
        if (!alreadyMember) {
          company.members.push(action.payload.member);
        }
      }
    },

    removeMember: (
      state,
      action: PayloadAction<{ companyId: string; userId: string }>
    ) => {
      const company = state.companies.find(
        (c) => c.companyId === action.payload.companyId
      );
      if (company) {
        company.members = company.members.filter(
          (m) => m.userId !== action.payload.userId
        );
      }
    },

    updateMemberRole: (
      state,
      action: PayloadAction<{
        companyId: string;
        userId: string;
        role: 'administrator' | 'delivery_personnel';
      }>
    ) => {
      const company = state.companies.find(
        (c) => c.companyId === action.payload.companyId
      );
      if (company) {
        const member = company.members.find(
          (m) => m.userId === action.payload.userId
        );
        if (member) {
          member.role = action.payload.role;
        }
      }
    },

    addAgency: (
      state,
      action: PayloadAction<{ companyId: string; agency: WarehouseAgency }>
    ) => {
      const company = state.companies.find(
        (c) => c.companyId === action.payload.companyId
      );
      if (company) {
        company.agencies.push({
          ...action.payload.agency,
          companyId: action.payload.companyId,
        });
      }
    },

    removeAgency: (
      state,
      action: PayloadAction<{ companyId: string; agencyId: string }>
    ) => {
      const company = state.companies.find(
        (c) => c.companyId === action.payload.companyId
      );
      if (company) {
        company.agencies = company.agencies.filter(
          (a) => a.agencyId !== action.payload.agencyId
        );
      }
    },

    updateAgency: (
      state,
      action: PayloadAction<{ companyId: string; agencyId: string; updates: Partial<WarehouseAgency> }>
    ) => {
      const company = state.companies.find(
        (c) => c.companyId === action.payload.companyId
      );
      if (company) {
        const idx = company.agencies.findIndex(
          (a) => a.agencyId === action.payload.agencyId
        );
        if (idx !== -1) {
          company.agencies[idx] = { ...company.agencies[idx], ...action.payload.updates };
        }
      }
    },

    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

// Selectors
export const selectActiveCompany = (state: RootState): Company | undefined =>
  state.company.companies.find(
    (c) => c.companyId === state.company.activeCompanyId
  );

export const selectActiveCompanyId = (state: RootState): string | null =>
  state.company.activeCompanyId;

export const selectUserCompanies = (state: RootState): Company[] =>
  state.company.companies;

export const {
  createCompany,
  joinCompany,
  setActiveCompany,
  switchCompany,
  updateCompany,
  deleteCompany,
  addMember,
  removeMember,
  updateMemberRole,
  addAgency,
  removeAgency,
  updateAgency,
  setLoading,
} = companySlice.actions;

export default companySlice.reducer;
