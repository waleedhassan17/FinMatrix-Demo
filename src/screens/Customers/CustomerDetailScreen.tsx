// ============================================================
// FINMATRIX - Customer Detail Screen
// ============================================================
// Top card: name, company, balance (large), credit limit with usage bar.
// SimpleTabBar: Overview | Invoices | Payments
// Bottom actions: Create Invoice, Record Payment

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
import { getCustomerByIdAPI } from '../../network/customerNetwork';
import { Customer } from '../../dummy-data/customers';
import { toggleCustomerActive, fetchCustomers } from './customerSlice';
import { PAYMENT_TERMS_LABELS } from '../../models/customerModel';
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

const formatAddress = (a: { street: string; city: string; state: string; zipCode: string; country: string }) =>
  `${a.street}\n${a.city}, ${a.state} ${a.zipCode}\n${a.country}`;

// ─── Tab Bar ────────────────────────────────────────────────
type TabKey = 'overview' | 'invoices' | 'payments';

const TAB_LABELS: Record<TabKey, string> = {
  overview: 'Overview',
  invoices: 'Invoices',
  payments: 'Payments',
};
const TAB_KEYS: TabKey[] = ['overview', 'invoices', 'payments'];

// ─── Dummy invoice/payment data (simulated) ─────────────────
interface SimpleInvoice {
  id: string;
  date: string;
  number: string;
  amount: number;
  status: 'paid' | 'unpaid' | 'overdue';
}

interface SimplePayment {
  id: string;
  date: string;
  method: string;
  amount: number;
  reference: string;
}

const generateInvoices = (customer: Customer): SimpleInvoice[] => {
  if (customer.totalPurchases === 0) return [];
  const invoices: SimpleInvoice[] = [];
  const count = Math.min(Math.ceil(customer.totalPurchases / 5000), 6);
  let remaining = customer.totalPurchases;

  for (let i = 0; i < count; i++) {
    const amount =
      i === count - 1
        ? remaining
        : Math.round((remaining / (count - i)) * (0.8 + Math.random() * 0.4));
    remaining -= amount;
    if (remaining < 0) remaining = 0;

    const d = new Date(customer.createdAt);
    d.setMonth(d.getMonth() + i);

    const isPaid = i < count - (customer.balance > 0 ? 1 : 0);
    invoices.push({
      id: `inv_${customer.customerId}_${i}`,
      date: d.toISOString().split('T')[0],
      number: `INV-${String(1000 + i).padStart(4, '0')}`,
      amount: Math.abs(amount),
      status: isPaid ? 'paid' : customer.balance > customer.creditLimit * 0.8 ? 'overdue' : 'unpaid',
    });
  }
  return invoices;
};

const generatePayments = (customer: Customer): SimplePayment[] => {
  if (customer.totalPurchases === 0) return [];
  const paidAmount = customer.totalPurchases - customer.balance;
  if (paidAmount <= 0) return [];

  const payments: SimplePayment[] = [];
  const count = Math.min(Math.ceil(paidAmount / 8000), 5);
  let remaining = paidAmount;
  const methods = ['ACH Transfer', 'Check', 'Wire Transfer', 'Credit Card'];

  for (let i = 0; i < count; i++) {
    const amount =
      i === count - 1
        ? remaining
        : Math.round((remaining / (count - i)) * (0.7 + Math.random() * 0.6));
    remaining -= amount;
    if (remaining < 0) remaining = 0;

    const d = new Date(customer.createdAt);
    d.setMonth(d.getMonth() + i + 1);

    payments.push({
      id: `pmt_${customer.customerId}_${i}`,
      date: d.toISOString().split('T')[0],
      method: methods[i % methods.length],
      amount: Math.abs(amount),
      reference: `PMT-${String(2000 + i).padStart(4, '0')}`,
    });
  }
  return payments;
};

// ─── Main Component ─────────────────────────────────────────
const CustomerDetailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const customerId: string = route.params?.customerId;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');

  // ─── Load ───────────────────────────────────────────────
  const loadCustomer = async () => {
    setIsLoading(true);
    try {
      const data = await getCustomerByIdAPI(customerId);
      setCustomer(data);
    } catch {
      Alert.alert('Error', 'Failed to load customer');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomer();
  }, [customerId]);

  // ─── Derived data ───────────────────────────────────────
  const invoices = useMemo(
    () => (customer ? generateInvoices(customer) : []),
    [customer]
  );
  const payments = useMemo(
    () => (customer ? generatePayments(customer) : []),
    [customer]
  );

  const creditUsagePct = useMemo(() => {
    if (!customer || customer.creditLimit === 0) return 0;
    return Math.min((customer.balance / customer.creditLimit) * 100, 100);
  }, [customer]);

  // ─── Actions ────────────────────────────────────────────
  const handleEdit = () => {
    navigation.navigate(ROUTES.CUSTOMER_FORM, { customerId });
  };

  const handleToggleActive = () => {
    if (!customer) return;
    const action = customer.isActive ? 'deactivate' : 'activate';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Customer`,
      `Are you sure you want to ${action} ${customer.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          style: customer.isActive ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await dispatch(toggleCustomerActive(customerId)).unwrap();
              dispatch(fetchCustomers());
              loadCustomer();
            } catch (e: any) {
              Alert.alert('Error', e || 'Operation failed');
            }
          },
        },
      ]
    );
  };

  // ─── Loading ────────────────────────────────────────────
  if (isLoading || !customer) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading customer...</Text>
      </View>
    );
  }

  const balanceColor =
    customer.balance === 0
      ? Colors.success
      : customer.balance > customer.creditLimit * 0.8
      ? Colors.danger
      : Colors.warning;

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
        <Text style={styles.headerTitle}>Customer Detail</Text>
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
                    backgroundColor: customer.isActive
                      ? Colors.success
                      : Colors.textDisabled,
                  },
                ]}
              />
              <View>
                <Text style={styles.topName}>{customer.name}</Text>
                <Text style={styles.topCompany}>{customer.company}</Text>
              </View>
            </View>
            <View style={styles.topBalanceSection}>
              <Text style={styles.topBalanceLabel}>Balance</Text>
              <Text style={[styles.topBalance, { color: balanceColor }]}>
                {formatCurrency(customer.balance)}
              </Text>
            </View>
          </View>

          {/* Credit Usage Bar */}
          <View style={styles.creditSection}>
            <View style={styles.creditLabelRow}>
              <Text style={styles.creditLabel}>Credit Usage</Text>
              <Text style={styles.creditValues}>
                {formatCurrency(customer.balance)} / {formatCurrency(customer.creditLimit)}
              </Text>
            </View>
            <View style={styles.creditBarBg}>
              <View
                style={[
                  styles.creditBarFill,
                  {
                    width: `${creditUsagePct}%`,
                    backgroundColor:
                      creditUsagePct > 80
                        ? Colors.danger
                        : creditUsagePct > 50
                        ? Colors.warning
                        : Colors.success,
                  },
                ]}
              />
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
              <DetailRow label="Email" value={customer.email} />
              <DetailRow label="Phone" value={customer.phone || '–'} />
              <DetailRow label="Since" value={formatDate(customer.createdAt)} />
              <DetailRow
                label="Status"
                value={customer.isActive ? 'Active' : 'Inactive'}
                valueColor={customer.isActive ? Colors.success : Colors.danger}
              />
            </View>

            {/* Financial */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>FINANCIAL</Text>
              <DetailRow label="Total Purchases" value={formatCurrency(customer.totalPurchases)} />
              <DetailRow label="Outstanding" value={formatCurrency(customer.balance)} valueColor={balanceColor} />
              <DetailRow label="Credit Limit" value={formatCurrency(customer.creditLimit)} />
              <DetailRow
                label="Payment Terms"
                value={PAYMENT_TERMS_LABELS[customer.paymentTerms] || customer.paymentTerms}
              />
            </View>

            {/* Billing Address */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>BILLING ADDRESS</Text>
              <Text style={styles.addressText}>
                {formatAddress(customer.billingAddress)}
              </Text>
            </View>

            {/* Shipping Address */}
            <View style={styles.detailCard}>
              <Text style={styles.detailCardTitle}>SHIPPING ADDRESS</Text>
              <Text style={styles.addressText}>
                {formatAddress(customer.shippingAddress)}
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'invoices' && (
          <View style={styles.tabContent}>
            {invoices.length === 0 ? (
              <View style={styles.emptyTab}>
                <Text style={styles.emptyTabText}>No invoices yet</Text>
              </View>
            ) : (
              invoices.map((inv) => (
                <View key={inv.id} style={styles.listRow}>
                  <View style={styles.listRowLeft}>
                    <Text style={styles.listRowPrimary}>{inv.number}</Text>
                    <Text style={styles.listRowSecondary}>{inv.date}</Text>
                  </View>
                  <View style={styles.listRowRight}>
                    <Text style={styles.listRowAmount}>
                      {formatCurrency(inv.amount)}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            inv.status === 'paid'
                              ? Colors.successLight
                              : inv.status === 'overdue'
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
                              inv.status === 'paid'
                                ? Colors.success
                                : inv.status === 'overdue'
                                ? Colors.danger
                                : Colors.warning,
                          },
                        ]}
                      >
                        {inv.status.toUpperCase()}
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
                <Text style={styles.emptyTabText}>No payments yet</Text>
              </View>
            ) : (
              payments.map((pmt) => (
                <View key={pmt.id} style={styles.listRow}>
                  <View style={styles.listRowLeft}>
                    <Text style={styles.listRowPrimary}>{pmt.reference}</Text>
                    <Text style={styles.listRowSecondary}>
                      {pmt.date} · {pmt.method}
                    </Text>
                  </View>
                  <Text style={[styles.listRowAmount, { color: Colors.success }]}>
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
              style={[styles.actionBtn, styles.invoiceBtn]}
              onPress={() =>
                navigation.navigate(ROUTES.INVOICE_FORM, { customerId: customer.customerId })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.invoiceBtnText}>🧾 Create Invoice</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.paymentBtn]}
              onPress={() =>
                navigation.navigate(ROUTES.RECEIVE_PAYMENT, { customerId: customer.customerId })
              }
              activeOpacity={0.7}
            >
              <Text style={styles.paymentBtnText}>💳 Record Payment</Text>
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
                customer.isActive ? styles.deactivateBtn : styles.activateBtn,
              ]}
              onPress={handleToggleActive}
              activeOpacity={0.7}
            >
              <Text
                style={
                  customer.isActive
                    ? styles.deactivateBtnText
                    : styles.activateBtnText
                }
              >
                {customer.isActive ? '⏸ Deactivate' : '▶ Activate'}
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
    <Text style={[styles.detailValue, valueColor ? { color: valueColor } : {}]}>
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
  topCompany: {
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

  // Credit bar
  creditSection: {
    marginTop: Spacing.xs,
  },
  creditLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  creditLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  creditValues: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontVariant: ['tabular-nums'],
  },
  creditBarBg: {
    height: 8,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  creditBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
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

  // List rows (invoices/payments)
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
  invoiceBtn: {
    backgroundColor: Colors.primary + '12',
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  invoiceBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
  },
  paymentBtn: {
    backgroundColor: Colors.successLight,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  paymentBtnText: {
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

export default CustomerDetailScreen;
