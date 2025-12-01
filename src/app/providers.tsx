"use client"

import { ThemeProvider } from "@/components/ThemeProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="system" storageKey="pulse-ai-theme">
      {children}
    </ThemeProvider>
  )
}
