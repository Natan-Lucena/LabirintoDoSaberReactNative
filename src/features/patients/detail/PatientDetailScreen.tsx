import { useCallback, useState, type ReactElement } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";

import { ApiError } from "@/api/errors";
import type { Appointment } from "@/api/types";
import { FigmaIcon } from "@/components/FigmaIcon";
import {
  AppHeader,
  Avatar,
  Badge,
  DsButton,
  FeatureRow,
  IconButton,
  SectionTitle,
  Tabs,
  Toast,
  useToast,
} from "@/components/ds";
import { formatResponseDate } from "@/features/anamnese/responses/answers";
import { useAnamneseResponses } from "@/features/anamnese/responses/useAnamneseResponses";
import { useAppointments } from "@/features/appointments/useAppointments";
import { useHomeData } from "@/features/home/useHomeData";
import {
  pendingForStudent,
  usePendingEvolutions,
} from "@/features/evolution/pending/usePendingEvolutions";
import { EvolutionSummaryCard } from "@/features/evolution/records/EvolutionSummaryCard";
import { usePatientEvolutions } from "@/features/evolution/records/useEvolutionRecords";
import {
  evolutionRecordRoute,
  evolutionRoute,
  patientRecordRoute,
} from "@/features/evolution/register/routes";
import { PendingsSection } from "@/features/patients/overview/PendingsSection";
import { usePatientOverview } from "@/features/patients/overview/usePatientOverview";
import { ArchiveDialog } from "@/features/patients/archive/ArchiveDialog";
import { ArchivedBanner } from "@/features/patients/archive/ArchivedBanner";
import { useArchivePatient } from "@/features/patients/archive/useArchivePatient";
import { isPatientOwner } from "@/features/patients/shares/access";
import { WhoFollowsSection } from "@/features/patients/shares/WhoFollowsSection";
import { useStudents } from "@/features/students/useStudents";
import { isSharedStudent, studentStatus } from "@/api/endpoints/student-status";
import { color, getContentPadding, shape, typography } from "@/theme";
import { formatTime } from "@/utils/date";
import {
  buildWhatsAppUrl,
  patientContactMessage,
  pickContactPhone,
} from "@/utils/whatsapp";

import { useStudentSessions } from "./usePatientDetailData";
import { PatientAssessments } from "./assessments/PatientAssessments";
import { ActivePdi, PatientPlans } from "./plans/PatientPlans";

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
        // Só atendimentos ainda por acontecer: cancelado e concluído ficam de fora.
        appointment.status !== "CANCELLED" &&
        appointment.status !== "COMPLETED" &&
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

function isForbidden(error: unknown): boolean {
  return error instanceof ApiError && error.status === 403;
}

export function PatientDetailScreen({
  patientId,
}: PatientDetailScreenProps): ReactElement {
  const router = useRouter();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const { educator } = useHomeData();
  // `ALL`: a ficha também abre o paciente arquivado (PAC-11).
  const studentsQuery = useStudents({ status: "ALL" });
  const archive = useArchivePatient({
    studentId: patientId,
    onToast: toast.show,
    onNotFound: () => router.replace("/(tabs)/patients"),
  });
  const appointmentsQuery = useAppointments(patientId);
  const evolutionsQuery = usePatientEvolutions(patientId);
  const pendingQuery = usePendingEvolutions();
  const { query: overviewQuery, byId: overviewById } = usePatientOverview();
  const { refetch: refetchOverview } = overviewQuery;
  // As pendências mudam ao registrar evolução, concluir escala etc.: refaz ao voltar à ficha.
  useFocusEffect(
    useCallback(() => {
      void refetchOverview();
    }, [refetchOverview]),
  );
  const sessionsQuery = useStudentSessions(patientId);
  const anamneseQuery = useAnamneseResponses(patientId);
  const patient = studentsQuery.data?.find(
    (student) => student.id === patientId,
  );

  // Acesso perdido (EQP-04): a ficha já foi vista e some da lista depois de um
  // refetch, ou uma leitura dela devolve 403. No primeiro carregamento, ausente
  // continua sendo "Paciente não encontrado".
  const [seenPatient, setSeenPatient] = useState(false);
  if (patient && !seenPatient) setSeenPatient(true);
  const lostAccess =
    isForbidden(sessionsQuery.error) ||
    isForbidden(evolutionsQuery.error) ||
    (seenPatient && !patient && !studentsQuery.isPending) ||
    // Paciente da colega arquivado pelo dono (PAC-11 §6.6).
    (patient !== undefined &&
      isSharedStudent(patient) &&
      studentStatus(patient) === "ARCHIVED");
  if (lostAccess) {
    return (
      <StatePanel
        title="Você não acompanha mais este paciente."
        retry={() => router.replace("/(tabs)/patients")}
        actionLabel="Voltar para a lista"
      />
    );
  }

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

  const detailQueries = [appointmentsQuery, sessionsQuery];
  if (detailQueries.some((query) => query.isPending && !query.data)) {
    return <StatePanel title="Carregando paciente" />;
  }
  if (detailQueries.some((query) => query.isError && !query.data)) {
    return (
      <StatePanel
        title="Não foi possível carregar o paciente"
        retry={() => {
          void appointmentsQuery.refetch();
          void sessionsQuery.refetch();
        }}
      />
    );
  }

  const owner = isPatientOwner(patient);
  const archived = studentStatus(patient) === "ARCHIVED";
  // Reserva (§6 item 5): sem overview o bloco "Registrar evolução" continua.
  const overview = overviewById.get(patient.id);
  const useFallback = !overview && !overviewQuery.isPending;
  // O resumo do servidor tem prioridade; sem ele, a lista filtrada pelo paciente (D-06).
  const nextAppointment =
    overview?.nextAppointment ??
    findNextAppointment(appointmentsQuery.data ?? [], patient.id);
  // O servidor devolve da mais recente para a mais antiga: as duas primeiras.
  const pendingEvolutions = pendingForStudent(pendingQuery.data, patient.id);
  const latestEvolutions = (evolutionsQuery.data ?? []).slice(0, 2);
  const contactUrl = buildWhatsAppUrl(
    pickContactPhone(patient),
    patientContactMessage({
      guardianName: patient.guardianName,
      educatorName: educator?.name,
      studentName: patient.name,
    }),
  );

  const lastAnamnese = [...(anamneseQuery.data ?? [])].sort((a, b) =>
    b.answeredAt.localeCompare(a.answeredAt),
  )[0];
  const anamneseSubtitle = anamneseQuery.isError
    ? "Não foi possível carregar"
    : anamneseQuery.isPending
      ? "Carregando"
      : lastAnamnese
        ? `Última em ${formatResponseDate(lastAnamnese.answeredAt)}`
        : "Nenhuma anamnese";

  function openContact(): void {
    if (contactUrl)
      void Linking.openURL(contactUrl).catch(() =>
        toast.show("Não foi possível abrir o WhatsApp"),
      );
  }

  return (
    <View style={styles.screen}>
      <AppHeader
        title={patient.name}
        subtitle={`${patient.age} anos · ${archived ? "Arquivado" : "Ativo"}`}
        onBack={router.back}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {archived ? (
          <ArchivedBanner
            archivedAt={patient.archivedAt}
            onReactivate={owner ? archive.reactivate : undefined}
            loading={archive.loading}
          />
        ) : null}
        <View style={styles.patientSummary}>
          <Avatar name={patient.name} size={58} photoUrl={patient.photoUrl} />
          <View style={styles.summaryCopy}>
            <Text style={styles.patientName}>{patient.name}</Text>
            <Text style={styles.patientMeta}>
              {patient.age} anos ·{" "}
              {patient.gender === "female" ? "Feminino" : "Masculino"}
            </Text>
            {patient.guardianName ? (
              <Text style={styles.patientMeta}>
                Responsável: {patient.guardianName}
                {patient.guardianRelationship
                  ? ` (${patient.guardianRelationship})`
                  : ""}
              </Text>
            ) : null}
          </View>
          <IconButton
            icon="message"
            accessibilityLabel="Contatar responsável"
            disabled={!contactUrl}
            onPress={openContact}
          />
          {!contactUrl ? (
            <Text style={styles.patientMeta}>
              Paciente sem telefone cadastrado
            </Text>
          ) : null}
        </View>
        {!owner ? (
          <Badge
            label={
              patient.ownerName
                ? `Compartilhado por ${patient.ownerName}`
                : "Compartilhado"
            }
          />
        ) : null}

        <Tabs
          options={[
            { key: "overview", label: "Visão geral" },
            { key: "plans", label: "Planos" },
            { key: "assessments", label: "Avaliações" },
          ]}
          value={activeTab}
          onChange={setActiveTab}
          accessibilityLabel="Abas da ficha do paciente"
        />

        {activeTab === "plans" ? (
          <PatientPlans patientId={patient.id} archived={archived} />
        ) : activeTab === "assessments" ? (
          <PatientAssessments patientId={patient.id} archived={archived} />
        ) : (
          <>
            <WhoFollowsSection patient={patient} onToast={toast.show} />

            <ActivePdi patientId={patient.id} archived={archived} />

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
                actionLabel={owner ? "Editar" : undefined}
                onActionPress={
                  owner
                    ? () =>
                        router.push({
                          pathname: "/patients/[id]/edit",
                          params: { id: patient.id },
                        })
                    : undefined
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
                <Text style={styles.emptyText}>
                  Nenhuma dificuldade mapeada
                </Text>
              )}
            </View>

            {overview ? (
              <PendingsSection
                studentId={patient.id}
                overview={overview}
                onSelectTab={setActiveTab}
                onToast={toast.show}
              />
            ) : null}

            {useFallback && pendingEvolutions[0] ? (
              <View style={styles.section}>
                {pendingEvolutions.length > 1 ? (
                  <Text style={styles.emptyText}>
                    {`${pendingEvolutions.length} sessões sem evolução`}
                  </Text>
                ) : null}
                <DsButton
                  label="Registrar evolução"
                  fullWidth
                  onPress={() =>
                    router.push(
                      evolutionRoute(pendingEvolutions[0]!.sessionId, "entry"),
                    )
                  }
                />
                {pendingEvolutions.length > 1 ? (
                  <DsButton
                    label="Ver todas as pendências"
                    variant="secondary"
                    fullWidth
                    onPress={() => router.push("/evolution")}
                  />
                ) : null}
              </View>
            ) : null}

            <View style={styles.section}>
              <SectionTitle
                title="Evolução recente"
                actionLabel="Ver prontuário"
                onActionPress={() =>
                  router.push(patientRecordRoute(patient.id))
                }
              />
              {evolutionsQuery.isError && !evolutionsQuery.data ? (
                <StatePanel
                  title="Não foi possível carregar a evolução"
                  retry={() => void evolutionsQuery.refetch()}
                />
              ) : evolutionsQuery.isPending ? (
                <Text style={styles.emptyText}>Carregando a evolução</Text>
              ) : latestEvolutions.length > 0 ? (
                latestEvolutions.map((evolution) => (
                  <EvolutionSummaryCard
                    key={evolution.id}
                    evolution={evolution}
                    onPress={() =>
                      router.push(evolutionRecordRoute(evolution.id))
                    }
                  />
                ))
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

            <FeatureRow
              icon="clipboard"
              title="Anamnese"
              subtitle={anamneseSubtitle}
              onPress={() =>
                router.push({
                  pathname: "/patients/[id]/anamnese",
                  params: { id: patient.id },
                })
              }
            />

            {archived ? null : (
              <DsButton
                label="Iniciar sessão"
                icon="play"
                fullWidth
                onPress={() =>
                  router.push({
                    pathname: "/session/student",
                    params: { studentId: patient.id },
                  })
                }
              />
            )}

            {owner && !archived ? (
              <DsButton
                testID="patient-archive"
                label="Arquivar paciente"
                variant="ghost"
                fullWidth
                onPress={archive.open}
              />
            ) : null}
          </>
        )}
      </ScrollView>
      <ArchiveDialog
        step={archive.step}
        patientName={patient.name}
        loading={archive.loading}
        error={archive.error}
        onKeep={archive.keep}
        onArchive={archive.archive}
        onArchiveAndCancel={archive.archiveAndCancel}
      />
      <Toast message={toast.message} onHide={toast.hide} />
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
