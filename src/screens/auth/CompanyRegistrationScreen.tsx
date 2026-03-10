// ============================================================
// FINMATRIX - Company Registration Wizard (Redesigned)
// Improvements:
//  • StepIndicator replaces animated bar + tiny labels
//  • ONE consistent section header style (no per-step gradient)
//  • Ionicons replace 2-letter badge icons
//  • Legal structure: clean radio list with visible descriptions
//  • Industry: properly sized chips with Ionicons
//  • COA templates: compact cards with radio selection
//  • Inline validation errors (no hidden failures)
//  • Back + Continue dual-button bottom bar
//  • Review step with collapsible-ready sections
//  • Proper loading overlay on final submission
// ============================================================
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { signUp } from './authSlice';
import { createCompany, CompanyAddress } from '../../store/companySlice';
import {
  preSeededAgencies,
  WarehouseAgency,
  AgencyInventoryItem,
} from '../../dummy-data/warehouseAgencies';
import { syncAgencyItems } from '../Inventory/inventorySlice';
import type { InventoryItem } from '../../dummy-data/inventoryItems';
import { validateEmail, validatePassword } from '../../models/authModel';
import StepIndicator from '../../shared-components/StepIndicator';
import AuthInput from '../../shared-components/AuthInput';
import InlineBanner from '../../shared-components/InlineBanner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 7;

// ── Constants ─────────────────────────────────────────────
const LEGAL_STRUCTURES = [
  { key: 'sole_proprietor', label: 'Sole Proprietorship', desc: 'Single-owner business with no formal structure', icon: 'person-outline' as const },
  { key: 'partnership', label: 'Partnership', desc: 'Two or more owners sharing profits and liabilities', icon: 'people-outline' as const },
  { key: 'llc', label: 'LLC', desc: 'Limited liability protection for owners', icon: 'shield-outline' as const },
  { key: 'corporation', label: 'Corporation', desc: 'Separate legal entity owned by shareholders', icon: 'business-outline' as const },
  { key: 's_corp', label: 'S-Corporation', desc: 'Corporation with pass-through taxation', icon: 'receipt-outline' as const },
  { key: 'non_profit', label: 'Non-Profit', desc: 'Organization for charitable or social purposes', icon: 'heart-outline' as const },
];

const INDUSTRIES = [
  { key: 'manufacturing', label: 'Manufacturing', icon: 'construct-outline' as const },
  { key: 'supply_chain', label: 'Supply Chain & Logistics', icon: 'git-network-outline' as const },
  { key: 'distribution', label: 'Distribution', icon: 'navigate-outline' as const },
  { key: 'retail', label: 'Retail', icon: 'storefront-outline' as const },
  { key: 'wholesale', label: 'Wholesale', icon: 'cube-outline' as const },
  { key: 'services', label: 'Professional Services', icon: 'briefcase-outline' as const },
  { key: 'construction', label: 'Construction', icon: 'hammer-outline' as const },
  { key: 'healthcare', label: 'Healthcare', icon: 'medkit-outline' as const },
  { key: 'technology', label: 'Technology', icon: 'code-slash-outline' as const },
  { key: 'food_beverage', label: 'Food & Beverage', icon: 'restaurant-outline' as const },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' as const },
];

const COA_TEMPLATES = [
  { key: 'standard', label: 'Standard Business', desc: 'General chart of accounts suitable for most businesses', accounts: 45 },
  { key: 'manufacturing', label: 'Manufacturing', desc: 'Includes COGS, WIP, raw materials, and production accounts', accounts: 62 },
  { key: 'retail', label: 'Retail & Wholesale', desc: 'Focused on inventory, sales, and cost of goods accounts', accounts: 52 },
  { key: 'services', label: 'Professional Services', desc: 'Service revenue, consulting, and project-based accounts', accounts: 38 },
  { key: 'construction', label: 'Construction', desc: 'Job costing, retainage, and construction-specific accounts', accounts: 55 },
  { key: 'non_profit', label: 'Non-Profit', desc: 'Fund accounting, grants, donations, and program expenses', accounts: 42 },
  { key: 'custom', label: 'Start from Scratch', desc: 'Begin with minimal accounts and build your own chart', accounts: 15 },
];

const FISCAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const CURRENCIES = [
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
];

const DATE_FORMATS = [
  { key: 'MM/DD/YYYY', label: 'MM/DD/YYYY', example: '03/07/2026' },
  { key: 'DD/MM/YYYY', label: 'DD/MM/YYYY', example: '07/03/2026' },
  { key: 'YYYY-MM-DD', label: 'YYYY-MM-DD', example: '2026-03-07' },
  { key: 'DD-MMM-YYYY', label: 'DD-MMM-YYYY', example: '07-Mar-2026' },
];

const AGENCY_TYPES: Array<'manufacturing' | 'supply' | 'distribution'> = ['manufacturing', 'supply', 'distribution'];

const STEP_LABELS = ['Company', 'Industry', 'Fiscal', 'Contact', 'Agencies', 'Admin', 'Review'];

interface CompanyFormData {
  companyName: string; legalStructure: string;
  industry: string; coaTemplate: string;
  fiscalYearStart: string; currency: string; dateFormat: string; numberFormat: string;
  street: string; city: string; state: string; zipCode: string;
  phone: string; email: string; website: string; taxId: string;
  adminName: string; adminEmail: string; adminPassword: string; adminConfirmPassword: string; adminPhone: string;
}

interface CustomAgencyForm {
  name: string; type: 'manufacturing' | 'supply' | 'distribution';
  description: string; street: string; city: string; state: string; zipCode: string;
}

// ── Section Header ────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle }: { icon: keyof typeof Ionicons.glyphMap; title: string; subtitle: string }) => (
  <View style={st.sectionHeader}>
    <View style={st.sectionIconCircle}>
      <Ionicons name={icon} size={24} color={Colors.primary} />
    </View>
    <Text style={st.stepTitle}>{title}</Text>
    <Text style={st.stepDescription}>{subtitle}</Text>
  </View>
);

// ── Review Row ────────────────────────────────────────────
const ReviewRow = ({ label, value }: { label: string; value: string }) => (
  <View style={st.reviewRow}>
    <Text style={st.reviewLabel}>{label}</Text>
    <Text style={st.reviewValue}>{value}</Text>
  </View>
);

// ── Main Component ────────────────────────────────────────
const CompanyRegistrationScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CompanyFormData>({
    companyName: '', legalStructure: '',
    industry: '', coaTemplate: 'standard',
    fiscalYearStart: 'January', currency: 'PKR', dateFormat: 'DD/MM/YYYY', numberFormat: '#,##0.00',
    street: '', city: '', state: '', zipCode: '',
    phone: '', email: '', website: '', taxId: '',
    adminName: '', adminEmail: '', adminPassword: '', adminConfirmPassword: '', adminPhone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [selectedAgencyIds, setSelectedAgencyIds] = useState<string[]>([]);
  const [customAgencies, setCustomAgencies] = useState<WarehouseAgency[]>([]);
  const [showCustomAgencyForm, setShowCustomAgencyForm] = useState(false);
  const [customForm, setCustomForm] = useState<CustomAgencyForm>({ name: '', type: 'manufacturing', description: '', street: '', city: '', state: '', zipCode: '' });

  const [showFiscalPicker, setShowFiscalPicker] = useState(false);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const updateForm = (field: keyof CompanyFormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
  };

  // ── Validation ──────────────────────────────────────────
  const validateStep1 = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.companyName.trim()) e.companyName = 'Company name is required';
    else if (form.companyName.trim().length < 2) e.companyName = 'Company name must be at least 2 characters';
    if (!form.legalStructure) e.legalStructure = 'Please select a legal structure';
    setErrors(e); return Object.keys(e).length === 0;
  };
  const validateStep2 = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.industry) e.industry = 'Please select your industry';
    if (!form.coaTemplate) e.coaTemplate = 'Please select a chart of accounts template';
    setErrors(e); return Object.keys(e).length === 0;
  };
  const validateStep3 = (): boolean => true;
  const validateStep4 = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.email.trim()) e.email = 'Company email is required';
    else { const emailErr = validateEmail(form.email); if (emailErr) e.email = emailErr; }
    if (!form.phone.trim()) e.phone = 'Company phone is required';
    setErrors(e); return Object.keys(e).length === 0;
  };
  const validateStep5 = (): boolean => {
    if (selectedAgencyIds.length === 0 && customAgencies.length === 0) {
      Alert.alert('Selection Required', 'Please select at least one warehouse agency.');
      return false;
    }
    return true;
  };
  const validateStep6 = (): boolean => {
    const e: Record<string, string> = {};
    if (!form.adminName.trim()) e.adminName = 'Full name is required';
    if (!form.adminEmail.trim()) e.adminEmail = 'Email is required';
    else { const emailErr = validateEmail(form.adminEmail); if (emailErr) e.adminEmail = emailErr; }
    if (!form.adminPassword) e.adminPassword = 'Password is required';
    else { const pwErr = validatePassword(form.adminPassword); if (pwErr) e.adminPassword = pwErr; }
    if (!form.adminConfirmPassword) e.adminConfirmPassword = 'Please confirm your password';
    else if (form.adminPassword !== form.adminConfirmPassword) e.adminConfirmPassword = 'Passwords do not match';
    setErrors(e); return Object.keys(e).length === 0;
  };

  const validators = [validateStep1, validateStep2, validateStep3, validateStep4, validateStep5, validateStep6];

  const handleNext = () => {
    if (step < TOTAL_STEPS && validators[step - 1]()) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
    else navigation.goBack();
  };

  // ── Agency helpers ──
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

  // ── Register ────────────────────────────────────────────
  const handleRegister = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const signUpResult = await dispatch(signUp({
        email: form.adminEmail, password: form.adminPassword, displayName: form.adminName,
        phoneNumber: form.adminPhone, companyName: form.companyName, role: 'administrator',
      })).unwrap();

      const agencies = getAllSelectedAgencies();
      const address: CompanyAddress = { street: form.street, city: form.city, state: form.state, zipCode: form.zipCode };
      dispatch(createCompany({
        name: form.companyName, industry: INDUSTRIES.find((i) => i.key === form.industry)?.label || form.industry,
        address, phone: form.phone, email: form.email, taxId: form.taxId, agencies, userId: signUpResult.uid, userRole: 'administrator',
      }));

      const agencyInventory: InventoryItem[] = agencies.flatMap((ag) =>
        ag.inventoryItems.map((ai) => ({
          itemId: ai.itemId, companyId: '', sku: ai.sku, name: ai.name, description: '',
          category: 'Finished Goods' as any, unitOfMeasure: 'each' as any, costMethod: 'average' as any,
          unitCost: ai.unitCost, sellingPrice: ai.sellingPrice, quantityOnHand: ai.quantityOnHand,
          quantityOnOrder: 0, quantityCommitted: 0, reorderPoint: ai.reorderPoint, reorderQuantity: ai.reorderPoint * 2,
          minStock: Math.floor(ai.reorderPoint * 0.5), maxStock: ai.quantityOnHand * 3 || 100,
          isActive: true, serialTracking: false, lotTracking: false, barcodeData: null,
          locationId: 'warehouse_1' as any, imageUrl: null, lastUpdated: new Date().toISOString(), sourceAgencyId: ag.agencyId,
        }))
      );
      if (agencyInventory.length > 0) dispatch(syncAgencyItems({ items: agencyInventory }));
    } catch (error: any) {
      Alert.alert('Registration Failed', error?.message || 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  };

  // ── RENDER STEPS ────────────────────────────────────────

  const renderStep1 = () => (
    <ScrollView style={st.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SectionHeader icon="business-outline" title="Tell Us About Your Company" subtitle="Enter your company name and select the legal structure." />

      <AuthInput label="Company Name *" leftIcon="briefcase-outline" placeholder="e.g. Acme Industries Pvt. Ltd."
        value={form.companyName} onChangeText={(v) => updateForm('companyName', v)} error={errors.companyName} containerStyle={{ paddingHorizontal: 0 }} />

      <Text style={st.label}>Legal Structure *</Text>
      {errors.legalStructure && <Text style={st.errorText}>{errors.legalStructure}</Text>}
      {LEGAL_STRUCTURES.map((ls) => {
        const sel = form.legalStructure === ls.key;
        return (
          <TouchableOpacity key={ls.key} style={[st.legalCard, sel && st.legalCardSelected]} activeOpacity={0.7} onPress={() => updateForm('legalStructure', ls.key)}>
            <View style={[st.legalIconCircle, sel && { backgroundColor: Colors.primary + '15' }]}>
              <Ionicons name={ls.icon} size={18} color={sel ? Colors.primary : Colors.textTertiary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[st.legalCardLabel, sel && { color: Colors.primary }]}>{ls.label}</Text>
              <Text style={st.legalCardDesc}>{ls.desc}</Text>
            </View>
            <View style={[st.radioOuter, sel && st.radioOuterSelected]}>
              {sel && <View style={st.radioInner} />}
            </View>
          </TouchableOpacity>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderStep2 = () => (
    <ScrollView style={st.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SectionHeader icon="grid-outline" title="Industry & Chart of Accounts" subtitle="Select your industry to configure the best template." />

      <Text style={st.label}>Industry *</Text>
      {errors.industry && <Text style={st.errorText}>{errors.industry}</Text>}
      <View style={st.industryGrid}>
        {INDUSTRIES.map((ind) => {
          const sel = form.industry === ind.key;
          return (
            <TouchableOpacity key={ind.key} style={[st.industryChip, sel && st.industryChipSelected]} activeOpacity={0.7} onPress={() => updateForm('industry', ind.key)}>
              <Ionicons name={ind.icon} size={16} color={sel ? Colors.primary : Colors.textTertiary} style={{ marginRight: 6 }} />
              <Text style={[st.industryChipLabel, sel && st.industryChipLabelSelected]}>{ind.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={[st.label, { marginTop: Spacing.xl }]}>Chart of Accounts Template *</Text>
      <Text style={st.hintText}>Choose a pre-built template or start from scratch. You can customize later.</Text>
      {COA_TEMPLATES.map((tmpl) => {
        const sel = form.coaTemplate === tmpl.key;
        return (
          <TouchableOpacity key={tmpl.key} style={[st.templateCard, sel && st.templateCardSelected]} activeOpacity={0.7} onPress={() => updateForm('coaTemplate', tmpl.key)}>
            <View style={st.templateCardHeader}>
              <View style={[st.radioOuter, sel && st.radioOuterSelected]}>
                {sel && <View style={st.radioInner} />}
              </View>
              <View style={{ flex: 1, marginHorizontal: Spacing.md }}>
                <Text style={[st.templateLabel, sel && { color: Colors.primary }]}>{tmpl.label}</Text>
                <Text style={st.templateDesc}>{tmpl.desc}</Text>
              </View>
              <View style={st.accountsBadge}>
                <Text style={st.accountsBadgeText}>{tmpl.accounts}</Text>
                <Text style={st.accountsBadgeLabel}>accts</Text>
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderStep3 = () => (
    <ScrollView style={st.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SectionHeader icon="calendar-outline" title="Fiscal Year & Preferences" subtitle="Configure your accounting period and regional settings." />

      <Text style={st.label}>Fiscal Year Starts In</Text>
      <TouchableOpacity style={[st.input, st.dropdown]} onPress={() => setShowFiscalPicker(!showFiscalPicker)}>
        <Text style={st.dropdownText}>{form.fiscalYearStart}</Text>
        <Ionicons name={showFiscalPicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
      {showFiscalPicker && (
        <View style={st.pickerList}>
          {FISCAL_MONTHS.map((m) => (
            <TouchableOpacity key={m} style={[st.pickerItem, form.fiscalYearStart === m && st.pickerItemSelected]}
              onPress={() => { updateForm('fiscalYearStart', m); setShowFiscalPicker(false); }}>
              <Text style={[st.pickerItemText, form.fiscalYearStart === m && st.pickerItemTextSelected]}>{m}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
      <Text style={st.hintText}>Most businesses use January or July.</Text>

      <Text style={[st.label, { marginTop: Spacing.xl }]}>Primary Currency</Text>
      <TouchableOpacity style={[st.input, st.dropdown]} onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}>
        <Text style={st.dropdownText}>
          {CURRENCIES.find((c) => c.code === form.currency)?.symbol} {form.currency} — {CURRENCIES.find((c) => c.code === form.currency)?.name}
        </Text>
        <Ionicons name={showCurrencyPicker ? 'chevron-up' : 'chevron-down'} size={16} color={Colors.textSecondary} />
      </TouchableOpacity>
      {showCurrencyPicker && (
        <View style={st.pickerList}>
          {CURRENCIES.map((c) => (
            <TouchableOpacity key={c.code} style={[st.pickerItem, form.currency === c.code && st.pickerItemSelected]}
              onPress={() => { updateForm('currency', c.code); setShowCurrencyPicker(false); }}>
              <Text style={[st.pickerItemText, form.currency === c.code && st.pickerItemTextSelected]}>
                {c.symbol}  {c.code} — {c.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={[st.label, { marginTop: Spacing.xl }]}>Date Format</Text>
      <View style={st.dateFormatRow}>
        {DATE_FORMATS.map((df) => {
          const sel = form.dateFormat === df.key;
          return (
            <TouchableOpacity key={df.key} style={[st.dateFormatOption, sel && st.dateFormatOptionSelected]} onPress={() => updateForm('dateFormat', df.key)}>
              <Text style={[st.dateFormatLabel, sel && { color: Colors.primary }]}>{df.label}</Text>
              <Text style={[st.dateFormatExample, sel && { color: Colors.primary + '80' }]}>{df.example}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderStep4 = () => (
    <ScrollView style={st.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SectionHeader icon="location-outline" title="Business Contact Information" subtitle="These details will appear on your invoices and reports." />

      <Text style={st.subSectionTitle}>Mailing Address</Text>
      <AuthInput label="Street Address" leftIcon="home-outline" placeholder="123 Business Ave, Suite 100" value={form.street} onChangeText={(v) => updateForm('street', v)} containerStyle={{ paddingHorizontal: 0 }} />
      <View style={st.row}>
        <View style={{ flex: 1 }}>
          <AuthInput label="City" placeholder="City" value={form.city} onChangeText={(v) => updateForm('city', v)} containerStyle={{ paddingHorizontal: 0 }} />
        </View>
        <View style={{ flex: 1 }}>
          <AuthInput label="State / Province" placeholder="State" value={form.state} onChangeText={(v) => updateForm('state', v)} containerStyle={{ paddingHorizontal: 0 }} />
        </View>
      </View>
      <AuthInput label="ZIP / Postal Code" placeholder="e.g. 75500" value={form.zipCode} onChangeText={(v) => updateForm('zipCode', v)} keyboardType="number-pad" containerStyle={{ paddingHorizontal: 0 }} />

      <Text style={st.subSectionTitle}>Contact Details</Text>
      <AuthInput label="Phone Number *" leftIcon="call-outline" placeholder="+92-XXX-XXXX-XXX" value={form.phone} onChangeText={(v) => updateForm('phone', v)} error={errors.phone} keyboardType="phone-pad" containerStyle={{ paddingHorizontal: 0 }} />
      <AuthInput label="Company Email *" leftIcon="mail-outline" placeholder="info@yourcompany.com" value={form.email} onChangeText={(v) => updateForm('email', v)} error={errors.email} keyboardType="email-address" autoCapitalize="none" containerStyle={{ paddingHorizontal: 0 }} />
      <AuthInput label="Website (Optional)" leftIcon="globe-outline" placeholder="www.yourcompany.com" value={form.website} onChangeText={(v) => updateForm('website', v)} keyboardType="url" autoCapitalize="none" containerStyle={{ paddingHorizontal: 0 }} />

      <Text style={st.subSectionTitle}>Tax Information</Text>
      <AuthInput label="Tax ID / EIN (Optional)" leftIcon="document-outline" placeholder="Federal Tax Identification Number" value={form.taxId} onChangeText={(v) => updateForm('taxId', v)} hint="You can add this later from Company Settings." containerStyle={{ paddingHorizontal: 0 }} />
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderStep5 = () => (
    <ScrollView style={st.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SectionHeader icon="layers-outline" title="Select Warehouse Agencies" subtitle="Choose agencies whose inventory you want to manage." />

      {preSeededAgencies.map((agency) => {
        const sel = selectedAgencyIds.includes(agency.agencyId);
        const badge = getTypeBadgeColor(agency.type);
        return (
          <TouchableOpacity key={agency.agencyId} style={[st.agencyCard, sel && st.agencyCardSelected]} activeOpacity={0.7} onPress={() => toggleAgency(agency.agencyId)}>
            <View style={st.agencyCardHeader}>
              <View style={{ flex: 1, marginRight: Spacing.md }}>
                <Text style={st.agencyName}>{agency.name}</Text>
                <View style={[st.typeBadge, { backgroundColor: badge.bg }]}>
                  <Text style={[st.typeBadgeText, { color: badge.text }]}>{agency.type}</Text>
                </View>
              </View>
              <View style={[st.checkbox, sel && st.checkboxChecked]}>
                {sel && <Ionicons name="checkmark" size={14} color={Colors.white} />}
              </View>
            </View>
            <Text style={st.agencyDescription}>{agency.description}</Text>
            <Text style={st.agencyItemCount}>{agency.inventoryItems.length} inventory items</Text>
          </TouchableOpacity>
        );
      })}

      {customAgencies.map((agency) => {
        const sel = selectedAgencyIds.includes(agency.agencyId);
        const badge = getTypeBadgeColor(agency.type);
        return (
          <TouchableOpacity key={agency.agencyId} style={[st.agencyCard, sel && st.agencyCardSelected]} activeOpacity={0.7} onPress={() => toggleAgency(agency.agencyId)}>
            <View style={st.agencyCardHeader}>
              <View style={{ flex: 1 }}>
                <Text style={st.agencyName}>{agency.name}</Text>
                <View style={[st.typeBadge, { backgroundColor: badge.bg }]}><Text style={[st.typeBadgeText, { color: badge.text }]}>{agency.type}</Text></View>
              </View>
              <View style={[st.checkbox, sel && st.checkboxChecked]}>{sel && <Ionicons name="checkmark" size={14} color={Colors.white} />}</View>
            </View>
            <Text style={st.agencyDescription}>{agency.description}</Text>
            <View style={st.customBadge}><Text style={st.customBadgeText}>Custom</Text></View>
          </TouchableOpacity>
        );
      })}

      {!showCustomAgencyForm ? (
        <TouchableOpacity style={st.addCustomBtn} onPress={() => setShowCustomAgencyForm(true)}>
          <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
          <Text style={st.addCustomBtnText}>Add Custom Agency</Text>
        </TouchableOpacity>
      ) : (
        <View style={st.customAgencyForm}>
          <Text style={st.customFormTitle}>New Custom Agency</Text>
          <AuthInput label="Agency Name *" placeholder="Agency name" value={customForm.name} onChangeText={(v) => setCustomForm((p) => ({ ...p, name: v }))} containerStyle={{ paddingHorizontal: 0 }} />
          <Text style={st.label}>Type</Text>
          <View style={st.typeRow}>
            {AGENCY_TYPES.map((t) => (
              <TouchableOpacity key={t} style={[st.typeOption, customForm.type === t && st.typeOptionSelected]} onPress={() => setCustomForm((p) => ({ ...p, type: t }))}>
                <Text style={[st.typeOptionText, customForm.type === t && st.typeOptionTextSelected]}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <AuthInput label="Description" placeholder="Brief description" value={customForm.description} onChangeText={(v) => setCustomForm((p) => ({ ...p, description: v }))} multiline numberOfLines={3} containerStyle={{ paddingHorizontal: 0 }} />
          <View style={st.customFormActions}>
            <TouchableOpacity style={st.cancelBtn} onPress={() => setShowCustomAgencyForm(false)}><Text style={st.cancelBtnText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={st.saveBtn} onPress={addCustomAgency}><Text style={st.saveBtnText}>Add Agency</Text></TouchableOpacity>
          </View>
        </View>
      )}
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderStep6 = () => (
    <ScrollView style={st.stepContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      <SectionHeader icon="person-add-outline" title="Create Administrator Account" subtitle="Set up the primary admin. You can add more users later." />

      <View style={st.adminInfoBox}>
        <Ionicons name="information-circle" size={18} color={Colors.info} style={{ marginRight: Spacing.sm, marginTop: 2 }} />
        <Text style={st.adminInfoText}>This account will have full access to all company features including accounting, inventory, reports, and user management.</Text>
      </View>

      <AuthInput label="Full Name *" leftIcon="person-outline" placeholder="Enter your full name" value={form.adminName} onChangeText={(v) => updateForm('adminName', v)} error={errors.adminName} containerStyle={{ paddingHorizontal: 0 }} />
      <AuthInput label="Email Address *" leftIcon="mail-outline" placeholder="admin@yourcompany.com" value={form.adminEmail} onChangeText={(v) => updateForm('adminEmail', v)} error={errors.adminEmail} keyboardType="email-address" autoCapitalize="none" containerStyle={{ paddingHorizontal: 0 }} />
      <AuthInput label="Phone Number (Optional)" leftIcon="call-outline" placeholder="+92-XXX-XXXX-XXX" value={form.adminPhone} onChangeText={(v) => updateForm('adminPhone', v)} keyboardType="phone-pad" containerStyle={{ paddingHorizontal: 0 }} />
      <AuthInput label="Password *" leftIcon="lock-closed-outline" placeholder="Create a strong password" value={form.adminPassword} onChangeText={(v) => updateForm('adminPassword', v)} error={errors.adminPassword} isPassword containerStyle={{ paddingHorizontal: 0 }} />
      <AuthInput label="Confirm Password *" leftIcon="lock-closed-outline" placeholder="Re-enter your password" value={form.adminConfirmPassword} onChangeText={(v) => updateForm('adminConfirmPassword', v)} error={errors.adminConfirmPassword} isPassword containerStyle={{ paddingHorizontal: 0 }} />

      <View style={st.passwordRules}>
        <Text style={st.passwordRulesTitle}>Password Requirements</Text>
        {[
          { rule: 'At least 8 characters', met: form.adminPassword.length >= 8 },
          { rule: 'One uppercase letter (A-Z)', met: /[A-Z]/.test(form.adminPassword) },
          { rule: 'One lowercase letter (a-z)', met: /[a-z]/.test(form.adminPassword) },
          { rule: 'One number (0-9)', met: /[0-9]/.test(form.adminPassword) },
          { rule: 'One special character', met: /[!@#$%^&*(),.?":{}|<>]/.test(form.adminPassword) },
        ].map((r) => (
          <View key={r.rule} style={st.ruleRow}>
            <Ionicons name={r.met ? 'checkmark-circle' : 'ellipse-outline'} size={14} color={r.met ? Colors.success : Colors.textTertiary} />
            <Text style={[st.ruleText, r.met && st.ruleTextMet]}>{r.rule}</Text>
          </View>
        ))}
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderStep7 = () => {
    const selectedAgencies = getAllSelectedAgencies();
    const legalLabel = LEGAL_STRUCTURES.find((l) => l.key === form.legalStructure)?.label || form.legalStructure;
    const industryLabel = INDUSTRIES.find((i) => i.key === form.industry)?.label || form.industry;
    const coaLabel = COA_TEMPLATES.find((c) => c.key === form.coaTemplate)?.label || form.coaTemplate;
    const currencyLabel = CURRENCIES.find((c) => c.code === form.currency);

    const EditBtn = ({ toStep }: { toStep: number }) => (
      <TouchableOpacity onPress={() => setStep(toStep)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={st.editLink}>Edit</Text>
      </TouchableOpacity>
    );

    return (
      <ScrollView style={st.stepContent} showsVerticalScrollIndicator={false}>
        <SectionHeader icon="checkmark-done-outline" title="Review & Register" subtitle="Please review all information before creating your company." />

        <View style={st.reviewSection}>
          <View style={st.reviewSectionHeader}><Text style={st.reviewSectionTitle}>Company Information</Text><EditBtn toStep={1} /></View>
          <ReviewRow label="Company Name" value={form.companyName} />
          <ReviewRow label="Legal Structure" value={legalLabel} />
        </View>

        <View style={st.reviewSection}>
          <View style={st.reviewSectionHeader}><Text style={st.reviewSectionTitle}>Industry & Accounts</Text><EditBtn toStep={2} /></View>
          <ReviewRow label="Industry" value={industryLabel} />
          <ReviewRow label="COA Template" value={coaLabel} />
        </View>

        <View style={st.reviewSection}>
          <View style={st.reviewSectionHeader}><Text style={st.reviewSectionTitle}>Fiscal Year & Preferences</Text><EditBtn toStep={3} /></View>
          <ReviewRow label="Fiscal Year Start" value={form.fiscalYearStart} />
          <ReviewRow label="Currency" value={`${currencyLabel?.symbol} ${form.currency}`} />
          <ReviewRow label="Date Format" value={form.dateFormat} />
        </View>

        <View style={st.reviewSection}>
          <View style={st.reviewSectionHeader}><Text style={st.reviewSectionTitle}>Business Contact</Text><EditBtn toStep={4} /></View>
          {form.street ? <ReviewRow label="Address" value={[form.street, form.city, form.state, form.zipCode].filter(Boolean).join(', ')} /> : null}
          <ReviewRow label="Phone" value={form.phone} />
          <ReviewRow label="Email" value={form.email} />
        </View>

        <View style={st.reviewSection}>
          <View style={st.reviewSectionHeader}><Text style={st.reviewSectionTitle}>Warehouse Agencies ({selectedAgencies.length})</Text><EditBtn toStep={5} /></View>
          {selectedAgencies.map((ag) => {
            const badge = getTypeBadgeColor(ag.type);
            return (
              <View key={ag.agencyId} style={st.reviewAgencyRow}>
                <Text style={st.reviewAgencyName}>{ag.name}</Text>
                <View style={[st.typeBadge, { backgroundColor: badge.bg }]}><Text style={[st.typeBadgeText, { color: badge.text }]}>{ag.type}</Text></View>
              </View>
            );
          })}
        </View>

        <View style={st.reviewSection}>
          <View style={st.reviewSectionHeader}><Text style={st.reviewSectionTitle}>Administrator Account</Text><EditBtn toStep={6} /></View>
          <ReviewRow label="Name" value={form.adminName} />
          <ReviewRow label="Email" value={form.adminEmail} />
          <ReviewRow label="Password" value="••••••••" />
        </View>

        <View style={st.termsBox}>
          <Text style={st.termsText}>
            By registering, you agree to FinMatrix's <Text style={st.termsLink}>Terms of Service</Text> and <Text style={st.termsLink}>Privacy Policy</Text>.
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    );
  };

  // ── MAIN RENDER ─────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={st.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[st.inner, { paddingTop: SAFE_TOP_PADDING }]}>
        {/* Top Bar */}
        <View style={st.topBar}>
          <TouchableOpacity onPress={handleBack} style={st.backBtn}>
            <Ionicons name="chevron-back" size={20} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={st.topBarTitle}>Register Company</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Step Indicator */}
        <StepIndicator totalSteps={TOTAL_STEPS} currentStep={step} labels={STEP_LABELS} />

        {/* Step Content */}
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
        {step === 6 && renderStep6()}
        {step === 7 && renderStep7()}

        {/* Bottom Bar */}
        <View style={[st.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          {step < TOTAL_STEPS ? (
            <View style={st.bottomRow}>
              {step > 1 && (
                <TouchableOpacity style={st.secondaryBtn} onPress={handleBack}>
                  <Ionicons name="chevron-back" size={16} color={Colors.textSecondary} />
                  <Text style={st.secondaryBtnText}>Back</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[st.primaryBtn, step === 1 && { flex: 1 }]} onPress={handleNext} activeOpacity={0.85}>
                <Text style={st.primaryBtnText}>Continue</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.white} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={[st.registerBtn, isSubmitting && st.btnDisabled]} onPress={handleRegister} activeOpacity={0.85} disabled={isSubmitting}>
              {isSubmitting ? (
                <View style={st.loadingRow}><ActivityIndicator size="small" color={Colors.white} /><Text style={st.primaryBtnText}>Creating Your Company...</Text></View>
              ) : (
                <Text style={st.primaryBtnText}>Register Company</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// ── STYLES ────────────────────────────────────────────────
const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm },
  backBtn: { width: 40, height: 40, borderRadius: BorderRadius.sm, backgroundColor: Colors.white, justifyContent: 'center', alignItems: 'center', ...Shadows.sm },
  topBarTitle: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary },

  sectionHeader: { alignItems: 'center', marginBottom: Spacing.lg },
  sectionIconCircle: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary + '08', justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.md },
  stepTitle: { fontSize: Typography.fontSize.h3, fontFamily: Typography.fontFamily.bold, color: Colors.textPrimary, marginBottom: Spacing.xs, textAlign: 'center' },
  stepDescription: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.base },

  stepContent: { flex: 1, paddingHorizontal: Spacing.base },
  label: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, marginBottom: Spacing.xs, marginTop: Spacing.md },
  subSectionTitle: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  errorText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.danger, marginTop: Spacing.xs },
  hintText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary, marginTop: Spacing.xs, lineHeight: 18 },
  row: { flexDirection: 'row', gap: Spacing.md },

  input: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.regular, color: Colors.textPrimary },
  dropdown: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dropdownText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.regular, color: Colors.textPrimary, flex: 1 },
  pickerList: { backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, marginTop: Spacing.xs, maxHeight: 200, ...Shadows.sm },
  pickerItem: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.border },
  pickerItemSelected: { backgroundColor: Colors.primary + '10' },
  pickerItemText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.regular, color: Colors.textPrimary },
  pickerItemTextSelected: { fontFamily: Typography.fontFamily.semiBold, color: Colors.primary },

  // Legal Structure
  legalCard: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.sm, padding: Spacing.base, flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.sm },
  legalCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '04' },
  legalIconCircle: { width: 36, height: 36, borderRadius: 10, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center', marginRight: Spacing.md },
  legalCardLabel: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary },
  legalCardDesc: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary, marginTop: 2, lineHeight: 16 },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  radioOuterSelected: { borderColor: Colors.primary },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.primary },

  // Industry
  industryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  industryChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.full, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  industryChipSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  industryChipLabel: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  industryChipLabelSelected: { color: Colors.primary, fontFamily: Typography.fontFamily.semiBold },

  // Templates
  templateCard: { backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.sm, padding: Spacing.base, marginBottom: Spacing.sm },
  templateCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '04' },
  templateCardHeader: { flexDirection: 'row', alignItems: 'center' },
  templateLabel: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary, marginBottom: 2 },
  templateDesc: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, lineHeight: 16 },
  accountsBadge: { alignItems: 'center', backgroundColor: Colors.background, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs },
  accountsBadgeText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.bold, color: Colors.primary },
  accountsBadgeLabel: { fontSize: 9, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary },

  // Date Format
  dateFormatRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  dateFormatOption: { flex: 1, minWidth: '45%' as any, backgroundColor: Colors.white, borderWidth: 1.5, borderColor: Colors.border, borderRadius: BorderRadius.sm, paddingHorizontal: Spacing.md, paddingVertical: Spacing.md, alignItems: 'center' },
  dateFormatOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '06' },
  dateFormatLabel: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary, marginBottom: 2 },
  dateFormatExample: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary },

  // Admin Info
  adminInfoBox: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: Colors.infoLight, borderRadius: BorderRadius.sm, padding: Spacing.md, marginBottom: Spacing.lg, borderLeftWidth: 3, borderLeftColor: Colors.info },
  adminInfoText: { flex: 1, fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.info, lineHeight: 20 },

  // Password Rules
  passwordRules: { backgroundColor: Colors.white, borderRadius: BorderRadius.sm, padding: Spacing.base, marginTop: Spacing.lg, ...Shadows.sm },
  passwordRulesTitle: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  ruleRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 3, gap: Spacing.sm },
  ruleText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary },
  ruleTextMet: { color: Colors.success },

  // Agency Cards
  agencyCard: { backgroundColor: Colors.white, borderWidth: 2, borderColor: Colors.border, borderRadius: BorderRadius.sm, padding: Spacing.base, marginBottom: Spacing.md },
  agencyCardSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '03' },
  agencyCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.sm },
  agencyName: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  agencyDescription: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.sm },
  agencyItemCount: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.medium, color: Colors.primary },
  typeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.xs, alignSelf: 'flex-start' },
  typeBadgeText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.medium, textTransform: 'capitalize' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  customBadge: { backgroundColor: Colors.warningLight, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.xs, alignSelf: 'flex-start', marginTop: Spacing.xs },
  customBadgeText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.medium, color: Colors.warning },
  addCustomBtn: { flexDirection: 'row', borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed', borderRadius: BorderRadius.sm, padding: Spacing.base, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, marginTop: Spacing.sm },
  addCustomBtnText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.primary },
  customAgencyForm: { backgroundColor: Colors.white, borderRadius: BorderRadius.sm, padding: Spacing.base, marginTop: Spacing.md, ...Shadows.sm },
  customFormTitle: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary, marginBottom: Spacing.sm },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs, marginBottom: Spacing.md },
  typeOption: { flex: 1, paddingVertical: Spacing.sm, borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.sm, alignItems: 'center' },
  typeOptionSelected: { borderColor: Colors.primary, backgroundColor: Colors.primary + '10' },
  typeOptionText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary, textTransform: 'capitalize' },
  typeOptionTextSelected: { color: Colors.primary },
  customFormActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.md, marginTop: Spacing.base },
  cancelBtn: { paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base },
  cancelBtnText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  saveBtn: { backgroundColor: Colors.primary, paddingVertical: Spacing.sm, paddingHorizontal: Spacing.base, borderRadius: BorderRadius.sm },
  saveBtnText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold, color: Colors.white },

  // Review
  reviewSection: { backgroundColor: Colors.white, borderRadius: BorderRadius.sm, padding: Spacing.base, marginBottom: Spacing.md, ...Shadows.sm },
  reviewSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  reviewSectionTitle: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary },
  editLink: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold, color: Colors.secondary },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border + '50' },
  reviewLabel: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary },
  reviewValue: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, flex: 1, textAlign: 'right', marginLeft: Spacing.base },
  reviewAgencyRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border + '50' },
  reviewAgencyName: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textPrimary, flex: 1 },
  termsBox: { backgroundColor: Colors.background, borderRadius: BorderRadius.sm, padding: Spacing.base, marginTop: Spacing.sm },
  termsText: { fontSize: Typography.fontSize.caption, fontFamily: Typography.fontFamily.regular, color: Colors.textSecondary, textAlign: 'center', lineHeight: 18 },
  termsLink: { color: Colors.secondary, fontFamily: Typography.fontFamily.semiBold },

  // Bottom Bar
  bottomBar: { paddingHorizontal: Spacing.base, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border, backgroundColor: Colors.white },
  bottomRow: { flexDirection: 'row', gap: Spacing.md },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: Spacing.lg, borderRadius: BorderRadius.sm, borderWidth: 1.5, borderColor: Colors.border, gap: 4 },
  secondaryBtnText: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, color: Colors.textSecondary },
  primaryBtn: { flex: 1, flexDirection: 'row', backgroundColor: Colors.primary, borderRadius: BorderRadius.sm, paddingVertical: 14, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, ...Shadows.sm },
  primaryBtnText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold, color: Colors.white },
  registerBtn: { backgroundColor: Colors.success, borderRadius: BorderRadius.sm, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', ...Shadows.sm },
  btnDisabled: { opacity: 0.6 },
  loadingRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});

export default CompanyRegistrationScreen;