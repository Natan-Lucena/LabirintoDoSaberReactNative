import { useRouter, useSegments } from "expo-router";

import type { BottomNavItem } from "@/components/ds/BottomNav";
import type { FigmaIconName } from "@/components/FigmaIcon";

export interface TabDefinition {
  key: string;
  label: string;
  icon: FigmaIconName;
  segment: string;
}

// NAV-01 (Figma Make `navigation`/`.bottom-nav`): 4 abas — Início, Agenda,
// Pacientes e Recursos. G-31 revogado pelo novo design: Agenda volta às
// abas (ver docs/entrega-1/GATES.md).
export const TAB_DEFINITIONS: TabDefinition[] = [
  { key: "home", label: "Início", icon: "home", segment: "index" },
  { key: "agenda", label: "Agenda", icon: "calendar", segment: "agenda" },
  {
    key: "patients",
    label: "Pacientes",
    icon: "users",
    segment: "patients",
  },
  { key: "resources", label: "Recursos", icon: "grid", segment: "resources" },
];

export interface UseTabItemsResult {
  items: BottomNavItem[];
  activeKey: string;
}

// Mapa de aba-mãe (Figma `App.tsx`, `rootScreen`): rotas internas mantêm a
// aba de origem ativa. Alunos/pacientes -> Pacientes; agenda/sessão ->
// Agenda; qualquer outra rota interna (conteúdo, atividades, relatórios,
// planos, avaliações etc.) -> Recursos.
function resolveActiveKey(segments: string[]): string {
  const meaningful = segments.filter((segment) => segment !== "(tabs)");

  if (meaningful.length === 0) {
    return "home";
  }

  const first = meaningful[0];

  if (first === "home" || first === "index") {
    return "home";
  }
  if (first === "patients" || first === "students") {
    return "patients";
  }
  if (first === "session" || first === "agenda" || first === "appointments") {
    return "agenda";
  }

  return "resources";
}

export function useTabItems(): UseTabItemsResult {
  const router = useRouter();
  const segments = useSegments();
  const activeKey = resolveActiveKey(segments as string[]);

  const items: BottomNavItem[] = TAB_DEFINITIONS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    icon: tab.icon,
    onPress: () =>
      router.push(
        tab.segment === "index"
          ? "/"
          : (`/${tab.segment}` as Parameters<typeof router.push>[0]),
      ),
  }));

  return { items, activeKey };
}
