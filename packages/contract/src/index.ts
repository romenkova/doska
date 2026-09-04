import type { z } from "zod"
import type {
  AttachmentSchema,
  CardSchema,
  ChangeSchema,
  ColumnSchema,
  DashboardChangeSchema,
  DashboardSchema,
  DirectoryUserSchema,
  MemberRoleSchema,
  MemberSchema,
  PublicBoardSchema,
  SidebarItemSchema,
  SidebarLayoutSchema,
} from "./schemas"

export * from "./schemas"
export * from "./card-id"
export * from "./retention"
export { contract } from "./contract"

export type Attachment = z.infer<typeof AttachmentSchema>
export type Card = z.infer<typeof CardSchema>
export type Column = z.infer<typeof ColumnSchema>
export type Dashboard = z.infer<typeof DashboardSchema>
export type Change = z.infer<typeof ChangeSchema>
export type DashboardChange = z.infer<typeof DashboardChangeSchema>
export type Member = z.infer<typeof MemberSchema>
export type MemberRole = z.infer<typeof MemberRoleSchema>
export type DirectoryUser = z.infer<typeof DirectoryUserSchema>
export type PublicBoard = z.infer<typeof PublicBoardSchema>
export type SidebarItem = z.infer<typeof SidebarItemSchema>
export type SidebarLayout = z.infer<typeof SidebarLayoutSchema>
