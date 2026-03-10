// ============================================================
// FINMATRIX - Company Detail Screen
// ============================================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';
import { useAppDispatch, useAppSelector } from '../../hooks/useReduxHooks';
import {
  removeMember,
  updateMemberRole,
  Company,
  CompanyMember,
} from '../../store/companySlice';

const CompanyDetailScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const dispatch = useAppDispatch();
  const { companyId } = route.params as { companyId: string };
  const company = useAppSelector((s) =>
    s.company.companies.find((c: Company) => c.companyId === companyId)
  );
  const { user } = useAppSelector((s) => s.auth);
  const [copiedToast, setCopiedToast] = useState(false);

  if (!company) {
    return (
      <View style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
        <Text style={styles.errorText}>Company not found</Text>
      </View>
    );
  }

  const currentUserMember = company.members.find(
    (m: CompanyMember) => m.userId === user?.uid
  );
  const isAdmin = currentUserMember?.role === 'administrator';

  const handleCopyCode = () => {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleRemoveMember = (member: CompanyMember) => {
    if (member.userId === user?.uid) {
      Alert.alert('Error', 'You cannot remove yourself.');
      return;
    }
    Alert.alert(
      'Remove Member',
      `Remove this member from ${company.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () =>
            dispatch(removeMember({ companyId, userId: member.userId })),
        },
      ]
    );
  };

  const handleToggleRole = (member: CompanyMember) => {
    if (member.userId === user?.uid) {
      Alert.alert('Error', 'You cannot change your own role.');
      return;
    }
    const newRole =
      member.role === 'administrator' ? 'delivery_personnel' : 'administrator';
    dispatch(
      updateMemberRole({
        companyId,
        userId: member.userId,
        role: newRole,
      })
    );
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'manufacturing':
        return { bg: Colors.infoLight, text: Colors.info };
      case 'supply':
        return { bg: Colors.successLight, text: Colors.success };
      case 'distribution':
        return { bg: Colors.warningLight, text: Colors.warning };
      default:
        return { bg: Colors.border, text: Colors.textSecondary };
    }
  };

  return (
    <View style={[styles.container, { paddingTop: SAFE_TOP_PADDING }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Company Details</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
      >
        {/* Company Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileIconCircle}>
            <Text style={styles.profileIcon}>🏢</Text>
          </View>
          <Text style={styles.companyName}>{company.name}</Text>
          <View style={styles.industryBadge}>
            <Text style={styles.industryBadgeText}>{company.industry}</Text>
          </View>

          {(company.address.street || company.address.city) && (
            <Text style={styles.addressText}>
              {[
                company.address.street,
                company.address.city,
                company.address.state,
                company.address.zipCode,
              ]
                .filter(Boolean)
                .join(', ')}
            </Text>
          )}

          {/* Invite Code */}
          <TouchableOpacity style={styles.inviteCodeRow} onPress={handleCopyCode}>
            <Text style={styles.inviteLabel}>Invite Code</Text>
            <View style={styles.inviteCodeBox}>
              <Text style={styles.inviteCodeText}>{company.inviteCode}</Text>
              <Text style={styles.copyIcon}>📋</Text>
            </View>
          </TouchableOpacity>
          {copiedToast && (
            <View style={styles.toast}>
              <Text style={styles.toastText}>Code copied!</Text>
            </View>
          )}
        </View>

        {/* Agencies Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Agencies ({company.agencies.length})
          </Text>
          {company.agencies.map((agency) => {
            const badgeColor = getTypeBadgeColor(agency.type);
            return (
              <View key={agency.agencyId} style={styles.agencyCard}>
                <View style={styles.agencyHeader}>
                  <Text style={styles.agencyName}>{agency.name}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: badgeColor.bg }]}>
                    <Text style={[styles.typeBadgeText, { color: badgeColor.text }]}>
                      {agency.type}
                    </Text>
                  </View>
                </View>
                <Text style={styles.agencyMeta}>
                  {agency.inventoryItems.length} items
                </Text>
              </View>
            );
          })}
          {company.agencies.length === 0 && (
            <Text style={styles.emptyText}>No agencies connected</Text>
          )}
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Members ({company.members.length})
          </Text>
          {company.members.map((member: CompanyMember) => (
            <View key={member.userId} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {(member.displayName || member.userId).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>
                    {member.displayName || member.userId}
                  </Text>
                  <Text style={styles.memberJoined}>
                    Joined {formatDate(member.joinedAt)}
                  </Text>
                </View>
              </View>
              <View style={styles.memberActions}>
                <TouchableOpacity
                  style={[
                    styles.roleBadge,
                    member.role === 'administrator'
                      ? styles.roleBadgeAdmin
                      : styles.roleBadgeDelivery,
                  ]}
                  onPress={() => isAdmin && handleToggleRole(member)}
                  disabled={!isAdmin}
                >
                  <Text
                    style={[
                      styles.roleBadgeText,
                      member.role === 'administrator'
                        ? styles.roleBadgeTextAdmin
                        : styles.roleBadgeTextDelivery,
                    ]}
                  >
                    {member.role === 'administrator' ? 'Admin' : 'Delivery'}
                  </Text>
                </TouchableOpacity>
                {isAdmin && member.userId !== user?.uid && (
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => handleRemoveMember(member)}
                  >
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Settings */}
        {isAdmin && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() =>
                navigation.navigate(ROUTES.COMPANY_PROFILE_EDIT, { companyId })
              }
            >
              <Text style={styles.settingsBtnIcon}>✏️</Text>
              <Text style={styles.settingsBtnText}>Edit Company Info</Text>
              <Text style={styles.settingsChevron}>›</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

import { ROUTES } from '../../navigations-map/Base';

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
  scrollContent: {
    flex: 1,
  },
  errorText: {
    fontSize: 16,
    color: Colors.danger,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },

  // Profile Card
  profileCard: {
    backgroundColor: Colors.white,
    margin: Spacing.base,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.md,
  },
  profileIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profileIcon: {
    fontSize: 32,
  },
  companyName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  industryBadge: {
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  industryBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  addressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  inviteCodeRow: {
    width: '100%',
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  inviteCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  inviteCodeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 4,
  },
  copyIcon: {
    fontSize: 18,
  },
  toast: {
    position: 'absolute',
    bottom: Spacing.sm,
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  toastText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },

  // Sections
  section: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.lg,
  },

  // Agency Cards
  agencyCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.sm,
  },
  agencyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  agencyName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  agencyMeta: {
    fontSize: 12,
    color: Colors.textSecondary,
  },

  // Member Cards
  memberCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.sm,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  memberAvatarText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '700',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  memberJoined: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  memberActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  roleBadgeAdmin: {
    backgroundColor: Colors.primary + '15',
  },
  roleBadgeDelivery: {
    backgroundColor: Colors.warningLight,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  roleBadgeTextAdmin: {
    color: Colors.primary,
  },
  roleBadgeTextDelivery: {
    color: Colors.warning,
  },
  removeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeBtnText: {
    color: Colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },

  // Settings
  settingsBtn: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    padding: Spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.sm,
  },
  settingsBtnIcon: {
    fontSize: 20,
  },
  settingsBtnText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  settingsChevron: {
    fontSize: 20,
    color: Colors.textTertiary,
  },
});

export default CompanyDetailScreen;
