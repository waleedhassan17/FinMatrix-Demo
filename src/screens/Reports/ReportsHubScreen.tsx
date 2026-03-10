// ============================================================
// FINMATRIX - Reports Hub Screen
// ============================================================
// Sections: Financial, Receivables, Payables, Inventory, Sales,
//           Payroll, Delivery.  Each row → icon circle + name +
//           description + chevron.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';

// ─── Section / Row types ────────────────────────────────────
interface ReportRow {
  icon: string;
  color: string;
  label: string;
  description: string;
  route?: string;
}

interface Section {
  title: string;
  rows: ReportRow[];
}

const SECTIONS: Section[] = [
  {
    title: 'FINANCIAL',
    rows: [
      { icon: '📊', color: Colors.primary, label: 'Profit & Loss', description: 'Revenue, expenses & net income', route: ROUTES.REPORT_PROFIT_LOSS },
      { icon: '⚖️', color: '#8E44AD', label: 'Balance Sheet', description: 'Assets, liabilities & equity', route: ROUTES.REPORT_BALANCE_SHEET },
      { icon: '💰', color: Colors.info, label: 'Cash Flow', description: 'Cash inflows & outflows', route: ROUTES.REPORT_CASH_FLOW },
      { icon: '📝', color: Colors.warning, label: 'Trial Balance', description: 'All account debit & credit totals', route: ROUTES.REPORT_TRIAL_BALANCE },
      { icon: '📈', color: Colors.success, label: 'Analytics', description: 'Charts & visual insights', route: ROUTES.ANALYTICS },
      { icon: '🎯', color: Colors.secondary, label: 'Budgets', description: 'Annual budgets & variance', route: ROUTES.BUDGET_LIST },
    ],
  },
  {
    title: 'RECEIVABLES',
    rows: [
      { icon: '⏳', color: Colors.danger, label: 'AR Aging', description: 'Outstanding invoices by age', route: ROUTES.REPORT_AR_AGING },
      { icon: '👥', color: Colors.success, label: 'Customer Balances', description: 'Amounts owed by customer', route: ROUTES.REPORT_CUSTOMER_BALANCES },
    ],
  },
  {
    title: 'PAYABLES',
    rows: [
      { icon: '📅', color: '#E67E22', label: 'AP Aging', description: 'Outstanding bills by age', route: ROUTES.REPORT_AP_AGING },
      { icon: '🏢', color: Colors.primary, label: 'Vendor Balances', description: 'Amounts owed to vendors', route: ROUTES.REPORT_VENDOR_BALANCES },
    ],
  },
  {
    title: 'INVENTORY',
    rows: [
      { icon: '💎', color: '#8E44AD', label: 'Inventory Valuation', description: 'Item cost & total value', route: ROUTES.REPORT_INVENTORY_VALUATION },
      { icon: '📦', color: Colors.info, label: 'Stock Status', description: 'Quantities on-hand & committed', route: ROUTES.REPORT_STOCK_STATUS },
      { icon: '⚠️', color: Colors.danger, label: 'Low Stock Alert', description: 'Items below reorder point', route: ROUTES.REPORT_LOW_STOCK },
    ],
  },
  {
    title: 'SALES',
    rows: [
      { icon: '🛒', color: Colors.success, label: 'Sales by Customer', description: 'Revenue breakdown by customer', route: ROUTES.REPORT_SALES_BY_CUSTOMER },
      { icon: '🏷️', color: Colors.warning, label: 'Sales by Item', description: 'Revenue breakdown by product', route: ROUTES.REPORT_SALES_BY_ITEM },
      { icon: '🧾', color: Colors.info, label: 'Tax Report', description: 'Sales tax collected & remitted', route: ROUTES.REPORT_SALES_TAX },
    ],
  },
  {
    title: 'PAYROLL',
    rows: [
      { icon: '💵', color: Colors.success, label: 'Payroll Summary', description: 'Gross, deductions & net by period', route: ROUTES.REPORT_PAYROLL_SUMMARY },
      { icon: '🏛️', color: Colors.primary, label: 'Tax Liability', description: 'Payroll tax obligations' },
    ],
  },
  {
    title: 'DELIVERY',
    rows: [
      { icon: '🚚', color: Colors.deliveryAccent, label: 'Daily Summary', description: 'Deliveries completed & pending' },
      { icon: '📈', color: Colors.info, label: 'Performance', description: 'On-time rate & driver metrics' },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────
const ReportsHubScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  const handlePress = (route?: string) => {
    if (route) navigation.navigate(route);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <Text style={styles.subtitle}>Financial reports & analytics</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {SECTIONS.map((section) => (
          <View key={section.title}>
            <Text style={styles.sectionLabel}>{section.title}</Text>
            <View style={styles.sectionCard}>
              {section.rows.map((row, idx) => (
                <React.Fragment key={row.label}>
                  {idx > 0 && <View style={styles.divider} />}
                  <TouchableOpacity
                    style={styles.row}
                    activeOpacity={0.6}
                    onPress={() => handlePress(row.route)}
                  >
                    <View style={[styles.iconCircle, { backgroundColor: row.color + '18' }]}>
                      <Text style={styles.iconText}>{row.icon}</Text>
                    </View>
                    <View style={styles.rowText}>
                      <Text style={styles.rowLabel}>{row.label}</Text>
                      <Text style={styles.rowDesc}>{row.description}</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
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
  scrollContent: {
    padding: Spacing.base,
    paddingBottom: Spacing.huge,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  sectionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: 60,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  iconText: { fontSize: 18 },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  rowDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  chevron: {
    fontSize: 22,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
  },
});

export default ReportsHubScreen;
