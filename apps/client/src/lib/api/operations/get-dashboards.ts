import type { Dashboard } from "@/lib/types"
import { byPosition } from "@/lib/utils"
import { db } from "../db/db"
import { live } from "./live"

/** Every board's metadata, in sidebar order. */
export async function getDashboards(): Promise<Dashboard[]> {
  const list = await db.getDashboards()
  return list.filter(live).sort(byPosition)
}
