// ============================================================
// FINMATRIX - Tax Settings Screen
// ============================================================
// List of tax rates. Each: name, rate%, type badge, active toggle.
// Add/Edit form (modal): name, rate, type dropdown. Delete option.

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  fetchTaxRates,
  addTaxRate,
  editTaxRate,
  removeTaxRate,
  toggleRateActive,
} from './taxSlice';
import { TaxRate } from '../../dummy-data/taxRates';

const TYPE_OPTIONS: TaxRate['type'][] = ['sales', 'gst', 'vat'];
const TYPE_COLORS: Record<string, { bg: string; text: string }> = {
  sales: { bg: Colors.infoLight, text: Colors.info },
  gst: { bg: Colors.successLight, text: Colors.success },
  vat: { bg: Colors.warningLight, text: Colors.warning },
};

const emptyForm = { name: '', rate: '', type: 'sales' as TaxRate['type'] };

const TaxSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { rates, isLoading } = useAppSelector((s) => s.tax);

  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    dispatch(fetchTaxRates());
  }, []);

  // ── Open modal for add / edit ─────────────────────────────
  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (rate: TaxRate) => {
    setEditId(rate.taxId);
    setForm({ name: rate.name, rate: rate.rate.toString(), type: rate.type });
    setShowModal(true);
  };

  const handleSave = () => {
    const nameVal = form.name.trim();
    const rateVal = parseFloat(form.rate);
    if (!nameVal || isNaN(rateVal) || rateVal <= 0) {
      Alert.alert('Validation', 'Please enter a valid name and rate.');
      return;
    }
    if (editId) {
      dispatch(
        editTaxRate({
          taxId: editId,
          name: nameVal,
          rate: rateVal,
          type: form.type,
          isActive: rates.find((r) => r.taxId === editId)?.isActive ?? true,
        }),
      );
    } else {
      dispatch(
        addTaxRate({ name: nameVal, rate: rateVal, type: form.type, isActive: true }),
      );
    }
    setShowModal(false);
  };

  const handleDelete = () => {
    if (!editId) return;
    Alert.alert('Delete', 'Remove this tax rate?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          dispatch(removeTaxRate(editId));
          setShowModal(false);
        },
      },
    ]);
  };

  const handleToggle = (taxId: string) => {
    dispatch(toggleRateActive(taxId));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Tax Settings</Text>
        <TouchableOpacity onPress={openAdd}>
          <Text style={styles.addText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {rates.map((rate) => {
          const tc = TYPE_COLORS[rate.type] ?? TYPE_COLORS.sales;
          return (
            <TouchableOpacity
              key={rate.taxId}
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => openEdit(rate)}
            >
              <View style={styles.cardTop}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rateName}>{rate.name}</Text>
                  <Text style={styles.rateValue}>{rate.rate}%</Text>
                </View>
                <View style={[styles.typeBadge, { backgroundColor: tc.bg }]}>
                  <Text style={[styles.typeText, { color: tc.text }]}>
                    {rate.type.toUpperCase()}
                  </Text>
                </View>
              </View>
              <View style={styles.cardBottom}>
                <Text style={styles.toggleLabel}>
                  {rate.isActive ? 'Active' : 'Inactive'}
                </Text>
                <Switch
                  value={rate.isActive}
                  onValueChange={() => handleToggle(rate.taxId)}
                  trackColor={{ false: Colors.border, true: Colors.success + '66' }}
                  thumbColor={rate.isActive ? Colors.success : Colors.textTertiary}
                />
              </View>
            </TouchableOpacity>
          );
        })}

        {rates.length === 0 && !isLoading && (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyText}>No tax rates configured</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAdd}>
              <Text style={styles.emptyBtnText}>+ Add Tax Rate</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ── Add / Edit Modal ─────────────────────────────── */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editId ? 'Edit Tax Rate' : 'New Tax Rate'}
            </Text>

            {/* Name */}
            <Text style={styles.fieldLabel}>Name</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholder="e.g. Sales Tax"
              placeholderTextColor={Colors.placeholder}
            />

            {/* Rate */}
            <Text style={styles.fieldLabel}>Rate (%)</Text>
            <TextInput
              style={styles.input}
              value={form.rate}
              onChangeText={(v) => setForm((p) => ({ ...p, rate: v }))}
              placeholder="e.g. 7.5"
              placeholderTextColor={Colors.placeholder}
              keyboardType="numeric"
            />

            {/* Type picker */}
            <Text style={styles.fieldLabel}>Type</Text>
            <View style={styles.typeRow}>
              {TYPE_OPTIONS.map((t) => {
                const sel = form.type === t;
                const tc = TYPE_COLORS[t];
                return (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.typeChip,
                      { backgroundColor: sel ? tc.bg : Colors.borderLight },
                    ]}
                    onPress={() => setForm((p) => ({ ...p, type: t }))}
                  >
                    <Text
                      style={[
                        styles.typeChipText,
                        { color: sel ? tc.text : Colors.textTertiary },
                      ]}
                    >
                      {t.toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Actions */}
            <View style={styles.modalActions}>
              {editId && (
                <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                  <Text style={styles.deleteText}>🗑 Delete</Text>
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
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
  addText: { fontSize: 15, color: Colors.success, fontWeight: '700' },
  scroll: { padding: Spacing.base, paddingBottom: Spacing.huge },

  // Card
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.md },
  rateName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  rateValue: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.xs,
  },
  typeText: { fontSize: 10, fontWeight: '700' },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    paddingTop: Spacing.sm,
  },
  toggleLabel: { fontSize: 13, color: Colors.textSecondary },

  // Empty
  emptyBox: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: Spacing.md },
  emptyText: { fontSize: 15, color: Colors.textSecondary, marginBottom: Spacing.base },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
  },
  emptyBtnText: { color: Colors.white, fontWeight: '700' },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    padding: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: Spacing.md,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: 4 },
  typeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  typeChipText: { fontSize: 12, fontWeight: '700' },
  modalActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.xl,
  },
  deleteBtn: { paddingVertical: Spacing.sm },
  deleteText: { fontSize: 14, color: Colors.danger, fontWeight: '600' },
  cancelBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
  cancelText: { fontSize: 15, color: Colors.textSecondary, fontWeight: '600' },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.sm,
  },
  saveText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});

export default TaxSettingsScreen;
