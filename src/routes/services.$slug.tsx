import { createFileRoute, notFound, redirect } from '@tanstack/react-router'
import { ServicePage } from '@/components/global/service-page/ServicePage'
import { PageNotFound } from '@/components/feedback/PageNotFound'
import { serviceOptions, servicesOptions } from '@/queries/services/services'
import { serviceHead } from '@/lib/serviceSeo'

export const Route = createFileRoute('/services/$slug')({
  loader: async ({ params, context }) => {
    const [service, services] = await Promise.all([context.queryClient.fetchQuery(serviceOptions(params.slug)), context.queryClient.fetchQuery(servicesOptions())])
    if (!service) throw notFound()
    if (service.slug !== params.slug) throw redirect({ to: '/services/$slug', params: { slug: service.slug }, statusCode: 308 })
    return { service, services }
  },
  head: ({ loaderData }) => loaderData ? serviceHead(loaderData.service) : { meta: [{ title: 'Service not found' }, { name: 'robots', content: 'noindex' }] },
  component: ServiceRoute,
  preloadStaleTime: 0,
  notFoundComponent: () => <PageNotFound collection="services" />,
})

function ServiceRoute() {
  const { service, services } = Route.useLoaderData()
  return <ServicePage content={{ ...service.pageContent, slug: service.slug, title: service.title, summary: service.description, category: service.category, artwork: service.artwork, media: service.media, visuals: service.visuals, faqs: service.faqs.map(faq => ({ title: faq.question, text: faq.answer })) }} services={services} />
}
