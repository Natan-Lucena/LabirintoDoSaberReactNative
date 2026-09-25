import { onlineManager, type QueryClient } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/errors";
import {
  createAppointmentMutationOptions,
  deleteAppointmentMutationOptions,
  rescheduleAppointmentMutationOptions,
  updateAppointmentMutationOptions,
} from "@/features/appointments/mutations";

const createAppointmentMock = vi.fn();
const updateAppointmentMock = vi.fn();
const deleteAppointmentMock = vi.fn();

vi.mock("@/api/endpoints/appointment", () => ({
  createAppointment: (...args: unknown[]) => createAppointmentMock(...args),
  updateAppointment: (...args: unknown[]) => updateAppointmentMock(...args),
  deleteAppointment: (...args: unknown[]) => deleteAppointmentMock(...args),
}));

function queryClient(): QueryClient {
  return {
    invalidateQueries: vi.fn(),
    refetchQueries: vi.fn(),
  } as unknown as QueryClient;
}

describe("mutacoes da Agenda (AC-901-02 a AC-901-04)", () => {
  afterEach(() => {
    onlineManager.setOnline(true);
    vi.clearAllMocks();
  });

  it("cria e invalida a Agenda e a Home pela chave compartilhada", async () => {
    const client = queryClient();
    const created = {
      id: "appointment-new",
      educatorId: "educator-1",
      studentId: "student-1",
      scheduledAt: "2026-04-03T13:00:00.000Z",
      status: "PENDING" as const,
      createdAt: "2026-04-01T12:00:00.000Z",
    };
    createAppointmentMock.mockResolvedValue(created);
    const options = createAppointmentMutationOptions(client);

    await options.mutationFn({
      studentId: "student-1",
      scheduledAt: "2026-04-03T13:00:00.000Z",
      observation: "Leitura",
    });
    await options.onSuccess?.(created, undefined, undefined);

    expect(createAppointmentMock).toHaveBeenCalledWith({
      studentId: "student-1",
      scheduledAt: "2026-04-03T13:00:00.000Z",
      observation: "Leitura",
    });
    expect(client.invalidateQueries).toHaveBeenCalledWith({
      queryKey: ["appointment"],
    });
  });

  it("bloqueia mutacao offline sem chamar a API e sem repetir automaticamente", async () => {
    onlineManager.setOnline(false);
    const options = createAppointmentMutationOptions(queryClient());

    await expect(
      options.mutationFn({
        studentId: "student-1",
        scheduledAt: "2026-04-03T13:00:00.000Z",
      }),
    ).rejects.toMatchObject({ name: "OfflineError" });
    expect(createAppointmentMock).not.toHaveBeenCalled();
  });

  it("edita somente os campos permitidos, inclusive null para limpar observacao", async () => {
    const options = updateAppointmentMutationOptions(queryClient());
    updateAppointmentMock.mockResolvedValue({ id: "appointment-1" });

    await options.mutationFn({
      id: "appointment-1",
      input: { scheduledAt: "2026-04-03T14:00:00.000Z", observation: null },
    });

    expect(updateAppointmentMock).toHaveBeenCalledWith("appointment-1", {
      scheduledAt: "2026-04-03T14:00:00.000Z",
      observation: null,
    });
  });

  it("remarca enviando somente scheduledAt", async () => {
    const options = rescheduleAppointmentMutationOptions(queryClient());
    updateAppointmentMock.mockResolvedValue({ id: "appointment-1" });

    await options.mutationFn({
      id: "appointment-1",
      scheduledAt: "2026-04-03T15:00:00.000Z",
    });

    expect(updateAppointmentMock).toHaveBeenCalledWith("appointment-1", {
      scheduledAt: "2026-04-03T15:00:00.000Z",
    });
  });

  it.each(["update", "delete"] as const)(
    "recarrega a lista e expoe NOT_FOUND em %s",
    async (kind) => {
      const client = queryClient();
      const error = new ApiError({
        message: "NOT_FOUND",
        status: 400,
        code: "NOT_FOUND",
      });
      const options =
        kind === "update"
          ? updateAppointmentMutationOptions(client)
          : deleteAppointmentMutationOptions(client);

      await options.onError?.(error, undefined, undefined);

      expect(client.refetchQueries).toHaveBeenCalledWith({
        queryKey: ["appointment"],
      });
    },
  );
});
