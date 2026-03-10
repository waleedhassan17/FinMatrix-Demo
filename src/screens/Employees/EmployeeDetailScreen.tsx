// ============================================================
// FINMATRIX - Employee Detail Screen
// ============================================================
// Params: { employeeId }
// Profile card: name, dept badge, position, hire date, status.
// Pay info: type, rate, overtime. Deductions table.
// YTD: Gross | Deductions | Net. 
// Recent pay stubs list.

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { getEmployeeByIdAPI } from '../../network/employeeNetwork';
import { Employee } from '../../dummy-data/employees';
import { toggleEmployeeActive, fetchEmployees } from './employeeSlice';
import { DEPARTMENT_COLORS, Department } from '../../models/employeeModel';
import { ROUTES } from '../../navigations-map/Base';
import SimpleTabBar from '../../Custom-Components/SimpleTabBar';

// ─── Helpers ────────────────────────────────────────────────
const formatCurrency = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// ─── Pay Stub dummy ─────────────────────────────────────────
interface PayStub {
  id: string;
  period: string;
  gross: number;
  deductions: number;
  net: number;
}

const generatePayStubs = (emp: Employee): PayStub[] => {
  if (emp.ytdGross === 0) return [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep'];
  const count = Math.min(Math.ceil(emp.ytdGross / (emp.payType === 'salary' ? emp.payRate / 12 : 3500)), 9);
  const stubs: PayStub[] = [];
  let remainGross = emp.ytdGross;
  let remainDed = emp.ytdDeductions;

  for (let i = 0; i < count; i++) {
    const gross = i === count - 1 ? remainGross : Math.round(emp.ytdGross / count);
    const ded = i === count - 1 ? remainDed : Math.round(emp.ytdDeductions / count);
    remainGross -= gross;
    remainDed -= ded;

    stubs.push({
      id: `stub_${emp.employeeId}_${i}`,
      period: `${months[i]} 2026`,
      gross,
      deductions: ded,
      net: gross - ded,
    });
  }
  return stubs.reverse(); // most recent first
};

// ─── Tab Bar ────────────────────────────────────────────────
type TabKey = 'overview' | 'deductions' | 'payStubs';

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  deductions: 'Deductions',
  payStubs: 'Pay Stubs',
};
const TAB_KEYS: TabKey[] = ['overview', 'deductions', 'payStubs'];

// ─── Main Component ─────────────────────────────────────────
const EmployeeDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const employeeId: string = route.params?.employeeId;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  const payStubs = useMemo(() => (employee ? generatePayStubs(employee) : []), [employee]);

  useEffect(() => {
    loadEmployee();
  }, [employeeId]);

  const loadEmployee = async () => {
    try {
      setIsLoading(true);
      const emp = await getEmployeeByIdAPI(employeeId);
      setEmployee(emp);
    } catch {
      Alert.alert('Error', 'Employee not found.');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = () => {
    if (!employee) return;
    const action = employee.isActive ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Employee`,
      `Are you sure you want to ${action} ${employee.firstName} ${employee.lastName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: employee.isActive ? 'destructive' : 'default',
          onPress: async () => {
            await dispatch(toggleEmployeeActive(employee.employeeId)).unwrap();
            await dispatch(fetchEmployees());
            loadEmployee();
          },
        },
      ],
    );
  };

  if (isLoading || !employee) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const deptColor = DEPARTMENT_COLORS[employee.department] ?? Colors.primary;

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.headerBack}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Employee Detail</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate(ROUTES.EMPLOYEE_FORM, { employeeId })}
          activeOpacity={0.7}
        >
          <Text style={styles.headerEdit}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* ── Profile Card ───────────────────────────────── */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {employee.firstName.charAt(0)}{employee.lastName.charAt(0)}
            </Text>
          </View>
          <Text style={styles.profileName}>
            {employee.firstName} {employee.lastName}
          </Text>
          <View style={styles.profileRow}>
            <View style={[styles.deptBadge, { backgroundColor: deptColor + '18' }]}>
              <Text style={[styles.deptBadgeText, { color: deptColor }]}>{employee.department}</Text>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: employee.isActive
                    ? Colors.successLight
                    : Colors.dangerLight,
                },
              ]}
            >
              <Text
                style={[
                  styles.statusBadgeText,
                  { color: employee.isActive ? Colors.success : Colors.danger },
                ]}
              >
                {employee.isActive ? 'Active' : 'Inactive'}
              </Text>
            </View>
          </View>
          <Text style={styles.profilePosition}>{employee.position}</Text>
          <Text style={styles.profileMeta}>
            📧 {employee.email}  ·  📱 {employee.phone}
          </Text>
          <Text style={styles.profileMeta}>📅 Hired {formatDate(employee.hireDate)}</Text>
        </View>

        {/* ── Pay Info Card ──────────────────────────────── */}
        <View style={styles.payCard}>
          <Text style={styles.cardTitle}>💰 Compensation</Text>
          <View style={styles.payGrid}>
            <View style={styles.payGridItem}>
              <Text style={styles.payGridLabel}>Type</Text>
              <Text style={styles.payGridValue}>
                {employee.payType === 'salary' ? '💼 Salary' : '⏰ Hourly'}
              </Text>
            </View>
            <View style={styles.payGridItem}>
              <Text style={styles.payGridLabel}>Rate</Text>
              <Text style={styles.payGridValue}>
                {employee.payType === 'salary'
                  ? `${formatCurrency(employee.payRate)}/yr`
                  : `${formatCurrency(employee.payRate)}/hr`}
              </Text>
            </View>
            {employee.overtimeRate != null && (
              <View style={styles.payGridItem}>
                <Text style={styles.payGridLabel}>OT Rate</Text>
                <Text style={styles.payGridValue}>{formatCurrency(employee.overtimeRate)}/hr</Text>
              </View>
            )}
          </View>
        </View>

        {/* ── YTD Card ───────────────────────────────────── */}
        <View style={styles.ytdCard}>
          <Text style={styles.cardTitle}>📊 Year-to-Date</Text>
          <View style={styles.ytdRow}>
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Gross</Text>
              <Text style={[styles.ytdValue, { color: Colors.textPrimary }]}>
                {formatCurrency(employee.ytdGross)}
              </Text>
            </View>
            <View style={styles.ytdDivider} />
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Deductions</Text>
              <Text style={[styles.ytdValue, { color: Colors.danger }]}>
                -{formatCurrency(employee.ytdDeductions)}
              </Text>
            </View>
            <View style={styles.ytdDivider} />
            <View style={styles.ytdItem}>
              <Text style={styles.ytdLabel}>Net</Text>
              <Text style={[styles.ytdValue, { color: Colors.success }]}>
                {formatCurrency(employee.ytdNet)}
              </Text>
            </View>
          </View>
        </View>

        {/* ── Tabs ───────────────────────────────────────── */}
        <SimpleTabBar
          tabs={TAB_KEYS.map((k) => TAB_LABELS[k])}
          activeTab={TAB_LABELS[activeTab]}
          onTabChange={(label) => {
            const key = TAB_KEYS.find((k) => TAB_LABELS[k] === label);
            if (key) setActiveTab(key);
          }}
        />

        {/* ── Overview Tab ───────────────────────────────── */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Department</Text>
              <Text style={styles.infoValue}>{employee.department}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Position</Text>
              <Text style={styles.infoValue}>{employee.position}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Hire Date</Text>
              <Text style={styles.infoValue}>{formatDate(employee.hireDate)}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bank</Text>
              <Text style={styles.infoValue}>{employee.bankAccount.bankName}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Account</Text>
              <Text style={styles.infoValue}>{employee.bankAccount.accountNumberMasked}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Routing</Text>
              <Text style={styles.infoValue}>{employee.bankAccount.routingNumberMasked}</Text>
            </View>
          </View>
        )}

        {/* ── Deductions Tab ─────────────────────────────── */}
        {activeTab === 'deductions' && (
          <View style={styles.tabContent}>
            <View style={styles.deductionHeader}>
              <Text style={[styles.deductionHeaderText, { flex: 2 }]}>Type</Text>
              <Text style={[styles.deductionHeaderText, { flex: 1, textAlign: 'right' }]}>Rate</Text>
            </View>
            {employee.deductions.map((d, i) => (
              <View key={`ded-${i}`} style={styles.deductionTableRow}>
                <Text style={[styles.deductionCell, { flex: 2 }]}>{d.type}</Text>
                <Text style={[styles.deductionCell, { flex: 1, textAlign: 'right', color: Colors.primary }]}>
                  {(d.rate * 100).toFixed(2)}%
                </Text>
              </View>
            ))}
            <View style={styles.deductionTotalRow}>
              <Text style={[styles.deductionTotalText, { flex: 2 }]}>Total Rate</Text>
              <Text style={[styles.deductionTotalText, { flex: 1, textAlign: 'right' }]}>
                {(employee.deductions.reduce((sum, d) => sum + d.rate, 0) * 100).toFixed(2)}%
              </Text>
            </View>
          </View>
        )}

        {/* ── Pay Stubs Tab ──────────────────────────────── */}
        {activeTab === 'payStubs' && (
          <View style={styles.tabContent}>
            {payStubs.length === 0 ? (
              <Text style={styles.emptyTab}>No pay stubs available</Text>
            ) : (
              payStubs.map((stub) => (
                <View key={stub.id} style={styles.stubRow}>
                  <Text style={styles.stubPeriod}>{stub.period}</Text>
                  <View style={styles.stubAmounts}>
                    <Text style={styles.stubGross}>{formatCurrency(stub.gross)}</Text>
                    <Text style={styles.stubDed}>-{formatCurrency(stub.deductions)}</Text>
                    <Text style={styles.stubNet}>{formatCurrency(stub.net)}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* ── Bottom Actions ───────────────────────────────── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.actionBtn,
            { backgroundColor: employee.isActive ? Colors.dangerLight : Colors.successLight },
          ]}
          activeOpacity={0.8}
          onPress={handleToggleActive}
        >
          <Text
            style={[
              styles.actionBtnText,
              { color: employee.isActive ? Colors.danger : Colors.success },
            ]}
          >
            {employee.isActive ? 'Deactivate' : 'Activate'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: Colors.primary, flex: 2 }]}
          activeOpacity={0.8}
          onPress={() => navigation.navigate(ROUTES.EMPLOYEE_FORM, { employeeId })}
        >
          <Text style={[styles.actionBtnText, { color: Colors.white }]}>Edit Employee</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBack: { fontSize: 15, color: Colors.primary, fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  headerEdit: { fontSize: 15, color: Colors.primary, fontWeight: '600' },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: Spacing.base, paddingBottom: 100 },

  // Profile
  profileCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.sm,
    marginBottom: Spacing.sm,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  profileAvatarText: { fontSize: 22, fontWeight: '700', color: Colors.primary },
  profileName: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  profileRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xs },
  deptBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.xs },
  deptBadgeText: { fontSize: 11, fontWeight: '700' },
  statusBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.xs },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  profilePosition: { fontSize: 14, color: Colors.textSecondary, marginBottom: 4 },
  profileMeta: { fontSize: 12, color: Colors.textTertiary, marginBottom: 2 },

  // Pay
  payCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
    marginBottom: Spacing.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  payGrid: { flexDirection: 'row', gap: Spacing.sm },
  payGridItem: { flex: 1, alignItems: 'center' },
  payGridLabel: { fontSize: 10, color: Colors.textTertiary, marginBottom: 2 },
  payGridValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  // YTD
  ytdCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
    marginBottom: Spacing.md,
  },
  ytdRow: { flexDirection: 'row', alignItems: 'center' },
  ytdItem: { flex: 1, alignItems: 'center' },
  ytdLabel: { fontSize: 10, color: Colors.textTertiary, marginBottom: 2 },
  ytdValue: { fontSize: 15, fontWeight: '700' },
  ytdDivider: { width: 1, height: 30, backgroundColor: Colors.border },

  // Tabs (styles now in shared SimpleTabBar component)

  // Tab content
  tabContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  infoLabel: { fontSize: 13, color: Colors.textTertiary },
  infoValue: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },

  // Deductions table
  deductionHeader: {
    flexDirection: 'row',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Spacing.xs,
  },
  deductionHeaderText: { fontSize: 11, fontWeight: '800', color: Colors.textTertiary, letterSpacing: 0.5 },
  deductionTableRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  deductionCell: { fontSize: 13, color: Colors.textPrimary },
  deductionTotalRow: {
    flexDirection: 'row',
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  deductionTotalText: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary },

  // Pay stubs
  stubRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  stubPeriod: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  stubAmounts: { flexDirection: 'row', gap: Spacing.md },
  stubGross: { fontSize: 12, color: Colors.textSecondary },
  stubDed: { fontSize: 12, color: Colors.danger },
  stubNet: { fontSize: 12, fontWeight: '700', color: Colors.success },
  emptyTab: { textAlign: 'center', color: Colors.textTertiary, paddingVertical: Spacing.xl },

  // Bottom bar
  bottomBar: {
    flexDirection: 'row',
    gap: Spacing.sm,
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.base,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
});

export default EmployeeDetailScreen;
