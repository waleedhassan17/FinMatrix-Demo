// ============================================================
// FINMATRIX - Delivery Personnel Profile Screen
// ============================================================
// Avatar · Name · Email · Phone · Role badge
// Metrics: Total Deliveries, On-Time Rate, Rating, This Month
// Navigation: History, Settings, Sign Out

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppSelector, useAppDispatch } from '../../../hooks/useReduxHooks';
import { signOut } from '../../auth/authSlice';
import { ROUTES } from '../../../navigations-map/Base';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';
const DP_GREEN_LIGHT = '#E8F8EF';

// ─── Component ──────────────────────────────────────────────
const DPProfileScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  const dispatch = useAppDispatch();

  const user = useAppSelector((state) => state.auth.user);
  const currentPersonId = user?.uid || 'dp_001';
  const myDeliveries = useAppSelector((state) =>
    state.delivery.deliveries.filter((d) => d.deliveryPersonId === currentPersonId),
  );

  // ── Metrics (derived from dummy data) ─────────────
  const metrics = useMemo(() => {
    const total = myDeliveries.length;
    const delivered = myDeliveries.filter((d) => d.status === 'delivered').length;
    const onTimeRate = total > 0 ? Math.round((delivered / Math.max(total, 1)) * 100) : 0;

    // This month
    const now = new Date();
    const thisMonth = myDeliveries.filter((d) => {
      const dt = new Date(d.createdAt);
      return dt.getMonth() === now.getMonth() && dt.getFullYear() === now.getFullYear();
    }).length;

    return {
      total,
      onTimeRate,
      rating: 4.8,       // placeholder
      thisMonth,
    };
  }, [myDeliveries]);

  // ── Avatar initial ────────────────────────────────
  const initial = user?.displayName?.charAt(0).toUpperCase() ?? '?';

  // ── Sign out ──────────────────────────────────────
  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: () => dispatch(signOut()),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{user?.displayName ?? 'Driver'}</Text>
        <Text style={styles.email}>{user?.email ?? '—'}</Text>
        {user?.phoneNumber ? <Text style={styles.phone}>{user.phoneNumber}</Text> : null}
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>Delivery Personnel</Text>
        </View>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* ── Metrics ────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.metricsGrid}>
          <MetricCard label="Total Deliveries" value={`${metrics.total}`} icon="📦" />
          <MetricCard label="On-Time Rate" value={`${metrics.onTimeRate}%`} icon="⏱️" />
          <MetricCard label="Rating" value={`${metrics.rating}`} icon="⭐" />
          <MetricCard label="This Month" value={`${metrics.thisMonth}`} icon="📅" />
        </View>

        {/* ── Menu items ─────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity
          style={styles.menuRow}
          activeOpacity={0.7}
          onPress={() => navigation.navigate(ROUTES.DP_HISTORY)}
        >
          <Text style={styles.menuIcon}>📋</Text>
          <Text style={styles.menuLabel}>Delivery History</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuRow}
          activeOpacity={0.7}
          onPress={() => navigation.navigate(ROUTES.DP_SETTINGS)}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuLabel}>Settings</Text>
          <Text style={styles.menuChevron}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuRow, styles.menuRowDanger]}
          activeOpacity={0.7}
          onPress={handleSignOut}
        >
          <Text style={styles.menuIcon}>🚪</Text>
          <Text style={[styles.menuLabel, { color: Colors.danger }]}>Sign Out</Text>
          <Text style={[styles.menuChevron, { color: Colors.danger }]}>›</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// ─── Metric Card Component ──────────────────────────────────
const MetricCard: React.FC<{ label: string; value: string; icon: string }> = ({ label, value, icon }) => (
  <View style={styles.metricCard}>
    <Text style={styles.metricIcon}>{icon}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: DP_GREEN,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.xl,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: Colors.white,
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 2,
  },
  email: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginBottom: 2,
  },
  phone: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: Spacing.sm,
  },
  roleBadge: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.5,
  },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: Spacing.base, paddingBottom: 40 },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },

  // Metrics
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  metricCard: {
    width: '48%' as any,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    alignItems: 'center',
    ...Shadows.sm,
    flexGrow: 1,
    flexBasis: '46%',
  },
  metricIcon: { fontSize: 22, marginBottom: Spacing.xs },
  metricValue: { fontSize: 22, fontWeight: '700', color: Colors.textPrimary },
  metricLabel: { fontSize: 11, color: Colors.textTertiary, marginTop: 2, textAlign: 'center' },

  // Menu
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  menuRowDanger: { borderColor: Colors.dangerLight, borderWidth: 1 },
  menuIcon: { fontSize: 18, marginRight: Spacing.md },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  menuChevron: { fontSize: 22, color: Colors.textTertiary },
});

export default DPProfileScreen;
