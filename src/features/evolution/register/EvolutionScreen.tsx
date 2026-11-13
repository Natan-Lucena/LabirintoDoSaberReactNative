// EVO-01 — Evolução da sessão (`EvolutionScreen` do Figma Make). Substitui a
// observação pós-sessão (G-56). Os critérios vêm só do PE da sessão (G-57);
// sem PE, a tela mostra o atalho "Criar PE" e só o registro descritivo.
// Contrato PROVISÓRIO: docs/entrega-4/ESPECIFICACAO-BACKEND.md §3 (leva 1).
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactElement,
} from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import {
  Alert,
  BackHandler,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { z } from "zod";

import {
  createSessionEvolution,
  evolutionQueryKeys,
  getEvolutionContext,
} from "@/api/endpoints/evolution";
import { normalizeApiError, type ApiError } from "@/api/errors";
import type { EvolutionContext } from "@/api/types";
import { AppHeader, DsButton, InfoCard, SuccessPanel } from "@/components/ds";
import { appointmentQueryKeys } from "@/features/appointments/useAppointments";
import { planQueryKeys } from "@/features/plans/hub/usePlans";
import { NEW_PLAN_ROUTE } from "@/features/plans/routes";
import { useSessionFlowStore } from "@/stores/session-flow";
import { color, fontFamilies, semanticColor } from "@/theme";
import { dayKey, TIME_ZONE } from "@/utils/date";
import { EvolutionFormSections } from "./EvolutionFormSections";
import {
  evolutionRecordRoute,
  HOME_ROUTE,
  patientRecordRoute,
  type EvolutionOrigin,
} from "./routes";
import {
  evolutionFormSchema,
  initialEvolutionValues,
  toCreatePayload,
  type EvolutionFormValues,
} from "./schema";

const DATE_FORMATTER = new Intl.DateTimeFormat("pt-BR", {
  timeZone: TIME_ZONE,
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
});

/** Códigos que a API traduz em `normalizeApiError` (mensagem já em português). */
const TRANSLATED_SAVE_CODES = new Set([
  "INVALID_ATTEMPTS",
  "INVALID_PLAN",
  "GOAL_NOT_IN_PLAN",
  "PLAN_NOT_EDITABLE",
]);

/**
 * `SESSION_NOT_FOUND` e `SESSION_NOT_FINISHED` ficam sem tradução em
 * `normalizeApiError` de propósito: a tela os mapeia pelo `code`.
 */
function sessionErrorMessage(error: ApiError): string | null {
  if (error.code === "SESSION_NOT_FOUND" || error.status === 404) {
    return "Sessão não encontrada. Ela pode ter sido removida.";
  }
  if (error.code === "SESSION_NOT_FINISHED") {
    return "Esta sessão ainda não foi encerrada. Encerre a sessão antes de registrar a evolução.";
  }
  if (error.status === 403) {
    return "Você não tem acesso a esta sessão.";
  }
  return null;
}

function saveErrorMessage(error: ApiError): string {
  const sessionMessage = sessionErrorMessage(error);
  if (sessionMessage) return sessionMessage;
  if (error.code && TRANSLATED_SAVE_CODES.has(error.code)) {
    return error.message;
  }
  if (error.isNetworkError || error.isTimeout) {
    return "Não foi possível confirmar o registro. Verifique a conexão e tente novamente.";
  }
  return "Não foi possível salvar a evolução. Tente novamente.";
}

function criteriaCountLabel(total: number): string {
  return total === 1
    ? "1 critério mensurável"
    : `${total} critérios mensuráveis`;
}

/**
 * Libera o fluxo de sessão local quando ele aponta para esta sessão: a
 * Evolução é o último passo (G-56). Volta a store a "idle" para a próxima.
 */
async function releaseSessionFlow(sessionId: string): Promise<void> {
  const flow = useSessionFlowStore.getState();
  if (flow.step !== "awaitingEvolution" || flow.sessionId !== sessionId) {
    return;
  }
  try {
    await flow.close();
    const educatorId = flow.educatorId;
    if (educatorId) {
      await useSessionFlowStore.getState().hydrate(educatorId);
    }
  } catch {
    // Sem armazenamento legível, a retomada some ao reabrir o app.
  }
}

/**
 * Sair da Evolução: com `from` (aberta pelo hub) volta à tela de origem quando
 * há histórico; sem ele (fluxo de sessão, retomada), vai para a Início.
 */
function goBackOrHome(
  router: ReturnType<typeof useRouter>,
  from: EvolutionOrigin | undefined,
): void {
  if (from && router.canGoBack()) {
    router.back();
  } else {
    router.replace(HOME_ROUTE);
  }
}

export interface EvolutionScreenProps {
  sessionId: string;
  /** Tela que abriu a Evolução (hub); ausente no fluxo de sessão. */
  from?: EvolutionOrigin;
}

export function EvolutionScreen({
  sessionId,
  from,
}: EvolutionScreenProps): ReactElement {
  const router = useRouter();
  const contextQuery = useQuery({
    queryKey: evolutionQueryKeys.context(sessionId),
    queryFn: () => getEvolutionContext(sessionId),
    retry: false,
  });
  const { refetch } = contextQuery;
  const hasData = contextQuery.data !== undefined;

  // Ao voltar de "Criar PE" (ou de outra tela), o contexto é buscado de novo
  // para o PE recém-criado aparecer. A primeira vez é a carga normal.
  const focusedOnceRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      if (!focusedOnceRef.current) {
        focusedOnceRef.current = true;
        return;
      }
      void refetch();
    }, [refetch]),
  );

  const error = contextQuery.error
    ? normalizeApiError(contextQuery.error)
    : null;
  // Rede, tempo esgotado e 5xx podem dar certo depois; o resto (404, 403,
  // 409 SESSION_NOT_FINISHED…) não muda tentando de novo.
  const retryable =
    error !== null &&
    (error.isNetworkError ||
      error.isTimeout ||
      error.status === undefined ||
      error.status >= 500);

  function leaveFromError(): void {
    // Sem saída possível nesta sessão: libera o fluxo para não prender o
    // profissional num ciclo Início → encerramento → Evolução → erro.
    if (!retryable) void releaseSessionFlow(sessionId);
    goBackOrHome(router, from);
  }

  // O Voltar do Android segue o mesmo caminho (leaveFromError) enquanto a
  // Evolução não abriu.
  useEffect(() => {
    if (hasData) return;
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (!retryable) void releaseSessionFlow(sessionId);
        goBackOrHome(router, from);
        return true;
      },
    );
    return () => subscription.remove();
  }, [from, hasData, retryable, router, sessionId]);

  if (contextQuery.data) {
    return (
      <EvolutionRegister
        sessionId={sessionId}
        context={contextQuery.data}
        from={from}
      />
    );
  }

  const message = error
    ? (sessionErrorMessage(error) ??
      (error.isNetworkError || error.isTimeout
        ? "Sem conexão para carregar a sessão. Verifique a rede e tente novamente."
        : retryable
          ? "Não foi possível carregar a sessão. Tente novamente."
          : "Não foi possível abrir a evolução desta sessão."))
    : null;

  return (
    <SafeAreaView style={styles.screen}>
      <AppHeader title="Evolução da sessão" onBack={leaveFromError} />
      <ScrollView contentContainerStyle={styles.content}>
        {message ? (
          <View style={styles.block}>
            <Text style={styles.error} accessibilityRole="alert" accessible>
              {message}
            </Text>
            {retryable ? (
              <DsButton
                label="Tentar novamente"
                variant="secondary"
                fullWidth
                onPress={() => void refetch()}
              />
            ) : null}
            <DsButton
              label="Voltar ao início"
              variant="ghost"
              fullWidth
              onPress={leaveFromError}
            />
          </View>
        ) : (
          <Text style={styles.hint} accessibilityRole="progressbar">
            Carregando a sessão...
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

type Outcome =
  | { kind: "saved" }
  | { kind: "alreadyExists"; evolutionId?: string; fromContext?: boolean };

type EvolutionFormOutput = z.output<typeof evolutionFormSchema>;

function EvolutionRegister({
  sessionId,
  context,
  from,
}: {
  sessionId: string;
  context: EvolutionContext;
  from?: EvolutionOrigin;
}): ReactElement {
  const router = useRouter();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { session, plan } = context;
  const [outcome, setOutcome] = useState<Outcome | null>(
    context.existingEvolutionId
      ? {
          kind: "alreadyExists",
          evolutionId: context.existingEvolutionId,
          fromContext: true,
        }
      : null,
  );
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingRef = useRef(false);
  // Saída autorizada (salvo, já existente ou descarte confirmado).
  const leavingRef = useRef(false);

  const {
    control,
    handleSubmit,
    getValues,
    reset,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EvolutionFormValues, unknown, EvolutionFormOutput>({
    resolver: zodResolver(evolutionFormSchema),
    defaultValues: initialEvolutionValues(context),
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "criteria",
  });
  const criteria = useWatch({ control, name: "criteria" }) ?? [];

  // Um PE criado pelo atalho "Criar PE" chega no contexto buscado de novo ao
  // voltar à tela: os critérios passam a ser os dele; o registro escrito fica.
  const planId = context.plan?.id;
  const planIdRef = useRef(planId);
  useEffect(() => {
    if (planIdRef.current === planId) return;
    planIdRef.current = planId;
    const record = getValues("descriptiveRecord");
    reset(initialEvolutionValues(context));
    if (record) setValue("descriptiveRecord", record, { shouldDirty: true });
  }, [context, getValues, planId, reset, setValue]);

  const mutation = useMutation({
    mutationFn: createSessionEvolution,
    retry: false,
  });
  const saving = mutation.isPending;
  const hasUnsavedChanges = isDirty && outcome === null;

  // A evolução já existe (no contexto ou pelo 409): nada a salvar aqui. Vinda
  // do contexto (`existingEvolutionId`), a tela abre direto o registro.
  useEffect(() => {
    if (outcome?.kind !== "alreadyExists") return;
    leavingRef.current = true;
    void releaseSessionFlow(sessionId);
    if (outcome.fromContext && outcome.evolutionId)
      router.replace(evolutionRecordRoute(outcome.evolutionId));
  }, [outcome, router, sessionId]);

  // `proceed`: refaz a navegação original (gesto/voltar da pilha) depois de
  // liberar o fluxo; sem ela, a saída vai para a Início.
  const leave = useCallback(
    (proceed?: () => void): void => {
      leavingRef.current = true;
      void releaseSessionFlow(sessionId);
      if (proceed) {
        proceed();
      } else {
        goBackOrHome(router, from);
      }
    },
    [from, router, sessionId],
  );

  const requestLeave = useCallback(
    (proceed?: () => void): void => {
      if (!hasUnsavedChanges) {
        leave(proceed);
        return;
      }
      Alert.alert(
        "Sair sem salvar a evolução?",
        "As alterações não salvas serão perdidas.",
        [
          { text: "Continuar editando", style: "cancel" },
          {
            text: "Sair sem salvar",
            style: "destructive",
            onPress: () => leave(proceed),
          },
        ],
      );
    },
    [hasUnsavedChanges, leave],
  );

  // AC-EVO-01-04: o Voltar do Android segue a mesma regra do botão voltar.
  useEffect(() => {
    const subscription = BackHandler.addEventListener(
      "hardwareBackPress",
      () => {
        if (leavingRef.current) {
          goBackOrHome(router, from);
          return true;
        }
        requestLeave();
        return true;
      },
    );
    return () => subscription.remove();
  }, [from, requestLeave, router]);

  // Gestos e outras saídas da pilha passam pela mesma confirmação.
  useEffect(() => {
    return navigation.addListener("beforeRemove", (event) => {
      if (leavingRef.current) return;
      event.preventDefault();
      requestLeave(() => navigation.dispatch(event.data.action));
    });
  }, [navigation, requestLeave]);

  async function finishSaved(): Promise<void> {
    leavingRef.current = true;
    await releaseSessionFlow(sessionId);
    // Prontuário, pendentes, metas do PE e ficha do paciente mudam.
    void queryClient.invalidateQueries({ queryKey: evolutionQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: planQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: ["task-notebook-session"] });
    void queryClient.invalidateQueries({ queryKey: appointmentQueryKeys.all });
  }

  async function save(values: EvolutionFormOutput): Promise<void> {
    if (savingRef.current || outcome) return;
    savingRef.current = true;
    setSaveError(null);
    try {
      await mutation.mutateAsync(toCreatePayload(sessionId, context, values));
      await finishSaved();
      setOutcome({ kind: "saved" });
    } catch (caught) {
      const error = normalizeApiError(caught);
      if (error.code === "EVOLUTION_ALREADY_EXISTS") {
        // AC-EVO-01-06: leva ao registro existente, sem duplicar.
        await finishSaved();
        setOutcome({
          kind: "alreadyExists",
          evolutionId: (caught as { evolutionId?: string }).evolutionId,
        });
        return;
      }
      setSaveError(saveErrorMessage(error));
    } finally {
      savingRef.current = false;
    }
  }

  const sessionDate = DATE_FORMATTER.format(new Date(session.startedAt));
  const header = (
    <AppHeader
      title="Evolução da sessão"
      subtitle={`${session.studentName} · ${sessionDate}`}
      onBack={() => requestLeave()}
    />
  );

  if (outcome) {
    const saved = outcome.kind === "saved";
    const existingId = saved ? undefined : outcome.evolutionId;
    return (
      <SafeAreaView style={styles.screen}>
        {header}
        <ScrollView contentContainerStyle={styles.content}>
          <SuccessPanel
            title={saved ? "Evolução registrada" : "Evolução já registrada"}
            description={
              saved
                ? "O prontuário do paciente foi atualizado."
                : "Esta sessão já tem uma evolução registrada; nada foi duplicado. Consulte-a no prontuário do paciente."
            }
          />
          <DsButton
            label={existingId ? "Ver evolução registrada" : "Ver prontuário"}
            fullWidth
            onPress={() =>
              router.replace(
                existingId
                  ? evolutionRecordRoute(existingId)
                  : patientRecordRoute(session.studentId),
              )
            }
          />
          <DsButton
            label="Voltar ao início"
            variant="ghost"
            fullWidth
            onPress={() => router.replace(HOME_ROUTE)}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      {header}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {plan ? (
          <InfoCard
            icon="clipboard"
            title={`${plan.type} · ${plan.title}`}
            description={`${session.durationMinutes} min · ${criteriaCountLabel(fields.length)}`}
          />
        ) : (
          <InfoCard
            icon="file"
            title="Sessão sem PE"
            description="Os critérios da evolução vêm do PE da sessão. Crie um PE para medir critérios; por agora, registre só o descritivo."
            action={{
              label: "Criar PE",
              onPress: () =>
                router.push({
                  pathname: NEW_PLAN_ROUTE,
                  params: {
                    studentId: session.studentId,
                    type: "PE",
                    sessionDate: dayKey(new Date(session.startedAt)),
                  },
                }),
            }}
          />
        )}

        <EvolutionFormSections
          control={control}
          fields={fields}
          criteria={criteria}
          errors={errors}
          append={append}
          remove={remove}
          saving={saving}
          showCriteria={Boolean(plan)}
          sessionId={sessionId}
          showGoalStatus
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
          disabled={saving}
          onPress={() => void handleSubmit(save)()}
        />
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
  },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
});
