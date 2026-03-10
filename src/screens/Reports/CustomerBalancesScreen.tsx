// ============================================================
// FINMATRIX - Customer Balances Screen
// ============================================================
// Table: Customer Name | Total Invoiced | Total Paid | Balance Due
// Tap row → navigate to CustomerDetail.

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { customers } from '../../dummy-data/customers';
import { ROUTES } from '../../navigations-map/Base';
import { formatCurrency } from '../../utils/formatters';

// ─── Build data ─────────────────────────────────────────────
interface BalanceRow {
  customerId: string;
  name: string;
  company: string;
  totalInvoiced: number;
  totalPaid: number;
  balance: number;
}

const buildRows = (): BalanceRow[] => {
  return customers
    .filter((c) => c.isActive)
    .map((c) => ({
      customerId: c.customerId,
      name: c.name,
      company: c.company,
      totalInvoiced: c.totalPurchases,
      totalPaid: c.totalPurchases - c.balance,
      balance: c.balance,
    }))
    .sort((a, b) => b.balance - a.balance);
};

// ─── Component ──────────────────────────────────────────────
const CustomerBalancesScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [refreshing, setRefreshing] = useState(false);
  const rows = useMemo(buildRows, []);

  const totalOutstanding = useMemo(
    () => rows.reduce((s, r) => s + r.balance, 0),
    [rows],
  );
  const totalInvoiced = useMemo(
    () => rows.reduce((s, r) => s + r.totalInvoiced, 0),
    [rows],
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={s.title}>Customer Balances</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Summary bar */}
      <View style={s.summaryBar}>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Customers</Text>
          <Text style={s.summaryValue}>{rows.length}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Total Invoiced</Text>
          <Text style={s.summaryValue}>{formatCurrency(totalInvoiced)}</Text>
        </View>
        <View style={s.summaryItem}>
          <Text style={s.summaryLabel}>Total Outstanding</Text>
          <Text style={[s.summaryValue, { color: Colors.danger }]}>
            {formatCurrency(totalOutstanding)}
          </Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Table header */}
        <View style={s.tableHeader}>
          <Text style={[s.thCell, s.nameCol]}>Customer</Text>
          <Text style={[s.thCell, s.amtCol]}>Invoiced</Text>
          <Text style={[s.thCell, s.amtCol]}>Paid</Text>
          <Text style={[s.thCell, s.amtCol]}>Balance</Text>
        </View>

        {rows.map((row, idx) => (
          <TouchableOpacity
            key={row.customerId}
            style={[s.tableRow, idx % 2 === 0 && s.tableRowAlt]}
            activeOpacity={0.6}
            onPress={() =>
              navigation.navigate(ROUTES.CUSTOMER_DETAIL, {
                customerId: row.customerId,
              })
            }
          >
            <View style={s.nameCol}>
              <Text style={s.customerName} numberOfLines={1}>
                {row.name}
              </Text>
              <Text style={s.companyName} numberOfLines={1}>
                {row.company}
              </Text>
            </View>
            <Text style={[s.tdCell, s.amtCol]}>
              {formatCurrency(row.totalInvoiced)}
            </Text>
            <Text style={[s.tdCell, s.amtCol, { color: Colors.success }]}>
              {formatCurrency(row.totalPaid)}
            </Text>
            <Text
              style={[
                s.tdCell,
                s.amtCol,
                s.bold,
                row.balance > 0 && { color: Colors.danger },
              ]}
            >
              {formatCurrency(row.balance)}
            </Text>
          </TouchableOpacity>
        ))}

        {/* Totals row */}
        <View style={s.tableTotalRow}>
          <Text style={[s.totalCell, s.nameCol]}>TOTALS</Text>
          <Text style={[s.totalCell, s.amtCol]}>
            {formatCurrency(totalInvoiced)}
          </Text>
          <Text style={[s.totalCell, s.amtCol]}>
            {formatCurrency(totalInvoiced - totalOutstanding)}
          </Text>
          <Text style={[s.totalCell, s.amtCol]}>
            {formatCurrency(totalOutstanding)}
          </Text>
        </View>

        <View style={{ height: Spacing.huge }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },

  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryItem: { alignItems: 'center' },
  summaryLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  summaryValue: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  scroll: { paddingBottom: 100 },

  tableHeader: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
  },
  thCell: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
  },
  nameCol: { width: 130, paddingHorizontal: 6 },
  amtCol: { flex: 1, textAlign: 'right', paddingHorizontal: 6 },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tableRowAlt: { backgroundColor: Colors.background },
  customerName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  companyName: { fontSize: 11, color: Colors.textTertiary },
  tdCell: { fontSize: 12, color: Colors.textPrimary },
  bold: { fontWeight: '700' },

  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
  },
  totalCell: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
  },
});

export default CustomerBalancesScreen;
