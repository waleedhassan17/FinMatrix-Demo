import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../navigations-map/Base';
import DPDashboardScreen from '../../screens/Delivery/Personnel/DPDashboardScreen';

const Stack = createNativeStackNavigator();

const DPDashboardStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.DELIVERY_DASHBOARD} component={DPDashboardScreen} />
  </Stack.Navigator>
);

export default DPDashboardStack;
