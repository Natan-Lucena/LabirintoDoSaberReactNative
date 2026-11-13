import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import {
  generateToken,
  updatePassword,
  verifyToken,
} from "@/api/endpoints/educator";
import { ApiError } from "@/api/errors";
import { OfflineError, withOfflineGuard } from "@/api/query-client";

export const RESEND_COOLDOWN_SECONDS = 60;

export type PasswordResetStep = "email" | "code" | "password";

const NETWORK_ERROR_MESSAGE =
  "Não foi possível conectar. Verifique sua internet e tente novamente.";
const GENERIC_ERROR_MESSAGE = "Não foi possível concluir. Tente novamente.";

// Códigos de negócio cuja mensagem (em português) vem de normalizeApiError.
const KNOWN_CODES = new Set([
  "INVALID_TOKEN",
  "EXPIRED_TOKEN",
  "TOO_MANY_ATTEMPTS",
  "TOO_MANY_REQUESTS",
  "PASSWORD_SAME_AS_OLD",
]);
// Erros que invalidam o código: na troca, voltam ao passo do código.
const CODE_LOST = new Set([
  "INVALID_TOKEN",
  "EXPIRED_TOKEN",
  "TOO_MANY_ATTEMPTS",
]);

function describeError(error: unknown): { message: string; code?: string } {
  if (error instanceof OfflineError) return { message: NETWORK_ERROR_MESSAGE };
  if (error instanceof ApiError) {
    if (error.code && KNOWN_CODES.has(error.code))
      return { message: error.message, code: error.code };
    if (error.isNetworkError || error.isTimeout)
      return { message: NETWORK_ERROR_MESSAGE };
  }
  return { message: GENERIC_ERROR_MESSAGE };
}

export interface UsePasswordResetResult {
  step: PasswordResetStep;
  email: string;
  /** Verdadeiro só depois de `verify-token` responder com sucesso. */
  verified: boolean;
  error: string | null;
  isBusy: boolean;
  secondsLeft: number;
  canResend: boolean;
  sendCode: (email: string) => Promise<void>;
  resend: () => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  /** Retorna true quando a senha foi trocada. */
  resetPassword: (newPassword: string) => Promise<boolean>;
  backToEmail: () => void;
}

/**
 * Estado do fluxo "Esqueci a senha". O código fica só em ref do hook, nunca em
 * store, cache de consultas ou log; a senha só passa pela mutação. Mutações
 * sem retry automático (o QueryClient já fixa `retry: false`).
 */
export function usePasswordReset(): UsePasswordResetResult {
  const [step, setStep] = useState<PasswordResetStep>("email");
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const codeRef = useRef("");

  const sendMutation = useMutation({
    mutationFn: withOfflineGuard(generateToken),
  });
  const verifyMutation = useMutation({
    mutationFn: withOfflineGuard(verifyToken),
  });
  const updateMutation = useMutation({
    mutationFn: withOfflineGuard(updatePassword),
  });

  const counting = secondsLeft > 0;
  useEffect(() => {
    if (!counting) return undefined;
    const id = setInterval(() => {
      setSecondsLeft((current) => Math.max(0, current - 1));
    }, 1000);
    return () => clearInterval(id);
  }, [counting]);

  // Ao sair da tela, descarta o código.
  useEffect(
    () => () => {
      codeRef.current = "";
    },
    [],
  );

  const send = useCallback(
    async (target: string, goToCode: boolean) => {
      setError(null);
      try {
        await sendMutation.mutateAsync({ email: target });
      } catch (caught) {
        setError(describeError(caught).message);
        return;
      }
      setEmail(target);
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
      if (goToCode) setStep("code");
    },
    [sendMutation],
  );

  const sendCode = useCallback((target: string) => send(target, true), [send]);

  const resend = useCallback(async () => {
    if (secondsLeft > 0 || sendMutation.isPending) return;
    await send(email, false);
  }, [email, secondsLeft, send, sendMutation.isPending]);

  const verifyCode = useCallback(
    async (code: string) => {
      setError(null);
      try {
        await verifyMutation.mutateAsync({ email, token: code });
      } catch (caught) {
        setError(describeError(caught).message);
        return;
      }
      codeRef.current = code;
      setVerified(true);
      setStep("password");
    },
    [email, verifyMutation],
  );

  const resetPassword = useCallback(
    async (newPassword: string): Promise<boolean> => {
      // AC-AUT-01-01: sem código verificado, nada é enviado.
      if (!verified || codeRef.current === "") return false;
      setError(null);
      try {
        await updateMutation.mutateAsync({
          email,
          token: codeRef.current,
          newPassword,
        });
      } catch (caught) {
        const { message, code } = describeError(caught);
        setError(message);
        if (code && CODE_LOST.has(code)) {
          codeRef.current = "";
          setVerified(false);
          setStep("code");
        }
        return false;
      }
      codeRef.current = "";
      return true;
    },
    [email, updateMutation, verified],
  );

  const backToEmail = useCallback(() => {
    codeRef.current = "";
    setVerified(false);
    setError(null);
    setStep("email");
  }, []);

  return {
    step,
    email,
    verified,
    error,
    isBusy:
      sendMutation.isPending ||
      verifyMutation.isPending ||
      updateMutation.isPending,
    secondsLeft,
    canResend: secondsLeft === 0 && !sendMutation.isPending,
    sendCode,
    resend,
    verifyCode,
    resetPassword,
    backToEmail,
  };
}
