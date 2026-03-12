import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Eye, MessageSquare, Users, TrendingUp, Clock } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import type { Post } from "@/lib/types"

async function getStats() {
  const supabase = await createClient()

  const [
    { count: totalPosts },
    { count: publishedPosts },
    { count: draftPosts },
    { count: totalComments },
    { count: pendingComments },
    { data: totalViews },
  ] = await Promise.all([
    supabase.from("posts").select("*", { count: "exact", head: true }),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("posts").select("*", { count: "exact", head: true }).eq("status", "draft"),
    supabase.from("comments").select("*", { count: "exact", head: true }),
    supabase.from("comments").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("posts").select("view_count"),
  ])

  const views = totalViews?.reduce((acc, post) => acc + (post.view_count || 0), 0) || 0

  return {
    totalPosts: totalPosts || 0,
    publishedPosts: publishedPosts || 0,
    draftPosts: draftPosts || 0,
    totalComments: totalComments || 0,
    pendingComments: pendingComments || 0,
    totalViews: views,
  }
}

async function getRecentPosts(): Promise<Post[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(*),
      category:categories(*)
    `)
    .order("created_at", { ascending: false })
    .limit(5)

  return (data || []) as Post[]
}

export default async function AdminDashboardPage() {
  const [stats, recentPosts] = await Promise.all([getStats(), getRecentPosts()])

  const statCards = [
    { title: "Total Posts", value: stats.totalPosts, icon: FileText, color: "text-blue-500" },
    { title: "Published", value: stats.publishedPosts, icon: TrendingUp, color: "text-green-500" },
    { title: "Drafts", value: stats.draftPosts, icon: Clock, color: "text-yellow-500" },
    { title: "Total Views", value: stats.totalViews, icon: Eye, color: "text-primary" },
    { title: "Comments", value: stats.totalComments, icon: MessageSquare, color: "text-pink-500" },
    { title: "Pending", value: stats.pendingComments, icon: Users, color: "text-orange-500" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here&apos;s an overview of your blog.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value.toLocaleString()}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Posts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Posts</CardTitle>
          <Link href="/admin/posts" className="text-sm text-primary hover:underline">
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {recentPosts.length > 0 ? (
            <div className="space-y-4">
              {recentPosts.map((post) => (
                <div
                  key={post.id}
                  className="flex items-center justify-between rounded-lg border border-border p-4"
                >
                  <div className="flex-1">
                    <Link
                      href={`/admin/posts/${post.id}`}
                      className="font-medium text-foreground hover:text-primary"
                    >
                      {post.title}
                    </Link>
                    <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
                      {post.category && <span>{post.category.name}</span>}
                      <span>{format(new Date(post.created_at), "MMM d, yyyy")}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-medium ${
                        post.status === "published"
                          ? "bg-green-100 text-green-700"
                          : post.status === "draft"
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground">No posts yet. Create your first post!</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
