import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { listSessionsByStudent, finishSession } from "@/api/endpoints/session";
import type { Student, TaskNotebookSession } from "@/api/types";
import {
  AppHeader,
  Avatar,
  DsButton,
  InfoCard,
  SearchField,
} from "@/components/ds";
import { useStudents } from "@/features/students/useStudents";
import { useSessionFlowStore } from "@/stores/session-flow";
import { color, fontFamilies } from "@/theme";

export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function openSession(
  sessions: TaskNotebookSession[],
): TaskNotebookSession | undefined {
  return sessions.find((session) => !session.finishedAt);
}

export function StudentStep(): ReactElement {
  const router = useRouter();
  const params = useLocalSearchParams<{ studentId?: string }>();
  const { selectStudent, cancel, confirmStart } = useSessionFlowStore();
  const { data, isLoading, isError, refetch } = useStudents();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [existing, setExisting] = useState<TaskNotebookSession | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const students = data ?? [];
  const filtered = normalizeForSearch(query)
    ? students.filter((student) =>
        normalizeForSearch(student.name).includes(normalizeForSearch(query)),
      )
    : students;

  useEffect(() => {
    if (!params.studentId || selected || !data) return;
    const matched = data.find((student) => student.id === params.studentId);
    if (matched) void chooseStudent(matched);
  }, [data, params.studentId, selected]);

  async function chooseStudent(student: Student) {
    setSelected(student);
    setExisting(null);
    setError(null);
    setCheckingExisting(true);
    try {
      setExisting(openSession(await listSessionsByStudent(student.id)) ?? null);
    } catch {
      setError("Não foi possível verificar sessões em andamento.");
    } finally {
      setCheckingExisting(false);
    }
  }

  async function handleBack() {
    await cancel();
    router.back();
  }

  async function resume(session: TaskNotebookSession) {
    await selectStudent(selected!);
    await confirmStart(session.id);
    router.push("/session/player");
  }

  async function finishExisting() {
    if (!existing) return;
    try {
      await finishSession({ sessionId: existing.id });
      setExisting(null);
    } catch {
      setError("Não foi possível encerrar a sessão agora.");
    }
  }

  async function handleNext() {
    if (!selected || existing) return;
    await selectStudent(selected);
    router.push("/session/content");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        title="Nova sessão"
        subtitle="Nova sessão"
        onBack={() => void handleBack()}
      />
      <View style={styles.content}>
        <Text style={styles.title}>Escolha o paciente</Text>
        <Text style={styles.description}>
          Selecione quem participará desta sessão.
        </Text>
        <SearchField
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery("")}
          placeholder="Buscar paciente"
        />
        {isLoading ? (
          <Text accessibilityRole="progressbar">Carregando pacientes</Text>
        ) : null}
        {isError ? (
          <DsButton
            label="Tentar novamente"
            variant="secondary"
            onPress={() => void refetch()}
          />
        ) : null}
        {!isLoading && !isError ? (
          <FlatList
            style={styles.list}
            data={filtered}
            keyExtractor={(student) => student.id}
            ListEmptyComponent={
              <Text style={styles.description}>
                Nenhum paciente encontrado.
              </Text>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => void chooseStudent(item)}
                accessibilityRole="button"
                accessibilityLabel={item.name}
                accessibilityState={{ selected: selected?.id === item.id }}
                style={[
                  styles.patient,
                  selected?.id === item.id && styles.patientSelected,
                ]}
              >
                <Avatar name={item.name} />
                <View style={styles.patientCopy}>
                  <Text style={styles.patientName}>{item.name}</Text>
                  <Text style={styles.patientDetail}>{item.age} anos</Text>
                </View>
              </Pressable>
            )}
          />
        ) : null}
        {checkingExisting ? (
          <Text style={styles.description}>
            Verificando sessões em andamento...
          </Text>
        ) : null}
        {existing ? (
          <InfoCard
            icon="play"
            title="Sessão em andamento"
            description={`“${existing.name}” ainda não foi encerrada.`}
          />
        ) : null}
        {existing ? (
          <View style={styles.actions}>
            <DsButton label="Retomar" onPress={() => void resume(existing)} />
            <DsButton
              label="Encerrar agora"
              variant="secondary"
              onPress={() => void finishExisting()}
            />
          </View>
        ) : null}
        {error ? (
          <Text accessibilityRole="alert" style={styles.error}>
            {error}
          </Text>
        ) : null}
        <DsButton
          label="Continuar"
          fullWidth
          disabled={!selected || !!existing || checkingExisting}
          onPress={() => void handleNext()}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { flex: 1, padding: 20, gap: 14 },
  title: {
    color: color.text,
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 22,
    lineHeight: 28,
  },
  description: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  list: { flex: 1 },
  patient: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 16,
    backgroundColor: color.surface,
  },
  patientSelected: {
    borderColor: color.brand[500],
    backgroundColor: color.brand[50],
  },
  patientCopy: { flex: 1 },
  patientName: {
    color: color.text,
    fontFamily: fontFamilies.nunito.bold,
    fontSize: 15,
  },
  patientDetail: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 13,
  },
  actions: { flexDirection: "row", gap: 8 },
  error: {
    color: color.danger,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
  },
});
