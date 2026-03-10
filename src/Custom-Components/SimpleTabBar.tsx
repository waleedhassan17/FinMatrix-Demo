// ============================================================
// FINMATRIX - Shared SimpleTabBar Component
// ============================================================
// Reusable tab bar used across detail screens.
// Supports two visual variants:
//   "underline" (default per spec) – bottom border on active tab
//   "pill"  – filled background on active tab

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';

export interface SimpleTabBarProps {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  accentColor?: string;
  /** "underline" = bottom-border active indicator (default).
   *  "pill"     = filled-background active indicator. */
  variant?: 'underline' | 'pill';
}

const SimpleTabBar: React.FC<SimpleTabBarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  accentColor = Colors.primary,
  variant = 'underline',
}) => {
  const isPill = variant === 'pill';

  return (
    <View
      style={[
        baseStyles.container,
        isPill ? pillStyles.container : underlineStyles.container,
      ]}
    >
      {tabs.map((tab) => {
        const isActive = tab === activeTab;
        return (
          <TouchableOpacity
            key={tab}
            style={[
              baseStyles.tab,
              isPill ? pillStyles.tab : underlineStyles.tab,
              isActive &&
                (isPill
                  ? { backgroundColor: accentColor }
                  : { borderBottomColor: accentColor }),
            ]}
            onPress={() => onTabChange(tab)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                baseStyles.tabText,
                isActive &&
                  (isPill
                    ? pillStyles.tabTextActive
                    : { color: accentColor, fontWeight: '700' as const }),
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

// ─── Shared base styles ──────────────────────────────────────
const baseStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

// ─── Underline variant (spec default) ────────────────────────
const underlineStyles = StyleSheet.create({
  container: {
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECF0',
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginBottom: Spacing.sm,
  },
  tab: {
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    paddingVertical: Spacing.md,
  },
});

// ─── Pill / fill variant ─────────────────────────────────────
const pillStyles = StyleSheet.create({
  container: {
    borderRadius: BorderRadius.md,
    padding: 4,
    marginBottom: Spacing.base,
  },
  tab: {
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  tabTextActive: {
    color: Colors.white,
  },
});

export default SimpleTabBar;
