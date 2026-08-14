"use client"

import type React from "react"
import { useState } from "react"
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
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "@/app/portal/actions"

const navItems = [
  { label: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard },
  { label: "Quote Builder", href: "/portal/quote-builder", icon: FileText },
  { label: "Client List", href: "/portal/client-list", icon: Users },
  { label: "Invoices", href: "/portal/invoices", icon: Receipt },
  { label: "Settings", href: "/portal/settings", icon: Settings },
]

export function PortalShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const activeItem = navItems.find((item) => pathname === item.href || pathname.startsWith(item.href + "/"))
  const currentLabel = activeItem?.label ?? "Dashboard"

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Sidebar */}
      <aside
        className={`${
          collapsed ? "w-16" : "w-64"
        } sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-700/50 bg-slate-900/60 transition-[width] duration-300 md:flex`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-700/50 px-4">
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: "linear-gradient(to bottom right, #8c52ff, #6b3acc)" }}
          >
            V
          </div>
          {!collapsed && <span className="truncate font-semibold">Vivid Events</span>}
        </div>

        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = item === activeItem
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  active
                    ? "bg-[#8c52ff]/15 text-white"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                }`}
              >
                <Icon
                  className="h-5 w-5 shrink-0"
                  style={active ? { color: "#8c52ff" } : undefined}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between gap-4 border-b border-slate-700/50 bg-slate-900/70 px-4 backdrop-blur-sm sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800/60 hover:text-white"
              aria-label="Toggle sidebar"
            >
              <PanelLeft className="h-5 w-5" />
            </button>
            <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Portal</span>
              <ChevronRight className="h-4 w-4 text-slate-600" />
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

        {/* Blank content slate */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
