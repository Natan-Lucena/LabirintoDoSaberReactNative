import { AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";
import { describe, expect, it } from "vitest";

import { mockAdapter } from "@/mocks/adapter";
import { MOCK_TASK_GROUPS, MOCK_TASKS } from "@/mocks/handlers/content";

function config(url: string): InternalAxiosRequestConfig {
  return {
    headers: new AxiosHeaders(),
    baseURL: "http://mock.local",
    method: "get",
    url,
  } as InternalAxiosRequestConfig;
}

describe("handlers mockados de conteúdo T-703 (G-29, mock provisório de G-06)", () => {
  it("GET /task-group/list-by-educator retorna grupos ficticios", async () => {
    await expect(
      mockAdapter(config("/task-group/list-by-educator")),
    ).resolves.toMatchObject({ status: 200, data: MOCK_TASK_GROUPS });
  });

  it("GET /task/ retorna atividades ficticias", async () => {
    await expect(mockAdapter(config("/task/"))).resolves.toMatchObject({
      status: 200,
      data: MOCK_TASKS,
    });
  });
});
