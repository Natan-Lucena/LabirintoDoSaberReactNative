import type { ActivityFormValues } from "./schema";

export interface FieldsProps {
  values: ActivityFormValues;
  /** Atualiza campos do formulário e marca-os como mexidos. */
  update: (patch: Partial<ActivityFormValues>) => void;
  /** Erro (servidor ou local) do caminho, ex.: `pairs.2.word`. */
  errorFor: (path: string) => string | undefined;
  disabled: boolean;
}
