import type { ReactElement } from "react";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import type { Student } from "@/api/types";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/Button";
import { ErrorState } from "@/components/ErrorState";
import { LoadingState } from "@/components/LoadingState";
import { Screen } from "@/components/Screen";
import { Tag } from "@/components/Tag";
import { avatarBackgroundColorForStudentId } from "@/features/students-list/avatar";
import { formatStudentSubtitle } from "@/features/students/StudentRow";
import { useStudents } from "@/features/students/useStudents";
import { color, shape, typography } from "@/theme";

const AVATAR_SIZE = 64;

export interface StudentDetailScreenProps {
  studentId: string;
}

/** Só dígitos (D-03/D-05); formata como (DD) NNNNN-NNNN ou (DD) NNNN-NNNN. */
export function formatContactPhone(phonenumber: string): string {
  const digits = phonenumber.replace(/\D/g, "");
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phonenumber;
}

export function formatStudentAddress(student: Student): string {
  return `${student.road}, ${student.housenumber} - CEP ${student.zipcode}`;
}

export function StudentDetailScreen({
  studentId,
}: StudentDetailScreenProps): ReactElement {
  const router = useRouter();
  const { data, isPending, isError, refetch } = useStudents();
  const [hasPhotoError, setHasPhotoError] = useState(false);

  function goToEdit() {
    router.push({
      pathname: "/shell/coming-soon",
      params: { title: "Editar aluno" },
    });
  }

  const content = (() => {
    if (isPending && !data) {
      return (
        <View style={styles.state}>
          <LoadingState label="Carregando aluno" />
        </View>
      );
    }

    if (isError && !data) {
      return (
        <View style={styles.state}>
          <ErrorState
            message="Não foi possível carregar o aluno."
            onRetry={refetch}
          />
        </View>
      );
    }

    const student = data?.find((candidate) => candidate.id === studentId);

    if (!student) {
      return (
        <View style={styles.state}>
          <Text style={styles.notFoundMessage} accessibilityRole="alert">
            Aluno não encontrado
          </Text>
          <Button label="Voltar" onPress={router.back} variant="secondary" />
        </View>
      );
    }

    return (
      <View style={styles.content}>
        <View style={styles.card}>
          <Pressable
            onPress={goToEdit}
            accessibilityRole="button"
            accessibilityLabel="Editar aluno"
            style={styles.editButton}
          >
            <Ionicons name="create-outline" size={20} color={color.accent} />
          </Pressable>
          {student.photoUrl && !hasPhotoError ? (
            <Image
              source={{ uri: student.photoUrl }}
              style={styles.avatarImage}
              accessibilityLabel={student.name}
              onError={() => setHasPhotoError(true)}
            />
          ) : (
            <View
              style={[
                styles.avatarFallback,
                {
                  backgroundColor: avatarBackgroundColorForStudentId(
                    student.id,
                  ),
                },
              ]}
            >
              <Image
                source={require("../../../assets/images/avatar-crianca.png")}
                style={styles.avatarIllustration}
                accessibilityLabel={student.name}
              />
            </View>
          )}
          <Text style={styles.name}>{student.name}</Text>
          <Text style={styles.subtitle}>{formatStudentSubtitle(student)}</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockLabel}>Endereço</Text>
          <Text style={styles.blockValue}>{formatStudentAddress(student)}</Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockLabel}>Contato do Responsável</Text>
          <Text style={styles.blockValue}>
            {formatContactPhone(student.phonenumber)}
          </Text>
        </View>

        <View style={styles.block}>
          <Text style={styles.blockLabel}>Objetivos de Aprendizado</Text>
          <View style={styles.tags}>
            {student.learningTopics.map((topic) => (
              <Tag key={topic} label={topic} variant="primary" />
            ))}
          </View>
        </View>
      </View>
    );
  })();

  return (
    <Screen scroll>
      <AppHeader
        title="Alunos"
        onMenuPress={router.back}
        onAvatarPress={() => undefined}
      />
      {content}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 16 },
  state: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  notFoundMessage: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
    textAlign: "center",
  },
  card: {
    backgroundColor: color.surface,
    borderRadius: shape.cardRadius,
    padding: 20,
    alignItems: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  editButton: {
    position: "absolute",
    top: 12,
    right: 12,
    width: shape.minTouchTarget,
    height: shape.minTouchTarget,
    borderRadius: shape.buttonRadius,
    backgroundColor: color.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarIllustration: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
  },
  name: {
    fontSize: typography.screenTitle.fontSize,
    lineHeight: typography.screenTitle.lineHeight,
    fontFamily: typography.screenTitle.fontFamily,
    color: color.text,
    marginTop: 6,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.textSecondary,
  },
  block: { gap: 6 },
  blockLabel: {
    fontSize: typography.tag.fontSize,
    lineHeight: typography.tag.lineHeight,
    fontFamily: typography.tag.fontFamily,
    color: color.textSecondary,
  },
  blockValue: {
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    fontFamily: typography.body.fontFamily,
    color: color.text,
  },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
