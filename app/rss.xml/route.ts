import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const supabase = await createClient()
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://glowbeauty.com"

  const { data: posts } = await supabase
    .from("posts")
    .select(`
      title,
      slug,
      excerpt,
      published_at,
      author:profiles(full_name),
      category:categories(name)
    `)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(50)

  const rssItems = (posts || [])
    .map((post) => {
      const pubDate = post.published_at
        ? new Date(post.published_at).toUTCString()
        : new Date().toUTCString()

      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${baseUrl}/blog/${post.slug}</link>
      <guid isPermaLink="true">${baseUrl}/blog/${post.slug}</guid>
      <description><![CDATA[${post.excerpt || ""}]]></description>
      <pubDate>${pubDate}</pubDate>
      ${post.author?.full_name ? `<author>${post.author.full_name}</author>` : ""}
      ${post.category?.name ? `<category>${post.category.name}</category>` : ""}
    </item>`
    })
    .join("")

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Glow Beauty Blog</title>
    <link>${baseUrl}</link>
    <description>Your destination for hair, makeup, skincare and nail inspiration. Expert tips from professional stylists.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/rss.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
