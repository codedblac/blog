"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { format } from "date-fns"
import useSWR from "swr"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { User, MessageSquare } from "lucide-react"
import type { Comment } from "@/lib/types"

const commentSchema = z.object({
  author_name: z.string().min(2, "Name must be at least 2 characters"),
  author_email: z.string().email("Please enter a valid email"),
  content: z.string().min(10, "Comment must be at least 10 characters"),
})

type CommentFormData = z.infer<typeof commentSchema>

interface CommentSectionProps {
  postId: string
}

async function fetcher(url: string) {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export function CommentSection({ postId }: CommentSectionProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { data: comments, mutate } = useSWR<Comment[]>(
    `/api/comments?postId=${postId}`,
    fetcher
  )

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
  })

  const onSubmit = async (data: CommentFormData) => {
    setIsSubmitting(true)
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, post_id: postId }),
      })

      if (!res.ok) throw new Error("Failed to submit comment")

      toast.success("Comment submitted! It will appear after moderation.")
      reset()
      mutate()
    } catch {
      toast.error("Failed to submit comment. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const approvedComments = comments?.filter((c) => c.status === "approved") || []

  return (
    <section className="space-y-8">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-primary" />
        <h2 className="font-serif text-xl font-bold text-foreground">
          Comments ({approvedComments.length})
        </h2>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-xl border border-border bg-card p-6">
        <h3 className="font-medium text-foreground">Leave a Comment</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="author_name">Name</Label>
            <Input
              id="author_name"
              placeholder="Your name"
              {...register("author_name")}
            />
            {errors.author_name && (
              <p className="text-sm text-destructive">{errors.author_name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="author_email">Email</Label>
            <Input
              id="author_email"
              type="email"
              placeholder="your@email.com"
              {...register("author_email")}
            />
            {errors.author_email && (
              <p className="text-sm text-destructive">{errors.author_email.message}</p>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Comment</Label>
          <Textarea
            id="content"
            placeholder="Share your thoughts..."
            rows={4}
            {...register("content")}
          />
          {errors.content && (
            <p className="text-sm text-destructive">{errors.content.message}</p>
          )}
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Submit Comment
        </Button>
      </form>

      {/* Comments List */}
      {approvedComments.length > 0 ? (
        <div className="space-y-6">
          {approvedComments.map((comment) => (
            <div key={comment.id} className="flex gap-4 rounded-xl border border-border bg-card p-5">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-foreground">
                    {comment.author_name || "Anonymous"}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(comment.created_at), "MMM d, yyyy")}
                  </span>
                </div>
                <p className="mt-2 text-muted-foreground">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </section>
  )
}
