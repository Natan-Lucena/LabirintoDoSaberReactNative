import type { ReactElement } from "react";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";

import { getTaskById } from "@/api/endpoints/content";
import { ApiError } from "@/api/errors";
import type { PrintableContent, Task } from "@/api/types";
import { AppHeader, DsButton, Field, Toast, useToast } from "@/components/ds";
import { LoadingState } from "@/components/LoadingState";
import { color, fontFamilies } from "@/theme";

import { printPrintable, sharePrintablePdf } from "./pdf";
import { PrintablePreview } from "./PrintablePreview";

export interface PrintableScreenProps {
  taskId: string;
}

function printableContent(task: Task): PrintableContent | null {
  const content = task.content as PrintableContent | undefined;
  return task.type === "printable" && content?.kind === "printable"
    ? content
    : null;
}

type Busy = "print" | "share" | null;

export function PrintableScreen({
  taskId,
}: PrintableScreenProps): ReactElement {
  const router = useRouter();
  const toast = useToast();
  // Estado local: o nome da criança não é salvo nem enviado.
  const [childName, setChildName] = useState("");
  const [busy, setBusy] = useState<Busy>(null);
  const query = useQuery({
    queryKey: ["task", taskId],
    queryFn: () => getTaskById(taskId),
  });

  const isNotFound =
    query.error instanceof ApiError && query.error.code === "TASK_NOT_FOUND";
  const content = query.data ? printableContent(query.data) : null;

  async function run(kind: Exclude<Busy, null>, doc: PrintableContent) {
    setBusy(kind);
    try {
      if (kind === "print") await printPrintable(doc, childName);
      else await sharePrintablePdf(doc, childName);
    } catch {
      toast.show("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
      setBusy(null);
    }
  }

  function renderState(message: string, action: ReactElement): ReactElement {
    return (
      <View style={styles.state}>
        <Text style={styles.stateText} accessibilityRole="alert" accessible>
          {message}
        </Text>
        {action}
      </View>
    );
  }

  const back = (
    <DsButton label="Voltar" variant="secondary" onPress={router.back} />
  );

  let body: ReactElement;
  if (query.isPending) {
    body = <LoadingState label="Carregando atividade" />;
  } else if (isNotFound) {
    body = renderState("Atividade não encontrada.", back);
  } else if (query.isError || !query.data) {
    body = renderState(
      "Não foi possível carregar a atividade.",
      <DsButton
        label="Tentar novamente"
        variant="secondary"
        onPress={() => void query.refetch()}
      />,
    );
  } else if (!content) {
    body = renderState("Esta atividade não é imprimível.", back);
  } else {
    body = (
      <ScrollView contentContainerStyle={styles.scroll}>
        <Field
          label="Nome da criança (opcional)"
          value={childName}
          onChangeText={setChildName}
          maxLength={40}
          hint="Aparece só no PDF; não é salvo."
        />
        <PrintablePreview content={content} childName={childName} />
        <DsButton
          label="Imprimir"
          icon="print"
          onPress={() => void run("print", content)}
          loading={busy === "print"}
          disabled={busy !== null}
          fullWidth
        />
        <DsButton
          label="Compartilhar PDF"
          variant="secondary"
          onPress={() => void run("share", content)}
          loading={busy === "share"}
          disabled={busy !== null}
          fullWidth
        />
      </ScrollView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["left", "right", "bottom"]}>
      <AppHeader
        title="Imprimível"
        subtitle={content?.title}
        onBack={router.back}
      />
      {body}
      <Toast message={toast.message} onHide={toast.hide} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  scroll: { padding: 20, paddingBottom: 40, gap: 16 },
  state: { alignItems: "center", gap: 16, padding: 24 },
  stateText: {
    color: color.ink[800],
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 16,
    lineHeight: 22,
    textAlign: "center",
  },
});
