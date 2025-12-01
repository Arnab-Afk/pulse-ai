"use client"

import { LucideIcon, FolderOpen, MessageSquare, Search } from "lucide-react"
import { Button } from "./ui/button"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="rounded-full bg-muted p-4 mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action && (
        <Button variant="gradient" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}

export function NoSearchResults({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find any threads matching "${query}". Try adjusting your search.`}
    />
  )
}

export function NoThreads({ onCreateThread }: { onCreateThread: () => void }) {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No threads yet"
      description="Create your first thread to start organizing your conversations and tracking context."
      action={{
        label: "Create Thread",
        onClick: onCreateThread,
      }}
    />
  )
}
