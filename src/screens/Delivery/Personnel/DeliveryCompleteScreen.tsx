// ============================================================
// FINMATRIX - Delivery Complete Screen (Success)
// ============================================================
// Animated checkmark · "Delivery Complete!" · Summary ·
// "Back to Deliveries" button

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppSelector } from '../../../hooks/useReduxHooks';
import { ROUTES } from '../../../navigations-map/Base';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';
const DP_GREEN_LIGHT = '#E8F8EF';

// ─── Component ──────────────────────────────────────────────
const DeliveryCompleteScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { activeDelivery } = useAppSelector((s) => s.delivery);
  const delivery = activeDelivery;
  const deliveryId: string = route.params?.deliveryId;

  // ── Animations ────────────────────────────────────
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    // Check circle bounce
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 4,
      tension: 60,
      useNativeDriver: true,
    }).start();

    // Fade in text
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [scaleAnim, fadeAnim, slideAnim]);

  // ── Navigate back to list ─────────────────────────
  const handleBack = () => {
    // Reset the deliveries stack to the list screen
    navigation.popToTop();
  };

  const totalItems = delivery
    ? delivery.items.reduce((s: number, i: { quantity: number }) => s + i.quantity, 0)
    : 0;

  return (
    <View style={styles.container}>
      {/* ── Animated Checkmark ──────────────────────── */}
      <Animated.View
        style={[
          styles.checkCircle,
          { transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Text style={styles.checkIcon}>✓</Text>
      </Animated.View>

      {/* ── Title & Summary ────────────────────────── */}
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
          alignItems: 'center',
          width: '100%',
          paddingHorizontal: Spacing.xl,
        }}
      >
        <Text style={styles.title}>Delivery Complete!</Text>
        <Text style={styles.subtitle}>
          The delivery has been confirmed and recorded.
        </Text>

        {/* ── Summary Card ───────────────────────────── */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery ID</Text>
            <Text style={styles.summaryValue}>{deliveryId}</Text>
          </View>
          {delivery && (
            <>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Customer</Text>
                <Text style={styles.summaryValue}>{delivery.customerName}</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Items</Text>
                <Text style={styles.summaryValue}>
                  {delivery.items.length} item{delivery.items.length !== 1 ? 's' : ''} · {totalItems} units
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Completed</Text>
                <Text style={styles.summaryValue}>
                  {new Date().toLocaleString()}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Verified</Text>
                <Text style={[styles.summaryValue, { color: DP_GREEN }]}>
                  ✅ Customer confirmed
                </Text>
              </View>
            </>
          )}
        </View>

        {/* ── Info Note ──────────────────────────────── */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            📋 An inventory update request has been automatically created for
            admin review.
          </Text>
        </View>

        {/* ── Back Button ────────────────────────────── */}
        <TouchableOpacity
          style={styles.backBtn}
          activeOpacity={0.8}
          onPress={handleBack}
        >
          <Text style={styles.backBtnText}>↩  Back to Deliveries</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SAFE_TOP_PADDING,
    paddingHorizontal: Spacing.xl,
  },

  // Checkmark
  checkCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: DP_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    ...Shadows.lg,
  },
  checkIcon: { fontSize: 50, fontWeight: '700', color: Colors.white },

  // Title
  title: { fontSize: 26, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },

  // Summary
  summaryCard: {
    width: '100%',
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  summaryLabel: { fontSize: 13, color: Colors.textTertiary, fontWeight: '500' },
  summaryValue: { fontSize: 13, color: Colors.textPrimary, fontWeight: '600', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 2 },

  // Note
  noteCard: {
    width: '100%',
    backgroundColor: DP_GREEN_LIGHT,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
    borderWidth: 1,
    borderColor: DP_GREEN,
    borderStyle: 'dashed',
  },
  noteText: { fontSize: 12, color: Colors.textSecondary, lineHeight: 18, textAlign: 'center' },

  // Back button
  backBtn: {
    backgroundColor: DP_GREEN,
    borderRadius: BorderRadius.md,
    height: 52,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  backBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

export default DeliveryCompleteScreen;
