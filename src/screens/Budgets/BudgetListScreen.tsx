// ============================================================
// FINMATRIX - Budget List Screen
// ============================================================
// Cards: Year, total budget, variance %.  "+ New Budget" FAB.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { fetchBudgets } from './budgetSlice';
import { chartOfAccounts } from '../../dummy-data/chartOfAccounts';

const fmtCur = (n: number) =>
  '$' +
  Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

// Compute YTD actual expense total (Jan-Feb = months 0,1 for 2026)
const getYTDActual = () => {
  return chartOfAccounts
    .filter((a) => a.type === 'expense' && a.currentBalance > 0)
    .reduce((s, a) => s + a.currentBalance, 0);
};

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  active: { bg: Colors.successLight, text: Colors.success },
  draft: { bg: Colors.warningLight, text: Colors.warning },
  closed: { bg: Colors.borderLight, text: Colors.textTertiary },
};

const BudgetListScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { budgets, isLoading } = useAppSelector((s) => s.budgets);
  const [refreshing, setRefreshing] = useState(false);
  const ytdActual = getYTDActual();

  useEffect(() => {
    dispatch(fetchBudgets());
  }, [dispatch]);

  const onRefresh = async () => {
    setRefreshing(true);
    await dispatch(fetchBudgets()).unwrap();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Budgets</Text>
        <View style={{ width: 50 }} />
      </View>

      {isLoading && budgets.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : (
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {budgets.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60, paddingHorizontal: 32 }}>
            <Text style={{ fontSize: 48, marginBottom: 12 }}>📊</Text>
            <Text style={{ fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 }}>No Budgets Yet</Text>
            <Text style={{ fontSize: 14, color: Colors.textSecondary, textAlign: 'center' }}>Tap the "+" button to create your first budget and start planning.</Text>
          </View>
        ) : budgets.map((budget) => {
          // YTD budget = sum of Jan + Feb line items
          const ytdBudget = budget.lineItems.reduce(
            (s, li) => s + li.monthly[0] + li.monthly[1],
            0,
          );
          const variance = ytdBudget !== 0 ? ((ytdActual - ytdBudget) / ytdBudget) * 100 : 0;
          const overBudget = variance > 0;
          const sc = STATUS_COLORS[budget.status] ?? STATUS_COLORS.draft;

          return (
            <TouchableOpacity
              key={budget.budgetId}
              style={styles.card}
              activeOpacity={0.6}
              onPress={() =>
                navigation.navigate(ROUTES.BUDGET_VS_ACTUAL, {
                  budgetId: budget.budgetId,
                })
              }
            >
              {/* Top row */}
              <View style={styles.cardTop}>
                <View>
                  <Text style={styles.cardYear}>{budget.year}</Text>
                  <Text style={styles.cardName}>{budget.name}</Text>
                </View>
                <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                  <Text style={[styles.badgeText, { color: sc.text }]}>
                    {budget.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Metrics row */}
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Annual Budget</Text>
                  <Text style={styles.metricValue}>{fmtCur(budget.totalBudget)}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>YTD Actual</Text>
                  <Text style={styles.metricValue}>{fmtCur(ytdActual)}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Variance</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      { color: overBudget ? Colors.danger : Colors.success },
                    ]}
                  >
                    {overBudget ? '+' : ''}
                    {variance.toFixed(1)}%
                  </Text>
                </View>
              </View>

              {/* Progress bar */}
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((ytdActual / budget.totalBudget) * 100, 100)}%`,
                      backgroundColor: overBudget ? Colors.danger : Colors.success,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressLabel}>
                {((ytdActual / budget.totalBudget) * 100).toFixed(1)}% of annual budget used
              </Text>

              {/* Actions */}
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    navigation.navigate(ROUTES.BUDGET_FORM, {
                      budgetId: budget.budgetId,
                    })
                  }
                >
                  <Text style={styles.actionText}>✏️ Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    navigation.navigate(ROUTES.BUDGET_VS_ACTUAL, {
                      budgetId: budget.budgetId,
                    })
                  }
                >
                  <Text style={styles.actionText}>📊 vs Actual</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.8}
        onPress={() => navigation.navigate(ROUTES.BUDGET_FORM, {})}
      >
        <Text style={styles.fabText}>+ New Budget</Text>
      </TouchableOpacity>
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
  scroll: { padding: Spacing.base, paddingBottom: 100 },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.base,
    ...Shadows.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  cardYear: { fontSize: 24, fontWeight: '800', color: Colors.primary },
  cardName: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  badgeText: { fontSize: 10, fontWeight: '700' },

  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  metric: { alignItems: 'center', flex: 1 },
  metricLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  metricValue: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },

  progressTrack: {
    height: 8,
    backgroundColor: Colors.borderLight,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: Spacing.md },

  cardActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.md,
  },
  actionBtn: { flex: 1, alignItems: 'center' },
  actionText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 24,
    right: Spacing.base,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    ...Shadows.md,
  },
  fabText: { color: Colors.white, fontWeight: '700', fontSize: 14 },

  // Loading
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  loadingText: { marginTop: Spacing.md, fontSize: 14, color: Colors.textSecondary },
});

export default BudgetListScreen;
