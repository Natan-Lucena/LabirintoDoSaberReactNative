import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "../../../test-utils/render";
import { TabBar, type TabBarItem } from "../index";

const tabs: TabBarItem[] = [
  { key: "home", label: "Início", icon: "home", onPress: vi.fn() },
  {
    key: "activities",
    label: "Atividades",
    icon: "activities",
    onPress: vi.fn(),
  },
  { key: "students", label: "Alunos", icon: "students", onPress: vi.fn() },
  { key: "agenda", label: "Agenda", icon: "agenda", onPress: vi.fn() },
  { key: "reports", label: "Relatórios", icon: "reports", onPress: vi.fn() },
];

describe("TabBar", () => {
  it("anuncia a aba ativa e as demais como não selecionadas", async () => {
    await render(<TabBar tabs={tabs} activeKey="agenda" />);
    expect(
      screen.getByLabelText("Agenda").props.accessibilityState?.selected,
    ).toBe(true);
    expect(
      screen.getByLabelText("Início").props.accessibilityState?.selected,
    ).toBe(false);
  });

  it("dispara onPress da aba tocada", async () => {
    await render(<TabBar tabs={tabs} activeKey="home" />);
    await fireEvent.press(screen.getByLabelText("Atividades"));
    expect(tabs[1].onPress).toHaveBeenCalledTimes(1);
  });

  // FX4: no Android, rótulos como "Início"/"Agenda"/"Atividades" apareciam
  // cortados (ex.: "Iníci", "Agend", "Atividade") porque o texto quebrava
  // para uma 2ª linha invisível cortada pela altura fixa da tab bar.
  // numberOfLines=1 evita a quebra silenciosa.
  it("limita os rótulos das abas a uma linha (evita corte no Android)", async () => {
    await render(<TabBar tabs={tabs} activeKey="home" />);
    expect(screen.getByText("Início").props.numberOfLines).toBe(1);
    expect(screen.getByText("Atividades").props.numberOfLines).toBe(1);
  });
});
