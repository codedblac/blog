"use server"

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

// Comment validation schema
const commentSchema = z.object({
  post_id: z.string().uuid(),
  author_name: z.string().min(2).max(100),
  author_email: z.string().email(),
  content: z.string().min(10).max(2000),
  parent_id: z.string().uuid().optional(),
})

// ==============================
// GET: fetch all comments for a post
// ==============================
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("postId")

  if (!postId) {
    return NextResponse.json({ error: "Post ID required" }, { status: 400 })
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", postId)
    // 🔹 Remove "approved" filter → show all comments
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}

// ==============================
// POST: add a new comment (auto-approved)
// ==============================
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validatedData = commentSchema.parse(body)

    const supabase = await createClient()

    const { data, error } = await supabase
      .from("comments")
      .insert({
        ...validatedData,
        // ✅ Auto-publish comment immediately
        status: "approved",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors }, { status: 400 })
    }
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}