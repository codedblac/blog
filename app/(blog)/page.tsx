export const dynamic = 'force-dynamic'
export const revalidate = 0

import { createClient } from "@/lib/supabase/server"
import { PostCard } from "@/components/blog/post-card"
import { CTASection } from "@/components/blog/cta-section"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import type { Post, Category } from "@/lib/types"

async function getFeaturedPosts(): Promise<Post[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(id, full_name, email, avatar_url),
      category:categories(id, name, slug)
    `)
    .eq("status", "published")
    .eq("is_featured", true)
    .order("published_at", { ascending: false })
    .limit(3)
  
  if (error) console.error("Error fetching featured posts:", error)
  
  return (data || []) as Post[]
}

async function getLatestPosts(): Promise<Post[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(id, full_name, email, avatar_url),
      category:categories(id, name, slug)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(9)
  
  if (error) console.error("Error fetching latest posts:", error)
  
  return (data || []) as Post[]
}

async function getCategories(): Promise<Category[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name")
  
  return (data || []) as Category[]
}

export default async function HomePage() {
  const [featuredPosts, latestPosts, categories] = await Promise.all([
    getFeaturedPosts(),
    getLatestPosts(),
    getCategories(),
  ])

  const heroPost = featuredPosts[0]
  const sidePosts = featuredPosts.slice(1, 3)

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-muted/50 to-background px-4 py-12 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h1 className="font-serif text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
              Your Beauty Journey <br className="hidden sm:block" />
              <span className="text-primary">Starts Here</span>
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
              Discover expert tips, tutorials, and inspiration for hair, makeup, skincare, and nails from professional stylists.
            </p>
          </div>

          {/* Category Pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant="secondary"
                className="px-4 py-2 text-sm transition-colors hover:bg-primary hover:text-primary-foreground"
                asChild
              >
                <Link href={`/blog/category/${category.slug}`}>
                  {category.name}
                </Link>
              </Badge>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts */}
      {featuredPosts.length > 0 && (
        <section className="px-4 py-12 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-2xl font-bold text-foreground">Featured Stories</h2>
              <Button variant="ghost" asChild>
                <Link href="/blog" className="flex items-center gap-1">
                  View All <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {heroPost && (
                <div className="lg:row-span-2">
                  <PostCard post={heroPost} featured />
                </div>
              )}
              <div className="grid gap-6">
                {sidePosts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Latest Posts */}
      <section className="bg-muted/30 px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-2xl font-bold text-foreground">Latest Articles</h2>
            <Button variant="ghost" asChild>
              <Link href="/blog" className="flex items-center gap-1">
                View All <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          {latestPosts.length > 0 ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-xl border border-dashed border-border bg-card p-12 text-center">
              <p className="text-muted-foreground">No articles published yet. Check back soon!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-4 py-12 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <CTASection />
        </div>
      </section>
    </div>
  )
}
