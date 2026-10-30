import type { Insets } from "react-native";
import { StyleSheet } from "react-native";
import { describe, expect, it, vi } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { shape } from "../../../theme";
import { BackButton } from "../BackButton";
import { FilterChip } from "../FilterChip";
import { IconButton } from "../IconButton";
import { SectionTitle } from "../SectionTitle";
import { SegmentedControl } from "../SegmentedControl";
import { Tabs } from "../Tabs";
import { Timeline } from "../Timeline";

// QA-03 (divergência #25, G-17): na rodada da Entrega 3 os alvos mediram
// Voltar 40 dp, botões de ícone 42, abas 43, segmentado 39, filtros 34 e as
// ações de texto 17 dp de altura. O visual do Figma Make fica igual; a área
// de toque (tamanho + hitSlop) precisa alcançar shape.minTouchTarget (48).
const MIN = shape.minTouchTarget;

function slop(element: { props: { hitSlop?: number | Insets | null } }): {
  vertical: number;
  horizontal: number;
} {
  const value = element.props.hitSlop;
  if (typeof value === "number") {
    return { vertical: value * 2, horizontal: value * 2 };
  }
  return {
    vertical: (value?.top ?? 0) + (value?.bottom ?? 0),
    horizontal: (value?.left ?? 0) + (value?.right ?? 0),
  };
}

function boxSize(element: { props: { style?: unknown } }): {
  width: number;
  height: number;
} {
  const style = StyleSheet.flatten(
    element.props.style as Parameters<typeof StyleSheet.flatten>[0],
  ) as { width?: number; height?: number } | undefined;
  return { width: style?.width ?? 0, height: style?.height ?? 0 };
}

describe("QA-03 alvos de toque de pelo menos 48 dp", () => {
  it("BackButton (40 × 40)", async () => {
    await render(<BackButton onPress={vi.fn()} />);
    const button = screen.getByRole("button", { name: "Voltar" });
    const size = boxSize(button);
    expect(size.width + slop(button).horizontal).toBeGreaterThanOrEqual(MIN);
    expect(size.height + slop(button).vertical).toBeGreaterThanOrEqual(MIN);
  });

  it.each([42, 36])("IconButton de %i dp", async (sizeDp) => {
    await render(
      <IconButton
        icon="bell"
        accessibilityLabel="Notificações"
        size={sizeDp}
        onPress={vi.fn()}
      />,
    );
    const button = screen.getByRole("button", { name: "Notificações" });
    expect(sizeDp + slop(button).horizontal).toBeGreaterThanOrEqual(MIN);
    expect(sizeDp + slop(button).vertical).toBeGreaterThanOrEqual(MIN);
  });

  it("Tabs (43 dp de altura)", async () => {
    await render(
      <Tabs
        options={[
          { key: "a", label: "Visão geral" },
          { key: "b", label: "Planos" },
        ]}
        value="a"
        onChange={vi.fn()}
      />,
    );
    const tab = screen.getByLabelText("Planos");
    expect(boxSize(tab).height + slop(tab).vertical).toBeGreaterThanOrEqual(
      MIN,
    );
  });

  it("SegmentedControl (39 dp de altura)", async () => {
    await render(
      <SegmentedControl
        options={[
          { key: "f", label: "Feminino" },
          { key: "m", label: "Masculino" },
        ]}
        value="f"
        onChange={vi.fn()}
      />,
    );
    const segment = screen.getByLabelText("Masculino");
    expect(
      boxSize(segment).height + slop(segment).vertical,
    ).toBeGreaterThanOrEqual(MIN);
  });

  it("FilterChip (cerca de 34 dp de altura)", async () => {
    await render(<FilterChip label="Todos" onPress={vi.fn()} />);
    const chip = screen.getByRole("button", { name: "Todos" });
    expect(34 + slop(chip).vertical).toBeGreaterThanOrEqual(MIN);
  });

  it("ação de texto do SectionTitle (17 dp de altura)", async () => {
    await render(
      <SectionTitle
        title="Dificuldades mapeadas"
        actionLabel="Editar"
        onActionPress={vi.fn()}
      />,
    );
    const action = screen.getByRole("button", { name: "Editar" });
    expect(17 + slop(action).vertical).toBeGreaterThanOrEqual(MIN);
  });

  it("ação de texto do Timeline (Lembrete)", async () => {
    await render(
      <Timeline
        items={[
          {
            id: "1",
            time: "14:00",
            title: "Paciente",
            subtitle: "Próximo atendimento",
            actionLabel: "Lembrete",
            onActionPress: vi.fn(),
          },
        ]}
      />,
    );
    const action = screen.getByRole("button", { name: "Lembrete" });
    expect(17 + slop(action).vertical).toBeGreaterThanOrEqual(MIN);
  });
});
