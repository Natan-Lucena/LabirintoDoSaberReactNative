import { describe, expect, it } from "vitest";

import { render, screen } from "../../../test-utils/render";
import { StepIndicator } from "../index";

// AC-203-01: anuncia "Etapa X de N" e marca a etapa ativa.
describe("AC-203-01 StepIndicator", () => {
  it('anuncia "Etapa 2 de 3"', async () => {
    await render(<StepIndicator totalSteps={3} currentStep={2} />);
    expect(screen.getByLabelText("Etapa 2 de 3")).toBeTruthy();
  });

  it("marca só a etapa ativa como selecionada", async () => {
    await render(
      <StepIndicator
        totalSteps={3}
        currentStep={2}
        labels={["Email", "Código", "Senha"]}
      />,
    );
    const step1 = screen.getByTestId("step-indicator-step-1");
    const step2 = screen.getByTestId("step-indicator-step-2");
    const step3 = screen.getByTestId("step-indicator-step-3");
    expect(step1.props.accessibilityState).toMatchObject({ selected: false });
    expect(step2.props.accessibilityState).toMatchObject({ selected: true });
    expect(step3.props.accessibilityState).toMatchObject({ selected: false });
  });
});
