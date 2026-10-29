import { useEffect, useState, type ReactElement } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import type { Appointment, AppointmentStatus } from "@/api/types";
import { AppHeader, Badge, DsButton, Toast, useToast } from "@/components/ds";
import { StaticPressable } from "@/components/ds/StaticPressable";
import { useAppointment } from "@/features/agenda/detail/useAppointment";
import {
  appointmentErrorMessage,
  isAppointmentNotFound,
} from "@/features/agenda/errors";
import {
  useDeleteAppointmentMutation,
  useUpdateAppointmentMutation,
} from "@/features/appointments/mutations";
import { useStudents } from "@/features/students/useStudents";
import { color, fontFamilies, semanticColor, typography } from "@/theme";
import { formatLongDate, formatTime } from "@/utils/date";
import {
  appointmentReminderMessage,
  buildWhatsAppUrl,
  pickContactPhone,
} from "@/utils/whatsapp";

export interface AppointmentDetailScreenProps {
  appointmentId: string;
}

type Dialog = "cancel" | "delete" | null;

const statusLabel: Record<AppointmentStatus, string> = {
  PENDING: "Pendente",
  COMPLETED: "Concluído",
  CANCELLED: "Cancelado",
};

function Row({ label, value }: { label: string; value: string }): ReactElement {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

export function AppointmentDetailScreen({
  appointmentId,
}: AppointmentDetailScreenProps): ReactElement {
  const router = useRouter();
  const toast = useToast();
  const query = useAppointment(appointmentId);
  const studentsQuery = useStudents();
  const update = useUpdateAppointmentMutation();
  const deletion = useDeleteAppointmentMutation();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    if (!deleted) {
      return;
    }
    const timer = setTimeout(() => router.back(), 700);
    return () => clearTimeout(timer);
  }, [deleted, router]);

  if (deleted) {
    return (
      <View style={styles.screen}>
        <Toast message={toast.message} onHide={toast.hide} />
      </View>
    );
  }

  // Durante a exclusão a consulta do detalhe é refeita e falha com NOT_FOUND.
  if (query.isError && !deletion.isPending) {
    const notFound = isAppointmentNotFound(query.error);
    return (
      <View style={[styles.screen, styles.state]}>
        <Text style={styles.stateText}>
          {notFound
            ? "Atendimento não encontrado"
            : "Não foi possível carregar o atendimento."}
        </Text>
        {notFound ? null : (
          <DsButton
            label="Tentar de novo"
            variant="secondary"
            onPress={() => void query.refetch()}
          />
        )}
        <DsButton label="Voltar" onPress={router.back} />
      </View>
    );
  }

  if (!query.data) {
    return (
      <View style={[styles.screen, styles.state]}>
        <ActivityIndicator color={semanticColor.primaryFill} />
      </View>
    );
  }

  const appointment: Appointment = query.data;
  const scheduledAt = new Date(appointment.scheduledAt);
  const student = studentsQuery.data?.find(
    ({ id }) => id === appointment.studentId,
  );
  const studentName = student?.name ?? "Paciente não encontrado";
  const reminderUrl = student
    ? buildWhatsAppUrl(
        pickContactPhone(student),
        appointmentReminderMessage({
          guardianName: student.guardianName,
          studentName: student.name,
          scheduledAt: appointment.scheduledAt,
        }),
      )
    : null;
  const busy = update.isPending || deletion.isPending;
  const actionError = update.error ?? deletion.error;

  function openForm(mode: string) {
    router.push({
      pathname: "/agenda/[id]/edit",
      params: { id: appointment.id, mode },
    });
  }

  function setStatus(status: AppointmentStatus) {
    setDialog(null);
    update.mutate({ id: appointment.id, input: { status } });
  }

  function remove() {
    setDialog(null);
    deletion.mutate(appointment.id, {
      onSuccess: () => {
        toast.show("Atendimento excluído");
        setDeleted(true);
      },
    });
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Atendimento" subtitle="Agenda" onBack={router.back} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.badgeRow}>
            <Badge
              label={statusLabel[appointment.status]}
              variant={
                appointment.status === "CANCELLED" ? "warning" : "default"
              }
            />
          </View>
          <StaticPressable
            accessibilityRole="button"
            accessibilityLabel={studentName}
            onPress={() => router.push(`/patients/${appointment.studentId}`)}
            style={styles.patient}
          >
            <Text style={styles.patientName}>{studentName}</Text>
          </StaticPressable>
          <Row label="Data" value={formatLongDate(scheduledAt)} />
          <Row label="Horário" value={formatTime(scheduledAt)} />
          <Row label="Tipo" value={appointment.type || "Não informado"} />
          <Row label="Duração" value={`${appointment.durationMinutes} min`} />
          <Row
            label="Observação"
            value={appointment.observation || "Sem observação"}
          />
        </View>

        {actionError ? (
          <Text style={styles.error} accessibilityRole="alert">
            {appointmentErrorMessage(actionError)}
          </Text>
        ) : null}

        <View style={styles.actions}>
          {appointment.status === "PENDING" ? (
            <>
              <DsButton
                label="Iniciar sessão"
                icon="play"
                fullWidth
                disabled={busy}
                onPress={() =>
                  router.push({
                    pathname: "/session/student",
                    params: {
                      studentId: appointment.studentId,
                      appointmentId: appointment.id,
                    },
                  })
                }
              />
              <DsButton
                label="Enviar lembrete pelo WhatsApp"
                icon="message"
                variant="secondary"
                fullWidth
                disabled={!reminderUrl}
                onPress={() => {
                  if (reminderUrl)
                    void Linking.openURL(reminderUrl).catch(() =>
                      toast.show("Não foi possível abrir o WhatsApp"),
                    );
                }}
              />
              {!reminderUrl ? (
                <Text style={styles.stateText}>
                  Paciente sem telefone cadastrado
                </Text>
              ) : null}
              <DsButton
                label="Marcar como concluído"
                fullWidth
                disabled={busy}
                onPress={() => setStatus("COMPLETED")}
              />
              <DsButton
                label="Remarcar"
                variant="secondary"
                fullWidth
                disabled={busy}
                onPress={() => openForm("reschedule")}
              />
              <DsButton
                label="Editar"
                variant="secondary"
                fullWidth
                disabled={busy}
                onPress={() => openForm("edit")}
              />
              <DsButton
                label="Cancelar atendimento"
                variant="ghost"
                fullWidth
                disabled={busy}
                onPress={() => setDialog("cancel")}
              />
            </>
          ) : null}
          {appointment.status === "CANCELLED" ? (
            <DsButton
              label="Reativar"
              fullWidth
              disabled={busy}
              onPress={() => openForm("reactivate")}
            />
          ) : null}
          {appointment.status !== "PENDING" ? (
            <DsButton
              label="Editar observação"
              variant="secondary"
              fullWidth
              disabled={busy}
              onPress={() => openForm("observation")}
            />
          ) : null}
          {appointment.status !== "COMPLETED" ? (
            <DsButton
              label="Excluir atendimento"
              variant="ghost"
              fullWidth
              disabled={busy}
              onPress={() => setDialog("delete")}
            />
          ) : null}
        </View>
      </ScrollView>

      <Modal
        transparent
        visible={dialog !== null}
        onRequestClose={() => setDialog(null)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>
              {dialog === "delete"
                ? "Excluir atendimento?"
                : "Cancelar atendimento?"}
            </Text>
            <Text style={styles.dialogText}>
              {dialog === "delete"
                ? "Ele sai da agenda e não pode ser recuperado."
                : "O atendimento fica na agenda como cancelado."}
            </Text>
            <View style={styles.dialogActions}>
              <DsButton
                label="Manter"
                variant="secondary"
                onPress={() => setDialog(null)}
              />
              <DsButton
                label={dialog === "delete" ? "Excluir" : "Sim, cancelar"}
                onPress={
                  dialog === "delete" ? remove : () => setStatus("CANCELLED")
                }
              />
            </View>
          </View>
        </View>
      </Modal>
      <Toast message={toast.message} onHide={toast.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { gap: 18, padding: 20, paddingBottom: 36 },
  card: {
    gap: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
  },
  badgeRow: { flexDirection: "row" },
  patient: { minHeight: 44, justifyContent: "center" },
  patientName: { ...typography.screenTitle, color: color.brand[700] },
  row: { gap: 2 },
  rowLabel: { ...typography.tag, color: color.textSecondary },
  rowValue: { ...typography.body, color: color.text },
  actions: { gap: 10 },
  error: {
    color: color.danger,
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  state: {
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
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    gap: 12,
    padding: 20,
    borderRadius: 16,
    backgroundColor: color.surface,
  },
  dialogTitle: { ...typography.cardTitle, color: color.text },
  dialogText: { ...typography.body, color: color.textSecondary },
  dialogActions: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
});
