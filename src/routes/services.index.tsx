import { createFileRoute } from "@tanstack/react-router";
import { ServicesIndexPage } from "@/components/services/services-index/ServicesIndexPage";
import { servicesOptions } from '@/queries/services/services';
import { servicesIndexHead } from '@/lib/serviceSeo';

export const Route = createFileRoute("/services/")({
  loader: ({ context }) => context.queryClient.fetchQuery(servicesOptions()),
  head: ({ loaderData }) => servicesIndexHead(loaderData ?? []),
  component: ServicesIndexPage,
});
