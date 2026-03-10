// ============================================================
// FINMATRIX - Delivery Management Screen (Admin)
// ============================================================
// SimpleTabBar: Assign | Monitor | Approvals

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import {
  setActiveTab,
  DeliveryTabKey,
} from '../../../store/deliverySlice';
import { fetchInventory } from '../../Inventory/inventorySlice';
import AssignTab from './AssignTab';
import MonitorTab from './MonitorTab';
import ApprovalsTab from './ApprovalsTab';

// ─── Tab Config ─────────────────────────────────────────────
const TABS: { key: DeliveryTabKey; label: string; icon: string }[] = [
  { key: 'assign', label: 'Assign', icon: '📋' },
  { key: 'monitor', label: 'Monitor', icon: '📡' },
  { key: 'approvals', label: 'Approvals', icon: '✅' },
];

// ─── Component ──────────────────────────────────────────────
const DeliveryManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { deliveries, activeTab, isLoading } = useAppSelector(
    (s) => s.delivery
  );

  useEffect(() => {
    dispatch(fetchInventory());
  }, [dispatch]);

  // ─── Loading ──────────────────────────────────────────
  if (isLoading && deliveries.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Management</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* ── Tab Bar ─────────────────────────────────────── */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, active && styles.tabActive]}
              onPress={() => dispatch(setActiveTab(tab.key))}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ═══ ASSIGN TAB ═══════════════════════════════════ */}
      {activeTab === 'assign' && <AssignTab />}

      {/* ═══ MONITOR TAB ══════════════════════════════════ */}
      {activeTab === 'monitor' && <MonitorTab navigation={navigation} />}

      {/* ═══ APPROVALS TAB ════════════════════════════════ */}
      {activeTab === 'approvals' && <ApprovalsTab />}
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backBtn: { fontSize: 15, color: Colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.base },

  // Tab bar
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabIcon: { fontSize: 18, marginBottom: 2 },
  tabLabel: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary },
  tabLabelActive: { color: Colors.primary },
});

export default DeliveryManagementScreen;
