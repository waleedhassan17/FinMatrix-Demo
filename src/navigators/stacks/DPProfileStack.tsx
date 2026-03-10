import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../navigations-map/Base';
import DPProfileScreen from '../../screens/Delivery/Personnel/DPProfileScreen';
import DPHistoryScreen from '../../screens/Delivery/Personnel/DPHistoryScreen';
import DPSettingsScreen from '../../screens/Delivery/Personnel/DPSettingsScreen';

const Stack = createNativeStackNavigator();

const DPProfileStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.DELIVERY_PROFILE} component={DPProfileScreen} />
    <Stack.Screen name={ROUTES.DP_HISTORY} component={DPHistoryScreen} />
    <Stack.Screen name={ROUTES.DP_SETTINGS} component={DPSettingsScreen} />
  </Stack.Navigator>
);

export default DPProfileStack;
