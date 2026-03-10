// ============================================================
// FINMATRIX - Transactions Hub Screen  (Rebuilt)
// ============================================================
// Full menu: SALES (Invoices, Estimates, Sales Orders, Credit Memos,
// Receive Payments) & PURCHASES (Bills, POs, Pay Bills, Vendor Credits).

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';

// ─── Menu Row ───────────────────────────────────────────────
interface MenuRowProps {
  icon: string;
  label: string;
  subtitle: string;
  badge?: number;
  onPress: () => void;
  color?: string;
}

const MenuRow: React.FC<MenuRowProps> = ({
  icon,
  label,
  subtitle,
  badge,
  onPress,
  color = Colors.primary,
}) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.6}>
    <View style={[styles.menuIcon, { backgroundColor: color + '14' }]}>
      <Text style={styles.menuIconText}>{icon}</Text>
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuLabel}>{label}</Text>
      <Text style={styles.menuSubtitle}>{subtitle}</Text>
    </View>
    {badge !== undefined && (
      <View style={[styles.badge, { backgroundColor: color + '18' }]}>
        <Text style={[styles.badgeText, { color }]}>{badge}</Text>
      </View>
    )}
    <Text style={styles.menuChevron}>›</Text>
  </TouchableOpacity>
);

// ─── Main Component ─────────────────────────────────────────
const TransactionsHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => (
  <View style={styles.container}>
    {/* Header */}
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Transactions</Text>
    </View>

    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      {/* ── SALES ─────────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>SALES</Text>
      <View style={styles.card}>
        <MenuRow
          icon="📄"
          label="Invoices"
          subtitle="Create & manage customer invoices"
          badge={20}
          onPress={() => navigation.navigate(ROUTES.INVOICE_LIST)}
        />
        <View style={styles.divider} />
        <MenuRow
          icon="📋"
          label="Estimates"
          subtitle="Quotes & proposals for customers"
          badge={8}
          onPress={() => navigation.navigate(ROUTES.ESTIMATE_LIST)}
          color={Colors.info}
        />
        <View style={styles.divider} />
        <MenuRow
          icon="📦"
          label="Sales Orders"
          subtitle="Track orders & fulfillment"
          badge={6}
          onPress={() => navigation.navigate(ROUTES.SO_LIST)}
          color={Colors.warning}
        />
        <View style={styles.divider} />
        <MenuRow
          icon="↩️"
          label="Credit Memos"
          subtitle="Issue credits & refunds"
          badge={4}
          onPress={() => navigation.navigate(ROUTES.CM_LIST)}
          color={Colors.danger}
        />
        <View style={styles.divider} />
        <MenuRow
          icon="💳"
          label="Receive Payments"
          subtitle="Record customer payments"
          badge={12}
          onPress={() => navigation.navigate(ROUTES.RECEIVE_PAYMENT)}
          color={Colors.success}
        />
      </View>

      {/* ── PURCHASES ─────────────────────────────────────── */}
      <Text style={styles.sectionTitle}>PURCHASES</Text>
      <View style={styles.card}>
        <MenuRow
          icon="🧾"
          label="Bills"
          subtitle="Track & manage vendor bills"
          badge={15}
          onPress={() => navigation.navigate(ROUTES.BILL_LIST)}
          color={Colors.danger}
        />
        <View style={styles.divider} />
        <MenuRow
          icon="📥"
          label="Purchase Orders"
          subtitle="Create POs & receive items"
          badge={10}
          onPress={() => navigation.navigate(ROUTES.PO_LIST)}
          color={Colors.secondary}
        />
        <View style={styles.divider} />
        <MenuRow
          icon="💸"
          label="Pay Bills"
          subtitle="Pay outstanding vendor bills"
          onPress={() => navigation.navigate(ROUTES.PAY_BILLS)}
          color={Colors.warning}
        />
        <View style={styles.divider} />
        <MenuRow
          icon="🔄"
          label="Vendor Credits"
          subtitle="Issue credits to vendors"
          badge={3}
          onPress={() => navigation.navigate(ROUTES.VC_FORM)}
          color={Colors.textSecondary}
        />
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  </View>
);

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 60,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  menuIconText: {
    fontSize: 20,
  },
  menuContent: {
    flex: 1,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  badge: {
    minWidth: 28,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  menuChevron: {
    fontSize: 20,
    color: Colors.textDisabled,
    marginLeft: Spacing.xs,
  },
});

export default TransactionsHubScreen;
