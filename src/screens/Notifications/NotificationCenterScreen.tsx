import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  PanResponder,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import {
  AppNotification,
  NotificationType,
} from '../../dummy-data/notifications';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  fetchNotifications,
  markAsRead as markAsReadThunk,
  markAllRead as markAllReadThunk,
  dismissNotification as dismissThunk,
} from './notificationSlice';

// ─── Type config per notification type ──────────────────────
const TYPE_CONFIG: Record<NotificationType, { icon: string; color: string; bg: string; label: string }> = {
  delivery_update:    { icon: '🚚', color: Colors.deliveryAccent, bg: Colors.deliveryAccent + '14', label: 'Delivery' },
  inventory_approval: { icon: '📦', color: '#8E44AD', bg: '#8E44AD14', label: 'Inventory' },
  invoice_overdue:    { icon: '⚠️',  color: Colors.danger,  bg: Colors.dangerLight,  label: 'Invoices' },
  low_stock:          { icon: '📉', color: Colors.warning, bg: Colors.warningLight, label: 'Inventory' },
  general:            { icon: '🔔', color: Colors.info,    bg: Colors.infoLight,    label: 'General' },
};

// ─── Role-specific filter definitions ───────────────────────
type FilterKey = 'all' | 'delivery' | 'inventory' | 'invoices' | 'assignments' | 'approvals';

interface FilterDef { key: FilterKey; label: string; types: NotificationType[] }

const ADMIN_FILTERS: FilterDef[] = [
  { key: 'all',       label: 'All',       types: [] },
  { key: 'delivery',  label: 'Delivery',  types: ['delivery_update'] },
  { key: 'inventory', label: 'Inventory', types: ['inventory_approval', 'low_stock'] },
  { key: 'invoices',  label: 'Invoices',  types: ['invoice_overdue'] },
];

const DP_FILTERS: FilterDef[] = [
  { key: 'all',        label: 'All',        types: [] },
  { key: 'assignments', label: 'Assignments', types: ['delivery_update'] },
  { key: 'approvals',  label: 'Approvals',  types: ['inventory_approval'] },
];

// ─── Helpers ────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
  const now = new Date();
  const d = new Date(dateStr);
  const diffMs = now.getTime() - d.getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Swipeable Row ──────────────────────────────────────────
const SwipeableNotificationRow: React.FC<{
  item: AppNotification;
  onDismiss: (id: string) => void;
  onTap: (item: AppNotification) => void;
}> = ({ item, onDismiss, onTap }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const conf = TYPE_CONFIG[item.type];

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) => Math.abs(gs.dx) > 15 && Math.abs(gs.dy) < 15,
      onPanResponderMove: (_, gs) => {
        if (gs.dx < 0) translateX.setValue(gs.dx);
      },
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -100) {
          Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }).start(() =>
            onDismiss(item.id),
          );
        } else {
          Animated.spring(translateX, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <View style={styles.deleteBg}>
        <Text style={styles.deleteText}>🗑️ Dismiss</Text>
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <TouchableOpacity
          style={[styles.notifCard, !item.isRead && styles.unreadCard]}
          onPress={() => onTap(item)}
          activeOpacity={0.7}
        >
          <View style={[styles.typeIcon, { backgroundColor: conf.bg }]}>
            <Text style={styles.typeIconText}>{conf.icon}</Text>
          </View>
          <View style={styles.notifContent}>
            <Text style={[styles.notifTitle, !item.isRead && styles.notifTitleBold]}>{item.title}</Text>
            <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
            <View style={styles.notifMeta}>
              <View style={[styles.typeBadge, { backgroundColor: conf.bg }]}>
                <Text style={[styles.typeBadgeText, { color: conf.color }]}>{conf.label}</Text>
              </View>
              <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
            </View>
          </View>
          {!item.isRead && <View style={styles.unreadDot} />}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Main Component (role-aware) ────────────────────────────
const NotificationCenterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { notifications: items, unreadCount } = useAppSelector((s) => s.notifications);
  const role = useAppSelector((s) => s.auth.selectedRole ?? s.auth.user?.role);
  const isAdmin = role === 'administrator';
  const [filter, setFilter] = useState<FilterKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  // Pick filter set based on role
  const filters = isAdmin ? ADMIN_FILTERS : DP_FILTERS;

  const filtered = useMemo(() => {
    const activeFilter = filters.find((f) => f.key === filter);
    if (!activeFilter || activeFilter.types.length === 0) return items;
    return items.filter((n) => activeFilter.types.includes(n.type));
  }, [items, filter, filters]);

  const handleMarkAllRead = useCallback(() => {
    dispatch(markAllReadThunk());
  }, [dispatch]);

  const dismiss = useCallback((id: string) => {
    dispatch(dismissThunk(id));
  }, [dispatch]);

  // ── Role-aware tap navigation ─────────────────────
  const handleTap = useCallback((item: AppNotification) => {
    dispatch(markAsReadThunk(item.id));

    if (isAdmin) {
      // ── Admin navigation ───
      switch (item.type) {
        case 'delivery_update': {
          const deliveryId = item.data?.deliveryId;
          if (deliveryId) {
            navigation.navigate(ROUTES.ADMIN_TABS, {
              screen: ROUTES.ADMIN_MORE_STACK,
              params: { screen: ROUTES.DELIVERY_MANAGEMENT, params: { deliveryId } },
            });
          } else {
            navigation.navigate(ROUTES.ADMIN_TABS, {
              screen: ROUTES.ADMIN_MORE_STACK,
              params: { screen: ROUTES.DELIVERY_MANAGEMENT },
            });
          }
          break;
        }
        case 'inventory_approval':
          navigation.navigate(ROUTES.ADMIN_TABS, {
            screen: ROUTES.ADMIN_MORE_STACK,
            params: { screen: ROUTES.DELIVERY_MANAGEMENT, params: { initialTab: 'approvals' } },
          });
          break;
        case 'invoice_overdue': {
          const invoiceId = item.data?.invoiceId;
          if (invoiceId) {
            navigation.navigate(ROUTES.ADMIN_TABS, {
              screen: ROUTES.ADMIN_TRANSACTIONS_STACK,
              params: { screen: ROUTES.INVOICE_DETAIL, params: { invoiceId } },
            });
          } else {
            navigation.navigate(ROUTES.ADMIN_TABS, {
              screen: ROUTES.ADMIN_TRANSACTIONS_STACK,
              params: { screen: ROUTES.INVOICE_LIST },
            });
          }
          break;
        }
        case 'low_stock':
          navigation.navigate(ROUTES.ADMIN_TABS, {
            screen: ROUTES.ADMIN_INVENTORY_STACK,
            params: { screen: ROUTES.ADMIN_INVENTORY_HUB },
          });
          break;
        default:
          break;
      }
    } else {
      // ── Delivery personnel navigation ───
      switch (item.type) {
        case 'delivery_update': {
          const deliveryId = item.data?.deliveryId;
          if (deliveryId) {
            navigation.navigate(ROUTES.DP_TABS, {
              screen: ROUTES.MY_DELIVERIES,
              params: { deliveryId },
            });
          } else {
            navigation.navigate(ROUTES.DP_TABS, { screen: ROUTES.MY_DELIVERIES });
          }
          break;
        }
        case 'inventory_approval':
          navigation.navigate(ROUTES.DP_TABS, { screen: ROUTES.SHADOW_INVENTORY });
          break;
        default:
          break;
      }
    }
  }, [dispatch, navigation, isAdmin]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchNotifications()).unwrap();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 && (
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={handleMarkAllRead} disabled={unreadCount === 0}>
          <Text style={[styles.markAllText, unreadCount === 0 && { color: Colors.textTertiary }]}>Mark All Read</Text>
        </TouchableOpacity>
      </View>

      {/* Role indicator */}
      <View style={styles.roleBanner}>
        <Text style={styles.roleBannerText}>
          {isAdmin ? '👔  Administrator View' : '🚚  Delivery Personnel View'}
        </Text>
      </View>

      {/* Filters */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        {filters.map((f) => {
          const active = filter === f.key;
          return (
            <TouchableOpacity
              key={f.key}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      <ScrollView
        style={styles.list}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubText}>You're all caught up!</Text>
          </View>
        ) : (
          filtered.map((item) => (
            <SwipeableNotificationRow key={item.id} item={item} onDismiss={dismiss} onTap={handleTap} />
          ))
        )}
        <View style={{ height: Spacing.huge }} />
      </ScrollView>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
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
  backBtn: { marginRight: Spacing.sm },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  headerCenter: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  headerBadge: {
    marginLeft: Spacing.sm,
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: Colors.white },
  markAllText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // Role banner
  roleBanner: {
    backgroundColor: Colors.primary + '0A',
    paddingVertical: 6,
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  roleBannerText: { fontSize: 12, fontWeight: '600', color: Colors.primary, textAlign: 'center' },

  // Filters
  filterRow: { maxHeight: 48, backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  filterContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white },

  // List
  list: { flex: 1 },
  listContent: { padding: Spacing.base },

  // Swipe
  swipeContainer: { marginBottom: Spacing.sm, overflow: 'hidden', borderRadius: BorderRadius.md },
  deleteBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: Spacing.xl,
  },
  deleteText: { color: Colors.white, fontSize: 14, fontWeight: '600' },

  // Card
  notifCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  unreadCard: {
    backgroundColor: Colors.infoLight,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  typeIcon: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  typeIconText: { fontSize: 20 },
  notifContent: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary, marginBottom: 3 },
  notifTitleBold: { fontWeight: '700' },
  notifBody: { fontSize: 13, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.sm },
  notifMeta: { flexDirection: 'row', alignItems: 'center' },
  typeBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: BorderRadius.xs, marginRight: Spacing.sm },
  typeBadgeText: { fontSize: 10, fontWeight: '700' },
  timeAgo: { fontSize: 11, color: Colors.textTertiary },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    marginLeft: Spacing.sm,
    alignSelf: 'flex-start',
    marginTop: 4,
  },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: Spacing.huge },
  emptyIcon: { fontSize: 56, marginBottom: Spacing.md },
  emptyText: { fontSize: 18, fontWeight: '600', color: Colors.textPrimary },
  emptySubText: { fontSize: 14, color: Colors.textTertiary, marginTop: Spacing.xs },
});

export default NotificationCenterScreen;
