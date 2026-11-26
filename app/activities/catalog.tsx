import type { ReactElement } from "react";
import { useLocalSearchParams } from "expo-router";

import { CatalogListScreen } from "@/features/activities/CatalogListScreen";

export default function CatalogRoute(): ReactElement {
  const params = useLocalSearchParams<{
    source?: string;
    search?: string;
    format?: string;
    skill?: string;
    category?: string;
  }>();

  return (
    <CatalogListScreen
      source={params.source === "EDUCATOR" ? "EDUCATOR" : "LIBRARY"}
      initialSearch={params.search}
      initialFormat={params.format}
      initialSkill={params.skill}
      initialCategory={params.category}
    />
  );
}
