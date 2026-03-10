import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../navigations-map/Base';
import MoreHubScreen from '../../screens/More/MoreHubScreen';
import COAListScreen from '../../screens/ChartOfAccounts/COAListScreen';
import COAFormScreen from '../../screens/ChartOfAccounts/COAFormScreen';
import COADetailScreen from '../../screens/ChartOfAccounts/COADetailScreen';
import GLScreen from '../../screens/GeneralLedger/GLScreen';
import JEListScreen from '../../screens/JournalEntries/JEListScreen';
import JEFormScreen from '../../screens/JournalEntries/JEFormScreen';
import JEDetailScreen from '../../screens/JournalEntries/JEDetailScreen';
import CustomerListScreen from '../../screens/Customers/CustomerListScreen';
import CustomerFormScreen from '../../screens/Customers/CustomerFormScreen';
import CustomerDetailScreen from '../../screens/Customers/CustomerDetailScreen';
import VendorListScreen from '../../screens/Vendors/VendorListScreen';
import VendorFormScreen from '../../screens/Vendors/VendorFormScreen';
import VendorDetailScreen from '../../screens/Vendors/VendorDetailScreen';
import BankAccountsScreen from '../../screens/Banking/BankAccountsScreen';
import BankRegisterScreen from '../../screens/Banking/BankRegisterScreen';
import AddTransactionScreen from '../../screens/Banking/AddTransactionScreen';
import TransferScreen from '../../screens/Banking/TransferScreen';
import ReconciliationScreen from '../../screens/Banking/ReconciliationScreen';
import ReconciliationHistoryScreen from '../../screens/Banking/ReconciliationHistoryScreen';
import DeliveryManagementScreen from '../../screens/Delivery/Admin/DeliveryManagementScreen';
import AdminDeliveryDetailScreen from '../../screens/Delivery/Admin/AdminDeliveryDetailScreen';
import DeliveryAnalyticsScreen from '../../screens/Delivery/Admin/DeliveryAnalyticsScreen';
import DeliveryPersonnelListScreen from '../../screens/Delivery/Admin/DeliveryPersonnelListScreen';
import DeliveryPersonnelDetailScreen from '../../screens/Delivery/Admin/DeliveryPersonnelDetailScreen';
import AddDeliveryPersonnelScreen from '../../screens/Delivery/Admin/AddDeliveryPersonnelScreen';
import AssignWorkScreen from '../../screens/Delivery/Admin/AssignWorkScreen';
import EmployeeListScreen from '../../screens/Employees/EmployeeListScreen';
import EmployeeFormScreen from '../../screens/Employees/EmployeeFormScreen';
import EmployeeDetailScreen from '../../screens/Employees/EmployeeDetailScreen';
import RunPayrollScreen from '../../screens/Payroll/RunPayrollScreen';
import PayrollHistoryScreen from '../../screens/Payroll/PayrollHistoryScreen';
import PayStubScreen from '../../screens/Payroll/PayStubScreen';
import TaxSettingsScreen from '../../screens/Tax/TaxSettingsScreen';
import TaxLiabilityScreen from '../../screens/Tax/TaxLiabilityScreen';
import TaxPaymentScreen from '../../screens/Tax/TaxPaymentScreen';
import SettingsScreen from '../../screens/Settings/SettingsScreen';
import CompanyProfileScreen from '../../screens/Settings/CompanyProfileScreen';
import UserManagementScreen from '../../screens/Settings/UserManagementScreen';
import AuditTrailScreen from '../../screens/AuditTrail/AuditTrailScreen';
import AgencyListScreen from '../../screens/Agency/AgencyListScreen';
import AgencyDetailScreen from '../../screens/Agency/AgencyDetailScreen';
import AgencyFormScreen from '../../screens/Agency/AgencyFormScreen';
import AgencyInventorySyncScreen from '../../screens/Agency/AgencyInventorySyncScreen';

const Stack = createNativeStackNavigator();

const MoreStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.ADMIN_MORE_HUB} component={MoreHubScreen} />
    <Stack.Screen name={ROUTES.CHART_OF_ACCOUNTS} component={COAListScreen} />
    <Stack.Screen name={ROUTES.COA_FORM} component={COAFormScreen} />
    <Stack.Screen name={ROUTES.COA_DETAIL} component={COADetailScreen} />
    <Stack.Screen name={ROUTES.GENERAL_LEDGER} component={GLScreen} />
    <Stack.Screen name={ROUTES.JE_LIST} component={JEListScreen} />
    <Stack.Screen name={ROUTES.JE_FORM} component={JEFormScreen} />
    <Stack.Screen name={ROUTES.JE_DETAIL} component={JEDetailScreen} />
    <Stack.Screen name={ROUTES.CUSTOMER_LIST} component={CustomerListScreen} />
    <Stack.Screen name={ROUTES.CUSTOMER_FORM} component={CustomerFormScreen} />
    <Stack.Screen name={ROUTES.CUSTOMER_DETAIL} component={CustomerDetailScreen} />
    <Stack.Screen name={ROUTES.VENDOR_LIST} component={VendorListScreen} />
    <Stack.Screen name={ROUTES.VENDOR_FORM} component={VendorFormScreen} />
    <Stack.Screen name={ROUTES.VENDOR_DETAIL} component={VendorDetailScreen} />
    {/* Banking */}
    <Stack.Screen name={ROUTES.BANK_ACCOUNTS} component={BankAccountsScreen} />
    <Stack.Screen name={ROUTES.BANK_REGISTER} component={BankRegisterScreen} />
    <Stack.Screen name={ROUTES.ADD_TRANSACTION} component={AddTransactionScreen} />
    <Stack.Screen name={ROUTES.BANK_TRANSFER} component={TransferScreen} />
    <Stack.Screen name={ROUTES.RECONCILIATION} component={ReconciliationScreen} />
    <Stack.Screen name={ROUTES.RECONCILIATION_HISTORY} component={ReconciliationHistoryScreen} />
    {/* Delivery Admin */}
    <Stack.Screen name={ROUTES.DELIVERY_MANAGEMENT} component={DeliveryManagementScreen} />
    <Stack.Screen name={ROUTES.ADMIN_DELIVERY_DETAIL} component={AdminDeliveryDetailScreen} />
    <Stack.Screen name={ROUTES.DELIVERY_ANALYTICS} component={DeliveryAnalyticsScreen} />
    <Stack.Screen name={ROUTES.DELIVERY_PERSONNEL_LIST} component={DeliveryPersonnelListScreen} />
    <Stack.Screen name={ROUTES.DELIVERY_PERSONNEL_DETAIL} component={DeliveryPersonnelDetailScreen} />
    <Stack.Screen name={ROUTES.ADD_DELIVERY_PERSONNEL} component={AddDeliveryPersonnelScreen} />
    <Stack.Screen name={ROUTES.ASSIGN_WORK} component={AssignWorkScreen} />
    {/* Employees */}
    <Stack.Screen name={ROUTES.EMPLOYEE_LIST} component={EmployeeListScreen} />
    <Stack.Screen name={ROUTES.EMPLOYEE_FORM} component={EmployeeFormScreen} />
    <Stack.Screen name={ROUTES.EMPLOYEE_DETAIL} component={EmployeeDetailScreen} />
    {/* Payroll */}
    <Stack.Screen name={ROUTES.RUN_PAYROLL} component={RunPayrollScreen} />
    <Stack.Screen name={ROUTES.PAYROLL_HISTORY} component={PayrollHistoryScreen} />
    <Stack.Screen name={ROUTES.PAY_STUB} component={PayStubScreen} />
    {/* Tax Management */}
    <Stack.Screen name={ROUTES.TAX_SETTINGS} component={TaxSettingsScreen} />
    <Stack.Screen name={ROUTES.TAX_LIABILITY} component={TaxLiabilityScreen} />
    <Stack.Screen name={ROUTES.TAX_PAYMENT} component={TaxPaymentScreen} />
    {/* Settings */}
    <Stack.Screen name={ROUTES.SETTINGS} component={SettingsScreen} />
    <Stack.Screen name={ROUTES.COMPANY_PROFILE} component={CompanyProfileScreen} />
    <Stack.Screen name={ROUTES.USER_MANAGEMENT} component={UserManagementScreen} />
    {/* Audit Trail */}
    <Stack.Screen name={ROUTES.AUDIT_TRAIL} component={AuditTrailScreen} />
    {/* Agency / Warehouse */}
    <Stack.Screen name={ROUTES.AGENCY_LIST} component={AgencyListScreen} />
    <Stack.Screen name={ROUTES.AGENCY_DETAIL} component={AgencyDetailScreen} />
    <Stack.Screen name={ROUTES.AGENCY_FORM} component={AgencyFormScreen} />
    <Stack.Screen name={ROUTES.AGENCY_INVENTORY_SYNC} component={AgencyInventorySyncScreen} />
  </Stack.Navigator>
);

export default MoreStack;
