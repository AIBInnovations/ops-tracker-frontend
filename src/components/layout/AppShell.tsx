import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { CommandPalette } from './CommandPalette'
import { MobileNav } from './MobileNav'
import { applyTheme, useUiStore } from '@/store/useUiStore'

export function AppShell({ children }: { children: ReactNode }) {
  const theme = useUiStore((s) => s.theme)
  const { pathname } = useLocation()

  // Storing the route the nav was opened on lets navigation close it without
  // an effect — following a link changes `pathname`, so `open` derives false.
  const [navOpenedAt, setNavOpenedAt] = useState<string | null>(null)
  const mobileNavOpen = navOpenedAt === pathname

  // The stored theme has to reach <html> before any token resolves.
  useEffect(() => applyTheme(theme), [theme])

  return (
    // Header spans the full width; the icon rail and the content sit beneath it.
    // `w-full` rather than `w-screen` — `100vw` includes the scrollbar gutter.
    <div className="flex h-screen w-full flex-col overflow-hidden bg-app">
      <Topbar onOpenMobileNav={() => setNavOpenedAt(pathname)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="flex min-h-0 min-w-0 flex-1 flex-col">{children}</main>
      </div>
      <MobileNav open={mobileNavOpen} onClose={() => setNavOpenedAt(null)} />
      <CommandPalette />
    </div>
  )
}
