import { MenuItem } from "@doska/ui-kit"
import { CopyPlus, SquareText } from "lucide-react"
import {
  useDuplicateDashboard,
  useDashboards,
  useSetDashboardTemplate,
} from "@doska/core"
import { useDashboardNav } from "@/lib/hooks/use-dashboard-nav"

export function BoardTemplateItems({ boardId }: { boardId: string }) {
  const { data: dashboards = [] } = useDashboards()
  const { mutate: setTemplate } = useSetDashboardTemplate()
  const { mutate: duplicate } = useDuplicateDashboard()
  const { selectDashboard } = useDashboardNav()

  const dashboard = dashboards.find((d) => d.id === boardId)
  if (!dashboard) return null

  return (
    <>
      <MenuItem
        onClick={() =>
          setTemplate({ id: boardId, template: !dashboard.template })
        }
      >
        <SquareText />
        {dashboard.template ? "Remove from templates" : "Add to templates"}
      </MenuItem>
      <MenuItem
        onClick={() =>
          duplicate(dashboard, {
            onSuccess: (created) => selectDashboard(created.id),
          })
        }
      >
        <CopyPlus />
        Duplicate
      </MenuItem>
    </>
  )
}
