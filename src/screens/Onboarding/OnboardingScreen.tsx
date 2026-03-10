import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions, Animated, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppContainer from '../../components/AppContainer';
import CustomButton from '../../Custom-Components/CustomButton';
import { Colors, Spacing, BorderRadius, Shadows } from '../../theme';
import { ROUTES } from '../../navigations-map/Base';

const { width } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Complete Accounting',
    desc: 'Full-featured accounting with COA, GL, AR/AP, Invoicing, Payroll, and Reporting — everything from Peachtree and QuickBooks, reimagined.',
    gradient: [Colors.primary, '#1e4976'] as const,
    iconLetter: '$',
    features: ['General Ledger', 'AR/AP', 'Payroll'],
  },
  {
    id: '2',
    title: 'Real-Time Cloud Inventory',
    desc: 'Unlike traditional software, FinMatrix provides real-time cloud inventory. Every change syncs instantly across your entire team.',
    gradient: ['#00896F', Colors.secondary] as const,
    iconLetter: 'CI',
    features: ['Multi-Warehouse', 'Live Sync', 'Barcode'],
  },
  {
    id: '3',
    title: 'Smart Delivery Management',
    desc: 'Assign deliveries, capture digital signatures, get customer verification, and sync inventory — no more manual reconciliation.',
    gradient: ['#D84315', Colors.accent] as const,
    iconLetter: 'DM',
    features: ['Route Optimize', 'E-Signatures', 'Live Track'],
  },
  {
    id: '4',
    title: 'Secure & Scalable',
    desc: 'Enterprise-grade security with role-based access. Multi-agency cloud isolation. Scale from 1 to 1000+ users seamlessly.',
    gradient: ['#4A148C', '#7B1FA2'] as const,
    iconLetter: 'SS',
    features: ['Role Access', 'Encrypted', 'Multi-Tenant'],
  },
];

const OnboardingScreen = ({ navigation }: any) => {
  const [idx, setIdx] = useState(0);
  const ref = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const goNext = () => {
    if (idx < slides.length - 1) {
      ref.current?.scrollToIndex({ index: idx + 1 });
      setIdx(idx + 1);
    } else navigation.replace(ROUTES.WELCOME);
  };

  return (
    <AppContainer>
      <View style={s.container}>
        {/* Header */}
        <View style={s.header}>
          {idx < slides.length - 1 && (
            <TouchableOpacity
              onPress={() => navigation.replace(ROUTES.WELCOME)}
              style={s.skipBtn}
              activeOpacity={0.7}
            >
              <Text style={s.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Slides */}
        <FlatList
          ref={ref}
          data={slides}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onMomentumScrollEnd={(e) =>
            setIdx(Math.round(e.nativeEvent.contentOffset.x / width))
          }
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <View style={[s.slide, { width }]}>
              {/* Icon Composition */}
              <LinearGradient
                colors={item.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={s.iconOuter}
              >
                <View style={s.iconInner}>
                  <Text style={s.iconText}>{item.iconLetter}</Text>
                </View>
                {/* Decorative ring */}
                <View style={s.decorRing} />
              </LinearGradient>

              <Text style={s.title}>{item.title}</Text>
              <Text style={s.desc}>{item.desc}</Text>

              {/* Feature pills */}
              <View style={s.featureRow}>
                {item.features.map((f) => (
                  <View key={f} style={s.featurePill}>
                    <View style={s.featureDot} />
                    <Text style={s.featureText}>{f}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        />

        {/* Footer */}
        <View style={s.footer}>
          {/* Step indicator */}
          <View style={s.stepRow}>
            <View style={s.dots}>
              {slides.map((_, i) => (
                <Animated.View
                  key={i}
                  style={[
                    s.dot,
                    {
                      width: scrollX.interpolate({
                        inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                        outputRange: [8, 32, 8],
                        extrapolate: 'clamp',
                      }),
                      backgroundColor: scrollX.interpolate({
                        inputRange: [(i - 1) * width, i * width, (i + 1) * width],
                        outputRange: [Colors.border, Colors.primary, Colors.border],
                        extrapolate: 'clamp',
                      }),
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={s.stepCount}>{idx + 1}/{slides.length}</Text>
          </View>

          <CustomButton
            title={idx === slides.length - 1 ? 'Get Started' : 'Continue'}
            onPress={goNext}
            size="large"
          />
        </View>
      </View>
    </AppContainer>
  );
};

const s = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.base,
  },
  skipBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.3,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 36,
  },
  iconOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 36,
  },
  iconInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 2,
  },
  decorRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: -0.3,
  },
  desc: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  featurePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  featureDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.secondary,
    marginRight: 6,
  },
  featureText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    letterSpacing: 0.2,
  },
  footer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: 32,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  stepCount: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
});

export default OnboardingScreen;
