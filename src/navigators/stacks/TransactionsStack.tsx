import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../navigations-map/Base';
import TransactionsHubScreen from '../../screens/Transactions/TransactionsHubScreen';
// Invoices
import InvoiceListScreen from '../../screens/Invoices/InvoiceListScreen';
import InvoiceFormScreen from '../../screens/Invoices/InvoiceFormScreen';
import InvoiceDetailScreen from '../../screens/Invoices/InvoiceDetailScreen';
import ReceivePaymentScreen from '../../screens/Payments/ReceivePaymentScreen';
// Estimates
import EstimateListScreen from '../../screens/Estimates/EstimateListScreen';
import EstimateFormScreen from '../../screens/Estimates/EstimateFormScreen';
import EstimateDetailScreen from '../../screens/Estimates/EstimateDetailScreen';
// Sales Orders
import SOListScreen from '../../screens/SalesOrders/SOListScreen';
import SOFormScreen from '../../screens/SalesOrders/SOFormScreen';
import SODetailScreen from '../../screens/SalesOrders/SODetailScreen';
// Credit Memos
import CreditMemoListScreen from '../../screens/CreditMemos/CreditMemoListScreen';
import CreditMemoFormScreen from '../../screens/CreditMemos/CreditMemoFormScreen';
// Bills
import BillListScreen from '../../screens/Bills/BillListScreen';
import BillFormScreen from '../../screens/Bills/BillFormScreen';
import BillDetailScreen from '../../screens/Bills/BillDetailScreen';
import PayBillsScreen from '../../screens/Bills/PayBillsScreen';
// Purchase Orders
import POListScreen from '../../screens/PurchaseOrders/POListScreen';
import POFormScreen from '../../screens/PurchaseOrders/POFormScreen';
import PODetailScreen from '../../screens/PurchaseOrders/PODetailScreen';
import ReceiveItemsScreen from '../../screens/PurchaseOrders/ReceiveItemsScreen';
// Vendor Credits
import VendorCreditFormScreen from '../../screens/VendorCredits/VendorCreditFormScreen';

const Stack = createNativeStackNavigator();

const TransactionsStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.ADMIN_TRANSACTIONS_HUB} component={TransactionsHubScreen} />
    {/* Invoices */}
    <Stack.Screen name={ROUTES.INVOICE_LIST} component={InvoiceListScreen} />
    <Stack.Screen name={ROUTES.INVOICE_FORM} component={InvoiceFormScreen} />
    <Stack.Screen name={ROUTES.INVOICE_DETAIL} component={InvoiceDetailScreen} />
    <Stack.Screen name={ROUTES.RECEIVE_PAYMENT} component={ReceivePaymentScreen} />
    {/* Estimates */}
    <Stack.Screen name={ROUTES.ESTIMATE_LIST} component={EstimateListScreen} />
    <Stack.Screen name={ROUTES.ESTIMATE_FORM} component={EstimateFormScreen} />
    <Stack.Screen name={ROUTES.ESTIMATE_DETAIL} component={EstimateDetailScreen} />
    {/* Sales Orders */}
    <Stack.Screen name={ROUTES.SO_LIST} component={SOListScreen} />
    <Stack.Screen name={ROUTES.SO_FORM} component={SOFormScreen} />
    <Stack.Screen name={ROUTES.SO_DETAIL} component={SODetailScreen} />
    {/* Credit Memos */}
    <Stack.Screen name={ROUTES.CM_LIST} component={CreditMemoListScreen} />
    <Stack.Screen name={ROUTES.CM_FORM} component={CreditMemoFormScreen} />
    {/* Bills */}
    <Stack.Screen name={ROUTES.BILL_LIST} component={BillListScreen} />
    <Stack.Screen name={ROUTES.BILL_FORM} component={BillFormScreen} />
    <Stack.Screen name={ROUTES.BILL_DETAIL} component={BillDetailScreen} />
    <Stack.Screen name={ROUTES.PAY_BILLS} component={PayBillsScreen} />
    {/* Purchase Orders */}
    <Stack.Screen name={ROUTES.PO_LIST} component={POListScreen} />
    <Stack.Screen name={ROUTES.PO_FORM} component={POFormScreen} />
    <Stack.Screen name={ROUTES.PO_DETAIL} component={PODetailScreen} />
    <Stack.Screen name={ROUTES.RECEIVE_ITEMS} component={ReceiveItemsScreen} />
    {/* Vendor Credits */}
    <Stack.Screen name={ROUTES.VC_FORM} component={VendorCreditFormScreen} />
  </Stack.Navigator>
);

export default TransactionsStack;
