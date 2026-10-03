import { MenuContent, MenuItem, MenuSub, MenuSubTrigger } from "@doska/ui-kit"
import { SORT_MODES, type SortKey } from "@doska/core"
import { CalendarClock, Check, Flag, ListFilter } from "lucide-react"

const ICONS: Record<SortKey, typeof Flag> = {
  priority: Flag,
  deadline: CalendarClock,
}

interface IProps {
  sort: string[]
  onChangeSort: (sort: string[]) => void
}

/** The board's card ordering: any mix of the keys, or none for manual order. */
export function SortSub({ sort, onChangeSort }: IProps) {
  function toggleSort(key: string) {
    if (sort.includes(key)) onChangeSort(sort.filter((k) => k !== key))
    else onChangeSort([...sort, key])
  }

  return (
    <MenuSub>
      <MenuSubTrigger>
        <ListFilter />
        Sort cards
      </MenuSubTrigger>
      <MenuContent align="start" sideOffset={2}>
        {SORT_MODES.map(({ id, label }) => {
          const Icon = ICONS[id]
          return (
            <MenuItem
              key={id}
              closeOnClick={false}
              onClick={() => toggleSort(id)}
            >
              <Icon />
              Sort by {label.toLowerCase()}
              {sort.includes(id) && <Check className="ml-auto" />}
            </MenuItem>
          )
        })}
      </MenuContent>
    </MenuSub>
  )
}
