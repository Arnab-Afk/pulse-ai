"use client"

import { Bell, Search } from "lucide-react"
import { Button } from "./ui/button"
import { Input } from "./ui/input"
import { Avatar } from "./ui/avatar"
import { ThemeToggle } from "./ThemeToggle"
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  DropdownLabel,
} from "./ui/dropdown"

interface HeaderProps {
  sidebarCollapsed?: boolean
}

export function Header({ sidebarCollapsed = false }: HeaderProps) {
  return (
    <header
      className="fixed top-0 right-0 z-30 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6"
      style={{ left: sidebarCollapsed ? "4rem" : "16rem" }}
    >
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search threads, projects, people..."
            className="pl-10 bg-muted/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <ThemeToggle />
        
        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
                3
              </span>
            </Button>
          </DropdownTrigger>
          <DropdownContent align="end" className="w-80">
            <DropdownLabel>Notifications</DropdownLabel>
            <DropdownSeparator />
            <div className="max-h-[300px] overflow-y-auto">
              <DropdownItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">New comment on Atlas Project</span>
                <span className="text-xs text-muted-foreground">Sarah mentioned you in a thread • 2m ago</span>
              </DropdownItem>
              <DropdownItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">Action item completed</span>
                <span className="text-xs text-muted-foreground">Mike completed &quot;Review API docs&quot; • 1h ago</span>
              </DropdownItem>
              <DropdownItem className="flex flex-col items-start gap-1 py-3">
                <span className="font-medium">Thread going stale</span>
                <span className="text-xs text-muted-foreground">Website Redesign needs attention • 3h ago</span>
              </DropdownItem>
            </div>
            <DropdownSeparator />
            <DropdownItem className="justify-center text-sm font-medium text-violet-600">
              View all notifications
            </DropdownItem>
          </DropdownContent>
        </Dropdown>

        <Dropdown>
          <DropdownTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar
                src="https://i.pravatar.cc/150?u=me"
                alt="Your avatar"
                fallback="ME"
                size="sm"
              />
              <span className="hidden md:inline-block font-medium">You</span>
            </Button>
          </DropdownTrigger>
          <DropdownContent align="end" className="w-56">
            <DropdownLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">You</p>
                <p className="text-xs text-muted-foreground">me@pulse.ai</p>
              </div>
            </DropdownLabel>
            <DropdownSeparator />
            <DropdownItem>Profile</DropdownItem>
            <DropdownItem>Settings</DropdownItem>
            <DropdownItem>Keyboard shortcuts</DropdownItem>
            <DropdownSeparator />
            <DropdownItem className="text-red-600">Log out</DropdownItem>
          </DropdownContent>
        </Dropdown>
      </div>
    </header>
  )
}
