// ============================================================
// FINMATRIX - Step Indicator Component
// Segmented progress bar with step count + label.
// Used in CompanyRegistration, CreateCompany, and any wizard.
// ============================================================
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '../theme';

interface StepIndicatorProps {
  totalSteps: number;
  currentStep: number;
  labels?: string[];
  accentColor?: string;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  totalSteps, currentStep, labels, accentColor = Colors.primary,
}) => {
  const currentLabel = labels?.[currentStep - 1];

  return (
    <View style={s.container}>
      <View style={s.headerRow}>
        <Text style={s.stepCount}>
          Step {currentStep}<Text style={s.stepCountTotal}> of {totalSteps}</Text>
        </Text>
        {currentLabel && (
          <Text style={[s.stepName, { color: accentColor }]} numberOfLines={1}>{currentLabel}</Text>
        )}
      </View>
      <View style={s.segmentRow}>
        {Array.from({ length: totalSteps }, (_, i) => {
          const num = i + 1;
          const completed = num < currentStep;
          const active = num === currentStep;
          return (
            <View
              key={i}
              style={[
                s.segment,
                completed && { backgroundColor: accentColor },
                active && { backgroundColor: accentColor + '50' },
                !completed && !active && s.segmentInactive,
                i < totalSteps - 1 && { marginRight: 3 },
              ]}
            />
          );
        })}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  stepCount: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.semiBold, color: Colors.textPrimary },
  stepCountTotal: { fontFamily: Typography.fontFamily.regular, color: Colors.textTertiary },
  stepName: { fontSize: Typography.fontSize.bodySmall, fontFamily: Typography.fontFamily.medium, maxWidth: '60%' as any },
  segmentRow: { flexDirection: 'row', alignItems: 'center' },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  segmentInactive: { backgroundColor: Colors.border },
});

export default StepIndicator;
