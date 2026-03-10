// ============================================================
// FINMATRIX - Signature Capture Screen
// ============================================================
// Full-screen signature pad using PanResponder.
// Stores paths as array of point arrays, renders with View lines.
// "Clear" resets · "Done" saves & navigates to CustomerConfirm.

import React, { useRef, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  Dimensions,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../../theme';
import { useAppDispatch, useAppSelector } from '../../../hooks/useReduxHooks';
import {
  setCurrentSignature,
  clearSignature,
  captureSignature,
} from '../../../store/deliverySlice';
import type { SignaturePoint, SignaturePath } from '../../../store/deliverySlice';
import { ROUTES } from '../../../navigations-map/Base';

// ─── Theme ──────────────────────────────────────────────────
const DP_GREEN = '#27AE60';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAD_MARGIN = Spacing.base * 2;
const PAD_WIDTH = SCREEN_WIDTH - PAD_MARGIN;

// ─── Component ──────────────────────────────────────────────
const SignatureCaptureScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const dispatch = useAppDispatch();
  const { activeDelivery, isUpdating } = useAppSelector((s) => s.delivery);
  const deliveryId: string = route.params?.deliveryId;

  const [paths, setPaths] = useState<SignaturePath>([]);
  const currentPath = useRef<SignaturePoint[]>([]);
  const canvasRef = useRef<View>(null);
  const canvasOrigin = useRef({ x: 0, y: 0 });

  const hasSignature = paths.length > 0;

  // ── Measure canvas position ───────────────────────
  const onCanvasLayout = useCallback(() => {
    canvasRef.current?.measureInWindow((x, y) => {
      canvasOrigin.current = { x, y };
    });
  }, []);

  // ── PanResponder ──────────────────────────────────
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt: GestureResponderEvent) => {
          const { pageX, pageY } = evt.nativeEvent;
          const pt: SignaturePoint = {
            x: pageX - canvasOrigin.current.x,
            y: pageY - canvasOrigin.current.y,
          };
          currentPath.current = [pt];
        },
        onPanResponderMove: (evt: GestureResponderEvent) => {
          const { pageX, pageY } = evt.nativeEvent;
          const pt: SignaturePoint = {
            x: pageX - canvasOrigin.current.x,
            y: pageY - canvasOrigin.current.y,
          };
          currentPath.current.push(pt);
          // Force re-render with current paths + current stroke
          setPaths((prev) => [...prev.slice(0, prev.length), [...currentPath.current]]);
        },
        onPanResponderRelease: () => {
          setPaths((prev) => {
            // Replace last path (which was being updated) with final version
            const final = [...prev];
            if (final.length > 0) {
              final[final.length - 1] = [...currentPath.current];
            } else {
              final.push([...currentPath.current]);
            }
            return final;
          });
          currentPath.current = [];
        },
      }),
    [],
  );

  // ── Clear ─────────────────────────────────────────
  const handleClear = useCallback(() => {
    setPaths([]);
    currentPath.current = [];
    dispatch(clearSignature());
  }, [dispatch]);

  // ── Done ──────────────────────────────────────────
  const handleDone = useCallback(async () => {
    if (!hasSignature) return;

    // Serialise paths as simple data URI placeholder
    const signatureData = `data:signature/json;base64,${btoa(JSON.stringify(paths))}`;

    dispatch(setCurrentSignature(paths));

    dispatch(captureSignature({ deliveryId, signatureData }));
    navigation.navigate(ROUTES.CUSTOMER_CONFIRM, { deliveryId });
  }, [hasSignature, paths, deliveryId, dispatch, navigation]);

  // ── Render strokes ────────────────────────────────
  const renderStrokes = useCallback(() => {
    return paths.map((path, pathIdx) =>
      path.map((pt, ptIdx) => {
        if (ptIdx === 0) return null;
        const prev = path[ptIdx - 1];
        const dx = pt.x - prev.x;
        const dy = pt.y - prev.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);

        return (
          <View
            key={`${pathIdx}-${ptIdx}`}
            style={{
              position: 'absolute',
              left: prev.x,
              top: prev.y - 1,
              width: len,
              height: 2.5,
              backgroundColor: Colors.textPrimary,
              transform: [{ rotate: `${angle}deg` }],
              transformOrigin: 'left center',
            }}
          />
        );
      }),
    );
  }, [paths]);

  return (
    <View style={styles.container}>
      {/* ── Header ─────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Customer Signature</Text>
          <Text style={styles.headerSub}>{deliveryId}</Text>
        </View>
      </View>

      {/* ── Customer label ─────────────────────────────── */}
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>
          Signature of: <Text style={styles.labelBold}>{activeDelivery?.customerName || 'Customer'}</Text>
        </Text>
      </View>

      {/* ── Signature Canvas ───────────────────────────── */}
      <View
        ref={canvasRef}
        style={styles.canvas}
        onLayout={onCanvasLayout}
        {...panResponder.panHandlers}
      >
        {paths.length === 0 && (
          <Text style={styles.canvasPlaceholder}>Sign here</Text>
        )}
        {renderStrokes()}

        {/* Baseline */}
        <View style={styles.baseline} />
        <Text style={styles.baselineX}>✕</Text>
      </View>

      {/* ── Buttons ────────────────────────────────────── */}
      <View style={styles.btnRow}>
        <TouchableOpacity
          style={styles.clearBtn}
          activeOpacity={0.7}
          onPress={handleClear}
        >
          <Text style={styles.clearBtnText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.doneBtn,
            (!hasSignature || isUpdating) && styles.doneBtnDisabled,
          ]}
          activeOpacity={0.8}
          onPress={handleDone}
          disabled={!hasSignature || isUpdating}
        >
          <Text style={styles.doneBtnText}>
            {isUpdating ? 'Saving...' : 'Done'}
          </Text>
        </TouchableOpacity>
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

  // Label
  labelRow: {
    padding: Spacing.base,
    paddingBottom: Spacing.sm,
  },
  labelText: { fontSize: 14, color: Colors.textSecondary },
  labelBold: { fontWeight: '700', color: Colors.textPrimary },

  // Canvas
  canvas: {
    flex: 1,
    marginHorizontal: Spacing.base,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  canvasPlaceholder: {
    fontSize: 18,
    color: Colors.placeholder,
    fontStyle: 'italic',
    position: 'absolute',
  },
  baseline: {
    position: 'absolute',
    bottom: 60,
    left: 40,
    right: 40,
    height: 1,
    backgroundColor: Colors.border,
  },
  baselineX: {
    position: 'absolute',
    bottom: 48,
    left: 24,
    fontSize: 18,
    color: Colors.border,
  },

  // Buttons
  btnRow: {
    flexDirection: 'row',
    padding: Spacing.base,
    paddingBottom: Platform.OS === 'ios' ? 34 : Spacing.base,
    gap: Spacing.md,
  },
  clearBtn: {
    flex: 1,
    height: 52,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  clearBtnText: { fontSize: 16, fontWeight: '600', color: Colors.textSecondary },
  doneBtn: {
    flex: 2,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: DP_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.md,
  },
  doneBtnDisabled: { opacity: 0.4 },
  doneBtnText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

export default SignatureCaptureScreen;
