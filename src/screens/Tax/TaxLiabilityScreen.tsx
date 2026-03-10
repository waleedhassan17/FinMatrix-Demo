// ============================================================
// FINMATRIX - Tax Liability Screen
// ============================================================
// Date range picker. Table: Tax | Collected | Paid | Net Liability.
// Total row. "Record Payment" button.

import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { fetchTaxRates, fetchTaxPayments } from './taxSlice';
import { invoices } from '../../dummy-data/invoices';
import { bills } from '../../dummy-data/bills';

const fmtCur = (n: number) =>
  (n < 0 ? '-' : '') +
  '$' +
  Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Component ──────────────────────────────────────────────
const TaxLiabilityScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { rates, payments } = useAppSelector((s) => s.tax);

  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-03-03');

  useEffect(() => {
    dispatch(fetchTaxRates());
    dispatch(fetchTaxPayments());
  }, []);

  // ── Compute liability rows ────────────────────────────────
  const rows = useMemo(() => {
    // Total tax collected from invoices in date range (non-cancelled)
    const filteredInvoices = invoices.filter(
      (inv) =>
        inv.status !== 'cancelled' &&
        inv.date >= startDate &&
        inv.date <= endDate,
    );
    const totalInvTax = filteredInvoices.reduce((s, inv) => s + inv.taxAmount, 0);

    // Total tax paid via bills in date range
    const filteredBills = bills.filter(
      (b) =>
        b.status !== 'draft' &&
        b.date >= startDate &&
        b.date <= endDate,
    );
    const totalBillTax = filteredBills.reduce((s, b) => s + b.taxAmount, 0);

    // Tax payments made in date range
    const filteredPayments = payments.filter(
      (p) => p.date >= startDate && p.date <= endDate,
    );

    // Distribute proportionally across active rates
    const activeRates = rates.filter((r) => r.isActive);
    const totalRate = activeRates.reduce((s, r) => s + r.rate, 0);

    return activeRates.map((rate) => {
      const proportion = totalRate > 0 ? rate.rate / totalRate : 0;
      const collected = Math.round(totalInvTax * proportion * 100) / 100;
      const paidViaBills = Math.round(totalBillTax * proportion * 100) / 100;
      const directPayments = filteredPayments
        .filter((p) => p.taxId === rate.taxId)
        .reduce((s, p) => s + p.amount, 0);

      const netLiability = collected - paidViaBills - directPayments;

      return {
        taxId: rate.taxId,
        name: rate.name,
        rate: rate.rate,
        collected,
        paid: Math.round((paidViaBills + directPayments) * 100) / 100,
        netLiability: Math.round(netLiability * 100) / 100,
      };
    });
  }, [rates, payments, startDate, endDate]);

  const totals = useMemo(
    () => ({
      collected: rows.reduce((s, r) => s + r.collected, 0),
      paid: rows.reduce((s, r) => s + r.paid, 0),
      net: rows.reduce((s, r) => s + r.netLiability, 0),
    }),
    [rows],
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tax Liability</Text>
        <View style={{ width: 50 }} />
      </View>

      {/* Date range */}
      <View style={styles.dateRow}>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>From</Text>
          <TextInput
            style={styles.dateInput}
            value={startDate}
            onChangeText={setStartDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.placeholder}
          />
        </View>
        <Text style={styles.dateSep}>→</Text>
        <View style={styles.dateField}>
          <Text style={styles.dateLabel}>To</Text>
          <TextInput
            style={styles.dateInput}
            value={endDate}
            onChangeText={setEndDate}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={Colors.placeholder}
          />
        </View>
      </View>

      {/* Summary cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.success }]}>
          <Text style={styles.sumLabel}>Collected</Text>
          <Text style={[styles.sumValue, { color: Colors.success }]}>
            {fmtCur(totals.collected)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { borderLeftColor: Colors.info }]}>
          <Text style={styles.sumLabel}>Paid</Text>
          <Text style={[styles.sumValue, { color: Colors.info }]}>
            {fmtCur(totals.paid)}
          </Text>
        </View>
        <View
          style={[
            styles.summaryCard,
            { borderLeftColor: totals.net >= 0 ? Colors.danger : Colors.success },
          ]}
        >
          <Text style={styles.sumLabel}>Net Liability</Text>
          <Text
            style={[
              styles.sumValue,
              { color: totals.net >= 0 ? Colors.danger : Colors.success },
            ]}
          >
            {fmtCur(totals.net)}
          </Text>
        </View>
      </View>

      {/* Table */}
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.tableCard}>
          {/* Header row */}
          <View style={styles.thRow}>
            <Text style={[styles.th, styles.nameCol]}>Tax</Text>
            <Text style={[styles.th, styles.numCol]}>Collected</Text>
            <Text style={[styles.th, styles.numCol]}>Paid</Text>
            <Text style={[styles.th, styles.numCol]}>Net</Text>
          </View>

          {rows.map((row, idx) => (
            <View
              key={row.taxId}
              style={[styles.tr, idx % 2 === 0 && styles.trAlt]}
            >
              <View style={styles.nameCol}>
                <Text style={styles.cellName}>{row.name}</Text>
                <Text style={styles.cellRate}>{row.rate}%</Text>
              </View>
              <Text style={[styles.cellNum, styles.numCol]}>
                {fmtCur(row.collected)}
              </Text>
              <Text style={[styles.cellNum, styles.numCol]}>
                {fmtCur(row.paid)}
              </Text>
              <Text
                style={[
                  styles.cellNum,
                  styles.numCol,
                  {
                    color:
                      row.netLiability >= 0 ? Colors.danger : Colors.success,
                    fontWeight: '700',
                  },
                ]}
              >
                {fmtCur(row.netLiability)}
              </Text>
            </View>
          ))}

          {/* Totals */}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.nameCol]}>TOTALS</Text>
            <Text style={[styles.totalCell, styles.numCol]}>
              {fmtCur(totals.collected)}
            </Text>
            <Text style={[styles.totalCell, styles.numCol]}>
              {fmtCur(totals.paid)}
            </Text>
            <Text
              style={[
                styles.totalCell,
                styles.numCol,
                { color: totals.net >= 0 ? Colors.danger : Colors.success },
              ]}
            >
              {fmtCur(totals.net)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Record Payment FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate(ROUTES.TAX_PAYMENT)}
      >
        <Text style={styles.fabText}>💳 Record Payment</Text>
      </TouchableOpacity>
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

  // Date range
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 4 },
  dateInput: {
    height: 38,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  dateSep: {
    marginHorizontal: Spacing.sm,
    fontSize: 16,
    color: Colors.textTertiary,
    marginTop: 14,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    padding: Spacing.base,
    gap: Spacing.sm,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    borderLeftWidth: 3,
    ...Shadows.sm,
  },
  sumLabel: { fontSize: 10, color: Colors.textTertiary, marginBottom: 2 },
  sumValue: { fontSize: 14, fontWeight: '700' },

  // Table
  tableCard: {
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  thRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
  },
  th: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    paddingHorizontal: 6,
  },
  nameCol: { flex: 2, paddingHorizontal: 6 },
  numCol: { flex: 1.2, textAlign: 'right', paddingHorizontal: 6 },

  tr: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    alignItems: 'center',
  },
  trAlt: { backgroundColor: Colors.background },
  cellName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  cellRate: { fontSize: 11, color: Colors.textTertiary },
  cellNum: { fontSize: 12, color: Colors.textPrimary },

  totalRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    alignItems: 'center',
  },
  totalLabel: { fontSize: 12, fontWeight: '800', color: Colors.primary },
  totalCell: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'right',
    paddingHorizontal: 6,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    left: Spacing.base,
    right: Spacing.base,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    ...Shadows.md,
  },
  fabText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});

export default TaxLiabilityScreen;
