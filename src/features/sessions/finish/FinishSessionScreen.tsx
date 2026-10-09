import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import {
  addSessionObservation,
  finishSession,
  listSessionsByStudent,
} from "@/api/endpoints/session";
import { normalizeApiError } from "@/api/errors";
import type { TaskNotebookSession } from "@/api/types";
import { AppHeader, DsButton, Field, InfoCard } from "@/components/ds";
import { useSessionFlowStore } from "@/stores/session-flow";
import { color, fontFamilies, shape } from "@/theme";

export const SESSION_REPORT_ROUTE = (sessionId: string) =>
  `/reports/session/${sessionId}`;

function questionsLabel(total: number): string {
  return total === 1 ? "1 questão" : `${total} questões`;
}

/**
 * SES-04: encerra a sessão (`finish`) e registra a observação (`observation`).
 * Nenhuma mutação é repetida sozinha (G-08): em timeout ou erro de rede, a
 * tela consulta a listagem do paciente antes de pedir uma nova tentativa
 * explícita.
 */
export function FinishSessionScreen(): ReactElement | null {
  const router = useRouter();
  const {
    step,
    sessionId,
    sessionName,
    educatorId,
    student,
    confirmedAnswers,
    pendingAnswers,
    conflictedAnswers,
    awaitObservation,
    close,
    hydrate,
  } = useSessionFlowStore();
  const [finishError, setFinishError] = useState<string | null>(null);
  const [observation, setObservation] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const startedFinishRef = useRef(false);
  const savingRef = useRef(false);
  const completedRef = useRef(false);

  const hasUnconfirmed = pendingAnswers.length + conflictedAnswers.length > 0;
  const isValidStep = step === "finishing" || step === "awaitingObservation";

  useEffect(() => {
    if (completedRef.current) {
      return;
    }
    if (!sessionId || !isValidStep) {
      router.replace("/");
    }
  }, [isValidStep, router, sessionId]);

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

  async function runFinish() {
    if (!sessionId) {
      return;
    }
    setFinishError(null);
    try {
      await finishSession({ sessionId });
      await awaitObservation();
    } catch (error) {
      const apiError = normalizeApiError(error);
      const ambiguous =
        apiError.code === "SESSION_ALREADY_FINISHED" ||
        apiError.isNetworkError ||
        apiError.isTimeout;
      if (ambiguous) {
        const server = await findServerSession();
        if (server?.finishedAt) {
          await awaitObservation();
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

  async function complete() {
    const finishedSessionId = sessionId;
    if (!finishedSessionId) {
      return;
    }
    completedRef.current = true;
    await close();
    // `close` deixa a store em "closed"; volta a "idle" para a próxima sessão.
    if (educatorId) {
      await hydrate(educatorId);
    }
    router.replace(SESSION_REPORT_ROUTE(finishedSessionId));
  }

  async function save() {
    const text = observation.trim();
    if (!sessionId || !text || savingRef.current) {
      return;
    }
    savingRef.current = true;
    setSaving(true);
    setSaveError(null);
    try {
      await addSessionObservation({ sessionId, observation: text });
      await complete();
    } catch (error) {
      completedRef.current = false;
      const apiError = normalizeApiError(error);
      if (apiError.isNetworkError || apiError.isTimeout) {
        const server = await findServerSession();
        if (server?.observation === text) {
          await complete();
          return;
        }
      }
      setSaveError(
        apiError.isNetworkError || apiError.isTimeout
          ? "Não foi possível confirmar o registro. Verifique a conexão e tente novamente."
          : "Não foi possível salvar o registro. Tente novamente.",
      );
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }

  async function skip() {
    if (savingRef.current) {
      return;
    }
    savingRef.current = true;
    try {
      await complete();
    } finally {
      savingRef.current = false;
    }
  }

  if (!sessionId || !isValidStep) {
    return null;
  }

  const summary = (
    <InfoCard
      icon="clipboard"
      title={sessionName ?? "Sessão"}
      description={`${student?.name ?? "Paciente"} · ${questionsLabel(confirmedAnswers.length)}`}
    />
  );

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Registro da sessão" subtitle="Encerramento" />
      <ScrollView contentContainerStyle={styles.content}>
        {summary}

        {step === "finishing" ? (
          hasUnconfirmed ? (
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
          )
        ) : (
          <View style={styles.block}>
            <Field
              label="Registro descritivo"
              accessibilityLabel="Registro descritivo"
              placeholder="Como foi a sessão? Observações importantes para o prontuário."
              value={observation}
              onChangeText={setObservation}
              multiline
            />
            {saveError ? (
              <Text style={styles.error} accessibilityRole="alert" accessible>
                {saveError}
              </Text>
            ) : null}
            <DsButton
              label="Salvar e atualizar prontuário"
              fullWidth
              loading={saving}
              disabled={observation.trim().length === 0}
              onPress={() => void save()}
            />
            <DsButton
              label="Pular"
              variant="ghost"
              fullWidth
              disabled={saving}
              onPress={() => void skip()}
            />
          </View>
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
    color: color.danger,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
