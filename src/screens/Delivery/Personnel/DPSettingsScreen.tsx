// ============================================================
// FINMATRIX - Delivery Personnel Settings Screen
// ============================================================
// Notification toggles · Change password · Help · About

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Platform,
  Alert,
  Linking,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';

// ─── Component ──────────────────────────────────────────────
const DPSettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  // ── Local toggles ─────────────────────────────────
  const [pushEnabled, setPushEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [locationEnabled, setLocationEnabled] = useState(true);

  // ── Handlers ──────────────────────────────────────
  const handleChangePassword = useCallback(() => {
    Alert.alert(
      'Change Password',
      'A password-reset email will be sent to your registered address.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Send Email', onPress: () => Alert.alert('Sent', 'Check your inbox.') },
      ],
    );
  }, []);

  const handleHelp = useCallback(() => {
    Alert.alert('Help & Support', 'Contact support at support@finmatrix.io');
  }, []);

  const handleAbout = useCallback(() => {
    Alert.alert(
      'About FinMatrix',
      'FinMatrix v1.0.0\n\nFinancial management & delivery operations platform.\n\n© 2025 FinMatrix, Inc.',
    );
  }, []);

  const handlePrivacy = useCallback(() => {
    Linking.openURL('https://finmatrix.io/privacy').catch(() => {});
  }, []);

  const handleTerms = useCallback(() => {
    Linking.openURL('https://finmatrix.io/terms').catch(() => {});
  }, []);

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginBottom: Spacing.xs }}>
          <Text style={{ fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: '500' }}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
        {/* ── Notifications ──────────────────────────────── */}
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.section}>
          <ToggleRow
            label="Push Notifications"
            description="New assignments & status updates"
            value={pushEnabled}
            onToggle={setPushEnabled}
          />
          <Divider />
          <ToggleRow
            label="Sound"
            description="Play alert sound for new deliveries"
            value={soundEnabled}
            onToggle={setSoundEnabled}
          />
          <Divider />
          <ToggleRow
            label="Vibration"
            description="Vibrate on notifications"
            value={vibrationEnabled}
            onToggle={setVibrationEnabled}
          />
        </View>

        {/* ── Location ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Location</Text>
        <View style={styles.section}>
          <ToggleRow
            label="Share Location"
            description="Allow real-time tracking during deliveries"
            value={locationEnabled}
            onToggle={setLocationEnabled}
          />
        </View>

        {/* ── Security ───────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Security</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleChangePassword}>
            <Text style={styles.menuIcon}>🔒</Text>
            <Text style={styles.menuLabel}>Change Password</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Support ────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleHelp}>
            <Text style={styles.menuIcon}>❓</Text>
            <Text style={styles.menuLabel}>Help & Support</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleAbout}>
            <Text style={styles.menuIcon}>ℹ️</Text>
            <Text style={styles.menuLabel}>About FinMatrix</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        </View>

        {/* ── Legal ──────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Legal</Text>
        <View style={styles.section}>
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handlePrivacy}>
            <Text style={styles.menuIcon}>📄</Text>
            <Text style={styles.menuLabel}>Privacy Policy</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
          <Divider />
          <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleTerms}>
            <Text style={styles.menuIcon}>📜</Text>
            <Text style={styles.menuLabel}>Terms of Service</Text>
            <Text style={styles.menuChevron}>›</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.version}>FinMatrix v1.0.0</Text>
      </ScrollView>
    </View>
  );
};

// ─── Toggle Row ─────────────────────────────────────────────
const ToggleRow: React.FC<{
  label: string;
  description: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}> = ({ label, description, value, onToggle }) => (
  <View style={styles.toggleRow}>
    <View style={{ flex: 1 }}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <Text style={styles.toggleDesc}>{description}</Text>
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: Colors.border, true: DP_GREEN }}
      thumbColor={Colors.white}
      ios_backgroundColor={Colors.border}
    />
  </View>
);

// ─── Divider ────────────────────────────────────────────────
const Divider: React.FC = () => <View style={styles.divider} />;

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: DP_GREEN,
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.white },

  // Body
  body: { flex: 1 },
  bodyContent: { padding: Spacing.base, paddingBottom: 40 },

  // Section
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.textTertiary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
    marginBottom: Spacing.sm,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
  },
  toggleLabel: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  toggleDesc: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },

  // Menu
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.base,
  },
  menuIcon: { fontSize: 18, marginRight: Spacing.md },
  menuLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  menuChevron: { fontSize: 22, color: Colors.textTertiary },

  // Divider
  divider: { height: 1, backgroundColor: Colors.borderLight, marginHorizontal: Spacing.base },

  // Footer
  version: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: Spacing.xl,
  },
});

export default DPSettingsScreen;
