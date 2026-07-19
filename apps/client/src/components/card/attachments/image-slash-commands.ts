import { toAttachmentSrc, type SlashCommand } from "@doska/markdown"
import type { Attachment } from "@/lib/types"
import { isRenderableImage } from "./renderable-image"

/** Slash commands inserting the card's renderable image attachments as Markdown refs. */
export function imageSlashCommands(attachments: Attachment[]): SlashCommand[] {
  return attachments
    .filter((a) => isRenderableImage(a.mime))
    .map((a) => ({
      id: `attachment-${a.key}`,
      title: a.name,
      hint: "Insert image",
      keywords: ["image", "img", "gif", "photo", "attachment"],
      scope: "inline",
      insert: `![${a.name}](${toAttachmentSrc(a.key)})`,
    }))
}
