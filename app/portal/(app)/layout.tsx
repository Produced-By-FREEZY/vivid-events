import type React from "react"
import { PortalShell } from "../portal-shell"

export default function PortalAppLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell>{children}</PortalShell>
}
