import { useCreateDashboard, setLastBoard } from "@doska/core"
import { Button, EmptyState, Spinner } from "@doska/ui-kit-mobile"
import { ScreenHeader } from "@/components/shell/screen-header"

interface IProps {
  isPending: boolean
}

/** What the board screen shows when there is no board to show — either the
 * boards are still being read, or there are none and this offers the first. */
export function NoBoards({ isPending }: IProps) {
  const { mutate: createDashboard } = useCreateDashboard()

  return (
    <>
      <ScreenHeader />
      {isPending ? (
        <Spinner />
      ) : (
        <EmptyState message="No boards yet.">
          <Button
            label="Add a dashboard"
            onPress={() =>
              createDashboard("Untitled board", {
                onSuccess: (created) => setLastBoard(created.id),
              })
            }
          />
        </EmptyState>
      )}
    </>
  )
}
