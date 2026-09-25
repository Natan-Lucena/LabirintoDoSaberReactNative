import type { ReactElement } from "react";

import { EmptyState } from "@/components/EmptyState";
import { Screen } from "@/components/Screen";

export interface ComingSoonScreenProps {
  title: string;
}

export function ComingSoonScreen({
  title,
}: ComingSoonScreenProps): ReactElement {
  return (
    <Screen>
      <EmptyState
        title={title}
        message="Esta área ainda não está disponível nesta entrega."
      />
    </Screen>
  );
}
