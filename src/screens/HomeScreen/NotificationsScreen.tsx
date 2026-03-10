import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AppContainer from '../../components/AppContainer';
import { Colors, Spacing } from '../../theme';

const NotificationsScreen = () => {
  return (
    <AppContainer statusBarStyle="dark-content">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
        </View>

        <View style={styles.placeholder}>
          <Text style={styles.placeholderText}>🔔</Text>
          <Text style={styles.placeholderTitle}>Notification Center</Text>
          <Text style={styles.placeholderDesc}>
            You have 5 notifications
          </Text>
        </View>
      </View>
    </AppContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  placeholderDesc: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});

export default NotificationsScreen;
