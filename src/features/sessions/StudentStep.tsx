import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";

import { listTaskNotebooks } from "@/api/endpoints/content";
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
import { color, fontFamilies, semanticColor } from "@/theme";

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
  const params = useLocalSearchParams<{
    studentId?: string;
    appointmentId?: string;
  }>();
  const {
    selectStudent,
    setAppointmentId,
    cancel,
    finish,
    seedFromServerSession,
    step: flowStep,
    sessionId: flowSessionId,
  } = useSessionFlowStore();
  const { data, isLoading, isError, refetch } = useStudents();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [existing, setExisting] = useState<TaskNotebookSession | null>(null);
  const [checkingExisting, setCheckingExisting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Evita rodar o fluxo direto duas vezes (efeitos podem repetir).
  const directStarted = useRef(false);

  const students = data ?? [];
  const filtered = normalizeForSearch(query)
    ? students.filter((student) =>
        normalizeForSearch(student.name).includes(normalizeForSearch(query)),
      )
    : students;

  useEffect(() => {
    if (!params.studentId || selected || !data || directStarted.current) {
      return;
    }
    const matched = data.find((student) => student.id === params.studentId);
    if (!matched) return;
    directStarted.current = true;
    void (async () => {
      const clear = await chooseStudent(matched);
      // Sessão iniciada pelo atendimento, Home ou paciente: sem escolha manual.
      if (clear) await proceed(matched, true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- roda uma vez por paciente (guarda em ref)
  }, [data, params.studentId, selected]);

  // Devolve true quando não há sessão aberta e a verificação não falhou.
  async function chooseStudent(student: Student): Promise<boolean> {
    setSelected(student);
    setExisting(null);
    setError(null);
    setCheckingExisting(true);
    try {
      const open = openSession(await listSessionsByStudent(student.id)) ?? null;
      setExisting(open);
      return open === null;
    } catch {
      setError("Não foi possível verificar sessões em andamento.");
      return false;
    } finally {
      setCheckingExisting(false);
    }
  }

  async function handleBack() {
    await cancel();
    router.back();
  }

  const hasLocalFlow =
    Boolean(existing) &&
    flowStep === "running" &&
    flowSessionId === existing?.id;
  // SES-05 (G-06): com `taskNotebookId` o servidor sabe o conteúdo, então a
  // sessão abre em qualquer aparelho. Sem ele, só o fluxo local conhece o
  // conteúdo e a sessão de outro aparelho só pode ser encerrada.
  const canResumeFromServer = Boolean(existing?.taskNotebookId);
  const canResume = hasLocalFlow || canResumeFromServer;

  async function resume() {
    if (hasLocalFlow || !existing || !selected) {
      router.push("/session/player");
      return;
    }
    setError(null);
    try {
      const notebook = (await listTaskNotebooks()).find(
        (item) => item.notebook.id === existing.taskNotebookId,
      );
      if (!notebook) {
        setError("O caderno desta sessão não está mais disponível.");
        return;
      }
      await seedFromServerSession({
        student: selected,
        session: existing,
        content: {
          kind: "notebook",
          id: notebook.notebook.id,
          name: notebook.notebook.description,
        },
      });
      router.push("/session/player");
    } catch {
      setError("Não foi possível retomar a sessão agora.");
    }
  }

  async function finishExisting() {
    if (!existing) return;
    try {
      if (hasLocalFlow) {
        // Passa pelo encerramento do app (SES-04) para registrar a observação.
        await finish();
        router.push("/session/finish");
        return;
      }
      await finishSession({ sessionId: existing.id });
      setExisting(null);
    } catch {
      setError("Não foi possível encerrar a sessão agora.");
    }
  }

  async function handleNext() {
    if (!selected || existing) return;
    await proceed(selected, false);
  }

  async function proceed(student: Student, replaceRoute: boolean) {
    await selectStudent(student);
    // O vínculo só vale para o paciente do atendimento; a escolha manual de
    // outro paciente (ou a sessão avulsa) limpa o que sobrou de antes.
    await setAppointmentId(
      params.appointmentId && params.studentId === student.id
        ? params.appointmentId
        : null,
    );
    if (replaceRoute) router.replace("/session/content");
    else router.push("/session/content");
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
        {existing && !canResume ? (
          <Text style={styles.description}>
            Esta sessão foi iniciada em outro aparelho e não pode ser retomada
            aqui. Encerre-a para iniciar outra.
          </Text>
        ) : null}
        {existing ? (
          <View style={styles.actions}>
            {canResume ? (
              <DsButton label="Retomar" onPress={() => void resume()} />
            ) : null}
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
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
  },
});
