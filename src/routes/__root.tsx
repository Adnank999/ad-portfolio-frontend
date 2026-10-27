import type { ReactNode } from "react";
import { RouteNotFound } from "@/components/feedback/PageNotFound";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
  useMatches,
} from "@tanstack/react-router";
import type { QueryClient } from "@tanstack/react-query";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";
import "@/styles/app.css";
import "@/components/global/project-transition/projectTransition.css";
import "@/components/admin/admin.css";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()(
  {
    head: () => ({
      meta: [
        { charSet: "utf-8" },
        { name: "viewport", content: "width=device-width, initial-scale=1" },
        { name: "theme-color", content: "#05070d" },
        { title: "Adnan Hossain Khan — Ideas into reality" },
        {
          name: "description",
          content:
            "Thoughtful interfaces and dependable systems. Explore web products, software and digital experiences by Adnan Hossain Khan.",
        },
        {
          property: "og:title",
          content: "Adnan Hossain Khan — Ideas into reality",
        },
        {
          property: "og:description",
          content:
            "Thoughtful interfaces, dependable systems, and modern digital products.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [
        {
          rel: "preload",
          href: "/fonts/Inter-Variable.ttf",
          as: "font",
          type: "font/ttf",
          crossOrigin: "anonymous",
        },
      ],
    }),
    component: RootDocument,
    notFoundComponent: RouteNotFound,
    shellComponent: RootShell,
  },
);

function RootDocument() {
  const path = useMatches({
    select: (matches) => matches.at(-1)?.pathname ?? "/",
  });
  const workspace =
    path.startsWith("/admin") ||
    ["/login", "/register", "/forgot-password", "/reset-password"].includes(
      path,
    );
  const terrain = path === "/projects" || path.startsWith("/projects/");
  return workspace || terrain ? (
    <Outlet />
  ) : (
    <SmoothScrollProvider>
      <Navbar />
      <Outlet />
      <Footer />
    </SmoothScrollProvider>
  );
}
function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
