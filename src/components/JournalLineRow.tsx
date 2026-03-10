// ============================================================
// FINMATRIX - Journal Entry Line Row Component
// ============================================================
// Reusable row for one journal entry line in the form.
// Handles account dropdown, description, debit, credit,
// and the mutual exclusion rule: entering debit clears credit
// and vice versa.

import React, { useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius } from '../theme';
import CustomDropdown from '../Custom-Components/CustomDropdown';
import { JEFormLine } from '../models/jeModel';

interface AccountOption {
  label: string;
  value: string;
}

interface JournalLineRowProps {
  line: JEFormLine;
  index: number;
  accountOptions: AccountOption[];
  onUpdate: (index: number, field: keyof JEFormLine, value: string | number) => void;
  onDelete: (index: number) => void;
  canDelete: boolean;
  errors?: Record<string, string>;
}

const JournalLineRow: React.FC<JournalLineRowProps> = ({
  line,
  index,
  accountOptions,
  onUpdate,
  onDelete,
  canDelete,
  errors,
}) => {
  // ─── Debit/Credit mutual exclusion ─────────────────────
  const handleDebitChange = (text: string) => {
    const val = parseFloat(text) || 0;
    onUpdate(index, 'debit', val);
    if (val > 0) {
      onUpdate(index, 'credit', 0);
    }
  };

  const handleCreditChange = (text: string) => {
    const val = parseFloat(text) || 0;
    onUpdate(index, 'credit', val);
    if (val > 0) {
      onUpdate(index, 'debit', 0);
    }
  };

  const hasError = errors && Object.keys(errors).length > 0;

  return (
    <View style={[styles.container, hasError && styles.containerError]}>
      {/* Row Number */}
      <View style={styles.rowNumContainer}>
        <Text style={styles.rowNum}>{index + 1}</Text>
      </View>

      {/* Account Dropdown */}
      <View style={styles.accountCol}>
        <CustomDropdown
          label=""
          options={accountOptions}
          value={line.accountId}
          onChange={(val) => onUpdate(index, 'accountId', val)}
          placeholder="Select account"
          searchable={accountOptions.length > 8}
          error={errors?.accountId}
        />
      </View>

      {/* Description */}
      <View style={styles.descCol}>
        <TextInput
          style={styles.textInput}
          value={line.description}
          onChangeText={(text) => onUpdate(index, 'description', text)}
          placeholder="Description"
          placeholderTextColor={Colors.placeholder}
        />
      </View>

      {/* Debit */}
      <View style={styles.amountCol}>
        <TextInput
          style={[
            styles.amountInput,
            line.debit > 0 && styles.debitActive,
            line.credit > 0 && styles.amountDisabled,
          ]}
          value={line.debit > 0 ? String(line.debit) : ''}
          onChangeText={handleDebitChange}
          placeholder="0.00"
          placeholderTextColor={Colors.placeholder}
          keyboardType="decimal-pad"
          editable={line.credit <= 0}
        />
        {errors?.debit && <Text style={styles.errorText}>{errors.debit}</Text>}
      </View>

      {/* Credit */}
      <View style={styles.amountCol}>
        <TextInput
          style={[
            styles.amountInput,
            line.credit > 0 && styles.creditActive,
            line.debit > 0 && styles.amountDisabled,
          ]}
          value={line.credit > 0 ? String(line.credit) : ''}
          onChangeText={handleCreditChange}
          placeholder="0.00"
          placeholderTextColor={Colors.placeholder}
          keyboardType="decimal-pad"
          editable={line.debit <= 0}
        />
        {errors?.credit && (
          <Text style={styles.errorText}>{errors.credit}</Text>
        )}
      </View>

      {/* Delete Button */}
      <TouchableOpacity
        style={[styles.deleteBtn, !canDelete && styles.deleteBtnDisabled]}
        onPress={() => canDelete && onDelete(index)}
        activeOpacity={canDelete ? 0.6 : 1}
        disabled={!canDelete}
      >
        <Text
          style={[
            styles.deleteBtnText,
            !canDelete && styles.deleteBtnTextDisabled,
          ]}
        >
          ✕
        </Text>
      </TouchableOpacity>

      {/* General line-level error */}
      {errors?.amount && (
        <View style={styles.lineErrorRow}>
          <Text style={styles.lineErrorText}>{errors.amount}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  containerError: {
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  rowNumContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary + '14',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  rowNum: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Columns (wrapping layout for mobile)
  accountCol: {
    flex: 1,
    minWidth: 140,
    marginRight: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  descCol: {
    width: '100%',
    marginBottom: Spacing.xs,
    paddingLeft: 32,
  },
  amountCol: {
    width: 90,
    marginRight: Spacing.sm,
    paddingLeft: 32,
  },

  // Inputs
  textInput: {
    height: 38,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    fontSize: 13,
    color: Colors.textPrimary,
    backgroundColor: Colors.white,
  },
  amountInput: {
    height: 38,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.xs,
    paddingHorizontal: Spacing.sm,
    fontSize: 13,
    color: Colors.textPrimary,
    textAlign: 'right',
    backgroundColor: Colors.white,
    fontVariant: ['tabular-nums'],
  },
  debitActive: {
    borderColor: Colors.success,
    color: '#27AE60',
    fontWeight: '600',
  },
  creditActive: {
    borderColor: Colors.danger,
    color: '#E74C3C',
    fontWeight: '600',
  },
  amountDisabled: {
    backgroundColor: Colors.background,
    color: Colors.textDisabled,
  },

  // Delete
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginLeft: 'auto',
  },
  deleteBtnDisabled: {
    backgroundColor: Colors.background,
  },
  deleteBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.danger,
  },
  deleteBtnTextDisabled: {
    color: Colors.textDisabled,
  },

  // Errors
  errorText: {
    fontSize: 10,
    color: Colors.danger,
    marginTop: 2,
  },
  lineErrorRow: {
    width: '100%',
    paddingLeft: 32,
    paddingTop: 2,
  },
  lineErrorText: {
    fontSize: 11,
    color: Colors.danger,
    fontWeight: '500',
  },
});

export default JournalLineRow;
