import { beforeEach, describe, expect, it, vi } from "vitest";

import type { HomeData } from "@/features/home/useHomeData";
import { fireEvent, render, screen } from "@/test-utils/render";

const routerPush = vi.fn();
let homeData: HomeData;

vi.mock("@/features/home/useHomeData", () => ({
  useHomeData: () => homeData,
}));
vi.mock("expo-router", () => ({ useRouter: () => ({ push: routerPush }) }));

const { ResourcesScreen } =
  await import("@/features/resources/ResourcesScreen");

describe("ResourcesScreen (AC-REC-01-01..02)", () => {
  beforeEach(() => {
    routerPush.mockClear();
    homeData = {
      educator: {
        id: "educator-1",
        name: "Aline Martins",
        email: "aline@example.test",
      },
      todayAppointments: [],
      scheduledAppointmentsCount: 0,
      lastSessions: [],
      recentNotebooks: [],
    };
  });

  it("mostra os grupos, o educador e todos os acessos da V1", async () => {
    await render(<ResourcesScreen />);

    expect(screen.getByText("Tudo em um só lugar")).toBeTruthy();
    expect(screen.getByRole("header", { name: "Recursos" })).toBeTruthy();
    expect(screen.getByText("Aline Martins")).toBeTruthy();
    expect(screen.getByText("aline@example.test")).toBeTruthy();
    expect(screen.getByText("Planejamento personalizado")).toBeTruthy();
    expect(screen.getByText("Avaliação e conteúdo")).toBeTruthy();
    expect(screen.getByText("Conta e suporte")).toBeTruthy();

    [
      "Planos com IA",
      "Evolução da sessão",
      "Avaliações e escalas",
      "Banco de atividades",
      "Cadernos e grupos",
      "Relatórios",
      "Equipe e convites",
      "Central de ajuda",
    ].forEach((title) =>
      expect(screen.getByRole("button", { name: title })).toBeTruthy(),
    );
  });

  it("navega para os destinos existentes e para Em breve nos demais recursos", async () => {
    await render(<ResourcesScreen />);

    await fireEvent.press(screen.getByRole("button", { name: "Perfil" }));
    await fireEvent.press(
      screen.getByRole("button", { name: "Banco de atividades" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Cadernos e grupos" }),
    );
    await fireEvent.press(screen.getByRole("button", { name: "Relatórios" }));
    await fireEvent.press(
      screen.getByRole("button", { name: "Planos com IA" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Evolução da sessão" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Avaliações e escalas" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Equipe e convites" }),
    );
    await fireEvent.press(
      screen.getByRole("button", { name: "Central de ajuda" }),
    );

    expect(routerPush).toHaveBeenCalledWith("/activities");
    expect(routerPush).toHaveBeenCalledWith("/reports");
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Perfil" },
    });
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Planos com IA" },
    });
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Evolução da sessão" },
    });
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Avaliações e escalas" },
    });
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Equipe e convites" },
    });
    expect(routerPush).toHaveBeenCalledWith({
      pathname: "/shell/coming-soon",
      params: { title: "Central de ajuda" },
    });
  });
});
