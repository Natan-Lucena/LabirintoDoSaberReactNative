import type { ReactElement } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BackHandler,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";

import { listSessionsByStudent, startSession } from "@/api/endpoints/session";
import { normalizeApiError } from "@/api/errors";
import {
  AppHeader,
  CheckList,
  DsButton,
  Field,
  InfoCard,
  SearchField,
  SegmentedControl,
} from "@/components/ds";
import {
  useContentCatalog,
  type ContentCatalogItem,
} from "@/features/sessions/useContentCatalog";
import {
  SessionFlowInvalidTransitionError,
  useSessionFlowStore,
  type SessionFlowContentKind,
} from "@/stores/session-flow";
import { color, fontFamilies } from "@/theme";

export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const KIND_OPTIONS = [
  { key: "notebook", label: "Caderno" },
  { key: "group", label: "Grupo" },
  { key: "task", label: "Atividade" },
];

const KIND_COPY: Record<
  SessionFlowContentKind,
  { title: string; search: string; loading: string; empty: string }
> = {
  notebook: {
    title: "Escolha o caderno",
    search: "Buscar caderno",
    loading: "Carregando cadernos",
    empty: "Nenhum caderno encontrado.",
  },
  group: {
    title: "Escolha o grupo",
    search: "Buscar grupo",
    loading: "Carregando grupos",
    empty: "Nenhum grupo encontrado.",
  },
  task: {
    title: "Escolha a atividade",
    search: "Buscar atividade",
    loading: "Carregando atividades",
    empty: "Nenhuma atividade encontrada.",
  },
};

const NAME_MAX_LENGTH = 100;
const isNameValid = (name: string) =>
  name.trim().length >= 1 && name.trim().length <= NAME_MAX_LENGTH;

export function ContentStep(): ReactElement {
  const router = useRouter();
  const {
    configure,
    requestStart,
    confirmStart,
    markStartUncertain,
    failStart,
    discard,
    selectStudent,
    setAppointmentId,
    sessionName,
    content,
    student,
    appointmentId,
    cancel,
    step,
  } = useSessionFlowStore();
  const [kind, setKind] = useState<SessionFlowContentKind>(
    content?.kind ?? "notebook",
  );
  const [nameInput, setNameInput] = useState(sessionName ?? "");
  const [nameTouched, setNameTouched] = useState(false);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<ContentCatalogItem | null>(
    content ? { ...content, tags: [] } : null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [uncertainSessionId, setUncertainSessionId] = useState<string | null>(
    null,
  );
  const [appointmentMissing, setAppointmentMissing] = useState(false);
  const [starting, setStarting] = useState(false);
  const [flowConflict, setFlowConflict] = useState(false);
  const startingRef = useRef(false);
  const mountedRef = useRef(true);
  const { items, isLoading, isError, refetch } = useContentCatalog(kind);
  const copy = KIND_COPY[kind];
  const filtered = useMemo(
    () =>
      query
        ? items.filter((item) =>
            normalizeForSearch(item.name).includes(normalizeForSearch(query)),
          )
        : items,
    [items, query],
  );
  const nameError =
    nameTouched && !isNameValid(nameInput)
      ? "Informe um nome com 1 a 100 caracteres."
      : undefined;

  useEffect(() => {
    mountedRef.current = true;
    // Enquanto o início está em andamento, o Voltar do Android também é ignorado.
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => startingRef.current,
    );
    return () => {
      mountedRef.current = false;
      subscription.remove();
    };
  }, []);

  function changeKind(next: string) {
    setKind(next as SessionFlowContentKind);
    setSelected(null);
    setQuery("");
  }

  async function handleBack() {
    if (startingRef.current) return;
    try {
      if (step === "startUncertain" || step === "error") {
        await discard({ confirmed: true });
      } else {
        await cancel();
      }
    } catch {
      /* etapa em que o cancelamento não se aplica: só sai */
    }
    router.back();
  }

  async function handleStart(
    linkedAppointmentId: string | null = appointmentId,
  ) {
    if (startingRef.current) return;
    setNameTouched(true);
    setAppointmentMissing(false);
    if (!student || !selected || !isNameValid(nameInput)) return;
    startingRef.current = true;
    setStarting(true);
    try {
      await runStart(student.id, selected, linkedAppointmentId);
    } finally {
      startingRef.current = false;
      if (mountedRef.current) setStarting(false);
    }
  }

  async function runStart(
    studentId: string,
    chosen: ContentCatalogItem,
    linkedAppointmentId: string | null,
  ) {
    if (!student) return;
    const name = nameInput.trim();
    try {
      if (step === "error") {
        // Falha anterior ainda no store: recomeça mantendo aluno e vínculo.
        await discard({ confirmed: true });
        await selectStudent(student);
        await setAppointmentId(linkedAppointmentId);
        if (mountedRef.current) setMessage(null);
      }
      await configure({
        name,
        content: { kind: chosen.kind, id: chosen.id, name: chosen.name },
      });
      await requestStart();
    } catch (error) {
      if (!mountedRef.current) return;
      if (error instanceof SessionFlowInvalidTransitionError) {
        setFlowConflict(true);
        setMessage(
          "Há uma sessão em andamento neste aparelho. Retome ou encerre antes de iniciar outra.",
        );
      } else {
        setMessage("Não foi possível iniciar a sessão.");
      }
      return;
    }
    setFlowConflict(false);
    try {
      // Só o caderno tem vínculo no backend (G-06); grupo e atividade ficam sem.
      const session = await startSession({
        studentId,
        name,
        ...(chosen.kind === "notebook" ? { taskNotebookId: chosen.id } : {}),
        ...(linkedAppointmentId ? { appointmentId: linkedAppointmentId } : {}),
      });
      await confirmStart(session.id);
      if (mountedRef.current) router.push("/session/player");
    } catch (error) {
      const apiError = normalizeApiError(error);
      if (apiError.isNetworkError || apiError.isTimeout) {
        await markStartUncertain();
        try {
          const active = (await listSessionsByStudent(studentId)).find(
            (session) => !session.finishedAt,
          );
          if (active) {
            if (mountedRef.current) {
              setUncertainSessionId(active.id);
              setMessage(
                "Não foi possível confirmar o início, mas há uma sessão aberta.",
              );
            }
            return;
          }
        } catch {
          /* preserve the uncertain state for an explicit retry */
        }
      }
      if (apiError.code === "APPOINTMENT_NOT_FOUND") {
        // Sem reenvio automático: o educador decide iniciar sem o vínculo.
        const notFound =
          "Atendimento não encontrado. Inicie a sessão sem vínculo?";
        await failStart(notFound);
        if (mountedRef.current) {
          setAppointmentMissing(true);
          setMessage(notFound);
        }
        return;
      }
      await failStart(apiError.message || "Não foi possível iniciar a sessão.");
      if (mountedRef.current) {
        setMessage(apiError.message || "Não foi possível iniciar a sessão.");
      }
    }
  }

  async function resumeUncertain() {
    if (!uncertainSessionId) return;
    await confirmStart(uncertainSessionId);
    router.push("/session/player");
  }

  async function retry() {
    if (!student || !selected || !isNameValid(nameInput)) return;
    await discard({ confirmed: true });
    await selectStudent(student);
    await setAppointmentId(appointmentId);
    await configure({
      name: nameInput.trim(),
      content: { kind: selected.kind, id: selected.id, name: selected.name },
    });
    setMessage(null);
  }

  async function startWithoutAppointment() {
    if (!student) return;
    await discard({ confirmed: true });
    await selectStudent(student);
    await setAppointmentId(null);
    setMessage(null);
    await handleStart(null);
  }

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader
        title="Nova sessão"
        subtitle="Nova sessão"
        onBack={() => void handleBack()}
      />
      <View style={styles.content}>
        <Field
          label="Nome da sessão"
          value={nameInput}
          onChangeText={setNameInput}
          onBlur={() => setNameTouched(true)}
          error={nameError}
          maxLength={NAME_MAX_LENGTH}
          accessibilityLabel="Nome da sessão"
          placeholder="Ex: Leitura de hoje"
        />
        <SegmentedControl
          options={KIND_OPTIONS}
          value={kind}
          onChange={changeKind}
          accessibilityLabel="Tipo de conteúdo"
        />
        <Text style={styles.title}>{copy.title}</Text>
        <SearchField
          value={query}
          onChangeText={setQuery}
          onClear={() => setQuery("")}
          placeholder={copy.search}
        />
        {isLoading ? (
          <Text accessibilityRole="progressbar">{copy.loading}</Text>
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
            data={filtered}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={
              <Text style={styles.description}>{copy.empty}</Text>
            }
            renderItem={({ item }) => (
              <CheckList
                options={[{ key: item.id, label: item.name }]}
                selected={selected?.id === item.id ? [item.id] : []}
                onChange={() => setSelected(item)}
              />
            )}
          />
        ) : null}
        {message ? (
          <InfoCard
            icon="close"
            title="Não foi possível iniciar"
            description={message}
          />
        ) : null}
        {appointmentMissing ? (
          <DsButton
            label="Iniciar sem vínculo"
            onPress={() => void startWithoutAppointment()}
          />
        ) : null}
        {message &&
        !uncertainSessionId &&
        !appointmentMissing &&
        !flowConflict ? (
          <DsButton
            label="Tentar novamente"
            variant="secondary"
            onPress={() => void retry()}
          />
        ) : null}
        {uncertainSessionId ? (
          <DsButton label="Retomar" onPress={() => void resumeUncertain()} />
        ) : null}
        <DsButton
          label="Iniciar sessão"
          fullWidth
          loading={starting}
          disabled={
            starting || !student || !selected || !isNameValid(nameInput)
          }
          onPress={() => void handleStart()}
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
    fontSize: 20,
    lineHeight: 26,
  },
  description: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
  },
});
