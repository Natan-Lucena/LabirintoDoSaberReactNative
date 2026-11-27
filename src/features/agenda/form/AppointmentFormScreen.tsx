import { useEffect, useState, type ReactElement } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { z } from "zod";

import type {
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "@/api/endpoints/appointment";
import { ApiError } from "@/api/errors";
import type { Appointment, SeriesResult } from "@/api/types";
import {
  AppHeader,
  DateField,
  DsButton,
  Field,
  FieldGrid,
  FilterRow,
  SelectField,
  TimeField,
  Toast,
  useToast,
} from "@/components/ds";
import { useAppointment } from "@/features/agenda/detail/useAppointment";
import {
  appointmentErrorMessage,
  CONFLICT_MESSAGE,
  conflictingAppointmentId,
  isAppointmentNotFound,
} from "@/features/agenda/errors";
import {
  combineDateAndTime,
  dateFromKey,
} from "@/features/agenda/form/datetime";
import {
  RepeatField,
  repeatOccurrencesError,
  type RepeatValue,
} from "@/features/agenda/series/RepeatField";
import { previewSeries, previewText } from "@/features/agenda/series/preview";
import { SkippedNotice } from "@/features/agenda/series/SkippedNotice";
import {
  useCreateAppointmentMutation,
  useCreateSeriesMutation,
  useUpdateAppointmentMutation,
  useUpdateSeriesMutation,
} from "@/features/appointments/mutations";
import { useAppointments } from "@/features/appointments/useAppointments";
import { useStudents } from "@/features/students/useStudents";
import { color, fontFamilies, semanticColor } from "@/theme";
import { dayKey } from "@/utils/date";

export type AppointmentFormMode =
  "create" | "edit" | "reschedule" | "reactivate" | "observation";

export interface AppointmentFormScreenProps {
  /** Sem id, o formulário cria um atendimento. */
  appointmentId?: string;
  /** edit, reschedule, reactivate ou observation; ajustado ao status. */
  mode?: string;
  /** Pré-preenche o paciente (só na criação). */
  studentId?: string;
  /** Pré-preenche o dia, AAAA-MM-DD (só na criação). */
  date?: string;
  /** `following`: altera este e os seguintes da série (AGE-06). */
  scope?: string;
}

export const ALL_CONFLICT_MESSAGE =
  "Todos os horários desta série já estão ocupados. Escolha outro horário.";
const DATE_LOCKED_HINT =
  "Para mudar o dia, cancele os seguintes e crie uma série nova.";
const DEFAULT_OCCURRENCES = "8";

const typeSuggestions = [
  { key: "Psicopedagogia", label: "Psicopedagogia" },
  { key: "Avaliação", label: "Avaliação" },
];

const schema = z.object({
  studentId: z.string().min(1, "Selecione o paciente"),
  date: z.date({ message: "Selecione a data" }),
  time: z.date({ message: "Selecione o horário" }),
  type: z.string().trim().max(50, "O tipo deve ter até 50 caracteres"),
  duration: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || (Number(value) >= 15 && Number(value) <= 240),
      "A duração deve ser entre 15 e 240 minutos",
    ),
  observation: z.string(),
});

type FormValues = z.infer<typeof schema>;

function resolveMode(
  requested: string | undefined,
  appointment: Appointment,
): AppointmentFormMode {
  if (appointment.status === "PENDING") {
    return requested === "reschedule" ? "reschedule" : "edit";
  }
  if (appointment.status === "CANCELLED" && requested === "reactivate") {
    return "reactivate";
  }
  return "observation";
}

const copy: Record<
  AppointmentFormMode,
  { title: string; submit: string; toast: string }
> = {
  create: {
    title: "Novo atendimento",
    submit: "Agendar atendimento",
    toast: "Atendimento agendado",
  },
  edit: {
    title: "Editar atendimento",
    submit: "Salvar alterações",
    toast: "Atendimento atualizado",
  },
  reschedule: {
    title: "Remarcar atendimento",
    submit: "Remarcar atendimento",
    toast: "Atendimento remarcado",
  },
  reactivate: {
    title: "Reativar atendimento",
    submit: "Reativar atendimento",
    toast: "Atendimento reativado",
  },
  observation: {
    title: "Editar observação",
    submit: "Salvar observação",
    toast: "Observação salva",
  },
};

function initialValues(
  appointment: Appointment | undefined,
  studentId: string | undefined,
  dateKey: string | undefined,
): Partial<FormValues> {
  if (appointment) {
    const scheduled = new Date(appointment.scheduledAt);
    return {
      studentId: appointment.studentId,
      date: dateFromKey(dayKey(scheduled)) ?? undefined,
      time: scheduled,
      type: appointment.type ?? "",
      duration: String(appointment.durationMinutes),
      observation: appointment.observation ?? "",
    };
  }
  return {
    studentId: studentId ?? "",
    date: dateFromKey(dateKey) ?? undefined,
    type: "",
    duration: "",
    observation: "",
  };
}

interface FormProps {
  appointment?: Appointment;
  mode: AppointmentFormMode;
  studentId?: string;
  date?: string;
  /** Altera a série a partir deste atendimento (data travada). */
  following?: boolean;
}

function AppointmentForm({
  appointment,
  mode,
  studentId,
  date,
  following = false,
}: FormProps): ReactElement {
  const router = useRouter();
  const toast = useToast();
  const studentsQuery = useStudents();
  const appointmentsQuery = useAppointments();
  const createMutation = useCreateAppointmentMutation();
  const updateMutation = useUpdateAppointmentMutation();
  const createSeries = useCreateSeriesMutation();
  const updateSeries = useUpdateSeriesMutation();
  const [repeat, setRepeat] = useState<RepeatValue>("NONE");
  const [occurrences, setOccurrences] = useState(DEFAULT_OCCURRENCES);
  const [skippedResult, setSkippedResult] = useState<{
    result: SeriesResult;
    label: "agendados" | "alterados";
  } | null>(null);
  const frequency = mode === "create" && repeat !== "NONE" ? repeat : null;
  const mutation = following
    ? updateSeries
    : frequency
      ? createSeries
      : mode === "create"
        ? createMutation
        : updateMutation;
  const scheduleLocked = mode === "observation";
  const dateLocked = scheduleLocked || following;
  const detailsLocked =
    mode === "reschedule" || mode === "observation" || mode === "reactivate";
  const observationLocked = mode === "reschedule";
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    trigger,
    formState: { errors, isValid, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    mode: "onChange",
    defaultValues: initialValues(appointment, studentId, date),
  });

  // Com mode "onChange" o RHF só valida o campo alterado; na primeira interação
  // validamos data e horário para mostrar "Selecione a data/o horário".
  useEffect(() => {
    if (isDirty) {
      void trigger(["date", "time"]);
    }
  }, [isDirty, trigger]);

  useEffect(() => {
    if (!toast.message) {
      return;
    }
    const timer = setTimeout(() => router.back(), 700);
    return () => clearTimeout(timer);
  }, [router, toast.message]);

  const students = (studentsQuery.data ?? []).map((student) => ({
    label: student.name,
    value: student.id,
  }));
  // Série criada: o conflito total tem frase própria e não aponta um atendimento.
  const conflictId = frequency
    ? undefined
    : conflictingAppointmentId(mutation.error);
  const ownAppointmentIds = new Set(
    (appointmentsQuery.data ?? []).map(({ id }) => id),
  );
  const watchedDate = useWatch({ control, name: "date" });
  const watchedTime = useWatch({ control, name: "time" });
  const occurrencesCount = Number(occurrences);
  const occurrencesInvalid = Boolean(
    frequency && repeatOccurrencesError(frequency, occurrences),
  );
  const preview =
    frequency && watchedDate && watchedTime && !occurrencesInvalid
      ? previewSeries({
          first: combineDateAndTime(watchedDate, watchedTime),
          frequency,
          occurrences: occurrencesCount,
        })
      : null;
  const submitLabel = frequency
    ? occurrencesInvalid
      ? "Agendar atendimentos"
      : `Agendar ${occurrencesCount} atendimentos`
    : copy[mode].submit;
  const errorMessage =
    frequency &&
    mutation.error instanceof ApiError &&
    mutation.error.code === "APPOINTMENT_CONFLICT"
      ? ALL_CONFLICT_MESSAGE
      : mutation.error
        ? appointmentErrorMessage(mutation.error)
        : null;

  function onSaved() {
    toast.show(copy[mode].toast);
  }

  function onSeriesSaved(label: "agendados" | "alterados") {
    return (result: SeriesResult) => {
      if (result.skipped.length > 0) {
        setSkippedResult({ result, label });
        return;
      }
      toast.show(
        label === "agendados"
          ? `${result.created.length} atendimentos agendados`
          : copy[mode].toast,
      );
    };
  }

  function submit(values: FormValues) {
    const type = values.type.trim();
    const duration = values.duration.trim();
    const observation = values.observation.trim();
    const scheduledAt = combineDateAndTime(values.date, values.time);

    if (!appointment && frequency) {
      createSeries.mutate(
        {
          studentId: values.studentId,
          scheduledAt: scheduledAt.toISOString(),
          frequency,
          occurrences: occurrencesCount,
          ...(type ? { type } : {}),
          ...(duration ? { durationMinutes: Number(duration) } : {}),
          ...(observation ? { observation } : {}),
        },
        { onSuccess: onSeriesSaved("agendados") },
      );
      return;
    }

    if (!appointment) {
      const input: CreateAppointmentInput = {
        studentId: values.studentId,
        scheduledAt: scheduledAt.toISOString(),
        ...(type ? { type } : {}),
        ...(duration ? { durationMinutes: Number(duration) } : {}),
        ...(observation ? { observation } : {}),
      };
      createMutation.mutate(input, { onSuccess: onSaved });
      return;
    }

    // Só os campos alterados; o paciente não muda.
    const input: UpdateAppointmentInput = {
      ...(mode === "reactivate" ? { status: "PENDING" as const } : {}),
    };
    if (
      !scheduleLocked &&
      scheduledAt.getTime() !== new Date(appointment.scheduledAt).getTime()
    ) {
      input.scheduledAt = scheduledAt.toISOString();
    }
    if (!detailsLocked) {
      if (type && type !== (appointment.type ?? "")) {
        input.type = type;
      }
      if (duration && Number(duration) !== appointment.durationMinutes) {
        input.durationMinutes = Number(duration);
      }
    }
    if (!observationLocked && observation !== (appointment.observation ?? "")) {
      input.observation = observation || null;
    }
    if (Object.keys(input).length === 0) {
      router.back();
      return;
    }
    if (following && appointment.seriesId) {
      // RC-05: a rota da série usa só a hora; sem campo para limpar a observação.
      const seriesChanges = {
        ...(input.scheduledAt === undefined
          ? {}
          : { scheduledAt: input.scheduledAt }),
        ...(input.type === undefined ? {} : { type: input.type }),
        ...(input.durationMinutes === undefined
          ? {}
          : { durationMinutes: input.durationMinutes }),
        // `null` apaga a observação das ocorrências seguintes (§3.5).
        ...(input.observation === undefined
          ? {}
          : { observation: input.observation }),
      };
      updateSeries.mutate(
        {
          seriesId: appointment.seriesId,
          input: { fromAppointmentId: appointment.id, ...seriesChanges },
        },
        { onSuccess: onSeriesSaved("alterados") },
      );
      return;
    }
    updateMutation.mutate(
      { id: appointment.id, input },
      { onSuccess: onSaved },
    );
  }

  const canSubmit =
    isValid && !occurrencesInvalid && !mutation.isPending && !toast.message;

  if (skippedResult) {
    return (
      <View style={styles.screen}>
        <AppHeader
          title={copy[mode].title}
          subtitle="Agendamento"
          onBack={router.back}
        />
        <ScrollView contentContainerStyle={styles.content}>
          <SkippedNotice
            doneCount={skippedResult.result.created.length}
            doneLabel={skippedResult.label}
            skipped={skippedResult.result.skipped}
            ownAppointmentIds={ownAppointmentIds}
            onOpen={(id) => router.push(`/agenda/${id}`)}
            onDone={router.back}
          />
        </ScrollView>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <AppHeader
        title={copy[mode].title}
        subtitle="Agendamento"
        onBack={router.back}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <Controller
          control={control}
          name="studentId"
          render={({ field: { value, onChange } }) => (
            <SelectField
              label="Paciente"
              value={value || null}
              options={students}
              onChange={onChange}
              placeholder="Selecionar paciente"
              disabled={Boolean(appointment)}
              error={errors.studentId?.message}
            />
          )}
        />

        <FieldGrid>
          <Controller
            control={control}
            name="date"
            render={({ field: { value, onChange } }) => (
              <DateField
                label="Data"
                value={value ?? null}
                onChange={(next) => {
                  onChange(next);
                  const time = getValues("time");
                  if (time) {
                    setValue("time", combineDateAndTime(next, time), {
                      shouldValidate: true,
                    });
                  }
                  mutation.reset();
                }}
                disabled={dateLocked}
                error={errors.date?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="time"
            render={({ field: { value, onChange } }) => (
              <TimeField
                label="Horário"
                value={value ?? null}
                referenceDate={getValues("date")}
                onChange={(next) => {
                  onChange(next);
                  mutation.reset();
                }}
                disabled={scheduleLocked}
                error={conflictId ? CONFLICT_MESSAGE : errors.time?.message}
              />
            )}
          />
        </FieldGrid>
        {following ? <Text style={styles.hint}>{DATE_LOCKED_HINT}</Text> : null}
        {conflictId && ownAppointmentIds.has(conflictId) ? (
          <DsButton
            label="Ver atendimento"
            variant="ghost"
            onPress={() => router.push(`/agenda/${conflictId}`)}
          />
        ) : null}

        <Controller
          control={control}
          name="type"
          render={({ field: { value, onChange, onBlur } }) => (
            <View style={styles.group}>
              <Field
                label="Tipo de atendimento"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.type?.message}
                maxLength={50}
                disabled={detailsLocked}
              />
              <FilterRow
                options={typeSuggestions}
                value={value}
                onChange={onChange}
                disabled={detailsLocked}
              />
            </View>
          )}
        />

        <Controller
          control={control}
          name="duration"
          render={({ field: { value, onChange, onBlur } }) => (
            <Field
              label="Duração (minutos)"
              value={value}
              onChangeText={(text) => onChange(text.replace(/\D/g, ""))}
              onBlur={onBlur}
              error={errors.duration?.message}
              hint="Padrão: 50 minutos"
              keyboardType="number-pad"
              disabled={detailsLocked}
            />
          )}
        />

        <Controller
          control={control}
          name="observation"
          render={({ field: { value, onChange, onBlur } }) => (
            <Field
              label="Observação"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              multiline
              disabled={observationLocked}
            />
          )}
        />

        {mode === "create" ? (
          <RepeatField
            repeat={repeat}
            occurrences={occurrences}
            previewText={
              preview && frequency ? previewText(preview, frequency) : ""
            }
            disabled={mutation.isPending}
            onRepeatChange={(next) => {
              setRepeat(next);
              mutation.reset();
            }}
            onOccurrencesChange={(next) => {
              setOccurrences(next);
              mutation.reset();
            }}
          />
        ) : null}

        {errorMessage && !conflictId ? (
          <Text style={styles.error} accessibilityRole="alert">
            {errorMessage}
          </Text>
        ) : null}
        <DsButton
          label={submitLabel}
          icon="arrow"
          fullWidth
          onPress={handleSubmit(submit)}
          disabled={!canSubmit}
          loading={mutation.isPending}
        />
      </ScrollView>
      <Toast message={toast.message} onHide={toast.hide} />
    </KeyboardAvoidingView>
  );
}

export function AppointmentFormScreen({
  appointmentId,
  mode,
  studentId,
  date,
  scope,
}: AppointmentFormScreenProps): ReactElement {
  const router = useRouter();
  const query = useAppointment(appointmentId ?? "");

  if (!appointmentId) {
    return <AppointmentForm mode="create" studentId={studentId} date={date} />;
  }

  if (query.data) {
    return (
      <AppointmentForm
        key={query.data.id}
        appointment={query.data}
        mode={resolveMode(mode, query.data)}
        following={
          scope === "following" &&
          Boolean(query.data.seriesId) &&
          query.data.status === "PENDING"
        }
      />
    );
  }

  if (query.isError) {
    const notFound = isAppointmentNotFound(query.error);
    return (
      <View style={[styles.screen, styles.state]}>
        <Text style={styles.stateText}>
          {notFound
            ? "Atendimento não encontrado"
            : "Não foi possível carregar o atendimento."}
        </Text>
        {notFound ? null : (
          <DsButton
            label="Tentar de novo"
            variant="secondary"
            onPress={() => void query.refetch()}
          />
        )}
        <DsButton label="Voltar" onPress={router.back} />
      </View>
    );
  }

  return (
    <View style={[styles.screen, styles.state]}>
      <ActivityIndicator color={semanticColor.primaryFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { gap: 18, padding: 20, paddingBottom: 36 },
  group: { gap: 10 },
  hint: {
    color: color.textSecondary,
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  error: {
    color: semanticColor.dangerTextOnSurface,
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 12,
    lineHeight: 16,
  },
  state: {
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    padding: 24,
  },
  stateText: {
    color: color.textSecondary,
    fontFamily: fontFamilies.nunito.regular,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});
