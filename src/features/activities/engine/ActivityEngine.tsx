import type { ReactElement } from "react";
import { Fragment, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import type { Task } from "@/api/types";
import { DsButton, ProgressBar, SuccessPanel } from "@/components/ds";
import { color, fontFamilies } from "@/theme";
import { isActivityTypePlayable, renderActivity } from "./registry";
import type { ActivityAttempt } from "./types";

export interface ActivityEngineProps {
  tasks: Task[];
  /**
   * Resultado da primeira tentativa de cada item, enviado uma única vez.
   * Sem esta prop a atividade roda sem registro (G-35: a API não tem um
   * endpoint de resultado fora da sessão).
   */
  onResult?: (task: Task, attempt: ActivityAttempt) => void;
  onFinish: () => void;
}

export function ActivityEngine({
  tasks,
  onResult,
  onFinish,
}: ActivityEngineProps): ReactElement {
  const [index, setIndex] = useState(0);
  const [solved, setSolved] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [firstTryCorrect, setFirstTryCorrect] = useState(0);
  const [recorded, setRecorded] = useState<ReadonlySet<string>>(new Set());

  if (tasks.length === 0) {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText}>Nenhuma atividade para jogar.</Text>
        <DsButton label="Sair" variant="secondary" onPress={onFinish} />
      </View>
    );
  }

  const playable = tasks.filter((item) => isActivityTypePlayable(item.type));

  if (completed) {
    return (
      <View style={styles.state}>
        <SuccessPanel
          title="Atividade concluída"
          description={`Você acertou ${firstTryCorrect} de ${playable.length} na primeira tentativa.`}
        />
        <DsButton label="Sair" fullWidth onPress={onFinish} />
      </View>
    );
  }

  const task = tasks[index]!;
  const isLast = index === tasks.length - 1;
  const activity = renderActivity(task.type, {
    task,
    onAttempt: handleAttempt,
    onSolved: () => setSolved(true),
  });

  function advance() {
    if (isLast) {
      setCompleted(true);
      return;
    }
    setIndex(index + 1);
    setSolved(false);
  }

  function handleAttempt(attempt: ActivityAttempt) {
    if (recorded.has(task.id)) {
      return;
    }
    setRecorded((current) => new Set(current).add(task.id));
    if (attempt.correct) {
      setFirstTryCorrect((value) => value + 1);
    }
    onResult?.(task, attempt);
  }

  const progress = ((index + 1) / tasks.length) * 100;

  return (
    <ScrollView contentContainerStyle={styles.shell}>
      <View style={styles.progress}>
        <Text style={styles.progressLabel}>
          Atividade {index + 1} de {tasks.length}
        </Text>
        <ProgressBar
          value={progress}
          accessibilityLabel={`Progresso: atividade ${index + 1} de ${tasks.length}`}
        />
      </View>

      {activity ? (
        <Fragment key={task.id}>{activity}</Fragment>
      ) : (
        <View style={styles.state}>
          <Text style={styles.stateText} accessibilityRole="alert" accessible>
            Tipo de atividade indisponível
          </Text>
          <DsButton
            label="Pular"
            variant="secondary"
            fullWidth
            onPress={advance}
          />
        </View>
      )}

      {activity && solved ? (
        <DsButton
          label={isLast ? "Concluir" : "Próxima"}
          fullWidth
          onPress={advance}
        />
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
  state: { alignItems: "center", gap: 16, padding: 20 },
  stateText: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});
