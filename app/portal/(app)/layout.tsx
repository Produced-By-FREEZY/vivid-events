import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { PortalShell } from "../portal-shell"

// Server-side guard: every page under (app) is gated here in addition to the
// middleware. If there is no authenticated Supabase user, we bounce to the
// login screen before any portal UI or data is ever rendered.
export default async function PortalAppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/portal/login")
  }

  return <PortalShell>{children}</PortalShell>
}
