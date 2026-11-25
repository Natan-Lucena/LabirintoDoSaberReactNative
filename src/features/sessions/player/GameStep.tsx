import type { ReactElement } from "react";
import { useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";

import {
  submitActivityResult,
  type SubmitActivityResultInput,
} from "@/api/endpoints/session";
import { normalizeApiError } from "@/api/errors";
import type { Task } from "@/api/types";
import { DsButton, SuccessPanel } from "@/components/ds";
import { renderActivity } from "@/features/activities/engine/registry";
import type {
  ActivityComponentProps,
  GameResult,
} from "@/features/activities/engine/types";
import { useSessionFlowStore } from "@/stores/session-flow";
import { color, fontFamilies } from "@/theme";

const NETWORK_MESSAGE =
  "Não foi possível confirmar o resultado. Tente reenviar quando a conexão voltar.";
const GENERIC_MESSAGE =
  "Não foi possível registrar o resultado. Tente reenviar.";
const NOT_IN_NOTEBOOK_MESSAGE =
  "Esta atividade não faz parte do caderno da sessão.";
const FINISHED_MESSAGE =
  "A sessão já foi encerrada; o resultado não foi registrado.";

// Erros que o servidor recusa de vez: não ficam pendentes nem travam a sequência.
const REJECTED_CODES = new Set([
  "TASK_NOT_IN_NOTEBOOK",
  "USE_ANSWER_ROUTE",
  "PRINTABLE_NOT_PLAYABLE",
]);

type Status =
  | "playing"
  | "submitting"
  | "registered"
  | "failed"
  | "rejected"
  | "sessionFinished";

function noop(): void {}

/** Renderiza o jogo pelo registro do motor (o mesmo do `ActivityEngine`). */
function ActivityHost({
  task,
  onSolved,
  onGameResult,
}: Pick<
  ActivityComponentProps,
  "task" | "onSolved" | "onGameResult"
>): ReactElement | null {
  return renderActivity(task.type, {
    task,
    onAttempt: noop,
    onSolved,
    onGameResult,
  });
}

export interface GameStepProps {
  task: Task;
  sessionId: string;
  isLast: boolean;
  onNext: () => void | Promise<void>;
  /** Vai ao encerramento da sessão (`handleFinish` do player). */
  onFinish: () => void | Promise<void>;
}

/**
 * Passo de jogo do player (EVO-03): renderiza o jogo pelo registro do motor e
 * envia o resultado uma única vez (RS-04, G-08). O reenvio é sempre manual e
 * usa o corpo guardado em `pendingActivityResults`. O resultado não entra no
 * acerto da sessão (G-65).
 */
export function GameStep({
  task,
  sessionId,
  isLast,
  onNext,
  onFinish,
}: GameStepProps): ReactElement {
  const {
    pendingActivityResults = [],
    confirmActivityResult,
    markActivityResultPending,
    clearActivityResultPending,
  } = useSessionFlowStore();

  // Pendência salva antes de reabrir o app: o jogo já terminou, só falta reenviar.
  const [stored] = useState(
    () =>
      pendingActivityResults.find(
        (input) => input.taskId === task.id && input.sessionId === sessionId,
      ) ?? null,
  );
  const [resumed] = useState(stored !== null);
  const [status, setStatus] = useState<Status>(stored ? "failed" : "playing");
  const [message, setMessage] = useState<string | null>(
    stored ? NETWORK_MESSAGE : null,
  );
  const [retryBody, setRetryBody] = useState<SubmitActivityResultInput | null>(
    stored,
  );
  const [skippable, setSkippable] = useState(false);
  const submittingRef = useRef(false);
  const reportedRef = useRef(false);
  const persistedPendingRef = useRef(stored !== null);

  async function dropPersistedPending() {
    if (persistedPendingRef.current) {
      persistedPendingRef.current = false;
      await clearActivityResultPending(task.id);
    }
  }

  async function submit(body: SubmitActivityResultInput) {
    if (submittingRef.current) {
      return;
    }
    submittingRef.current = true;
    setStatus("submitting");
    setMessage(null);

    try {
      await submitActivityResult(body);
      await confirmActivityResult(body.taskId);
      persistedPendingRef.current = false;
      setRetryBody(null);
      setStatus("registered");
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.code === "RESULT_ALREADY_EXISTS") {
        // Já está no servidor (envio anterior que não confirmou): conta como registrado.
        await confirmActivityResult(body.taskId);
        persistedPendingRef.current = false;
        setRetryBody(null);
        setStatus("registered");
        return;
      }
      if (apiError.code === "SESSION_ALREADY_FINISHED") {
        await dropPersistedPending();
        setRetryBody(null);
        setMessage(FINISHED_MESSAGE);
        setStatus("sessionFinished");
        return;
      }
      if (apiError.code && REJECTED_CODES.has(apiError.code)) {
        await dropPersistedPending();
        setRetryBody(null);
        setMessage(
          apiError.code === "TASK_NOT_IN_NOTEBOOK"
            ? NOT_IN_NOTEBOOK_MESSAGE
            : apiError.message,
        );
        setStatus("rejected");
        return;
      }
      setRetryBody(body);
      setStatus("failed");
      if (apiError.code === "SESSION_NOT_FOUND") {
        // Sem pendência: reenviar não muda nada com a sessão inexistente.
        await dropPersistedPending();
        setMessage(GENERIC_MESSAGE);
        return;
      }
      await markActivityResultPending(body);
      persistedPendingRef.current = true;
      setMessage(
        apiError.isNetworkError || apiError.isTimeout
          ? NETWORK_MESSAGE
          : GENERIC_MESSAGE,
      );
    } finally {
      submittingRef.current = false;
    }
  }

  function handleGameResult(result: GameResult) {
    // Só jogos completos geram resultado, uma vez por atividade.
    if (reportedRef.current || !result.completed) {
      return;
    }
    reportedRef.current = true;
    void submit({
      sessionId,
      taskId: task.id,
      completed: result.completed,
      correct: result.correct,
      attempts: result.attempts,
      errors: result.errors,
      durationMs: result.durationMs,
    });
  }

  function handleSolved() {
    // Conteúdo incompleto libera o item sem resultado: não há o que registrar.
    if (!reportedRef.current) {
      setSkippable(true);
    }
  }

  const submitting = status === "submitting";
  const canAdvance = status === "registered" || status === "rejected";

  return (
    <>
      {resumed ? null : (
        <ActivityHost
          task={task}
          onSolved={handleSolved}
          onGameResult={handleGameResult}
        />
      )}

      {submitting ? (
        <View
          style={styles.sending}
          accessibilityRole="progressbar"
          accessibilityLabel="Enviando o resultado"
        >
          <ActivityIndicator color={color.brand[600]} />
        </View>
      ) : null}
      {status === "registered" ? (
        <SuccessPanel title="Resultado registrado" />
      ) : null}
      {message ? (
        <Text style={styles.message} accessibilityRole="alert">
          {message}
        </Text>
      ) : null}
      {status === "failed" && retryBody ? (
        <DsButton
          label="Tentar reenviar"
          variant="secondary"
          fullWidth
          onPress={() => void submit(retryBody)}
        />
      ) : null}
      {status === "sessionFinished" ? (
        <DsButton
          label="Ir para o encerramento"
          fullWidth
          onPress={() => void onFinish()}
        />
      ) : null}
      {canAdvance ? (
        <DsButton
          label={isLast ? "Encerrar sessão" : "Próxima"}
          fullWidth
          onPress={() => void onNext()}
        />
      ) : null}
      {skippable && status === "playing" ? (
        <DsButton
          label="Pular"
          variant="secondary"
          fullWidth
          onPress={() => void onNext()}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  sending: { alignItems: "center", padding: 12 },
  message: {
    color: color.warning,
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
