import type { ComponentType, PropsWithChildren, ReactElement } from "react";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  render as renderWithRntl,
  type RenderOptions,
} from "@testing-library/react-native";

import { createQueryClient } from "@/api/query-client";

type TestWrapper = ComponentType<PropsWithChildren>;
type TestRenderOptions = RenderOptions & {
  wrapper?: TestWrapper;
  queryClient?: QueryClient;
};

function DefaultWrapper({ children }: PropsWithChildren) {
  return children;
}

export async function render(
  ui: ReactElement,
  options: TestRenderOptions = {},
) {
  const {
    wrapper: Wrapper,
    queryClient = createQueryClient(),
    ...renderOptions
  } = options;

  const Composed: TestWrapper = ({ children }) => {
    const Inner = Wrapper ?? DefaultWrapper;
    return (
      <QueryClientProvider client={queryClient}>
        <Inner>{children}</Inner>
      </QueryClientProvider>
    );
  };

  return renderWithRntl(ui, { ...renderOptions, wrapper: Composed });
}

export { fireEvent, screen, waitFor } from "@testing-library/react-native";
export type { TestWrapper };
