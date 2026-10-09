import type { ReactElement } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import type { Appointment } from "@/api/types";
import { FigmaIcon } from "@/components/FigmaIcon";
import {
  AppHeader,
  Avatar,
  DsButton,
  IconButton,
  ProgressBar,
  SectionTitle,
} from "@/components/ds";
import { useAppointments } from "@/features/appointments/useAppointments";
import { useStudents } from "@/features/students/useStudents";
import { color, getContentPadding, shape, typography } from "@/theme";
import { formatTime } from "@/utils/date";

import { useStudentAnalysis, useStudentSessions } from "./usePatientDetailData";

export interface PatientDetailScreenProps {
  patientId: string;
}

export function findNextAppointment(
  appointments: Appointment[],
  patientId: string,
  now = new Date(),
): Appointment | undefined {
  return appointments
    .filter(
      (appointment) =>
        appointment.studentId === patientId &&
        appointment.status !== "CANCELLED" &&
        new Date(appointment.scheduledAt) >= now,
    )
    .sort(
      (left, right) =>
        new Date(left.scheduledAt).getTime() -
        new Date(right.scheduledAt).getTime(),
    )[0];
}

function formatDateParts(value: string): { day: string; month: string } {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "short",
  }).formatToParts(new Date(value));
  return {
    day: parts.find((part) => part.type === "day")?.value ?? "",
    month: (parts.find((part) => part.type === "month")?.value ?? "").replace(
      ".",
      "",
    ),
  };
}

function StatePanel({
  title,
  retry,
  actionLabel = "Tentar novamente",
}: {
  title: string;
  retry?: () => void;
  actionLabel?: string;
}): ReactElement {
  return (
    <View
      style={styles.state}
      accessibilityLabel={title}
      accessibilityRole={retry ? "alert" : undefined}
    >
      <Text style={styles.stateText}>{title}</Text>
      {retry ? <DsButton label={actionLabel} onPress={retry} /> : null}
    </View>
  );
}

export function PatientDetailScreen({
  patientId,
}: PatientDetailScreenProps): ReactElement {
  const router = useRouter();
  const studentsQuery = useStudents();
  const appointmentsQuery = useAppointments();
  const analysisQuery = useStudentAnalysis(patientId);
  const sessionsQuery = useStudentSessions(patientId);
  const patient = studentsQuery.data?.find(
    (student) => student.id === patientId,
  );

  if (studentsQuery.isPending && !studentsQuery.data) {
    return <StatePanel title="Carregando paciente" />;
  }
  if (studentsQuery.isError && !studentsQuery.data) {
    return (
      <StatePanel
        title="Não foi possível carregar o paciente"
        retry={() => void studentsQuery.refetch()}
      />
    );
  }
  if (!patient) {
    return (
      <StatePanel
        title="Paciente não encontrado"
        retry={router.back}
        actionLabel="Voltar"
      />
    );
  }

  const detailQueries = [appointmentsQuery, analysisQuery, sessionsQuery];
  if (detailQueries.some((query) => query.isPending && !query.data)) {
    return <StatePanel title="Carregando paciente" />;
  }
  if (detailQueries.some((query) => query.isError && !query.data)) {
    return (
      <StatePanel
        title="Não foi possível carregar o paciente"
        retry={() => {
          void appointmentsQuery.refetch();
          void analysisQuery.refetch();
          void sessionsQuery.refetch();
        }}
      />
    );
  }

  const nextAppointment = findNextAppointment(
    appointmentsQuery.data ?? [],
    patient.id,
  );
  const analysis = analysisQuery.data;
  const categoryEntries = Object.values(analysis?.categories ?? {});
  const phoneDigits = patient.phonenumber.replace(/\D/g, "");

  function openContact(): void {
    if (phoneDigits) {
      void Linking.openURL(`https://wa.me/55${phoneDigits}`);
    }
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title={patient.name}
        subtitle={`${patient.age} anos · Ativo`}
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.patientSummary}>
          <Avatar name={patient.name} size={58} />
          <View style={styles.summaryCopy}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientMeta}>
              {patient.age} anos ·{" "}
              {patient.gender === "female" ? "Feminino" : "Masculino"}
            </Text>
          </View>
          <IconButton
            icon="message"
            accessibilityLabel="Contatar responsável"
            disabled={!phoneDigits}
            onPress={openContact}
          />
        </View>

        <View style={styles.section}>
          <SectionTitle title="Próxima sessão" />
          {nextAppointment ? (
            <View style={styles.nextSessionCard}>
              <View style={styles.dateBadge}>
                {(() => {
                  const date = formatDateParts(nextAppointment.scheduledAt);
                  return (
                    <>
                      <Text style={styles.dateDay}>{date.day}</Text>
                      <Text style={styles.dateMonth}>{date.month}</Text>
                    </>
                  );
                })()}
              </View>
              <View style={styles.nextSessionCopy}>
                <Text style={styles.cardTitle}>Atendimento agendado</Text>
                <Text style={styles.cardMeta}>
                  {formatTime(new Date(nextAppointment.scheduledAt))}
                </Text>
              </View>
            </View>
          ) : (
            <Text style={styles.emptyText}>Nenhuma sessão agendada</Text>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle
            title="Dificuldades mapeadas"
            actionLabel="Editar"
            onActionPress={() =>
              router.push({
                pathname: "/shell/coming-soon",
                params: { title: "Editar paciente" },
              })
            }
          />
          {patient.learningTopics.length ? (
            <View style={styles.tags}>
              {patient.learningTopics.map((topic) => (
                <View key={topic} style={styles.tag}>
                  <Text style={styles.tagText}>{topic}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>Nenhuma dificuldade mapeada</Text>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle title="Evolução recente" />
          {analysisQuery.isError ? (
            <StatePanel
              title="Não foi possível carregar a evolução"
              retry={() => void analysisQuery.refetch()}
            />
          ) : analysis && analysis.total.total > 0 ? (
            <View style={styles.evolutionCard}>
              <Text style={styles.accuracy}>
                {Math.round(analysis.total.accuracy)}% de acerto geral
              </Text>
              {categoryEntries.map((category) =>
                category ? (
                  <View key={category.category} style={styles.category}>
                    <Text style={styles.categoryLabel}>
                      {category.category}
                    </Text>
                    <ProgressBar
                      value={category.accuracy}
                      accessibilityLabel={`${category.category}: ${Math.round(category.accuracy)}%`}
                    />
                  </View>
                ) : null,
              )}
            </View>
          ) : (
            <Text style={styles.emptyText}>Sem evolução registrada</Text>
          )}
        </View>

        <View style={styles.section}>
          <SectionTitle title="Sessões do paciente" />
          {sessionsQuery.isError ? (
            <StatePanel
              title="Não foi possível carregar as sessões"
              retry={() => void sessionsQuery.refetch()}
            />
          ) : sessionsQuery.data?.length ? (
            sessionsQuery.data.map((session) => (
              <Pressable
                key={session.id}
                accessibilityRole="button"
                accessibilityLabel={`Ver relatório da sessão ${session.name}`}
                onPress={() =>
                  router.push({
                    pathname: "/reports/session/[id]",
                    params: { id: session.id },
                  })
                }
                style={styles.sessionRow}
              >
                <FigmaIcon name="clipboard" color={color.brand[700]} />
                <View style={styles.sessionCopy}>
                  <Text style={styles.cardTitle}>{session.name}</Text>
                  <Text style={styles.cardMeta}>
                    {new Intl.DateTimeFormat("pt-BR", {
                      timeZone: "America/Sao_Paulo",
                      dateStyle: "short",
                    }).format(new Date(session.startedAt))}
                  </Text>
                </View>
                <FigmaIcon name="chevron" color={color.ink[500]} />
              </Pressable>
            ))
          ) : (
            <Text style={styles.emptyText}>Nenhuma sessão registrada</Text>
          )}
        </View>

        <DsButton
          label="Iniciar sessão"
          icon="play"
          fullWidth
          onPress={() => router.push("/session/student")}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { gap: 24, padding: getContentPadding(390), paddingBottom: 40 },
  patientSummary: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: shape.radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 16,
    ...shape.shadow.sm,
  },
  summaryCopy: { flex: 1, gap: 2 },
  patientName: { ...typography.cardTitle, color: color.ink[950] },
  patientMeta: { ...typography.small, color: color.ink[600] },
  section: { gap: 12 },
  nextSessionCard: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: shape.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  dateBadge: {
    alignItems: "center",
    backgroundColor: color.peach,
    borderRadius: shape.radius.sm,
    justifyContent: "center",
    minWidth: 54,
    paddingVertical: 8,
  },
  dateDay: { ...typography.section, color: color.peachStrong },
  dateMonth: { ...typography.eyebrow, color: color.peachStrong },
  nextSessionCopy: { flex: 1, gap: 2 },
  cardTitle: { ...typography.cardTitle, color: color.ink[950] },
  cardMeta: { ...typography.small, color: color.ink[600] },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    backgroundColor: color.brand[50],
    borderRadius: shape.radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  tagText: { ...typography.tag, color: color.brand[700] },
  evolutionCard: {
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: shape.radius.md,
    borderWidth: 1,
    gap: 14,
    padding: 16,
  },
  accuracy: { ...typography.cardTitle, color: color.brand[700] },
  category: { gap: 5 },
  categoryLabel: {
    ...typography.small,
    color: color.ink[600],
    textTransform: "capitalize",
  },
  sessionRow: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: shape.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
  },
  sessionCopy: { flex: 1, gap: 2 },
  emptyText: { ...typography.body, color: color.ink[600] },
  state: {
    alignItems: "center",
    flex: 1,
    gap: 16,
    justifyContent: "center",
    padding: 24,
  },
  stateText: { ...typography.body, color: color.ink[600], textAlign: "center" },
});
