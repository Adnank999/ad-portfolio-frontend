import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { PageNotFound } from "@/components/feedback/PageNotFound";
import { BlogDetailPage } from "@/components/blog/blog-detail/BlogDetailPage";
import { blogPostHead } from "@/lib/blogSeo";
import { blogPostOptions } from "@/queries/blog/blog";
import { BlogLoadError, BlogPending } from "@/components/blog/blog-feedback/BlogFeedback";

export const Route = createFileRoute("/blog/$slug")({
  loader: async ({ params, context }) => {
    const post = await context.queryClient.fetchQuery(blogPostOptions(params.slug));
    if (!post) throw notFound();
    if (post.slug !== params.slug) throw redirect({ to: '/blog/$slug', params: { slug: post.slug }, statusCode: 308 });
    return post;
  },
  preloadStaleTime: 0,
  head: ({ loaderData }) => loaderData ? blogPostHead(loaderData) : {
    meta: [{ title: "Article Not Found | Adnan Hossain Khan" }, { name: "robots", content: "noindex" }],
  },
  component: BlogPostRoute,
  pendingComponent: BlogPending,
  errorComponent: BlogLoadError,
  notFoundComponent: () => <PageNotFound collection="blog" />,
});

function BlogPostRoute() {
  return <BlogDetailPage post={Route.useLoaderData()} />;
}
