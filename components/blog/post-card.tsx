"use client"

import Link from "next/link"
import Image from "next/image"
import { format } from "date-fns"
import { Clock, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { Post } from "@/lib/types"

interface PostCardProps {
  post: Post
  featured?: boolean
}

function getBackgroundStyle(post: Post): React.CSSProperties {
  if (post.background_type === "gradient" && post.gradient_start && post.gradient_end) {
    return {
      background: `linear-gradient(135deg, ${post.gradient_start}, ${post.gradient_end})`,
    }
  }
  if (post.background_type === "color" && post.background_color) {
    return {
      backgroundColor: post.background_color,
    }
  }
  return {}
}

export function PostCard({ post, featured = false }: PostCardProps) {
  const publishedDate = post.published_at ? new Date(post.published_at) : null
  const hasCustomBackground = post.background_type === "gradient" || post.background_type === "color"
  const textColor = post.text_color || "#ffffff"

  if (featured) {
    return (
      <article className="group relative overflow-hidden rounded-xl bg-card">
        <Link href={`/blog/${post.slug}`} className="block">
          <div className="relative aspect-[16/9] overflow-hidden">
            {post.featured_image && post.background_type === "image" ? (
              <Image
                src={post.featured_image}
                alt={post.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              />
            ) : hasCustomBackground ? (
              <div 
                className="h-full w-full transition-transform duration-500 group-hover:scale-105" 
                style={getBackgroundStyle(post)}
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-accent/20" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            <div 
              className="absolute bottom-0 left-0 right-0 p-6"
              style={{ color: hasCustomBackground ? textColor : "#ffffff" }}
            >
              {post.category && (
                <Badge variant="secondary" className="mb-3 bg-primary text-primary-foreground">
                  {post.category.name}
                </Badge>
              )}
              <h2 className="font-serif text-2xl font-bold leading-tight md:text-3xl text-balance">
                {post.title}
              </h2>
              {post.excerpt && (
                <p className="mt-2 line-clamp-2 text-sm opacity-80">
                  {post.excerpt}
                </p>
              )}
              <div className="mt-4 flex items-center gap-4 text-sm opacity-70">
                {post.author && (
                  <span className="flex items-center gap-1">
                    <User className="h-4 w-4" />
                    {post.author.full_name || "Anonymous"}
                  </span>
                )}
                {publishedDate && (
                  <span>{format(publishedDate, "MMM d, yyyy")}</span>
                )}
                {post.reading_time && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {post.reading_time} min read
                  </span>
                )}
              </div>
            </div>
          </div>
        </Link>
      </article>
    )
  }

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="relative aspect-[4/3] overflow-hidden">
          {post.featured_image && post.background_type === "image" ? (
            <Image
              src={post.featured_image}
              alt={post.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : hasCustomBackground ? (
            <div 
              className="h-full w-full flex items-center justify-center p-4 transition-transform duration-500 group-hover:scale-105" 
              style={{
                ...getBackgroundStyle(post),
                color: textColor,
              }}
            >
              <span className="font-serif text-lg font-semibold text-center line-clamp-3 text-balance">
                {post.title}
              </span>
            </div>
          ) : (
            <div className="h-full w-full bg-gradient-to-br from-primary/10 to-accent/10" />
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {post.category && (
            <Link 
              href={`/blog/category/${post.category.slug}`}
              className="font-medium text-primary hover:underline"
            >
              {post.category.name}
            </Link>
          )}
          {publishedDate && (
            <>
              <span className="text-muted-foreground/50">•</span>
              <span>{format(publishedDate, "MMM d, yyyy")}</span>
            </>
          )}
        </div>
        {!hasCustomBackground && (
          <Link href={`/blog/${post.slug}`} className="mt-2 block">
            <h3 className="font-serif text-lg font-semibold leading-snug text-foreground group-hover:text-primary transition-colors text-balance">
              {post.title}
            </h3>
          </Link>
        )}
        {post.excerpt && (
          <p className={`line-clamp-2 text-sm text-muted-foreground ${hasCustomBackground ? "mt-2" : "mt-2"}`}>
            {post.excerpt}
          </p>
        )}
        <div className="mt-auto pt-4 flex items-center gap-3 text-xs text-muted-foreground">
          {post.author && (
            <span className="flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {post.author.full_name || "Anonymous"}
            </span>
          )}
          {post.reading_time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {post.reading_time} min
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
