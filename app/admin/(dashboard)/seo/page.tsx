import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, FileText, Rss, Map, CheckCircle } from "lucide-react"
import Link from "next/link"

async function getSEOStats() {
  const supabase = await createClient()
  
  const [
    { count: totalPosts },
    { count: publishedPosts },
    { count: postsWithMeta },
    { count: postsWithOgImage },
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("posts").select("*", { count: "exact", head: true }).not("meta_description", "is", null),
    supabase.from("posts").select("*", { count: "exact", head: true }).not("og_image", "is", null),
  ])

  return {
    totalPosts: totalPosts || 0,
    publishedPosts: publishedPosts || 0,
    postsWithMeta: postsWithMeta || 0,
    postsWithOgImage: postsWithOgImage || 0,
  }
}

export default async function SEOPage() {
  const stats = await getSEOStats()
  const metaPercentage = stats.totalPosts > 0 
    ? Math.round((stats.postsWithMeta / stats.totalPosts) * 100) 
    : 0
  const ogPercentage = stats.totalPosts > 0 
    ? Math.round((stats.postsWithOgImage / stats.totalPosts) * 100) 
    : 0

  const seoResources = [
    {
      title: "Sitemap",
      description: "XML sitemap for search engines",
      href: "/sitemap.xml",
      icon: Map,
    },
    {
      title: "RSS Feed",
      description: "RSS feed for subscribers",
      href: "/rss.xml",
      icon: Rss,
    },
    {
      title: "Robots.txt",
      description: "Search engine crawling rules",
      href: "/robots.txt",
      icon: FileText,
    },
  ]

  const seoChecklist = [
    { label: "Sitemap generated", complete: true },
    { label: "RSS feed available", complete: true },
    { label: "Robots.txt configured", complete: true },
    { label: "Structured data (JSON-LD)", complete: true },
    { label: "Open Graph meta tags", complete: true },
    { label: "Canonical URLs", complete: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">SEO Settings</h1>
        <p className="text-muted-foreground">Monitor and optimize your blog for search engines</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Posts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Published
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.publishedPosts}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meta Descriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metaPercentage}%</div>
            <p className="text-xs text-muted-foreground">{stats.postsWithMeta} of {stats.totalPosts} posts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              OG Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ogPercentage}%</div>
            <p className="text-xs text-muted-foreground">{stats.postsWithOgImage} of {stats.totalPosts} posts</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SEO Resources */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Resources</CardTitle>
            <CardDescription>Access your auto-generated SEO files</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {seoResources.map((resource) => (
              <div
                key={resource.href}
                className="flex items-center justify-between rounded-lg border border-border p-4"
              >
                <div className="flex items-center gap-3">
                  <resource.icon className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">{resource.title}</p>
                    <p className="text-sm text-muted-foreground">{resource.description}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={resource.href} target="_blank" className="flex items-center gap-2">
                    View <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* SEO Checklist */}
        <Card>
          <CardHeader>
            <CardTitle>SEO Checklist</CardTitle>
            <CardDescription>Essential SEO features status</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {seoChecklist.map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <CheckCircle className={`h-5 w-5 ${item.complete ? "text-green-500" : "text-muted-foreground"}`} />
                  <span className={item.complete ? "text-foreground" : "text-muted-foreground"}>
                    {item.label}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle>SEO Best Practices</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Add meta descriptions to all posts for better search snippets</li>
            <li>Use descriptive, keyword-rich titles</li>
            <li>Include alt text for all images</li>
            <li>Create internal links between related posts</li>
            <li>Use descriptive URLs (slugs)</li>
            <li>Add Open Graph images for better social sharing</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
