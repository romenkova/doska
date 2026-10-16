import type { ActiveUser, Member, MemberRole } from "@doska/contract"
import { orpc } from "./sync/orpc"

/** A board's roster plus what the account reading it is allowed to do. */
export interface Roster {
  members: Member[]
  viewerRole: MemberRole
}

export function listMembers(boardId: string): Promise<Roster> {
  return orpc.members.list({ boardId })
}

export async function listSharedBoards(): Promise<string[]> {
  const { boardIds } = await orpc.members.sharedBoards()
  return boardIds
}

export function addMember(boardId: string, userId: string): Promise<void> {
  return orpc.members.add({ boardId, userId })
}

export function removeMember(boardId: string, userId: string): Promise<void> {
  return orpc.members.remove({ boardId, userId })
}

export async function listActiveUsers(): Promise<ActiveUser[]> {
  const { users } = await orpc.users.list()
  return users
}
