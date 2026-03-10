// ============================================================
// FINMATRIX - Company Switcher Screen
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, Typography, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  switchCompany,
  deleteCompany,
  selectActiveCompanyId,
  selectUserCompanies,
  Company,
} from '../../store/companySlice';
import { ROUTES } from '../../navigations-map/Base';

const CompanySwitcherScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useAppDispatch();
  const companies = useAppSelector(selectUserCompanies);
  const activeCompanyId = useAppSelector(selectActiveCompanyId);
  const [optionsCompany, setOptionsCompany] = useState<Company | null>(null);

  const handleSelectCompany = (companyId: string) => {
    dispatch(switchCompany(companyId));
    navigation.goBack();
  };

  const handleLongPress = (company: Company) => {
    setOptionsCompany(company);
  };

  const handleDeleteCompany = (company: Company) => {
    setOptionsCompany(null);
    Alert.alert(
      'Delete Company',
      `Are you sure you want to delete "${company.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => dispatch(deleteCompany(company.companyId)),
        },
      ]
    );
  };

  const handleShareInviteCode = (company: Company) => {
    setOptionsCompany(null);
    Alert.alert(
      'Invite Code',
      `Share this code to invite others:\n\n${company.inviteCode}`,
      [{ text: 'OK' }]
    );
  };

  const handleViewDetail = (company: Company) => {
    setOptionsCompany(null);
    navigation.navigate(ROUTES.COMPANY_DETAIL, { companyId: company.companyId });
  };

  const formatLastAccessed = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getIndustryColor = (industry: string) => {
    switch (industry) {
      case 'Manufacturing': return { bg: Colors.infoLight, text: Colors.info };
      case 'Supply Chain': return { bg: Colors.successLight, text: Colors.success };
      case 'Distribution': return { bg: Colors.warningLight, text: Colors.warning };
      case 'Retail': return { bg: '#F3E8FF', text: '#7C3AED' };
      case 'Services': return { bg: '#FFF1F2', text: '#E11D48' };
      default: return { bg: Colors.border, text: Colors.textSecondary };
    }
  };

  const renderCompanyCard = ({ item }: { item: Company }) => {
    const isActive = item.companyId === activeCompanyId;
    const industryColor = getIndustryColor(item.industry);

    return (
      <TouchableOpacity
        style={[styles.companyCard, isActive && styles.companyCardActive]}
        activeOpacity={0.7}
        onPress={() => handleSelectCompany(item.companyId)}
        onLongPress={() => handleLongPress(item)}
      >
        <View style={styles.cardRow}>
          <View style={styles.cardInfo}>
            <Text style={styles.companyName}>{item.name}</Text>
            <View style={[styles.industryBadge, { backgroundColor: industryColor.bg }]}>
              <Text style={[styles.industryBadgeText, { color: industryColor.text }]}>
                {item.industry}
              </Text>
            </View>
          </View>
          {isActive && (
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>Active</Text>
            </View>
          )}
        </View>

        <View style={styles.cardMeta}>
          <Text style={styles.metaText}>
            {item.members.length} member{item.members.length !== 1 ? 's' : ''}
          </Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>
            {item.agencies.length} agenc{item.agencies.length !== 1 ? 'ies' : 'y'}
          </Text>
          <View style={styles.metaDot} />
          <Text style={styles.metaText}>
            {formatLastAccessed(item.lastAccessedAt)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Companies</Text>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => navigation.navigate(ROUTES.CREATE_COMPANY)}
        >
          <Text style={styles.newBtnText}>+ New</Text>
        </TouchableOpacity>
      </View>

      {/* Company List */}
      <FlatList
        data={companies}
        keyExtractor={(item) => item.companyId}
        renderItem={renderCompanyCard}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <TouchableOpacity
            style={styles.newCompanyCard}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(ROUTES.CREATE_COMPANY)}
          >
            <Text style={styles.newCompanyIcon}>+</Text>
            <Text style={styles.newCompanyText}>Create New Company</Text>
          </TouchableOpacity>
        }
      />

      {/* Options Modal */}
      <Modal
        transparent
        visible={!!optionsCompany}
        animationType="fade"
        onRequestClose={() => setOptionsCompany(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setOptionsCompany(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>{optionsCompany?.name}</Text>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => optionsCompany && handleViewDetail(optionsCompany)}
            >
              <Text style={styles.modalOptionIcon}>📋</Text>
              <Text style={styles.modalOptionText}>View Details</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => optionsCompany && handleShareInviteCode(optionsCompany)}
            >
              <Text style={styles.modalOptionIcon}>🔗</Text>
              <Text style={styles.modalOptionText}>Share Invite Code</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalOption, styles.modalOptionDanger]}
              onPress={() => optionsCompany && handleDeleteCompany(optionsCompany)}
            >
              <Text style={styles.modalOptionIcon}>🗑️</Text>
              <Text style={[styles.modalOptionText, { color: Colors.danger }]}>Delete Company</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  backBtn: {
    padding: Spacing.sm,
  },
  backBtnText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  newBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  newBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  list: {
    padding: Spacing.base,
    paddingBottom: Spacing.xxl,
  },
  companyCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: 'transparent',
    ...Shadows.md,
  },
  companyCardActive: {
    borderLeftColor: Colors.primary,
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  cardInfo: {
    flex: 1,
    marginRight: Spacing.md,
  },
  companyName: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  industryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
    alignSelf: 'flex-start',
  },
  industryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  activeBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.textTertiary,
    marginHorizontal: Spacing.sm,
  },
  newCompanyCard: {
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  newCompanyIcon: {
    fontSize: 28,
    fontWeight: '300',
    color: Colors.primary,
    marginBottom: Spacing.xs,
  },
  newCompanyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.lg,
    borderTopRightRadius: BorderRadius.lg,
    paddingBottom: Spacing.xxl,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.base,
    marginBottom: Spacing.base,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalOptionDanger: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  modalOptionIcon: {
    fontSize: 20,
  },
  modalOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});

export default CompanySwitcherScreen;
