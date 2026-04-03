"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Upload, Trash2, Copy, Check, Image as ImageIcon } from "lucide-react"
import { format } from "date-fns"
import type { Media } from "@/lib/types"

export default function MediaPage() {
  const [media, setMedia] = useState<Media[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState<Media | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchMedia()
  }, [])

  async function fetchMedia() {
    setIsLoading(true)
    const { data } = await supabase
      .from("media")
      .select("*")
      .order("created_at", { ascending: false })
    setMedia((data || []) as Media[])
    setIsLoading(false)
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      toast.error("You must be logged in to upload files")
      setIsUploading(false)
      return
    }

    try {
      for (const file of files) {
        const fileExt = file.name.split(".").pop()
        const fileName = `blog/${Date.now()}-${Math.random().toString(36).substring(2,8)}.${fileExt}`

        // Upload to Supabase storage bucket 'media'
        const { error: uploadError } = await supabase.storage
          .from("media")
          .upload(fileName, file, { cacheControl: "3600", upsert: false })

        if (uploadError) throw uploadError

        // Get public URL
        const { data: urlData } = supabase.storage
          .from("media")
          .getPublicUrl(fileName)

        const publicUrl = urlData.publicUrl

        // Save to media table
        await supabase.from("media").insert({
          user_id: user.id,
          file_name: file.name,
          file_path: publicUrl, // store the public URL
          file_type: file.type,
          file_size: file.size,
          created_at: new Date().toISOString(),
        })
      }

      toast.success("Files uploaded successfully")
      fetchMedia()
    } catch (error) {
      console.error(error)
      toast.error("Failed to upload files")
    } finally {
      setIsUploading(false)
      e.target.value = ""
    }
  }

  const handleDelete = async (item: Media) => {
    if (!confirm("Are you sure you want to delete this file?")) return

    try {
      // Delete from storage
      const fileName = item.file_path.split("/").pop()
      if (fileName) {
        await supabase.storage.from("media").remove([`blog/${fileName}`])
      }

      // Delete from database
      await supabase.from("media").delete().eq("id", item.id)

      toast.success("File deleted")
      setSelectedImage(null)
      fetchMedia()
    } catch {
      toast.error("Failed to delete file")
    }
  }

  const copyUrl = async (url: string, id: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(id)
      toast.success("URL copied to clipboard")
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error("Failed to copy URL")
    }
  }

  const formatFileSize = (bytes: number | null) => {
    if (!bytes) return "Unknown"
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="space-y-6">
      {/* Header & Upload */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Media Library</h1>
          <p className="text-muted-foreground">Manage your uploaded images and files</p>
        </div>
        <div>
          <Input
            type="file"
            id="file-upload"
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleUpload}
            disabled={isUploading}
          />
          <Button asChild disabled={isUploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? "Uploading..." : "Upload"}
            </label>
          </Button>
        </div>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="py-12 text-center text-muted-foreground">Loading...</div>
      ) : media.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {media.map((item) => (
            <Card
              key={item.id}
              className="group cursor-pointer overflow-hidden transition-shadow hover:shadow-lg"
              onClick={() => setSelectedImage(item)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square bg-muted">
                  {item.file_type.startsWith("image/") ? (
                    <img
                      src={item.file_path}
                      alt={item.alt_text || item.file_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                </div>
                <div className="p-2">
                  <p className="truncate text-xs text-muted-foreground">{item.file_name}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">No media uploaded yet.</p>
            <p className="text-sm text-muted-foreground">Upload images to get started.</p>
          </CardContent>
        </Card>
      )}

      {/* Image Detail Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedImage?.file_name}</DialogTitle>
          </DialogHeader>
          {selectedImage && (
            <div className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                <img
                  src={selectedImage.file_path}
                  alt={selectedImage.alt_text || selectedImage.file_name}
                  className="h-full w-full object-contain"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">File Size</p>
                  <p className="font-medium">{formatFileSize(selectedImage.file_size)}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{selectedImage.file_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Uploaded</p>
                  <p className="font-medium">
                    {format(new Date(selectedImage.created_at), "MMM d, yyyy")}
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">URL</p>
                <div className="flex items-center gap-2">
                  <Input
                    value={selectedImage.file_path}
                    readOnly
                    className="flex-1 text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyUrl(selectedImage.file_path, selectedImage.id)}
                  >
                    {copiedId === selectedImage.id ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="destructive"
                  onClick={() => handleDelete(selectedImage)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}