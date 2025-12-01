"use client"

import { MessageSquare, AlertTriangle, CheckCircle2, Clock, TrendingUp, TrendingDown } from "lucide-react"
import { Card, CardContent } from "./ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  description: string
  icon: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  className?: string
}

function StatCard({ title, value, description, icon, trend, className }: StatCardProps) {
  return (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="rounded-lg bg-muted p-2.5">
            {icon}
          </div>
        </div>
        {trend && (
          <div className="mt-4 flex items-center gap-1.5">
            {trend.value > 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
            <span className={cn(
              "text-sm font-medium",
              trend.value > 0 ? "text-green-500" : "text-red-500"
            )}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </span>
            <span className="text-xs text-muted-foreground">{trend.label}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface StatsCardsProps {
  stats: {
    activeThreads: number
    unresolvedItems: number
    completedThisWeek: number
    avgResponseTime: string
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Active Threads"
        value={stats.activeThreads}
        description="Currently in progress"
        icon={<MessageSquare className="h-5 w-5 text-violet-600" />}
        trend={{ value: 12, label: "from last week" }}
      />
      <StatCard
        title="Unresolved Items"
        value={stats.unresolvedItems}
        description="Need your attention"
        icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
        trend={{ value: -8, label: "from last week" }}
      />
      <StatCard
        title="Completed"
        value={stats.completedThisWeek}
        description="Resolved this week"
        icon={<CheckCircle2 className="h-5 w-5 text-green-600" />}
        trend={{ value: 24, label: "from last week" }}
      />
      <StatCard
        title="Avg Response"
        value={stats.avgResponseTime}
        description="Thread response time"
        icon={<Clock className="h-5 w-5 text-blue-600" />}
        trend={{ value: -15, label: "faster than usual" }}
      />
    </div>
  )
}
