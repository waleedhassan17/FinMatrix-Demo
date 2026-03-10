// ============================================================
// FINMATRIX - Demo Toolbar (Floating FAB + Bottom Sheet)
// ============================================================
// DEMO FLOW:
// 1. Login as Admin -> Show dashboard with delivery overview
// 2. Go to Delivery Management -> Assign 3 deliveries to Imran
// 3. Quick-switch to Imran (via DemoToolbar)
// 4. Show Imran's dashboard - new deliveries appear immediately
// 5. Walk through one delivery: Pick Up -> In Transit -> Arrive -> Sign -> Confirm
// 6. Show shadow inventory updated
// 7. Quick-switch back to Admin
// 8. Show notification appeared for admin
// 9. Go to Approvals -> Review Imran's update -> Approve
// 10. Show real inventory quantities changed
// 11. Quick-switch to Imran -> show approval notification received
// ============================================================

import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';
import { useAppDispatch, useAppSelector } from '../hooks/useReduxHooks';
import { signIn, setOnboarded } from '../screens/auth/authSlice';
import { setActiveCompany } from '../store/companySlice';
import { fetchNotifications } from '../screens/Notifications/notificationSlice';
import {
  simulateDeliveryCompletion,
  simulateNewAssignment,
  simulateApproval,
  simulateRejection,
} from '../store/demoActions';
import type { UserRole } from '../types';

// ─── Demo Personas ──────────────────────────────────────────
interface DemoPersona {
  label: string;
  role: UserRole;
  email: string;
  password: string;
  companyId: string;
  color: string;
  initials: string;
  badge: string;
}

const PERSONAS: DemoPersona[] = [
  {
    label: 'Muhammad Ali',
    role: 'administrator',
    email: 'admin@finmatrix.com',
    password: 'Admin@123',
    companyId: 'company_1',
    color: Colors.primary,
    initials: 'MA',
    badge: 'Admin',
  },
  {
    label: 'Imran Sheikh',
    role: 'delivery_personnel',
    email: 'imran@finmatrix.pk',
    password: 'deliver123',
    companyId: 'company_1',
    color: Colors.deliveryAccent,
    initials: 'IS',
    badge: 'DP-001',
  },
  {
    label: 'Hassan Raza',
    role: 'delivery_personnel',
    email: 'hassan@finmatrix.pk',
    password: 'deliver123',
    companyId: 'company_1',
    color: '#27AE60',
    initials: 'HR',
    badge: 'DP-002',
  },
  {
    label: 'Ali Abbas',
    role: 'delivery_personnel',
    email: 'ali@finmatrix.pk',
    password: 'deliver123',
    companyId: 'company_1',
    color: '#8E44AD',
    initials: 'AA',
    badge: 'DP-004',
  },
  {
    label: 'Kamran Malik',
    role: 'delivery_personnel',
    email: 'kamran@finmatrix.pk',
    password: 'deliver123',
    companyId: 'company_1',
    color: '#F39C12',
    initials: 'KM',
    badge: 'DP-005',
  },
];

// ─── Simulation Buttons ─────────────────────────────────────
interface SimBtn {
  label: string;
  icon: string;
  color: string;
}

const SIM_BUTTONS: SimBtn[] = [
  { label: 'Simulate Delivery Completion', icon: '📦', color: Colors.success },
  { label: 'Simulate New Assignment',      icon: '🚚', color: Colors.info },
  { label: 'Simulate Approval',            icon: '✅', color: '#27AE60' },
  { label: 'Simulate Rejection',           icon: '❌', color: Colors.danger },
];

// ─── Component ──────────────────────────────────────────────
const DemoToolbar: React.FC = () => {
  const dispatch = useAppDispatch();
  const demoMode = useAppSelector((s) => s.settings.demoMode);
  const currentUser = useAppSelector((s) => s.auth.user);
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Subtle pulse for FAB
  useEffect(() => {
    if (!demoMode) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [demoMode, pulseAnim]);

  // ── Quick Login ───────────────────────────────────
  const handleLogin = useCallback(async (persona: DemoPersona) => {
    setSwitching(true);
    try {
      await dispatch(
        signIn({ email: persona.email, password: persona.password, role: persona.role }),
      ).unwrap();
      // For admin, also set company
      if (persona.role === 'administrator') {
        dispatch(setActiveCompany(persona.companyId));
      }
      // For delivery personnel, mark as onboarded
      if (persona.role === 'delivery_personnel') {
        dispatch(setOnboarded());
      }
      dispatch(fetchNotifications());
      setOpen(false);
    } catch (err: any) {
      Alert.alert('Login Failed', err?.toString() ?? 'Unknown error');
    } finally {
      setSwitching(false);
    }
  }, [dispatch]);

  // ── Simulate Events ───────────────────────────────
  const handleSimulate = useCallback(async (index: number) => {
    const actions = [
      simulateDeliveryCompletion,
      simulateNewAssignment,
      simulateApproval,
      simulateRejection,
    ];
    try {
      const result = await dispatch(actions[index]()).unwrap();
      Alert.alert('Simulation Complete', result);
    } catch (err: any) {
      Alert.alert('Simulation Error', err?.toString() ?? 'Unknown error');
    }
  }, [dispatch]);

  // ── Reset ─────────────────────────────────────────
  const handleResetNotifications = useCallback(() => {
    dispatch(fetchNotifications());
    Alert.alert('Done', 'Notifications refreshed from seed data.');
  }, [dispatch]);

  if (!demoMode) return null;

  const currentLabel = currentUser
    ? `${currentUser.displayName} (${currentUser.role === 'administrator' ? 'Admin' : 'DP'})`
    : 'Not logged in';

  return (
    <>
      {/* ── FAB ──────────────────────────────── */}
      <Animated.View style={[styles.fab, { transform: [{ scale: pulseAnim }] }]}>
        <TouchableOpacity
          style={styles.fabTouch}
          onPress={() => setOpen(true)}
          activeOpacity={0.8}
        >
          <Text style={styles.fabIcon}>⚙️</Text>
        </TouchableOpacity>
      </Animated.View>

      {/* ── Bottom Sheet Modal ────────────────── */}
      <Modal visible={open} transparent animationType="slide">
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View />
        </TouchableOpacity>
        <View style={styles.sheet}>
          {/* Handle bar */}
          <View style={styles.handleBar} />

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {/* Current user banner */}
            <View style={styles.currentBanner}>
              <Text style={styles.currentLabel}>Current: </Text>
              <Text style={styles.currentValue}>{currentLabel}</Text>
            </View>

            {/* ── SECTION 1: Quick Login As ──── */}
            <Text style={styles.sectionTitle}>🔄  Quick Login As</Text>
            {PERSONAS.map((p) => {
              const isActive = currentUser?.email === p.email;
              return (
                <TouchableOpacity
                  key={p.email}
                  style={[styles.personaRow, isActive && styles.personaRowActive]}
                  onPress={() => handleLogin(p)}
                  disabled={switching}
                  activeOpacity={0.7}
                >
                  <View style={[styles.avatar, { backgroundColor: p.color }]}>
                    <Text style={styles.avatarText}>{p.initials}</Text>
                  </View>
                  <View style={styles.personaInfo}>
                    <Text style={styles.personaName}>{p.label}</Text>
                    <Text style={styles.personaEmail}>{p.email}</Text>
                  </View>
                  <View style={[
                    styles.roleBadge,
                    { backgroundColor: p.role === 'administrator' ? Colors.primary : Colors.deliveryAccent },
                  ]}>
                    <Text style={styles.roleBadgeText}>{p.badge}</Text>
                  </View>
                  {isActive && (
                    <View style={styles.activeDot} />
                  )}
                </TouchableOpacity>
              );
            })}

            {/* ── SECTION 2: Simulate Events ──── */}
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>⚡  Simulate Events</Text>
            <View style={styles.simGrid}>
              {SIM_BUTTONS.map((btn, idx) => (
                <TouchableOpacity
                  key={btn.label}
                  style={[styles.simBtn, { borderColor: btn.color + '40' }]}
                  onPress={() => handleSimulate(idx)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.simIcon}>{btn.icon}</Text>
                  <Text style={[styles.simLabel, { color: btn.color }]}>{btn.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── SECTION 3: Reset Data ────────── */}
            <Text style={[styles.sectionTitle, { marginTop: Spacing.lg }]}>🔄  Reset Data</Text>
            <TouchableOpacity
              style={[styles.resetBtn, { borderColor: Colors.warning + '40' }]}
              onPress={handleResetNotifications}
              activeOpacity={0.7}
            >
              <Text style={styles.resetBtnText}>🔔  Refresh Notifications</Text>
            </TouchableOpacity>

            <View style={{ height: Spacing.xl }} />
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  // FAB
  fab: {
    position: 'absolute',
    bottom: 90,
    left: 16,
    zIndex: 9999,
  },
  fabTouch: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primaryDark,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.lg,
  },
  fabIcon: { fontSize: 22 },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
  },

  // Sheet
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '75%',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xl,
    ...Shadows.lg,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.md,
  },

  // Current user banner
  currentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.infoLight,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  currentLabel: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  currentValue: { fontSize: 12, fontWeight: '700', color: Colors.primary, flex: 1 },

  // Section title
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },

  // Persona rows
  personaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginBottom: 4,
  },
  personaRowActive: {
    backgroundColor: Colors.successLight,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { fontSize: 13, fontWeight: '700', color: Colors.white },
  personaInfo: { flex: 1, marginLeft: Spacing.md },
  personaName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  personaEmail: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
    marginLeft: Spacing.sm,
  },
  roleBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.white },
  activeDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.success,
    marginLeft: Spacing.xs,
  },

  // Simulate grid
  simGrid: {
    gap: Spacing.sm,
  },
  simBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: Colors.white,
  },
  simIcon: { fontSize: 18, marginRight: Spacing.sm },
  simLabel: { fontSize: 13, fontWeight: '600' },

  // Reset
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    backgroundColor: Colors.white,
  },
  resetBtnText: { fontSize: 13, fontWeight: '600', color: Colors.warning },
});

export default DemoToolbar;
