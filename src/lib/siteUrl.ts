import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequestUrl } from "@tanstack/react-start/server";

const requestOrigin = createIsomorphicFn()
  .server(() => getRequestUrl().origin)
  .client(() => window.location.origin);

export function siteUrl(path: string) {
  const configured = import.meta.env.VITE_SITE_URL?.trim();
  const origin = configured ? new URL(configured).origin : requestOrigin();
  return new URL(path, origin).href;
}
