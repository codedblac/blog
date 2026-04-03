import { createClient } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Only allow common image types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/svg+xml',
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const filename = `blog/${timestamp}-${Math.random().toString(36).substring(2, 8)}.${ext}`

    // Upload file to 'media' bucket under blog/
    const { error: uploadError } = await supabase.storage
      .from('media')
      .upload(filename, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filename)

    const publicUrl = urlData.publicUrl

    // Get current user if logged in
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Save file info to media table
    const { error: dbError } = await supabase
      .from('media')
      .insert({
        user_id: user?.id || null,
        file_name: file.name,
        file_path: publicUrl, // Save full public URL
        file_type: file.type,
        file_size: file.size,
        created_at: new Date().toISOString(),
      })

    if (dbError) console.error('DB insert error:', dbError)

    return NextResponse.json({ url: publicUrl })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}