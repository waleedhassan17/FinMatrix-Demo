// ============================================================
// FINMATRIX - Status Timeline Component (Reusable)
// ============================================================
// Visual stepper: circle with number, label below, connecting
// lines between steps. Supports any ordered status list.
//
// Props:
//   steps   – array of { label: string }
//   current – 0-based index of the active step

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Step {
  label: string;
}

interface StatusTimelineProps {
  steps: Step[];
  current: number;
}

const COMPLETED = '#27AE60';
const ACTIVE = '#2E75B6';
const FUTURE = '#BDC3C7';
const FUTURE_BG = '#ECF0F1';

const StatusTimeline: React.FC<StatusTimelineProps> = ({ steps, current }) => {
  return (
    <View style={s.container}>
      {/* Circles + connecting lines */}
      <View style={s.row}>
        {steps.map((step, idx) => {
          const isCompleted = idx < current;
          const isActive = idx === current;

          // Circle styling
          const circleBg = isCompleted
            ? COMPLETED
            : isActive
            ? ACTIVE
            : FUTURE_BG;
          const circleBorder = isCompleted
            ? COMPLETED
            : isActive
            ? ACTIVE
            : FUTURE;
          const numberColor = isCompleted || isActive ? '#FFFFFF' : FUTURE;

          return (
            <React.Fragment key={idx}>
              {/* Connecting line before (except first) */}
              {idx > 0 && (
                <View
                  style={[
                    s.line,
                    {
                      backgroundColor: idx <= current ? COMPLETED : FUTURE,
                    },
                  ]}
                />
              )}
              {/* Circle */}
              <View
                style={[
                  s.circle,
                  {
                    backgroundColor: circleBg,
                    borderColor: circleBorder,
                  },
                  isActive && s.activeGlow,
                ]}
              >
                <Text style={[s.circleText, { color: numberColor }]}>
                  {isCompleted ? '✓' : idx + 1}
                </Text>
              </View>
            </React.Fragment>
          );
        })}
      </View>

      {/* Labels */}
      <View style={s.labelRow}>
        {steps.map((step, idx) => {
          const isCompleted = idx < current;
          const isActive = idx === current;
          return (
            <Text
              key={idx}
              style={[
                s.label,
                (isCompleted || isActive) && s.labelBold,
                isActive && { color: ACTIVE },
                isCompleted && { color: COMPLETED },
              ]}
              numberOfLines={2}
            >
              {step.label}
            </Text>
          );
        })}
      </View>
    </View>
  );
};

const CIRCLE_SIZE = 28;

const s = StyleSheet.create({
  container: {
    paddingVertical: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeGlow: {
    shadowColor: ACTIVE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
    elevation: 6,
  },
  circleText: {
    fontSize: 12,
    fontWeight: '700',
  },
  line: {
    flex: 1,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 2,
  },
  labelRow: {
    flexDirection: 'row',
    marginTop: 6,
  },
  label: {
    flex: 1,
    fontSize: 9,
    color: FUTURE,
    textAlign: 'center',
    fontWeight: '400',
  },
  labelBold: {
    fontWeight: '700',
  },
});

export default StatusTimeline;
