import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../navigations-map/Base';
import InventoryListScreen from '../../screens/Inventory/InventoryListScreen';
import InventoryFormScreen from '../../screens/Inventory/InventoryFormScreen';
import InventoryDetailScreen from '../../screens/Inventory/InventoryDetailScreen';
import AdjustmentScreen from '../../screens/Inventory/AdjustmentScreen';
import PhysicalCountScreen from '../../screens/Inventory/PhysicalCountScreen';
import StockTransferScreen from '../../screens/Inventory/StockTransferScreen';
import InventoryReportsScreen from '../../screens/Inventory/InventoryReportsScreen';

const Stack = createNativeStackNavigator();

const InventoryStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.ADMIN_INVENTORY_HUB} component={InventoryListScreen} />
    <Stack.Screen name={ROUTES.INVENTORY_FORM} component={InventoryFormScreen} />
    <Stack.Screen name={ROUTES.INVENTORY_DETAIL} component={InventoryDetailScreen} />
    <Stack.Screen name={ROUTES.INVENTORY_ADJUSTMENT} component={AdjustmentScreen} />
    <Stack.Screen name={ROUTES.PHYSICAL_COUNT} component={PhysicalCountScreen} />
    <Stack.Screen name={ROUTES.STOCK_TRANSFER} component={StockTransferScreen} />
    <Stack.Screen name={ROUTES.INVENTORY_REPORTS} component={InventoryReportsScreen} />
  </Stack.Navigator>
);

export default InventoryStack;
