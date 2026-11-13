import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { finishSession, listSessionsByStudent } from "@/api/endpoints/session";
import { normalizeApiError } from "@/api/errors";
import type { TaskNotebookSession } from "@/api/types";
import { AppHeader, DsButton, InfoCard } from "@/components/ds";
import { appointmentQueryKeys } from "@/features/appointments/useAppointments";
import { evolutionRoute } from "@/features/evolution/register/routes";
import { useSessionFlowStore } from "@/stores/session-flow";
import { color, fontFamilies, shape, semanticColor } from "@/theme";

function questionsLabel(total: number): string {
  return total === 1 ? "1 questão" : `${total} questões`;
}

/**
 * SES-04: encerra a sessão (`finish`). Desde a EVO-01 (G-56), o passo seguinte
 * é a Evolução da sessão, no lugar da observação. Nenhuma mutação é repetida
 * sozinha (G-08): em timeout ou erro de rede, a tela consulta a listagem do
 * paciente antes de pedir uma nova tentativa explícita.
 */
export function FinishSessionScreen(): ReactElement | null {
  const router = useRouter();
  const queryClient = useQueryClient();
  const {
    step,
    sessionId,
    sessionName,
    student,
    confirmedAnswers,
    pendingAnswers,
    conflictedAnswers,
    awaitEvolution,
  } = useSessionFlowStore();
  const [finishError, setFinishError] = useState<string | null>(null);
  const startedFinishRef = useRef(false);

  const hasUnconfirmed = pendingAnswers.length + conflictedAnswers.length > 0;
  const isValidStep = step === "finishing" || step === "awaitingEvolution";

  useEffect(() => {
    if (!sessionId || !isValidStep) {
      router.replace("/");
      return;
    }
    if (step === "awaitingEvolution") {
      router.replace(evolutionRoute(sessionId));
    }
  }, [isValidStep, router, sessionId, step]);

  async function findServerSession(): Promise<TaskNotebookSession | undefined> {
    if (!student || !sessionId) {
      return undefined;
    }
    try {
      const sessions = await listSessionsByStudent(student.id);
      return sessions.find((item) => item.id === sessionId);
    } catch {
      return undefined;
    }
  }

  async function finished() {
    // A ficha do paciente e a análise passam a incluir a sessão recém-encerrada.
    void queryClient.invalidateQueries({ queryKey: ["task-notebook-session"] });
    void queryClient.invalidateQueries({ queryKey: ["student-analysis"] });
    // O backend conclui o atendimento ligado à sessão (AGE-04): Agenda e Início.
    void queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
    await awaitEvolution();
  }

  async function runFinish() {
    if (!sessionId) {
      return;
    }
    setFinishError(null);
    try {
      await finishSession({ sessionId });
      await finished();
    } catch (error) {
      const apiError = normalizeApiError(error);
      const ambiguous =
        apiError.code === "SESSION_ALREADY_FINISHED" ||
        apiError.isNetworkError ||
        apiError.isTimeout;
      if (ambiguous) {
        const server = await findServerSession();
        if (server?.finishedAt) {
          await finished();
          return;
        }
      }
      setFinishError(
        apiError.isNetworkError || apiError.isTimeout
          ? "Não foi possível confirmar o encerramento. Verifique a conexão e tente novamente."
          : "Não foi possível encerrar a sessão. Tente novamente.",
      );
    }
  }

  useEffect(() => {
    if (
      step !== "finishing" ||
      !sessionId ||
      hasUnconfirmed ||
      startedFinishRef.current
    ) {
      return;
    }
    startedFinishRef.current = true;
    void runFinish();
    // runFinish depende só de valores já listados; roda uma única vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sessionId, hasUnconfirmed]);

  if (!sessionId || step !== "finishing") {
    return null;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Registro da sessão" subtitle="Encerramento" />
      <ScrollView contentContainerStyle={styles.content}>
        <InfoCard
          icon="clipboard"
          title={sessionName ?? "Sessão"}
          description={`${student?.name ?? "Paciente"} · ${questionsLabel(confirmedAnswers.length)}`}
        />

        {hasUnconfirmed ? (
          <Text style={styles.error} accessibilityRole="alert" accessible>
            Há respostas pendentes de confirmação. Reenvie as respostas no
            player antes de encerrar a sessão.
          </Text>
        ) : finishError ? (
          <View style={styles.block}>
            <Text style={styles.error} accessibilityRole="alert" accessible>
              {finishError}
            </Text>
            <DsButton
              label="Tentar novamente"
              variant="secondary"
              fullWidth
              onPress={() => void runFinish()}
            />
          </View>
        ) : (
          <Text style={styles.hint} accessibilityRole="progressbar">
            Encerrando a sessão...
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 16 },
  block: { gap: 12 },
  hint: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    borderRadius: shape.radius.md,
  },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
