// ============================================================
// FINMATRIX - App Logo Component (Professional)
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme';

interface AppLogoProps {
  size?: 'small' | 'medium' | 'large';
  showTagline?: boolean;
  light?: boolean;
}

const AppLogo: React.FC<AppLogoProps> = ({ size = 'medium', showTagline = false, light = false }) => {
  const sizes = {
    small: { icon: 40, text: 20, tagline: 11, bar: 3 },
    medium: { icon: 56, text: 28, tagline: 13, bar: 4 },
    large: { icon: 76, text: 38, tagline: 15, bar: 5 },
  };
  const s = sizes[size];
  const textColor = light ? Colors.white : Colors.primary;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[Colors.primary, Colors.secondary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.iconContainer, { width: s.icon, height: s.icon, borderRadius: s.icon * 0.22 }]}
      >
        <View style={[styles.iconInner, { width: s.icon - 4, height: s.icon - 4, borderRadius: (s.icon - 4) * 0.2 }]}>
          <Text style={[styles.iconLetter, { fontSize: s.icon * 0.32 }]}>F</Text>
          <View style={[styles.iconBar, { height: s.bar, width: s.icon * 0.32 }]} />
          <Text style={[styles.iconLetter, { fontSize: s.icon * 0.32 }]}>M</Text>
        </View>
      </LinearGradient>
      <Text style={[styles.appName, { fontSize: s.text, color: textColor }]}>
        Fin<Text style={[styles.matrixText, light && { color: 'rgba(255,255,255,0.85)' }]}>Matrix</Text>
      </Text>
      {showTagline && (
        <Text style={[styles.tagline, { fontSize: s.tagline, color: light ? 'rgba(255,255,255,0.6)' : Colors.textSecondary }]}>
          Enterprise Accounting & Delivery Platform
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { alignItems: 'center' },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconInner: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconLetter: {
    color: Colors.white,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  iconBar: {
    backgroundColor: Colors.secondary,
    borderRadius: 2,
    marginHorizontal: 3,
  },
  appName: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  matrixText: {
    color: Colors.secondary,
  },
  tagline: {
    marginTop: 6,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    fontSize: 11,
  },
});

export default AppLogo;
