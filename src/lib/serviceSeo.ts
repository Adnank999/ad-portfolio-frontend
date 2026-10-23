import type { PublishedService, ServiceSummary } from './services/services'
import { siteUrl } from './siteUrl'

export function servicesIndexHead(services: ServiceSummary[]) {
  const url = siteUrl('/services')
  const title = 'Services | Adnan Hossain Khan'
  const description = 'Explore development and integration services with clear scope, deliverables, and a practical starting point for your project.'
  return {
    meta: [{ title }, { name: 'description', content: description }, { property: 'og:title', content: title }, { property: 'og:description', content: description }, { property: 'og:url', content: url }, { property: 'og:type', content: 'website' }],
    links: [{ rel: 'canonical', href: url }],
    scripts: [{ type: 'application/ld+json', children: JSON.stringify({ '@context': 'https://schema.org', '@type': 'CollectionPage', url, name: title, description, mainEntity: { '@type': 'ItemList', itemListElement: services.filter(service => service.enabled).map((service, index) => ({ '@type': 'ListItem', position: index + 1, item: { '@type': 'Service', name: service.title, url: siteUrl(`/services/${service.slug}`) } })) } }).replace(/</g, '\\u003c') }],
  }
}

export function serviceHead(service: PublishedService) {
  const seo = service.seo
  return {
    meta: [
      { title: seo.metaTitle }, { name: 'description', content: seo.metaDescription }, { name: 'robots', content: seo.robots },
      { property: 'og:title', content: seo.ogTitle }, { property: 'og:description', content: seo.ogDescription },
      { property: 'og:type', content: seo.ogType }, { property: 'og:url', content: seo.canonicalUrl },
      { property: 'og:image', content: seo.ogImage }, { property: 'og:image:alt', content: seo.ogImageAlt },
      { name: 'twitter:card', content: seo.twitterCard }, { name: 'twitter:title', content: seo.twitterTitle },
      { name: 'twitter:description', content: seo.twitterDescription }, { name: 'twitter:image', content: seo.twitterImage },
    ],
    links: [{ rel: 'canonical', href: seo.canonicalUrl }],
    scripts: [{ type: 'application/ld+json', children: JSON.stringify(service.structuredData).replace(/</g, '\\u003c') }],
  }
}
