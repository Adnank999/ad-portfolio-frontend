# Blog frontend

`blog-index/BlogIndexPage.tsx` renders the archive. `blog-detail/BlogDetailPage.tsx` renders the article layout. Shared cards, contents, sharing, and layout components have their own folders under `components/global/`.

The archive and article routes use the public backend endpoints through server functions in `server/public-blog.ts`. All query options and keys live in `queries/blog/blog.ts`. The archive has published-only category counts, server pagination (12 articles per page), URL-backed category/sort/layout controls, and an empty state. `data/blog/posts.ts` is an unused sample; publishing is managed through `/admin/blogs`.

Articles display the backend's sanitized HTML, including Tiptap content, images, lists, tables, and FAQs. Headings receive stable page-local anchors for the table of contents. Dates use an explicit locale and UTC timezone; reading time comes from the API. Drafts, archived posts, future publications, and deleted posts are not exposed by the public API. Only an API 404 becomes an article 404; connection or server errors show a retry state.

Routes are `/blog` and `/blog/<slug>`. Missing slugs return a 404 with `noindex`; previous slugs redirect to the current slug. Detail metadata uses the API's resolved canonical URL, Open Graph, Twitter, robots settings, and article/breadcrumb/FAQ JSON-LD. Set `FRONTEND_URL` in the backend to the public site origin and `PORTFOLIO_API_URL` in the frontend server to the API origin. `VITE_SITE_URL`, when set, controls archive URLs through the existing `siteUrl` helper.

Archive and article backgrounds and layout follow the supplied references. The existing site navigation, FK Screamer headings, JetBrains Mono text, and root footer remain the source of the shared brand styling. No new dependencies are required. Blog mutations invalidate public blog queries, and route loaders refresh stale data before rendering.
