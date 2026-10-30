import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { z } from "zod";

import { getMe } from "@/api/endpoints/educator";
import {
  updateEducator,
  updateProfilePicture,
} from "@/api/endpoints/educator-update";
import type { TaskMediaFile } from "@/api/endpoints/task-upload-media";
import { normalizeApiError } from "@/api/errors";
import {
  AppHeader,
  Avatar,
  DsButton,
  Field,
  Toast,
  useToast,
} from "@/components/ds";
import { ImagePickerField } from "@/components/media/ImagePickerField";
import { homeQueryKeys } from "@/features/home/useHomeData";
import { useAuthStore } from "@/stores/auth";
import { color, typography, semanticColor } from "@/theme";

const optionalText = z
  .string()
  .refine(
    (value) =>
      value.trim() === "" ||
      (value.trim().length >= 3 && value.trim().length <= 100),
    "Informe entre 3 e 100 caracteres.",
  );
const schema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Informe entre 3 e 100 caracteres.")
    .max(100, "Informe entre 3 e 100 caracteres."),
  contact: optionalText,
  profession: optionalText,
});
type Values = z.infer<typeof schema>;

export function ProfileScreen() {
  const client = useQueryClient();
  const [loggedOut, setLoggedOut] = useState(false);

  useEffect(() => {
    if (loggedOut) client.clear();
  }, [client, loggedOut]);

  return loggedOut ? null : (
    <ProfileContents onLoggedOut={() => setLoggedOut(true)} />
  );
}

function ProfileContents({ onLoggedOut }: { onLoggedOut: () => void }) {
  const router = useRouter();
  const client = useQueryClient();
  const toast = useToast();
  const educatorQuery = useQuery({
    queryKey: homeQueryKeys.educator,
    queryFn: () => getMe(),
  });
  const educator = educatorQuery.data;
  const [photo, setPhoto] = useState<TaskMediaFile | null>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const { control, handleSubmit, reset } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", contact: "", profession: "" },
  });

  useEffect(() => {
    if (educator)
      reset({
        name: educator.name,
        contact: educator.contact ?? "",
        profession: educator.profession ?? "",
      });
  }, [educator, reset]);

  async function save(values: Values) {
    if (!educator) return;
    const input = {
      ...(values.name.trim() !== educator.name
        ? { newName: values.name.trim() }
        : {}),
      ...(values.contact.trim() &&
      values.contact.trim() !== (educator.contact ?? "")
        ? { newContact: values.contact.trim() }
        : {}),
      ...(values.profession.trim() &&
      values.profession.trim() !== (educator.profession ?? "")
        ? { newProfession: values.profession.trim() }
        : {}),
    };
    if (!Object.keys(input).length) return;
    setSaving(true);
    setSaveError(null);
    try {
      await updateEducator(input);
      await client.invalidateQueries({ queryKey: homeQueryKeys.educator });
      toast.show("Perfil atualizado");
    } catch (error) {
      setSaveError(normalizeApiError(error).message);
    } finally {
      setSaving(false);
    }
  }

  async function choosePhoto(value: TaskMediaFile | null) {
    if (!value) return;
    setPhoto(value);
    setPhotoLoading(true);
    setPhotoError(null);
    try {
      await updateProfilePicture(value);
      await client.invalidateQueries({ queryKey: homeQueryKeys.educator });
      setPhoto(null);
      toast.show("Foto atualizada");
    } catch (error) {
      setPhotoError(normalizeApiError(error).message);
    } finally {
      setPhotoLoading(false);
    }
  }

  async function leave() {
    setLoggingOut(true);
    try {
      await useAuthStore.getState().logout();
      onLoggedOut();
    } catch (error) {
      setSaveError(normalizeApiError(error).message);
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <View style={styles.screen}>
      <AppHeader title="Perfil" onBack={router.back} />
      {!educator ? (
        <View style={styles.state}>
          {educatorQuery.isError ? (
            <>
              <Text accessibilityRole="alert">
                Não foi possível carregar o perfil.
              </Text>
              <DsButton
                label="Tentar de novo"
                onPress={() => void educatorQuery.refetch()}
              />
            </>
          ) : (
            <ActivityIndicator />
          )}
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.photoRow}>
            {educator.photoUrl ? (
              <Image
                source={{ uri: educator.photoUrl }}
                style={styles.avatar}
                accessibilityLabel={educator.name}
              />
            ) : (
              <Avatar name={educator.name} size={64} />
            )}
            <View style={styles.photoCopy}>
              <Text style={styles.name}>{educator.name}</Text>
              <Text style={styles.secondary}>
                {educator.profession || educator.email}
              </Text>
            </View>
          </View>
          <ImagePickerField
            value={photo}
            onChange={(value) => void choosePhoto(value)}
            loading={photoLoading}
            error={photoError ?? undefined}
          />
          <Controller
            control={control}
            name="name"
            render={({ field, fieldState }) => (
              <Field
                label="Nome"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Field
            label="E-mail"
            value={educator.email}
            onChangeText={() => undefined}
            disabled
          />
          <Controller
            control={control}
            name="contact"
            render={({ field, fieldState }) => (
              <Field
                label="Contato"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          <Controller
            control={control}
            name="profession"
            render={({ field, fieldState }) => (
              <Field
                label="Profissão"
                value={field.value}
                onChangeText={field.onChange}
                onBlur={field.onBlur}
                error={fieldState.error?.message}
              />
            )}
          />
          {saveError ? (
            <Text style={styles.error} accessibilityRole="alert">
              {saveError}
            </Text>
          ) : null}
          <DsButton
            label="Salvar"
            fullWidth
            loading={saving}
            onPress={() => void handleSubmit(save)()}
          />
          <DsButton
            label="Sair"
            variant="ghost"
            fullWidth
            onPress={() => setConfirmLogout(true)}
          />
        </ScrollView>
      )}
      <Modal
        transparent
        visible={confirmLogout}
        onRequestClose={() => setConfirmLogout(false)}
      >
        <View style={styles.backdrop}>
          <View style={styles.dialog}>
            <Text style={styles.name}>Sair da conta?</Text>
            <Text style={styles.secondary}>
              Você precisará entrar novamente para acessar seus dados.
            </Text>
            <View style={styles.actions}>
              <DsButton
                label="Cancelar"
                variant="secondary"
                onPress={() => setConfirmLogout(false)}
              />
              <DsButton
                label="Confirmar saída"
                loading={loggingOut}
                onPress={() => void leave()}
              />
            </View>
          </View>
        </View>
      </Modal>
      <Toast message={toast.message} onHide={toast.hide} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: color.surfaceSoft },
  content: { padding: 20, gap: 16, paddingBottom: 36 },
  state: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
  photoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32 },
  photoCopy: { flex: 1 },
  name: { ...typography.cardTitle, color: color.text },
  secondary: { ...typography.body, color: color.textSecondary },
  error: { color: semanticColor.dangerTextOnSurface },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: 24,
  },
  dialog: {
    backgroundColor: color.surface,
    borderRadius: 16,
    padding: 20,
    gap: 12,
  },
  actions: { flexDirection: "row", gap: 10, justifyContent: "flex-end" },
});
