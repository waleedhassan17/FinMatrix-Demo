// ============================================================
// FINMATRIX - Custom Redux Hooks
// ============================================================
import { useDispatch, useSelector, TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from '../store/store';

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

/** Convenience hook – returns the full auth slice from Redux */
export const useAuth = () => useAppSelector((state) => state.auth);

/** Returns the active company ID – use in screens to filter data by company */
export const useActiveCompanyId = () =>
  useAppSelector((state) => state.company.activeCompanyId);

/** Returns the active company object (or undefined) */
export const useActiveCompany = () =>
  useAppSelector((state) => {
    const { companies, activeCompanyId } = state.company;
    return companies.find((c) => c.companyId === activeCompanyId);
  });
