import { useCallback, useEffect, useState, type ReactElement } from "react";
import { Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { NOTIFICATION_KINDS } from "@/api/endpoints/push";
import type { NotificationKind } from "@/api/types";
import { AppHeader, DsButton, Switch, Toast, useToast } from "@/components/ds";
import { useOnline } from "@/hooks/useOnline";
import { color, semanticColor, typography } from "@/theme";
import {
  getPushPermission,
  type PushPermission,
} from "../push/registerForPush";
import { isPushSupported } from "../push/support";
import { activatePush } from "../push/usePushRegistration";
import {
  usePushPreferences,
  useUpdatePushPreferences,
} from "./usePushPreferences";

const KIND_LABELS: Record<NotificationKind, string> = {
  APPOINTMENTS_TODAY: "Atendimentos de hoje",
  EVOLUTION_PENDING: "Evoluções pendentes",
  PLAN_REVIEW_DUE: "Revisões de plano",
  SCALE_DRAFT_STALE: "Escalas em rascunho",
};

const SAVE_ERROR = "Não foi possível salvar. Tente de novo.";

export function NotificationPreferencesScreen(): ReactElement {
  const router = useRouter();
  const toast = useToast();
  const online = useOnline();
  const query = usePushPreferences();
  const update = useUpdatePushPreferences();
  const supported = isPushSupported();
  const [permission, setPermission] = useState<PushPermission | null>(null);
  const [activationFailed, setActivationFailed] = useState(false);
  const preferences = query.data;
  const locked = !online || update.isPending;

  useEffect(() => {
    if (!supported) return;
    void getPushPermission().then(setPermission);
  }, [supported]);

  const save = useCallback(
    (input: Parameters<typeof update.mutate>[0]) => {
      update.mutate(input, { onError: () => toast.show(SAVE_ERROR) });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [update.mutate, toast.show],
  );

  async function activate() {
    setActivationFailed(false);
    const result = await activatePush();
    setPermission(await getPushPermission());
    if (result !== "registered" && result !== "denied")
      setActivationFailed(true);
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Notificações" onBack={router.back} />
      <ScrollView contentContainerStyle={styles.content}>
        {!supported ? (
          <Text style={styles.notice}>
            O push só funciona no app instalado (development build). No Expo Go,
            as notificações aparecem só no sino.
          </Text>
        ) : null}
        {query.isPending ? (
          <Text style={styles.muted}>Carregando</Text>
        ) : query.isError || !preferences ? (
          <View style={styles.gap}>
            <Text style={styles.error} accessibilityRole="alert">
              Não foi possível carregar as preferências.
            </Text>
            <DsButton
              label="Tentar de novo"
              variant="secondary"
              onPress={() => void query.refetch()}
            />
          </View>
        ) : (
          <>
            {!online ? <Text style={styles.muted}>Sem conexão</Text> : null}
            <Text style={styles.muted}>
              Estas opções valem só para o aviso no celular. A lista de
              notificações do app continua com tudo.
            </Text>
            <Row
              title="Receber notificações no celular"
              value={preferences.pushEnabled}
              disabled={locked}
              onChange={(value) => save({ pushEnabled: value })}
            />
            {NOTIFICATION_KINDS.map((kind) => (
              <Row
                key={kind}
                title={KIND_LABELS[kind]}
                value={preferences.kinds[kind]}
                disabled={locked || !preferences.pushEnabled}
                onChange={(value) => save({ kinds: { [kind]: value } })}
              />
            ))}
          </>
        )}
        {supported && permission ? (
          <View style={styles.gap}>
            <Text style={styles.rowTitle}>Permissão do aparelho</Text>
            {permission === "granted" ? (
              <Text style={styles.muted}>Permitidas</Text>
            ) : permission === "denied" ? (
              <>
                <Text style={styles.muted}>Bloqueadas no Android</Text>
                <DsButton
                  label="Abrir configurações"
                  variant="secondary"
                  onPress={() => void Linking.openSettings()}
                />
              </>
            ) : (
              <>
                <Text style={styles.muted}>Não pedidas</Text>
                <DsButton
                  label="Ativar"
                  variant="secondary"
                  onPress={() => void activate()}
                />
              </>
            )}
            {activationFailed ? (
              <Text style={styles.error}>
                Não foi possível ativar o push neste aparelho.
              </Text>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
      <Toast message={toast.message} onHide={toast.hide} />
    </View>
  );
}

function Row({
  title,
  value,
  disabled,
  onChange,
}: {
  title: string;
  value: boolean;
  disabled: boolean;
  onChange: (value: boolean) => void;
}): ReactElement {
  return (
    <View style={styles.row}>
      <Text style={styles.rowTitle}>{title}</Text>
      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onChange}
        accessibilityLabel={title}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 16, paddingBottom: 36 },
  gap: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
    borderRadius: 14,
    backgroundColor: color.surface,
  },
  rowTitle: { ...typography.cardTitle, color: color.text, flex: 1 },
  muted: { ...typography.body, color: color.textSecondary },
  notice: { ...typography.body, color: color.text },
  error: { ...typography.body, color: semanticColor.dangerTextOnSurface },
});
