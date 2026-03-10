import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Alert,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';

// ─── Types ──────────────────────────────────────────────────
type UserRole = 'admin' | 'manager' | 'accountant' | 'viewer';
type UserStatus = 'active' | 'invited' | 'disabled';

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  avatarInitials: string;
  lastActive?: string;
  isCurrentUser?: boolean;
}

// ─── Dummy Users ────────────────────────────────────────────
const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr_001',
    name: 'Alex Morgan',
    email: 'alex.morgan@finmatrix.io',
    role: 'admin',
    status: 'active',
    avatarInitials: 'AM',
    lastActive: '2026-03-03',
    isCurrentUser: true,
  },
  {
    id: 'usr_002',
    name: 'Sarah Chen',
    email: 'sarah.chen@finmatrix.io',
    role: 'manager',
    status: 'active',
    avatarInitials: 'SC',
    lastActive: '2026-03-02',
  },
  {
    id: 'usr_003',
    name: 'James Wilson',
    email: 'james.w@finmatrix.io',
    role: 'accountant',
    status: 'active',
    avatarInitials: 'JW',
    lastActive: '2026-03-01',
  },
  {
    id: 'usr_004',
    name: 'Priya Patel',
    email: 'priya.p@finmatrix.io',
    role: 'viewer',
    status: 'invited',
    avatarInitials: 'PP',
  },
  {
    id: 'usr_005',
    name: 'Tom Baker',
    email: 'tom.b@finmatrix.io',
    role: 'accountant',
    status: 'disabled',
    avatarInitials: 'TB',
    lastActive: '2026-01-15',
  },
];

const ROLES: UserRole[] = ['admin', 'manager', 'accountant', 'viewer'];

const ROLE_CONFIG: Record<UserRole, { label: string; color: string; bg: string }> = {
  admin: { label: 'Admin', color: Colors.danger, bg: Colors.dangerLight },
  manager: { label: 'Manager', color: Colors.primary, bg: Colors.primary + '14' },
  accountant: { label: 'Accountant', color: Colors.success, bg: Colors.successLight },
  viewer: { label: 'Viewer', color: Colors.textSecondary, bg: Colors.background },
};

const STATUS_CONFIG: Record<UserStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: Colors.success },
  invited: { label: 'Invited', color: Colors.warning },
  disabled: { label: 'Disabled', color: Colors.textTertiary },
};

// ─── Main Component ─────────────────────────────────────────
const UserManagementScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [users, setUsers] = useState<AppUser[]>(INITIAL_USERS);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('viewer');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');

  const filteredUsers = useMemo(
    () => (filterRole === 'all' ? users : users.filter((u) => u.role === filterRole)),
    [users, filterRole],
  );

  const counts = useMemo(() => {
    const active = users.filter((u) => u.status === 'active').length;
    const invited = users.filter((u) => u.status === 'invited').length;
    return { total: users.length, active, invited };
  }, [users]);

  // ── Invite ─────────────
  const handleInvite = () => {
    if (!inviteEmail.trim() || !inviteEmail.includes('@')) {
      Alert.alert('Validation', 'Please enter a valid email address.');
      return;
    }
    if (users.some((u) => u.email.toLowerCase() === inviteEmail.toLowerCase())) {
      Alert.alert('Duplicate', 'A user with this email already exists.');
      return;
    }
    const initials = inviteEmail.slice(0, 2).toUpperCase();
    const newUser: AppUser = {
      id: `usr_${Date.now()}`,
      name: inviteEmail.split('@')[0].replace(/[._]/g, ' '),
      email: inviteEmail.toLowerCase(),
      role: inviteRole,
      status: 'invited',
      avatarInitials: initials,
    };
    setUsers([...users, newUser]);
    setInviteEmail('');
    setInviteRole('viewer');
    setShowInvite(false);
    Alert.alert('Invitation Sent', `Invite sent to ${newUser.email} as ${ROLE_CONFIG[inviteRole].label}.`);
  };

  // ── Role Change ────────
  const handleRoleChange = (user: AppUser) => {
    if (user.isCurrentUser) {
      Alert.alert('Restricted', 'You cannot change your own role.');
      return;
    }
    const currentIdx = ROLES.indexOf(user.role);
    const nextRole = ROLES[(currentIdx + 1) % ROLES.length];
    setUsers(users.map((u) => (u.id === user.id ? { ...u, role: nextRole } : u)));
  };

  // ── Toggle Status ──────
  const handleToggleStatus = (user: AppUser) => {
    if (user.isCurrentUser) {
      Alert.alert('Restricted', 'You cannot disable your own account.');
      return;
    }
    const newStatus: UserStatus = user.status === 'disabled' ? 'active' : 'disabled';
    Alert.alert(
      newStatus === 'disabled' ? 'Disable User' : 'Enable User',
      `${newStatus === 'disabled' ? 'Disable' : 'Re-enable'} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          style: newStatus === 'disabled' ? 'destructive' : 'default',
          onPress: () => setUsers(users.map((u) => (u.id === user.id ? { ...u, status: newStatus } : u))),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>User Management</Text>
        <TouchableOpacity onPress={() => setShowInvite(true)} style={styles.addBtn}>
          <Text style={styles.addText}>+ Invite</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryCount}>{counts.total}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={[styles.summaryDot, { backgroundColor: Colors.success }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: Colors.success }]}>{counts.active}</Text>
          <Text style={styles.summaryLabel}>Active</Text>
        </View>
        <View style={[styles.summaryDot, { backgroundColor: Colors.warning }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryCount, { color: Colors.warning }]}>{counts.invited}</Text>
          <Text style={styles.summaryLabel}>Invited</Text>
        </View>
      </View>

      {/* Role Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
        {(['all', ...ROLES] as const).map((r) => {
          const active = filterRole === r;
          return (
            <TouchableOpacity
              key={r}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilterRole(r)}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {r === 'all' ? 'All' : ROLE_CONFIG[r].label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* User List */}
      <ScrollView style={styles.list} showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContent}>
        {filteredUsers.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        )}

        {filteredUsers.map((user) => {
          const roleConf = ROLE_CONFIG[user.role];
          const statusConf = STATUS_CONFIG[user.status];

          return (
            <View key={user.id} style={styles.userCard}>
              {/* Avatar */}
              <View style={[styles.avatar, { backgroundColor: roleConf.bg }]}>
                <Text style={[styles.avatarText, { color: roleConf.color }]}>{user.avatarInitials}</Text>
              </View>

              {/* Info */}
              <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.userName}>{user.name}</Text>
                  {user.isCurrentUser && (
                    <View style={styles.youBadge}>
                      <Text style={styles.youBadgeText}>You</Text>
                    </View>
                  )}
                </View>
                <Text style={styles.userEmail}>{user.email}</Text>
                <View style={styles.metaRow}>
                  {/* Role Badge */}
                  <TouchableOpacity
                    style={[styles.roleBadge, { backgroundColor: roleConf.bg }]}
                    onPress={() => handleRoleChange(user)}
                    activeOpacity={user.isCurrentUser ? 1 : 0.6}
                  >
                    <Text style={[styles.roleBadgeText, { color: roleConf.color }]}>{roleConf.label}</Text>
                  </TouchableOpacity>
                  {/* Status Dot */}
                  <TouchableOpacity
                    style={styles.statusWrap}
                    onPress={() => handleToggleStatus(user)}
                    activeOpacity={user.isCurrentUser ? 1 : 0.6}
                  >
                    <View style={[styles.statusDot, { backgroundColor: statusConf.color }]} />
                    <Text style={[styles.statusText, { color: statusConf.color }]}>{statusConf.label}</Text>
                  </TouchableOpacity>
                  {user.lastActive && (
                    <Text style={styles.lastActive}>Last: {user.lastActive}</Text>
                  )}
                </View>
              </View>
            </View>
          );
        })}
        <View style={{ height: Spacing.huge }} />
      </ScrollView>

      {/* ── Invite Modal ─────────────────── */}
      <Modal visible={showInvite} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invite User</Text>

            <Text style={styles.modalLabel}>Email Address</Text>
            <TextInput
              style={styles.modalInput}
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="user@company.com"
              placeholderTextColor={Colors.placeholder}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Text style={styles.modalLabel}>Role</Text>
            <View style={styles.roleGrid}>
              {ROLES.map((r) => {
                const conf = ROLE_CONFIG[r];
                const selected = inviteRole === r;
                return (
                  <TouchableOpacity
                    key={r}
                    style={[
                      styles.roleOption,
                      selected && { borderColor: conf.color, backgroundColor: conf.bg },
                    ]}
                    onPress={() => setInviteRole(r)}
                  >
                    <Text style={[styles.roleOptionText, selected && { color: conf.color, fontWeight: '700' }]}>
                      {conf.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => {
                  setShowInvite(false);
                  setInviteEmail('');
                  setInviteRole('viewer');
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSendBtn} onPress={handleInvite}>
                <Text style={styles.modalSendText}>Send Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    paddingTop: SAFE_TOP_PADDING,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: { marginRight: Spacing.md },
  backText: { fontSize: 16, color: Colors.primary, fontWeight: '600' },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  addBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  addText: { fontSize: 14, fontWeight: '600', color: Colors.white },

  // Summary
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  summaryItem: { alignItems: 'center', paddingHorizontal: Spacing.lg },
  summaryCount: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary },
  summaryLabel: { fontSize: 11, color: Colors.textTertiary, marginTop: 2 },
  summaryDot: { width: 4, height: 4, borderRadius: 2 },

  // Filter
  filterRow: { maxHeight: 48, backgroundColor: Colors.white },
  filterContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: Spacing.sm },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: Spacing.sm,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  filterChipTextActive: { color: Colors.white },

  // List
  list: { flex: 1 },
  listContent: { padding: Spacing.base },

  // User Card
  userCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  avatarText: { fontSize: 16, fontWeight: '700' },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  userName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  youBadge: {
    marginLeft: Spacing.sm,
    paddingHorizontal: 6,
    paddingVertical: 1,
    backgroundColor: Colors.primary + '14',
    borderRadius: BorderRadius.xs,
  },
  youBadgeText: { fontSize: 10, fontWeight: '700', color: Colors.primary },
  userEmail: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.sm },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.sm },
  roleBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.xs,
  },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  statusWrap: { flexDirection: 'row', alignItems: 'center' },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 4 },
  statusText: { fontSize: 11, fontWeight: '600' },
  lastActive: { fontSize: 11, color: Colors.textTertiary },

  // Empty
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxxl },
  emptyIcon: { fontSize: 48, marginBottom: Spacing.md },
  emptyText: { fontSize: 16, color: Colors.textSecondary },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadows.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  modalInput: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  roleOption: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  roleOptionText: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  modalActions: {
    flexDirection: 'row',
    marginTop: Spacing.xl,
    gap: Spacing.md,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: 15, fontWeight: '600', color: Colors.textSecondary },
  modalSendBtn: {
    flex: 1,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    ...Shadows.sm,
  },
  modalSendText: { fontSize: 15, fontWeight: '600', color: Colors.white },
});

export default UserManagementScreen;
