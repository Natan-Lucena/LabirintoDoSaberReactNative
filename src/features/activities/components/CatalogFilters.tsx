import type { ReactElement } from "react";
import { useEffect, useState } from "react";

import {
  FieldGrid,
  FilterRow,
  SearchField,
  SelectField,
} from "@/components/ds";
import { CATEGORY_LABELS } from "@/features/activities/selectors";
import { useTaskSkills } from "@/features/activities/useCatalog";

export const DEBOUNCE_MS = 300;

export function useDebouncedValue<T>(value: T, delay = DEBOUNCE_MS): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export interface CatalogFilterState {
  search: string;
  kind: string;
  skill: string;
  category: string;
}

export interface CatalogFiltersProps {
  value: CatalogFilterState;
  onChange: (next: CatalogFilterState) => void;
  kindOptions: { key: string; label: string }[];
  /** Habilidade não se aplica a cadernos e grupos. */
  showSkill?: boolean;
}

const CATEGORY_SELECT_OPTIONS = [
  { label: "Todas", value: "all" },
  ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
    label,
    value,
  })),
];

export function CatalogFilters({
  value,
  onChange,
  kindOptions,
  showSkill = true,
}: CatalogFiltersProps): ReactElement {
  const skills = useTaskSkills();
  const skillOptions = [
    { label: "Todas", value: "all" },
    ...(skills.data ?? []).map(({ code, label }) => ({ label, value: code })),
  ];

  return (
    <>
      <SearchField
        value={value.search}
        onChangeText={(search) => onChange({ ...value, search })}
        onClear={() => onChange({ ...value, search: "" })}
        placeholder="Buscar por habilidade ou tema"
      />
      <FilterRow
        options={kindOptions}
        value={value.kind}
        onChange={(kind) => onChange({ ...value, kind })}
      />
      <FieldGrid>
        {showSkill ? (
          <SelectField
            label="Habilidade"
            value={skills.isError ? null : value.skill}
            options={skillOptions}
            disabled={skills.isError}
            placeholder={
              skills.isError ? "Habilidades indisponíveis" : undefined
            }
            onChange={(skill) => onChange({ ...value, skill })}
          />
        ) : null}
        <SelectField
          label="Categoria"
          value={value.category}
          options={CATEGORY_SELECT_OPTIONS}
          onChange={(category) => onChange({ ...value, category })}
        />
      </FieldGrid>
    </>
  );
}
