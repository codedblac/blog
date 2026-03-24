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

    const allowedTypes = ['image/jpeg','image/png','image/webp','image/gif','image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const timestamp = Date.now()
    const ext = file.name.split('.').pop()
    const filename = `blog/${timestamp}.${ext}`

    // Upload file to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media')
      .upload(filename, file, { cacheControl: '3600', upsert: false })

    if (uploadError) throw uploadError

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('media')
      .getPublicUrl(filename)

    const publicUrl = urlData.publicUrl

    // Optional: insert into media table for tracking
    const { error: dbError } = await supabase
      .from('media')
      .insert({
        user_id: null, // or set user_id if you have auth
        file_name: file.name,
        file_path: filename,
        file_type: file.type,
        file_size: file.size,
        created_at: new Date().toISOString()
      })

    if (dbError) console.error('DB insert error:', dbError)

    return NextResponse.json({ url: publicUrl })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}