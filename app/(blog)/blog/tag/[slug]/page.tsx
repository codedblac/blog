import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PostCard } from "@/components/blog/post-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Tag } from "lucide-react"
import type { Post, Tag as TagType } from "@/lib/types"
import type { Metadata } from "next"

interface TagPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ page?: string }>
}

const POSTS_PER_PAGE = 12

async function getTag(slug: string): Promise<TagType | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .single()
  
  return data as TagType | null
}

async function getTagPosts(tagId: string, page: number): Promise<{ posts: Post[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * POSTS_PER_PAGE
  const to = from + POSTS_PER_PAGE - 1

  // Get post IDs with this tag
  const { data: postTags } = await supabase
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", tagId)

  const postIds = postTags?.map((pt) => pt.post_id) || []

  if (postIds.length === 0) {
    return { posts: [], total: 0 }
  }

  const { data, count } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(*),
      category:categories(*)
    `, { count: "exact" })
    .eq("status", "published")
    .in("id", postIds)
    .order("published_at", { ascending: false })
    .range(from, to)

  return {
    posts: (data || []) as Post[],
    total: count || 0,
  }
}

export async function generateMetadata({ params }: TagPageProps): Promise<Metadata> {
  const { slug } = await params
  const tag = await getTag(slug)
  
  if (!tag) {
    return { title: "Tag Not Found" }
  }

  return {
    title: `#${tag.name} Articles`,
    description: `Browse all articles tagged with ${tag.name} on Glow Beauty Blog.`,
  }
}

export default async function TagPage({ params, searchParams }: TagPageProps) {
  const { slug } = await params
  const { page: pageParam } = await searchParams
  const tag = await getTag(slug)

  if (!tag) {
    notFound()
  }

  const currentPage = parseInt(pageParam || "1", 10)
  const { posts, total } = await getTagPosts(tag.id, currentPage)
  const totalPages = Math.ceil(total / POSTS_PER_PAGE)

  return (
    <div className="px-4 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Back Link */}
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/blog" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </Button>

        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
            <Tag className="h-5 w-5" />
            <span className="font-medium">{tag.name}</span>
          </div>
          <h1 className="mt-4 font-serif text-4xl font-bold text-foreground">
            Articles tagged #{tag.name}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{total} articles</p>
        </div>

        {/* Posts Grid */}
        {posts.length > 0 ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-12 flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  disabled={currentPage <= 1}
                  asChild={currentPage > 1}
                >
                  {currentPage > 1 ? (
                    <Link href={`/blog/tag/${slug}?page=${currentPage - 1}`}>Previous</Link>
                  ) : (
                    <span>Previous</span>
                  )}
                </Button>
                <span className="px-4 text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage >= totalPages}
                  asChild={currentPage < totalPages}
                >
                  {currentPage < totalPages ? (
                    <Link href={`/blog/tag/${slug}?page=${currentPage + 1}`}>Next</Link>
                  ) : (
                    <span>Next</span>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No articles with this tag yet.</p>
          </div>
        )}
      </div>
    </div>
  )
}
