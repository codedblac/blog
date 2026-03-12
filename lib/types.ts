export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'editor' | 'author' | 'subscriber'
  bio: string | null
  created_at: string
  updated_at: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  image_url: string | null
  parent_id: string | null
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface Media {
  id: string
  user_id: string | null
  file_name: string
  file_path: string
  file_type: string
  file_size: number | null
  alt_text: string | null
  caption: string | null
  created_at: string
}

export interface Post {
  id: string
  title: string
  slug: string
  excerpt: string | null
  content: string | null
  featured_image: string | null
  author_id: string | null
  category_id: string | null
  status: 'draft' | 'published' | 'scheduled' | 'archived'
  published_at: string | null
  scheduled_for: string | null
  meta_title: string | null
  meta_description: string | null
  og_image: string | null
  view_count: number
  reading_time: number | null
  is_featured: boolean
  allow_comments: boolean
  created_at: string
  updated_at: string
  // Background styling
  background_type: 'image' | 'gradient' | 'color'
  gradient_start: string | null
  gradient_end: string | null
  background_color: string | null
  text_color: string | null
  // Joined fields
  author?: Profile
  category?: Category
  tags?: Tag[]
}

export interface Comment {
  id: string
  post_id: string
  user_id: string | null
  parent_id: string | null
  author_name: string | null
  author_email: string | null
  content: string
  status: 'pending' | 'approved' | 'spam' | 'trash'
  created_at: string
  updated_at: string
  // Joined fields
  user?: Profile
  replies?: Comment[]
}

export interface SiteSetting {
  id: string
  key: string
  value: unknown
  created_at: string
  updated_at: string
}
