// ============================================================
// FINMATRIX - Create Company Screen (Redesigned)
// Improvements:
//  • Uses StepIndicator for consistent progress display
//  • Ionicons throughout — no emojis
//  • AuthInput for all form fields
//  • Industry uses chip grid (not dropdown)
//  • Logo upload uses proper icon instead of emoji
//  • Review step is more concise (agency count, not SKU list)
//  • Back + Continue dual-button bottom bar
// ============================================================
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Alert, Platform, KeyboardAvoidingView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import { createCompany, CompanyAddress } from '../../store/companySlice';
import { preSeededAgencies, WarehouseAgency, AgencyInventoryItem } from '../../dummy-data/warehouseAgencies';
import { syncAgencyItems } from '../Inventory/inventorySlice';
import type { InventoryItem } from '../../dummy-data/inventoryItems';
import StepIndicator from '../../shared-components/StepIndicator';
import AuthInput from '../../shared-components/AuthInput';

const INDUSTRIES = ['Manufacturing', 'Supply Chain', 'Distribution', 'Retail', 'Services', 'Other'];
const AGENCY_TYPES: Array<'manufacturing' | 'supply' | 'distribution'> = ['manufacturing', 'supply', 'distribution'];
const STEP_LABELS = ['Company Info', 'Agencies', 'Review'];

interface CompanyFormData {
  name: string; industry: string; street: string; city: string;
  state: string; zipCode: string; phone: string; email: string; taxId: string;
}

interface CustomAgencyForm {
  name: string; type: 'manufacturing' | 'supply' | 'distribution';
  description: string; street: string; city: string; state: string; zipCode: string;
}

const CreateCompanyScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((s) => s.auth);

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<CompanyFormData>({ name: '', industry: '', street: '', city: '', state: '', zipCode: '', phone: '', email: '', taxId: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [showCustomAgencyForm, setShowCustomAgencyForm] = useState(false);
  const [customAgencies, setCustomAgencies] = useState<WarehouseAgency[]>([]);
  const [customForm, setCustomForm] = useState<CustomAgencyForm>({ name: '', type: 'manufacturing', description: '', street: '', city: '', state: '', zipCode: '' });

  const updateForm = (field: keyof CompanyFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Company name is required';
    if (!form.industry) e.industry = 'Please select an industry';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const validateStep2 = (): boolean => {
    if (selectedAgencyIds.length === 0 && customAgencies.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one warehouse agency.');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };
  const handleBack = () => { if (step > 1) setStep(step - 1); else navigation.goBack(); };

  const toggleAgency = (id: string) => setSelectedAgencyIds((prev) => prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]);

  const addCustomAgency = () => {
    if (!customForm.name.trim()) { Alert.alert('Error', 'Agency name is required'); return; }
    const newAgency: WarehouseAgency = {
      agencyId: `custom_${Date.now()}`, companyId: '', name: customForm.name, type: customForm.type,
      description: customForm.description, address: { street: customForm.street, city: customForm.city, state: customForm.state, zipCode: customForm.zipCode },
      contactPerson: '', contactPhone: '', contactEmail: '', inventoryItems: [], isActive: true, createdAt: new Date().toISOString(),
    };
    setCustomAgencies((prev) => [...prev, newAgency]);
    setSelectedAgencyIds((prev) => [...prev, newAgency.agencyId]);
    setCustomForm({ name: '', type: 'manufacturing', description: '', street: '', city: '', state: '', zipCode: '' });
    setShowCustomAgencyForm(false);
  };

  const getAllSelectedAgencies = (): WarehouseAgency[] => {
    const seeded = preSeededAgencies.filter((a) => selectedAgencyIds.includes(a.agencyId));
    const custom = customAgencies.filter((a) => selectedAgencyIds.includes(a.agencyId));
    return [...seeded, ...custom];
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'manufacturing': return { bg: Colors.infoLight, text: Colors.info };
      case 'supply': return { bg: Colors.successLight, text: Colors.success };
      case 'distribution': return { bg: Colors.warningLight, text: Colors.warning };
      default: return { bg: Colors.border, text: Colors.textSecondary };
    }
  };

  const handleCreateCompany = () => {
    const agencies = getAllSelectedAgencies();
    const address: CompanyAddress = { street: form.street, city: form.city, state: form.state, zipCode: form.zipCode };
    dispatch(createCompany({ name: form.name, industry: form.industry, address, phone: form.phone, email: form.email, taxId: form.taxId, agencies, userId: user?.uid || '', userRole: (user?.role as 'administrator' | 'delivery_personnel') || 'administrator' }));
    const agencyInventory: InventoryItem[] = agencies.flatMap((ag) =>
      ag.inventoryItems.map((ai) => ({
        itemId: ai.itemId, companyId: '', sku: ai.sku, name: ai.name, description: '', category: 'Finished Goods' as any, unitOfMeasure: 'each' as any, costMethod: 'average' as any,
        unitCost: ai.unitCost, sellingPrice: ai.sellingPrice, quantityOnHand: ai.quantityOnHand, quantityOnOrder: 0, quantityCommitted: 0, reorderPoint: ai.reorderPoint, reorderQuantity: ai.reorderPoint * 2,
        minStock: Math.floor(ai.reorderPoint * 0.5), maxStock: ai.quantityOnHand * 3 || 100, isActive: true, serialTracking: false, lotTracking: false, barcodeData: null,
        locationId: 'warehouse_1' as any, imageUrl: null, lastUpdated: new Date().toISOString(), sourceAgencyId: ag.agencyId,
      }))
    );
    if (agencyInventory.length > 0) dispatch(syncAgencyItems({ items: agencyInventory }));
  };

  // ── STEP 1 ──
  const renderStep1 = () => (
    <ScrollView style={st.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <Text style={st.stepTitle}>Company Information</Text>
      <Text style={st.stepDesc}>Enter your company details to get started.</Text>
      <AuthInput label="Company Name *" leftIcon="business-outline" placeholder="Enter company name" value={form.name} onChangeText={(v) => updateForm('name', v)} error={errors.name} containerStyle={{ paddingHorizontal: 0 }} />
      <Text style={st.label}>Industry *</Text>
      {errors.industry && <Text style={st.errorText}>{errors.industry}</Text>}
      <View style={st.industryGrid}>
        {INDUSTRIES.map((ind) => {
          const sel = form.industry === ind;
          return (
            <TouchableOpacity key={ind} style={[st.chip, sel && st.chipSelected]} onPress={() => updateForm('industry', ind)}>
              <Text style={[st.chipText, sel && st.chipTextSelected]}>{ind}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={st.sectionLabel}>Company Address</Text>
      <AuthInput label="Street" placeholder="Street address" value={form.street} onChangeText={(v) => updateForm('street', v)} containerStyle={{ paddingHorizontal: 0 }} />
      <View style={st.row}>
        <View style={{ flex: 1 }}><AuthInput label="City" placeholder="City" value={form.city} onChangeText={(v) => updateForm('city', v)} containerStyle={{ paddingHorizontal: 0 }} /></View>
        <View style={{ flex: 1 }}><AuthInput label="State" placeholder="State" value={form.state} onChangeText={(v) => updateForm('state', v)} containerStyle={{ paddingHorizontal: 0 }} /></View>
      </View>
      <AuthInput label="ZIP Code" placeholder="ZIP code" value={form.zipCode} onChangeText={(v) => updateForm('zipCode', v)} keyboardType="number-pad" containerStyle={{ paddingHorizontal: 0 }} />

      <Text style={st.sectionLabel}>Contact Information</Text>
      <AuthInput label="Phone" leftIcon="call-outline" placeholder="Phone number" value={form.phone} onChangeText={(v) => updateForm('phone', v)} keyboardType="phone-pad" containerStyle={{ paddingHorizontal: 0 }} />
      <AuthInput label="Email" leftIcon="mail-outline" placeholder="Company email" value={form.email} onChangeText={(v) => updateForm('email', v)} keyboardType="email-address" autoCapitalize="none" containerStyle={{ paddingHorizontal: 0 }} />
      <AuthInput label="Tax ID (optional)" leftIcon="document-outline" placeholder="Tax identification number" value={form.taxId} onChangeText={(v) => updateForm('taxId', v)} containerStyle={{ paddingHorizontal: 0 }} />

      <Text style={st.sectionLabel}>Company Logo</Text>
      <TouchableOpacity style={st.logoPlaceholder}>
        <Ionicons name="camera-outline" size={28} color={Colors.textTertiary} />
        <Text style={st.logoLabel}>Tap to upload logo</Text>
      </TouchableOpacity>
      <View style={{ height: 32 }} />
    </ScrollView>
  );

  // ── STEP 2 ──
  const renderStep2 = () => (
    <ScrollView style={st.stepContent} showsVerticalScrollIndicator={false}>
      <Text style={st.stepTitle}>Select Warehouse Agencies</Text>
      <Text style={st.stepDesc}>Choose agencies you want to manage. Select at least one.</Text>
      {[...preSeededAgencies, ...customAgencies].map((agency) => {
        const sel = selectedAgencyIds.includes(agency.agencyId);
        const badge = getTypeBadgeColor(agency.type);
        const isCustom = agency.agencyId.startsWith('custom_');
        return (
          <TouchableOpacity key={agency.agencyId} style={[st.agencyCard, sel && st.agencyCardSel]} activeOpacity={0.7} onPress={() => toggleAgency(agency.agencyId)}>
            <View style={st.agencyHeader}>
              <View style={{ flex: 1 }}>
                <Text style={st.agencyName}>{agency.name}</Text>
                <View style={[st.badge, { backgroundColor: badge.bg }]}><Text style={[st.badgeText, { color: badge.text }]}>{agency.type}</Text></View>
              </View>
              <View style={[st.checkbox, sel && st.checkboxChecked]}>
                {sel && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
            </View>
            <Text style={st.agencyDesc}>{agency.description}</Text>
            {!isCustom && <Text style={st.agencyCount}>{agency.inventoryItems.length} inventory items</Text>}
            {isCustom && <View style={st.customTag}><Text style={st.customTagText}>Custom</Text></View>}
          </TouchableOpacity>
        );
      })}
      {!showCustomAgencyForm ? (
        <TouchableOpacity style={st.addBtn} onPress={() => setShowCustomAgencyForm(true)}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={st.addBtnText}>Add Custom Agency</Text>
        </TouchableOpacity>
      ) : (
        <View style={st.customForm}>
          <Text style={st.customFormTitle}>New Custom Agency</Text>
          <AuthInput label="Agency Name *" placeholder="Agency name" value={customForm.name} onChangeText={(v) => setCustomForm((p) => ({ ...p, name: v }))} containerStyle={{ paddingHorizontal: 0 }} />
          <Text style={st.label}>Type</Text>
          <View style={st.typeRow}>
            {AGENCY_TYPES.map((t) => (
              <TouchableOpacity key={t} style={[st.typeOpt, customForm.type === t && st.typeOptSel]} onPress={() => setCustomForm((p) => ({ ...p, type: t }))}>
                <Text style={[st.typeOptText, customForm.type === t && st.typeOptTextSel]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <AuthInput label="Description" placeholder="Brief description" value={customForm.description} onChangeText={(v) => setCustomForm((p) => ({ ...p, description: v }))} multiline numberOfLines={3} containerStyle={{ paddingHorizontal: 0 }} />
          <View style={st.formActions}>
            <TouchableOpacity style={st.cancelBtn} onPress={() => setShowCustomAgencyForm(false)}><Text style={st.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={st.saveBtn} onPress={addCustomAgency}><Text style={st.saveBtnText}>Add Agency</Text></TouchableOpacity>
          </View>
        </View>
      )}
      <View style={{ height: 32 }} />
    </ScrollView>
  );

  // ── STEP 3 ──
  const renderStep3 = () => {
    const agencies = getAllSelectedAgencies();
    const totalItems = agencies.reduce((sum, a) => sum + a.inventoryItems.length, 0);
    return (
      <ScrollView style={st.stepContent} showsVerticalScrollIndicator={false}>
        <Text style={st.stepTitle}>Review & Create</Text>
        <Text style={st.stepDesc}>Review your company details before creating.</Text>
        <View style={st.reviewSection}>
          <Text style={st.reviewTitle}>Company Details</Text>
          <ReviewRow label="Name" value={form.name} />
          <ReviewRow label="Industry" value={form.industry} />
          {form.street ? <ReviewRow label="Address" value={[form.street, form.city, form.state, form.zipCode].filter(Boolean).join(', ')} /> : null}
          {form.phone ? <ReviewRow label="Phone" value={form.phone} /> : null}
          {form.email ? <ReviewRow label="Email" value={form.email} /> : null}
        </View>
        <View style={st.reviewSection}>
          <Text style={st.reviewTitle}>Warehouse Agencies ({agencies.length})</Text>
          <Text style={st.reviewSubtitle}>{totalItems} total inventory items</Text>
          {agencies.map((ag) => {
            const badge = getTypeBadgeColor(ag.type);
            return (
              <View key={ag.agencyId} style={st.reviewAgency}>
                <Text style={st.reviewAgencyName}>{ag.name}</Text>
                <View style={[st.badge, { backgroundColor: badge.bg }]}><Text style={[st.badgeText, { color: badge.text }]}>{ag.type}</Text></View>
              </View>
            );
          })}
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    );
  };

  const ReviewRow = ({ label, value }: { label: string; value: string }) => (
    <View style={st.reviewRow}><Text style={st.reviewLabel}>{label}</Text><Text style={st.reviewValue}>{value}</Text></View>
  );

  return (
    <KeyboardAvoidingView style={st.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[st.inner, { paddingTop: SAFE_TOP_PADDING }]}>
        <View style={st.topBar}>
          <TouchableOpacity onPress={handleBack} style={st.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={st.topBarTitle}>Create Company</Text>
          <View style={{ width: 40 }} />
        </View>
        <StepIndicator totalSteps={3} currentStep={step} labels={STEP_LABELS} />
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        <View style={[st.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={st.bottomRow}>
            {step > 1 && (
              <TouchableOpacity style={st.secBtn} onPress={handleBack}>
                <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} />
                <Text style={st.secBtnText}>Back</Text>
              </TouchableOpacity>
            )}
            {step < 3 ? (
              <TouchableOpacity style={[st.priBtn, step === 1 && { flex: 1 }]} onPress={handleNext} activeOpacity={0.85}>
                <Text style={st.priBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.white} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={st.priBtn} onPress={handleCreateCompany} activeOpacity={0.85}>
                <Text style={st.priBtnText}>Create Company</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  topBarTitle: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary },
  stepContent: { flex: 1, paddingHorizontal: Spacing.base },
  stepTitle: { fontSize: Typography.fontSize.h3, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  stepDesc: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
  label: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  sectionLabel: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary, marginTop: Spacing.xl, marginBottom: Spacing.xs },
  errorText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.danger, marginTop: 2 },
  row: { flexDirection: 'row', gap: Spacing.md },
  industryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  chip: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  chipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  chipText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  chipTextSelected: { color: Colors.primary, fontFamily: Typography.fontFamily.semiBold },
  logoPlaceholder: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: BorderRadius.sm, height: 100, justifyContent: 'center', alignItems: 'center', marginTop: Spacing.sm, gap: Spacing.xs },
  logoLabel: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary },
  agencyCard: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.sm, padding: Spacing.base, marginBottom: Spacing.md },
  agencyCardSel: { borderColor: Colors.primary, backgroundColor: Colors.primary + '03' },
  agencyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  agencyName: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  agencyDesc: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm },
  agencyCount: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.medium, color: Colors.primary },
  badge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.xs, alignSelf: 'flex-start' },
  badgeText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.medium, textTransform: 'capitalize' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  customTag: { backgroundColor: Colors.warningLight, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.xs, alignSelf: 'flex-start' },
  customTagText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.medium, color: Colors.warning },
  addBtn: { flexDirection: 'row', borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: BorderRadius.sm, padding: Spacing.base, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  addBtnText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary },
  customForm: { backgroundColor: Colors.white, borderRadius: BorderRadius.sm, padding: Spacing.base, marginTop: Spacing.md, ...Shadows.sm },
  customFormTitle: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.md },
  typeOpt: { flex: 1, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, alignItems: 'center' },
  typeOptSel: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  typeOptText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary, textTransform: 'capitalize' },
  typeOptTextSel: { color: Colors.primary },
  formActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.base },
  cancelBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
  cancelBtnText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  saveBtn: { backgroundColor: Colors.primary, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base, borderRadius: BorderRadius.sm },
  saveBtnText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold, color: Colors.white },
  reviewSection: { backgroundColor: Colors.white, borderRadius: BorderRadius.sm, padding: Spacing.base, marginBottom: Spacing.base, ...Shadows.sm },
  reviewTitle: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary, marginBottom: Spacing.md },
  reviewSubtitle: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary, marginTop: -Spacing.sm, marginBottom: Spacing.md },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border + '50' },
  reviewLabel: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  reviewValue: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, flex: 1, textAlign: 'right', marginLeft: Spacing.base },
  reviewAgency: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border + '50' },
  reviewAgencyName: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, flex: 1 },
  bottomBar: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },
  bottomRow: { flexDirection: 'row', gap: Spacing.md },
  secBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.sm, borderWidth: 1.5, borderColor: Colors.border, gap: 4 },
  secBtnText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  priBtn: { flex: 1, flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, ...Shadows.sm },
  priBtnText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.white },
});

export default CreateCompanyScreen;