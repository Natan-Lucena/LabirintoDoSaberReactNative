import { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import "@/mocks/handlers/appointment";
import { mockAdapter } from "@/mocks/adapter";

function config(
  method: "get" | "post" | "put" | "delete",
  url: string,
  data?: unknown,
): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
    baseURL: "http://mock.local",
    method,
    url,
    data,
  } as InternalAxiosRequestConfig;
}

describe("handlers mockados de agendamento (G-29)", () => {
  it("cria, edita e exclui um agendamento na sessao", async () => {
    const created = await mockAdapter(
      config("post", "/appointment/", {
        studentId: "student-1",
        scheduledAt: "2026-04-03T13:00:00.000Z",
        observation: "Leitura",
      }),
    );
    const id = (created.data as { id: string }).id;

    await expect(
      mockAdapter(config("put", `/appointment/${id}`, { observation: null })),
    ).resolves.toMatchObject({ data: { observation: null } });
    await expect(
      mockAdapter(config("delete", `/appointment/${id}`)),
    ).resolves.toMatchObject({
      status: 200,
    });
  });

  it("aceita tipo e duração e responde no formato do GET", async () => {
    const created = await mockAdapter(
      config("post", "/appointment/", {
        studentId: "student-1",
        scheduledAt: "2026-04-03T13:00:00.000Z",
        type: "Leitura",
        durationMinutes: 60,
      }),
    );
    expect(created.data).toMatchObject({
      type: "Leitura",
      durationMinutes: 60,
    });
    expect(
      Object.keys(created.data as object).every((key) => !key.startsWith("_")),
    ).toBe(true);
    const id = (created.data as { id: string }).id;
    const updated = await mockAdapter(
      config("put", `/appointment/${id}`, {
        type: "Escrita",
        durationMinutes: 45,
      }),
    );
    expect(updated.data).toMatchObject({
      type: "Escrita",
      durationMinutes: 45,
    });
    expect(
      Object.keys(updated.data as object).every((key) => !key.startsWith("_")),
    ).toBe(true);
    await mockAdapter(config("delete", `/appointment/${id}`));
  });

  it("devolve 400 NOT_FOUND para editar ou excluir id inexistente", async () => {
    await expect(
      mockAdapter(config("put", "/appointment/missing", {})),
    ).rejects.toMatchObject({
      response: { status: 400, data: { message: "NOT_FOUND" } },
    });
    await expect(
      mockAdapter(config("delete", "/appointment/missing")),
    ).rejects.toMatchObject({
      response: { status: 400, data: { message: "NOT_FOUND" } },
    });
  });

  it("prioriza rota exata e passa o segmento dinamico como params.id", async () => {
    await expect(
      mockAdapter(config("get", "/appointment/")),
    ).resolves.toMatchObject({
      data: expect.any(Array),
    });
    await expect(mockAdapter(config("get", "/missing"))).rejects.toMatchObject({
      response: { status: 404, data: { message: "MOCK_ROUTE_NOT_FOUND" } },
    });
  });

  it("GET /appointment/:id devolve o atendimento ou 400 NOT_FOUND (AGE-03)", async () => {
    const created = await mockAdapter(
      config("post", "/appointment/", {
        studentId: "student-1",
        scheduledAt: "2030-01-10T13:00:00.000Z",
      }),
    );
    const id = (created.data as { id: string }).id;

    await expect(
      mockAdapter(config("get", `/appointment/${id}`)),
    ).resolves.toMatchObject({ status: 200, data: { id, status: "PENDING" } });
    await expect(
      mockAdapter(config("get", "/appointment/missing")),
    ).rejects.toMatchObject({
      response: { status: 400, data: { message: "NOT_FOUND" } },
    });
    await mockAdapter(config("delete", `/appointment/${id}`));
  });
});

describe("regras do backend nos mocks de atendimento (AGE-03)", () => {
  async function create(scheduledAt: string, durationMinutes = 60) {
    const response = await mockAdapter(
      config("post", "/appointment/", {
        studentId: "student-1",
        scheduledAt,
        durationMinutes,
      }),
    );
    return response.data as { id: string };
  }

  async function put(id: string, body: unknown) {
    return mockAdapter(config("put", `/appointment/${id}`, body));
  }

  it("segue as transições de status", async () => {
    const { id } = await create("2031-02-01T13:00:00.000Z");

    await expect(put(id, { status: "CANCELLED" })).resolves.toMatchObject({
      data: { status: "CANCELLED" },
    });
    await expect(put(id, { status: "PENDING" })).resolves.toMatchObject({
      data: { status: "PENDING" },
    });
    await expect(put(id, { status: "COMPLETED" })).resolves.toMatchObject({
      data: { status: "COMPLETED" },
    });
    await expect(put(id, { status: "PENDING" })).resolves.toMatchObject({
      status: 409,
      data: { message: "INVALID_STATUS_TRANSITION" },
    });
    await expect(put(id, { status: "CANCELLED" })).resolves.toMatchObject({
      status: 409,
      data: { message: "INVALID_STATUS_TRANSITION" },
    });
  });

  it("não deixa mudar horário, tipo ou duração de atendimento cancelado ou concluído", async () => {
    const { id } = await create("2031-02-02T13:00:00.000Z");
    await put(id, { status: "CANCELLED" });

    for (const body of [
      { scheduledAt: "2031-02-02T15:00:00.000Z" },
      { type: "Avaliação" },
      { durationMinutes: 30 },
    ]) {
      await expect(put(id, body)).resolves.toMatchObject({
        status: 409,
        data: { message: "APPOINTMENT_NOT_EDITABLE" },
      });
    }
    await expect(put(id, { observation: "Nota" })).resolves.toMatchObject({
      status: 200,
      data: { observation: "Nota" },
    });
    await expect(
      put(id, { status: "PENDING", scheduledAt: "2031-02-02T15:00:00.000Z" }),
    ).resolves.toMatchObject({
      status: 200,
      data: { status: "PENDING", scheduledAt: "2031-02-02T15:00:00.000Z" },
    });
  });

  it("recusa intervalo sobreposto a outro PENDING e aceita horários encostados", async () => {
    const first = await create("2031-03-01T13:00:00.000Z", 60);

    const overlapping = await mockAdapter(
      config("post", "/appointment/", {
        studentId: "student-2",
        scheduledAt: "2031-03-01T13:30:00.000Z",
      }),
    );
    expect(overlapping).toMatchObject({
      status: 409,
      data: {
        message: "APPOINTMENT_CONFLICT",
        conflictingAppointmentId: first.id,
      },
    });

    const touching = await create("2031-03-01T14:00:00.000Z", 60);
    expect(touching.id).toBeTruthy();
    const before = await mockAdapter(
      config("post", "/appointment/", {
        studentId: "student-2",
        scheduledAt: "2031-03-01T12:00:00.000Z",
        durationMinutes: 60,
      }),
    );
    expect(before.status).toBe(201);
  });

  it("remarcar para cima de outro PENDING dá conflito, mas ignora cancelados e o próprio", async () => {
    const a = await create("2031-04-01T13:00:00.000Z", 60);
    const b = await create("2031-04-01T16:00:00.000Z", 60);

    await expect(
      put(b.id, { scheduledAt: "2031-04-01T13:15:00.000Z" }),
    ).resolves.toMatchObject({
      status: 409,
      data: {
        message: "APPOINTMENT_CONFLICT",
        conflictingAppointmentId: a.id,
      },
    });
    await expect(put(a.id, { durationMinutes: 90 })).resolves.toMatchObject({
      status: 200,
    });
    await put(a.id, { status: "CANCELLED" });
    await expect(
      put(b.id, { scheduledAt: "2031-04-01T13:15:00.000Z" }),
    ).resolves.toMatchObject({ status: 200 });
    await expect(put(a.id, { status: "PENDING" })).resolves.toMatchObject({
      status: 409,
      data: { message: "APPOINTMENT_CONFLICT", conflictingAppointmentId: b.id },
    });
  });
});
