import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';
import { ROUTES } from '../navigations-map/Base';
import { customers } from '../dummy-data/customers';
import { vendors } from '../dummy-data/vendors';
import { invoices } from '../dummy-data/invoices';
import { bills } from '../dummy-data/bills';
import { inventoryItems } from '../dummy-data/inventoryItems';
import { employees } from '../dummy-data/employees';
import { journalEntries } from '../dummy-data/journalEntries';
import { purchaseOrders } from '../dummy-data/purchaseOrders';
import { estimates } from '../dummy-data/estimates';
import { salesOrders } from '../dummy-data/salesOrders';
import { deliveries } from '../dummy-data/deliveries';

// ─── Types ──────────────────────────────────────────────────
type ModuleName =
  | 'Customers'
  | 'Vendors'
  | 'Invoices'
  | 'Bills'
  | 'Inventory'
  | 'Employees'
  | 'Journal Entries'
  | 'Purchase Orders'
  | 'Estimates'
  | 'Sales Orders'
  | 'Deliveries';

interface SearchResult {
  id: string;
  module: ModuleName;
  primary: string;
  secondary: string;
  color: string;
}

const MODULE_COLORS: Record<ModuleName, string> = {
  Customers: Colors.success,
  Vendors: Colors.warning,
  Invoices: Colors.info,
  Bills: Colors.danger,
  Inventory: '#8E44AD',
  Employees: '#2980B9',
  'Journal Entries': '#16A085',
  'Purchase Orders': '#D35400',
  Estimates: '#27AE60',
  'Sales Orders': '#2E75B6',
  Deliveries: '#E67E22',
};

// Navigation targets for each module
interface NavTarget {
  tabs: string;
  stack: string;
  screen: string;
  paramKey: string;
}

const MODULE_NAV: Record<ModuleName, NavTarget> = {
  Customers: { tabs: ROUTES.ADMIN_TABS, stack: ROUTES.ADMIN_MORE_STACK, screen: ROUTES.CUSTOMER_DETAIL, paramKey: 'customerId' },
  Vendors: { tabs: ROUTES.ADMIN_TABS, stack: ROUTES.ADMIN_MORE_STACK, screen: ROUTES.VENDOR_DETAIL, paramKey: 'vendorId' },
  Invoices: { tabs: ROUTES.ADMIN_TABS, stack: ROUTES.ADMIN_TRANSACTIONS_STACK, screen: ROUTES.INVOICE_DETAIL, paramKey: 'invoiceId' },
  Bills: { tabs: ROUTES.ADMIN_TABS, stack: ROUTES.ADMIN_TRANSACTIONS_STACK, screen: ROUTES.BILL_DETAIL, paramKey: 'billId' },
  Inventory: { tabs: ROUTES.ADMIN_TABS, stack: ROUTES.ADMIN_INVENTORY_STACK, screen: ROUTES.INVENTORY_DETAIL, paramKey: 'itemId' },
  Employees: { tabs: ROUTES.ADMIN_TABS, stack: ROUTES.ADMIN_MORE_STACK, screen: ROUTES.EMPLOYEE_DETAIL, paramKey: 'employeeId' },
  'Journal Entries': { tabs: ROUTES.ADMIN_TABS, stack: ROUTES.ADMIN_MORE_STACK, screen: ROUTES.JE_DETAIL, paramKey: 'entryId' },
  'Purchase Orders': { tabs: ROUTES.ADMIN_TABS, stack: ROUTES.ADMIN_TRANSACTIONS_STACK, screen: ROUTES.PO_DETAIL, paramKey: 'poId' },
  Estimates: { tabs: ROUTES.ADMIN_TABS, stack: ROUTES.ADMIN_TRANSACTIONS_STACK, screen: ROUTES.ESTIMATE_DETAIL, paramKey: 'estimateId' },
  'Sales Orders': { tabs: ROUTES.ADMIN_TABS, stack: ROUTES.ADMIN_TRANSACTIONS_STACK, screen: ROUTES.SO_DETAIL, paramKey: 'salesOrderId' },
  Deliveries: { tabs: ROUTES.ADMIN_TABS, stack: ROUTES.ADMIN_MORE_STACK, screen: ROUTES.DELIVERY_MANAGEMENT, paramKey: 'deliveryId' },
};

// ─── Build full search index once ───────────────────────────
const SEARCH_INDEX: SearchResult[] = [
  ...customers.map((c) => ({
    id: c.customerId,
    module: 'Customers' as const,
    primary: c.name,
    secondary: `${c.company} · ${c.email}`,
    color: MODULE_COLORS.Customers,
  })),
  ...vendors.map((v) => ({
    id: v.vendorId,
    module: 'Vendors' as const,
    primary: v.companyName,
    secondary: `${v.contactPerson} · ${v.email}`,
    color: MODULE_COLORS.Vendors,
  })),
  ...invoices.map((inv) => ({
    id: inv.invoiceId,
    module: 'Invoices' as const,
    primary: inv.invoiceNumber,
    secondary: `${inv.customerName} · $${inv.total.toLocaleString()} · ${inv.status}`,
    color: MODULE_COLORS.Invoices,
  })),
  ...bills.map((b) => ({
    id: b.billId,
    module: 'Bills' as const,
    primary: b.billNumber,
    secondary: `${b.vendorName} · $${b.total.toLocaleString()} · ${b.status}`,
    color: MODULE_COLORS.Bills,
  })),
  ...inventoryItems.map((item) => ({
    id: item.itemId,
    module: 'Inventory' as const,
    primary: item.name,
    secondary: `SKU: ${item.sku} · ${item.quantityOnHand} on hand · $${item.sellingPrice}`,
    color: MODULE_COLORS.Inventory,
  })),
  ...employees.map((e) => ({
    id: e.employeeId,
    module: 'Employees' as const,
    primary: `${e.firstName} ${e.lastName}`,
    secondary: `${e.department} · ${e.email}`,
    color: MODULE_COLORS.Employees,
  })),
  ...journalEntries.map((je) => ({
    id: je.entryId,
    module: 'Journal Entries' as const,
    primary: je.reference,
    secondary: `${je.memo} · ${je.status}`,
    color: MODULE_COLORS['Journal Entries'],
  })),
  ...purchaseOrders.map((po) => ({
    id: po.poId,
    module: 'Purchase Orders' as const,
    primary: po.poNumber,
    secondary: `${po.vendorName} · $${po.total.toLocaleString()} · ${po.status}`,
    color: MODULE_COLORS['Purchase Orders'],
  })),
  ...estimates.map((est) => ({
    id: est.estimateId,
    module: 'Estimates' as const,
    primary: est.estimateNumber,
    secondary: `${est.customerName} · $${est.total.toLocaleString()} · ${est.status}`,
    color: MODULE_COLORS.Estimates,
  })),
  ...salesOrders.map((so) => ({
    id: so.salesOrderId,
    module: 'Sales Orders' as const,
    primary: so.soNumber,
    secondary: `${so.customerName} · $${so.total.toLocaleString()} · ${so.status}`,
    color: MODULE_COLORS['Sales Orders'],
  })),
  ...deliveries.map((d) => ({
    id: d.deliveryId,
    module: 'Deliveries' as const,
    primary: d.deliveryId,
    secondary: `${d.customerName} · ${d.status}${d.deliveryPersonName ? ' · ' + d.deliveryPersonName : ''}`,
    color: MODULE_COLORS.Deliveries,
  })),
];

const MAX_RECENT = 5;

// ─── Main Component ─────────────────────────────────────────
const GlobalSearch: React.FC<{ navigation: any; onClose: () => void }> = ({ navigation, onClose }) => {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    return SEARCH_INDEX.filter(
      (r) =>
        r.primary.toLowerCase().includes(q) ||
        r.secondary.toLowerCase().includes(q),
    ).slice(0, 25);
  }, [query]);

  // Group by module
  const grouped = useMemo(() => {
    const map = new Map<string, SearchResult[]>();
    results.forEach((r) => {
      if (!map.has(r.module)) map.set(r.module, []);
      map.get(r.module)!.push(r);
    });
    return map;
  }, [results]);

  const addToRecent = useCallback((term: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((t) => t !== term);
      return [term, ...filtered].slice(0, MAX_RECENT);
    });
  }, []);

  const handleSelect = useCallback(
    (item: SearchResult) => {
      // Save to recent searches
      addToRecent(query.trim());

      const nav = MODULE_NAV[item.module];
      if (nav) {
        onClose();
        navigation.navigate(nav.tabs, {
          screen: nav.stack,
          params: {
            screen: nav.screen,
            params: { [nav.paramKey]: item.id },
          },
        });
      } else {
        onClose();
      }
    },
    [onClose, navigation, query, addToRecent],
  );

  const handleRecentSearch = useCallback((term: string) => {
    setQuery(term);
  }, []);

  const clearRecent = useCallback(() => {
    setRecentSearches([]);
  }, []);

  const showRecent = query.trim().length < 2 && results.length === 0;

  return (
    <View style={styles.overlay}>
      <View style={styles.searchBox}>
        {/* Input Row */}
        <View style={styles.inputRow}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search customers, invoices, inventory…"
            placeholderTextColor={Colors.placeholder}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.resultsList}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Recent Searches */}
          {showRecent && recentSearches.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.recentHeader}>
                <Text style={styles.sectionLabel}>RECENT SEARCHES</Text>
                <TouchableOpacity onPress={clearRecent}>
                  <Text style={styles.clearText}>Clear</Text>
                </TouchableOpacity>
              </View>
              {recentSearches.map((term) => (
                <TouchableOpacity key={term} style={styles.recentRow} onPress={() => handleRecentSearch(term)}>
                  <Text style={styles.recentIcon}>🕐</Text>
                  <Text style={styles.recentText}>{term}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Hint when no recent */}
          {showRecent && recentSearches.length === 0 && (
            <View style={styles.recentSection}>
              <Text style={styles.sectionLabel}>SEARCH ACROSS ALL MODULES</Text>
              <Text style={styles.hintText}>
                Customers, Vendors, Invoices, Bills, Inventory, Employees,{'\n'}
                Journal Entries, Purchase Orders, Estimates, Sales Orders, Deliveries
              </Text>
            </View>
          )}

          {/* Results grouped by module */}
          {query.trim().length >= 2 && results.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsIcon}>🔎</Text>
              <Text style={styles.noResultsText}>No results for "{query}"</Text>
            </View>
          )}

          {[...grouped.entries()].map(([module, items]) => (
            <View key={module} style={styles.groupSection}>
              <View style={styles.groupHeader}>
                <View style={[styles.moduleDot, { backgroundColor: MODULE_COLORS[module as ModuleName] }]} />
                <Text style={styles.groupTitle}>{module}</Text>
                <Text style={styles.groupCount}>{items.length}</Text>
              </View>
              {items.map((item) => (
                <TouchableOpacity key={item.id} style={styles.resultRow} onPress={() => handleSelect(item)} activeOpacity={0.6}>
                  <View style={[styles.resultBadge, { backgroundColor: item.color + '14' }]}>
                    <Text style={[styles.resultBadgeText, { color: item.color }]}>
                      {item.module.slice(0, 3).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.resultContent}>
                    <Text style={styles.resultPrimary}>{item.primary}</Text>
                    <Text style={styles.resultSecondary} numberOfLines={1}>{item.secondary}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ))}

          <View style={{ height: Spacing.xxxl }} />
        </ScrollView>
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.overlay,
    zIndex: 999,
    paddingTop: Platform.OS === 'ios' ? 50 : 10,
  },
  searchBox: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
    ...Shadows.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchIcon: { fontSize: 18, marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: Spacing.xs,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: Spacing.sm,
  },
  closeBtnText: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },

  resultsList: { flex: 1 },

  // Recent
  recentSection: { padding: Spacing.base },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
  },
  clearText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 20,
    marginTop: Spacing.sm,
  },
  recentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  recentIcon: { fontSize: 14, marginRight: Spacing.sm },
  recentText: { fontSize: 15, color: Colors.textPrimary },

  // No results
  noResults: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  noResultsIcon: { fontSize: 40, marginBottom: Spacing.md },
  noResultsText: { fontSize: 15, color: Colors.textSecondary },

  // Grouped results
  groupSection: { marginBottom: Spacing.sm },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.base,
    paddingBottom: Spacing.xs,
  },
  moduleDot: { width: 8, height: 8, borderRadius: 4, marginRight: Spacing.sm },
  groupTitle: { flex: 1, fontSize: 13, fontWeight: '700', color: Colors.textSecondary, letterSpacing: 0.5 },
  groupCount: { fontSize: 12, color: Colors.textTertiary },

  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  resultBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    marginRight: Spacing.md,
  },
  resultBadgeText: { fontSize: 10, fontWeight: '800' },
  resultContent: { flex: 1 },
  resultPrimary: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  resultSecondary: { fontSize: 12, color: Colors.textSecondary, marginTop: 1 },
});

export default GlobalSearch;
