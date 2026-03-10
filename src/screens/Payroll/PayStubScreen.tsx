// ============================================================
// FINMATRIX - Pay Stub Screen
// ============================================================
// Shows individual employee pay stubs for a payroll run.
// Params: { payrollId, employeeId? }
// If employeeId provided → single stub, else → scrollable list of all.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { PayrollRun, PayrollEntry } from '../../dummy-data/payrollRuns';
import { getPayrollByIdAPI } from '../../network/payrollNetwork';

type Params = { payrollId: string; employeeId?: string };

const fmt = (n: number) =>
  '$' +
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string) => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const PayStubScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, Params>, string>>();
  const { payrollId, employeeId } = route.params;

  const [run, setRun] = useState<PayrollRun | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPayrollByIdAPI(payrollId);
        setRun(data);
      } catch {
        // handled below
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [payrollId]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!run) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.errorText}>Payroll run not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const entries = employeeId
    ? run.entries.filter((e) => e.employeeId === employeeId)
    : run.entries;

  const renderStub = (entry: PayrollEntry) => (
    <View key={entry.employeeId} style={styles.stubCard}>
      {/* Header */}
      <View style={styles.stubHeader}>
        <Text style={styles.stubName}>{entry.employeeName}</Text>
        <View
          style={[
            styles.statusBadge,
            run.status === 'processed'
              ? styles.statusProcessed
              : styles.statusDraft,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              run.status === 'processed'
                ? styles.statusProcessedText
                : styles.statusDraftText,
            ]}
          >
            {run.status.toUpperCase()}
          </Text>
        </View>
      </View>

      <Text style={styles.stubPeriod}>
        {formatDate(run.payPeriodStart)} – {formatDate(run.payPeriodEnd)}
      </Text>
      <Text style={styles.stubPayDate}>Pay Date: {formatDate(run.payDate)}</Text>

      {/* Earnings */}
      <Text style={styles.sectionTitle}>EARNINGS</Text>
      <View style={styles.detailRow}>
        <Text style={styles.detailLabel}>
          {entry.hoursWorked !== null ? 'Regular Hours' : 'Salary (Semi-Monthly)'}
        </Text>
        <Text style={styles.detailValue}>
          {entry.hoursWorked !== null
            ? `${entry.hoursWorked} hrs`
            : ''}
        </Text>
      </View>
      {entry.overtimeHours !== null && entry.overtimeHours > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Overtime Hours</Text>
          <Text style={styles.detailValue}>{entry.overtimeHours} hrs</Text>
        </View>
      )}
      <View style={[styles.detailRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Gross Pay</Text>
        <Text style={styles.totalValue}>{fmt(entry.grossPay)}</Text>
      </View>

      {/* Deductions */}
      <Text style={styles.sectionTitle}>DEDUCTIONS</Text>
      {entry.federalTax > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Federal Tax</Text>
          <Text style={styles.dedValue}>-{fmt(entry.federalTax)}</Text>
        </View>
      )}
      {entry.stateTax > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>State Tax</Text>
          <Text style={styles.dedValue}>-{fmt(entry.stateTax)}</Text>
        </View>
      )}
      {entry.socialSecurity > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Social Security</Text>
          <Text style={styles.dedValue}>-{fmt(entry.socialSecurity)}</Text>
        </View>
      )}
      {entry.medicare > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Medicare</Text>
          <Text style={styles.dedValue}>-{fmt(entry.medicare)}</Text>
        </View>
      )}
      {entry.healthInsurance > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Health Insurance</Text>
          <Text style={styles.dedValue}>-{fmt(entry.healthInsurance)}</Text>
        </View>
      )}
      {entry.retirement > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>401(k) Retirement</Text>
          <Text style={styles.dedValue}>-{fmt(entry.retirement)}</Text>
        </View>
      )}
      <View style={[styles.detailRow, styles.totalRow]}>
        <Text style={styles.totalLabel}>Total Deductions</Text>
        <Text style={[styles.totalValue, { color: Colors.danger }]}>
          -{fmt(entry.totalDeductions)}
        </Text>
      </View>

      {/* Net Pay */}
      <View style={styles.netPayBox}>
        <Text style={styles.netPayLabel}>NET PAY</Text>
        <Text style={styles.netPayAmount}>{fmt(entry.netPay)}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>
          {employeeId ? 'Pay Stub' : 'Pay Stubs'}
        </Text>
        <Text style={styles.runId}>{run.payrollId}</Text>
      </View>

      {/* Run summary (when showing all) */}
      {!employeeId && (
        <View style={styles.runSummary}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Gross</Text>
            <Text style={styles.summaryValue}>{fmt(run.totalGross)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Deductions</Text>
            <Text style={[styles.summaryValue, { color: Colors.danger }]}>
              -{fmt(run.totalDeductions)}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Net</Text>
            <Text style={[styles.summaryValue, { color: Colors.success }]}>
              {fmt(run.totalNet)}
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {entries.map(renderStub)}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: { justifyContent: 'center', alignItems: 'center' },
  errorText: { fontSize: 16, color: Colors.danger, marginBottom: Spacing.sm },
  linkText: { fontSize: 15, color: Colors.primary, fontWeight: '600' },

  // Header
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
  runId: { fontSize: 12, color: Colors.textTertiary },

  // Run summary
  runSummary: {
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

  content: { padding: Spacing.base, paddingBottom: Spacing.huge },

  // Stub card
  stubCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  stubHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  stubName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  statusProcessed: { backgroundColor: '#E8F5E9' },
  statusDraft: { backgroundColor: '#FFF3E0' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusProcessedText: { color: Colors.success },
  statusDraftText: { color: Colors.warning },
  stubPeriod: { fontSize: 13, color: Colors.textSecondary },
  stubPayDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },

  // Section title
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailLabel: { fontSize: 14, color: Colors.textSecondary },
  detailValue: { fontSize: 14, color: Colors.textPrimary },
  dedValue: { fontSize: 14, color: Colors.danger },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  totalValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  // Net pay box
  netPayBox: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    padding: Spacing.base,
    alignItems: 'center',
  },
  netPayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
    letterSpacing: 1,
    marginBottom: 4,
  },
  netPayAmount: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
  },
});

export default PayStubScreen;
