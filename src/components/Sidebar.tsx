"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutGrid,
  MessageSquare,
  Settings,
  Search,
  Plus,
  ChevronLeft,
  Sparkles,
  FolderKanban,
  Users,
  BarChart3,
  HelpCircle,
} from "lucide-react"
import { Button } from "./ui/button"
import { Tooltip } from "./ui/tooltip"

interface SidebarProps {
  collapsed?: boolean
  onCollapsedChange?: (collapsed: boolean) => void
}

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutGrid },
  { name: "Threads", href: "/threads", icon: MessageSquare },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "Team", href: "/team", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
]

const secondaryNavigation = [
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Help", href: "/help", icon: HelpCircle },
]

export function Sidebar({ collapsed = false, onCollapsedChange }: SidebarProps) {
  const pathname = usePathname()

  const NavItem = ({ item }: { item: typeof navigation[0] }) => {
    const isActive = pathname === item.href || 
      (item.href !== "/" && pathname.startsWith(item.href))

    const content = (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:bg-accent",
          isActive
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:text-foreground",
          collapsed && "justify-center px-2"
        )}
      >
        <item.icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.name}</span>}
      </Link>
    )

    if (collapsed) {
      return (
        <Tooltip content={item.name} side="right">
          {content}
        </Tooltip>
      )
    }

    return content
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn(
          "flex h-16 items-center border-b px-4",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Pulse AI
              </span>
            </Link>
          )}
          {collapsed && (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
          )}
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => onCollapsedChange?.(true)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search */}
        {!collapsed && (
          <div className="p-4">
            <Button variant="outline" className="w-full justify-start text-muted-foreground">
              <Search className="mr-2 h-4 w-4" />
              Search...
              <kbd className="pointer-events-none ml-auto inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                ⌘K
              </kbd>
            </Button>
          </div>
        )}

        {/* New Thread Button */}
        <div className={cn("px-4", collapsed && "px-2")}>
          {collapsed ? (
            <Tooltip content="New Thread" side="right">
              <Button variant="gradient" size="icon" className="w-full">
                <Plus className="h-5 w-5" />
              </Button>
            </Tooltip>
          ) : (
            <Button variant="gradient" className="w-full">
              <Plus className="h-4 w-4" />
              New Thread
            </Button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>
        </nav>

        {/* Secondary Navigation */}
        <div className="border-t p-4 space-y-1">
          {secondaryNavigation.map((item) => (
            <NavItem key={item.name} item={item} />
          ))}
        </div>

        {/* Collapse Toggle (when collapsed) */}
        {collapsed && (
          <div className="border-t p-2">
            <Tooltip content="Expand sidebar" side="right">
              <Button
                variant="ghost"
                size="icon"
                className="w-full"
                onClick={() => onCollapsedChange?.(false)}
              >
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </Button>
            </Tooltip>
          </div>
        )}
      </div>
    </aside>
  )
}
