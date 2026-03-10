import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../navigations-map/Base';
import AdminDashboard from '../../screens/HomeScreen/AdminDashboard';
import NotificationCenterScreen from '../../screens/Notifications/NotificationCenterScreen';
import CompanySwitcherScreen from '../../screens/Company/CompanySwitcherScreen';
import CompanyDetailScreen from '../../screens/Company/CompanyDetailScreen';
import CreateCompanyScreen from '../../screens/auth/CreateCompanyScreen';

const Stack = createNativeStackNavigator();

const DashboardStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.ADMIN_DASHBOARD} component={AdminDashboard} />
    <Stack.Screen name={ROUTES.NOTIFICATION_CENTER} component={NotificationCenterScreen} />
    <Stack.Screen name={ROUTES.COMPANY_SWITCHER} component={CompanySwitcherScreen} />
    <Stack.Screen name={ROUTES.COMPANY_DETAIL} component={CompanyDetailScreen} />
    <Stack.Screen name={ROUTES.CREATE_COMPANY} component={CreateCompanyScreen} />
  </Stack.Navigator>
);

export default DashboardStack;
