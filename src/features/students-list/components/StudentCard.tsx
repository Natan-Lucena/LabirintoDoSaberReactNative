import type { ReactElement } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";

import type { Student } from "@/api/types";
import { Tag } from "@/components/Tag";
import { color, typography } from "@/theme";
import { avatarBackgroundColorForStudentId } from "@/features/students-list/avatar";
import { StudentAvatar } from "@/features/students-list/components/StudentAvatar";

const GENDER_LABEL_PT_BR: Record<Student["gender"], string> = {
  male: "Masculino",
  female: "Feminino",
};

export function formatStudentSubtitle(student: Student): string {
  return `${student.age} anos • ${GENDER_LABEL_PT_BR[student.gender]}`;
}

export interface StudentCardProps {
  student: Student;
  onPress: (student: Student) => void;
}

export function StudentCard({
  student,
  onPress,
}: StudentCardProps): ReactElement {
  return (
    <Pressable
      onPress={() => onPress(student)}
      accessibilityRole="button"
      accessibilityLabel={`${student.name}, ${formatStudentSubtitle(student)}`}
      style={styles.card}
    >
      <View style={styles.row}>
        <StudentAvatar
          photoUrl={student.photoUrl}
          backgroundColor={avatarBackgroundColorForStudentId(student.id)}
        />
        <View style={styles.info}>
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.subtitle}>{formatStudentSubtitle(student)}</Text>
          {student.learningTopics.length > 0 ? (
            <View style={styles.tags}>
              {student.learningTopics.map((topic) => (
                <Tag key={topic} label={topic} variant="neutral" />
              ))}
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      android: { elevation: 2 },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 6,
      },
    }),
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  info: { flex: 1, gap: 4 },
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
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 2 },
});
