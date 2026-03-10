// ============================================================
// FINMATRIX - Redux Store Configuration
// ============================================================
import { configureStore, combineReducers } from '@reduxjs/toolkit';
import authReducer from '../screens/auth/authSlice';
import coaReducer from '../screens/ChartOfAccounts/coaSlice';
import glReducer from '../screens/GeneralLedger/glSlice';
import jeReducer from '../screens/JournalEntries/jeSlice';
import customersReducer from '../screens/Customers/customerSlice';
import invoicesReducer from '../screens/Invoices/invoiceSlice';
import paymentsReducer from '../screens/Payments/paymentSlice';
import estimatesReducer from '../screens/Estimates/estimateSlice';
import salesOrdersReducer from '../screens/SalesOrders/soSlice';
import creditMemosReducer from '../screens/CreditMemos/creditMemoSlice';
import vendorsReducer from '../screens/Vendors/vendorSlice';
import billsReducer from '../screens/Bills/billSlice';
import purchaseOrdersReducer from '../screens/PurchaseOrders/poSlice';
import bankingReducer from '../screens/Banking/bankingSlice';
import inventoryReducer from '../screens/Inventory/inventorySlice';
import deliveryReducer from './deliverySlice';
import employeesReducer from '../screens/Employees/employeeSlice';
import payrollReducer from '../screens/Payroll/payrollSlice';
import taxReducer from '../screens/Tax/taxSlice';
import homeScreenReducer from '../screens/HomeScreen/homeScreenSlice';
import budgetsReducer from '../screens/Budgets/budgetSlice';
import notificationsReducer from '../screens/Notifications/notificationSlice';
import settingsReducer from '../screens/Settings/settingsSlice';
import auditTrailReducer from '../screens/AuditTrail/auditTrailSlice';
import companyReducer from './companySlice';
import { realtimeMiddleware } from './realtimeMiddleware';

const rootReducer = combineReducers({
  auth: authReducer,
  company: companyReducer,
  coa: coaReducer,
  gl: glReducer,
  je: jeReducer,
  customers: customersReducer,
  invoices: invoicesReducer,
  payments: paymentsReducer,
  estimates: estimatesReducer,
  salesOrders: salesOrdersReducer,
  creditMemos: creditMemosReducer,
  vendors: vendorsReducer,
  bills: billsReducer,
  purchaseOrders: purchaseOrdersReducer,
  banking: bankingReducer,
  inventory: inventoryReducer,
  delivery: deliveryReducer,
  employees: employeesReducer,
  payroll: payrollReducer,
  tax: taxReducer,
  homeScreen: homeScreenReducer,
  budgets: budgetsReducer,
  notifications: notificationsReducer,
  settings: settingsReducer,
  auditTrail: auditTrailReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore redux-persist actions
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(realtimeMiddleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
