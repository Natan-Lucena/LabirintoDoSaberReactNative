import { useCallback, useEffect, useState } from "react";

import {
  createScaleApplication,
  getScaleApplication,
  ScaleApiError,
} from "@/api/endpoints/scales";
import type { ScaleApplication } from "@/api/types";

export type ScaleDraftState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; application: ScaleApplication };

interface UseScaleDraftOptions {
  templateId: string;
  studentId?: string;
  /** Rascunho a retomar; sem ele, cria (ou retoma) o do paciente. */
  applicationId?: string;
}

/**
 * Abre o rascunho da aplicação: carrega o `applicationId` recebido ou cria um
 * com `POST /scale-application/`. `DRAFT_ALREADY_EXISTS` retoma o rascunho
 * existente (AV-03) lendo-o com `GET /scale-application/:id`.
 */
export function useScaleDraft({
  templateId,
  studentId,
  applicationId,
}: UseScaleDraftOptions): {
  state: ScaleDraftState;
  retry: () => void;
} {
  const [state, setState] = useState<ScaleDraftState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function open(): Promise<ScaleApplication> {
      if (applicationId) return getScaleApplication(applicationId);
      if (!studentId) throw new Error("Paciente não informado.");

      try {
        return await createScaleApplication({ studentId, templateId });
      } catch (error) {
        if (
          error instanceof ScaleApiError &&
          error.code === "DRAFT_ALREADY_EXISTS" &&
          error.applicationId
        ) {
          return getScaleApplication(error.applicationId);
        }
        throw error;
      }
    }

    open().then(
      (application) => {
        if (!cancelled) setState({ status: "ready", application });
      },
      () => {
        if (!cancelled) setState({ status: "error" });
      },
    );

    return () => {
      cancelled = true;
    };
  }, [templateId, studentId, applicationId, attempt]);

  const retry = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  return { state, retry };
}
