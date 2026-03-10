// ============================================================
// FINMATRIX - Agency List Screen
// ============================================================
import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppSelector } from '../../hooks/useReduxHooks';
import { selectActiveCompany } from '../../store/companySlice';
import { formatCurrency } from '../../utils/formatters';
import type { WarehouseAgency } from '../../dummy-data/warehouseAgencies';

// ── Type badge colours ──────────────────────────────────────
const TYPE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  manufacturing: { bg: Colors.infoLight, text: Colors.info, label: 'Manufacturing' },
  supply: { bg: Colors.successLight, text: Colors.success, label: 'Supply' },
  distribution: { bg: '#F3E5F5', text: '#8E44AD', label: 'Distribution' },
};

const getTypeStyle = (t: string) =>
  TYPE_STYLE[t] ?? { bg: Colors.border, text: Colors.textSecondary, label: t };

// ── Border colour by type ───────────────────────────────────
const getBorderColor = (t: string) => {
  switch (t) {
    case 'manufacturing': return Colors.info;
    case 'supply': return Colors.success;
    case 'distribution': return '#8E44AD';
    default: return Colors.border;
  }
};

// ─── Main Component ─────────────────────────────────────────
const AgencyListScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const company = useAppSelector(selectActiveCompany);
  const agencies: WarehouseAgency[] = company?.agencies ?? [];

  const summary = useMemo(() => {
    let totalSKUs = 0;
    let totalValue = 0;
    for (const a of agencies) {
      totalSKUs += a.inventoryItems.length;
      for (const item of a.inventoryItems) {
        totalValue += item.quantityOnHand * item.sellingPrice;
      }
    }
    return { totalAgencies: agencies.length, totalSKUs, totalValue };
  }, [agencies]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Warehouse Agencies</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate(ROUTES.AGENCY_FORM)}
        >
          <Text style={styles.addBtnText}>+ Add Agency</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Summary Row */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalAgencies}</Text>
            <Text style={styles.summaryLabel}>Total Agencies</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{summary.totalSKUs}</Text>
            <Text style={styles.summaryLabel}>Total SKUs</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { fontSize: 16 }]}>
              PKR {summary.totalValue.toLocaleString()}
            </Text>
            <Text style={styles.summaryLabel}>Inventory Value</Text>
          </View>
        </View>

        {/* Agency Cards */}
        {agencies.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🏭</Text>
            <Text style={styles.emptyTitle}>No Agencies Yet</Text>
            <Text style={styles.emptySubtitle}>
              Add a warehouse agency to start managing inventory
            </Text>
          </View>
        ) : (
          agencies.map((agency) => {
            const typeStyle = getTypeStyle(agency.type);
            const itemCount = agency.inventoryItems.length;
            const totalValue = agency.inventoryItems.reduce(
              (sum, i) => sum + i.quantityOnHand * i.sellingPrice,
              0,
            );
            return (
              <TouchableOpacity
                key={agency.agencyId}
                style={[styles.card, { borderLeftColor: getBorderColor(agency.type) }]}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate(ROUTES.AGENCY_DETAIL, { agencyId: agency.agencyId })
                }
              >
                <View style={styles.cardHeader}>
                  <Text style={styles.agencyName}>{agency.name}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: typeStyle.bg }]}>
                    <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
                      {typeStyle.label}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Items</Text>
                    <Text style={styles.statValue}>{itemCount}</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Value</Text>
                    <Text style={styles.statValue}>
                      PKR {totalValue.toLocaleString()}
                    </Text>
                  </View>
                </View>

                <View style={styles.cardFooter}>
                  <Text style={styles.contactText}>👤 {agency.contactPerson}</Text>
                  <Text style={styles.cityText}>📍 {agency.address.city}</Text>
                </View>

                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          })
        )}
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
  backBtn: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  backText: { fontSize: 28, color: Colors.primary, fontWeight: '300', marginTop: -2 },
  headerCenter: { flex: 1, marginLeft: Spacing.sm },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  addBtnText: { color: Colors.white, fontSize: 13, fontWeight: '600' },
  scrollView: { flex: 1 },
  scrollContent: { padding: Spacing.base, paddingBottom: Spacing.xxxl },
  // Summary
  summaryRow: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, backgroundColor: Colors.borderLight, marginVertical: Spacing.xs },
  summaryValue: { fontSize: 20, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  summaryLabel: { fontSize: 11, color: Colors.textSecondary },
  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    ...Shadows.sm,
    position: 'relative' as const,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  agencyName: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, flex: 1, marginRight: Spacing.sm },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  typeBadgeText: { fontSize: 11, fontWeight: '600' },
  cardStats: { flexDirection: 'row', marginBottom: Spacing.md, gap: Spacing.xl },
  statItem: {},
  statLabel: { fontSize: 11, color: Colors.textTertiary, marginBottom: 2 },
  statValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  contactText: { fontSize: 13, color: Colors.textSecondary },
  cityText: { fontSize: 13, color: Colors.textSecondary },
  chevron: {
    position: 'absolute',
    right: Spacing.base,
    top: Spacing.base,
    fontSize: 22,
    color: Colors.textTertiary,
    fontWeight: '300',
  },
  // Empty
  emptyContainer: { alignItems: 'center', marginTop: Spacing.xxxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptySubtitle: { fontSize: 14, color: Colors.textSecondary, textAlign: 'center', paddingHorizontal: Spacing.xxl },
});

export default AgencyListScreen;
