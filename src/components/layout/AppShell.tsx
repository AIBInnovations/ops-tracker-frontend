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
    <div className="flex h-screen w-screen overflow-hidden bg-app">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMobileNav={() => setNavOpenedAt(pathname)} />
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
      </div>
      <MobileNav open={mobileNavOpen} onClose={() => setNavOpenedAt(null)} />
      <CommandPalette />
    </div>
  )
}
