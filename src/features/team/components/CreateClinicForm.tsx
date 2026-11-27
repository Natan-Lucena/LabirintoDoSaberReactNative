import { useState, type ReactElement } from "react";
import { StyleSheet, View } from "react-native";

import { ApiError } from "@/api/errors";
import { DsButton, Field } from "@/components/ds";
import { useCreateClinic } from "@/features/team/useClinic";
import { teamErrorMessage } from "@/features/team/messages";

export interface CreateClinicFormProps {
  onCreated: () => void;
  onCancel: () => void;
}

const NAME_ERROR = "Informe entre 2 e 80 caracteres.";

const styles = StyleSheet.create({
  form: { gap: 12 },
});

export function CreateClinicForm({
  onCreated,
  onCancel,
}: CreateClinicFormProps): ReactElement {
  const create = useCreateClinic();
  const [name, setName] = useState("");
  const [error, setError] = useState<string | undefined>();

  function submit() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      setError(NAME_ERROR);
      return;
    }
    setError(undefined);
    create
      .mutateAsync({ name: trimmed })
      .then(onCreated)
      .catch((failure: unknown) => {
        const nameInvalid =
          failure instanceof ApiError &&
          failure.errors.some((item) => item.path === "name");
        setError(nameInvalid ? NAME_ERROR : teamErrorMessage(failure));
      });
  }

  return (
    <View style={styles.form}>
      <Field
        testID="team-name"
        label="Nome da clínica"
        value={name}
        onChangeText={(value) => {
          setName(value);
          setError(undefined);
        }}
        maxLength={80}
        error={error}
        disabled={create.isPending}
      />
      <DsButton
        testID="team-create-submit"
        label="Criar"
        onPress={submit}
        loading={create.isPending}
        fullWidth
      />
      <DsButton
        label="Cancelar"
        variant="secondary"
        onPress={onCancel}
        disabled={create.isPending}
        fullWidth
      />
    </View>
  );
}
