import { useDashboards } from "./queries"

export function useTagColors(deckId: string): Record<string, string> {
  const { data: dashboards } = useDashboards()
  return dashboards?.find((d) => d.id === deckId)?.tagColors ?? {}
}
