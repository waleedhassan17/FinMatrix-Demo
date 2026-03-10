// ============================================================
// FINMATRIX - Delivery Onboarding Screen (Redesigned)
// Improvements:
//  • Ionicons replace emoji illustrations
//  • Delivery accent color throughout
//  • Elongated pill dot indicators
//  • Consistent button styles matching other auth screens
//  • FlatList retained for smooth swipe
// ============================================================
import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Dimensions,
  TouchableOpacity, NativeSyntheticEvent, NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Typography, SAFE_TOP_PADDING } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';
import { useAppDispatch } from '../../hooks/useReduxHooks';
import { setOnboarded } from './authSlice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ACCENT = Colors.deliveryAccent;

interface Slide {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    icon: 'clipboard-outline',
    title: 'View Your Assignments',
    description:
      'See all your daily delivery assignments in one place. View customer details, addresses, item lists, and optimal routes — all organized for your shift.',
  },
  {
    id: '2',
    icon: 'checkmark-done-outline',
    title: 'Complete Deliveries',
    description:
      'Capture customer signatures, take photo proof, and confirm delivery on the spot. Everything is recorded and synced so the admin team sees updates in real time.',
  },
  {
    id: '3',
    icon: 'layers-outline',
    title: 'Update Inventory',
    description:
      'Use the shadow inventory system to report items delivered, returned, or damaged. Your updates go to admin for approval, keeping stock counts accurate.',
  },
];

const DeliveryOnboardingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(index);
  };

  const goNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const handleGetStarted = () => {
    dispatch(setOnboarded());
    navigation.reset({ index: 0, routes: [{ name: ROUTES.DELIVERY_MAIN }] });
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={s.slide}>
      <View style={s.illustrationContainer}>
        <Ionicons name={item.icon} size={56} color={ACCENT} />
      </View>
      <Text style={s.slideTitle}>{item.title}</Text>
      <Text style={s.slideDescription}>{item.description}</Text>
    </View>
  );

  return (
    <View style={s.container}>
      {/* Skip */}
      {!isLastSlide && (
        <TouchableOpacity style={s.skipBtn} onPress={handleGetStarted}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
        style={s.flatList}
      />

      {/* Dots */}
      <View style={s.dotsContainer}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[s.dot, i === currentIndex && s.dotActive]} />
        ))}
      </View>

      {/* Action Button */}
      <View style={s.bottomContainer}>
        {isLastSlide ? (
          <TouchableOpacity style={s.getStartedBtn} onPress={handleGetStarted} activeOpacity={0.85}>
            <Text style={s.getStartedText}>Get Started</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={s.nextBtn} onPress={goNext} activeOpacity={0.85}>
            <Text style={s.nextText}>Next</Text>
            <Ionicons name="arrow-forward" size={16} color={ACCENT} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, paddingTop: SAFE_TOP_PADDING },
  skipBtn: { position: 'absolute', top: SAFE_TOP_PADDING + Spacing.sm, right: Spacing.lg, zIndex: 10, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  skipText: { fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.medium, color: Colors.textTertiary },
  flatList: { flex: 1 },
  slide: { width: SCREEN_WIDTH, flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: Spacing.xl },
  illustrationContainer: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: ACCENT + '10',
    justifyContent: 'center', alignItems: 'center', marginBottom: Spacing.xl,
  },
  slideTitle: {
    fontSize: Typography.fontSize.h2, fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.md,
  },
  slideDescription: {
    fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, paddingHorizontal: Spacing.md,
  },
  dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', paddingVertical: Spacing.lg, gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.border },
  dotActive: { width: 28, backgroundColor: ACCENT, borderRadius: 4 },
  bottomContainer: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxl },
  nextBtn: {
    flexDirection: 'row', backgroundColor: ACCENT + '12',
    paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  nextText: { color: ACCENT, fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold },
  getStartedBtn: {
    flexDirection: 'row', backgroundColor: ACCENT,
    paddingVertical: Spacing.md + 2, borderRadius: BorderRadius.sm,
    alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
  },
  getStartedText: { color: Colors.white, fontSize: Typography.fontSize.body, fontFamily: Typography.fontFamily.semiBold },
});

export default DeliveryOnboardingScreen;