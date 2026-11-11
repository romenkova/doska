import type { Dashboard } from "@doska/contract"
import { describe, expect, it } from "vitest"
import { folderTree } from "../src/tools/folders"

const dashboard = (id: string, position: string): Dashboard => ({
  id,
  title: id,
  position,
  sort: [],
  tagColors: {},
  template: false,
  updatedAt: 0,
  deletedAt: null,
})

const dashboards = [
  dashboard("board-a", "a0"),
  dashboard("board-b", "a1"),
  dashboard("board-c", "a2"),
  dashboard("board-d", "a3"),
]

describe("folderTree", () => {
  it("nests subfolders and keeps sidebar order", () => {
    const tree = folderTree(
      [
        { type: "board", id: "board-c" },
        { type: "folder", id: "f-1", title: "Work", boardIds: ["board-b"] },
        {
          type: "folder",
          id: "f-2",
          title: "Clients",
          parentId: "f-1",
          boardIds: ["board-a", "board-gone"],
        },
      ],
      dashboards
    )

    expect(tree).toEqual([
      { type: "board", id: "board-c", title: "board-c" },
      {
        type: "folder",
        id: "f-1",
        title: "Work",
        folders: [
          {
            type: "folder",
            id: "f-2",
            title: "Clients",
            folders: [],
            boards: [{ type: "board", id: "board-a", title: "board-a" }],
          },
        ],
        boards: [{ type: "board", id: "board-b", title: "board-b" }],
      },
      { type: "board", id: "board-d", title: "board-d" },
    ])
  })

  it("lists every board at the root when nothing was ever arranged", () => {
    expect(folderTree([], dashboards).map((node) => node.id)).toEqual([
      "board-a",
      "board-b",
      "board-c",
      "board-d",
    ])
  })

  it("puts a folder with a missing parent, or in a cycle, at the root", () => {
    const tree = folderTree(
      [
        {
          type: "folder",
          id: "f-orphan",
          title: "O",
          parentId: "f-gone",
          boardIds: [],
        },
        {
          type: "folder",
          id: "f-x",
          title: "X",
          parentId: "f-y",
          boardIds: [],
        },
        {
          type: "folder",
          id: "f-y",
          title: "Y",
          parentId: "f-x",
          boardIds: [],
        },
      ],
      []
    )

    expect(tree.map((node) => node.id)).toEqual(["f-orphan", "f-x"])
    expect(tree[1]).toMatchObject({ folders: [{ id: "f-y", folders: [] }] })
  })
})
