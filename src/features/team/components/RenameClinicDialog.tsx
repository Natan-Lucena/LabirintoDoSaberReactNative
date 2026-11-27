import { useState, type ReactElement } from "react";

import { Field } from "@/components/ds";
import { ConfirmDialog } from "@/features/team/components/ConfirmDialog";
import { teamErrorMessage } from "@/features/team/messages";
import { useRenameClinic } from "@/features/team/useClinic";

export interface RenameClinicDialogProps {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onRenamed: () => void;
}

const NAME_ERROR = "Informe entre 2 e 80 caracteres.";

export function RenameClinicDialog({
  visible,
  currentName,
  onClose,
  onRenamed,
}: RenameClinicDialogProps): ReactElement {
  const rename = useRenameClinic();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = name.trim();
    if (trimmed.length < 2 || trimmed.length > 80) {
      setError(NAME_ERROR);
      return;
    }
    setError(null);
    rename.mutate(
      { name: trimmed },
      {
        onSuccess: onRenamed,
        onError: (failure) => setError(teamErrorMessage(failure)),
      },
    );
  }

  return (
    <ConfirmDialog
      visible={visible}
      title="Renomear a equipe"
      confirmLabel="Salvar"
      loading={rename.isPending}
      error={error}
      onConfirm={submit}
      onCancel={onClose}
    >
      <Field
        label="Nome da clínica"
        value={name}
        onChangeText={(value) => {
          setName(value);
          setError(null);
        }}
        maxLength={80}
        disabled={rename.isPending}
      />
    </ConfirmDialog>
  );
}
