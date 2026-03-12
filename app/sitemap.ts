import { createClient } from "@/lib/supabase/server"
import type { MetadataRoute } from "next"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://glowbeauty.com"

  // Get all published posts
  const { data: posts } = await supabase
    .from("posts")
    .select("slug, updated_at")
    .eq("status", "published")

  // Get all categories
  const { data: categories } = await supabase
    .from("categories")
    .select("slug, updated_at")

  // Get all tags
  const { data: tags } = await supabase
    .from("tags")
    .select("slug, created_at")

  const postUrls: MetadataRoute.Sitemap = (posts || []).map((post) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at),
    changeFrequency: "weekly",
    priority: 0.8,
  }))

  const categoryUrls: MetadataRoute.Sitemap = (categories || []).map((category) => ({
    url: `${baseUrl}/blog/category/${category.slug}`,
    lastModified: new Date(category.updated_at),
    changeFrequency: "weekly",
    priority: 0.6,
  }))

  const tagUrls: MetadataRoute.Sitemap = (tags || []).map((tag) => ({
    url: `${baseUrl}/blog/tag/${tag.slug}`,
    lastModified: new Date(tag.created_at),
    changeFrequency: "weekly",
    priority: 0.5,
  }))

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...postUrls,
    ...categoryUrls,
    ...tagUrls,
  ]
}
