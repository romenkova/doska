import { Button } from "@doska/ui-kit"
import { FaGithub } from "react-icons/fa"

/** Sidebar entry linking to the project repository. */
export function GitHubButton() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="justify-start gap-2"
      render={
        <a
          href="https://github.com/romenkova/doska"
          target="_blank"
          rel="noreferrer"
        />
      }
    >
      <FaGithub className="size-4" />
      <span>GitHub</span>
    </Button>
  )
}
