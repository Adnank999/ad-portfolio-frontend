import { blogCategories } from "@/data/blog";
import type { BlogArchive, BlogSearch, PublishedBlogPost } from "@/data/blog";
import { siteUrl } from "./siteUrl";

type BlogHeadOptions = {
  title: string;
  description: string;
  path: string;
  imagePath: string;
  imageAlt: string;
  crumbs: { name: string; path: string }[];
  entity: Record<string, unknown>;
};

function blogHead({ title, description, path, imagePath, imageAlt, crumbs, entity }: BlogHeadOptions) {
  const url = siteUrl(path);
  const image = siteUrl(imagePath);
  const graph: Record<string, unknown>[] = [
    { ...entity, "@id": `${url}#collection`, url, name: title, description, image },
    { "@type": "BreadcrumbList", "@id": `${url}#breadcrumbs`, itemListElement: crumbs.map((crumb, index) => ({ "@type": "ListItem", position: index + 1, name: crumb.name, item: siteUrl(crumb.path) })) },
  ];

  const meta = [
    { title: `${title} | Adnan Hossain Khan` },
    { name: "description", content: description },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { property: "og:url", content: url },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: imageAlt },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: imageAlt },
  ];

  return {
    meta,
    links: [{ rel: "canonical", href: url }],
    scripts: [{ type: "application/ld+json", children: JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c") }],
  };
}

export function blogIndexHead(archive: BlogArchive, search: BlogSearch) {
  const category = blogCategories.find((entry) => entry.id === search.category);
  const query = new URLSearchParams();
  if (search.category) query.set('category', search.category);
  if (search.sort) query.set('sort', search.sort);
  if (search.page) query.set('page', String(search.page));
  const path = `/blog${query.size ? `?${query}` : ''}`;
  return blogHead({
    title: "The Blog — Notes from the Build",
    description: "Practical notes on planning, designing, and building useful websites and software, written by full-stack developer Adnan Hossain Khan.",
    path,
    imagePath: archive.data[0]?.socialImage ?? "/images/blog/from-idea-to-first-release.png",
    imageAlt: "Adnan Hossain Khan — field notes on planning, building, and releasing useful software",
    crumbs: [{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }],
    entity: { "@type": "CollectionPage", ...(category ? { about: category.label } : {}), mainEntity: { "@type": "ItemList", numberOfItems: archive.pagination.total, itemListElement: archive.data.map((post, index) => ({ "@type": "ListItem", position: (archive.pagination.page - 1) * archive.pagination.perPage + index + 1, item: { "@type": "BlogPosting", headline: post.title, url: siteUrl(`/blog/${post.slug}`) } })) } },
  });
}

export function blogPostHead(post: PublishedBlogPost) {
  const { seo } = post;
  return {
    meta: [
      { title: seo.metaTitle },
      { name: 'description', content: seo.metaDescription },
      { name: 'robots', content: seo.robots },
      { property: 'og:title', content: seo.ogTitle },
      { property: 'og:description', content: seo.ogDescription },
      { property: 'og:type', content: seo.ogType },
      { property: 'og:url', content: seo.canonicalUrl },
      { property: 'og:image', content: seo.ogImage },
      { property: 'og:image:alt', content: seo.ogImageAlt },
      { name: 'twitter:card', content: seo.twitterCard },
      { name: 'twitter:title', content: seo.twitterTitle },
      { name: 'twitter:description', content: seo.twitterDescription },
      { name: 'twitter:image', content: seo.twitterImage },
      { name: 'twitter:image:alt', content: seo.ogImageAlt },
      { property: 'article:published_time', content: `${post.publishedAt}T00:00:00Z` },
      { property: 'article:modified_time', content: `${post.updatedAt}T00:00:00Z` },
      { name: 'author', content: post.author.name },
    ],
    links: [{ rel: 'canonical', href: seo.canonicalUrl }],
    scripts: [{ type: 'application/ld+json', children: JSON.stringify(post.structuredData).replace(/</g, '\\u003c') }],
  };
}
