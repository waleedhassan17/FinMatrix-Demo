// ============================================================
// FINMATRIX - Customer Confirmation Screen
// ============================================================
// SHOWN TO THE CUSTOMER — device handed to them.
// Company name · Green checkmark · "Delivery Confirmed!" ·
// Items list · Signature preview · Confirm button · Report Issue

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import { confirmDelivery, updateDeliveryStatus } from '../../../store/deliverySlice';
import type { SignaturePath, ItemConfirmStatus } from '../../../store/deliverySlice';
import { ROUTES } from '../../../navigations-map/Base';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';
const DP_GREEN_LIGHT = '#E8F8EF';
const COMPANY_NAME = 'FinMatrix Inc.';

// ─── Mini signature preview renderer ────────────────────────
const SignaturePreview: React.FC<{ paths: SignaturePath; width: number; height: number }> = ({
  paths,
  width,
  height,
}) => {
  if (paths.length === 0) return null;

  return (
    <View style={{ width, height, backgroundColor: Colors.white, borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: Colors.border, overflow: 'hidden' }}>
      {paths.map((path, pi) =>
        path.map((pt, pti) => {
          if (pti === 0) return null;
          const prev = path[pti - 1];
          // Scale proportionally (original canvas was full-width)
          const scale = width / 350; // approximate
          const dx = (pt.x - prev.x) * scale;
          const dy = (pt.y - prev.y) * scale;
          const len = Math.sqrt(dx * dx + dy * dy);
          const angle = Math.atan2(dy, dx) * (180 / Math.PI);

          return (
            <View
              key={`${pi}-${pti}`}
              style={{
                position: 'absolute',
                left: prev.x * scale,
                top: prev.y * scale,
                width: len,
                height: 1.5,
                backgroundColor: Colors.textPrimary,
                transform: [{ rotate: `${angle}deg` }],
                transformOrigin: 'left center',
              }}
            />
          );
        }),
      )}
    </View>
  );
};

// ─── Component ──────────────────────────────────────────────
const CustomerConfirmScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const { activeDelivery, currentSignature, itemConfirmations, isUpdating } = useAppSelector(
    (s) => s.delivery,
  );
  const deliveryId: string = route.params?.deliveryId;
  const delivery = activeDelivery;

  const [issueModalVisible, setIssueModalVisible] = useState(false);
  const [issueText, setIssueText] = useState('');
  const [issueType, setIssueType] = useState<string>('');
  const [isReporting, setIsReporting] = useState(false);

  const ISSUE_TYPES = ['Missing Items', 'Wrong Items', 'Damaged', 'Other'];

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeStr = now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  // ── Per-item summary from slice ───────────────────
  const hasItemConfirmations = itemConfirmations.length > 0;

  const partialSummary = useMemo(() => {
    if (!hasItemConfirmations) return { isPartial: false, notDelivered: 0 };
    const notDelivered = itemConfirmations.filter((c) => c.status !== 'delivered').length;
    return { isPartial: notDelivered > 0, notDelivered };
  }, [itemConfirmations, hasItemConfirmations]);

  const statusBadge = (status: ItemConfirmStatus) => {
    switch (status) {
      case 'delivered': return { label: '✓ Delivered', color: DP_GREEN, bg: DP_GREEN_LIGHT };
      case 'damaged':   return { label: '⚠ Damaged',  color: Colors.warning, bg: Colors.warningLight };
      case 'returned':  return { label: '↩ Returned', color: Colors.danger, bg: Colors.dangerLight };
      default:          return { label: status, color: Colors.textTertiary, bg: Colors.borderLight };
    }
  };

  // ── Confirm ───────────────────────────────────────
  const handleConfirm = useCallback(() => {
    dispatch(confirmDelivery({ deliveryId, customerVerified: true }));
    navigation.navigate(ROUTES.DELIVERY_COMPLETE, { deliveryId });
  }, [deliveryId, dispatch, navigation]);

  // ── Report issue ──────────────────────────────────
  const handleReportIssue = useCallback(() => {
    if (!issueType) {
      Alert.alert('Select Issue Type', 'Please choose an issue type before submitting.');
      return;
    }
    if (!issueText.trim()) {
      Alert.alert('Please describe the issue');
      return;
    }

    setIsReporting(true);
    // Mark delivery as failed
    dispatch(
      updateDeliveryStatus({ deliveryId, status: 'failed' }),
    );

    Alert.alert(
      'Issue Reported',
      `Issue type: ${issueType}\nThe delivery has been marked as failed. The delivery team will follow up.`,
      [
        {
          text: 'OK',
          onPress: () => {
            setIssueModalVisible(false);
            setIssueText('');
            setIssueType('');
            navigation.goBack();
          },
        },
      ],
    );
    setIsReporting(false);
  }, [issueType, issueText, deliveryId, dispatch, navigation]);

  if (!delivery) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={DP_GREEN} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Company Header ───────────────────────────── */}
        <Text style={styles.companyName}>{COMPANY_NAME}</Text>

        {/* ── Green Checkmark Circle ───────────────────── */}
        <View style={styles.checkCircle}>
          <Text style={styles.checkIcon}>✓</Text>
        </View>

        {/* ── Title ────────────────────────────────────── */}
        <Text style={styles.title}>Delivery Confirmed!</Text>

        {/* ── Partial Delivery Warning ─────────────────── */}
        {partialSummary.isPartial && (
          <View style={styles.partialWarning}>
            <Text style={styles.partialWarningText}>
              ⚠️  Partial delivery — {partialSummary.notDelivered} item(s) not delivered
            </Text>
          </View>
        )}

        {/* ── Message ──────────────────────────────────── */}
        <View style={styles.messageCard}>
          <Text style={styles.messageText}>
            Dear <Text style={styles.bold}>{delivery.customerName}</Text>,{'\n\n'}
            Your delivery from <Text style={styles.bold}>{COMPANY_NAME}</Text> has been
            completed.{'\n\n'}
            <Text style={styles.metaLabel}>Delivery ID:</Text>{' '}
            <Text style={styles.bold}>{delivery.deliveryId}</Text>
            {'\n'}
            <Text style={styles.metaLabel}>Date:</Text> {dateStr} at {timeStr}
          </Text>
        </View>

        {/* ── Items List (per-item summary) ────────────── */}
        <View style={styles.itemsCard}>
          <Text style={styles.sectionLabel}>📦  Items ({delivery.items.length})</Text>
          {delivery.items.map((item, idx) => {
            const confirmation = hasItemConfirmations
              ? itemConfirmations.find((c) => c.itemId === item.itemId)
              : null;
            const badge = confirmation ? statusBadge(confirmation.status) : null;

            return (
              <View key={item.itemId + idx} style={styles.itemRow}>
                <View style={styles.itemBullet}>
                  <Text style={styles.itemBulletText}>{idx + 1}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.itemName}</Text>
                  {confirmation ? (
                    <View style={styles.itemConfirmRow}>
                      <Text style={styles.itemDesc}>
                        Ordered: {confirmation.orderedQty} · Delivered: {confirmation.deliveredQty}
                      </Text>
                      <View style={[styles.itemStatusBadge, { backgroundColor: badge!.bg }]}>
                        <Text style={[styles.itemStatusText, { color: badge!.color }]}>
                          {badge!.label}
                        </Text>
                      </View>
                    </View>
                  ) : (
                    <Text style={styles.itemDesc}>
                      Qty: {item.quantity} · {item.description}
                    </Text>
                  )}
                  {confirmation?.notes ? (
                    <Text style={styles.itemNote}>📝 {confirmation.notes}</Text>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>

        {/* ── Signature Preview ────────────────────────── */}
        {currentSignature.length > 0 && (
          <View style={styles.sigCard}>
            <Text style={styles.sectionLabel}>✍️  Customer Signature</Text>
            <SignaturePreview paths={currentSignature} width={280} height={100} />
          </View>
        )}

        {/* ── Confirm Button ───────────────────────────── */}
        <TouchableOpacity
          style={[styles.confirmBtn, isUpdating && styles.confirmBtnDisabled]}
          activeOpacity={0.8}
          onPress={handleConfirm}
          disabled={isUpdating}
        >
          {isUpdating ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <Text style={styles.confirmBtnText}>
              ✅  I Confirm Receipt of All Items
            </Text>
          )}
        </TouchableOpacity>

        {/* ── Report Issue ─────────────────────────────── */}
        <TouchableOpacity
          style={styles.reportBtn}
          activeOpacity={0.7}
          onPress={() => setIssueModalVisible(true)}
        >
          <Text style={styles.reportBtnText}>Report Issue</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ── Report Issue Modal ─────────────────────────── */}
      <Modal
        visible={issueModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIssueModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️  Report an Issue</Text>
            <Text style={styles.modalSub}>
              Select the issue type and describe the problem.
            </Text>

            {/* Issue Type Picker */}
            <Text style={styles.issueTypeLabel}>Issue Type</Text>
            <View style={styles.issueTypeRow}>
              {ISSUE_TYPES.map((type) => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.issueTypeChip,
                    issueType === type && styles.issueTypeChipActive,
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setIssueType(type)}
                >
                  <Text
                    style={[
                      styles.issueTypeChipText,
                      issueType === type && styles.issueTypeChipTextActive,
                    ]}
                  >
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.modalInput}
              multiline
              numberOfLines={4}
              placeholder="Describe the issue..."
              placeholderTextColor={Colors.placeholder}
              value={issueText}
              onChangeText={setIssueText}
              textAlignVertical="top"
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setIssueModalVisible(false);
                  setIssueText('');
                  setIssueType('');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSubmitBtn, isReporting && { opacity: 0.6 }]}
                onPress={handleReportIssue}
                disabled={isReporting}
              >
                {isReporting ? (
                  <ActivityIndicator color={Colors.white} size="small" />
                ) : (
                  <Text style={styles.modalSubmitText}>Submit</Text>
                )}
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
  container: { flex: 1, backgroundColor: Colors.white },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scroll: {
    paddingHorizontal: Spacing.xl,
    paddingTop: SAFE_TOP_PADDING,
    alignItems: 'center',
  },

  // Company
  companyName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.xl,
  },

  // Checkmark
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: DP_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.base,
    ...Shadows.lg,
  },
  checkIcon: { fontSize: 40, fontWeight: '700', color: Colors.white },

  // Title
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
  },

  // Message
  messageCard: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    width: '100%',
    marginBottom: Spacing.md,
  },
  messageText: { fontSize: 14, color: Colors.textSecondary, lineHeight: 22 },
  bold: { fontWeight: '700', color: Colors.textPrimary },
  metaLabel: { fontWeight: '600', color: Colors.textTertiary },

  // Items
  itemsCard: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    width: '100%',
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  itemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing.sm },
  itemBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: DP_GREEN_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  itemBulletText: { fontSize: 10, fontWeight: '700', color: DP_GREEN },
  itemName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  itemDesc: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },

  // Signature
  sigCard: {
    backgroundColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    width: '100%',
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },

  // Confirm button (56px height per spec)
  confirmBtn: {
    backgroundColor: DP_GREEN,
    borderRadius: BorderRadius.md,
    height: 56,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    ...Shadows.lg,
  },
  confirmBtnDisabled: { opacity: 0.5 },
  confirmBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },

  // Report issue
  reportBtn: {
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reportBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.danger,
    textDecorationLine: 'underline',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  modalSub: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.md },
  issueTypeLabel: { fontSize: 12, fontWeight: '700', color: Colors.textTertiary, marginBottom: Spacing.xs },
  issueTypeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.md },
  issueTypeChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
  },
  issueTypeChipActive: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  issueTypeChipText: { fontSize: 12, fontWeight: '600', color: Colors.textSecondary },
  issueTypeChipTextActive: { color: Colors.danger, fontWeight: '700' },
  modalInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    minHeight: 100,
    fontSize: 14,
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  modalBtnRow: { flexDirection: 'row', gap: Spacing.md },
  modalCancelBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
  modalSubmitBtn: {
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.danger,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalSubmitText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  // Partial delivery warning
  partialWarning: {
    backgroundColor: Colors.warningLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    width: '100%',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  partialWarningText: { fontSize: 13, fontWeight: '600', color: Colors.warning, textAlign: 'center' },

  // Item confirmation details
  itemConfirmRow: { marginTop: 2 },
  itemStatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    marginTop: 4,
  },
  itemStatusText: { fontSize: 11, fontWeight: '700' },
  itemNote: { fontSize: 11, color: Colors.textTertiary, fontStyle: 'italic', marginTop: 4 },
});

export default CustomerConfirmScreen;
