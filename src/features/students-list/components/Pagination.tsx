import type { ReactElement } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { color, typography } from "@/theme";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps): ReactElement {
  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);

  return (
    <View style={styles.row} accessibilityRole="tablist">
      <Pressable
        onPress={() => onPageChange(page - 1)}
        disabled={page <= 1}
        accessibilityRole="button"
        accessibilityLabel="Página anterior"
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
        accessibilityRole="button"
        accessibilityLabel="Próxima página"
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
  labelDisabled: { color: color.textTertiary },
});
