import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { color, typography } from "@/theme";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

// Itens de 32: o hitSlop leva o alvo de toque a 44 (QA-03).
const HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  item: {
    minWidth: 32,
    minHeight: 32,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  itemSelected: { backgroundColor: color.selection },
  label: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
  labelDisabled: { color: color.textSecondary },
});

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps): ReactElement {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onPageChange(page - 1)}
        disabled={page <= 1}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel="Página anterior"
        accessibilityState={{ disabled: page <= 1 }}
        style={styles.item}
      >
        <Text style={[styles.label, page <= 1 ? styles.labelDisabled : null]}>
          {"<"}
        </Text>
      </Pressable>
      {pages.map((pageNumber) => (
        <Pressable
          key={pageNumber}
          onPress={() => onPageChange(pageNumber)}
          hitSlop={HIT_SLOP}
          accessibilityRole="button"
          accessibilityLabel={`Página ${pageNumber}`}
          accessibilityState={{ selected: pageNumber === page }}
          style={[
            styles.item,
            pageNumber === page ? styles.itemSelected : null,
          ]}
        >
          <Text style={styles.label}>{pageNumber}</Text>
        </Pressable>
      ))}
      <Pressable
        onPress={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        hitSlop={HIT_SLOP}
        accessibilityRole="button"
        accessibilityLabel="Próxima página"
        accessibilityState={{ disabled: page >= totalPages }}
        style={styles.item}
      >
        <Text
          style={[
            styles.label,
            page >= totalPages ? styles.labelDisabled : null,
          ]}
        >
          {">"}
        </Text>
      </Pressable>
    </View>
  );
}
