// ============================================================
// FINMATRIX - Budget Form Screen
// ============================================================
// Editable table: Account | Jan…Dec | Total.
// "Distribute Evenly" per row. Total row at bottom.

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { budgets, BudgetLineItem } from '../../dummy-data/budgets';

const MO = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const fmtCur = (n: number) =>
  '$' +
  Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// ─── Component ──────────────────────────────────────────────
const BudgetFormScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const budgetId = route.params?.budgetId;
  const existing = budgets.find((b) => b.budgetId === budgetId);

  const [year, setYear] = useState(existing?.year?.toString() ?? '2026');
  const [name, setName] = useState(
    existing?.name ?? `Annual Operating Budget ${year}`,
  );

  // Deep-clone line items so edits don't mutate dummy data
  const [lines, setLines] = useState<BudgetLineItem[]>(() => {
    if (existing) {
      return existing.lineItems.map((li) => ({
        ...li,
        monthly: [...li.monthly],
        annualTotal: li.annualTotal,
      }));
    }
    return [];
  });

  // ── Handlers ──────────────────────────────────────────────
  const updateCell = useCallback(
    (lineIdx: number, monthIdx: number, value: string) => {
      setLines((prev) => {
        const next = [...prev];
        const li = { ...next[lineIdx], monthly: [...next[lineIdx].monthly] };
        li.monthly[monthIdx] = parseFloat(value) || 0;
        li.annualTotal = li.monthly.reduce((a, b) => a + b, 0);
        next[lineIdx] = li;
        return next;
      });
    },
    [],
  );

  const distributeEvenly = useCallback((lineIdx: number) => {
    setLines((prev) => {
      const next = [...prev];
      const li = { ...next[lineIdx], monthly: [...next[lineIdx].monthly] };
      const avg = Math.round(li.annualTotal / 12);
      li.monthly = li.monthly.map(() => avg);
      // Fix rounding by putting remainder in Dec
      const diff = li.annualTotal - avg * 12;
      li.monthly[11] += diff;
      next[lineIdx] = li;
      return next;
    });
  }, []);

  const handleSave = () => {
    Alert.alert('Saved', `Budget "${name}" saved successfully.`);
    navigation.goBack();
  };

  // ── Totals row ────────────────────────────────────────────
  const monthlyTotals = useMemo(() => {
    const totals = Array(12).fill(0);
    for (const li of lines) {
      for (let m = 0; m < 12; m++) totals[m] += li.monthly[m];
    }
    return totals as number[];
  }, [lines]);

  const grandTotal = monthlyTotals.reduce((a, b) => a + b, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {existing ? 'Edit Budget' : 'New Budget'}
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Name / Year */}
      <View style={styles.metaRow}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput
            style={styles.fieldInput}
            value={name}
            onChangeText={setName}
          />
        </View>
        <View style={{ width: 80 }}>
          <Text style={styles.fieldLabel}>Year</Text>
          <TextInput
            style={styles.fieldInput}
            value={year}
            onChangeText={setYear}
            keyboardType="numeric"
          />
        </View>
      </View>

      {/* Grand total header */}
      <View style={styles.grandRow}>
        <Text style={styles.grandLabel}>Grand Total</Text>
        <Text style={styles.grandValue}>{fmtCur(grandTotal)}</Text>
      </View>

      {/* Scrollable table */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Column headers */}
          <View style={styles.tableHeaderRow}>
            <Text style={[styles.th, styles.acctCol]}>Account</Text>
            {MO.map((m) => (
              <Text key={m} style={[styles.th, styles.moCol]}>
                {m}
              </Text>
            ))}
            <Text style={[styles.th, styles.totalCol]}>Total</Text>
            <Text style={[styles.th, styles.actionCol]} />
          </View>

          <ScrollView
            contentContainerStyle={{ paddingBottom: Spacing.huge }}
            showsVerticalScrollIndicator={false}
          >
            {lines.map((li, lIdx) => (
              <View
                key={li.accountId}
                style={[styles.tableRow, lIdx % 2 === 0 && styles.tableRowAlt]}
              >
                {/* Account name */}
                <View style={styles.acctCol}>
                  <Text style={styles.acctNum}>{li.accountNumber}</Text>
                  <Text style={styles.acctName} numberOfLines={1}>
                    {li.accountName}
                  </Text>
                </View>

                {/* Monthly cells */}
                {li.monthly.map((val, mIdx) => (
                  <View key={mIdx} style={styles.moCol}>
                    <TextInput
                      style={styles.cellInput}
                      value={val.toString()}
                      onChangeText={(v) => updateCell(lIdx, mIdx, v)}
                      keyboardType="numeric"
                      selectTextOnFocus
                    />
                  </View>
                ))}

                {/* Row total */}
                <View style={styles.totalCol}>
                  <Text style={styles.rowTotal}>{fmtCur(li.annualTotal)}</Text>
                </View>

                {/* Distribute button */}
                <TouchableOpacity
                  style={styles.actionCol}
                  onPress={() => distributeEvenly(lIdx)}
                >
                  <Text style={styles.distBtn}>⇄</Text>
                </TouchableOpacity>
              </View>
            ))}

            {/* Totals row */}
            <View style={styles.tableTotalRow}>
              <Text style={[styles.totalLabel, styles.acctCol]}>TOTALS</Text>
              {monthlyTotals.map((val, mIdx) => (
                <Text key={mIdx} style={[styles.totalCell, styles.moCol]}>
                  {fmtCur(val)}
                </Text>
              ))}
              <Text style={[styles.totalCell, styles.totalCol, { fontWeight: '800' }]}>
                {fmtCur(grandTotal)}
              </Text>
              <View style={styles.actionCol} />
            </View>
          </ScrollView>
        </View>
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
  saveText: { fontSize: 16, color: Colors.success, fontWeight: '700' },

  // Meta
  metaRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  fieldLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 4 },
  fieldInput: {
    height: 38,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    fontSize: 14,
    color: Colors.textPrimary,
  },

  grandRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.primary + '10',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  grandLabel: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  grandValue: { fontSize: 18, fontWeight: '800', color: Colors.primary },

  // Table
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
  },
  th: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.white,
    textAlign: 'center',
  },
  acctCol: { width: 140, paddingHorizontal: 4 },
  moCol: { width: 65, paddingHorizontal: 2, textAlign: 'center' },
  totalCol: { width: 75, paddingHorizontal: 4, textAlign: 'right' },
  actionCol: { width: 36, alignItems: 'center', justifyContent: 'center' },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  tableRowAlt: { backgroundColor: Colors.background },
  acctNum: { fontSize: 10, color: Colors.textTertiary },
  acctName: { fontSize: 12, color: Colors.textPrimary, fontWeight: '500' },

  cellInput: {
    height: 30,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 4,
    paddingHorizontal: 4,
    fontSize: 11,
    textAlign: 'right',
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  rowTotal: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'right',
  },
  distBtn: { fontSize: 16, color: Colors.primary },

  tableTotalRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary + '10',
    borderTopWidth: 2,
    borderTopColor: Colors.primary,
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.primary,
    paddingHorizontal: 4,
  },
  totalCell: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    textAlign: 'right',
  },
});

export default BudgetFormScreen;
