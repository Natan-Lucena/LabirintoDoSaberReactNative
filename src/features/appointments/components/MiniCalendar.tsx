import { Pressable, StyleSheet, Text, View } from "react-native";
import { Calendar, type DateData } from "react-native-calendars";

import { color, shape, typography } from "../../../theme";

interface DayCellProps {
  date?: DateData;
  state?: "selected" | "disabled" | "inactive" | "today" | "";
}

export interface MiniCalendarProps {
  year: number;
  month: number; // 0-indexado, como Date/T-306
  selectedDayKey: string; // "AAAA-MM-DD"
  appointmentCounts: Record<string, number>; // dayKey -> nº de agendamentos
  onSelectDate: (dayKey: string) => void;
  onChangeMonth: (year: number, month: number) => void;
}

const MONTH_FORMATTER = new Intl.DateTimeFormat("pt-BR", { month: "long" });

function toDayKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-01`;
}

function addMonths(
  year: number,
  month: number,
  delta: number,
): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: ((total % 12) + 12) % 12 };
}

function monthName(year: number, month: number, day: number): string {
  return MONTH_FORMATTER.format(new Date(year, month, day));
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  arrowButton: {
    minWidth: shape.minTouchTarget,
    minHeight: shape.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: typography.sectionTitle.fontSize,
    color: color.text,
  },
  monthTitle: {
    fontSize: typography.sectionTitle.fontSize,
    lineHeight: typography.sectionTitle.lineHeight,
    fontFamily: typography.sectionTitle.fontFamily,
    color: color.text,
    textTransform: "capitalize",
  },
  day: {
    minWidth: shape.minTouchTarget,
    minHeight: shape.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: shape.cardRadius,
  },
  daySelected: {
    backgroundColor: color.selection,
    borderWidth: shape.hairlineWidth,
    borderColor: color.primary,
  },
  dayText: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
  dayTextOtherMonth: { color: color.textTertiary },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: color.primary,
    marginTop: 2,
  },
});

export function MiniCalendar({
  year,
  month,
  selectedDayKey,
  appointmentCounts,
  onSelectDate,
  onChangeMonth,
}: MiniCalendarProps) {
  function handlePrevMonth() {
    const prev = addMonths(year, month, -1);
    onChangeMonth(prev.year, prev.month);
  }

  function handleNextMonth() {
    const next = addMonths(year, month, 1);
    onChangeMonth(next.year, next.month);
  }

  function DayCell({ date, state }: DayCellProps) {
    if (!date) {
      return null;
    }
    const dayKey = date.dateString;
    const count = appointmentCounts[dayKey] ?? 0;
    const isSelected = dayKey === selectedDayKey;
    const isOtherMonth = state === "disabled" || state === "inactive";
    const label =
      count > 0
        ? `${date.day} de ${monthName(date.year, date.month - 1, date.day)}, ${count} agendamento${count === 1 ? "" : "s"}`
        : `${date.day} de ${monthName(date.year, date.month - 1, date.day)}`;

    return (
      <Pressable
        onPress={() => onSelectDate(dayKey)}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected: isSelected }}
        style={[styles.day, isSelected ? styles.daySelected : null]}
      >
        <Text
          style={[
            styles.dayText,
            isOtherMonth ? styles.dayTextOtherMonth : null,
          ]}
        >
          {date.day}
        </Text>
        {count > 0 ? (
          <View
            style={styles.dot}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          />
        ) : null}
      </Pressable>
    );
  }

  return (
    <View>
      <View style={styles.header}>
        <Pressable
          onPress={handlePrevMonth}
          accessibilityRole="button"
          accessibilityLabel="Mês anterior"
          style={styles.arrowButton}
        >
          <Text style={styles.arrowText}>‹</Text>
        </Pressable>
        <Text style={styles.monthTitle}>
          {monthName(year, month, 1)} {year}
        </Text>
        <Pressable
          onPress={handleNextMonth}
          accessibilityRole="button"
          accessibilityLabel="Próximo mês"
          style={styles.arrowButton}
        >
          <Text style={styles.arrowText}>›</Text>
        </Pressable>
      </View>
      <Calendar
        current={toDayKey(year, month)}
        hideArrows
        renderHeader={() => null}
        dayComponent={DayCell}
      />
    </View>
  );
}
