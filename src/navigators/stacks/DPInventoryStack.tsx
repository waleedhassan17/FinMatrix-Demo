import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../navigations-map/Base';
import DPShadowInventoryScreen from '../../screens/Delivery/Personnel/DPShadowInventoryScreen';

const Stack = createNativeStackNavigator();

const DPInventoryStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.SHADOW_INVENTORY} component={DPShadowInventoryScreen} />
  </Stack.Navigator>
);

export default DPInventoryStack;
