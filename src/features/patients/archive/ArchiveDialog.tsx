import type { ReactElement } from "react";
import { Modal, Text, View } from "react-native";

import { DsButton } from "@/components/ds";
import { dialogStyles } from "@/features/team/components/ConfirmDialog";

import type { ArchiveStep } from "./useArchivePatient";

export interface ArchiveDialogProps {
  step: ArchiveStep;
  patientName: string;
  loading?: boolean;
  error?: string | null;
  onKeep: () => void;
  onArchive: () => void;
  onArchiveAndCancel: () => void;
}

function futureAppointmentsText(count: number | undefined): string {
  if (count === undefined) {
    return "Este paciente tem atendimentos futuros. Ao arquivar, eles serão cancelados.";
  }
  return `${count === 1 ? "tem 1 atendimento futuro" : `tem ${count} atendimentos futuros`}. Ao arquivar, eles serão cancelados.`;
}

/**
 * As duas confirmações do arquivamento (PAC-11): a primeira explica o que muda;
 * a segunda só aparece com `409 HAS_FUTURE_APPOINTMENTS` e é a única que manda
 * `cancelFutureAppointments: true`.
 */
export function ArchiveDialog({
  step,
  patientName,
  loading = false,
  error,
  onKeep,
  onArchive,
  onArchiveAndCancel,
}: ArchiveDialogProps): ReactElement {
  const second = step.type === "confirmCancel";
  return (
    <Modal transparent visible={step.type !== "idle"} onRequestClose={onKeep}>
      <View style={dialogStyles.backdrop}>
        <View style={dialogStyles.dialog}>
          {second ? (
            <>
              <Text style={dialogStyles.title}>
                {`Cancelar atendimentos de ${patientName}?`}
              </Text>
              <Text style={dialogStyles.message}>
                {step.count === undefined
                  ? futureAppointmentsText(undefined)
                  : `${patientName} ${futureAppointmentsText(step.count)}`}
              </Text>
            </>
          ) : (
            <>
              <Text
                style={dialogStyles.title}
              >{`Arquivar ${patientName}?`}</Text>
              <Text style={dialogStyles.message}>
                O paciente sai da lista, da contagem e das notificações. Os
                registros continuam guardados e você pode reativá-lo depois.
              </Text>
            </>
          )}
          {error ? (
            <Text style={dialogStyles.error} accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
          <View style={dialogStyles.actions}>
            <DsButton
              label="Manter"
              variant="secondary"
              onPress={onKeep}
              disabled={loading}
            />
            <DsButton
              label={second ? "Cancelar atendimentos e arquivar" : "Arquivar"}
              onPress={second ? onArchiveAndCancel : onArchive}
              loading={loading}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}
