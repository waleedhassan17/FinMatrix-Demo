// ============================================================
// FINMATRIX - App Container (Safe Area Wrapper)
// ============================================================
import React from 'react';
import { SafeAreaView, StatusBar, StyleSheet, ViewStyle, KeyboardAvoidingView, Platform, ScrollView, View, Text } from 'react-native';
import { Colors, SAFE_TOP_PADDING } from '../theme';

/** Set to false when connecting real APIs to hide the demo banner. */
const IS_DEMO = true;

interface AppContainerProps {
  children: React.ReactNode;
  backgroundColor?: string;
  statusBarStyle?: 'light-content' | 'dark-content';
  scrollable?: boolean;
  style?: ViewStyle;
}

const AppContainer: React.FC<AppContainerProps> = ({
  children, backgroundColor = Colors.white, statusBarStyle = 'dark-content', scrollable = false, style,
}) => {
  return (
    <SafeAreaView style={[styles.container, { backgroundColor }, style]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={backgroundColor} />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scrollable ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
      {IS_DEMO && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBannerText}>🔧 Demo Mode — Using local dummy data</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: Platform.OS === 'android' ? SAFE_TOP_PADDING : 0 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  demoBanner: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 6,
    alignItems: 'center',
  },
  demoBannerText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
});

export default AppContainer;
