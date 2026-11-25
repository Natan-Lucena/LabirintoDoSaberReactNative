import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { Task } from "@/api/types";
import { DsButton, ProgressBar } from "@/components/ds";
import { color, fontFamilies } from "@/theme";
import { useSessionFlowStore } from "@/stores/session-flow";
import { GameStep } from "./GameStep";
import { QuizStep } from "./QuizStep";
import { resolveSessionTasks } from "./sessionTasks";
import { sessionStepKind } from "./stepKind";
import { UnavailableStep } from "./UnavailableStep";

export const SESSION_FINISH_DESTINATION = "/session/finish";

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
    confirmedActivityResults = [],
    finish,
  } = useSessionFlowStore();
  const [displayIndex, setDisplayIndex] = useState<number | null>(null);
  const resumeInputsRef = useRef({
    activityIndex,
    confirmedAnswers,
    confirmedActivityResults,
  });
  const hasResumedRef = useRef(false);

  useEffect(() => {
    resumeInputsRef.current = {
      activityIndex,
      confirmedAnswers,
      confirmedActivityResults,
    };
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
    const {
      activityIndex: initialIndex,
      confirmedAnswers: initialAnswers,
      confirmedActivityResults: initialResults,
    } = resumeInputsRef.current;
    // Resposta de múltipla escolha e resultado de jogo confirmados saem da fila.
    const confirmedTaskIds = new Set([
      ...initialAnswers.map((answer) => answer.taskId),
      ...initialResults,
    ]);
    setDisplayIndex(
      findActivityIndex(tasksQuery.data, confirmedTaskIds, initialIndex),
    );
  }, [tasksQuery.data]);

  const taskIndex = displayIndex ?? -1;
  const task = taskIndex >= 0 ? tasks[taskIndex] : undefined;

  async function handleFinish() {
    await finish();
    router.replace(SESSION_FINISH_DESTINATION);
  }

  async function handleNext() {
    if (taskIndex >= tasks.length - 1) {
      await handleFinish();
      return;
    }
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

  const progress = ((taskIndex + 1) / tasks.length) * 100;
  const stepKind = sessionStepKind(task);

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

      {stepKind === "quiz" ? (
        <QuizStep
          key={task.id}
          task={task}
          sessionId={sessionId}
          onNext={handleNext}
        />
      ) : stepKind === "game" ? (
        <GameStep
          key={task.id}
          task={task}
          sessionId={sessionId}
          isLast={taskIndex >= tasks.length - 1}
          onNext={handleNext}
          onFinish={handleFinish}
        />
      ) : (
        <UnavailableStep key={task.id} onSkip={handleNext} />
      )}
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
