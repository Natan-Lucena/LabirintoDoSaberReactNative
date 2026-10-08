import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { Modal, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { getMe } from "@/api/endpoints/educator";
import { listSessionsByStudent } from "@/api/endpoints/session";
import { DsButton, InfoCard } from "@/components/ds";
import { activateEducator } from "@/storage/mmkv";
import { useAuthStore } from "@/stores/auth";
import { useSessionFlowStore } from "@/stores/session-flow";
import { color, fontFamilies, shape } from "@/theme";

const PLAYER_ROUTE = "/session/player";
const FINISH_ROUTE = "/session/finish";
const RESUMABLE_STEPS = ["running", "finishing", "awaitingObservation"];

/**
 * SES-03 (G-21): ao abrir o app com uma sessão salva e ainda não encerrada,
 * oferece "Retomar" (volta na primeira tarefa sem resposta) ou "Encerrar
 * agora". A oferta é feita uma única vez por abertura do app e nenhuma
 * chamada de resultado desconhecido é repetida sozinha (G-08).
 */
export function ResumeSessionPrompt(): ReactElement | null {
  const router = useRouter();
  const status = useAuthStore((state) => state.status);
  const authEducatorId = useAuthStore((state) => state.educatorId);
  const {
    step,
    sessionName,
    student,
    pendingAnswers,
    conflictedAnswers,
    hydrate,
    finish,
  } = useSessionFlowStore();
  const [checked, setChecked] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const startedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || startedRef.current) {
      return;
    }
    startedRef.current = true;

    void (async () => {
      try {
        let educatorId = authEducatorId;
        if (!educatorId) {
          // Reabrir o app restaura só o token: descobre o educador para ativar
          // o armazenamento criptografado dele antes de ler o fluxo salvo.
          const me = await getMe();
          educatorId = me.id;
          await activateEducator(educatorId);
          useAuthStore.setState({ educatorId });
        }
        await hydrate(educatorId);
        setChecked(true);
      } catch {
        // Sem educador ou sem armazenamento legível, não há o que retomar.
      }
    })();
  }, [authEducatorId, hydrate, status]);

  const visible = checked && !dismissed && RESUMABLE_STEPS.includes(step);
  const hasUnconfirmed = pendingAnswers.length + conflictedAnswers.length > 0;

  async function isFinishedOnServer(): Promise<boolean> {
    const state = useSessionFlowStore.getState();
    if (!state.student || !state.sessionId) {
      return false;
    }
    try {
      const sessions = await listSessionsByStudent(state.student.id);
      return Boolean(
        sessions.find((item) => item.id === state.sessionId)?.finishedAt,
      );
    } catch {
      return false;
    }
  }

  async function resume() {
    if (busy) {
      return;
    }
    setBusy(true);
    try {
      if (step !== "running") {
        setDismissed(true);
        router.replace(FINISH_ROUTE);
        return;
      }
      if (await isFinishedOnServer()) {
        // Já encerrada no servidor: não volta ao player, segue para o registro.
        await finish();
        setDismissed(true);
        router.replace(FINISH_ROUTE);
        return;
      }
      setDismissed(true);
      router.replace(PLAYER_ROUTE);
    } finally {
      setBusy(false);
    }
  }

  async function endNow() {
    if (busy) {
      return;
    }
    if (step === "running") {
      if (hasUnconfirmed) {
        setWarning(
          "Há respostas pendentes de confirmação. Retome a sessão para reenviá-las antes de encerrar.",
        );
        return;
      }
      setBusy(true);
      try {
        await finish();
      } finally {
        setBusy(false);
      }
    }
    setDismissed(true);
    router.replace(FINISH_ROUTE);
  }

  if (!visible) {
    return null;
  }

  return (
    <Modal transparent animationType="fade" visible>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <InfoCard
            icon="play"
            title="Sessão em andamento"
            description={`“${sessionName ?? "Sessão"}”${
              student ? ` · ${student.name}` : ""
            } ainda não foi encerrada.`}
          />
          {warning ? (
            <Text style={styles.warning} accessibilityRole="alert" accessible>
              {warning}
            </Text>
          ) : null}
          <DsButton
            label="Retomar"
            fullWidth
            loading={busy}
            onPress={() => void resume()}
          />
          <DsButton
            label="Encerrar agora"
            variant="secondary"
            fullWidth
            disabled={busy}
            onPress={() => void endNow()}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(23,51,49,0.45)",
  },
  card: {
    gap: 12,
    padding: 16,
    borderRadius: shape.radius.lg,
    backgroundColor: color.surface,
  },
  warning: {
    color: color.warning,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
