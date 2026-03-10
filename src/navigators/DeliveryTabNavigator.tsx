// ============================================================
// FINMATRIX - Delivery Personnel Tab Navigator
// ============================================================
// 4 tabs: Dashboard · Deliveries · Inventory · Profile
// Green accent #27AE60

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES } from '../navigations-map/Base';
import { Colors } from '../theme';

import DPDashboardStack from './stacks/DPDashboardStack';
import DPDeliveriesStack from './stacks/DPDeliveriesStack';
import DPInventoryStack from './stacks/DPInventoryStack';
import DPProfileStack from './stacks/DPProfileStack';

const Tab = createBottomTabNavigator();

const ACTIVE_COLOR = '#27AE60';
const INACTIVE_COLOR = '#999999';

interface TabItemConfig {
  key: string;
  label: string;
  icon: string;
}

const TAB_CONFIG: Record<string, TabItemConfig> = {
  [ROUTES.DP_DASHBOARD_STACK]: { key: 'dashboard', label: 'Dashboard', icon: 'DSH' },
  [ROUTES.DP_DELIVERIES_STACK]: { key: 'deliveries', label: 'Deliveries', icon: 'DLV' },
  [ROUTES.DP_INVENTORY_STACK]: { key: 'inventory', label: 'Inventory', icon: 'INV' },
  [ROUTES.DP_PROFILE_STACK]: { key: 'profile', label: 'Profile', icon: 'PRF' },
};

const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const insets = useSafeAreaInsets();
  const bottomPadding = Math.max(insets.bottom, 8);

  return (
    <View style={[styles.tabBar, { paddingBottom: bottomPadding }]}>
      <View style={styles.tabBarTopBorder} />
      <View style={styles.tabBarContent}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name];

          if (!config) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          return (
            <TouchableOpacity
              key={config.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              onLongPress={onLongPress}
              activeOpacity={0.7}
              style={styles.tabItem}
            >
              {/* Active indicator bar */}
              <View
                style={[
                  styles.activeIndicator,
                  { backgroundColor: isFocused ? ACTIVE_COLOR : 'transparent' },
                ]}
              />

              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isFocused ? ACTIVE_COLOR : 'transparent' },
                ]}
              >
                <Text
                  style={[
                    styles.iconText,
                    { color: isFocused ? Colors.white : INACTIVE_COLOR },
                  ]}
                >
                  {config.icon}
                </Text>
              </View>

              {/* Label */}
              <Text
                style={[
                  styles.label,
                  { color: isFocused ? ACTIVE_COLOR : INACTIVE_COLOR },
                ]}
                numberOfLines={1}
              >
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const DeliveryTabNavigator: React.FC = () => (
  <Tab.Navigator
    tabBar={(props) => <CustomTabBar {...props} />}
    screenOptions={{ headerShown: false }}
  >
    <Tab.Screen name={ROUTES.DP_DASHBOARD_STACK} component={DPDashboardStack} />
    <Tab.Screen name={ROUTES.DP_DELIVERIES_STACK} component={DPDeliveriesStack} />
    <Tab.Screen name={ROUTES.DP_INVENTORY_STACK} component={DPInventoryStack} />
    <Tab.Screen name={ROUTES.DP_PROFILE_STACK} component={DPProfileStack} />
  </Tab.Navigator>
);

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarTopBorder: {
    height: 1,
    backgroundColor: '#E8ECF0',
  },
  tabBarContent: {
    flexDirection: 'row',
    height: 64,
    alignItems: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  activeIndicator: {
    width: 32,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    marginBottom: 6,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
});

export default DeliveryTabNavigator;
