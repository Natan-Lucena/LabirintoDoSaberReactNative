import type { ReactElement } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { PendingBanner } from "@/components/PendingBanner";
import { FigmaIcon, type FigmaIconName } from "@/components/FigmaIcon";
import {
  AppHeader,
  Avatar,
  DsButton,
  InsightCard,
  SectionTitle,
  Timeline,
  Toast,
  useToast,
  type TimelineItemData,
} from "@/components/ds";
import {
  NEW_PLAN_ROUTE,
  PLAN_SUGGESTIONS_ROUTE,
} from "@/features/plans/routes";
import { usePendingSuggestions } from "@/features/plans/suggestions/usePlanSuggestions";
import {
  hasAppointmentEnded,
  selectNextAppointment,
} from "@/features/home/selectors";
import { useHomeQuery } from "@/features/home/useHomeData";
import { useOnline } from "@/hooks/useOnline";
import { color, fontFamilies, semanticColor } from "@/theme";
import { formatLongDate, formatTime } from "@/utils/date";
import {
  appointmentReminderMessage,
  buildWhatsAppUrl,
  pickContactPhone,
} from "@/utils/whatsapp";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.background },
  content: { padding: 20, gap: 20, paddingBottom: 32 },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    padding: 24,
  },
  stateText: {
    color: color.textSecondary,
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 15,
  },
  hero: {
    backgroundColor: color.surface,
    borderRadius: 24,
    padding: 20,
    gap: 16,
    shadowColor: color.ink[800],
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
  heroLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: color.peachStrong,
  },
  overline: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 12,
    lineHeight: 16,
    textTransform: "uppercase",
  },
  patient: { flexDirection: "row", alignItems: "center", gap: 12 },
  patientCopy: { flex: 1, gap: 2 },
  patientName: {
    color: color.text,
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 19,
    lineHeight: 24,
  },
  appointmentTime: {
    color: color.textSecondary,
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 19,
  },
  actions: { flexDirection: "row", gap: 10 },
  action: { flex: 1 },
  quickGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  quickCard: {
    width: "47%",
    minHeight: 104,
    borderRadius: 16,
    padding: 16,
    justifyContent: "space-between",
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  quickIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: color.brand[50],
    alignItems: "center",
    justifyContent: "center",
  },
  quickLabel: {
    color: color.text,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 18,
  },
  timelineCard: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    gap: 16,
  },
});

function firstName(name: string | undefined): string {
  return name?.trim().split(/\s+/)[0] || "Profissional";
}

function HomeState({
  error,
  onRetry,
}: {
  error?: boolean;
  onRetry?: () => void;
}): ReactElement {
  return (
    <View style={styles.state}>
      {error ? (
        <Text style={styles.stateText}>
          Não foi possível carregar o início.
        </Text>
      ) : (
        <ActivityIndicator color={semanticColor.primaryFill} />
      )}
      <Text style={styles.stateText}>
        {error
          ? "Verifique sua conexão e tente novamente."
          : "Carregando início..."}
      </Text>
      {error && onRetry ? (
        <DsButton
          label="Tentar novamente"
          variant="secondary"
          onPress={onRetry}
        />
      ) : null}
    </View>
  );
}

function QuickAccess({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: FigmaIconName;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.quickCard}
    >
      <View style={styles.quickIcon}>
        <FigmaIcon name={icon} size={20} color={color.brand[700]} />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </Pressable>
  );
}

export function HomeScreen(): ReactElement {
  const router = useRouter();
  const isOnline = useOnline();
  const { data, isPending, isError, refetch } = useHomeQuery();
  const toast = useToast();
  const pendingSuggestions = usePendingSuggestions().data?.length ?? 0;

  if (isPending && !data) return <HomeState />;
  if (isError && !data)
    return <HomeState error onRetry={() => void refetch()} />;
  if (!data) return <HomeState />;

  const appointments = data.todayAppointments.map(
    ({ appointment }) => appointment,
  );
  const now = new Date();
  const nextAppointment = selectNextAppointment(appointments, now);
  const nextPatient = data.todayAppointments.find(
    ({ appointment }) => appointment.id === nextAppointment?.id,
  )?.student;
  const timelineItems: TimelineItemData[] = data.todayAppointments.map(
    ({ appointment, student }) => {
      const reminderUrl =
        appointment.status === "PENDING" && student
          ? buildWhatsAppUrl(
              pickContactPhone(student),
              appointmentReminderMessage({
                guardianName: student.guardianName,
                studentName: student.name,
                scheduledAt: appointment.scheduledAt,
              }),
            )
          : null;
      return {
        id: appointment.id,
        time: formatTime(new Date(appointment.scheduledAt)),
        title: student?.name ?? "Paciente não encontrado",
        subtitle:
          appointment.status === "COMPLETED"
            ? "Concluído"
            : appointment.status === "CANCELLED"
              ? "Cancelado"
              : appointment.id === nextAppointment?.id
                ? "Próximo atendimento"
                : hasAppointmentEnded(appointment, now)
                  ? "Pendente"
                  : "Agendado",
        status:
          appointment.status === "COMPLETED"
            ? "done"
            : appointment.id === nextAppointment?.id
              ? "active"
              : "default",
        actionLabel: reminderUrl ? "Lembrete" : undefined,
        actionAccessibilityLabel:
          reminderUrl && student
            ? `Enviar lembrete pelo WhatsApp para ${student.name}`
            : undefined,
        onActionPress: reminderUrl
          ? () => {
              void Linking.openURL(reminderUrl).catch(() =>
                toast.show("Não foi possível abrir o WhatsApp"),
              );
            }
          : undefined,
      };
    },
  );
  const openAgenda = () => router.push("/(tabs)/agenda");
  const openComingSoon = (title: string) =>
    router.push({ pathname: "/shell/coming-soon", params: { title } });

  return (
    <View style={styles.screen}>
      <AppHeader
        title={`Olá, ${firstName(data.educator?.name)}`}
        subtitle={formatLongDate(new Date())}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {!isOnline ? (
          <PendingBanner message="Sem conexão - mostrando dados salvos" />
        ) : null}
        <View style={styles.hero}>
          <View style={styles.heroLabel}>
            <View style={styles.liveDot} />
            <Text style={styles.overline}>Próximo atendimento</Text>
          </View>
          {nextAppointment ? (
            <>
              <View style={styles.patient}>
                <Avatar name={nextPatient?.name ?? "Paciente"} />
                <View style={styles.patientCopy}>
                  <Text style={styles.patientName}>
                    {nextPatient?.name ?? "Paciente não encontrado"}
                  </Text>
                  <Text style={styles.appointmentTime}>
                    {formatTime(new Date(nextAppointment.scheduledAt))}
                  </Text>
                </View>
              </View>
              <View style={styles.actions}>
                <View style={styles.action}>
                  <DsButton
                    label="Ver ficha"
                    variant="secondary"
                    icon="clipboard"
                    onPress={() => {
                      if (nextPatient)
                        router.push(`/patients/${nextPatient.id}`);
                    }}
                  />
                </View>
                <View style={styles.action}>
                  <DsButton
                    label="Iniciar sessão"
                    icon="play"
                    onPress={() =>
                      router.push({
                        pathname: "/session/student",
                        params: {
                          studentId: nextAppointment.studentId,
                          appointmentId: nextAppointment.id,
                        },
                      })
                    }
                  />
                </View>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.patientName}>
                {appointments.length > 0
                  ? "Sem mais atendimentos hoje"
                  : "Sem atendimentos hoje"}
              </Text>
              <DsButton
                label="Ver agenda"
                variant="secondary"
                icon="calendar"
                onPress={openAgenda}
              />
            </>
          )}
        </View>
        {pendingSuggestions > 0 ? (
          <InsightCard
            title={
              pendingSuggestions === 1
                ? "1 sugestão da IA para revisar"
                : `${pendingSuggestions} sugestões da IA para revisar`
            }
            text="Veja o que a IA propõe para os planos dos seus pacientes."
            onPress={() => router.push(PLAN_SUGGESTIONS_ROUTE)}
          />
        ) : null}
        <View style={{ gap: 12 }}>
          <SectionTitle title="Acesso rápido" />
          <View style={styles.quickGrid}>
            <QuickAccess
              label="Novo paciente"
              icon="plus"
              onPress={() => router.push("/patients/new")}
            />
            <QuickAccess
              label="Criar plano"
              icon="clipboard"
              onPress={() => router.push(NEW_PLAN_ROUTE)}
            />
            <QuickAccess
              label="Aplicar escala"
              icon="chart"
              onPress={() => openComingSoon("Aplicar escala")}
            />
            <QuickAccess
              label="Atividades"
              icon="grid"
              onPress={() => router.push("/activities")}
            />
          </View>
        </View>
        <View style={styles.timelineCard}>
          <SectionTitle
            title="Agenda de hoje"
            actionLabel="Ver agenda"
            onActionPress={openAgenda}
          />
          <Timeline items={timelineItems} />
        </View>
      </ScrollView>
      <Toast message={toast.message} onHide={toast.hide} />
    </View>
  );
}
