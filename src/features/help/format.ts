import type { HelpTutorial } from "@/api/types";

/** Minutos arredondados, no mínimo 1 ("4 min"). */
export function formatTutorialDuration(durationSeconds: number): string {
  return `${tutorialMinutes(durationSeconds)} min`;
}

export function tutorialMinutes(durationSeconds: number): number {
  return Math.max(1, Math.round(durationSeconds / 60));
}

/** Só `https` vale como vídeo (AJ-02); vazio ou `http` = tutorial sem vídeo. */
export function playableVideoUrl(tutorial: HelpTutorial): string | null {
  const url = tutorial.videoUrl?.trim();
  return url && url.toLowerCase().startsWith("https://") ? url : null;
}

/** O primeiro `featured` é o destaque; os demais seguem a ordem do servidor. */
export function splitTutorials(tutorials: readonly HelpTutorial[]): {
  featured: HelpTutorial | null;
  rest: HelpTutorial[];
} {
  const featured = tutorials.find((item) => item.featured) ?? null;
  return { featured, rest: tutorials.filter((item) => item !== featured) };
}
