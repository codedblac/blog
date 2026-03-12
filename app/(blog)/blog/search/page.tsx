import { createClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/blog/post-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowLeft, Search } from "lucide-react"
import type { Post } from "@/lib/types"
import type { Metadata } from "next"

interface SearchPageProps {
  searchParams: Promise<{ q?: string; page?: string }>
}

const POSTS_PER_PAGE = 12

async function searchPosts(query: string, page: number): Promise<{ posts: Post[]; total: number }> {
  const supabase = await createClient()
  const from = (page - 1) * POSTS_PER_PAGE
  const to = from + POSTS_PER_PAGE - 1

  // Search in title, excerpt, and content using ilike
  const searchPattern = `%${query}%`
  
  const { data, count } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(*),
      category:categories(*)
    `, { count: "exact" })
    .eq("status", "published")
    .or(`title.ilike.${searchPattern},excerpt.ilike.${searchPattern},content.ilike.${searchPattern}`)
    .order("published_at", { ascending: false })
    .range(from, to)

  return {
    posts: (data || []) as Post[],
    total: count || 0,
  }
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams
  
  return {
    title: q ? `Search: ${q}` : "Search",
    description: q ? `Search results for "${q}" on Glow Beauty Blog.` : "Search articles on Glow Beauty Blog.",
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q, page: pageParam } = await searchParams
  const query = q?.trim() || ""
  const currentPage = parseInt(pageParam || "1", 10)

  let posts: Post[] = []
  let total = 0

  if (query) {
    const result = await searchPosts(query, currentPage)
    posts = result.posts
    total = result.total
  }

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
          <div className="inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-muted-foreground">
            <Search className="h-5 w-5" />
            <span>Search Results</span>
          </div>
          {query ? (
            <>
              <h1 className="mt-4 font-serif text-4xl font-bold text-foreground text-balance">
                Results for &ldquo;{query}&rdquo;
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                {total} {total === 1 ? "article" : "articles"} found
              </p>
            </>
          ) : (
            <h1 className="mt-4 font-serif text-4xl font-bold text-foreground">
              Search Articles
            </h1>
          )}
        </div>

        {/* Results */}
        {query ? (
          posts.length > 0 ? (
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
                      <Link href={`/blog/search?q=${encodeURIComponent(query)}&page=${currentPage - 1}`}>
                        Previous
                      </Link>
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
                      <Link href={`/blog/search?q=${encodeURIComponent(query)}&page=${currentPage + 1}`}>
                        Next
                      </Link>
                    ) : (
                      <span>Next</span>
                    )}
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">
                No articles found for &ldquo;{query}&rdquo;. Try a different search term.
              </p>
            </div>
          )
        ) : (
          <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
            <p className="text-muted-foreground">
              Enter a search term to find articles.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
