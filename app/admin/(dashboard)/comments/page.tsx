"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { X, MoreHorizontal, Trash2 } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import type { Comment, Post } from "@/lib/types"

interface CommentWithPost extends Comment {
  post: Post
}

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentWithPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchComments()
  }, [])

  // -------------------------
  // Fetch all comments
  // -------------------------
  async function fetchComments() {
    setIsLoading(true)
    const supabase = createClient()

    const { data, error } = await supabase
      .from("comments")
      .select(`*, post:posts(id, title, slug)`)
      .order("created_at", { ascending: false })

    if (error) {
      toast.error("Failed to fetch comments")
      setIsLoading(false)
      return
    }

    setComments((data || []) as CommentWithPost[])
    setIsLoading(false)
  }

  // -------------------------
  // Mark a comment as spam
  // -------------------------
  const markAsSpam = async (id: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("comments")
        .update({ status: "spam", updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error

      toast.success("Comment marked as spam")
      fetchComments()
      router.refresh()
    } catch {
      toast.error("Failed to update comment")
    }
  }

  // -------------------------
  // Delete a comment
  // -------------------------
  const deleteComment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("comments").delete().eq("id", id)
      if (error) throw error

      toast.success("Comment removed")
      fetchComments()
      router.refresh()
    } catch {
      toast.error("Failed to delete comment")
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comments</h1>
        <p className="text-muted-foreground">
          Comments are posted automatically. Remove or flag any inappropriate ones.
        </p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Author</TableHead>
                <TableHead>Comment</TableHead>
                <TableHead>Post</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : comments.length > 0 ? (
                comments.map((comment) => (
                  <TableRow key={comment.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {comment.author_name || "Anonymous"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {comment.author_email}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <p className="line-clamp-2 text-sm">{comment.content}</p>
                    </TableCell>

                    <TableCell>
                      <Link
                        href={`/blog/${comment.post?.slug}`}
                        className="text-sm text-primary hover:underline"
                        target="_blank"
                      >
                        {comment.post?.title}
                      </Link>
                    </TableCell>

                    <TableCell>
                      <span
                        className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                          comment.status === "spam"
                            ? "bg-red-100 text-red-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {comment.status || "approved"}
                      </span>
                    </TableCell>

                    <TableCell className="text-muted-foreground">
                      {format(new Date(comment.created_at), "MMM d, yyyy")}
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          {comment.status !== "spam" && (
                            <DropdownMenuItem
                              onClick={() => markAsSpam(comment.id)}
                              className="flex items-center gap-2"
                            >
                              <X className="h-4 w-4" />
                              Mark as Spam
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem
                            onClick={() => deleteComment(comment.id)}
                            className="flex items-center gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className="py-12 text-center text-muted-foreground"
                  >
                    No comments found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}