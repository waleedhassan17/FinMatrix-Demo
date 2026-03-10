// ============================================================
// FINMATRIX - Company Switcher Header (Pill/Chip)
// ============================================================
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius } from '../theme';
import { useAppSelector } from '../hooks/useReduxHooks';
import { selectActiveCompany } from '../store/companySlice';
import { ROUTES } from '../navigations-map/Base';

const CompanySwitcherHeader: React.FC = () => {
  const navigation = useNavigation<any>();
  const activeCompany = useAppSelector(selectActiveCompany);

  if (!activeCompany) return null;

  return (
    <TouchableOpacity
      style={styles.pill}
      activeOpacity={0.7}
      onPress={() => navigation.navigate(ROUTES.COMPANY_SWITCHER)}
    >
      <Text style={styles.pillText} numberOfLines={1}>
        {activeCompany.name}
      </Text>
      <Text style={styles.pillArrow}>▼</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '12',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    maxWidth: '80%',
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: Spacing.xs,
    flexShrink: 1,
  },
  pillArrow: {
    fontSize: 10,
    color: Colors.primary,
  },
});

export default CompanySwitcherHeader;
