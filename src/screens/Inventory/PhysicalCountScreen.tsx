// ============================================================
// FINMATRIX - Physical Count Screen
// ============================================================
// Step 1: Filter items (All, By Category, By Location) → Generate worksheet
// Step 2: Item list with System Qty / Count Qty / Variance
// Step 3: Review variances → "Adjust All" batch adjustments

import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  TextInput,
  FlatList,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { fetchInventory, adjustInventoryQty } from './inventorySlice';
import { InventoryItem, Category, LocationId } from '../../dummy-data/inventoryItems';
import { AdjustmentRecord } from '../../dummy-data/adjustments';
import CustomDropdown from '../../Custom-Components/CustomDropdown';
import { CATEGORY_OPTIONS, LOCATION_OPTIONS } from '../../models/inventoryModel';

// ─── Types ──────────────────────────────────────────────────
interface CountRow {
  item: InventoryItem;
  countQty: string; // text for editing
  counted: boolean;
}

type FilterMode = 'all' | 'category' | 'location';

const FILTER_MODE_OPTIONS = [
  { label: 'All Items', value: 'all' },
  { label: 'By Category', value: 'category' },
  { label: 'By Location', value: 'location' },
];

// ─── Step Indicator ─────────────────────────────────────────
const STEP_LABELS = ['Setup', 'Count', 'Review'];

const StepIndicator: React.FC<{ current: number }> = ({ current }) => (
  <View style={styles.stepRow}>
    {STEP_LABELS.map((label, i) => {
      const done = i < current;
      const active = i === current;
      return (
        <React.Fragment key={label}>
          {i > 0 && (
            <View style={[styles.stepLine, (done || active) && styles.stepLineDone]} />
          )}
          <View style={styles.stepItem}>
            <View
              style={[
                styles.stepCircle,
                done && styles.stepCircleDone,
                active && styles.stepCircleActive,
              ]}
            >
              <Text
                style={[
                  styles.stepNum,
                  (done || active) && styles.stepNumActive,
                ]}
              >
                {done ? '✓' : i + 1}
              </Text>
            </View>
            <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
          </View>
        </React.Fragment>
      );
    })}
  </View>
);

// ─── Component ──────────────────────────────────────────────
const PhysicalCountScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const { items, isLoading } = useAppSelector((s) => s.inventory);

  const [step, setStep] = useState(0);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [categoryVal, setCategoryVal] = useState('');
  const [locationVal, setLocationVal] = useState('');
  const [rows, setRows] = useState<CountRow[]>([]);
  const [adjusting, setAdjusting] = useState(false);

  // Track whether count data exists for unsaved-changes guard
  const hasCountData = step > 0 && rows.some((r) => r.counted);

  const confirmLeave = useCallback(
    (goBack: () => void) => {
      if (!hasCountData) { goBack(); return; }
      Alert.alert(
        'Discard Count?',
        'Your count progress will be lost. Are you sure?',
        [
          { text: 'Stay', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: goBack },
        ]
      );
    },
    [hasCountData]
  );

  // Hardware back button guard (Android)
  useEffect(() => {
    if (!hasCountData) return;
    const onBack = () => {
      confirmLeave(() => {
        if (step > 0) setStep(step - 1);
        else navigation.goBack();
      });
      return true; // prevent default
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBack);
    return () => sub.remove();
  }, [hasCountData, step, confirmLeave, navigation]);

  useEffect(() => {
    if (items.length === 0) dispatch(fetchInventory());
  }, [dispatch, items.length]);

  // ─── Generate worksheet ───────────────────────────────
  const handleGenerate = useCallback(() => {
    let filtered = items.filter((i) => i.isActive);
    if (filterMode === 'category' && categoryVal) {
      filtered = filtered.filter((i) => i.category === categoryVal);
    } else if (filterMode === 'location' && locationVal) {
      filtered = filtered.filter((i) => i.locationId === locationVal);
    }
    if (filtered.length === 0) {
      Alert.alert('No Items', 'No active items match the selected filter.');
      return;
    }
    const worksheetRows: CountRow[] = filtered
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((item) => ({
        item,
        countQty: '',
        counted: false,
      }));
    setRows(worksheetRows);
    setStep(1);
  }, [items, filterMode, categoryVal, locationVal]);

  // ─── Count helpers ────────────────────────────────────
  const updateCount = useCallback((itemId: string, text: string) => {
    setRows((prev) =>
      prev.map((r) =>
        r.item.itemId === itemId
          ? { ...r, countQty: text, counted: text.trim().length > 0 }
          : r
      )
    );
  }, []);

  const countedCount = useMemo(() => rows.filter((r) => r.counted).length, [rows]);

  // ─── Variances ────────────────────────────────────────
  const variances = useMemo(
    () =>
      rows
        .filter((r) => r.counted)
        .map((r) => {
          const counted = parseInt(r.countQty, 10) || 0;
          const variance = counted - r.item.quantityOnHand;
          return { ...r, countedNum: counted, variance };
        })
        .filter((v) => v.variance !== 0),
    [rows]
  );

  // ─── Adjust All ──────────────────────────────────────
  const handleAdjustAll = useCallback(async () => {
    if (variances.length === 0) {
      Alert.alert('No Variances', 'All counted quantities match system quantities.');
      return;
    }
    Alert.alert(
      'Confirm Adjustments',
      `Apply ${variances.length} adjustment(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Adjust All',
          style: 'destructive',
          onPress: async () => {
            setAdjusting(true);
            try {
              for (const v of variances) {
                await dispatch(
                  adjustInventoryQty({
                    id: v.item.itemId,
                    adjustment: v.variance,
                    reason: 'Physical Count',
                  })
                ).unwrap();
              }
              // Refresh inventory list after adjustments
              await dispatch(fetchInventory());
              Alert.alert('Done', `${variances.length} item(s) adjusted.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (e: any) {
              Alert.alert('Error', e || 'Batch adjustment failed');
            } finally {
              setAdjusting(false);
            }
          },
        },
      ]
    );
  }, [variances, dispatch, navigation]);

  // ─── Loading ──────────────────────────────────────────
  if (isLoading && items.length === 0) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // ─── Render ───────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* ── Header ──────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (step > 0) {
            confirmLeave(() => setStep(step - 1));
          } else {
            navigation.goBack();
          }
        }}>
          <Text style={styles.backBtn}>← {step > 0 ? 'Back' : 'Close'}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Physical Count</Text>
        <View style={{ width: 50 }} />
      </View>

      <StepIndicator current={step} />

      {/* ═══ STEP 0 — Setup ═════════════════════════════════ */}
      {step === 0 && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📋  Count Filter</Text>
            <CustomDropdown
              label="Filter Mode"
              options={FILTER_MODE_OPTIONS}
              value={filterMode}
              onChange={(v) => setFilterMode(v as FilterMode)}
            />
            {filterMode === 'category' && (
              <CustomDropdown
                label="Category"
                options={CATEGORY_OPTIONS}
                value={categoryVal}
                onChange={setCategoryVal}
                placeholder="Select category…"
              />
            )}
            {filterMode === 'location' && (
              <CustomDropdown
                label="Location"
                options={LOCATION_OPTIONS}
                value={locationVal}
                onChange={setLocationVal}
                placeholder="Select location…"
              />
            )}
            <Text style={styles.hint}>
              Active items matching filter: {
                items.filter((i) => {
                  if (!i.isActive) return false;
                  if (filterMode === 'category' && categoryVal) return i.category === categoryVal;
                  if (filterMode === 'location' && locationVal) return i.locationId === locationVal;
                  return true;
                }).length
              }
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={handleGenerate}>
            <Text style={styles.primaryBtnText}>Generate Worksheet →</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ═══ STEP 1 — Count ═════════════════════════════════ */}
      {step === 1 && (
        <>
          {/* Progress bar */}
          <View style={styles.progressBar}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: rows.length > 0 ? `${(countedCount / rows.length) * 100}%` : '0%' },
                ]}
              />
            </View>
            <Text style={styles.progressText}>
              {countedCount} of {rows.length} counted
            </Text>
          </View>

          {/* Column header */}
          <View style={styles.colHeader}>
            <Text style={[styles.colLabel, { flex: 1 }]}>Item</Text>
            <Text style={[styles.colLabel, { width: 60, textAlign: 'center' }]}>System</Text>
            <Text style={[styles.colLabel, { width: 70, textAlign: 'center' }]}>Count</Text>
            <Text style={[styles.colLabel, { width: 55, textAlign: 'center' }]}>Var.</Text>
          </View>

          <FlatList
            data={rows}
            keyExtractor={(r) => r.item.itemId}
            contentContainerStyle={{ paddingBottom: 100 }}
            renderItem={({ item: row }) => {
              const counted = parseInt(row.countQty, 10);
              const variance = !isNaN(counted) ? counted - row.item.quantityOnHand : null;
              return (
                <View style={[styles.countRow, row.counted && styles.countRowDone]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.countName} numberOfLines={1}>{row.item.name}</Text>
                    <Text style={styles.countSku}>{row.item.sku}</Text>
                  </View>
                  <Text style={styles.sysQty}>{row.item.quantityOnHand}</Text>
                  <TextInput
                    style={styles.countInput}
                    value={row.countQty}
                    onChangeText={(t) => updateCount(row.item.itemId, t)}
                    keyboardType="number-pad"
                    placeholder="—"
                    placeholderTextColor={Colors.placeholder}
                  />
                  <Text
                    style={[
                      styles.varianceText,
                      variance !== null
                        ? {
                            color:
                              variance > 0
                                ? Colors.success
                                : variance < 0
                                ? Colors.danger
                                : Colors.textTertiary,
                          }
                        : { color: Colors.textDisabled },
                    ]}
                  >
                    {variance !== null
                      ? `${variance > 0 ? '+' : ''}${variance}`
                      : '—'}
                  </Text>
                </View>
              );
            }}
          />

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.primaryBtn, { flex: 1 }]}
              onPress={() => setStep(2)}
            >
              <Text style={styles.primaryBtnText}>Review Variances →</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ═══ STEP 2 — Review ════════════════════════════════ */}
      {step === 2 && (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📊  Variance Summary</Text>

            {variances.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyIcon}>✅</Text>
                <Text style={styles.emptyTitle}>No Variances</Text>
                <Text style={styles.emptySub}>All counted quantities match system records.</Text>
              </View>
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Total items with variance</Text>
                  <Text style={styles.summaryValue}>{variances.length}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Increases</Text>
                  <Text style={[styles.summaryValue, { color: Colors.success }]}>
                    {variances.filter((v) => v.variance > 0).length}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Decreases</Text>
                  <Text style={[styles.summaryValue, { color: Colors.danger }]}>
                    {variances.filter((v) => v.variance < 0).length}
                  </Text>
                </View>
              </>
            )}
          </View>

          {variances.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📝  Variance Detail</Text>
              {variances.map((v) => (
                <View key={v.item.itemId} style={styles.varRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.varName}>{v.item.name}</Text>
                    <Text style={styles.varSku}>{v.item.sku}</Text>
                  </View>
                  <View style={styles.varNums}>
                    <Text style={styles.varSystem}>{v.item.quantityOnHand}</Text>
                    <Text style={styles.varArrow}>→</Text>
                    <Text style={styles.varCount}>{v.countedNum}</Text>
                  </View>
                  <View
                    style={[
                      styles.varBadge,
                      {
                        backgroundColor:
                          v.variance > 0 ? Colors.successLight : Colors.dangerLight,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.varBadgeText,
                        { color: v.variance > 0 ? Colors.success : Colors.danger },
                      ]}
                    >
                      {v.variance > 0 ? '+' : ''}{v.variance}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {variances.length > 0 && (
            <TouchableOpacity
              style={[styles.primaryBtn, adjusting && { opacity: 0.6 }]}
              onPress={handleAdjustAll}
              disabled={adjusting}
            >
              <Text style={styles.primaryBtnText}>
                {adjusting ? 'Adjusting…' : `⚡ Adjust All (${variances.length})`}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.secondaryBtnText}>Done</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  backBtn: { fontSize: 15, color: Colors.primary, fontWeight: '500' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  scroll: { padding: Spacing.base },

  // Steps
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleDone: { backgroundColor: Colors.success },
  stepCircleActive: { backgroundColor: Colors.primary },
  stepNum: { fontSize: 13, fontWeight: '700', color: Colors.textTertiary },
  stepNumActive: { color: Colors.white },
  stepLabel: { fontSize: 11, color: Colors.textTertiary, marginTop: 3 },
  stepLabelActive: { color: Colors.primary, fontWeight: '600' },
  stepLine: { width: 40, height: 2, backgroundColor: Colors.borderLight, marginHorizontal: 4 },
  stepLineDone: { backgroundColor: Colors.success },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary, marginBottom: Spacing.md },
  hint: { fontSize: 12, color: Colors.textTertiary, marginTop: Spacing.sm },

  // Buttons
  primaryBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  primaryBtnText: { color: Colors.white, fontSize: 15, fontWeight: '600' },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  secondaryBtnText: { color: Colors.textSecondary, fontSize: 15, fontWeight: '600' },

  // Progress
  progressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  progressTrack: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.borderLight,
    overflow: 'hidden',
  },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: Colors.success },
  progressText: { fontSize: 12, color: Colors.textSecondary, fontWeight: '600' },

  // Column header
  colHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.borderLight,
  },
  colLabel: { fontSize: 11, fontWeight: '700', color: Colors.textTertiary, textTransform: 'uppercase' },

  // Count row
  countRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.white,
  },
  countRowDone: { backgroundColor: Colors.successLight + '40' },
  countName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  countSku: { fontSize: 11, color: Colors.textTertiary, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  sysQty: { width: 60, textAlign: 'center', fontSize: 14, color: Colors.textTertiary, fontWeight: '600' },
  countInput: {
    width: 70,
    textAlign: 'center',
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xs,
    paddingVertical: Platform.OS === 'ios' ? 6 : 2,
    marginHorizontal: 4,
  },
  varianceText: { width: 55, textAlign: 'center', fontSize: 14, fontWeight: '700' },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    ...Shadows.md,
  },

  // Summary
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryLabel: { fontSize: 14, color: Colors.textSecondary },
  summaryValue: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },

  // Variance detail
  varRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  varName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  varSku: { fontSize: 11, color: Colors.textTertiary },
  varNums: { flexDirection: 'row', alignItems: 'center', marginRight: Spacing.sm, gap: 4 },
  varSystem: { fontSize: 13, color: Colors.textTertiary },
  varArrow: { fontSize: 12, color: Colors.textTertiary },
  varCount: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  varBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    minWidth: 40,
    alignItems: 'center',
  },
  varBadgeText: { fontSize: 13, fontWeight: '700' },

  // Empty
  emptyBox: { alignItems: 'center', paddingVertical: Spacing.xl },
  emptyIcon: { fontSize: 36, marginBottom: Spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: Colors.textPrimary, marginBottom: 4 },
  emptySub: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center' },
});

export default PhysicalCountScreen;
