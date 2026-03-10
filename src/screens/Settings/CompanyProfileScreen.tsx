import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Shadows, SAFE_TOP_PADDING } from '../../theme';

// ─── Industry Options ───────────────────────────────────────
const INDUSTRIES = [
  'Retail',
  'Wholesale',
  'Manufacturing',
  'Technology',
  'Healthcare',
  'Construction',
  'Food & Beverage',
  'Professional Services',
  'Transportation',
  'Other',
];

// ─── Main Component ─────────────────────────────────────────
const CompanyProfileScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const [companyName, setCompanyName] = useState('FinMatrix Demo Corp');
  const [address, setAddress] = useState('123 Finance Avenue\nSuite 400\nNew York, NY 10001');
  const [phone, setPhone] = useState('(212) 555-0199');
  const [email, setEmail] = useState('admin@finmatrix.io');
  const [website, setWebsite] = useState('https://finmatrix.io');
  const [taxId, setTaxId] = useState('12-3456789');
  const [industry, setIndustry] = useState('Technology');
  const [showIndustryPicker, setShowIndustryPicker] = useState(false);
  const [logoUri, setLogoUri] = useState<string | null>(null);

  const handlePickLogo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Needed', 'Please grant photo library access to upload a logo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setLogoUri(result.assets[0].uri);
    }
  };

  const handleSave = () => {
    if (!companyName.trim()) {
      Alert.alert('Validation', 'Company name is required.');
      return;
    }
    Alert.alert('Saved', 'Company profile updated successfully.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Company Profile</Text>
        <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Logo Placeholder */}
        <View style={styles.logoSection}>
          <View style={styles.logoPlaceholder}>
            {logoUri ? (
              <Image source={{ uri: logoUri }} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoIcon}>🏢</Text>
            )}
          </View>
          <TouchableOpacity
            style={styles.uploadBtn}
            onPress={handlePickLogo}
          >
            <Text style={styles.uploadText}>{logoUri ? 'Change Logo' : 'Upload Logo'}</Text>
          </TouchableOpacity>
          <Text style={styles.logoHint}>PNG or JPG, max 2 MB</Text>
        </View>

        {/* Form */}
        <View style={styles.card}>
          {/* Company Name */}
          <Text style={styles.fieldLabel}>Company Name *</Text>
          <TextInput
            style={styles.input}
            value={companyName}
            onChangeText={setCompanyName}
            placeholder="Enter company name"
            placeholderTextColor={Colors.placeholder}
          />

          {/* Address */}
          <Text style={styles.fieldLabel}>Address</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={address}
            onChangeText={setAddress}
            placeholder="Street address"
            placeholderTextColor={Colors.placeholder}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          {/* Phone */}
          <Text style={styles.fieldLabel}>Phone</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Phone number"
            placeholderTextColor={Colors.placeholder}
            keyboardType="phone-pad"
          />

          {/* Email */}
          <Text style={styles.fieldLabel}>Email</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Company email"
            placeholderTextColor={Colors.placeholder}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Website */}
          <Text style={styles.fieldLabel}>Website</Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="https://example.com"
            placeholderTextColor={Colors.placeholder}
            keyboardType="url"
            autoCapitalize="none"
          />

          {/* Tax ID */}
          <Text style={styles.fieldLabel}>Tax ID / EIN</Text>
          <TextInput
            style={styles.input}
            value={taxId}
            onChangeText={setTaxId}
            placeholder="XX-XXXXXXX"
            placeholderTextColor={Colors.placeholder}
          />

          {/* Industry Dropdown */}
          <Text style={styles.fieldLabel}>Industry</Text>
          <TouchableOpacity
            style={styles.dropdown}
            onPress={() => setShowIndustryPicker(!showIndustryPicker)}
            activeOpacity={0.7}
          >
            <Text style={styles.dropdownText}>{industry}</Text>
            <Text style={styles.dropdownArrow}>{showIndustryPicker ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showIndustryPicker && (
            <View style={styles.pickerList}>
              {INDUSTRIES.map((item) => (
                <TouchableOpacity
                  key={item}
                  style={[
                    styles.pickerItem,
                    item === industry && styles.pickerItemActive,
                  ]}
                  onPress={() => {
                    setIndustry(item);
                    setShowIndustryPicker(false);
                  }}
                >
                  <Text
                    style={[
                      styles.pickerItemText,
                      item === industry && styles.pickerItemTextActive,
                    ]}
                  >
                    {item}
                  </Text>
                  {item === industry && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Save Button (bottom) */}
        <TouchableOpacity style={styles.saveBtnBottom} onPress={handleSave} activeOpacity={0.8}>
          <Text style={styles.saveBtnBottomText}>Save Changes</Text>
        </TouchableOpacity>

        <View style={{ height: Spacing.huge }} />
      </ScrollView>
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
  saveBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.sm,
  },
  saveText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: Spacing.xxxl },

  // Logo
  logoSection: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  logoPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.primary + '14',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
  },
  logoIcon: { fontSize: 40 },
  logoImage: {
    width: 92,
    height: 92,
    borderRadius: BorderRadius.lg - 2,
  },
  uploadBtn: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.secondary,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.xs,
  },
  uploadText: { fontSize: 14, fontWeight: '600', color: Colors.white },
  logoHint: { fontSize: 12, color: Colors.textTertiary },

  // Card
  card: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.base,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    ...Shadows.sm,
  },

  // Fields
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
    marginTop: Spacing.md,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  multiline: {
    minHeight: 80,
    paddingTop: Spacing.md,
  },

  // Dropdown
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  dropdownText: { flex: 1, fontSize: 15, color: Colors.textPrimary },
  dropdownArrow: { fontSize: 12, color: Colors.textTertiary },

  // Picker List
  pickerList: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: Spacing.xs,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  pickerItemActive: {
    backgroundColor: Colors.primary + '0A',
  },
  pickerItemText: { flex: 1, fontSize: 14, color: Colors.textPrimary },
  pickerItemTextActive: { fontWeight: '600', color: Colors.primary },
  checkmark: { fontSize: 16, color: Colors.primary, fontWeight: '700' },

  // Bottom Save
  saveBtnBottom: {
    marginHorizontal: Spacing.base,
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.base,
    alignItems: 'center',
    ...Shadows.md,
  },
  saveBtnBottomText: { fontSize: 16, fontWeight: '700', color: Colors.white },
});

export default CompanyProfileScreen;
