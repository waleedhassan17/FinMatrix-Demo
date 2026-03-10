// ============================================================
// FINMATRIX - Journal Entries List Screen
// ============================================================

import React, { useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Animated,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  fetchJournalEntries,
  setSearchQuery,
  setStatusFilter,
} from './jeSlice';
import { JournalEntry } from '../../dummy-data/journalEntries';
import { ROUTES } from '../../navigations-map/Base';

// ─── Constants ──────────────────────────────────────────────
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  draft: { bg: Colors.background, text: Colors.textSecondary },
  posted: { bg: Colors.successLight, text: Colors.success },
  void: { bg: Colors.dangerLight, text: Colors.danger },
};

const STATUS_CHIPS = [
  { key: 'all', label: 'All' },
  { key: 'draft', label: 'Draft' },
  { key: 'posted', label: 'Posted' },
  { key: 'void', label: 'Void' },
];

const formatCurrency = (amount: number) =>
  '$' + amount.toLocaleString('en-US', { minimumFractionDigits: 2 });

// ─── Status Badge ───────────────────────────────────────────
const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.badgeText, { color: colors.text }]}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Text>
    </View>
  );
};

// ─── Filter Chip ────────────────────────────────────────────
const FilterChip: React.FC<{
  label: string;
  isSelected: boolean;
  onPress: () => void;
}> = ({ label, isSelected, onPress }) => (
  <TouchableOpacity
    style={[styles.chip, isSelected && styles.chipActive]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Entry Card ─────────────────────────────────────────────
const EntryCard: React.FC<{
  entry: JournalEntry;
  onPress: () => void;
  onEdit: () => void;
  onVoid: () => void;
}> = React.memo(({ entry, onPress, onEdit, onVoid }) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const swipeOpen = useRef(false);

  const totalAmount = entry.lines.reduce((s, l) => s + l.debit, 0);

  const handleSwipe = () => {
    if (swipeOpen.current) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
      swipeOpen.current = false;
    } else {
      const canSwipe =
        entry.status === 'draft' || entry.status === 'posted';
      if (!canSwipe) return;
      Animated.spring(translateX, {
        toValue: -80,
        useNativeDriver: true,
      }).start();
      swipeOpen.current = true;
    }
  };

  return (
    <View style={styles.cardWrapper}>
      {/* Swipe actions behind */}
      <View style={styles.swipeActions}>
        {entry.status === 'draft' && (
          <TouchableOpacity style={styles.editSwipeBtn} onPress={onEdit}>
            <Text style={styles.editSwipeBtnText}>Edit</Text>
          </TouchableOpacity>
        )}
        {entry.status === 'posted' && (
          <TouchableOpacity style={styles.voidSwipeBtn} onPress={onVoid}>
            <Text style={styles.voidSwipeBtnText}>Void</Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.View
        style={[styles.card, { transform: [{ translateX }] }]}
      >
        <TouchableOpacity
          style={styles.cardContent}
          activeOpacity={0.7}
          onPress={onPress}
          onLongPress={handleSwipe}
        >
          <View style={styles.cardTopRow}>
            <Text style={styles.cardRef}>{entry.reference}</Text>
            <StatusBadge status={entry.status} />
          </View>
          <Text style={styles.cardDate}>{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Text>
          <Text style={styles.cardMemo} numberOfLines={2}>
            {entry.memo}
          </Text>
          <View style={styles.cardBottomRow}>
            <Text style={styles.cardAmount}>
              {formatCurrency(totalAmount)}
            </Text>
            <Text style={styles.cardLines}>
              {entry.lines.length} lines
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

// ─── Empty State ────────────────────────────────────────────
const EmptyState: React.FC = () => (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyIcon}>📋</Text>
    <Text style={styles.emptyTitle}>No Journal Entries</Text>
    <Text style={styles.emptySubtitle}>
      Tap "+ New Entry" to create your first journal entry
    </Text>
  </View>
);

// ─── Main Component ─────────────────────────────────────────
const JEListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { filteredEntries, searchQuery, statusFilter, isLoading } =
    useAppSelector((s) => s.je);

  useEffect(() => {
    dispatch(fetchJournalEntries());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchJournalEntries());
  }, [dispatch]);

  const handleVoid = (entry: JournalEntry) => {
    Alert.alert(
      'Void Entry',
      `Are you sure you want to void ${entry.reference}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Void',
          style: 'destructive',
          onPress: () => {
            const { voidJournalEntry } = require('./jeSlice');
            dispatch(voidJournalEntry(entry.entryId));
          },
        },
      ]
    );
  };

  if (isLoading && filteredEntries.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
        <Text style={styles.headerTitle}>Journal Entries</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate(ROUTES.JE_FORM)}
          activeOpacity={0.7}
        >
          <Text style={styles.addBtnText}>+ New Entry</Text>
        </TouchableOpacity>
      </View>

      {/* ─── Search ─────────────────────────────────────── */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={(text) => dispatch(setSearchQuery(text))}
          placeholder="Search by reference or memo..."
          placeholderTextColor={Colors.placeholder}
        />
      </View>

      {/* ─── Status Chips ───────────────────────────────── */}
      <View style={styles.chipRow}>
        {STATUS_CHIPS.map((chip) => (
          <FilterChip
            key={chip.key}
            label={chip.label}
            isSelected={statusFilter === chip.key}
            onPress={() => dispatch(setStatusFilter(chip.key))}
          />
        ))}
      </View>

      {/* ─── List ───────────────────────────────────────── */}
      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.entryId}
        renderItem={({ item }) => (
          <EntryCard
            entry={item}
            onPress={() =>
              navigation.navigate(ROUTES.JE_DETAIL, {
                entryId: item.entryId,
              })
            }
            onEdit={() =>
              navigation.navigate(ROUTES.JE_FORM, {
                entryId: item.entryId,
              })
            }
            onVoid={() => handleVoid(item)}
          />
        )}
        ListEmptyComponent={!isLoading ? <EmptyState /> : null}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      />
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  addBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },

  // Search
  searchContainer: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchInput: {
    height: 40,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
  },

  // Chips
  chipRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  chipTextActive: {
    color: Colors.white,
  },

  // Card wrapper
  cardWrapper: {
    marginHorizontal: Spacing.base,
  },
  swipeActions: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    flexDirection: 'row',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  editSwipeBtn: {
    flex: 1,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  editSwipeBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },
  voidSwipeBtn: {
    flex: 1,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  voidSwipeBtnText: {
    color: Colors.white,
    fontWeight: '700',
    fontSize: 13,
  },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  cardContent: {
    padding: Spacing.base,
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardRef: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  cardDate: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
  },
  cardMemo: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.sm,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardLines: {
    fontSize: 12,
    color: Colors.textTertiary,
  },

  // Badge
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Empty
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxl,
  },

  // List
  listContent: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xxxl,
  },
});

export default JEListScreen;
