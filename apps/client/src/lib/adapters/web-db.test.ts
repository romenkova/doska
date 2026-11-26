import { describe, expect, it } from "vitest"
import { CardSchema, ColumnSchema, DashboardSchema } from "@doska/contract"
import { VERSION } from "./web-db"

describe("web-db", () => {
  // Fields changed: bump VERSION too, or old records never get the new default.
  it("bumps VERSION when a record schema changes", () => {
    expect({
      VERSION,
      cards: Object.keys(CardSchema.shape),
      columns: Object.keys(ColumnSchema.shape),
      dashboards: Object.keys(DashboardSchema.shape),
    }).toMatchInlineSnapshot(`
      {
        "VERSION": 17,
        "cards": [
          "id",
          "title",
          "body",
          "position",
          "columnId",
          "number",
          "deadline",
          "priority",
          "tags",
          "users",
          "attachments",
          "template",
          "archived",
          "updatedAt",
          "deletedAt",
          "stamps",
          "bodyConflict",
        ],
        "columns": [
          "id",
          "title",
          "position",
          "dashboardId",
          "collapsed",
          "color",
          "done",
          "updatedAt",
          "deletedAt",
          "stamps",
        ],
        "dashboards": [
          "id",
          "title",
          "position",
          "sort",
          "tagColors",
          "template",
          "updatedAt",
          "deletedAt",
        ],
      }
    `)
  })
})
