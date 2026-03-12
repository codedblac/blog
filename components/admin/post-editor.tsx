"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import dynamic from "next/dynamic"
import { Save, Eye, Send, Clock, ArrowLeft, Upload, Loader2, X, Palette, ImageIcon } from "lucide-react"

const RichTextEditor = dynamic(() => import("./rich-text-editor"), {
  ssr: false,
  loading: () => (
    <div className="rounded-lg border border-input p-4 min-h-[400px] flex items-center justify-center">
      <Spinner className="h-6 w-6" />
    </div>
  ),
})
import Link from "next/link"
import type { Post, Category, Tag } from "@/lib/types"

const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().optional(),
  content: z.string().optional(),
  featured_image: z.string().optional(),
  category_id: z.string().optional(),
  status: z.enum(["draft", "published", "scheduled"]),
  scheduled_for: z.string().optional(),
  meta_title: z.string().optional(),
  meta_description: z.string().optional(),
  og_image: z.string().optional(),
  is_featured: z.boolean(),
  allow_comments: z.boolean(),
  background_type: z.enum(["image", "gradient", "color"]),
  gradient_start: z.string().optional(),
  gradient_end: z.string().optional(),
  background_color: z.string().optional(),
  text_color: z.string().optional(),
})

type PostFormData = z.infer<typeof postSchema>

interface PostEditorProps {
  post?: Post
  categories: Category[]
  tags: Tag[]
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
}

function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const textContent = content.replace(/<[^>]*>/g, "")
  const words = textContent.split(/\s+/).filter(Boolean).length
  return Math.ceil(words / wordsPerMinute)
}

// Preset gradients for quick selection
const PRESET_GRADIENTS = [
  { name: "Sunset", start: "#ff6b6b", end: "#feca57" },
  { name: "Ocean", start: "#667eea", end: "#764ba2" },
  { name: "Forest", start: "#11998e", end: "#38ef7d" },
  { name: "Berry", start: "#8e2de2", end: "#4a00e0" },
  { name: "Fire", start: "#f12711", end: "#f5af19" },
  { name: "Sky", start: "#00c6fb", end: "#005bea" },
  { name: "Rose", start: "#ee9ca7", end: "#ffdde1" },
  { name: "Midnight", start: "#232526", end: "#414345" },
]

export function PostEditor({ post, categories, tags }: PostEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploadingImage, setIsUploadingImage] = useState(false)
  const [selectedTags, setSelectedTags] = useState<string[]>(
    post?.tags?.map((t) => t.id) || []
  )
  const router = useRouter()
  const featuredImageRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<PostFormData>({
    resolver: zodResolver(postSchema),
    defaultValues: {
      title: post?.title || "",
      slug: post?.slug || "",
      excerpt: post?.excerpt || "",
      content: post?.content || "",
      featured_image: post?.featured_image || "",
      category_id: post?.category_id || "",
      status: post?.status || "draft",
      scheduled_for: post?.scheduled_for || "",
      meta_title: post?.meta_title || "",
      meta_description: post?.meta_description || "",
      og_image: post?.og_image || "",
      is_featured: post?.is_featured || false,
      allow_comments: post?.allow_comments ?? true,
      background_type: post?.background_type || "image",
      gradient_start: post?.gradient_start || "#667eea",
      gradient_end: post?.gradient_end || "#764ba2",
      background_color: post?.background_color || "#1a1a2e",
      text_color: post?.text_color || "#ffffff",
    },
  })

  const title = watch("title")
  const content = watch("content")
  const status = watch("status")
  const backgroundType = watch("background_type")
  const gradientStart = watch("gradient_start")
  const gradientEnd = watch("gradient_end")
  const backgroundColor = watch("background_color")
  const textColor = watch("text_color")

  // Auto-generate slug from title
  useEffect(() => {
    if (!post && title) {
      setValue("slug", slugify(title))
    }
  }, [title, post, setValue])

  const onSubmit = async (data: PostFormData) => {
    setIsSubmitting(true)
    try {
      const supabase = createClient()
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        toast.error("You must be logged in")
        setIsSubmitting(false)
        return
      }

      // Check user profile for permissions
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single()

      if (profileError) {
        // Create profile if it doesn't exist
        const { error: createError } = await supabase
          .from("profiles")
          .insert({
            id: user.id,
            email: user.email,
            role: "admin",
          })
        if (createError) {
          toast.error("Failed to create user profile")
          setIsSubmitting(false)
          return
        }
      }

      const readingTime = calculateReadingTime(data.content || "")
      const publishedAt = data.status === "published" ? new Date().toISOString() : post?.published_at

      const postData = {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || null,
        content: data.content || null,
        featured_image: data.featured_image || null,
        category_id: data.category_id || null,
        status: data.status,
        scheduled_for: data.status === "scheduled" ? data.scheduled_for : null,
        published_at: publishedAt,
        meta_title: data.meta_title || null,
        meta_description: data.meta_description || null,
        og_image: data.og_image || null,
        is_featured: data.is_featured,
        allow_comments: data.allow_comments,
        reading_time: readingTime,
        author_id: post?.author_id || user.id,
        updated_at: new Date().toISOString(),
        // Background styling
        background_type: data.background_type,
        gradient_start: data.background_type === "gradient" ? data.gradient_start : null,
        gradient_end: data.background_type === "gradient" ? data.gradient_end : null,
        background_color: data.background_type === "color" ? data.background_color : null,
        text_color: data.text_color,
      }

      if (post) {
        // Update existing post
        const { error } = await supabase
          .from("posts")
          .update(postData)
          .eq("id", post.id)

        if (error) throw error

        // Update tags
        await supabase.from("post_tags").delete().eq("post_id", post.id)
        if (selectedTags.length > 0) {
          await supabase.from("post_tags").insert(
            selectedTags.map((tagId) => ({ post_id: post.id, tag_id: tagId }))
          )
        }

        toast.success("Post updated successfully")
      } else {
        // Create new post
        const { data: newPost, error } = await supabase
          .from("posts")
          .insert({ ...postData, created_at: new Date().toISOString() })
          .select()
          .single()

        if (error) throw error

        // Add tags
        if (selectedTags.length > 0 && newPost) {
          await supabase.from("post_tags").insert(
            selectedTags.map((tagId) => ({ post_id: newPost.id, tag_id: tagId }))
          )
        }

        toast.success("Post created successfully")
        router.push("/admin/posts")
      }

      router.refresh()
    } catch (error: unknown) {
      console.error("Save post error:", error)
      const errorMessage = error instanceof Error ? error.message : "Failed to save post"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  const handleFeaturedImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploadingImage(true)
    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Upload failed")
      }

      const { url } = await response.json()
      setValue("featured_image", url)
      toast.success("Featured image uploaded successfully")
    } catch (error) {
      console.error("Upload error:", error)
      toast.error(error instanceof Error ? error.message : "Failed to upload image")
    } finally {
      setIsUploadingImage(false)
      if (featuredImageRef.current) {
        featuredImageRef.current.value = ""
      }
    }
  }

  // Get background preview style
  const getBackgroundPreviewStyle = (): React.CSSProperties => {
    if (backgroundType === "gradient") {
      return { background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})` }
    }
    if (backgroundType === "color") {
      return { backgroundColor: backgroundColor }
    }
    return {}
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Top Actions */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/admin/posts" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Posts
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {/* Preview Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" type="button">
                <Eye className="mr-2 h-4 w-4" />
                Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
              <div className="relative min-h-[200px] flex items-end" style={getBackgroundPreviewStyle()}>
                {watch("featured_image") && backgroundType === "image" && (
                  <img
                    src={watch("featured_image")}
                    alt={title || "Featured image"}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="relative z-10 p-6 text-white">
                  <h1 className="font-serif text-3xl font-bold">{title || "Untitled Post"}</h1>
                  {watch("excerpt") && (
                    <p className="mt-2 text-lg opacity-80">{watch("excerpt")}</p>
                  )}
                </div>
              </div>
              <div className="p-6">
                <div 
                  className="prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: content || "<p>No content yet...</p>" }}
                />
              </div>
            </DialogContent>
          </Dialog>

          {post?.status === "published" && (
            <Button variant="outline" asChild>
              <Link href={`/blog/${post.slug}`} target="_blank" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                View Live
              </Link>
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter post title"
                    className="text-lg font-medium"
                    {...register("title")}
                  />
                  {errors.title && (
                    <p className="text-sm text-destructive">{errors.title.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="post-url-slug"
                    {...register("slug")}
                  />
                  {errors.slug && (
                    <p className="text-sm text-destructive">{errors.slug.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Brief description of the post..."
                    rows={3}
                    {...register("excerpt")}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={content || ""}
                onChange={(html) => setValue("content", html)}
              />
            </CardContent>
          </Card>

          {/* SEO Settings */}
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  placeholder="SEO title (defaults to post title)"
                  {...register("meta_title")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  placeholder="SEO description for search engines..."
                  rows={3}
                  {...register("meta_description")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="og_image">Open Graph Image URL</Label>
                <Input
                  id="og_image"
                  placeholder="https://example.com/image.jpg"
                  {...register("og_image")}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publish Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Publish</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={status}
                  onValueChange={(value) => setValue("status", value as "draft" | "published" | "scheduled")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Draft
                      </span>
                    </SelectItem>
                    <SelectItem value="published">
                      <span className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Published
                      </span>
                    </SelectItem>
                    <SelectItem value="scheduled">
                      <span className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Scheduled
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {status === "scheduled" && (
                <div className="space-y-2">
                  <Label htmlFor="scheduled_for">Schedule For</Label>
                  <Input
                    id="scheduled_for"
                    type="datetime-local"
                    {...register("scheduled_for")}
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <Label htmlFor="is_featured">Featured Post</Label>
                <Switch
                  id="is_featured"
                  checked={watch("is_featured")}
                  onCheckedChange={(checked) => setValue("is_featured", checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="allow_comments">Allow Comments</Label>
                <Switch
                  id="allow_comments"
                  checked={watch("allow_comments")}
                  onCheckedChange={(checked) => setValue("allow_comments", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Background Styling */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Header Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Background Type Selector */}
              <div className="space-y-2">
                <Label>Background Type</Label>
                <Select
                  value={backgroundType}
                  onValueChange={(value) => setValue("background_type", value as "image" | "gradient" | "color")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="image">
                      <span className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Featured Image
                      </span>
                    </SelectItem>
                    <SelectItem value="gradient">
                      <span className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Gradient
                      </span>
                    </SelectItem>
                    <SelectItem value="color">
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 rounded-full bg-current" />
                        Solid Color
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Preview */}
              <div 
                className="aspect-video rounded-lg overflow-hidden flex items-end"
                style={getBackgroundPreviewStyle()}
              >
                {backgroundType === "image" && watch("featured_image") && (
                  <img 
                    src={watch("featured_image")} 
                    alt="Preview" 
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                )}
                <div className="relative w-full bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-sm font-medium" style={{ color: textColor }}>
                    Preview Title
                  </p>
                </div>
              </div>

              {/* Gradient Options */}
              {backgroundType === "gradient" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Preset Gradients</Label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRESET_GRADIENTS.map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          className="aspect-square rounded-lg border-2 border-transparent hover:border-primary transition-colors"
                          style={{ background: `linear-gradient(135deg, ${preset.start}, ${preset.end})` }}
                          onClick={() => {
                            setValue("gradient_start", preset.start)
                            setValue("gradient_end", preset.end)
                          }}
                          title={preset.name}
                        />
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Start Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={gradientStart || "#667eea"}
                          onChange={(e) => setValue("gradient_start", e.target.value)}
                          className="h-9 w-12 cursor-pointer rounded border border-input"
                        />
                        <Input
                          value={gradientStart || "#667eea"}
                          onChange={(e) => setValue("gradient_start", e.target.value)}
                          className="flex-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">End Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          value={gradientEnd || "#764ba2"}
                          onChange={(e) => setValue("gradient_end", e.target.value)}
                          className="h-9 w-12 cursor-pointer rounded border border-input"
                        />
                        <Input
                          value={gradientEnd || "#764ba2"}
                          onChange={(e) => setValue("gradient_end", e.target.value)}
                          className="flex-1 font-mono text-xs"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Solid Color Options */}
              {backgroundType === "color" && (
                <div className="space-y-2">
                  <Label className="text-xs">Background Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={backgroundColor || "#1a1a2e"}
                      onChange={(e) => setValue("background_color", e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-input"
                    />
                    <Input
                      value={backgroundColor || "#1a1a2e"}
                      onChange={(e) => setValue("background_color", e.target.value)}
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Text Color (for gradient and color backgrounds) */}
              {(backgroundType === "gradient" || backgroundType === "color") && (
                <div className="space-y-2">
                  <Label className="text-xs">Text Color</Label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={textColor || "#ffffff"}
                      onChange={(e) => setValue("text_color", e.target.value)}
                      className="h-9 w-12 cursor-pointer rounded border border-input"
                    />
                    <Input
                      value={textColor || "#ffffff"}
                      onChange={(e) => setValue("text_color", e.target.value)}
                      className="flex-1 font-mono text-xs"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Category */}
          <Card>
            <CardHeader>
              <CardTitle>Category</CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={watch("category_id") || ""}
                onValueChange={(value) => setValue("category_id", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle>Tags</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Button
                    key={tag.id}
                    type="button"
                    variant={selectedTags.includes(tag.id) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Featured Image */}
          <Card>
            <CardHeader>
              <CardTitle>Featured Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {watch("featured_image") ? (
                <div className="relative aspect-video overflow-hidden rounded-lg border border-border">
                  <img
                    src={watch("featured_image")}
                    alt="Featured"
                    className="h-full w-full object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute right-2 top-2 h-8 w-8"
                    onClick={() => setValue("featured_image", "")}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className="flex aspect-video cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:border-muted-foreground/50 hover:bg-muted"
                  onClick={() => featuredImageRef.current?.click()}
                >
                  {isUploadingImage ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="h-8 w-8 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Click to upload image</span>
                    </>
                  )}
                </div>
              )}
              <input
                ref={featuredImageRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFeaturedImageUpload}
              />
              <div className="text-center text-xs text-muted-foreground">or paste image URL below</div>
              <Input
                placeholder="https://example.com/image.jpg"
                {...register("featured_image")}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </form>
  )
}
