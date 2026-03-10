// ============================================================
// FINMATRIX - Splash Screen (Redesigned)
// Improvements:
//  • Removed fake progress bar — uses subtle pulse animation
//  • Cleaner logo treatment with proper typography
//  • Themed background with subtle radial glow
//  • Security tagline in footer
// ============================================================
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../theme';
import { useAuth } from '../../hooks/useReduxHooks';
import { ROUTES } from '../../navigations-map/Base';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  navigation: any;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ navigation }) => {
  const { isAuthenticated, selectedRole, isOnboarded } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const footerFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo entrance
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    // Subtle pulse while loading
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ]),
    ).start();

    // Footer fade in delayed
    Animated.timing(footerFade, { toValue: 1, duration: 400, delay: 800, useNativeDriver: true }).start();

    // Navigate after splash
    const timer = setTimeout(() => {
      if (isAuthenticated && selectedRole) {
        navigation.replace(selectedRole === 'administrator' ? ROUTES.ADMIN_TABS : ROUTES.DP_TABS);
      } else if (isAuthenticated) {
        navigation.replace(ROUTES.WELCOME);
      } else if (!isOnboarded) {
        navigation.replace(ROUTES.ONBOARDING);
      } else {
        navigation.replace(ROUTES.WELCOME);
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={[Colors.primary, '#0D2137']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
      {/* Subtle radial glow */}
      <View style={styles.glowCircle} />

      {/* Logo */}
      <Animated.View
        style={[
          styles.logoContainer,
          { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
        ]}
      >
        <Animated.View style={[styles.logoMark, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.logoLetters}>FM</Text>
        </Animated.View>
        <Text style={styles.appName}>
          Fin<Text style={styles.appNameAccent}>Matrix</Text>
        </Text>
        <Text style={styles.tagline}>Real-Time Accounting for Moving Business</Text>
      </Animated.View>

      {/* Footer */}
      <Animated.View style={[styles.footer, { opacity: footerFade }]}>
        <Text style={styles.versionText}>v1.0.0</Text>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    position: 'absolute',
    width: width * 1.2,
    height: width * 1.2,
    borderRadius: width * 0.6,
    backgroundColor: 'rgba(255,255,255,0.03)',
    top: height * 0.15,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoMark: {
    width: 96,
    height: 96,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  logoLetters: {
    fontSize: 40,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -2,
  },
  appName: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  appNameAccent: {
    color: Colors.secondary,
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    marginTop: 8,
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 44,
    alignItems: 'center',
  },
  versionText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
  },
});

export default SplashScreen;