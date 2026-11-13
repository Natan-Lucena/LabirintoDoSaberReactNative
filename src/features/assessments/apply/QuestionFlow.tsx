import { useMemo, useState, type ReactElement } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";

import { saveScaleAnswers, scaleQueryKeys } from "@/api/endpoints/scales";
import { normalizeApiError } from "@/api/errors";
import type { ScaleApplication, ScaleTemplate } from "@/api/types";
import { AppHeader, DsButton, ProgressBar } from "@/components/ds";
import { StaticPressable } from "@/components/ds/StaticPressable";
import { color, fontFamilies, semanticColor, shape } from "@/theme";
import { firstUnansweredIndex, savedAnswer, sortedItems } from "./selectors";

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, paddingBottom: 36, gap: 16 },
  progress: { gap: 8 },
  progressLabel: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.bold,
    fontSize: 13,
    lineHeight: 18,
  },
  instruction: {
    color: color.ink[600],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
  },
  card: {
    gap: 12,
    padding: 16,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: shape.radius.md,
  },
  question: {
    color: color.text,
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 18,
    lineHeight: 24,
  },
  option: {
    minHeight: 48,
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: 14,
    backgroundColor: color.surface,
  },
  optionActive: {
    borderColor: color.brand[500],
    backgroundColor: color.brand[50],
  },
  optionLabel: {
    color: color.text,
    fontFamily: fontFamilies.nunito.bold,
    fontSize: 15,
    lineHeight: 20,
  },
  optionLabelActive: { color: color.brand[700] },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.semiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  done: { gap: 12 },
  doneTitle: {
    color: color.text,
    fontFamily: fontFamilies.nunito.extraBold,
    fontSize: 22,
    lineHeight: 28,
  },
});

export interface QuestionFlowProps {
  template: ScaleTemplate;
  /** Resposta do servidor ao abrir o rascunho. */
  initialApplication: ScaleApplication;
  /** Sai da aplicação (primeira pergunta). */
  onExit: () => void;
  /** Volta ao hub de avaliações (fim das perguntas). */
  onFinishLater: () => void;
}

interface PendingAnswer {
  itemId: string;
  value: number;
}

/**
 * Uma pergunta por tela (AC-AVA-02-01). A resposta é gravada no servidor ao ser
 * escolhida e o progresso só avança depois do salvamento (AC-AVA-02-02); se
 * falhar, a pergunta continua e "Tentar novamente" repete a gravação
 * (AC-AVA-02-04). `application` guarda a última resposta do servidor
 * (escore, faixa e parcial) para a tela de escore (AVA-03).
 */
export function QuestionFlow({
  template,
  initialApplication,
  onExit,
  onFinishLater,
}: QuestionFlowProps): ReactElement {
  const queryClient = useQueryClient();
  const items = useMemo(() => sortedItems(template), [template]);
  const [application, setApplication] =
    useState<ScaleApplication>(initialApplication);
  const [index, setIndex] = useState(() => {
    const first = firstUnansweredIndex(items, initialApplication);
    return first === -1 ? items.length - 1 : first;
  });
  const [finished, setFinished] = useState(
    () => firstUnansweredIndex(items, initialApplication) === -1,
  );
  const [pending, setPending] = useState<PendingAnswer | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const item = items[index];
  const total = application.score.total || items.length;
  const answeredPercent = total
    ? (application.score.answered / total) * 100
    : 0;

  async function submit(answer: PendingAnswer): Promise<void> {
    if (saving) return;
    setPending(answer);
    setSaving(true);
    setSaveError(null);
    try {
      const updated = await saveScaleAnswers(application.id, [answer]);
      setApplication(updated);
      setPending(null);
      queryClient.setQueryData(scaleQueryKeys.application(updated.id), updated);
      void queryClient.invalidateQueries({
        queryKey: [...scaleQueryKeys.all, "applications"],
      });
      if (index + 1 < items.length) {
        setIndex(index + 1);
      } else {
        const missing = firstUnansweredIndex(items, updated);
        if (missing === -1) setFinished(true);
        else setIndex(missing);
      }
    } catch (error) {
      setSaveError(normalizeApiError(error).message);
    } finally {
      setSaving(false);
    }
  }

  function goBack(): void {
    if (saving) return;
    setPending(null);
    setSaveError(null);
    if (finished) {
      setFinished(false);
      setIndex(items.length - 1);
    } else if (index > 0) {
      setIndex(index - 1);
    } else {
      onExit();
    }
  }

  const header = (
    <AppHeader
      title={template.name}
      subtitle={application.studentName}
      onBack={goBack}
    />
  );

  if (finished || !item) {
    return (
      <View style={styles.screen}>
        {header}
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.done}>
            <Text style={styles.doneTitle}>Respostas salvas</Text>
            <Text style={styles.instruction}>
              As respostas desta escala estão salvas no rascunho.
            </Text>
            <DsButton
              label="Voltar às avaliações"
              fullWidth
              onPress={onFinishLater}
            />
            <DsButton
              label="Revisar respostas"
              variant="secondary"
              fullWidth
              onPress={goBack}
            />
          </View>
        </ScrollView>
      </View>
    );
  }

  const selected =
    pending?.itemId === item.id
      ? pending.value
      : savedAnswer(application, item.id);

  return (
    <View style={styles.screen}>
      {header}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.progress}>
          <Text style={styles.progressLabel}>
            {`${index + 1} de ${items.length}`}
          </Text>
          <ProgressBar
            value={answeredPercent}
            accessibilityLabel={`${application.score.answered} de ${total} respostas salvas`}
          />
        </View>
        <Text style={styles.instruction}>{template.instructions}</Text>
        <View style={styles.card}>
          <Text style={styles.question}>{item.text}</Text>
          {template.options.map((option) => {
            const active = selected === option.value;

            return (
              <StaticPressable
                key={option.value}
                onPress={() =>
                  void submit({ itemId: item.id, value: option.value })
                }
                accessibilityRole="button"
                accessibilityLabel={option.label}
                accessibilityState={{ selected: active, disabled: saving }}
                style={[styles.option, active && styles.optionActive]}
              >
                <Text
                  style={[
                    styles.optionLabel,
                    active && styles.optionLabelActive,
                  ]}
                >
                  {option.label}
                </Text>
              </StaticPressable>
            );
          })}
        </View>
        {saveError ? (
          <>
            <Text accessibilityRole="alert" style={styles.error}>
              {saveError}
            </Text>
            {pending ? (
              <DsButton
                label="Tentar novamente"
                variant="secondary"
                onPress={() => void submit(pending)}
              />
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
