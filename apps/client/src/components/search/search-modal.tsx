import { useBoard, searchCards, type SearchHit } from "@doska/core"
import { Modal, ModalContent, ModalTitle } from "@doska/ui-kit"
import { Search } from "lucide-react"
import { useMemo, useState } from "react"
import { useLocation } from "wouter"
import { useRevealCard } from "@/providers/card-reveal/card-reveal-context"
import { routes } from "@/lib/routes"
import { SearchResultRow } from "./search-result-row"

const LIST_ID = "search-results"
const optionId = (index: number) => `search-result-${index}`

interface IProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  boardId: string
}

export function SearchModal({ open, onOpenChange, boardId }: IProps) {
  const [, navigate] = useLocation()
  const { data: board } = useBoard(boardId)
  const reveal = useRevealCard()

  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const [lastQuery, setLastQuery] = useState(query)
  const [wasOpen, setWasOpen] = useState(open)

  if (open !== wasOpen) {
    setWasOpen(open)
    if (open) setQuery("")
  }

  if (query !== lastQuery) {
    setLastQuery(query)
    setActiveIndex(0)
  }

  const trimmed = query.trim()
  const hits = useMemo(
    () =>
      trimmed === "" || !board
        ? []
        : searchCards({
            cards: board.cards,
            columns: board.columns,
            query: trimmed,
          }),
    [board, trimmed]
  )

  function select(hit: SearchHit) {
    onOpenChange(false)
    reveal(hit.card.id)
    navigate(routes.card.to(hit.card.id))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (hits.length === 0) return
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault()
        setActiveIndex((i) => (i + 1) % hits.length)
        break
      case "ArrowUp":
        e.preventDefault()
        setActiveIndex((i) => (i - 1 + hits.length) % hits.length)
        break
      case "Enter":
        e.preventDefault()
        select(hits[activeIndex])
        break
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange}>
      <ModalContent className="md:top-24 md:max-w-xl md:translate-y-0 md:p-0">
        <ModalTitle className="sr-only">Search cards</ModalTitle>
        <div className="flex items-center gap-2 px-3 py-3">
          <Search className="size-4 shrink-0 text-muted-foreground" />
          <input
            value={query}
            autoFocus
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Search cards"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            role="combobox"
            aria-expanded={hits.length > 0}
            aria-controls={LIST_ID}
            aria-activedescendant={
              hits.length > 0 ? optionId(activeIndex) : undefined
            }
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-muted-foreground"
          />
          {trimmed !== "" && (
            <span className="shrink-0 text-xs text-muted-foreground">
              {hits.length === 1 ? "1 result" : `${hits.length} results`}
            </span>
          )}
        </div>
        <div
          id={LIST_ID}
          role="listbox"
          className="max-h-96 overflow-y-auto border-t"
        >
          {trimmed === "" ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Search by title or notes
            </p>
          ) : hits.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              No cards match &ldquo;{trimmed}&rdquo;
            </p>
          ) : (
            hits.map((hit, index) => (
              <SearchResultRow
                key={hit.card.id}
                id={optionId(index)}
                hit={hit}
                active={index === activeIndex}
                onSelect={() => select(hit)}
                onHighlight={() => setActiveIndex(index)}
              />
            ))
          )}
        </div>
      </ModalContent>
    </Modal>
  )
}
