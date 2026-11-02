// Folder edits live in react-draggable-folders, web only; mobile is on hold.
export type SidebarTarget =
  | { kind: "root"; index: number }
  | { kind: "folder"; folderId: string; index: number }

type Stub<T> = { mutate: (vars: T) => void }

export function useMoveSidebarItem(): Stub<{
  id: string
  target: SidebarTarget
}> {
  return { mutate: () => {} }
}

export function useCreateFolder(): Stub<string> {
  return { mutate: () => {} }
}

export function useRenameFolder(): Stub<{ id: string; title: string }> {
  return { mutate: () => {} }
}

export function useDeleteFolder(): Stub<string> {
  return { mutate: () => {} }
}
