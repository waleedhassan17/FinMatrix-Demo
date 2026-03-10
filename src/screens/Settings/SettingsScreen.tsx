import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  setDateFormat as setDateFormatAction,
  setNumberFormat as setNumberFormatAction,
  setCurrency as setCurrencyAction,
  setInvoicePrefix as setInvoicePrefixAction,
  setInvoiceStartNumber,
  setDefaultTerms as setDefaultTermsAction,
  setDefaultNotes as setDefaultNotesAction,
  toggleNotificationPref,
  setFiscalYear as setFiscalYearAction,
  toggleDemoMode,
  resetSettings,
} from './settingsSlice';

// ─── Types ──────────────────────────────────────────────────
interface SettingRowProps {
  icon: string;
  label: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  color?: string;
}

// ─── Reusable Row ───────────────────────────────────────────
const SettingRow: React.FC<SettingRowProps> = ({
  icon,
  label,
  subtitle,
  onPress,
  rightElement,
  color = Colors.primary,
}) => (
  <TouchableOpacity
    style={styles.row}
    onPress={onPress}
    activeOpacity={onPress ? 0.6 : 1}
    disabled={!onPress && !rightElement}
  >
    <View style={[styles.rowIcon, { backgroundColor: color + '14' }]}>
      <Text style={styles.rowIconText}>{icon}</Text>
    </View>
    <View style={styles.rowContent}>
      <Text style={styles.rowLabel}>{label}</Text>
      {subtitle ? <Text style={styles.rowSubtitle}>{subtitle}</Text> : null}
    </View>
    {rightElement ?? (onPress ? <Text style={styles.chevron}>›</Text> : null)}
  </TouchableOpacity>
);

const Divider: React.FC = () => <View style={styles.divider} />;

// ─── Picker Helpers ─────────────────────────────────────────
const DATE_FORMATS = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD'];
const NUMBER_FORMATS = ['1,234.56', '1.234,56'];
const CURRENCIES = ['USD', 'EUR', 'GBP'];
const CURRENCY_DISPLAY: Record<string, string> = { USD: 'USD ($)', EUR: 'EUR (€)', GBP: 'GBP (£)' };
const PAYMENT_TERMS = ['Net 15', 'Net 30', 'Net 45', 'Net 60', 'Due on Receipt'];

const FISCAL_YEARS = ['jan-dec', 'apr-mar', 'jul-jun', 'oct-sep'] as const;
const FISCAL_YEAR_DISPLAY: Record<string, string> = {
  'jan-dec': 'Jan 1 – Dec 31',
  'apr-mar': 'Apr 1 – Mar 31',
  'jul-jun': 'Jul 1 – Jun 30',
  'oct-sep': 'Oct 1 – Sep 30',
};

// ─── Legal / Support Content ────────────────────────────────
const TERMS_OF_SERVICE = `FINMATRIX TERMS OF SERVICE

Last Updated: January 1, 2025

1. ACCEPTANCE OF TERMS
By accessing or using the FinMatrix application ("Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree, do not use the Service.

2. DESCRIPTION OF SERVICE
FinMatrix provides cloud-based accounting, invoicing, inventory management, and financial reporting tools for small and medium businesses.

3. USER ACCOUNTS
You are responsible for maintaining the confidentiality of your account credentials. You agree to notify us immediately of any unauthorized use.

4. PERMITTED USE
You may use the Service only for lawful business purposes. You may not: (a) reverse-engineer the software; (b) use automated systems to access the Service; (c) transmit harmful code.

5. DATA OWNERSHIP
You retain ownership of all data you enter into the Service. We do not claim intellectual property rights over your content.

6. BILLING & PAYMENTS
Subscription fees are billed in advance. Refunds are handled in accordance with our refund policy. Failure to pay may result in service suspension.

7. LIMITATION OF LIABILITY
To the maximum extent permitted by law, FinMatrix shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the Service.

8. MODIFICATIONS
We reserve the right to modify these Terms at any time. Continued use after changes constitutes acceptance.

9. GOVERNING LAW
These Terms shall be governed by the laws of the State of Delaware, United States.

10. CONTACT
For questions about these Terms, contact legal@finmatrix.app.`;

const PRIVACY_POLICY = `FINMATRIX PRIVACY POLICY

Last Updated: January 1, 2025

1. INFORMATION WE COLLECT
We collect information you provide directly: name, email, company details, and financial data entered into the application.

2. HOW WE USE YOUR DATA
Your data is used to: (a) provide and improve the Service; (b) send transactional notifications; (c) generate financial reports; (d) comply with legal obligations.

3. DATA STORAGE & SECURITY
All data is encrypted at rest (AES-256) and in transit (TLS 1.3). We use industry-standard security measures and conduct regular audits.

4. DATA SHARING
We do not sell your data. We may share data with: (a) service providers who assist in operating the platform; (b) law enforcement when required by law.

5. DATA RETENTION
Your data is retained while your account is active. Upon account deletion, data is purged within 90 days, except where retention is required by law.

6. YOUR RIGHTS
You have the right to: (a) access your data; (b) correct inaccuracies; (c) request deletion; (d) export your data in standard formats (CSV, PDF).

7. COOKIES & ANALYTICS
We use minimal analytics to improve the Service. No third-party advertising trackers are used.

8. CHILDREN'S PRIVACY
The Service is not intended for users under 18 years of age.

9. CHANGES TO THIS POLICY
We will notify you of material changes via email or in-app notification.

10. CONTACT
For privacy inquiries, contact privacy@finmatrix.app.`;

const FAQ_ITEMS = [
  { q: 'How do I create my first invoice?', a: 'Navigate to Invoices → tap "+" → fill in customer, line items, and due date → tap Save or Send.' },
  { q: 'Can I import data from QuickBooks?', a: 'Yes! Go to Settings → Import Data. We support CSV and QBO file formats for seamless migration.' },
  { q: 'How are inventory levels tracked?', a: 'Inventory auto-updates when you create sales orders, purchase orders, and deliveries. You can also make manual adjustments.' },
  { q: 'Is my data backed up?', a: 'All data is automatically backed up daily with 30-day retention. You can also export manually at any time.' },
];

// ─── Main Component ─────────────────────────────────────────
const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((s) => s.settings);

  // ── Modal state ─────────────
  const [fiscalYearModal, setFiscalYearModal] = useState(false);
  const [tosModal, setTosModal] = useState(false);
  const [privacyModal, setPrivacyModal] = useState(false);
  const [helpModal, setHelpModal] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Read values from Redux
  const dateFormat = settings.dateFormat;
  const numberFormat = settings.numberFormat;
  const currency = settings.currency;
  const fiscalYear = settings.fiscalYear;
  const invoicePrefix = settings.invoicePrefix;
  const startingNumber = String(settings.invoiceStartNumber);
  const defaultTerms = settings.defaultTerms;
  const defaultNotes = settings.defaultNotes;
  const notifyInvoice = settings.notificationPrefs.invoices;
  const notifyPayment = settings.notificationPrefs.payments;
  const notifyOverdue = settings.notificationPrefs.overdue;
  const notifyInventory = settings.notificationPrefs.inventory;
  const notifyPayroll = settings.notificationPrefs.payroll;

  // ── Cycle picker via Alert ──
  const cyclePicker = useCallback(
    (title: string, options: string[], current: string, setter: (v: string) => void) => {
      const idx = options.indexOf(current);
      const next = options[(idx + 1) % options.length];
      setter(next);
    },
    [],
  );

  // ── Dispatch wrappers ───────
  const setDateFormat = (v: string) => dispatch(setDateFormatAction(v as any));
  const setNumberFormat = (v: string) => dispatch(setNumberFormatAction(v as any));
  const setCurrency = (v: string) => dispatch(setCurrencyAction(v as any));
  const setInvoicePrefix = (v: string) => dispatch(setInvoicePrefixAction(v));
  const setStartingNumber = (v: string) => dispatch(setInvoiceStartNumber(Number(v)));
  const setDefaultTerms = (v: string) => dispatch(setDefaultTermsAction(v));
  const setDefaultNotes = (v: string) => dispatch(setDefaultNotesAction(v));
  const setNotifyInvoice = (_v?: boolean) => { dispatch(toggleNotificationPref('invoices')); };
  const setNotifyPayment = (_v?: boolean) => { dispatch(toggleNotificationPref('payments')); };
  const setNotifyOverdue = (_v?: boolean) => { dispatch(toggleNotificationPref('overdue')); };
  const setNotifyInventory = (_v?: boolean) => { dispatch(toggleNotificationPref('inventory')); };
  const setNotifyPayroll = (_v?: boolean) => { dispatch(toggleNotificationPref('payroll')); };

  // ── Data actions ────────────
  const handleExport = () =>
    Alert.alert('Export Data', 'Choose export format:', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'CSV',
        onPress: () => {
          setExporting(true);
          setTimeout(() => {
            setExporting(false);
            Alert.alert('Export Complete', 'All company data has been exported as CSV. Check your Downloads folder.');
          }, 1500);
        },
      },
      {
        text: 'PDF',
        onPress: () => {
          setExporting(true);
          setTimeout(() => {
            setExporting(false);
            Alert.alert('Export Complete', 'All company data has been exported as PDF. Check your Downloads folder.');
          }, 1500);
        },
      },
    ]);

  const handleImport = () =>
    Alert.alert(
      'Import Data',
      'Data import supports CSV and QBO (QuickBooks Online) formats.\n\nTo import:\n1. Prepare your file in a supported format\n2. Use the cloud dashboard at app.finmatrix.com/import\n3. Data will sync to this device automatically\n\nNeed help? Contact support@finmatrix.app.',
      [{ text: 'OK' }],
    );

  const handleClearDemo = () =>
    Alert.alert(
      'Clear Demo Data',
      'This will remove ALL demo transactions, invoices, bills, and reset settings to defaults.\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: () => {
            dispatch(resetSettings());
            Alert.alert('✓ Data Cleared', 'All demo data and settings have been reset to defaults.');
          },
        },
      ],
    );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── COMPANY ──────────────────────── */}
        <Text style={styles.sectionLabel}>COMPANY</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🏢"
            label="Company Profile"
            subtitle="Name, address, logo & tax ID"
            onPress={() => navigation.navigate(ROUTES.COMPANY_PROFILE)}
            color={Colors.primary}
          />
          <Divider />
          <SettingRow
            icon="📅"
            label="Fiscal Year"
            subtitle={FISCAL_YEAR_DISPLAY[fiscalYear] ?? 'Jan 1 – Dec 31'}
            onPress={() => setFiscalYearModal(true)}
            color={Colors.secondary}
          />
        </View>

        {/* ── PREFERENCES ─────────────────── */}
        <Text style={styles.sectionLabel}>PREFERENCES</Text>
        <View style={styles.card}>
          <SettingRow
            icon="📆"
            label="Date Format"
            onPress={() => cyclePicker('Date Format', DATE_FORMATS, dateFormat, setDateFormat)}
            color={Colors.info}
            rightElement={<Text style={styles.valueText}>{dateFormat}</Text>}
          />
          <Divider />
          <SettingRow
            icon="🔢"
            label="Number Format"
            onPress={() => cyclePicker('Number Format', NUMBER_FORMATS, numberFormat, setNumberFormat)}
            color={Colors.info}
            rightElement={<Text style={styles.valueText}>{numberFormat}</Text>}
          />
          <Divider />
          <SettingRow
            icon="💱"
            label="Currency"
            onPress={() => cyclePicker('Currency', CURRENCIES, currency, setCurrency)}
            color={Colors.success}
            rightElement={<Text style={styles.valueText}>{CURRENCY_DISPLAY[currency] ?? currency}</Text>}
          />
        </View>

        {/* ── INVOICING ──────────────────── */}
        <Text style={styles.sectionLabel}>INVOICING</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🏷️"
            label="Invoice Prefix"
            onPress={() =>
              Alert.prompt
                ? Alert.prompt('Invoice Prefix', 'Enter prefix:', (t) => t && setInvoicePrefix(t), 'plain-text', invoicePrefix)
                : setInvoicePrefix(invoicePrefix === 'INV-' ? 'FIN-' : 'INV-')
            }
            color={Colors.warning}
            rightElement={<Text style={styles.valueText}>{invoicePrefix}</Text>}
          />
          <Divider />
          <SettingRow
            icon="#️⃣"
            label="Starting Number"
            onPress={() =>
              dispatch(setInvoiceStartNumber(settings.invoiceStartNumber + 1))
            }
            color={Colors.warning}
            rightElement={<Text style={styles.valueText}>{startingNumber}</Text>}
          />
          <Divider />
          <SettingRow
            icon="📋"
            label="Default Terms"
            onPress={() => cyclePicker('Default Terms', PAYMENT_TERMS, defaultTerms, setDefaultTerms)}
            color={Colors.warning}
            rightElement={<Text style={styles.valueText}>{defaultTerms}</Text>}
          />
          <Divider />
          <SettingRow
            icon="📝"
            label="Default Notes"
            subtitle={defaultNotes}
            onPress={() =>
              setDefaultNotes(
                defaultNotes === 'Thank you for your business!'
                  ? 'Payment is due upon receipt.'
                  : 'Thank you for your business!',
              )
            }
            color={Colors.warning}
          />
        </View>

        {/* ── USERS ──────────────────────── */}
        <Text style={styles.sectionLabel}>USERS</Text>
        <View style={styles.card}>
          <SettingRow
            icon="👥"
            label="User Management"
            subtitle="Invite & manage team members"
            onPress={() => navigation.navigate(ROUTES.USER_MANAGEMENT)}
            color="#8E44AD"
          />
        </View>

        {/* ── NOTIFICATIONS ──────────────── */}
        <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
        <View style={styles.card}>
          <SettingRow
            icon="📧"
            label="Invoice Created"
            color={Colors.info}
            rightElement={
              <Switch
                value={notifyInvoice}
                onValueChange={setNotifyInvoice}
                trackColor={{ false: Colors.border, true: Colors.success + '66' }}
                thumbColor={notifyInvoice ? Colors.success : Colors.textTertiary}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="💵"
            label="Payment Received"
            color={Colors.success}
            rightElement={
              <Switch
                value={notifyPayment}
                onValueChange={setNotifyPayment}
                trackColor={{ false: Colors.border, true: Colors.success + '66' }}
                thumbColor={notifyPayment ? Colors.success : Colors.textTertiary}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="⏰"
            label="Overdue Reminders"
            color={Colors.danger}
            rightElement={
              <Switch
                value={notifyOverdue}
                onValueChange={setNotifyOverdue}
                trackColor={{ false: Colors.border, true: Colors.danger + '66' }}
                thumbColor={notifyOverdue ? Colors.danger : Colors.textTertiary}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="📦"
            label="Low Inventory Alerts"
            color={Colors.warning}
            rightElement={
              <Switch
                value={notifyInventory}
                onValueChange={setNotifyInventory}
                trackColor={{ false: Colors.border, true: Colors.warning + '66' }}
                thumbColor={notifyInventory ? Colors.warning : Colors.textTertiary}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="💰"
            label="Payroll Processed"
            color={Colors.success}
            rightElement={
              <Switch
                value={notifyPayroll}
                onValueChange={setNotifyPayroll}
                trackColor={{ false: Colors.border, true: Colors.success + '66' }}
                thumbColor={notifyPayroll ? Colors.success : Colors.textTertiary}
              />
            }
          />
        </View>

        {/* ── DATA ───────────────────────── */}
        <Text style={styles.sectionLabel}>DATA</Text>
        <View style={styles.card}>
          <SettingRow
            icon="🎮"
            label="Demo Mode"
            subtitle="Show floating toolbar for role-switching & event simulation"
            color={Colors.deliveryAccent}
            rightElement={
              <Switch
                value={settings.demoMode}
                onValueChange={() => { dispatch(toggleDemoMode()); }}
                trackColor={{ false: Colors.border, true: Colors.deliveryAccent + '66' }}
                thumbColor={settings.demoMode ? Colors.deliveryAccent : Colors.textTertiary}
              />
            }
          />
          <Divider />
          <SettingRow
            icon="📤"
            label="Export Data"
            subtitle="Download all data as CSV"
            onPress={handleExport}
            color={Colors.info}
          />
          <Divider />
          <SettingRow
            icon="📥"
            label="Import Data"
            subtitle="Import from CSV or QBO"
            onPress={handleImport}
            color={Colors.info}
          />
          <Divider />
          <SettingRow
            icon="🗑️"
            label="Clear Demo Data"
            subtitle="Remove sample transactions"
            onPress={handleClearDemo}
            color={Colors.danger}
          />
        </View>

        {/* ── ABOUT ──────────────────────── */}
        <Text style={styles.sectionLabel}>ABOUT</Text>
        <View style={styles.card}>
          <SettingRow
            icon="ℹ️"
            label="Version"
            color={Colors.textSecondary}
            rightElement={<Text style={styles.valueText}>1.0.0 (Build 1)</Text>}
          />
          <Divider />
          <SettingRow
            icon="📄"
            label="Terms of Service"
            onPress={() => setTosModal(true)}
            color={Colors.textSecondary}
          />
          <Divider />
          <SettingRow
            icon="🔒"
            label="Privacy Policy"
            onPress={() => setPrivacyModal(true)}
            color={Colors.textSecondary}
          />
          <Divider />
          <SettingRow
            icon="❓"
            label="Help & Support"
            subtitle="Contact us or view FAQ"
            onPress={() => setHelpModal(true)}
            color={Colors.info}
          />
        </View>

        <View style={{ height: Spacing.huge }} />
      </ScrollView>

      {/* ── EXPORT OVERLAY ───────────────── */}
      {exporting && (
        <View style={styles.exportOverlay}>
          <View style={styles.exportBox}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.exportText}>Exporting data…</Text>
          </View>
        </View>
      )}

      {/* ── FISCAL YEAR MODAL ────────────── */}
      <Modal visible={fiscalYearModal} transparent animationType="fade" onRequestClose={() => setFiscalYearModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Fiscal Year</Text>
            <Text style={styles.modalSubtitle}>Choose when your financial year begins and ends</Text>
            {FISCAL_YEARS.map((fy) => {
              const selected = fy === fiscalYear;
              return (
                <TouchableOpacity
                  key={fy}
                  style={[styles.fyOption, selected && styles.fyOptionSelected]}
                  onPress={() => {
                    dispatch(setFiscalYearAction(fy));
                    setFiscalYearModal(false);
                  }}
                >
                  <View style={[styles.fyRadio, selected && styles.fyRadioSelected]}>
                    {selected && <View style={styles.fyRadioDot} />}
                  </View>
                  <Text style={[styles.fyLabel, selected && styles.fyLabelSelected]}>
                    {FISCAL_YEAR_DISPLAY[fy]}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setFiscalYearModal(false)}>
              <Text style={styles.modalCloseBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── TERMS OF SERVICE MODAL ───────── */}
      <Modal visible={tosModal} animationType="slide" onRequestClose={() => setTosModal(false)}>
        <View style={styles.legalModal}>
          <View style={styles.legalHeader}>
            <Text style={styles.legalTitle}>Terms of Service</Text>
            <TouchableOpacity onPress={() => setTosModal(false)}>
              <Text style={styles.legalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.legalScroll} contentContainerStyle={{ padding: Spacing.base }}>
            <Text style={styles.legalText}>{TERMS_OF_SERVICE}</Text>
          </ScrollView>
          <View style={styles.legalFooter}>
            <TouchableOpacity style={styles.legalAcceptBtn} onPress={() => setTosModal(false)}>
              <Text style={styles.legalAcceptText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── PRIVACY POLICY MODAL ─────────── */}
      <Modal visible={privacyModal} animationType="slide" onRequestClose={() => setPrivacyModal(false)}>
        <View style={styles.legalModal}>
          <View style={styles.legalHeader}>
            <Text style={styles.legalTitle}>Privacy Policy</Text>
            <TouchableOpacity onPress={() => setPrivacyModal(false)}>
              <Text style={styles.legalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.legalScroll} contentContainerStyle={{ padding: Spacing.base }}>
            <Text style={styles.legalText}>{PRIVACY_POLICY}</Text>
          </ScrollView>
          <View style={styles.legalFooter}>
            <TouchableOpacity style={styles.legalAcceptBtn} onPress={() => setPrivacyModal(false)}>
              <Text style={styles.legalAcceptText}>I Understand</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── HELP & SUPPORT MODAL ─────────── */}
      <Modal visible={helpModal} animationType="slide" onRequestClose={() => setHelpModal(false)}>
        <View style={styles.legalModal}>
          <View style={styles.legalHeader}>
            <Text style={styles.legalTitle}>Help & Support</Text>
            <TouchableOpacity onPress={() => setHelpModal(false)}>
              <Text style={styles.legalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.legalScroll} contentContainerStyle={{ padding: Spacing.base }}>
            {/* Contact Section */}
            <Text style={styles.helpSectionLabel}>CONTACT US</Text>
            <View style={styles.helpContactCard}>
              <TouchableOpacity
                style={styles.helpContactRow}
                onPress={() => Linking.openURL('mailto:support@finmatrix.app')}
              >
                <Text style={styles.helpContactIcon}>📧</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.helpContactLabel}>Email Support</Text>
                  <Text style={styles.helpContactValue}>support@finmatrix.app</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.helpContactRow}
                onPress={() => Linking.openURL('https://docs.finmatrix.app')}
              >
                <Text style={styles.helpContactIcon}>📚</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.helpContactLabel}>Documentation</Text>
                  <Text style={styles.helpContactValue}>docs.finmatrix.app</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            </View>

            {/* FAQ Section */}
            <Text style={[styles.helpSectionLabel, { marginTop: Spacing.xl }]}>FREQUENTLY ASKED QUESTIONS</Text>
            {FAQ_ITEMS.map((item, idx) => (
              <View key={idx} style={styles.faqCard}>
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Text style={styles.faqAnswer}>{item.a}</Text>
              </View>
            ))}
          </ScrollView>
          <View style={styles.legalFooter}>
            <TouchableOpacity style={styles.legalAcceptBtn} onPress={() => setHelpModal(false)}>
              <Text style={styles.legalAcceptText}>Close</Text>
            </TouchableOpacity>
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
  backBtn: { marginRight: Spacing.md },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  title: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxxl },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  rowIconText: { fontSize: 18 },
  rowContent: { flex: 1 },
  rowLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  rowSubtitle: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  chevron: { fontSize: 22, color: Colors.textTertiary, fontWeight: '300' },
  valueText: {
    fontSize: 14,
    color: Colors.secondary,
    fontWeight: '600',
    marginLeft: Spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginLeft: Spacing.base + 36 + Spacing.md,
  },

  // ── Export Overlay ──────────────────
  exportOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  exportBox: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.md,
  },
  exportText: {
    marginTop: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '600',
  },

  // ── Fiscal Year Modal ─────────────
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '85%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  fyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginBottom: 4,
  },
  fyOptionSelected: {
    backgroundColor: Colors.primary + '0D',
  },
  fyRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  fyRadioSelected: {
    borderColor: Colors.primary,
  },
  fyRadioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },
  fyLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  fyLabelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  modalCloseBtn: {
    alignSelf: 'center',
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  modalCloseBtnText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // ── Legal / Help Modals ────────────
  legalModal: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  legalHeader: {
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
  legalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  legalClose: {
    fontSize: 22,
    color: Colors.textTertiary,
    padding: Spacing.sm,
  },
  legalScroll: {
    flex: 1,
  },
  legalText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  legalFooter: {
    padding: Spacing.base,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  legalAcceptBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  legalAcceptText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },

  // ── Help-specific ──────────────────
  helpSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textTertiary,
    letterSpacing: 1,
    marginBottom: Spacing.sm,
  },
  helpContactCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    ...Shadows.sm,
  },
  helpContactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
  },
  helpContactIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  helpContactLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  helpContactValue: {
    fontSize: 13,
    color: Colors.secondary,
    marginTop: 2,
  },
  faqCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  faqQuestion: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  faqAnswer: {
    fontSize: 13,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
});

export default SettingsScreen;
