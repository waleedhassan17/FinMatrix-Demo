import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../../navigations-map/Base';
import DPDeliveryListScreen from '../../screens/Delivery/Personnel/DPDeliveryListScreen';
import DPDeliveryDetailScreen from '../../screens/Delivery/Personnel/DPDeliveryDetailScreen';
import DeliveryItemConfirmScreen from '../../screens/Delivery/Personnel/DeliveryItemConfirmScreen';
import DeliveryPhotoProofScreen from '../../screens/Delivery/Personnel/DeliveryPhotoProofScreen';
import SignatureCaptureScreen from '../../screens/Delivery/Personnel/SignatureCaptureScreen';
import CustomerConfirmScreen from '../../screens/Delivery/Personnel/CustomerConfirmScreen';
import DeliveryCompleteScreen from '../../screens/Delivery/Personnel/DeliveryCompleteScreen';

const Stack = createNativeStackNavigator();

const DPDeliveriesStack: React.FC = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name={ROUTES.MY_DELIVERIES} component={DPDeliveryListScreen} />
    <Stack.Screen name={ROUTES.DP_DELIVERY_DETAIL} component={DPDeliveryDetailScreen} />
    <Stack.Screen name={ROUTES.DELIVERY_ITEM_CONFIRM} component={DeliveryItemConfirmScreen} />
    <Stack.Screen name={ROUTES.DELIVERY_PHOTO_PROOF} component={DeliveryPhotoProofScreen} />
    <Stack.Screen name={ROUTES.SIGNATURE_CAPTURE} component={SignatureCaptureScreen} />
    <Stack.Screen name={ROUTES.CUSTOMER_CONFIRM} component={CustomerConfirmScreen} />
    <Stack.Screen name={ROUTES.DELIVERY_COMPLETE} component={DeliveryCompleteScreen} />
  </Stack.Navigator>
);

export default DPDeliveriesStack;
