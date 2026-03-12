"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"

interface Settings {
  site_name: string
  site_description: string
  posts_per_page: number
  allow_comments: boolean
  social_links: {
    instagram: string
    pinterest: string
    youtube: string
    tiktok: string
  }
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    site_name: "Glow Beauty Blog",
    site_description: "Your destination for hair, makeup, skincare and nail inspiration",
    posts_per_page: 12,
    allow_comments: true,
    social_links: {
      instagram: "",
      pinterest: "",
      youtube: "",
      tiktok: "",
    },
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    const supabase = createClient()
    const { data } = await supabase
      .from("site_settings")
      .select("key, value")

    if (data) {
      const newSettings = { ...settings }
      data.forEach((item) => {
        if (item.key === "site_name") newSettings.site_name = item.value as string
        if (item.key === "site_description") newSettings.site_description = item.value as string
        if (item.key === "posts_per_page") newSettings.posts_per_page = item.value as number
        if (item.key === "allow_comments") newSettings.allow_comments = item.value as boolean
        if (item.key === "social_links") newSettings.social_links = item.value as Settings["social_links"]
      })
      setSettings(newSettings)
    }
    setIsLoading(false)
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const supabase = createClient()
      
      const updates = [
        { key: "site_name", value: settings.site_name },
        { key: "site_description", value: settings.site_description },
        { key: "posts_per_page", value: settings.posts_per_page },
        { key: "allow_comments", value: settings.allow_comments },
        { key: "social_links", value: settings.social_links },
      ]

      for (const { key, value } of updates) {
        await supabase
          .from("site_settings")
          .upsert({
            key,
            value,
            updated_at: new Date().toISOString(),
          }, {
            onConflict: "key",
          })
      }

      toast.success("Settings saved successfully")
      router.refresh()
    } catch {
      toast.error("Failed to save settings")
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Spinner className="h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your blog settings</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : null}
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
            <CardDescription>Basic site information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="site_name">Site Name</Label>
              <Input
                id="site_name"
                value={settings.site_name}
                onChange={(e) => setSettings({ ...settings, site_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="site_description">Site Description</Label>
              <Textarea
                id="site_description"
                value={settings.site_description}
                onChange={(e) => setSettings({ ...settings, site_description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="posts_per_page">Posts Per Page</Label>
              <Input
                id="posts_per_page"
                type="number"
                min={1}
                max={50}
                value={settings.posts_per_page}
                onChange={(e) => setSettings({ ...settings, posts_per_page: parseInt(e.target.value) || 12 })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Comments Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Comments</CardTitle>
            <CardDescription>Comment system settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow_comments">Allow Comments</Label>
                <p className="text-sm text-muted-foreground">
                  Enable comments on new posts by default
                </p>
              </div>
              <Switch
                id="allow_comments"
                checked={settings.allow_comments}
                onCheckedChange={(checked) => setSettings({ ...settings, allow_comments: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Connect your social media profiles</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                placeholder="https://instagram.com/yourusername"
                value={settings.social_links.instagram}
                onChange={(e) => setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, instagram: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pinterest">Pinterest</Label>
              <Input
                id="pinterest"
                placeholder="https://pinterest.com/yourusername"
                value={settings.social_links.pinterest}
                onChange={(e) => setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, pinterest: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                placeholder="https://youtube.com/@yourchannel"
                value={settings.social_links.youtube}
                onChange={(e) => setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, youtube: e.target.value }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                placeholder="https://tiktok.com/@yourusername"
                value={settings.social_links.tiktok}
                onChange={(e) => setSettings({
                  ...settings,
                  social_links: { ...settings.social_links, tiktok: e.target.value }
                })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
