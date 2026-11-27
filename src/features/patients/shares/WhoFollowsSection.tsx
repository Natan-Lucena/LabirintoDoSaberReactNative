import { useState, type ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import type { ClinicMember, Student, StudentShare } from "@/api/types";
import { Avatar, DsButton, SectionTitle } from "@/components/ds";
import { useHomeData } from "@/features/home/useHomeData";
import { ConfirmDialog } from "@/features/team/components/ConfirmDialog";
import { teamRoleLabel } from "@/features/team/roles";
import { useClinic } from "@/features/team/useClinic";
import { color, fontFamilies } from "@/theme";

import { isPatientOwner } from "./access";
import { ShareWithDialog } from "./ShareWithDialog";
import {
  isShareAlreadyGone,
  shareErrorMessage,
  useShareStudent,
  useStudentShares,
  useUnshareStudent,
} from "./useStudentShares";

export interface WhoFollowsSectionProps {
  patient: Student;
  onToast: (message: string) => void;
}

/** "desde dd/mm", no fuso de São Paulo. */
function sinceLabel(value: string): string {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  }).formatToParts(new Date(value));
  const part = (type: string) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `desde ${part("day")}/${part("month")}`;
}

function PersonRow({
  name,
  detail,
  action,
}: {
  name: string;
  detail: string;
  action?: ReactElement;
}): ReactElement {
  return (
    <View style={styles.row}>
      <Avatar name={name} />
      <View style={styles.copy}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>
      {action}
    </View>
  );
}

/** "Quem acompanha": o dono compartilha e remove; a colega só lê (EQP-04). */
export function WhoFollowsSection({
  patient,
  onToast,
}: WhoFollowsSectionProps): ReactElement {
  const owner = isPatientOwner(patient);
  const { educator } = useHomeData();
  const sharesQuery = useStudentShares(patient.id);
  const clinicQuery = useClinic();
  const share = useShareStudent();
  const unshare = useUnshareStudent();
  const [picking, setPicking] = useState(false);
  const [removing, setRemoving] = useState<StudentShare | null>(null);
  const [error, setError] = useState<string | null>(null);

  const shares = sharesQuery.data ?? [];
  const members = clinicQuery.data?.members ?? [];
  const hasClinic = Boolean(clinicQuery.data);
  const candidates: ClinicMember[] = members.filter(
    (member) =>
      member.educatorId !== educator?.id &&
      !shares.some((item) => item.educatorId === member.educatorId),
  );

  function closeDialogs(): void {
    setPicking(false);
    setRemoving(null);
    setError(null);
  }

  function confirmShare(member: ClinicMember): void {
    setError(null);
    share.mutate(
      { studentId: patient.id, educatorId: member.educatorId },
      {
        onSuccess: () => {
          closeDialogs();
          onToast("Paciente compartilhado");
        },
        onError: (failure) => setError(shareErrorMessage(failure)),
      },
    );
  }

  function confirmRemove(target: StudentShare): void {
    setError(null);
    unshare.mutate(
      { studentId: patient.id, educatorId: target.educatorId },
      {
        onSuccess: () => {
          closeDialogs();
          onToast("Acesso removido");
        },
        onError: (failure) => {
          if (isShareAlreadyGone(failure)) {
            closeDialogs();
            onToast("Acesso removido");
            return;
          }
          setError(shareErrorMessage(failure));
        },
      },
    );
  }

  const ownerRow = owner ? (
    <PersonRow name="Você" detail="Responsável pelo cadastro" />
  ) : (
    <PersonRow name={patient.ownerName ?? "Responsável"} detail="Responsável" />
  );

  return (
    <View style={styles.section}>
      <SectionTitle
        title="Quem acompanha"
        actionLabel={owner && hasClinic ? "Compartilhar" : undefined}
        onActionPress={owner && hasClinic ? () => setPicking(true) : undefined}
      />
      {ownerRow}
      {sharesQuery.isPending ? (
        <Text style={styles.hint}>Carregando</Text>
      ) : sharesQuery.isError ? (
        <View style={styles.block}>
          <Text style={styles.hint} accessibilityRole="alert">
            Não foi possível carregar quem acompanha.
          </Text>
          <DsButton
            label="Tentar de novo"
            variant="secondary"
            onPress={() => void sharesQuery.refetch()}
          />
        </View>
      ) : (
        <>
          {shares.map((item) => {
            const mine = item.educatorId === educator?.id;
            return (
              <PersonRow
                key={item.educatorId}
                name={mine ? "Você" : item.name}
                detail={
                  item.role
                    ? `${teamRoleLabel(item.role)} · ${sinceLabel(item.sharedAt)}`
                    : sinceLabel(item.sharedAt)
                }
                action={
                  owner ? (
                    <DsButton
                      label="Remover acesso"
                      accessibilityLabel={`Remover acesso de ${item.name}`}
                      variant="secondary"
                      onPress={() => {
                        setError(null);
                        setRemoving(item);
                      }}
                    />
                  ) : undefined
                }
              />
            );
          })}
          {owner && shares.length === 0 ? (
            <Text style={styles.hint}>Só você acompanha este paciente.</Text>
          ) : null}
        </>
      )}
      {owner && !clinicQuery.isPending && !hasClinic ? (
        <Text style={styles.hint}>
          Entre numa equipe para compartilhar este paciente.
        </Text>
      ) : null}

      {picking ? (
        <ShareWithDialog
          visible
          patientName={patient.name}
          candidates={candidates}
          loading={share.isPending}
          error={error}
          onConfirm={confirmShare}
          onCancel={closeDialogs}
        />
      ) : null}
      {removing ? (
        <ConfirmDialog
          visible
          title="Remover acesso"
          message={`Remover o acesso de ${removing.name} a ${patient.name}? Os registros que ela(e) fez continuam no prontuário.`}
          confirmLabel="Remover acesso"
          loading={unshare.isPending}
          error={error}
          onConfirm={() => confirmRemove(removing)}
          onCancel={closeDialogs}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  block: { gap: 8, alignItems: "flex-start" },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  copy: { flex: 1, gap: 2 },
  name: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    color: color.text,
  },
  detail: {
    fontSize: 12,
    lineHeight: 16,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
  hint: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: fontFamilies.nunito.regular,
    color: color.ink[600],
  },
});
