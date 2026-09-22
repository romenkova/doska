/**
 * Every route in `app/`, named once. The same file is addressed two ways:
 * `router` takes the path (`/board/reorder`), while `Stack.Screen` and
 * `Drawer.Screen` take the file name relative to their own layout
 * (`board/reorder`, or `index` for the drawer's own board screen).
 */
export const ROUTES = {
  board: "/",
  upcoming: "/upcoming",
  trash: "/trash",
  signIn: "/sign-in",
  search: "/search",
  boardActions: "/board/actions",
  boardReorder: "/board/reorder",
  boardDelete: "/board/delete",
  boardFolder: "/board/folder",
  boardSort: "/board/sort",
  boardDoneColumn: (id: string) => `/board/${id}/done-column` as const,
  folderNew: "/folder/new",
  folderActions: (id: string) => `/folder/${id}/actions` as const,
  folderRename: (id: string) => `/folder/${id}/rename` as const,
  columnNew: "/column/new",
  columnActions: (id: string) => `/column/${id}/actions` as const,
  columnDelete: (id: string) => `/column/${id}/delete` as const,
  card: (id: string) => `/card/${id}` as const,
  cardActions: (id: string) => `/card/${id}/actions` as const,
  cardDeadline: (id: string) => `/card/${id}/deadline` as const,
  cardPriority: (id: string) => `/card/${id}/priority` as const,
  cardMove: (id: string) => `/card/${id}/move` as const,
  cardDelete: (id: string) => `/card/${id}/delete` as const,
} as const

export const SCREENS = {
  drawer: "(drawer)",
  board: "index",
  upcoming: "upcoming",
  trash: "trash",
  signIn: "sign-in",
  search: "search",
  boardActions: "board/actions",
  boardReorder: "board/reorder",
  boardDelete: "board/delete",
  boardFolder: "board/folder",
  boardSort: "board/sort",
  boardDoneColumn: "board/[id]/done-column",
  folderNew: "folder/new",
  folderActions: "folder/[id]/actions",
  folderRename: "folder/[id]/rename",
  columnNew: "column/new",
  columnActions: "column/[id]/actions",
  columnDelete: "column/[id]/delete",
  card: "card/[id]/index",
  cardActions: "card/[id]/actions",
  cardDeadline: "card/[id]/deadline",
  cardPriority: "card/[id]/priority",
  cardMove: "card/[id]/move",
  cardDelete: "card/[id]/delete",
} as const
