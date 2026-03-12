import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { PostEditor } from "@/components/admin/post-editor"
import type { Post, Tag } from "@/lib/types"

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

async function getPost(id: string): Promise<Post | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("posts")
    .select(`
      *,
      author:profiles(*),
      category:categories(*)
    `)
    .eq("id", id)
    .single()

  if (!data) return null

  // Get tags for this post
  const { data: postTags } = await supabase
    .from("post_tags")
    .select("tag_id, tags(*)")
    .eq("post_id", data.id)

  const tags = postTags?.map((pt) => pt.tags).filter(Boolean) as Tag[] || []

  return { ...data, tags } as Post
}

async function getCategories() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name")
  return data || []
}

async function getTags() {
  const supabase = await createClient()
  const { data } = await supabase
    .from("tags")
    .select("*")
    .order("name")
  return data || []
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params
  const [post, categories, tags] = await Promise.all([
    getPost(id),
    getCategories(),
    getTags(),
  ])

  if (!post) {
    notFound()
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Edit Post</h1>
        <p className="text-muted-foreground">Update your blog post</p>
      </div>
      <PostEditor post={post} categories={categories} tags={tags} />
    </div>
  )
}
