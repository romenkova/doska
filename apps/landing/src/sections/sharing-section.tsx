import { DemoBoards } from "../demo-boards"
import { Section } from "./section"

export function SharingSection() {
  return (
    <Section
      title="Shared between multiple people"
      subtitle={
        <>
          <p className="text-muted-foreground">
            Create accounts and share with others, or make a public board.
          </p>
          <p className="text-muted-foreground">
            Admins can create users. Users can have their own boards or become
            members of someone else's board.
          </p>
        </>
      }
    >
      <DemoBoards />
    </Section>
  )
}
