// ============================================================
// FINMATRIX - Run Payroll Screen  (4-Step Wizard)
// ============================================================
// Step 1: Select pay period (start, end, pay date) + employee count
// Step 2: Payroll worksheet – editable hours for hourly, auto-calc
// Step 3: Review totals (gross / deductions / net)
// Step 4: Confirm → Process → Success

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { PayrollEntry } from '../../dummy-data/payrollRuns';
import { employees } from '../../dummy-data/employees';
import { generatePayrollEntriesAPI } from '../../network/payrollNetwork';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { createPayrollRun, processPayroll } from './payrollSlice';

// ─── Constants ──────────────────────────────────────────────
const STEPS = ['Pay Period', 'Worksheet', 'Review', 'Confirm'];
const r2 = (n: number) => Math.round(n * 100) / 100;
const fmt = (n: number) =>
  '$' +
  n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const today = new Date();
const defaultStart = (() => {
  const d = new Date(today.getFullYear(), today.getMonth(), 1);
  return d.toISOString().split('T')[0];
})();
const defaultEnd = (() => {
  const d = new Date(today.getFullYear(), today.getMonth(), 15);
  return d.toISOString().split('T')[0];
})();
const defaultPayDate = (() => {
  const d = new Date(today.getFullYear(), today.getMonth(), 20);
  return d.toISOString().split('T')[0];
})();

// ─── Component ──────────────────────────────────────────────
const RunPayrollScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState(0);
  const [periodStart, setPeriodStart] = useState(defaultStart);
  const [periodEnd, setPeriodEnd] = useState(defaultEnd);
  const [payDate, setPayDate] = useState(defaultPayDate);
  const [entries, setEntries] = useState<PayrollEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [newPayrollId, setNewPayrollId] = useState<string | null>(null);

  const activeCount = useMemo(
    () => employees.filter((e) => e.isActive).length,
    [],
  );

  // Load default entries when stepping to worksheet
  useEffect(() => {
    if (step === 1 && entries.length === 0) {
      loadEntries();
    }
  }, [step]);

  const loadEntries = async () => {
    setLoading(true);
    try {
      const generated = await generatePayrollEntriesAPI();
      setEntries(generated);
    } catch {
      Alert.alert('Error', 'Failed to generate payroll entries');
    } finally {
      setLoading(false);
    }
  };

  // Recalculate a single hourly entry
  const recalcEntry = useCallback(
    (idx: number, hours: number, ot: number) => {
      setEntries((prev) => {
        const list = [...prev];
        const old = list[idx];
        const emp = employees.find((e) => e.employeeId === old.employeeId);
        if (!emp) return prev;

        const findRate = (type: string) =>
          emp.deductions.find((d) => d.type === type)?.rate ?? 0;

        const grossPay = r2(hours * emp.payRate + ot * (emp.overtimeRate ?? 0));
        const federalTax = r2(grossPay * findRate('Federal Tax'));
        const stateTax = r2(grossPay * findRate('State Tax'));
        const socialSecurity = r2(grossPay * findRate('Social Security'));
        const medicare = r2(grossPay * findRate('Medicare'));
        const healthInsurance = r2(grossPay * findRate('Health Insurance'));
        const retirement = r2(grossPay * findRate('401k'));
        const totalDeductions = r2(
          federalTax +
            stateTax +
            socialSecurity +
            medicare +
            healthInsurance +
            retirement,
        );
        const netPay = r2(grossPay - totalDeductions);

        list[idx] = {
          ...old,
          hoursWorked: hours,
          overtimeHours: ot,
          grossPay,
          federalTax,
          stateTax,
          socialSecurity,
          medicare,
          healthInsurance,
          retirement,
          totalDeductions,
          netPay,
        };
        return list;
      });
    },
    [],
  );

  // ─── Totals ────────────────────────────────────────────────
  const totals = useMemo(() => {
    const totalGross = r2(entries.reduce((s, e) => s + e.grossPay, 0));
    const totalDed = r2(entries.reduce((s, e) => s + e.totalDeductions, 0));
    const totalNet = r2(entries.reduce((s, e) => s + e.netPay, 0));
    return { totalGross, totalDed, totalNet };
  }, [entries]);

  // ─── Actions ───────────────────────────────────────────────
  const canNext = () => {
    if (step === 0) return periodStart && periodEnd && payDate;
    if (step === 1) return entries.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      const result = await dispatch(
        createPayrollRun({
          companyId: 'comp_001',
          payPeriodStart: periodStart,
          payPeriodEnd: periodEnd,
          payDate,
          entries,
          totalGross: totals.totalGross,
          totalDeductions: totals.totalDed,
          totalNet: totals.totalNet,
          status: 'draft',
          createdBy: 'admin_001',
        }),
      ).unwrap();

      const processed = await dispatch(processPayroll(result.payrollId)).unwrap();
      setNewPayrollId(processed.payrollId);
      setSuccess(true);
    } catch {
      Alert.alert('Error', 'Failed to process payroll');
    } finally {
      setProcessing(false);
    }
  };

  // ─── Render Helpers ────────────────────────────────────────
  const renderStepIndicator = () => (
    <View style={styles.stepBar}>
      {STEPS.map((label, i) => (
        <View key={label} style={styles.stepItem}>
          <View
            style={[
              styles.stepCircle,
              i <= step && styles.stepCircleActive,
              i < step && styles.stepCircleComplete,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                i <= step && styles.stepNumberActive,
              ]}
            >
              {i < step ? '✓' : i + 1}
            </Text>
          </View>
          <Text
            style={[
              styles.stepLabel,
              i <= step && styles.stepLabelActive,
            ]}
          >
            {label}
          </Text>
          {i < STEPS.length - 1 && (
            <View
              style={[
                styles.stepLine,
                i < step && styles.stepLineComplete,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  // Step 1
  const renderPayPeriod = () => (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Pay Period Details</Text>
      <Text style={styles.fieldLabel}>Period Start</Text>
      <TextInput
        style={styles.input}
        value={periodStart}
        onChangeText={setPeriodStart}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={Colors.placeholder}
      />
      <Text style={styles.fieldLabel}>Period End</Text>
      <TextInput
        style={styles.input}
        value={periodEnd}
        onChangeText={setPeriodEnd}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={Colors.placeholder}
      />
      <Text style={styles.fieldLabel}>Pay Date</Text>
      <TextInput
        style={styles.input}
        value={payDate}
        onChangeText={setPayDate}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={Colors.placeholder}
      />
      <View style={styles.infoRow}>
        <Text style={styles.infoIcon}>👥</Text>
        <Text style={styles.infoText}>
          {activeCount} active employees will be included
        </Text>
      </View>
    </View>
  );

  // Step 2
  const renderWorksheet = () => {
    if (loading) {
      return (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Generating payroll...</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={entries}
        keyExtractor={(e) => e.employeeId}
        scrollEnabled={false}
        renderItem={({ item, index }) => {
          const isHourly = item.hoursWorked !== null;
          return (
            <View style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryName}>{item.employeeName}</Text>
                <Text style={styles.entryGross}>{fmt(item.grossPay)}</Text>
              </View>
              {isHourly ? (
                <View style={styles.hourlyRow}>
                  <View style={styles.hourField}>
                    <Text style={styles.hourLabel}>Hours</Text>
                    <TextInput
                      style={styles.hourInput}
                      value={String(item.hoursWorked ?? 0)}
                      keyboardType="numeric"
                      onChangeText={(v) => {
                        const h = parseFloat(v) || 0;
                        recalcEntry(index, h, item.overtimeHours ?? 0);
                      }}
                    />
                  </View>
                  <View style={styles.hourField}>
                    <Text style={styles.hourLabel}>OT Hours</Text>
                    <TextInput
                      style={styles.hourInput}
                      value={String(item.overtimeHours ?? 0)}
                      keyboardType="numeric"
                      onChangeText={(v) => {
                        const ot = parseFloat(v) || 0;
                        recalcEntry(index, item.hoursWorked ?? 80, ot);
                      }}
                    />
                  </View>
                  <View style={styles.hourField}>
                    <Text style={styles.hourLabel}>Net</Text>
                    <Text style={styles.netValue}>{fmt(item.netPay)}</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.salaryRow}>
                  <Text style={styles.salaryLabel}>Salaried</Text>
                  <Text style={styles.salaryDeductions}>
                    Deductions: {fmt(item.totalDeductions)}
                  </Text>
                  <Text style={styles.netValue}>Net: {fmt(item.netPay)}</Text>
                </View>
              )}
            </View>
          );
        }}
      />
    );
  };

  // Step 3
  const renderReview = () => (
    <View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Payroll Summary</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pay Period</Text>
          <Text style={styles.summaryValue}>
            {periodStart} – {periodEnd}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Pay Date</Text>
          <Text style={styles.summaryValue}>{payDate}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Employees</Text>
          <Text style={styles.summaryValue}>{entries.length}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Gross Pay</Text>
          <Text style={[styles.summaryValue, styles.grossText]}>
            {fmt(totals.totalGross)}
          </Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Deductions</Text>
          <Text style={[styles.summaryValue, styles.dedText]}>
            -{fmt(totals.totalDed)}
          </Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.summaryRow}>
          <Text style={[styles.summaryLabel, styles.netLabel]}>Total Net Pay</Text>
          <Text style={[styles.summaryValue, styles.netTotal]}>
            {fmt(totals.totalNet)}
          </Text>
        </View>
      </View>

      {/* Per-employee breakdown */}
      <Text style={styles.sectionLabel}>EMPLOYEE BREAKDOWN</Text>
      {entries.map((e) => (
        <View key={e.employeeId} style={styles.breakdownRow}>
          <Text style={styles.breakdownName}>{e.employeeName}</Text>
          <View style={styles.breakdownAmounts}>
            <Text style={styles.breakdownGross}>{fmt(e.grossPay)}</Text>
            <Text style={styles.breakdownNet}>{fmt(e.netPay)}</Text>
          </View>
        </View>
      ))}
    </View>
  );

  // Step 4
  const renderConfirm = () => {
    if (success) {
      return (
        <View style={styles.successContainer}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Payroll Processed!</Text>
          <Text style={styles.successSubtitle}>
            {entries.length} employees paid · {fmt(totals.totalNet)} disbursed
          </Text>
          <Text style={styles.successId}>Run ID: {newPayrollId}</Text>
          <TouchableOpacity
            style={styles.doneButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.doneButtonText}>Done</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={styles.card}>
        <Text style={styles.confirmIcon}>⚠️</Text>
        <Text style={styles.confirmTitle}>Process Payroll?</Text>
        <Text style={styles.confirmText}>
          This will finalize payroll for {entries.length} employees with a total
          net disbursement of {fmt(totals.totalNet)}. This action cannot be
          undone.
        </Text>
        <View style={styles.confirmDetails}>
          <Text style={styles.confirmDetail}>
            Period: {periodStart} – {periodEnd}
          </Text>
          <Text style={styles.confirmDetail}>Pay Date: {payDate}</Text>
          <Text style={styles.confirmDetail}>
            Gross: {fmt(totals.totalGross)}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.processButton, processing && styles.buttonDisabled]}
          onPress={handleProcess}
          disabled={processing}
        >
          {processing ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.processButtonText}>
              Process Payroll
            </Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  // ─── Main Render ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Run Payroll</Text>
      </View>

      {renderStepIndicator()}

      <ScrollView
        style={styles.body}
        contentContainerStyle={styles.bodyContent}
        showsVerticalScrollIndicator={false}
      >
        {step === 0 && renderPayPeriod()}
        {step === 1 && renderWorksheet()}
        {step === 2 && renderReview()}
        {step === 3 && renderConfirm()}
      </ScrollView>

      {/* Navigation buttons (hidden on success) */}
      {!success && (
        <View style={styles.footer}>
          {step > 0 && step < 3 && (
            <TouchableOpacity style={styles.backBtn} onPress={handleBack}>
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          {step < 3 && (
            <TouchableOpacity
              style={[
                styles.nextBtn,
                !canNext() && styles.buttonDisabled,
                step === 0 && { flex: 1 },
              ]}
              onPress={handleNext}
              disabled={!canNext()}
            >
              <Text style={styles.nextBtnText}>
                {step === 2 ? 'Proceed to Confirm' : 'Next'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
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
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: { marginRight: Spacing.md },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },

  // Step indicator
  stepBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleActive: { backgroundColor: Colors.primary },
  stepCircleComplete: { backgroundColor: Colors.success },
  stepNumber: { fontSize: 12, fontWeight: '700', color: Colors.textTertiary },
  stepNumberActive: { color: Colors.white },
  stepLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    marginLeft: 4,
    marginRight: 4,
  },
  stepLabelActive: { color: Colors.primary, fontWeight: '600' },
  stepLine: {
    width: 20,
    height: 2,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 2,
  },
  stepLineComplete: { backgroundColor: Colors.success },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: Spacing.base, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Fields
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: 15,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.base,
    padding: Spacing.md,
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
  },
  infoIcon: { fontSize: 18, marginRight: Spacing.sm },
  infoText: { fontSize: 14, color: Colors.textSecondary },

  // Worksheet entry
  entryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  entryName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  entryGross: { fontSize: 15, fontWeight: '700', color: Colors.success },

  hourlyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  hourField: { flex: 1 },
  hourLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  hourInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    fontSize: 14,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  netValue: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  salaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  salaryLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
  salaryDeductions: { fontSize: 12, color: Colors.textSecondary },

  // Review
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
  },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  grossText: { color: Colors.textPrimary },
  dedText: { color: Colors.danger },
  netLabel: { fontWeight: '700', fontSize: 16 },
  netTotal: { fontWeight: '700', fontSize: 18, color: Colors.success },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 0.8,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: Spacing.md,
    marginBottom: 1,
    borderRadius: BorderRadius.xs,
  },
  breakdownName: { fontSize: 14, color: Colors.textPrimary, flex: 1 },
  breakdownAmounts: { flexDirection: 'row', gap: Spacing.base },
  breakdownGross: { fontSize: 13, color: Colors.textSecondary, width: 80, textAlign: 'right' },
  breakdownNet: { fontSize: 13, fontWeight: '600', color: Colors.success, width: 80, textAlign: 'right' },

  // Confirm
  confirmIcon: { fontSize: 40, textAlign: 'center', marginBottom: Spacing.sm },
  confirmTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  confirmText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.base,
  },
  confirmDetails: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  confirmDetail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  processButton: {
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  processButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // Success
  successContainer: { alignItems: 'center', paddingTop: Spacing.xxl },
  successIcon: { fontSize: 60, marginBottom: Spacing.md },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: Spacing.sm,
  },
  successSubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  successId: {
    fontSize: 13,
    color: Colors.textTertiary,
    marginBottom: Spacing.xxl,
  },
  doneButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xxl,
  },
  doneButtonText: { color: Colors.white, fontSize: 16, fontWeight: '700' },

  // Footer
  footer: {
    flexDirection: 'row',
    padding: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.white,
    gap: Spacing.sm,
  },
  backBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  backBtnText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  nextBtn: {
    flex: 2,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  nextBtnText: { color: Colors.white, fontSize: 15, fontWeight: '700' },
  buttonDisabled: { opacity: 0.5 },

  centered: { alignItems: 'center', paddingTop: Spacing.xxl },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 14,
    color: Colors.textSecondary,
  },
});

export default RunPayrollScreen;
