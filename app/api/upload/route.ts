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

    const { data, error } = await supabase.storage
      .from('media')
      .upload(filename, file)

    if (error) throw error

    const { data: url } = supabase.storage
      .from('media')
      .getPublicUrl(filename)

    return NextResponse.json({ url: url.publicUrl })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}