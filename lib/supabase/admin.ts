import "server-only"
import { createClient } from "@supabase/supabase-js"

/**
 * Service-role client — SERVER ONLY. Bypasses RLS, so never import this into
 * client components. Used for trusted server actions such as saving public
 * booking submissions.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase is not configured. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to enable booking submissions.",
    )
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
