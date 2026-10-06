import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, screen } from "@/test-utils/render";
import { SelectField } from "../SelectField";

const OPTIONS = [
  { label: "Fonoaudiologia", value: "speech" },
  { label: "Psicopedagogia", value: "psychopedagogy" },
];

describe("AC-DS-04-01 SelectField rótulo e erro acessíveis", () => {
  it("usa o rótulo como accessibilityLabel do campo", async () => {
    await render(
      <SelectField
        label="Tipo de atendimento"
        value={null}
        options={OPTIONS}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByLabelText("Tipo de atendimento")).toBeTruthy();
  });

  it("mostra o placeholder quando não há valor selecionado", async () => {
    await render(
      <SelectField
        label="Tipo de atendimento"
        value={null}
        options={OPTIONS}
        onChange={vi.fn()}
        placeholder="Selecione"
      />,
    );
    expect(screen.getByText("Selecione")).toBeTruthy();
  });

  it("exibe o erro com papel alert e live region polite", async () => {
    await render(
      <SelectField
        label="Tipo de atendimento"
        value={null}
        options={OPTIONS}
        onChange={vi.fn()}
        error="Campo obrigatório"
      />,
    );
    const errorNode = screen.getByText("Campo obrigatório");
    expect(errorNode.props.accessibilityRole).toBe("alert");
    expect(errorNode.props.accessibilityLiveRegion).toBe("polite");
  });

  it("abre a folha de opções e seleciona um valor", async () => {
    const onChange = vi.fn();
    await render(
      <SelectField
        label="Tipo de atendimento"
        value={null}
        options={OPTIONS}
        onChange={onChange}
      />,
    );

    expect(screen.queryByText("Psicopedagogia")).toBeNull();

    await fireEvent.press(screen.getByLabelText("Tipo de atendimento"));
    expect(screen.getByText("Psicopedagogia")).toBeTruthy();

    await fireEvent.press(screen.getByLabelText("Psicopedagogia"));
    expect(onChange).toHaveBeenCalledWith("psychopedagogy");
  });

  it("mostra o rótulo da opção selecionada no campo", async () => {
    await render(
      <SelectField
        label="Tipo de atendimento"
        value="speech"
        options={OPTIONS}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Fonoaudiologia")).toBeTruthy();
  });
});
