import type { ReactElement } from "react";
import { useState } from "react";
import { FlashList } from "@shopify/flash-list";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import type { Appointment, Student } from "@/api/types";
import { FigmaIcon } from "@/components/FigmaIcon";
import {
  Avatar,
  DsButton,
  Fab,
  FilterChip,
  FilterRow,
  SearchField,
} from "@/components/ds";
import { useAppointments } from "@/features/appointments/useAppointments";
import { useStudents } from "@/features/students/useStudents";
import { color, getContentPadding, shape, typography } from "@/theme";

import {
  filterPatients,
  formatNextAppointment,
  nextAppointmentByStudentId,
  patientAvatarTone,
  sortPatientsByName,
  type PatientFilter,
} from "./selectors";

const filterOptions = [
  { key: "all", label: "Todos" },
  { key: "today", label: "Com sessão hoje" },
];

function navigate(
  router: ReturnType<typeof useRouter>,
  pathname: string,
): void {
  router.push(pathname as Parameters<typeof router.push>[0]);
}

function learningTopicsSummary(patient: Student): string {
  return (
    patient.learningTopics.slice(0, 2).join(", ") || "Sem dificuldades mapeadas"
  );
}

function PatientCard({
  patient,
  appointment,
  onPress,
}: {
  patient: Student;
  appointment: Appointment | undefined;
  onPress: () => void;
}): ReactElement {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ficha de ${patient.name}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        pressed ? styles.cardPressed : null,
      ]}
    >
      <Avatar name={patient.name} tone={patientAvatarTone(patient.id)} />
      <View style={styles.cardCopy}>
        <Text style={styles.patientName} numberOfLines={1}>
          {patient.name}
        </Text>
        <Text style={styles.patientMeta} numberOfLines={1}>
          {patient.age} anos · {learningTopicsSummary(patient)}
        </Text>
        {appointment ? (
          <View style={styles.appointmentLine}>
            <FigmaIcon name="clock" size={15} color={color.ink[500]} />
            <Text style={styles.appointmentText} numberOfLines={1}>
              Próximo atendimento: {formatNextAppointment(appointment)}
            </Text>
          </View>
        ) : null}
      </View>
      <FigmaIcon name="chevron" size={18} color={color.ink[500]} />
    </Pressable>
  );
}

function StatePanel({
  title,
  message,
  retry,
}: {
  title: string;
  message: string;
  retry?: () => void;
}): ReactElement {
  return (
    <View
      style={styles.statePanel}
      accessibilityRole={retry ? "alert" : undefined}
    >
      <Text style={styles.stateTitle}>{title}</Text>
      <Text style={styles.stateMessage}>{message}</Text>
      {retry ? <DsButton label="Tentar novamente" onPress={retry} /> : null}
    </View>
  );
}

export function PatientsListScreen(): ReactElement {
  const router = useRouter();
  const studentsQuery = useStudents();
  const appointmentsQuery = useAppointments();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<PatientFilter>("all");

  const patients = studentsQuery.data ?? [];
  const appointments = appointmentsQuery.data ?? [];
  const isInitialLoading =
    (studentsQuery.isPending && !studentsQuery.data) ||
    (appointmentsQuery.isPending && !appointmentsQuery.data);
  const isInitialError =
    (!studentsQuery.data && studentsQuery.isError) ||
    (!appointmentsQuery.data && appointmentsQuery.isError);
  const visiblePatients = sortPatientsByName(
    filterPatients(patients, appointments, search, filter),
  );
  const appointmentsByPatient = nextAppointmentByStudentId(appointments);

  if (isInitialLoading) {
    return (
      <View style={styles.loading} accessibilityLabel="Carregando pacientes">
        <ActivityIndicator color={color.brand[700]} />
        <Text style={styles.stateMessage}>Carregando pacientes</Text>
      </View>
    );
  }

  if (isInitialError) {
    return (
      <View style={styles.fullScreen}>
        <StatePanel
          title="Não foi possível carregar os pacientes"
          message="Tente novamente em instantes."
          retry={() => {
            void studentsQuery.refetch();
            void appointmentsQuery.refetch();
          }}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.controls}>
        <Text style={styles.eyebrow}>{patients.length} pacientes ativos</Text>
        <Text style={styles.title} accessibilityRole="header">
          Pacientes
        </Text>
        <SearchField
          value={search}
          onChangeText={setSearch}
          onClear={() => setSearch("")}
          placeholder="Buscar paciente"
        />
        <View style={styles.filters}>
          <FilterRow
            options={filterOptions}
            value={filter}
            onChange={(value) => setFilter(value as PatientFilter)}
          />
          <FilterChip
            label="Pendências · Em breve"
            onPress={() => undefined}
            disabled
          />
        </View>
      </View>
      {visiblePatients.length === 0 ? (
        <View style={styles.emptyList}>
          <StatePanel
            title="Nenhum paciente encontrado"
            message={
              search
                ? "Ajuste a busca para encontrar outro paciente."
                : "Cadastre um paciente para começar."
            }
          />
        </View>
      ) : (
        <FlashList
          data={visiblePatients}
          keyExtractor={(patient) => patient.id}
          renderItem={({ item }) => (
            <PatientCard
              patient={item}
              appointment={appointmentsByPatient.get(item.id)}
              onPress={() => navigate(router, `/students/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
      <View style={styles.fabContainer}>
        <Fab
          accessibilityLabel="Cadastrar paciente"
          onPress={() => navigate(router, "/students/new")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  controls: {
    gap: 14,
    paddingHorizontal: getContentPadding(390),
    paddingTop: 20,
    paddingBottom: 12,
  },
  eyebrow: { ...typography.eyebrow, color: color.ink[500] },
  title: { ...typography.title, color: color.ink[950] },
  filters: { gap: 10 },
  listContent: {
    paddingHorizontal: getContentPadding(390),
    paddingBottom: 90,
    gap: 10,
  },
  emptyList: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    alignItems: "center",
    backgroundColor: color.surface,
    borderColor: color.border,
    borderRadius: shape.radius.md,
    borderWidth: 1,
    flexDirection: "row",
    gap: 12,
    padding: 14,
    ...shape.shadow.sm,
  },
  cardPressed: { opacity: 0.82 },
  cardCopy: { flex: 1, gap: 2 },
  patientName: { ...typography.cardTitle, color: color.ink[950] },
  patientMeta: { ...typography.small, color: color.ink[600] },
  appointmentLine: {
    alignItems: "center",
    flexDirection: "row",
    gap: 5,
    marginTop: 5,
  },
  appointmentText: { ...typography.small, color: color.ink[600], flex: 1 },
  fabContainer: {
    bottom: 20,
    position: "absolute",
    right: getContentPadding(390),
  },
  fullScreen: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  loading: { alignItems: "center", flex: 1, gap: 12, justifyContent: "center" },
  statePanel: {
    alignItems: "center",
    gap: 8,
    maxWidth: 300,
    paddingVertical: 36,
  },
  stateTitle: {
    ...typography.section,
    color: color.ink[950],
    textAlign: "center",
  },
  stateMessage: {
    ...typography.body,
    color: color.ink[600],
    textAlign: "center",
  },
});
