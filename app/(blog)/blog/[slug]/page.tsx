import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { format } from "date-fns"
import { Clock, User, Calendar, ArrowLeft, Tag } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { PostCard } from "@/components/blog/post-card"
import { CTASection } from "@/components/blog/cta-section"
import { SocialShare } from "@/components/blog/social-share"
import { CommentSection } from "@/components/blog/comment-section"
import { BlogPostingJsonLd } from "@/components/blog/json-ld"
import type { Post, Tag as TagType } from "@/lib/types"
import type { Metadata } from "next"

export const dynamic = 'force-dynamic'

interface PostPageProps {
  params: Promise<{ slug: string }>
}

async function getPost(slug: string): Promise<Post | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(id, full_name, email, avatar_url),
      category:categories(id, name, slug)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (!data) return null

  // Get tags for this post
  const { data: postTags } = await supabase
    .from("post_tags")
    .select("tag_id, tags(*)")
    .eq("post_id", data.id)

  const tags = postTags?.map((pt) => pt.tags).filter(Boolean) as TagType[] || []

  return { ...data, tags } as Post
}

async function getRelatedPosts(post: Post): Promise<Post[]> {
  const supabase = await createClient()
  
  // First try to get posts in the same category
  let query = supabase
    .from("posts")
    .select(`
      *,
      author:profiles(id, full_name, email, avatar_url),
      category:categories(id, name, slug)
    `)
    .eq("status", "published")
    .neq("id", post.id)
    .order("published_at", { ascending: false })
    .limit(4)

  if (post.category_id) {
    query = query.eq("category_id", post.category_id)
  }

  const { data } = await query

  return (data || []) as Post[]
}

async function incrementViewCount(postId: string) {
  const supabase = await createClient()
  await supabase.rpc("increment_view_count", { post_id: postId }).catch(() => {
    // Silent fail - view count is not critical
  })
}

export async function generateMetadata({ params }: PostPageProps): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost(slug)
  
  if (!post) {
    return { title: "Post Not Found" }
  }

  return {
    title: post.meta_title || post.title,
    description: post.meta_description || post.excerpt,
    openGraph: {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || undefined,
      type: "article",
      publishedTime: post.published_at || undefined,
      authors: post.author?.full_name ? [post.author.full_name] : undefined,
      images: post.og_image || post.featured_image ? [{ url: post.og_image || post.featured_image! }] : undefined,
    },
  }
}

function getHeaderBackground(post: Post): { style: React.CSSProperties; hasCustomBg: boolean } {
  if (post.background_type === "gradient" && post.gradient_start && post.gradient_end) {
    return {
      style: { background: `linear-gradient(135deg, ${post.gradient_start}, ${post.gradient_end})` },
      hasCustomBg: true,
    }
  }
  if (post.background_type === "color" && post.background_color) {
    return {
      style: { backgroundColor: post.background_color },
      hasCustomBg: true,
    }
  }
  return { style: {}, hasCustomBg: false }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  const relatedPosts = await getRelatedPosts(post)
  
  // Increment view count (fire and forget)
  incrementViewCount(post.id)

  const publishedDate = post.published_at ? new Date(post.published_at) : null
  const postUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/blog/${post.slug}`
  const { style: bgStyle, hasCustomBg } = getHeaderBackground(post)
  const textColor = post.text_color || "#ffffff"

  return (
    <>
      <BlogPostingJsonLd post={post} url={postUrl} />
      
      {/* Hero Header Section */}
      <div 
        className="relative min-h-[50vh] flex items-end overflow-hidden"
        style={hasCustomBg ? bgStyle : undefined}
      >
        {/* Background Image */}
        {post.featured_image && post.background_type === "image" && (
          <Image
            src={post.featured_image}
            alt={post.title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        )}
        
        {/* Default gradient if no custom background */}
        {!hasCustomBg && !post.featured_image && (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-accent/80" />
        )}
        
        {/* Overlay gradient for readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
        
        {/* Header Content */}
        <div className="relative z-10 w-full px-4 py-12 lg:px-8 lg:py-16">
          <div className="mx-auto max-w-4xl">
            <Button variant="ghost" asChild className="mb-6 text-white/80 hover:text-white hover:bg-white/10">
              <Link href="/blog" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
            
            {post.category && (
              <Badge 
                variant="secondary" 
                className="mb-4 bg-white/20 text-white border-white/30 hover:bg-white/30"
                asChild
              >
                <Link href={`/blog/category/${post.category.slug}`}>
                  {post.category.name}
                </Link>
              </Badge>
            )}
            
            <h1 
              className="font-serif text-3xl font-bold leading-tight md:text-4xl lg:text-5xl text-balance"
              style={{ color: hasCustomBg ? textColor : "#ffffff" }}
            >
              {post.title}
            </h1>
            
            {post.excerpt && (
              <p 
                className="mt-4 text-lg leading-relaxed max-w-2xl"
                style={{ color: hasCustomBg ? `${textColor}cc` : "rgba(255,255,255,0.85)" }}
              >
                {post.excerpt}
              </p>
            )}
            
            {/* Meta */}
            <div 
              className="mt-6 flex flex-wrap items-center gap-4 text-sm"
              style={{ color: hasCustomBg ? `${textColor}aa` : "rgba(255,255,255,0.7)" }}
            >
              {post.author && (
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {post.author.full_name || "Anonymous"}
                </span>
              )}
              {publishedDate && (
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {format(publishedDate, "MMMM d, yyyy")}
                </span>
              )}
              {post.reading_time && (
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {post.reading_time} min read
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
      
      <article className="px-4 py-8 lg:px-8 lg:py-12">
        <div className="mx-auto max-w-4xl">
          {/* Share */}
          <div className="mb-8">
            <SocialShare url={postUrl} title={post.title} />
          </div>

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-bold prose-a:text-primary prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: post.content || "" }}
          />

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="mt-10 flex flex-wrap items-center gap-2 border-t border-border pt-8">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag) => (
                <Badge key={tag.id} variant="outline" asChild>
                  <Link href={`/blog/tag/${tag.slug}`}>{tag.name}</Link>
                </Badge>
              ))}
            </div>
          )}

          {/* Share Bottom */}
          <div className="mt-8 border-t border-border pt-8">
            <SocialShare url={postUrl} title={post.title} />
          </div>

          {/* CTA */}
          <div className="mt-12">
            <CTASection 
              title="Love This Look?" 
              description="Book an appointment with our expert stylists and get the same stunning results."
            />
          </div>

          {/* Comments */}
          {post.allow_comments && (
            <div className="mt-12">
              <CommentSection postId={post.id} />
            </div>
          )}
        </div>
      </article>

      {/* You May Also Like Section */}
      {relatedPosts.length > 0 && (
        <section className="bg-muted/30 px-4 py-16 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <h2 className="font-serif text-3xl font-bold text-foreground">You May Also Like</h2>
              <p className="mt-2 text-muted-foreground">Discover more articles you might enjoy</p>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {relatedPosts.map((relatedPost) => (
                <PostCard key={relatedPost.id} post={relatedPost} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Button asChild variant="outline" size="lg">
                <Link href="/blog">View All Articles</Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </>
  )
}
