import { describe, expect, it } from "vitest";

import { render, screen } from "@/test-utils/render";
import { DsButton } from "../DsButton";
import { Field } from "../Field";
import { StaticPressable } from "../StaticPressable";

// QA-02: os fluxos Maestro localizam estes componentes por `testID`.
describe("testID nos componentes do DS", () => {
  it("DsButton, Field e StaticPressable repassam o testID", async () => {
    await render(
      <>
        <DsButton label="Entrar" onPress={() => undefined} testID="btn" />
        <Field
          label="Email"
          value=""
          onChangeText={() => undefined}
          testID="fld"
        />
        <StaticPressable testID="sp" />
      </>,
    );
    expect(screen.getByTestId("btn")).toBeTruthy();
    expect(screen.getByTestId("fld")).toBeTruthy();
    expect(screen.getByTestId("sp")).toBeTruthy();
  });
});
