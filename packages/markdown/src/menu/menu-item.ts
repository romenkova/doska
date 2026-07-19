/** The shape `MenuList` renders — slash commands and card refs both satisfy it. */
export interface MenuItem {
  id: string
  title: string
  hint?: string
}
