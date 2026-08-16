import { listDataSheets } from "@/app/portal/data-sheet-actions"
import { DataSheetClient } from "./data-sheet-client"

export const metadata = {
  title: "Data Sheet Generator | Vivid Events Portal",
  description: "Generate professional, branded PDF brochures for your rentals and products.",
}

export default async function DataSheetGeneratorPage() {
  const saved = await listDataSheets()
  return <DataSheetClient initialSaved={saved} />
}
