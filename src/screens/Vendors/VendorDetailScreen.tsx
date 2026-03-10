// ============================================================
// FINMATRIX - Vendor Detail Screen
// ============================================================
// Top card: companyName, contactPerson, balance (large), payment terms.
// SimpleTabBar: Overview | Bills | Payments
// Bottom actions: Enter Bill, Pay Vendor, Edit, Activate/Deactivate

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
import { getVendorByIdAPI } from '../../network/vendorNetwork';
import { Vendor } from '../../dummy-data/vendors';
import { toggleVendorActive, fetchVendors } from './vendorSlice';
import { VENDOR_PAYMENT_TERMS_LABELS } from '../../models/vendorModel';
import { ROUTES } from '../../navigations-map/Base';
import SimpleTabBar from '../../Custom-Components/SimpleTabBar';

// ─── Helpers ────────────────────────────────────────────────
const formatCurrency = (n: number) =>
  '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2 });

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatAddress = (a: {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}) => `${a.street}\n${a.city}, ${a.state} ${a.zipCode}\n${a.country}`;

// ─── Tab Bar ────────────────────────────────────────────────
type TabKey = 'overview' | 'bills' | 'payments';

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  bills: 'Bills',
  payments: 'Payments',
};
const TAB_KEYS: TabKey[] = ['overview', 'bills', 'payments'];

// ─── Dummy bill/payment data (simulated) ────────────────────
interface SimpleBill {
  id: string;
  date: string;
  number: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
}

interface SimpleVendorPayment {
  id: string;
  date: string;
  method: string;
  amount: number;
  reference: string;
}

const generateBills = (vendor: Vendor): SimpleBill[] => {
  if (vendor.totalPurchases === 0) return [];
  const bills: SimpleBill[] = [];
  const count = Math.min(Math.ceil(vendor.totalPurchases / 5000), 6);
  let remaining = vendor.totalPurchases;

  for (let i = 0; i < count; i++) {
    const amount =
      i === count - 1
        ? remaining
        : Math.round(
            (remaining / (count - i)) * (0.8 + Math.random() * 0.4)
          );
    remaining -= amount;
    if (remaining < 0) remaining = 0;

    const d = new Date(vendor.createdAt);
    d.setMonth(d.getMonth() + i);

    const isPaid = i < count - (vendor.balance > 0 ? 1 : 0);
    bills.push({
      id: `bill_${vendor.vendorId}_${i}`,
      date: d.toISOString().split('T')[0],
      number: `BILL-${String(3000 + i).padStart(4, '0')}`,
      amount: Math.abs(amount),
      status: isPaid
        ? 'paid'
        : vendor.balance > 2000
        ? 'overdue'
        : 'unpaid',
    });
  }
  return bills;
};

const generateVendorPayments = (
  vendor: Vendor
): SimpleVendorPayment[] => {
  if (vendor.totalPurchases === 0) return [];
  const paidAmount = vendor.totalPurchases - vendor.balance;
  if (paidAmount <= 0) return [];

  const payments: SimpleVendorPayment[] = [];
  const count = Math.min(Math.ceil(paidAmount / 8000), 5);
  let remaining = paidAmount;
  const methods = ['ACH Transfer', 'Check', 'Wire Transfer', 'EFT'];

  for (let i = 0; i < count; i++) {
    const amount =
      i === count - 1
        ? remaining
        : Math.round(
            (remaining / (count - i)) * (0.7 + Math.random() * 0.6)
          );
    remaining -= amount;
    if (remaining < 0) remaining = 0;

    const d = new Date(vendor.createdAt);
    d.setMonth(d.getMonth() + i + 1);

    payments.push({
      id: `vpmt_${vendor.vendorId}_${i}`,
      date: d.toISOString().split('T')[0],
      method: methods[i % methods.length],
      amount: Math.abs(amount),
      reference: `VPMT-${String(4000 + i).padStart(4, '0')}`,
    });
  }
  return payments;
};

// ─── Main Component ─────────────────────────────────────────
const VendorDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const vendorId: string = route.params?.vendorId;

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // ─── Load ───────────────────────────────────────────────
  const loadVendor = async () => {
    setIsLoading(true);
    try {
      const data = await getVendorByIdAPI(vendorId);
      setVendor(data);
    } catch {
      Alert.alert('Error', 'Failed to load vendor');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVendor();
  }, [vendorId]);

  // ─── Derived data ───────────────────────────────────────
  const bills = useMemo(
    () => (vendor ? generateBills(vendor) : []),
    [vendor]
  );
  const payments = useMemo(
    () => (vendor ? generateVendorPayments(vendor) : []),
    [vendor]
  );

  // ─── Actions ────────────────────────────────────────────
  const handleEdit = () => {
    navigation.navigate(ROUTES.VENDOR_FORM, { vendorId });
  };

  const handleToggleActive = () => {
    if (!vendor) return;
    const action = vendor.isActive ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Vendor`,
      `Are you sure you want to ${action} ${vendor.companyName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: vendor.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await dispatch(toggleVendorActive(vendorId)).unwrap();
              dispatch(fetchVendors());
              loadVendor();
            } catch (e: any) {
              Alert.alert('Error', e || 'Operation failed');
            }
          },
        },
      ]
    );
  };

  // ─── Loading ────────────────────────────────────────────
  if (isLoading || !vendor) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading vendor...</Text>
      </View>
    );
  }

  const balanceColor =
    vendor.balance === 0
      ? Colors.success
      : vendor.balance > 2000
      ? Colors.warning
      : Colors.textPrimary;

  return (
    <View style={styles.container}>
      {/* ─── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vendor Detail</Text>
        <TouchableOpacity
          style={styles.editHeaderBtn}
          onPress={handleEdit}
          activeOpacity={0.7}
        >
          <Text style={styles.editHeaderBtnText}>Edit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── Top Card ───────────────────────────────────── */}
        <View style={styles.topCard}>
          <View style={styles.topCardHeader}>
            <View style={styles.topNameRow}>
              <View
                style={[
                  styles.activeIndicator,
                  {
                    backgroundColor: vendor.isActive
                      ? Colors.success
                      : Colors.textDisabled,
                  },
                ]}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.topName}>{vendor.companyName}</Text>
                <Text style={styles.topContact}>{vendor.contactPerson}</Text>
              </View>
            </View>
            <View style={styles.topBalanceSection}>
              <Text style={styles.topBalanceLabel}>Balance Owed</Text>
              <Text style={[styles.topBalance, { color: balanceColor }]}>
                {formatCurrency(vendor.balance)}
              </Text>
            </View>
          </View>

          {/* Payment Terms Bar */}
          <View style={styles.termsRow}>
            <Text style={styles.termsLabel}>Payment Terms</Text>
            <View style={styles.termsBadge}>
              <Text style={styles.termsBadgeText}>
                {VENDOR_PAYMENT_TERMS_LABELS[vendor.paymentTerms] ||
                  vendor.paymentTerms}
              </Text>
            </View>
          </View>
        </View>

        {/* ─── Tab Bar ────────────────────────────────────── */}
        <SimpleTabBar
          tabs={TAB_KEYS.map((k) => TAB_LABELS[k])}
          activeTab={TAB_LABELS[activeTab]}
          onTabChange={(label) => {
            const key = TAB_KEYS.find((k) => TAB_LABELS[k] === label);
            if (key) setActiveTab(key);
          }}
          variant="pill"
        />

        {/* ─── Tab Content ────────────────────────────────── */}
        {activeTab === 'overview' && (
          <View style={styles.tabContent}>
            {/* Contact */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>CONTACT</Text>
              <DetailRow label="Email" value={vendor.email} />
              <DetailRow label="Phone" value={vendor.phone || '–'} />
              <DetailRow
                label="Since"
                value={formatDate(vendor.createdAt)}
              />
              <DetailRow
                label="Status"
                value={vendor.isActive ? 'Active' : 'Inactive'}
                valueColor={
                  vendor.isActive ? Colors.success : Colors.danger
                }
              />
            </View>

            {/* Financial */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>FINANCIAL</Text>
              <DetailRow
                label="Total Purchases"
                value={formatCurrency(vendor.totalPurchases)}
              />
              <DetailRow
                label="Outstanding"
                value={formatCurrency(vendor.balance)}
                valueColor={balanceColor}
              />
              <DetailRow
                label="Payment Terms"
                value={
                  VENDOR_PAYMENT_TERMS_LABELS[vendor.paymentTerms] ||
                  vendor.paymentTerms
                }
              />
              {vendor.taxId && (
                <DetailRow label="Tax ID" value={vendor.taxId} />
              )}
              {vendor.defaultExpenseAccountId && (
                <DetailRow
                  label="Default Account"
                  value={vendor.defaultExpenseAccountId}
                />
              )}
            </View>

            {/* Address */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>ADDRESS</Text>
              <Text style={styles.addressText}>
                {formatAddress(vendor.address)}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'bills' && (
          <View style={styles.tabContent}>
            {bills.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabText}>No bills yet</Text>
              </View>
            ) : (
              bills.map((bill) => (
                <View key={bill.id} style={styles.listRow}>
                  <View style={styles.listRowLeft}>
                    <Text style={styles.listRowPrimary}>
                      {bill.number}
                    </Text>
                    <Text style={styles.listRowSecondary}>
                      {bill.date}
                    </Text>
                  </View>
                  <View style={styles.listRowRight}>
                    <Text style={styles.listRowAmount}>
                      {formatCurrency(bill.amount)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            bill.status === 'paid'
                              ? Colors.successLight
                              : bill.status === 'overdue'
                              ? Colors.dangerLight
                              : Colors.warningLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              bill.status === 'paid'
                                ? Colors.success
                                : bill.status === 'overdue'
                                ? Colors.danger
                                : Colors.warning,
                          },
                        ]}
                      >
                        {bill.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {activeTab === 'payments' && (
          <View style={styles.tabContent}>
            {payments.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabText}>
                  No payments yet
                </Text>
              </View>
            ) : (
              payments.map((pmt) => (
                <View key={pmt.id} style={styles.listRow}>
                  <View style={styles.listRowLeft}>
                    <Text style={styles.listRowPrimary}>
                      {pmt.reference}
                    </Text>
                    <Text style={styles.listRowSecondary}>
                      {pmt.date} · {pmt.method}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.listRowAmount,
                      { color: Colors.success },
                    ]}
                  >
                    {formatCurrency(pmt.amount)}
                  </Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* ─── Bottom Actions ─────────────────────────────── */}
        <View style={styles.actionsCard}>
          <Text style={styles.detailCardTitle}>ACTIONS</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.billBtn]}
              onPress={() =>
                navigation.navigate(ROUTES.BILL_FORM, { vendorId: vendor.vendorId })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.billBtnText}>📄 Enter Bill</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.payVendorBtn]}
              onPress={() =>
                navigation.navigate(ROUTES.PAY_BILLS)
              }
              activeOpacity={0.7}
            >
              <Text style={styles.payVendorBtnText}>
                💳 Pay Vendor
              </Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: Spacing.sm }} />
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, styles.editBtn]}
              onPress={handleEdit}
              activeOpacity={0.7}
            >
              <Text style={styles.editBtnText}>✏️ Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                vendor.isActive
                  ? styles.deactivateBtn
                  : styles.activateBtn,
              ]}
              onPress={handleToggleActive}
              activeOpacity={0.7}
            >
              <Text
                style={
                  vendor.isActive
                    ? styles.deactivateBtnText
                    : styles.activateBtnText
                }
              >
                {vendor.isActive ? '⏸ Deactivate' : '▶ Activate'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
};

// ─── Detail Row ─────────────────────────────────────────────
const DetailRow: React.FC<{
  label: string;
  value: string;
  valueColor?: string;
}> = ({ label, value, valueColor }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text
      style={[styles.detailValue, valueColor ? { color: valueColor } : {}]}
    >
      {value}
    </Text>
  </View>
);

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.textSecondary,
  },

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
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 24,
    fontWeight: '300',
    color: Colors.textPrimary,
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  editHeaderBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  editHeaderBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Scroll
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.base },

  // Top Card
  topCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  topCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.base,
  },
  topNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  activeIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  topName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  topContact: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  topBalanceSection: {
    alignItems: 'flex-end',
  },
  topBalanceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginBottom: 2,
  },
  topBalance: {
    fontSize: 24,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },

  // Terms row
  termsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  termsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  termsBadge: {
    backgroundColor: Colors.primary + '14',
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  termsBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Tabs (styles now in shared SimpleTabBar component)

  // Tab content
  tabContent: {
    marginBottom: Spacing.base,
  },
  emptyTab: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.xxl,
    alignItems: 'center',
    ...Shadows.sm,
  },
  emptyTabText: {
    fontSize: 14,
    color: Colors.textTertiary,
  },

  // Detail card
  detailCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  detailCardTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textTertiary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  addressText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 22,
  },

  // List rows (bills/payments)
  listRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xs,
    ...Shadows.sm,
  },
  listRowLeft: {
    flex: 1,
  },
  listRowPrimary: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  listRowSecondary: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  listRowRight: {
    alignItems: 'flex-end',
  },
  listRowAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  // Actions Card
  actionsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
  },
  billBtn: {
    backgroundColor: Colors.warning + '14',
    borderWidth: 1,
    borderColor: Colors.warning + '30',
  },
  billBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.warning,
  },
  payVendorBtn: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  payVendorBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
  editBtn: {
    backgroundColor: Colors.infoLight,
    borderWidth: 1,
    borderColor: Colors.info + '30',
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.info,
  },
  deactivateBtn: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1,
    borderColor: Colors.danger + '30',
  },
  deactivateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger,
  },
  activateBtn: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  activateBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.success,
  },
});

export default VendorDetailScreen;
