// ============================================================
// FINMATRIX - Date Range Picker Component
// ============================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Platform,
} from 'react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '../theme';

// ─── Types ──────────────────────────────────────────────────
interface Preset {
  label: string;
  from: string;
  to: string;
}

interface DateRangePickerProps {
  fromDate: string;
  toDate: string;
  onFromChange: (date: string) => void;
  onToChange: (date: string) => void;
  presets: Preset[];
}

// ─── Simple Date Picker Modal ───────────────────────────────
// Since we're not using a 3rd-party date picker library,
// this provides a calendar-style month grid for picking dates.

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

const parseDate = (str: string) => {
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
};

const formatDate = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const formatDisplay = (str: string) => {
  const d = parseDate(str);
  return `${MONTHS[d.getMonth()].slice(0, 3)} ${d.getDate()}, ${d.getFullYear()}`;
};

// ─── Calendar Grid ──────────────────────────────────────────
const CalendarModal: React.FC<{
  visible: boolean;
  currentDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  title: string;
}> = ({ visible, currentDate, onSelect, onClose, title }) => {
  const initial = parseDate(currentDate);
  const [viewYear, setViewYear] = useState(initial.getFullYear());
  const [viewMonth, setViewMonth] = useState(initial.getMonth());

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const selectedParsed = parseDate(currentDate);
  const isSelectedDay = (day: number) =>
    viewYear === selectedParsed.getFullYear() &&
    viewMonth === selectedParsed.getMonth() &&
    day === selectedParsed.getDate();

  const isToday = (day: number) => {
    const now = new Date();
    return (
      viewYear === now.getFullYear() &&
      viewMonth === now.getMonth() &&
      day === now.getDate()
    );
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleDayPress = (day: number) => {
    const selected = new Date(viewYear, viewMonth, day);
    onSelect(formatDate(selected));
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={calStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity
          style={calStyles.container}
          activeOpacity={1}
          onPress={() => {}}
        >
          <Text style={calStyles.title}>{title}</Text>

          {/* Month Navigation */}
          <View style={calStyles.monthNav}>
            <TouchableOpacity onPress={handlePrevMonth} style={calStyles.navBtn}>
              <Text style={calStyles.navBtnText}>‹</Text>
            </TouchableOpacity>
            <Text style={calStyles.monthLabel}>
              {MONTHS[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={handleNextMonth} style={calStyles.navBtn}>
              <Text style={calStyles.navBtnText}>›</Text>
            </TouchableOpacity>
          </View>

          {/* Day headers */}
          <View style={calStyles.dayHeaderRow}>
            {DAYS.map((d) => (
              <Text key={d} style={calStyles.dayHeader}>
                {d}
              </Text>
            ))}
          </View>

          {/* Day grid */}
          <View style={calStyles.grid}>
            {cells.map((day, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  calStyles.dayCell,
                  day != null && isSelectedDay(day) && calStyles.dayCellSelected,
                  day != null && isToday(day) && !isSelectedDay(day) && calStyles.dayCellToday,
                ]}
                onPress={() => day && handleDayPress(day)}
                disabled={!day}
                activeOpacity={0.6}
              >
                {day ? (
                  <Text
                    style={[
                      calStyles.dayText,
                      isSelectedDay(day) && calStyles.dayTextSelected,
                      isToday(day) && !isSelectedDay(day) && calStyles.dayTextToday,
                    ]}
                  >
                    {day}
                  </Text>
                ) : null}
              </TouchableOpacity>
            ))}
          </View>

          {/* Cancel */}
          <TouchableOpacity style={calStyles.cancelBtn} onPress={onClose}>
            <Text style={calStyles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const calStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  container: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    width: '100%',
    maxWidth: 340,
    ...Shadows.lg,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navBtnText: {
    fontSize: 22,
    fontWeight: '300',
    color: Colors.textPrimary,
    marginTop: -2,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayHeaderRow: {
    flexDirection: 'row',
    marginBottom: Spacing.xs,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.full,
  },
  dayCellSelected: {
    backgroundColor: Colors.primary,
  },
  dayCellToday: {
    backgroundColor: Colors.primary + '14',
  },
  dayText: {
    fontSize: 14,
    color: Colors.textPrimary,
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  dayTextToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  cancelBtn: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});

// ─── Main Component ─────────────────────────────────────────
const DateRangePicker: React.FC<DateRangePickerProps> = ({
  fromDate,
  toDate,
  onFromChange,
  onToChange,
  presets,
}) => {
  const [showFrom, setShowFrom] = useState(false);
  const [showTo, setShowTo] = useState(false);

  const handleFromSelect = (date: string) => {
    onFromChange(date);
    setShowFrom(false);
    // Ensure from <= to
    if (date > toDate) onToChange(date);
  };

  const handleToSelect = (date: string) => {
    onToChange(date);
    setShowTo(false);
    // Ensure to >= from
    if (date < fromDate) onFromChange(date);
  };

  return (
    <View style={styles.container}>
      {/* Date Buttons Row */}
      <View style={styles.dateRow}>
        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowFrom(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dateBtnLabel}>From</Text>
          <View style={styles.dateBtnValueRow}>
            <Text style={styles.calIcon}>📅</Text>
            <Text style={styles.dateBtnValue}>{formatDisplay(fromDate)}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.dateSeparator}>
          <Text style={styles.dateSeparatorText}>→</Text>
        </View>

        <TouchableOpacity
          style={styles.dateBtn}
          onPress={() => setShowTo(true)}
          activeOpacity={0.7}
        >
          <Text style={styles.dateBtnLabel}>To</Text>
          <View style={styles.dateBtnValueRow}>
            <Text style={styles.calIcon}>📅</Text>
            <Text style={styles.dateBtnValue}>{formatDisplay(toDate)}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Preset Buttons */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetRow}
      >
        {presets.map((preset) => {
          const isActive = preset.from === fromDate && preset.to === toDate;
          return (
            <TouchableOpacity
              key={preset.label}
              style={[styles.presetBtn, isActive && styles.presetBtnActive]}
              onPress={() => {
                onFromChange(preset.from);
                onToChange(preset.to);
              }}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetBtnText,
                  isActive && styles.presetBtnTextActive,
                ]}
              >
                {preset.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Calendar Modals */}
      <CalendarModal
        visible={showFrom}
        currentDate={fromDate}
        onSelect={handleFromSelect}
        onClose={() => setShowFrom(false)}
        title="Select Start Date"
      />
      <CalendarModal
        visible={showTo}
        currentDate={toDate}
        onSelect={handleToSelect}
        onClose={() => setShowTo(false)}
        title="Select End Date"
      />
    </View>
  );
};

// ─── Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  dateBtn: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  dateBtnLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  dateBtnValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  dateBtnValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dateSeparator: {
    paddingHorizontal: Spacing.sm,
    paddingTop: Spacing.md,
  },
  dateSeparatorText: {
    fontSize: 16,
    color: Colors.textTertiary,
  },
  presetRow: {
    paddingVertical: Spacing.xs,
    gap: Spacing.sm,
  },
  presetBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  presetBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  presetBtnTextActive: {
    color: Colors.white,
  },
});

export default DateRangePicker;
