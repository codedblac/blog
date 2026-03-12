"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FileText,
  FolderOpen,
  Tags,
  Image,
  MessageSquare,
  Users,
  Settings,
  Search,
} from "lucide-react"

interface AdminSidebarProps {
  userRole: string
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard, roles: ["admin", "editor", "author"] },
  { name: "Posts", href: "/admin/posts", icon: FileText, roles: ["admin", "editor", "author"] },
  { name: "Categories", href: "/admin/categories", icon: FolderOpen, roles: ["admin", "editor"] },
  { name: "Tags", href: "/admin/tags", icon: Tags, roles: ["admin", "editor", "author"] },
  { name: "Media", href: "/admin/media", icon: Image, roles: ["admin", "editor", "author"] },
  { name: "Comments", href: "/admin/comments", icon: MessageSquare, roles: ["admin", "editor"] },
  { name: "Users", href: "/admin/users", icon: Users, roles: ["admin"] },
  { name: "SEO", href: "/admin/seo", icon: Search, roles: ["admin", "editor"] },
  { name: "Settings", href: "/admin/settings", icon: Settings, roles: ["admin"] },
]

export function AdminSidebar({ userRole }: AdminSidebarProps) {
  const pathname = usePathname()

  const filteredNavigation = navigation.filter((item) =>
    item.roles.includes(userRole)
  )

  return (
    <aside className="hidden w-64 flex-shrink-0 border-r border-border bg-card lg:block">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="font-serif text-xl font-bold text-primary">Glow</span>
            <span className="text-xs text-muted-foreground">Admin</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href || 
              (item.href !== "/admin" && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            View Site
          </Link>
        </div>
      </div>
    </aside>
  )
}
