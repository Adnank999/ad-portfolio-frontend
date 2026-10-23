export type BlogCategory = "insights" | "growth" | "ai" | "news";

export type BlogSearch = {
  category?: BlogCategory;
  view?: "list";
  sort?: "oldest";
  page?: number;
};

export type BlogSection = {
  id: string;
  title: string;
  paragraphs: string[];
  points?: string[];
  cards?: { title: string; text: string }[];
  table?: { caption: string; headers: string[]; rows: string[][] };
  callout?: { title: string; text: string };
};

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  category: BlogCategory;
  publishedAt: string;
  updatedAt: string;
  author: { name: string; role: string; initials: string };
  cover: string;
  coverAlt: string;
  socialImage: string;
  intro: string[];
  takeaways: string[];
  sections: BlogSection[];
  faqs: { question: string; answer: string }[];
  tags: string[];
  readingMinutes?: number;
};

export type BlogSummary = Pick<BlogPost, "slug" | "title" | "description" | "category" | "publishedAt" | "updatedAt" | "author" | "cover" | "coverAlt" | "socialImage" | "tags" | "readingMinutes">;

export type BlogArchive = {
  data: BlogSummary[];
  pagination: { page: number; perPage: number; total: number; totalPages: number };
};

export type BlogCounts = Record<BlogCategory | "all", number>;

export type BlogSeo = {
  metaTitle: string;
  metaDescription: string;
  canonicalUrl: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogImageAlt: string;
  ogType: string;
  twitterCard: string;
  twitterTitle: string;
  twitterDescription: string;
  twitterImage: string;
  robots: string;
};

export type PublishedBlogPost = BlogPost & {
  readingMinutes: number;
  renderedHtml: string;
  contents: { id: string; title: string }[];
  seo: BlogSeo;
  structuredData: import("@/server/portfolio-content").JsonObject;
};
