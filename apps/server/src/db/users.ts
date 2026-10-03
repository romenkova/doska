import type { DirectoryUser } from "@doska/contract"
import { asc, sql } from "drizzle-orm"
import { db } from "./client"
import { user } from "./schema"

export function listUsers(): Promise<DirectoryUser[]> {
  return db
    .select({
      id: user.id,
      username: sql<string>`coalesce(${user.username}, ${user.name})`,
      image: user.image,
    })
    .from(user)
    .where(sql`${user.banned} is not true`)
    .orderBy(asc(user.createdAt))
}
