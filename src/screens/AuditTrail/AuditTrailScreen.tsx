import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import {
  AuditEntry,
  AuditAction,
  AuditModule,
} from '../../dummy-data/auditTrail';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  fetchAuditTrail,
  setDateFilter,
  setUserFilter,
  setModuleFilter,
  setActionFilter,
} from './auditTrailSlice';

// ─── Config ─────────────────────────────────────────────────
const ACTION_CONFIG: Record<AuditAction, { label: string; color: string; bg: string }> = {
  create: { label: 'CREATE', color: Colors.success, bg: Colors.successLight },
  update: { label: 'UPDATE', color: Colors.info, bg: Colors.infoLight },
  delete: { label: 'DELETE', color: Colors.danger, bg: Colors.dangerLight },
};

const MODULE_LABELS: Record<AuditModule, string> = {
  invoices: 'Invoices',
  inventory: 'Inventory',
  customers: 'Customers',
  vendors: 'Vendors',
  bills: 'Bills',
  banking: 'Banking',
  employees: 'Employees',
  payroll: 'Payroll',
  settings: 'Settings',
  journal_entries: 'Journal Entries',
  delivery: 'Delivery',
};

const ALL_MODULES: AuditModule[] = Object.keys(MODULE_LABELS) as AuditModule[];
const ALL_ACTIONS: AuditAction[] = ['create', 'update', 'delete'];
const ALL_USERS = ['Alex Morgan', 'Sarah Chen', 'James Wilson'];

function formatTs(ts: string): string {
  const d = new Date(ts);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' ' +
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function tryPrettyJson(val: string | null): string {
  if (!val) return '—';
  try {
    const obj = JSON.parse(val);
    return Object.entries(obj)
      .map(([k, v]) => `${k}: ${v}`)
      .join('\n');
  } catch {
    return val;
  }
}

// ─── Dropdown Chip ──────────────────────────────────────────
const DropdownChip: React.FC<{
  label: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
}> = ({ label, value, options, onSelect }) => {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.dropWrap}>
      <TouchableOpacity style={styles.dropChip} onPress={() => setOpen(!open)}>
        <Text style={styles.dropChipText} numberOfLines={1}>
          {value || label}
        </Text>
        <Text style={styles.dropArrow}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>
      {open && (
        <View style={styles.dropMenu}>
          <TouchableOpacity
            style={styles.dropMenuItem}
            onPress={() => { onSelect(''); setOpen(false); }}
          >
            <Text style={[styles.dropMenuText, !value && { fontWeight: '700', color: Colors.primary }]}>All</Text>
          </TouchableOpacity>
          {options.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.dropMenuItem}
              onPress={() => { onSelect(opt); setOpen(false); }}
            >
              <Text style={[styles.dropMenuText, value === opt && { fontWeight: '700', color: Colors.primary }]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

// ─── Main Component ─────────────────────────────────────────
const AuditTrailScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { filteredEntries: entries, filters, isLoading } = useAppSelector((s) => s.auditTrail);

  const [startDate, setStartDate] = useState(filters.dateRange.from);
  const [endDate, setEndDate] = useState(filters.dateRange.to);
  const [detailEntry, setDetailEntry] = useState<AuditEntry | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchAuditTrail()).unwrap();
    setRefreshing(false);
  };

  // Derived display values for filter chips
  const userDisplay = filters.userId ?? '';
  const moduleDisplay = filters.module ? MODULE_LABELS[filters.module as AuditModule] ?? filters.module : '';
  const actionDisplay = filters.action ? ACTION_CONFIG[filters.action as AuditAction]?.label ?? filters.action : '';

  useEffect(() => {
    dispatch(fetchAuditTrail());
  }, [dispatch]);

  // Debounce date filter dispatches
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setDateFilter({ from: startDate, to: endDate }));
    }, 400);
    return () => clearTimeout(timer);
  }, [startDate, endDate, dispatch]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Audit Trail</Text>
        <Text style={styles.countBadge}>{entries.length}</Text>
      </View>

      {/* Date Range */}
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

      {/* Filter Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterRow}
        contentContainerStyle={styles.filterContent}
      >
        <DropdownChip
          label="User"
          value={userDisplay}
          options={ALL_USERS}
          onSelect={(v) => dispatch(setUserFilter(v || null))}
        />
        <DropdownChip
          label="Module"
          value={moduleDisplay}
          options={ALL_MODULES.map((m) => MODULE_LABELS[m])}
          onSelect={(v) => {
            // Reverse-lookup module key from display label
            const key = v ? (ALL_MODULES.find((m) => MODULE_LABELS[m] === v) ?? null) : null;
            dispatch(setModuleFilter(key));
          }}
        />
        <DropdownChip
          label="Action"
          value={actionDisplay}
          options={ALL_ACTIONS.map((a) => ACTION_CONFIG[a].label)}
          onSelect={(v) => {
            // Reverse-lookup action key from display label
            const key = v ? (ALL_ACTIONS.find((a) => ACTION_CONFIG[a].label === v) ?? null) : null;
            dispatch(setActionFilter(key));
          }}
        />
      </ScrollView>

      {/* List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.emptyState}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.emptyText, { marginTop: Spacing.md }]}>Loading audit trail…</Text>
          </View>
        ) : entries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>No audit entries match filters</Text>
          </View>
        ) : (
          entries.map((entry) => {
            const ac = ACTION_CONFIG[entry.action];
            return (
              <TouchableOpacity
                key={entry.id}
                style={styles.entryCard}
                onPress={() => setDetailEntry(entry)}
                activeOpacity={0.7}
              >
                {/* Timestamp */}
                <Text style={styles.entryTs}>{formatTs(entry.timestamp)}</Text>

                <View style={styles.entryRow}>
                  {/* Action Badge */}
                  <View style={[styles.actionBadge, { backgroundColor: ac.bg }]}>
                    <Text style={[styles.actionBadgeText, { color: ac.color }]}>{ac.label}</Text>
                  </View>

                  {/* Module */}
                  <View style={styles.moduleBadge}>
                    <Text style={styles.moduleBadgeText}>{MODULE_LABELS[entry.module]}</Text>
                  </View>

                  {/* User */}
                  <Text style={styles.entryUser}>{entry.userName}</Text>
                </View>

                <Text style={styles.entryDesc}>{entry.description}</Text>
              </TouchableOpacity>
            );
          })
        )}
        <View style={{ height: Spacing.huge }} />
      </ScrollView>

      {/* ── Detail Modal ─────────────────── */}
      <Modal visible={!!detailEntry} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {detailEntry && (
              <>
                <Text style={styles.modalTitle}>Audit Detail</Text>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Action</Text>
                  <View style={[styles.actionBadge, { backgroundColor: ACTION_CONFIG[detailEntry.action].bg, alignSelf: 'flex-start' }]}>
                    <Text style={[styles.actionBadgeText, { color: ACTION_CONFIG[detailEntry.action].color }]}>
                      {ACTION_CONFIG[detailEntry.action].label}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>User</Text>
                  <Text style={styles.modalValue}>{detailEntry.userName}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Module</Text>
                  <Text style={styles.modalValue}>{MODULE_LABELS[detailEntry.module]}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Description</Text>
                  <Text style={styles.modalValue}>{detailEntry.description}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>Timestamp</Text>
                  <Text style={styles.modalValue}>{formatTs(detailEntry.timestamp)}</Text>
                </View>

                {/* Before / After */}
                <View style={styles.diffRow}>
                  <View style={[styles.diffBox, { borderColor: Colors.danger + '44' }]}>
                    <Text style={[styles.diffHeader, { color: Colors.danger }]}>Before</Text>
                    <Text style={styles.diffText}>{tryPrettyJson(detailEntry.oldValue)}</Text>
                  </View>
                  <View style={[styles.diffBox, { borderColor: Colors.success + '44' }]}>
                    <Text style={[styles.diffHeader, { color: Colors.success }]}>After</Text>
                    <Text style={styles.diffText}>{tryPrettyJson(detailEntry.newValue)}</Text>
                  </View>
                </View>

                <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setDetailEntry(null)}>
                  <Text style={styles.modalCloseText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
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
  backBtn: { marginRight: Spacing.sm },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  countBadge: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },

  // Date Range
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dateField: { flex: 1 },
  dateLabel: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary, marginBottom: 2 },
  dateInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs + 2,
    fontSize: 13,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dateSep: { fontSize: 16, color: Colors.textTertiary, marginHorizontal: Spacing.sm },

  // Filters
  filterRow: {
    maxHeight: 90,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  filterContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, alignItems: 'flex-start' },
  dropWrap: { marginRight: Spacing.sm, zIndex: 10 },
  dropChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
    minWidth: 80,
  },
  dropChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, flex: 1 },
  dropArrow: { fontSize: 10, color: Colors.textTertiary, marginLeft: 4 },
  dropMenu: {
    position: 'absolute',
    top: 36,
    left: 0,
    minWidth: 140,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
    zIndex: 100,
  },
  dropMenuItem: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  dropMenuText: { fontSize: 13, color: Colors.textPrimary },

  // List
  list: { flex: 1 },
  listContent: { padding: Spacing.base },

  // Entry Card
  entryCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  entryTs: { fontSize: 11, color: Colors.textTertiary, marginBottom: Spacing.xs },
  entryRow: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.xs, flexWrap: 'wrap', gap: Spacing.xs },
  actionBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  actionBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  moduleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    backgroundColor: Colors.primary + '14',
  },
  moduleBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  entryUser: { fontSize: 12, color: Colors.textSecondary, fontWeight: '500' },
  entryDesc: { fontSize: 14, color: Colors.textPrimary, lineHeight: 20 },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: Spacing.huge },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { fontSize: 16, color: Colors.textSecondary },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  modalTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg, textAlign: 'center' },
  modalSection: { marginBottom: Spacing.md },
  modalLabel: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary, marginBottom: 2 },
  modalValue: { fontSize: 14, color: Colors.textPrimary },

  // Diff
  diffRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.sm },
  diffBox: {
    flex: 1,
    borderWidth: 1,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.background,
  },
  diffHeader: { fontSize: 11, fontWeight: '700', marginBottom: Spacing.xs },
  diffText: { fontSize: 12, color: Colors.textPrimary, lineHeight: 18 },

  modalCloseBtn: {
    marginTop: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  modalCloseText: { fontSize: 15, fontWeight: '600', color: Colors.white },
});

export default AuditTrailScreen;
