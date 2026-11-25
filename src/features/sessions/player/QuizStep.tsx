import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { answerSession } from "@/api/endpoints/session";
import { normalizeApiError } from "@/api/errors";
import type {
  Task,
  TaskAlternative,
  TaskNotebookSessionAnswer,
} from "@/api/types";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { DsButton, SuccessPanel } from "@/components/ds";
import { color, fontFamilies, semanticColor, shape } from "@/theme";
import { useSessionFlowStore } from "@/stores/session-flow";
import { toApiTimeToAnswer } from "./time";

function answerFor(
  task: Task,
  alternative: TaskAlternative,
  startedAt: number,
): TaskNotebookSessionAnswer {
  return {
    taskId: task.id,
    selectedAlternativeId: alternative.id,
    // Apenas a store precisa preservar este dado para relatórios; o player nunca o exibe.
    isCorrect: alternative.isCorrect,
    timeToAnswer: toApiTimeToAnswer(Date.now() - startedAt),
    answeredAt: new Date().toISOString(),
  };
}

export interface QuizStepProps {
  task: Task;
  sessionId: string;
  onNext: () => void | Promise<void>;
}

/**
 * Passo de múltipla escolha do player (SES-02). Extraído do
 * `SessionPlayerScreen` na EVO-03 sem mudar o comportamento nem os textos; o
 * player remonta o passo a cada tarefa (`key`), o que reinicia o estado.
 */
export function QuizStep({
  task,
  sessionId,
  onNext,
}: QuizStepProps): ReactElement {
  const { confirmAnswer, markAnswerPending, markAnswerConflict } =
    useSessionFlowStore();
  const [selectedAlternative, setSelectedAlternative] =
    useState<TaskAlternative | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAnswer, setPendingAnswer] =
    useState<TaskNotebookSessionAnswer | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const startedAtRef = useRef(0);
  const submittingRef = useRef(false);

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [task.id]);

  async function submitAnswer(
    taskToAnswer: Task,
    alternative: TaskAlternative,
    answer?: TaskNotebookSessionAnswer,
  ) {
    if (!sessionId || submittingRef.current) {
      return;
    }

    const nextAnswer =
      answer ?? answerFor(taskToAnswer, alternative, startedAtRef.current);
    submittingRef.current = true;
    setSelectedAlternative(alternative);
    setSubmitting(true);
    setMessage(null);

    try {
      await answerSession({
        sessionId,
        taskId: nextAnswer.taskId,
        selectedAlternativeId: nextAnswer.selectedAlternativeId,
        timeToAnswer: nextAnswer.timeToAnswer,
      });
      await confirmAnswer(nextAnswer);
      setMessage("Resposta registrada");
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.code === "TASK_ALREADY_ANSWERED") {
        await markAnswerConflict(nextAnswer);
        setMessage("Resposta registrada");
        return;
      }
      if (apiError.code === "TASK_NOT_IN_NOTEBOOK") {
        // Resposta recusada de vez: não fica pendente nem trava a sequência.
        setMessage("Esta atividade não faz parte do caderno da sessão.");
        return;
      }
      await markAnswerPending(nextAnswer);
      setPendingAnswer(nextAnswer);
      setMessage(
        apiError.isNetworkError || apiError.isTimeout
          ? "Não foi possível confirmar a resposta. Tente reenviar quando a conexão voltar."
          : "Não foi possível registrar a resposta. Tente reenviar.",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  const isBlocked = submitting || Boolean(selectedAlternative);

  return (
    <>
      {task.imageFile ? (
        <Image
          source={{ uri: task.imageFile }}
          resizeMode="contain"
          style={styles.illustration}
        />
      ) : null}
      {task.audioFile ? <AudioPlayer url={task.audioFile} /> : null}

      <Text style={styles.prompt} accessibilityRole="header">
        {task.prompt}
      </Text>

      <View style={styles.alternatives}>
        {task.alternatives.map((alternative) => {
          const selected = selectedAlternative?.id === alternative.id;
          return (
            <Pressable
              key={alternative.id}
              accessibilityRole="button"
              accessibilityLabel={alternative.text}
              accessibilityState={{ disabled: isBlocked, selected }}
              disabled={isBlocked}
              onPress={() => void submitAnswer(task, alternative)}
              style={[styles.option, selected ? styles.optionSelected : null]}
            >
              <Text style={styles.optionText}>{alternative.text}</Text>
            </Pressable>
          );
        })}
      </View>

      {message === "Resposta registrada" ? (
        <SuccessPanel title={message} />
      ) : null}
      {message && message !== "Resposta registrada" ? (
        <Text style={styles.message} accessibilityRole="alert">
          {message}
        </Text>
      ) : null}
      {pendingAnswer ? (
        <DsButton
          label="Tentar reenviar"
          variant="secondary"
          fullWidth
          disabled={submitting}
          onPress={() => {
            const alternative = task.alternatives.find(
              (item) => item.id === pendingAnswer.selectedAlternativeId,
            );
            if (alternative) {
              void submitAnswer(task, alternative, pendingAnswer);
            }
          }}
        />
      ) : null}
      {selectedAlternative && !pendingAnswer && !submitting ? (
        <DsButton label="Próxima" fullWidth onPress={() => void onNext()} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  illustration: { width: "100%", height: 220, borderRadius: shape.radius.lg },
  prompt: {
    color: color.ink[950],
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 26,
    lineHeight: 34,
    textAlign: "center",
  },
  alternatives: { gap: 12 },
  option: {
    minHeight: 64,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: color.brand[200],
    borderRadius: shape.radius.md,
    backgroundColor: color.surface,
  },
  optionSelected: {
    borderColor: semanticColor.primaryFill,
    backgroundColor: color.brand[50],
  },
  optionText: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.bold ?? fontFamilies.nunito.regular,
    fontSize: 19,
    lineHeight: 26,
    textAlign: "center",
  },
  message: {
    color: color.warning,
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
