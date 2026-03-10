
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppSelector } from '../hooks/useReduxHooks';
import { ROUTES } from '../navigations-map/Base';

// Screens
import OnboardingScreen from '../screens/Onboarding/OnboardingScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import RoleSelectionScreen from '../screens/RoleSelection/RoleSelectionScreen';
import CompanyRegistrationScreen from '../screens/auth/CompanyRegistrationScreen';
import SignInScreen from '../screens/auth/SignIn';
import SignUpScreen from '../screens/auth/SignUp';
import ForgotPasswordScreen from '../screens/auth/ForgotPassword';
import CompanySetupScreen from '../screens/auth/CompanySetupScreen';
import CreateCompanyScreen from '../screens/auth/CreateCompanyScreen';
import JoinCompanyScreen from '../screens/auth/JoinCompanyScreen';
import DeliveryPersonnelSignupScreen from '../screens/auth/DeliveryPersonnelSignupScreen';
import DeliveryOnboardingScreen from '../screens/auth/DeliveryOnboardingScreen';
import AdminTabNavigator from './AdminTabNavigator';
import DeliveryTabNavigator from './DeliveryTabNavigator';
import DemoToolbar from '../components/DemoToolbar';

const Stack = createNativeStackNavigator();

const BaseNavigator: React.FC = () => {
  const { isAuthenticated, user, isOnboarded } = useAppSelector((s) => s.auth);
  const { activeCompanyId } = useAppSelector((s) => s.company);

  // Delivery personnel get company from their user profile; admins from company slice
  const isDelivery = user?.role === 'delivery_personnel';
  const hasCompany = isDelivery ? !!user?.companyId : !!activeCompanyId;

  return (
    <View style={styles.root}>
      <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name={ROUTES.ONBOARDING} component={OnboardingScreen} />
            <Stack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} />
            <Stack.Screen name={ROUTES.COMPANY_REGISTRATION} component={CompanyRegistrationScreen} />
            <Stack.Screen name={ROUTES.ROLE_SELECTION} component={RoleSelectionScreen} />
            <Stack.Screen name={ROUTES.SIGN_IN} component={SignInScreen} />
            <Stack.Screen name={ROUTES.SIGN_UP} component={SignUpScreen} />
            <Stack.Screen name={ROUTES.DELIVERY_SIGNUP} component={DeliveryPersonnelSignupScreen} />
            <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
          </>
        ) : !hasCompany ? (
          <>
            <Stack.Screen name={ROUTES.COMPANY_SETUP} component={CompanySetupScreen} />
            <Stack.Screen name={ROUTES.CREATE_COMPANY} component={CreateCompanyScreen} />
            <Stack.Screen name={ROUTES.JOIN_COMPANY} component={JoinCompanyScreen} />
          </>
        ) : user?.role === 'administrator' ? (
          <Stack.Screen name={ROUTES.ADMIN_MAIN} component={AdminTabNavigator} />
        ) : user?.role === 'delivery_personnel' ? (
          isOnboarded ? (
            <Stack.Screen name={ROUTES.DELIVERY_MAIN} component={DeliveryTabNavigator} />
          ) : (
            <>
              <Stack.Screen name={ROUTES.DELIVERY_ONBOARDING} component={DeliveryOnboardingScreen} />
              <Stack.Screen name={ROUTES.DELIVERY_MAIN} component={DeliveryTabNavigator} />
            </>
          )
        ) : (
          <Stack.Screen name={ROUTES.ADMIN_MAIN} component={AdminTabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
    <DemoToolbar />
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default BaseNavigator;
