import { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import "@/mocks/handlers/appointment";
import { mockAdapter } from "@/mocks/adapter";
import { registerMockHandler } from "@/mocks/handlers/registry";

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
    ).resolves.toMatchObject({ data: { observation: undefined } });
    await expect(
      mockAdapter(config("delete", `/appointment/${id}`)),
    ).resolves.toMatchObject({
      status: 200,
    });
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
    registerMockHandler(
      { method: "get", path: "/appointment/:id" },
      ({ params }) => ({
        status: 200,
        data: params,
      }),
    );

    await expect(
      mockAdapter(config("get", "/appointment/")),
    ).resolves.toMatchObject({
      data: expect.any(Array),
    });
    await expect(
      mockAdapter(config("get", "/appointment/abc")),
    ).resolves.toMatchObject({
      data: { id: "abc" },
    });
    await expect(mockAdapter(config("get", "/missing"))).rejects.toMatchObject({
      response: { status: 404, data: { message: "MOCK_ROUTE_NOT_FOUND" } },
    });
  });
});
