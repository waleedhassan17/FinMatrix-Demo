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
import { useAppSelector } from '../../hooks/useReduxHooks';
import { formatCurrency } from '../../utils/formatters';

// ─── Menu Row ───────────────────────────────────────────────
interface MenuRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  badge?: number;
}

const MenuRow: React.FC<MenuRowProps> = ({
  icon,
  label,
  subtitle,
  onPress,
  color = Colors.primary,
  badge,
}) => (
  <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.6}>
    <View style={[styles.menuIcon, { backgroundColor: color + '14' }]}>
      <Text style={styles.menuIconText}>{icon}</Text>
    </View>
    <View style={styles.menuContent}>
      <Text style={styles.menuLabel}>{label}</Text>
      {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
    </View>
    {badge != null && badge > 0 && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    <Text style={styles.menuChevron}>›</Text>
  </TouchableOpacity>
);

// ─── Divider ────────────────────────────────────────────────
const Divider = () => <View style={styles.menuDivider} />;

// ─── Main Component ─────────────────────────────────────────
const MoreHubScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  // Badges & subtitles
  const customerCount = useAppSelector(
    (s) => s.customers.customers.filter((c) => c.isActive && c.balance > 0).length,
  );
  const vendorCount = useAppSelector(
    (s) => s.vendors.vendors.filter((v) => v.isActive && v.balance > 0).length,
  );
  const employeeCount = useAppSelector(
    (s) => s.employees.employees.length,
  );
  const totalBalance = useAppSelector(
    (s) => s.banking.accounts.reduce((sum, a) => sum + a.currentBalance, 0),
  );
  const pendingDeliveries = useAppSelector(
    (s) => s.delivery.deliveries.filter((d) => d.status === 'pending').length,
  );
  const agencyCount = useAppSelector(
    (s) => {
      const active = s.company.activeCompanyId;
      const co = s.company.companies.find((c) => c.companyId === active);
      return co?.agencies?.length ?? 0;
    },
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>More</Text>
        <Text style={styles.subtitle}>Manage your business</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── ACCOUNTING ─────────────────────────────── */}
        <Text style={styles.sectionLabel}>ACCOUNTING</Text>
        <View style={styles.menuGroup}>
          <MenuRow
            icon="📊"
            label="Chart of Accounts"
            subtitle="Manage your account structure"
            onPress={() => navigation.navigate(ROUTES.CHART_OF_ACCOUNTS)}
            color="#2E75B6"
          />
          <Divider />
          <MenuRow
            icon="📒"
            label="General Ledger"
            subtitle="View all ledger entries"
            onPress={() => navigation.navigate(ROUTES.GENERAL_LEDGER)}
            color="#1B3A5C"
          />
          <Divider />
          <MenuRow
            icon="📝"
            label="Journal Entries"
            subtitle="Create & manage journal entries"
            onPress={() => navigation.navigate(ROUTES.JE_LIST)}
            color="#8E44AD"
          />
        </View>

        {/* ── PEOPLE ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>PEOPLE</Text>
        <View style={styles.menuGroup}>
          <MenuRow
            icon="👥"
            label="Customers"
            subtitle="Manage customer records"
            onPress={() => navigation.navigate(ROUTES.CUSTOMER_LIST)}
            color={Colors.success}
            badge={customerCount}
          />
          <Divider />
          <MenuRow
            icon="🏢"
            label="Vendors"
            subtitle="Manage supplier records"
            onPress={() => navigation.navigate(ROUTES.VENDOR_LIST)}
            color={Colors.warning}
            badge={vendorCount}
          />
          <Divider />
          <MenuRow
            icon="🧑‍💼"
            label="Employees"
            subtitle="Manage staff records"
            onPress={() => navigation.navigate(ROUTES.EMPLOYEE_LIST)}
            color="#8E44AD"
            badge={employeeCount}
          />
        </View>

        {/* ── MONEY ──────────────────────────────────── */}
        <Text style={styles.sectionLabel}>MONEY</Text>
        <View style={styles.menuGroup}>
          <MenuRow
            icon="🏦"
            label="Banking"
            subtitle={`Total balance: ${formatCurrency(totalBalance)}`}
            onPress={() => navigation.navigate(ROUTES.BANK_ACCOUNTS)}
            color={Colors.info}
          />
          <Divider />
          <MenuRow
            icon="🏛️"
            label="Tax Management"
            subtitle="Tax rates, liability & payments"
            onPress={() => navigation.navigate(ROUTES.TAX_SETTINGS)}
            color={Colors.danger}
          />
        </View>

        {/* ── OPERATIONS ─────────────────────────────── */}
        <Text style={styles.sectionLabel}>OPERATIONS</Text>
        <View style={styles.menuGroup}>
          <MenuRow
            icon="🚚"
            label="Delivery Management"
            subtitle="Assign & monitor deliveries"
            onPress={() => navigation.navigate(ROUTES.DELIVERY_MANAGEMENT)}
            color={Colors.deliveryAccent}
            badge={pendingDeliveries}
          />
          <Divider />
          <MenuRow
            icon="�"
            label="Delivery Team"
            subtitle="Manage delivery personnel"
            onPress={() => navigation.navigate(ROUTES.DELIVERY_PERSONNEL_LIST)}
            color={Colors.deliveryAccent}
          />
          <Divider />
          <MenuRow
            icon="📋"
            label="Assign Work"
            subtitle="Assign deliveries to personnel"
            onPress={() => navigation.navigate(ROUTES.ASSIGN_WORK)}
            color={Colors.success}
          />
          <Divider />
          <MenuRow
            icon="🏭"
            label="Warehouse Agencies"
            subtitle="Manage agency inventory & sync"
            onPress={() => navigation.navigate(ROUTES.AGENCY_LIST)}
            color="#2E75B6"
            badge={agencyCount}
          />
          <Divider />
          <MenuRow
            icon="�💰"
            label="Payroll"
            subtitle="Process payroll & view history"
            onPress={() => navigation.navigate(ROUTES.PAYROLL_HISTORY)}
            color={Colors.success}
          />
        </View>

        {/* ── SYSTEM ─────────────────────────────────── */}
        <Text style={styles.sectionLabel}>SYSTEM</Text>
        <View style={styles.menuGroup}>
          <MenuRow
            icon="📋"
            label="Audit Trail"
            subtitle="Track all changes & activity"
            onPress={() => navigation.navigate(ROUTES.AUDIT_TRAIL)}
            color="#8E44AD"
          />
          <Divider />
          <MenuRow
            icon="⚙️"
            label="Settings"
            subtitle="App preferences & configuration"
            onPress={() => navigation.navigate(ROUTES.SETTINGS)}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xxxl,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  menuGroup: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
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
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  menuChevron: {
    fontSize: 22,
    color: Colors.textTertiary,
    fontWeight: '300',
  },
  menuDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.base + 40 + Spacing.md,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 6,
    marginRight: Spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700' as const,
    color: Colors.white,
  },
});

export default MoreHubScreen;
