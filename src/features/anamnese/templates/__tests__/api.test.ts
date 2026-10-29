import { describe, expect, it, vi } from "vitest";
import { apiClient } from "@/api/client";
import { mockAdapter } from "@/mocks/adapter";
import "@/mocks/handlers/anamnese";
import {
  createAnamneseTemplate,
  deleteAnamneseTemplate,
  getAnamneseTemplate,
  listAnamneseTemplates,
  updateAnamneseTemplate,
} from "@/api/endpoints/anamnese";

vi.mock("expo-constants", () => ({
  default: {
    expoConfig: {
      extra: {
        appEnvironment: "development",
        apiBaseUrl: "http://10.0.2.2:3000",
        useMocks: "true",
      },
    },
  },
}));

apiClient.defaults.adapter = mockAdapter;

describe("PAC-08 apiClient e mocks", () => {
  it("cria, lista, detalha, edita e exclui um modelo", async () => {
    const created = await createAnamneseTemplate({
      title: "Meu modelo",
      questions: [{ text: "Pergunta", type: "Descriptive", required: true }],
    });
    expect(
      (await listAnamneseTemplates()).some((item) => item.id === created.id),
    ).toBe(true);
    expect((await getAnamneseTemplate(created.id)).title).toBe("Meu modelo");
    expect(
      (await updateAnamneseTemplate(created.id, { title: "Atualizado" })).title,
    ).toBe("Atualizado");
    await deleteAnamneseTemplate(created.id);
    await expect(getAnamneseTemplate(created.id)).rejects.toMatchObject({
      status: 404,
      code: "TEMPLATE_NOT_FOUND",
    });
  });
  it("bloqueia edição e exclusão quando há respostas", async () => {
    await expect(
      updateAnamneseTemplate("has-responses", { title: "Novo" }),
    ).rejects.toMatchObject({ status: 400, code: "TEMPLATE_HAS_RESPONSES" });
    await expect(deleteAnamneseTemplate("has-responses")).rejects.toMatchObject(
      { status: 400, code: "TEMPLATE_HAS_RESPONSES" },
    );
  });
});
