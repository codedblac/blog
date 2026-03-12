export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/blog/post-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import type { Post } from "@/lib/types"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Blog",
  description: "Explore our latest beauty articles covering hair, makeup, skincare, and nails.",
}

interface BlogPageProps {
  searchParams: Promise<{ page?: string }>
}

const POSTS_PER_PAGE = 12

async function getPosts(page: number): Promise<{ posts: Post[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * POSTS_PER_PAGE
  const to = from + POSTS_PER_PAGE - 1

  const { data, count, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(id, full_name, email, avatar_url),
      category:categories(id, name, slug)
    `, { count: "exact" })
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .range(from, to)

  if (error) {
    console.error("Error fetching posts:", error)
  }

  return {
    posts: (data || []) as Post[],
    total: count || 0,
  }
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const { page: pageParam } = await searchParams
  const currentPage = parseInt(pageParam || "1", 10)
  const { posts, total } = await getPosts(currentPage)
  const totalPages = Math.ceil(total / POSTS_PER_PAGE)

  return (
    <div className="px-4 py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="font-serif text-4xl font-bold text-foreground">All Articles</h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Discover our collection of beauty tips, tutorials, and inspiration.
          </p>
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
                    <Link href={`/blog?page=${currentPage - 1}`}>Previous</Link>
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
                    <Link href={`/blog?page=${currentPage + 1}`}>Next</Link>
                  ) : (
                    <span>Next</span>
                  )}
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">No articles found.</p>
          </div>
        )}
      </div>
    </div>
  )
}
