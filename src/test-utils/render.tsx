import type { ComponentType, PropsWithChildren, ReactElement } from "react";

import {
  render as renderWithRntl,
  type RenderOptions,
} from "@testing-library/react-native";

type TestWrapper = ComponentType<PropsWithChildren>;
type TestRenderOptions = RenderOptions & { wrapper?: TestWrapper };

function DefaultWrapper({ children }: PropsWithChildren) {
  return children;
}

export async function render(ui: ReactElement, options: TestRenderOptions = {}) {
  const { wrapper: Wrapper = DefaultWrapper, ...renderOptions } = options;
  return renderWithRntl(ui, { ...renderOptions, wrapper: Wrapper });
}

export { fireEvent, screen, waitFor } from "@testing-library/react-native";
export type { TestWrapper };
