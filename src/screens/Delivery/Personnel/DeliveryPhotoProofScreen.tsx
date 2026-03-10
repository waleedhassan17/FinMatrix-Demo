// ============================================================
// FINMATRIX - Delivery Photo Proof Screen
// ============================================================
// Dummy photo gallery for delivery proof. Max 4 photos.
// "Add Photo" generates a coloured placeholder.
// "Continue to Signature" → navigates to SignatureCapture.
// TODO: In production, use expo-image-picker or expo-camera

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch } from '../../../hooks/useReduxHooks';
import { setDeliveryPhotoUrls } from '../../../store/deliverySlice';
import { ROUTES } from '../../../navigations-map/Base';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';
const DP_GREEN_LIGHT = '#E8F8EF';

const MAX_PHOTOS = 4;

const PLACEHOLDER_COLORS = ['#3498DB', '#9B59B6', '#E67E22', '#1ABC9C'];

// ─── Component ──────────────────────────────────────────────
const DeliveryPhotoProofScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const deliveryId: string = route.params?.deliveryId;

  const [photos, setPhotos] = useState<{ id: string; label: string; color: string }[]>([]);

  // ── Add dummy photo ──────────────────────────────
  const handleAddPhoto = useCallback(() => {
    if (photos.length >= MAX_PHOTOS) return;
    const idx = photos.length;
    setPhotos((prev) => [
      ...prev,
      {
        id: `photo_${Date.now()}_${idx}`,
        label: `Photo ${idx + 1}`,
        color: PLACEHOLDER_COLORS[idx % PLACEHOLDER_COLORS.length],
      },
    ]);
  }, [photos.length]);

  // ── Remove photo ─────────────────────────────────
  const handleRemovePhoto = useCallback((id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }, []);

  // ── Continue ─────────────────────────────────────
  const handleContinue = useCallback(() => {
    // Store dummy photo URLs in Redux
    const urls = photos.map(
      (p) => `https://finmatrix.example.com/photos/${deliveryId}/${p.id}.jpg`,
    );
    dispatch(setDeliveryPhotoUrls(urls));
    navigation.navigate(ROUTES.SIGNATURE_CAPTURE, { deliveryId });
  }, [photos, deliveryId, dispatch, navigation]);

  // ── Skip ─────────────────────────────────────────
  const handleSkip = useCallback(() => {
    dispatch(setDeliveryPhotoUrls([]));
    navigation.navigate(ROUTES.SIGNATURE_CAPTURE, { deliveryId });
  }, [deliveryId, dispatch, navigation]);

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Photo Proof</Text>
          <Text style={styles.headerSub}>{photos.length}/{MAX_PHOTOS} photos</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* ── Instructions ─────────────────────────────── */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionText}>
            Take photos of the delivered items as proof of condition. You can add
            up to <Text style={styles.bold}>{MAX_PHOTOS} photos</Text>.
            This step is optional.
          </Text>
        </View>

        {/* ── Photo Grid ───────────────────────────────── */}
        <View style={styles.photoGrid}>
          {photos.map((photo) => (
            <View key={photo.id} style={styles.photoCard}>
              {/* Coloured placeholder */}
              <View style={[styles.photoPlaceholder, { backgroundColor: photo.color }]}>
                <Text style={styles.photoEmoji}>📷</Text>
                <Text style={styles.photoLabel}>{photo.label}</Text>
              </View>
              {/* Remove button */}
              <TouchableOpacity
                style={styles.removeBtn}
                activeOpacity={0.7}
                onPress={() => handleRemovePhoto(photo.id)}
              >
                <Text style={styles.removeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}

          {/* Add Photo button */}
          {photos.length < MAX_PHOTOS && (
            <TouchableOpacity
              style={styles.addPhotoCard}
              activeOpacity={0.7}
              onPress={handleAddPhoto}
            >
              <Text style={styles.addPhotoIcon}>📷</Text>
              <Text style={styles.addPhotoText}>Add Photo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Empty state ──────────────────────────────── */}
        {photos.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🖼️</Text>
            <Text style={styles.emptyTitle}>No Photos Yet</Text>
            <Text style={styles.emptyDesc}>
              Tap "Add Photo" above to capture delivery proof photos.
              You can skip this step if desired.
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Bottom Buttons ─────────────────────────────── */}
      <View style={styles.actionBar}>
        {photos.length > 0 ? (
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.8}
            onPress={handleContinue}
          >
            <Text style={styles.continueBtnText}>
              Continue to Signature →
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.addBtn}
              activeOpacity={0.8}
              onPress={handleAddPhoto}
            >
              <Text style={styles.addBtnText}>📷  Add Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.skipBtn}
              activeOpacity={0.7}
              onPress={handleSkip}
            >
              <Text style={styles.skipBtnText}>Skip →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header: {
    backgroundColor: DP_GREEN,
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: { marginRight: Spacing.md },
  backText: { fontSize: 15, fontWeight: '600', color: Colors.white },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.white },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  scroll: { padding: Spacing.base },

  // Instruction
  instructionCard: {
    backgroundColor: DP_GREEN_LIGHT,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: DP_GREEN,
  },
  instructionText: { fontSize: 13, color: Colors.textSecondary, lineHeight: 20 },
  bold: { fontWeight: '700', color: Colors.textPrimary },

  // Photo grid
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  photoCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  photoEmoji: { fontSize: 32, marginBottom: Spacing.xs },
  photoLabel: { fontSize: 14, fontWeight: '700', color: Colors.white },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: { fontSize: 14, fontWeight: '700', color: Colors.white },

  // Add photo card
  addPhotoCard: {
    width: '47%',
    aspectRatio: 1,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  addPhotoIcon: { fontSize: 28, marginBottom: Spacing.xs },
  addPhotoText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.xs },
  emptyDesc: { fontSize: 13, color: Colors.textTertiary, textAlign: 'center', lineHeight: 20, paddingHorizontal: Spacing.xl },

  // Action bar
  actionBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.base,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  continueBtn: {
    backgroundColor: DP_GREEN,
    borderRadius: BorderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  continueBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  btnRow: { flexDirection: 'row', gap: Spacing.md },
  addBtn: {
    flex: 2,
    backgroundColor: DP_GREEN,
    borderRadius: BorderRadius.md,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  addBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
  skipBtn: {
    flex: 1,
    borderRadius: BorderRadius.md,
    height: 52,
    borderWidth: 1.5,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  skipBtnText: { fontSize: 14, fontWeight: '600', color: Colors.textSecondary },
});

export default DeliveryPhotoProofScreen;
