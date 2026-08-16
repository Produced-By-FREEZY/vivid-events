"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  LayoutDashboard,
  FileText,
  Users,
  Receipt,
  Settings,
  PanelLeft,
  ChevronRight,
  User,
  LogOut,
  Package,
  Menu,
  CalendarDays,
  FileImage,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { signOut } from "@/app/portal/actions"
import { LogoLedBars } from "./logo-led-bars"

const navItems = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Quote Builder", href: "/portal/quote-builder", icon: FileText },
  { label: "Catalog", href: "/portal/catalog", icon: Package },
  { label: "Data Sheets", href: "/portal/data-sheet-generator", icon: FileImage },
  { label: "Client List", href: "/portal/client-list", icon: Users },
  { label: "Calendar", href: "/portal/calendar", icon: CalendarDays },
  { label: "Invoices", href: "/portal/invoices", icon: Receipt },
  { label: "Settings", href: "/portal/settings", icon: Settings },
]

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Image
      src="/images/vivid-events-logo.png"
      alt="Vivid Events"
      width={320}
      height={180}
      priority
      className={compact ? "h-8 w-8 object-contain object-center" : "h-10 w-auto object-contain"}
    />
  )
}

function NavLinks({
  activeHref,
  collapsed = false,
  onNavigate,
}: {
  activeHref?: string
  collapsed?: boolean
  onNavigate?: () => void
}) {
  return (
    <nav className="flex-1 space-y-1 p-3">
      {navItems.map((item) => {
        const Icon = item.icon
        const active = item.href === activeHref
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={collapsed ? item.label : undefined}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active ? "bg-[#8c52ff]/15 text-white" : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" style={active ? { color: "#8c52ff" } : undefined} />
            {!collapsed && <span className="truncate">{item.label}</span>}
          </Link>
        )
      })}
    </nav>
  )
}

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const activeItem = navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
  const activeHref = activeItem?.href
  const currentLabel = activeItem?.label ?? "Dashboard"

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Desktop sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-700/50 bg-slate-900/60 transition-[width] duration-300 md:flex`}
      >
        <div className="relative flex h-16 items-center justify-center overflow-hidden border-b-2 border-[#8c52ff]/40 bg-black px-3">
          <LogoLedBars />
          {/* Fade so the logo stays crisp over the animated bars */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          <div className="relative z-10">{collapsed ? <Logo compact /> : <Logo />}</div>
        </div>
        <NavLinks activeHref={activeHref} collapsed={collapsed} />
        <div className="border-t border-slate-700/50 p-3">
          {!collapsed && <p className="px-2 text-[11px] text-slate-600">Vivid Events Staff Portal</p>}
        </div>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-slate-700/50 bg-slate-900/70 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <button
                  className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white md:hidden"
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </button>
              </SheetTrigger>
              <SheetContent
                side="left"
                className="w-72 border-slate-700/50 bg-slate-900 p-0 text-white [&>button]:text-slate-400"
              >
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <div className="relative flex h-16 items-center justify-center overflow-hidden border-b-2 border-[#8c52ff]/40 bg-black px-3">
                  <LogoLedBars />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="relative z-10">
                    <Logo />
                  </div>
                </div>
                <NavLinks activeHref={activeHref} onNavigate={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>

            {/* Desktop collapse */}
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white md:block"
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </button>

            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <span className="hidden text-slate-500 sm:inline">Portal</span>
              <ChevronRight className="hidden h-4 w-4 text-slate-600 sm:inline" />
              <span className="font-medium text-white">{currentLabel}</span>
            </nav>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full p-1 pr-2 text-sm text-slate-300 transition-colors hover:bg-slate-800/60">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white"
                  style={{ background: "linear-gradient(to bottom right, #8c52ff, #6b3acc)" }}
                >
                  <User className="h-4 w-4" />
                </span>
                <span className="hidden sm:inline">Admin</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 border-slate-700 bg-slate-800 text-slate-200">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <DropdownMenuItem
                className="cursor-pointer focus:bg-slate-700 focus:text-white"
                onClick={() => router.push("/portal/settings")}
              >
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer text-red-400 focus:bg-slate-700 focus:text-red-300"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
