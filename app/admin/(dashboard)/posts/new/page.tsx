import { createClient } from "@/lib/supabase/server"
import { PostEditor } from "@/components/admin/post-editor"

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

export default async function NewPostPage() {
  const [categories, tags] = await Promise.all([getCategories(), getTags()])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Create New Post</h1>
        <p className="text-muted-foreground">Write and publish a new blog post</p>
      </div>
      <PostEditor categories={categories} tags={tags} />
    </div>
  )
}
