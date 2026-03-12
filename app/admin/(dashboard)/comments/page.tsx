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
import { Check, X, MoreHorizontal, Trash2 } from "lucide-react"
import { format } from "date-fns"
import Link from "next/link"
import type { Comment, Post } from "@/lib/types"

interface CommentWithPost extends Comment {
  post: Post
}

export default function CommentsPage() {
  const [comments, setComments] = useState<CommentWithPost[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState<string>("all")
  const router = useRouter()

  useEffect(() => {
    fetchComments()
  }, [filter])

  async function fetchComments() {
    setIsLoading(true)
    const supabase = createClient()
    let query = supabase
      .from("comments")
      .select(`
        *,
        post:posts(id, title, slug)
      `)
      .order("created_at", { ascending: false })

    if (filter !== "all") {
      query = query.eq("status", filter)
    }

    const { data } = await query
    setComments((data || []) as CommentWithPost[])
    setIsLoading(false)
  }

  const updateStatus = async (id: string, status: string) => {
    try {
      const supabase = createClient()
      const { error } = await supabase
        .from("comments")
        .update({ status, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (error) throw error
      toast.success(`Comment ${status}`)
      fetchComments()
      router.refresh()
    } catch {
      toast.error("Failed to update comment")
    }
  }

  const deleteComment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return

    try {
      const supabase = createClient()
      const { error } = await supabase.from("comments").delete().eq("id", id)
      if (error) throw error
      toast.success("Comment deleted")
      fetchComments()
      router.refresh()
    } catch {
      toast.error("Failed to delete comment")
    }
  }

  const filters = [
    { value: "all", label: "All" },
    { value: "pending", label: "Pending" },
    { value: "approved", label: "Approved" },
    { value: "spam", label: "Spam" },
    { value: "trash", label: "Trash" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Comments</h1>
        <p className="text-muted-foreground">Manage and moderate comments</p>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <Button
            key={f.value}
            variant={filter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
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
                        <div className="font-medium">{comment.author_name || "Anonymous"}</div>
                        <div className="text-sm text-muted-foreground">{comment.author_email}</div>
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
                          comment.status === "approved"
                            ? "bg-green-100 text-green-700"
                            : comment.status === "pending"
                            ? "bg-yellow-100 text-yellow-700"
                            : comment.status === "spam"
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {comment.status}
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
                          {comment.status !== "approved" && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(comment.id, "approved")}
                              className="flex items-center gap-2"
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                          )}
                          {comment.status !== "spam" && (
                            <DropdownMenuItem
                              onClick={() => updateStatus(comment.id, "spam")}
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
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
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
