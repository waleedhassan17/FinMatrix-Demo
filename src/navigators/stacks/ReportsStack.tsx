import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../navigations-map/Base';
import ReportsHubScreen from '../../screens/Reports/ReportsHubScreen';
import ProfitLossScreen from '../../screens/Reports/ProfitLossScreen';
import BalanceSheetScreen from '../../screens/Reports/BalanceSheetScreen';
import TrialBalanceScreen from '../../screens/Reports/TrialBalanceScreen';
import ARAgingScreen from '../../screens/Reports/ARAgingScreen';
import InventoryValuationScreen from '../../screens/Reports/InventoryValuationScreen';
import AnalyticsScreen from '../../screens/Reports/AnalyticsScreen';
import BudgetListScreen from '../../screens/Budgets/BudgetListScreen';
import BudgetFormScreen from '../../screens/Budgets/BudgetFormScreen';
import BudgetVsActualScreen from '../../screens/Budgets/BudgetVsActualScreen';
import CashFlowScreen from '../../screens/Reports/CashFlowScreen';
import APAgingScreen from '../../screens/Reports/APAgingScreen';
import CustomerBalancesScreen from '../../screens/Reports/CustomerBalancesScreen';
import VendorBalancesScreen from '../../screens/Reports/VendorBalancesScreen';
import StockStatusScreen from '../../screens/Reports/StockStatusScreen';
import LowStockAlertScreen from '../../screens/Reports/LowStockAlertScreen';
import SalesByCustomerScreen from '../../screens/Reports/SalesByCustomerScreen';
import SalesByItemScreen from '../../screens/Reports/SalesByItemScreen';
import SalesTaxReportScreen from '../../screens/Reports/SalesTaxReportScreen';
import PayrollSummaryScreen from '../../screens/Reports/PayrollSummaryScreen';

const Stack = createNativeStackNavigator();

const ReportsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.ADMIN_REPORTS_HUB} component={ReportsHubScreen} />
    <Stack.Screen name={ROUTES.REPORT_PROFIT_LOSS} component={ProfitLossScreen} />
    <Stack.Screen name={ROUTES.REPORT_BALANCE_SHEET} component={BalanceSheetScreen} />
    <Stack.Screen name={ROUTES.REPORT_TRIAL_BALANCE} component={TrialBalanceScreen} />
    <Stack.Screen name={ROUTES.REPORT_AR_AGING} component={ARAgingScreen} />
    <Stack.Screen name={ROUTES.REPORT_INVENTORY_VALUATION} component={InventoryValuationScreen} />
    <Stack.Screen name={ROUTES.REPORT_CASH_FLOW} component={CashFlowScreen} />
    <Stack.Screen name={ROUTES.REPORT_AP_AGING} component={APAgingScreen} />
    <Stack.Screen name={ROUTES.REPORT_CUSTOMER_BALANCES} component={CustomerBalancesScreen} />
    <Stack.Screen name={ROUTES.REPORT_VENDOR_BALANCES} component={VendorBalancesScreen} />
    <Stack.Screen name={ROUTES.REPORT_STOCK_STATUS} component={StockStatusScreen} />
    <Stack.Screen name={ROUTES.REPORT_LOW_STOCK} component={LowStockAlertScreen} />
    <Stack.Screen name={ROUTES.REPORT_SALES_BY_CUSTOMER} component={SalesByCustomerScreen} />
    <Stack.Screen name={ROUTES.REPORT_SALES_BY_ITEM} component={SalesByItemScreen} />
    <Stack.Screen name={ROUTES.REPORT_SALES_TAX} component={SalesTaxReportScreen} />
    <Stack.Screen name={ROUTES.REPORT_PAYROLL_SUMMARY} component={PayrollSummaryScreen} />
    <Stack.Screen name={ROUTES.ANALYTICS} component={AnalyticsScreen} />
    <Stack.Screen name={ROUTES.BUDGET_LIST} component={BudgetListScreen} />
    <Stack.Screen name={ROUTES.BUDGET_FORM} component={BudgetFormScreen} />
    <Stack.Screen name={ROUTES.BUDGET_VS_ACTUAL} component={BudgetVsActualScreen} />
  </Stack.Navigator>
);

export default ReportsStack;
