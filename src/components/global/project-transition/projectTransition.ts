import { useSyncExternalStore, type CSSProperties } from "react";

const motionQuery = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(motionQuery);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

export function useProjectTransition() {
  const reduced = useSyncExternalStore(subscribe, () => window.matchMedia(motionQuery).matches, () => true);
  return reduced ? false : { types: ["project-navigation"] };
}

export function projectTransitionStyle(slug: string, part: "image" | "title" | "description" | "category"): CSSProperties {
  return {
    viewTransitionName: `project-${part}-${slug}`,
    viewTransitionClass: part === "image" ? "project-shared-image" : "project-shared-text",
  };
}
