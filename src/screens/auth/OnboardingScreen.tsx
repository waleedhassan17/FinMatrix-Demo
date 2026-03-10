// ============================================================
// FINMATRIX - Onboarding Carousel (Redesigned)
// Improvements:
//  • Replaced emoji icons with Ionicons in styled containers
//  • Elongated pill dots instead of circles
//  • Better role preview cards on last slide
//  • Consistent typography and spacing
//  • Dot navigation preserved
// ============================================================
import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { setOnboarded } from './authSlice';

const { width } = Dimensions.get('window');

interface SlideData {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  color: string;
}

const SLIDES: SlideData[] = [
  {
    icon: 'cube-outline',
    title: 'Real-Time Inventory Control',
    description:
      'Your stock levels update the moment items are delivered, not when paperwork reaches the office.',
    color: Colors.primary,
  },
  {
    icon: 'document-text-outline',
    title: 'Proof of Delivery Built-In',
    description:
      'Capture customer signatures, delivery photos, and GPS location automatically. No disputes, full accountability.',
    color: Colors.secondary,
  },
  {
    icon: 'bar-chart-outline',
    title: 'Admin Control & Oversight',
    description:
      'Administrators maintain complete oversight with daily review dashboards and secure cloud exports.',
    color: Colors.accent,
  },
  {
    icon: 'rocket-outline',
    title: 'Choose Your Role',
    description:
      'Whether you manage the books or make the deliveries, FinMatrix has you covered.',
    color: Colors.primary,
  },
];

interface OnboardingProps {
  navigation: any;
}

const OnboardingScreen: React.FC<OnboardingProps> = ({ navigation }) => {
  const dispatch = useAppDispatch();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      scrollRef.current?.scrollTo({ x: (currentIndex + 1) * width, animated: true });
    } else {
      handleGetStarted();
    }
  };

  const handleGetStarted = () => {
    dispatch(setOnboarded());
    navigation.replace('SignIn');
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <View style={styles.container}>
      {/* Skip */}
      {!isLastSlide && (
        <TouchableOpacity style={styles.skipButton} onPress={handleGetStarted}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, index) => (
          <View key={index} style={styles.slide}>
            <View style={styles.slideContent}>
              {/* Icon Container */}
              <View style={[styles.iconCircle, { backgroundColor: slide.color + '10' }]}>
                <Ionicons name={slide.icon} size={52} color={slide.color} />
              </View>

              <Text style={styles.slideTitle}>{slide.title}</Text>
              <Text style={styles.slideDescription}>{slide.description}</Text>

              {/* Last slide — role preview */}
              {index === SLIDES.length - 1 && (
                <View style={styles.rolePreview}>
                  <View style={styles.miniRoleCard}>
                    <View style={[styles.miniRoleIcon, { backgroundColor: Colors.primary + '10' }]}>
                      <Ionicons name="shield-checkmark-outline" size={24} color={Colors.primary} />
                    </View>
                    <Text style={styles.miniRoleTitle}>Administrator</Text>
                    <Text style={styles.miniRoleSubtitle}>Full Control Access</Text>
                  </View>
                  <View style={styles.miniRoleCard}>
                    <View style={[styles.miniRoleIcon, { backgroundColor: Colors.deliveryAccent + '10' }]}>
                      <Ionicons name="car-outline" size={24} color={Colors.deliveryAccent} />
                    </View>
                    <Text style={styles.miniRoleTitle}>Delivery</Text>
                    <Text style={styles.miniRoleSubtitle}>Field Operations</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Bottom Controls */}
      <View style={styles.bottomContainer}>
        {/* Pagination Dots */}
        <View style={styles.dotsContainer}>
          {SLIDES.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => scrollRef.current?.scrollTo({ x: index * width, animated: true })}
            >
              <View style={[styles.dot, currentIndex === index && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Button */}
        <TouchableOpacity
          style={[styles.nextButton, isLastSlide && styles.getStartedButton]}
          onPress={handleNext}
          activeOpacity={0.85}
        >
          <Text style={[styles.nextButtonText, isLastSlide && styles.getStartedButtonText]}>
            {isLastSlide ? 'Get Started' : 'Next'}
          </Text>
          {!isLastSlide && (
            <Ionicons name="arrow-forward" size={18} color={Colors.primary} style={{ marginLeft: 6 }} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white },
  skipButton: {
    position: 'absolute',
    top: SAFE_TOP_PADDING,
    right: 24,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textTertiary,
  },
  slide: {
    width,
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  slideContent: { alignItems: 'center', paddingTop: 60 },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    fontSize: 24,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  slideDescription: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  rolePreview: { flexDirection: 'row', gap: 16, marginTop: 32 },
  miniRoleCard: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    alignItems: 'center',
    width: (width - 80) / 2,
    ...Shadows.sm,
  },
  miniRoleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  miniRoleTitle: {
    fontSize: 14,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  miniRoleSubtitle: {
    fontSize: 12,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
  },
  bottomContainer: { paddingHorizontal: Spacing.lg, paddingBottom: 48, alignItems: 'center' },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 28, gap: 6 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 28,
    backgroundColor: Colors.primary,
  },
  nextButton: {
    flexDirection: 'row',
    width: '100%',
    paddingVertical: 16,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: Typography.fontSize.body,
    fontFamily: Typography.fontFamily.semiBold,
    color: Colors.primary,
  },
  getStartedButton: {
    backgroundColor: Colors.primary,
  },
  getStartedButtonText: {
    color: Colors.white,
  },
});

export default OnboardingScreen;