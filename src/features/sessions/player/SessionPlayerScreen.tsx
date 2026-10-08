import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { answerSession } from "@/api/endpoints/session";
import { normalizeApiError } from "@/api/errors";
import type {
  Task,
  TaskAlternative,
  TaskNotebookSessionAnswer,
} from "@/api/types";
import { AudioPlayer } from "@/components/media/AudioPlayer";
import { DsButton, ProgressBar, SuccessPanel } from "@/components/ds";
import { color, fontFamilies, semanticColor, shape } from "@/theme";
import { useSessionFlowStore } from "@/stores/session-flow";
import { resolveSessionTasks } from "./sessionTasks";
import { toApiTimeToAnswer } from "./time";

export const SESSION_FINISH_DESTINATION = "/shell/coming-soon";

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

function findActivityIndex(
  tasks: Task[],
  confirmedTaskIds: Set<string>,
  current: number,
): number {
  if (tasks[current] && !confirmedTaskIds.has(tasks[current].id)) {
    return current;
  }
  return tasks.findIndex((task) => !confirmedTaskIds.has(task.id));
}

export function SessionPlayerScreen(): ReactElement | null {
  const router = useRouter();
  const {
    content,
    sessionId,
    activityIndex,
    confirmedAnswers,
    confirmAnswer,
    markAnswerPending,
    markAnswerConflict,
    finish,
  } = useSessionFlowStore();
  const [selectedAlternative, setSelectedAlternative] =
    useState<TaskAlternative | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [pendingAnswer, setPendingAnswer] =
    useState<TaskNotebookSessionAnswer | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [displayIndex, setDisplayIndex] = useState<number | null>(null);
  const startedAtRef = useRef(0);
  const submittingRef = useRef(false);
  const resumeInputsRef = useRef({ activityIndex, confirmedAnswers });
  const hasResumedRef = useRef(false);

  useEffect(() => {
    resumeInputsRef.current = { activityIndex, confirmedAnswers };
  });

  const tasksQuery = useQuery({
    queryKey: ["session", "player", content?.kind, content?.id],
    queryFn: () => resolveSessionTasks(content!),
    enabled: Boolean(content && sessionId),
    retry: false,
  });

  useEffect(() => {
    if (!content || !sessionId) {
      router.replace("/session/student");
    }
  }, [content, router, sessionId]);

  const tasks = tasksQuery.data ?? [];

  // Resolve o índice de retomada uma única vez, quando as tarefas chegam: o
  // próprio fluxo de resposta avança `activityIndex` na store, e recalcular a
  // partir dele a cada render pularia a tarefa recém-respondida antes de
  // exibir a mensagem de sucesso.
  useEffect(() => {
    if (!tasksQuery.data || hasResumedRef.current) {
      return;
    }
    hasResumedRef.current = true;
    const { activityIndex: initialIndex, confirmedAnswers: initialAnswers } =
      resumeInputsRef.current;
    const confirmedTaskIds = new Set(
      initialAnswers.map((answer) => answer.taskId),
    );
    setDisplayIndex(
      findActivityIndex(tasksQuery.data, confirmedTaskIds, initialIndex),
    );
  }, [tasksQuery.data]);

  const taskIndex = displayIndex ?? -1;
  const task = taskIndex >= 0 ? tasks[taskIndex] : undefined;

  useEffect(() => {
    startedAtRef.current = Date.now();
  }, [task?.id]);

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

  async function handleFinish() {
    await finish();
    router.replace({
      pathname: SESSION_FINISH_DESTINATION,
      params: { title: "Encerrar sessão" },
    });
  }

  async function handleNext() {
    if (taskIndex >= tasks.length - 1) {
      await handleFinish();
      return;
    }
    startedAtRef.current = Date.now();
    setSelectedAlternative(null);
    setPendingAnswer(null);
    setMessage(null);
    setDisplayIndex(taskIndex + 1);
  }

  if (!content || !sessionId) {
    return null;
  }

  if (tasksQuery.isPending || (tasksQuery.isSuccess && displayIndex === null)) {
    return (
      <View style={styles.state} accessibilityRole="progressbar">
        <Text style={styles.stateText}>Carregando atividades...</Text>
      </View>
    );
  }

  if (tasksQuery.isError) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText} accessibilityRole="alert">
          Não foi possível carregar as atividades.
        </Text>
        <DsButton
          label="Tentar novamente"
          onPress={() => void tasksQuery.refetch()}
        />
      </View>
    );
  }

  if (!task) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>
          Não há atividades pendentes nesta sessão.
        </Text>
        <DsButton label="Encerrar sessão" onPress={() => void handleFinish()} />
      </View>
    );
  }

  const isBlocked = submitting || Boolean(selectedAlternative);
  const progress = ((taskIndex + 1) / tasks.length) * 100;

  return (
    <ScrollView contentContainerStyle={styles.shell}>
      <View style={styles.progress}>
        <Text style={styles.progressLabel}>
          Atividade {taskIndex + 1} de {tasks.length}
        </Text>
        <ProgressBar
          value={progress}
          accessibilityLabel={`Progresso: atividade ${taskIndex + 1} de ${tasks.length}`}
        />
      </View>

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
        <DsButton label="Próxima" fullWidth onPress={() => void handleNext()} />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  shell: { flexGrow: 1, padding: 20, gap: 20, backgroundColor: color.surface },
  progress: { gap: 8 },
  progressLabel: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.extraBold ?? fontFamilies.nunito.regular,
    fontSize: 13,
    lineHeight: 18,
  },
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
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 16,
  },
  stateText: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});
