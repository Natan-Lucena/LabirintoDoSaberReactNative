import { useLocalSearchParams } from "expo-router";
import { TemplateFormScreen } from "@/features/anamnese/templates/TemplateFormScreen";
export default function EditTemplateRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <TemplateFormScreen templateId={id} />;
}
