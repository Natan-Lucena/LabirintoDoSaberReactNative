import { useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { PendingBanner } from "@/components/PendingBanner";
import { FigmaIcon } from "@/components/FigmaIcon";
import { DsButton, IconButton, SectionTitle } from "@/components/ds";
import { StaticPressable } from "@/components/ds/StaticPressable";
import {
  selectAppointmentsForDay,
  selectAppointmentDayKeys,
  selectDaySummary,
} from "@/features/appointments/selectors";
import { useAppointments } from "@/features/appointments/useAppointments";
import { useStudents } from "@/features/students/useStudents";
import { selectCurrentAppointment } from "@/features/agenda/selectors";
import { useOnline } from "@/hooks/useOnline";
import { color, semanticColor, typography } from "@/theme";
import { dayKey, formatTime } from "@/utils/date";

const weekDays = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const monthFormatter = new Intl.DateTimeFormat("pt-BR", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

function keyDate(key: string): Date {
  return new Date(`${key}T12:00:00Z`);
}

function shiftKey(key: string, days: number): string {
  const date = keyDate(key);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekStart(key: string): string {
  const weekday = keyDate(key).getUTCDay();
  return shiftKey(key, -((weekday + 6) % 7));
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, paddingBottom: 36, gap: 22 },
  heading: { gap: 4 },
  eyebrow: { ...typography.eyebrow, color: color.textSecondary },
  title: { ...typography.screenTitle, color: color.text },
  weekNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  weekRange: { ...typography.cardTitle, color: color.text },
  strip: { flexDirection: "row", gap: 5 },
  dateChip: {
    flex: 1,
    minHeight: 66,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  dateChipActive: {
    backgroundColor: semanticColor.primaryFill,
    borderColor: semanticColor.primaryFill,
  },
  dateLabel: { ...typography.tag, color: color.textSecondary },
  dateNumber: { ...typography.cardTitle, color: color.text },
  dateSelectedText: { color: semanticColor.textOnPrimary },
  list: { gap: 10 },
  appointment: {
    minHeight: 80,
    borderRadius: 16,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  current: { borderColor: color.brand[600], backgroundColor: color.brand[50] },
  cancelled: { opacity: 0.48 },
  time: { ...typography.time, color: color.text },
  line: {
    width: 3,
    alignSelf: "stretch",
    borderRadius: 2,
    backgroundColor: color.brand[200],
  },
  lineCurrent: { backgroundColor: color.brand[700] },
  copy: { flex: 1, gap: 3 },
  name: { ...typography.cardTitle, color: color.text },
  status: { ...typography.tag, color: color.textSecondary },
  complete: { flexDirection: "row", alignItems: "center", gap: 4 },
  state: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  stateText: {
    ...typography.body,
    color: color.textSecondary,
    textAlign: "center",
  },
});

export function AgendaScreen(): ReactElement {
  const router = useRouter();
  const isOnline = useOnline();
  const [selectedDay, setSelectedDay] = useState(() => dayKey(new Date()));
  const appointmentsQuery = useAppointments();
  const studentsQuery = useStudents();
  const today = dayKey(new Date());
  const start = weekStart(selectedDay);
  const days = Array.from({ length: 7 }, (_, index) => shiftKey(start, index));
  const allAppointments = appointmentsQuery.data ?? [];
  const appointments = selectAppointmentsForDay(allAppointments, selectedDay);
  const summary = selectDaySummary(appointments);
  const current = selectCurrentAppointment(appointments, selectedDay);
  const studentsById = new Map(
    (studentsQuery.data ?? []).map((student) => [student.id, student.name]),
  );
  // Mantém o seletor de dias compartilhado na mesma fonte da lista do mês.
  const markedDays = selectAppointmentDayKeys(
    allAppointments,
    keyDate(selectedDay).getUTCFullYear(),
    keyDate(selectedDay).getUTCMonth(),
  );
  const missingData = !appointmentsQuery.data || !studentsQuery.data;
  const isLoading =
    missingData && (appointmentsQuery.isPending || studentsQuery.isPending);
  const isError =
    missingData && (appointmentsQuery.isError || studentsQuery.isError);

  if (isLoading || isError || missingData) {
    return (
      <View style={[styles.screen, styles.state]}>
        {isError ? (
          <Text style={styles.stateText}>
            Não foi possível carregar a agenda.
          </Text>
        ) : (
          <ActivityIndicator color={semanticColor.primaryFill} />
        )}
        <Text style={styles.stateText}>
          {isError
            ? "Verifique sua conexão e tente novamente."
            : "Carregando agenda..."}
        </Text>
        {isError ? (
          <DsButton
            label="Tentar de novo"
            variant="secondary"
            onPress={() => {
              void appointmentsQuery.refetch();
              void studentsQuery.refetch();
            }}
          />
        ) : null}
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!isOnline ? (
          <PendingBanner message="Sem conexão - mostrando dados salvos" />
        ) : null}
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>
            {monthFormatter.format(keyDate(selectedDay))}
          </Text>
          <Text style={styles.title}>Agenda</Text>
        </View>
        <View style={{ gap: 12 }}>
          <View style={styles.weekNavigation}>
            <IconButton
              icon="chevronLeft"
              accessibilityLabel="Semana anterior"
              onPress={() => setSelectedDay(shiftKey(selectedDay, -7))}
            />
            <Text style={styles.weekRange}>
              {dateFormatter.format(keyDate(start))} –{" "}
              {dateFormatter.format(keyDate(days[6]!))}
            </Text>
            <IconButton
              icon="chevron"
              accessibilityLabel="Próxima semana"
              onPress={() => setSelectedDay(shiftKey(selectedDay, 7))}
            />
          </View>
          <View style={styles.strip}>
            {days.map((key, index) => {
              const selected = key === selectedDay;
              const label = `${key === today ? "Hoje, " : ""}${dateFormatter.format(keyDate(key))}`;
              return (
                <StaticPressable
                  key={key}
                  accessibilityRole="button"
                  accessibilityLabel={label}
                  accessibilityState={{ selected }}
                  onPress={() => setSelectedDay(key)}
                  style={[styles.dateChip, selected && styles.dateChipActive]}
                >
                  <Text
                    style={[
                      styles.dateLabel,
                      selected && styles.dateSelectedText,
                    ]}
                  >
                    {weekDays[index]}
                  </Text>
                  <Text
                    style={[
                      styles.dateNumber,
                      selected && styles.dateSelectedText,
                    ]}
                  >
                    {keyDate(key).getUTCDate()}
                  </Text>
                  {markedDays.includes(key) ? (
                    <View
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: 2,
                        backgroundColor: selected
                          ? color.surface
                          : color.brand[600],
                      }}
                    />
                  ) : null}
                </StaticPressable>
              );
            })}
          </View>
        </View>
        <View style={styles.list}>
          <SectionTitle
            title={`${summary.total} ${summary.total === 1 ? "atendimento" : "atendimentos"}`}
          />
          {appointments.length === 0 ? (
            <View style={styles.state}>
              <Text style={styles.stateText}>Nenhum atendimento neste dia</Text>
            </View>
          ) : (
            appointments.map((appointment) => {
              const name =
                studentsById.get(appointment.studentId) ??
                "Paciente não encontrado";
              const cancelled = appointment.status === "CANCELLED";
              const completed = appointment.status === "COMPLETED";
              const details = [
                `${appointment.durationMinutes} min`,
                appointment.type,
              ]
                .filter(Boolean)
                .join(" · ");
              return (
                <StaticPressable
                  key={appointment.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${formatTime(new Date(appointment.scheduledAt))}, ${name}, ${details}${completed ? ", Concluído" : cancelled ? ", Cancelado" : ""}`}
                  onPress={() =>
                    router.push({
                      pathname: "/agenda/[id]",
                      params: { id: appointment.id },
                    })
                  }
                  style={[
                    styles.appointment,
                    appointment.id === current?.id && styles.current,
                    cancelled && styles.cancelled,
                  ]}
                >
                  <Text style={styles.time}>
                    {formatTime(new Date(appointment.scheduledAt))}
                  </Text>
                  <View
                    style={[
                      styles.line,
                      appointment.id === current?.id && styles.lineCurrent,
                    ]}
                  />
                  <View style={styles.copy}>
                    <Text style={styles.name}>{name}</Text>
                    <Text style={styles.status}>{details}</Text>
                    {completed ? (
                      <View style={styles.complete}>
                        <FigmaIcon
                          name="check"
                          size={14}
                          color={color.brand[700]}
                        />
                        <Text style={styles.status}>Concluído</Text>
                      </View>
                    ) : cancelled ? (
                      <Text style={styles.status}>Cancelado</Text>
                    ) : null}
                  </View>
                </StaticPressable>
              );
            })
          )}
        </View>
        <DsButton
          label="Novo atendimento"
          icon="plus"
          fullWidth
          onPress={() =>
            router.push({
              pathname: "/agenda/new",
              params: { date: selectedDay },
            })
          }
        />
      </ScrollView>
    </View>
  );
}
