import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { DsButton } from "@/components/ds";
import { color, shape, typography } from "@/theme";

/** "dd/mm/aaaa" no fuso de São Paulo. */
export function formatArchivedDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

/** "dd/mm" para o cartão da lista de arquivados. */
export function formatArchivedShortDate(value: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

export interface ArchivedBannerProps {
  archivedAt?: string;
  /** Só o dono reativa; sem a função, a faixa só informa. */
  onReactivate?: () => void;
  loading?: boolean;
}

/** Faixa no topo da ficha arquivada, com "Reativar paciente" (PAC-11). */
export function ArchivedBanner({
  archivedAt,
  onReactivate,
  loading = false,
}: ArchivedBannerProps): ReactElement {
  return (
    <View style={styles.banner} accessibilityRole="summary">
      <Text style={styles.text}>
        {archivedAt
          ? `Arquivado em ${formatArchivedDate(archivedAt)}`
          : "Paciente arquivado"}
      </Text>
      {onReactivate ? (
        <DsButton
          label="Reativar paciente"
          variant="secondary"
          loading={loading}
          onPress={onReactivate}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: color.peach,
    borderRadius: shape.radius.md,
    gap: 10,
    padding: 14,
  },
  text: { ...typography.cardTitle, color: color.peachStrong },
});
