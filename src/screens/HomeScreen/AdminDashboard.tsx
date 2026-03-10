import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import AppContainer from '../../components/AppContainer';
import GlobalSearch from '../../components/GlobalSearch';
import CompanySwitcherHeader from '../../components/CompanySwitcherHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { signOut } from '../auth/authSlice';
import { ROUTES } from '../../navigations-map/Base';
import {
  dashboardStats,
  recentTransactions,
  deliveryOverview,
  alerts,
} from '../../dummy-data/dashboardData';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ============================================================
// SECTION 1 - TOP BAR COMPONENTS
// ============================================================

interface TopBarProps {
  displayName: string;
  onNotificationPress: () => void;
  onSearchPress: () => void;
  notificationCount: number;
  onAvatarPress: () => void;
}

const TopBar: React.FC<TopBarProps> = ({
  displayName,
  onNotificationPress,
  onSearchPress,
  notificationCount,
  onAvatarPress,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 18) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <View style={styles.topBar}>
      <View>
        <Text style={styles.greeting}>{getGreeting()}</Text>
        <Text style={styles.userName}>{displayName}</Text>
      </View>
      <View style={styles.topBarIcons}>
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={onSearchPress}
          activeOpacity={0.7}
        >
          <Text style={styles.bellIcon}>🔍</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={onNotificationPress}
          activeOpacity={0.7}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{notificationCount}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={onAvatarPress}
          activeOpacity={0.7}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ============================================================
// SECTION 2 - FINANCIAL SUMMARY CARD
// ============================================================

interface FinancialCardProps {
  label: string;
  value: string;
  borderColor: string;
  trend?: string;
  trendType?: 'positive' | 'negative';
}

const FinancialCard: React.FC<FinancialCardProps> = ({
  label,
  value,
  borderColor,
  trend,
  trendType,
}) => {
  const getTrendIcon = () => {
    if (!trendType) return null;
    if (trendType === 'positive') return '↑';
    return '↓';
  };

  const getTrendColor = () => {
    // For expenses, down is good (money saved)
    return Colors.success;
  };

  return (
    <View style={[styles.financialCard, { borderLeftColor: borderColor }]}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {trend && (
        <View style={styles.trendBadge}>
          <Text style={[styles.trendIcon, { color: getTrendColor() }]}>
            {getTrendIcon()}
          </Text>
          <Text style={[styles.trendText, { color: getTrendColor() }]}>
            {trend}
          </Text>
        </View>
      )}
    </View>
  );
};

// ============================================================
// SECTION 3 - QUICK ACTIONS
// ============================================================

const QUICK_ACTIONS = [
  { label: 'New Invoice', initials: 'NI', color: Colors.info },
  { label: 'Record Payment', initials: 'RP', color: Colors.success },
  { label: 'New Expense', initials: 'NE', color: Colors.warning },
  { label: 'Run Payroll', initials: 'RP', color: Colors.danger },
  { label: 'Check Inventory', initials: 'CI', color: Colors.secondary },
  { label: 'Assign Delivery', initials: 'AD', color: Colors.deliveryAccent },
  { label: 'View Reports', initials: 'VR', color: Colors.primary },
  { label: 'Reconcile Bank', initials: 'RB', color: Colors.primaryLight },
];

interface QuickActionButtonProps {
  label: string;
  initials: string;
  color: string;
  onPress: () => void;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  label,
  initials,
  color,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.quickActionButton}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickIconCircle, { backgroundColor: color + '15' }]}>
        <Text style={[styles.quickIconText, { color }]}>{initials}</Text>
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
};

// ============================================================
// SECTION 4 - RECENT TRANSACTIONS
// ============================================================

const TransactionRow: React.FC<{
  type: 'income' | 'expense';
  description: string;
  date: string;
  amount: number;
}> = ({ type, description, date, amount }) => {
  const isIncome = type === 'income';
  const iconColor = isIncome ? Colors.success : Colors.danger;
  const amountColor = isIncome ? Colors.success : Colors.danger;
  const amountSign = isIncome ? '+' : '-';

  return (
    <View style={styles.transactionRow}>
      <View style={[styles.txIconCircle, { backgroundColor: iconColor + '15' }]}>
        <Text style={[styles.txIcon, { color: iconColor }]}>
          {isIncome ? '💰' : '💸'}
        </Text>
      </View>
      <View style={styles.txContent}>
        <Text style={styles.txDescription}>{description}</Text>
        <Text style={styles.txDate}>{date}</Text>
      </View>
      <Text style={[styles.txAmount, { color: amountColor }]}>
        {amountSign}${amount.toLocaleString()}
      </Text>
    </View>
  );
};

// ============================================================
// SECTION 5 - DELIVERY OVERVIEW
// ============================================================

const DeliveryOverviewCard: React.FC<{
  assigned: number;
  inTransit: number;
  delivered: number;
  pending: number;
  onManage?: () => void;
}> = ({ assigned, inTransit, delivered, pending, onManage }) => {
  const completionPercent = Math.round((delivered / assigned) * 100);

  return (
    <View style={styles.deliveryCard}>
      <Text style={styles.deliveryTitle}>Delivery Overview</Text>
      <View style={styles.deliveryStats}>
        <View style={styles.deliveryStat}>
          <Text style={styles.deliveryStatValue}>{assigned}</Text>
          <Text style={styles.deliveryStatLabel}>Assigned</Text>
        </View>
        <View style={styles.deliverySeparator} />
        <View style={styles.deliveryStat}>
          <Text style={styles.deliveryStatValue}>{inTransit}</Text>
          <Text style={styles.deliveryStatLabel}>In Transit</Text>
        </View>
        <View style={styles.deliverySeparator} />
        <View style={styles.deliveryStat}>
          <Text style={styles.deliveryStatValue}>{delivered}</Text>
          <Text style={styles.deliveryStatLabel}>Delivered</Text>
        </View>
        <View style={styles.deliverySeparator} />
        <View style={styles.deliveryStat}>
          <Text style={styles.deliveryStatValue}>{pending}</Text>
          <Text style={styles.deliveryStatLabel}>Pending</Text>
        </View>
      </View>

      <View style={styles.progressSection}>
        <View style={styles.progressLabelRow}>
          <Text style={styles.progressLabel}>Completion Rate</Text>
          <Text style={styles.progressPercent}>{completionPercent}%</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${completionPercent}%` },
            ]}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.manageBtn} activeOpacity={0.7} onPress={onManage}>
        <Text style={styles.manageBtnText}>Manage Deliveries →</Text>
      </TouchableOpacity>
    </View>
  );
};

// ============================================================
// SECTION 6 - ALERTS
// ============================================================

const AlertItem: React.FC<{
  title: string;
  type: 'warning' | 'danger' | 'info';
  onPress?: () => void;
}> = ({ title, type, onPress }) => {
  const getAlertStyle = () => {
    switch (type) {
      case 'warning':
        return {
          bg: Colors.warningLight,
          border: Colors.warning,
          text: Colors.warning,
        };
      case 'danger':
        return {
          bg: Colors.dangerLight,
          border: Colors.danger,
          text: Colors.danger,
        };
      case 'info':
      default:
        return {
          bg: Colors.infoLight,
          border: Colors.info,
          text: Colors.info,
        };
    }
  };

  const alertStyle = getAlertStyle();

  return (
    <TouchableOpacity
      style={[
        styles.alertItem,
        { backgroundColor: alertStyle.bg, borderLeftColor: alertStyle.border },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.alertContent}>
        <Text style={[styles.alertTitle, { color: alertStyle.text }]}>
          {title}
        </Text>
      </View>
      <Text style={[styles.alertChevron, { color: alertStyle.text }]}>›</Text>
    </TouchableOpacity>
  );
};

// ============================================================
// PROFILE MODAL / BOTTOM SHEET
// ============================================================

interface ProfileModalProps {
  visible: boolean;
  displayName: string;
  onClose: () => void;
  onProfile: () => void;
  onSettings: () => void;
  onLogout: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({
  visible,
  displayName,
  onClose,
  onProfile,
  onSettings,
  onLogout,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={styles.modalContent}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.modalHandle} />

          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Account</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalUserInfo}>
            <Text style={styles.modalUserInitials}>
              {displayName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </Text>
            <Text style={styles.modalUserName}>{displayName}</Text>
          </View>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              onClose();
              onProfile();
            }}
          >
            <Text style={styles.modalOptionIcon}>👤</Text>
            <Text style={styles.modalOptionText}>My Profile</Text>
            <Text style={styles.modalOptionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOption}
            onPress={() => {
              onClose();
              onSettings();
            }}
          >
            <Text style={styles.modalOptionIcon}>⚙️</Text>
            <Text style={styles.modalOptionText}>Settings</Text>
            <Text style={styles.modalOptionChevron}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modalOptionLogout}
            onPress={() => {
              onClose();
              onLogout();
            }}
          >
            <Text style={styles.modalOptionIcon}>🚪</Text>
            <Text style={styles.modalOptionTextLogout}>Logout</Text>
            <Text style={styles.modalOptionChevron}>›</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

// ============================================================
// MAIN COMPONENT
// ============================================================

const AdminDashboard: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleQuickAction = (label: string) => {
    switch (label) {
      case 'New Invoice':
        navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_TRANSACTIONS, params: { screen: ROUTES.INVOICE_FORM } });
        break;
      case 'Record Payment':
        navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_TRANSACTIONS, params: { screen: ROUTES.RECEIVE_PAYMENT } });
        break;
      case 'New Expense':
        navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_TRANSACTIONS, params: { screen: ROUTES.BILL_FORM } });
        break;
      case 'Run Payroll':
        navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_MORE, params: { screen: ROUTES.RUN_PAYROLL } });
        break;
      case 'Check Inventory':
        navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_INVENTORY });
        break;
      case 'Assign Delivery':
        navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_MORE, params: { screen: ROUTES.DELIVERY_MANAGEMENT } });
        break;
      case 'View Reports':
        navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_REPORTS });
        break;
      case 'Reconcile Bank':
        navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_MORE, params: { screen: ROUTES.BANK_ACCOUNTS } });
        break;
      default:
        break;
    }
  };

  const handleNotificationPress = () => {
    navigation.navigate('NotificationCenter');
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', onPress: () => {} },
        {
          text: 'Logout',
          onPress: () => {
            setModalVisible(false);
            dispatch(signOut());
          },
          style: 'destructive',
        },
      ]
    );
  };

  const displayName = user?.displayName || 'Admin User';

  return (
    <AppContainer statusBarStyle="dark-content">
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* SECTION 1: TOP BAR */}
        <TopBar
          displayName={displayName}
          onNotificationPress={handleNotificationPress}
          onSearchPress={() => setSearchVisible(true)}
          notificationCount={5}
          onAvatarPress={() => setModalVisible(true)}
        />

        {/* COMPANY SWITCHER */}
        <CompanySwitcherHeader />

        {/* SECTION 2: FINANCIAL SUMMARY */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Summary</Text>
          <View style={styles.financialGrid}>
            <FinancialCard
              label="Total Revenue"
              value={dashboardStats.totalRevenue.value}
              borderColor={Colors.success}
              trend={dashboardStats.totalRevenue.trend}
              trendType={dashboardStats.totalRevenue.trendType}
            />
            <FinancialCard
              label="Total Expenses"
              value={dashboardStats.totalExpenses.value}
              borderColor={Colors.warning}
              trend={dashboardStats.totalExpenses.trend}
              trendType={dashboardStats.totalExpenses.trendType}
            />
            <FinancialCard
              label="Net Profit"
              value={dashboardStats.netProfit.value}
              borderColor={Colors.info}
              trend={dashboardStats.netProfit.trend}
              trendType={dashboardStats.netProfit.trendType}
            />
            <FinancialCard
              label="Cash on Hand"
              value={dashboardStats.cashOnHand.value}
              borderColor="#A78BFA"
            />
          </View>
        </View>

        {/* SECTION 3: QUICK ACTIONS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsScroll}
            contentContainerStyle={styles.quickActionsContainer}
          >
            {QUICK_ACTIONS.map((action, index) => (
              <QuickActionButton
                key={index}
                label={action.label}
                initials={action.initials}
                color={action.color}
                onPress={() => handleQuickAction(action.label)}
              />
            ))}
          </ScrollView>
        </View>

        {/* SECTION 4: RECENT TRANSACTIONS */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('AdminTabs', { screen: 'Transactions' })}
            >
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>
          {recentTransactions.map((tx) => (
            <TransactionRow
              key={tx.id}
              type={tx.type}
              description={tx.description}
              date={tx.date}
              amount={tx.amount}
            />
          ))}
        </View>

        {/* SECTION 5: DELIVERY OVERVIEW */}
        <View style={styles.section}>
          <DeliveryOverviewCard
            assigned={deliveryOverview.assigned}
            inTransit={deliveryOverview.inTransit}
            delivered={deliveryOverview.delivered}
            pending={deliveryOverview.pending}
            onManage={() => navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_MORE, params: { screen: ROUTES.DELIVERY_MANAGEMENT } })}
          />
        </View>

        {/* SECTION 6: ALERTS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alerts</Text>
          {alerts.map((alert) => (
            <AlertItem
              key={alert.id}
              title={alert.title}
              type={alert.type}
              onPress={() => {
                if (alert.title.toLowerCase().includes('reorder')) {
                  navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_INVENTORY });
                } else if (alert.title.toLowerCase().includes('invoices')) {
                  navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_TRANSACTIONS, params: { screen: ROUTES.INVOICE_LIST } });
                } else if (alert.title.toLowerCase().includes('inventory update')) {
                  navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_MORE, params: { screen: ROUTES.DELIVERY_MANAGEMENT } });
                }
              }}
            />
          ))}
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      {/* GLOBAL SEARCH OVERLAY */}
      {searchVisible && (
        <GlobalSearch navigation={navigation} onClose={() => setSearchVisible(false)} />
      )}

      {/* PROFILE MODAL */}
      <ProfileModal
        visible={modalVisible}
        displayName={displayName}
        onClose={() => setModalVisible(false)}
        onProfile={() => navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_MORE, params: { screen: ROUTES.SETTINGS } })}
        onSettings={() => navigation.navigate(ROUTES.ADMIN_TABS, { screen: ROUTES.ADMIN_MORE, params: { screen: ROUTES.SETTINGS } })}
        onLogout={handleLogout}
      />
    </AppContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // TOP BAR STYLES
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  topBarIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.base,
  },
  notificationBtn: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 24,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: Colors.danger,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1B3A5C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // SECTION STYLES
  section: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  viewAllLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.info,
  },

  // FINANCIAL SUMMARY STYLES
  financialGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  financialCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderLeftWidth: 3,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Shadows.lg,
  },
  cardLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginBottom: Spacing.xs,
  },
  cardValue: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.successLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  trendIcon: {
    fontSize: 12,
    fontWeight: '700',
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // QUICK ACTIONS STYLES
  quickActionsScroll: {
    marginHorizontal: -Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  quickActionsContainer: {
    gap: Spacing.md,
    paddingHorizontal: 0,
  },
  quickActionButton: {
    width: SCREEN_WIDTH / 2.6,
    alignItems: 'center',
    paddingVertical: Spacing.base,
  },
  quickIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  quickIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },

  // TRANSACTION STYLES
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  txIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txIcon: {
    fontSize: 20,
  },
  txContent: {
    flex: 1,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  txDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },

  // DELIVERY OVERVIEW STYLES
  deliveryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.lg,
  },
  deliveryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  deliveryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  deliveryStat: {
    flex: 1,
    alignItems: 'center',
  },
  deliveryStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  deliveryStatLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  deliverySeparator: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  progressSection: {
    marginBottom: Spacing.lg,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: BorderRadius.sm,
  },
  manageBtn: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    backgroundColor: Colors.primary + '10',
    borderRadius: BorderRadius.md,
    alignItems: 'center',
  },
  manageBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },

  // ALERT STYLES
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderLeftWidth: 3,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 13,
    fontWeight: '600',
  },
  alertChevron: {
    fontSize: 20,
    fontWeight: '300',
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '80%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.sm,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingBottom: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalClose: {
    fontSize: 24,
    color: Colors.textSecondary,
  },
  modalUserInfo: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  modalUserInitials: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    color: Colors.white,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 48,
    marginBottom: Spacing.md,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: Spacing.md,
  },
  modalOptionLogout: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  modalOptionIcon: {
    fontSize: 20,
  },
  modalOptionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  modalOptionTextLogout: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.danger,
  },
  modalOptionChevron: {
    fontSize: 16,
    color: Colors.textSecondary,
  },

  // SPACING
  spacer: {
    height: Spacing.xxl,
  },
});

export default AdminDashboard;
