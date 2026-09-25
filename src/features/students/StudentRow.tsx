import type { ReactElement } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Avatar } from "@/components/Avatar";
import { Card } from "@/components/Card";
import type { Gender, Student } from "@/api/types";
import { color, typography } from "@/theme";

export const GENDER_LABEL_PT_BR: Record<Gender, string> = {
  male: "Masculino",
  female: "Feminino",
};

export function formatStudentSubtitle(student: Student): string {
  return `${student.age} anos • ${GENDER_LABEL_PT_BR[student.gender]}`;
}

export interface StudentRowProps {
  student: Student;
  selected: boolean;
  onPress: (student: Student) => void;
}

export function StudentRow({
  student,
  selected,
  onPress,
}: StudentRowProps): ReactElement {
  return (
    <Card
      onPress={() => onPress(student)}
      selected={selected}
      accessibilityLabel={student.name}
    >
      <View style={styles.row}>
        <Avatar
          uri={student.photoUrl ?? undefined}
          name={student.name}
          decorative
        />
        <View style={styles.info}>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.subtitle}>{formatStudentSubtitle(student)}</Text>
        </View>
        {selected ? (
          <Text
            style={styles.check}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
          >
            ✓
          </Text>
        ) : null}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  info: { flex: 1 },
  name: {
    fontSize: typography.cardTitle.fontSize,
    lineHeight: typography.cardTitle.lineHeight,
    fontFamily: typography.cardTitle.fontFamily,
    color: color.text,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textSecondary,
  },
  check: {
    fontSize: 18,
    fontWeight: "700",
    color: color.primary,
  },
});
