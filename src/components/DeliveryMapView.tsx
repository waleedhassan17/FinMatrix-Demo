// ============================================================
// FINMATRIX - Delivery Map View (Reusable)
// ============================================================
// Renders a MapView with origin (warehouse), destination
// (customer), and optional driver marker. Falls back to a
// styled address card when react-native-maps fails to load
// (e.g., no API key configured).

import React, { useMemo, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Linking,
  ViewStyle,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';

// ─── Conditional MapView import ─────────────────────────────
let MapView: any = null;
let Marker: any = null;
let Callout: any = null;

try {
  const maps = require('react-native-maps');
  MapView = maps.default;
  Marker = maps.Marker;
  Callout = maps.Callout;
} catch {
  // react-native-maps not available — will use fallback
}

// ─── Props ──────────────────────────────────────────────────
export interface MapMarker {
  latitude: number;
  longitude: number;
  label: string;
}

export interface DeliveryMapViewProps {
  origin: MapMarker;
  destination: MapMarker;
  driverLocation?: MapMarker;
  /** Extra markers for multi-delivery admin view */
  extraMarkers?: (MapMarker & { id: string; subtitle?: string })[];
  style?: ViewStyle;
  /** Height of the map container (default 200) */
  height?: number;
}

// ─── Helpers ────────────────────────────────────────────────
const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Haversine distance in miles */
export const haversineDistance = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number => {
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h =
    sinLat * sinLat +
    Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Estimate driving minutes: straight-line × 1.4 road factor ÷ 30 mph */
export const estimateETA = (
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number => {
  const miles = haversineDistance(a, b);
  const roadMiles = miles * 1.4;
  const minutes = (roadMiles / 30) * 60;
  return Math.max(1, Math.round(minutes));
};

// ─── Component ──────────────────────────────────────────────
const DeliveryMapView: React.FC<DeliveryMapViewProps> = ({
  origin,
  destination,
  driverLocation,
  extraMarkers,
  style,
  height = 200,
}) => {
  const [mapError, setMapError] = useState(false);

  // Calculate region to fit all markers with padding
  const initialRegion = useMemo(() => {
    const allPoints = [origin, destination];
    if (driverLocation) allPoints.push(driverLocation);
    if (extraMarkers) allPoints.push(...extraMarkers);

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLng = Infinity;
    let maxLng = -Infinity;

    for (const p of allPoints) {
      if (p.latitude < minLat) minLat = p.latitude;
      if (p.latitude > maxLat) maxLat = p.latitude;
      if (p.longitude < minLng) minLng = p.longitude;
      if (p.longitude > maxLng) maxLng = p.longitude;
    }

    const latDelta = Math.max(0.01, (maxLat - minLat) * 1.5);
    const lngDelta = Math.max(0.01, (maxLng - minLng) * 1.5);

    return {
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: latDelta,
      longitudeDelta: lngDelta,
    };
  }, [origin, destination, driverLocation, extraMarkers]);

  const distance = useMemo(
    () => haversineDistance(origin, destination).toFixed(1),
    [origin, destination],
  );

  // ── Open external maps ────────────────────────────
  const openExternalMaps = useCallback(() => {
    const q = encodeURIComponent(destination.label);
    const url =
      Platform.OS === 'ios'
        ? `maps:0,0?q=${q}`
        : `geo:0,0?q=${q}`;
    Linking.openURL(url).catch(() =>
      Linking.openURL(
        `https://maps.google.com/?q=${destination.latitude},${destination.longitude}`,
      ),
    );
  }, [destination]);

  // ── Fallback UI ───────────────────────────────────
  const renderFallback = () => (
    <View style={[styles.fallback, { height }, style]}>
      <Text style={styles.fallbackIcon}>🗺️</Text>
      <View style={styles.fallbackInfo}>
        <View style={styles.fallbackRow}>
          <Text style={styles.fallbackEmoji}>🏭</Text>
          <Text style={styles.fallbackLabel} numberOfLines={1}>
            {origin.label}
          </Text>
        </View>
        <View style={styles.fallbackDivider}>
          <Text style={styles.fallbackDistance}>~{distance} mi</Text>
        </View>
        <View style={styles.fallbackRow}>
          <Text style={styles.fallbackEmoji}>📍</Text>
          <Text style={styles.fallbackLabel} numberOfLines={1}>
            {destination.label}
          </Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.navBtn}
        activeOpacity={0.7}
        onPress={openExternalMaps}
      >
        <Text style={styles.navBtnText}>🧭  Navigate</Text>
      </TouchableOpacity>
    </View>
  );

  // If MapView is not available or has errored, show fallback
  if (!MapView || !Marker || mapError) {
    return renderFallback();
  }

  // ── Map UI ────────────────────────────────────────
  return (
    <View style={[styles.container, { height }, style]}>
      <MapView
        style={styles.map}
        initialRegion={initialRegion}
        onMapReady={() => {}}
        onError={() => setMapError(true)}
        pitchEnabled={false}
        rotateEnabled={false}
        toolbarEnabled={false}
      >
        {/* Origin (warehouse) marker */}
        <Marker
          coordinate={{ latitude: origin.latitude, longitude: origin.longitude }}
          title="Warehouse"
          description={origin.label}
          pinColor="#2196F3"
        />

        {/* Destination (customer) marker */}
        <Marker
          coordinate={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
          title="Customer"
          description={destination.label}
          pinColor="#E74C3C"
        />

        {/* Driver marker */}
        {driverLocation && (
          <Marker
            coordinate={{
              latitude: driverLocation.latitude,
              longitude: driverLocation.longitude,
            }}
            title="Driver"
            description={driverLocation.label}
            pinColor="#27AE60"
          />
        )}

        {/* Extra markers (admin multi-delivery view) */}
        {extraMarkers?.map((m) => (
          <Marker
            key={m.id}
            coordinate={{ latitude: m.latitude, longitude: m.longitude }}
            title={m.label}
            description={m.subtitle}
            pinColor="#27AE60"
          />
        ))}
      </MapView>

      {/* Navigate button overlay */}
      <TouchableOpacity
        style={styles.navOverlay}
        activeOpacity={0.8}
        onPress={openExternalMaps}
      >
        <Text style={styles.navOverlayText}>🧭 Navigate</Text>
      </TouchableOpacity>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    ...Shadows.sm,
  },
  map: {
    flex: 1,
  },

  // Navigate overlay on map
  navOverlay: {
    position: 'absolute',
    bottom: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    ...Shadows.md,
  },
  navOverlayText: { fontSize: 12, fontWeight: '700', color: Colors.primary },

  // Fallback card
  fallback: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: { fontSize: 28, marginBottom: Spacing.sm },
  fallbackInfo: { width: '100%', marginBottom: Spacing.md },
  fallbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  fallbackEmoji: { fontSize: 16, marginRight: Spacing.sm },
  fallbackLabel: { flex: 1, fontSize: 13, color: Colors.textSecondary },
  fallbackDivider: {
    borderLeftWidth: 2,
    borderLeftColor: Colors.border,
    marginLeft: 8,
    paddingLeft: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  fallbackDistance: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  navBtn: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  navBtnText: { fontSize: 13, fontWeight: '700', color: Colors.white },
});

export default DeliveryMapView;
