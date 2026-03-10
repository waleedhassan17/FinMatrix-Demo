// ============================================================
// FINMATRIX - Reusable Line-Item Row
// ============================================================
// Used by: InvoiceFormScreen, BillFormScreen, PurchaseOrderForm
//
// Props:
//   description, quantity, rate, taxRate, amount (read-only),
//   onChange, onDelete

import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';
import CustomDropdown from '../Custom-Components/CustomDropdown';
import { TAX_RATE_OPTIONS } from '../models/invoiceModel';

export interface LineItemData {
  lineId: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  taxRate: number;
}

interface LineItemRowProps {
  line: LineItemData;
  index: number;
  onChange: (index: number, field: keyof LineItemData, value: string | number) => void;
  onDelete: (index: number) => void;
  errors?: Record<string, string>;
}

const LineItemRow: React.FC<LineItemRowProps> = React.memo(
  ({ line, index, onChange, onDelete, errors }) => {
    const descError = errors?.[`line_${index}_desc`];
    const qtyError = errors?.[`line_${index}_qty`];
    const rateError = errors?.[`line_${index}_rate`];

    return (
      <View style={styles.container}>
        {/* ─── Header ──────────────────────────────────── */}
        <View style={styles.rowHeader}>
          <Text style={styles.lineLabel}>Line {index + 1}</Text>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(index)}
            activeOpacity={0.6}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.deleteBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ─── Description ─────────────────────────────── */}
        <Text style={styles.fieldLabel}>Description *</Text>
        <TextInput
          style={[styles.input, descError && styles.inputError]}
          value={line.description}
          onChangeText={(t) => onChange(index, 'description', t)}
          placeholder="Item or service description"
          placeholderTextColor={Colors.placeholder}
        />
        {descError && <Text style={styles.error}>{descError}</Text>}

        {/* ─── Qty / Rate / Tax row ────────────────────── */}
        <View style={styles.numericRow}>
          {/* Quantity */}
          <View style={styles.numericCol}>
            <Text style={styles.fieldLabel}>Qty *</Text>
            <TextInput
              style={[styles.input, styles.numericInput, qtyError && styles.inputError]}
              value={line.quantity === 0 ? '' : String(line.quantity)}
              onChangeText={(t) => {
                const n = parseFloat(t) || 0;
                onChange(index, 'quantity', n);
              }}
              keyboardType="numeric"
              placeholder="1"
              placeholderTextColor={Colors.placeholder}
            />
            {qtyError && <Text style={styles.error}>{qtyError}</Text>}
          </View>

          {/* Rate */}
          <View style={[styles.numericCol, { flex: 1.2 }]}>
            <Text style={styles.fieldLabel}>Rate ($) *</Text>
            <TextInput
              style={[styles.input, styles.numericInput, rateError && styles.inputError]}
              value={line.rate === 0 ? '' : String(line.rate)}
              onChangeText={(t) => {
                const n = parseFloat(t) || 0;
                onChange(index, 'rate', n);
              }}
              keyboardType="numeric"
              placeholder="0.00"
              placeholderTextColor={Colors.placeholder}
            />
            {rateError && <Text style={styles.error}>{rateError}</Text>}
          </View>

          {/* Tax Rate */}
          <View style={styles.numericCol}>
            <Text style={styles.fieldLabel}>Tax</Text>
            <CustomDropdown
              label=""
              options={TAX_RATE_OPTIONS}
              value={String(line.taxRate)}
              onChange={(v) => onChange(index, 'taxRate', parseInt(v, 10))}
              placeholder="0%"
            />
          </View>
        </View>

        {/* ─── Amount (read-only) ──────────────────────── */}
        <View style={styles.amountRow}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValue}>
            ${line.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </Text>
        </View>
      </View>
    );
  },
);

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  rowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  lineLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dangerLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.danger,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    marginTop: Spacing.xs,
  },
  input: {
    height: 42,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    fontSize: 14,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.danger,
  },
  numericRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  numericCol: {
    flex: 1,
  },
  numericInput: {
    textAlign: 'center',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  amountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  error: {
    fontSize: 11,
    color: Colors.danger,
    marginTop: 2,
  },
});

export default LineItemRow;
