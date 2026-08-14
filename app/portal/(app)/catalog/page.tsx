import { getAllServiceItems } from "@/app/portal/quote-actions"
import { CatalogClient } from "./catalog-client"

export const dynamic = "force-dynamic"

export default async function CatalogPage() {
  const items = await getAllServiceItems()
  return <CatalogClient items={items} />
}
