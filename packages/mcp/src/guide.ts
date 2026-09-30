/**
 * What a client can't infer from the tool schemas: the board's own concepts and
 * the Markdown dialect card bodies are rendered with. Served as the server's
 * `instructions`, so it's in context before the first call.
 */
export const INSTRUCTIONS = `Doska is a kanban board: boards hold columns, columns hold cards.

Ids and references
- Every tool takes opaque ids (board-xxxx, col-xxxx, card-xxxx). They never
  change, so they are the only safe thing to write against.
- A card also carries a number, which exists so one card body can link to
  another as [[12]]. Nothing else addresses a card by it, so reach for it only
  when writing a reference — get_board and search_cards report it as cardId.

Columns
- Column order is left to right; card order is top to bottom.
- One column per board may be the done column (done: true). Cards in it count as
  finished — that is what "mark this done" means, so use set_card_done rather
  than inventing a checkbox or a [done] tag. Marking a column done clears the
  flag from the board's other columns.
- A column may carry a color from a fixed palette (see update_column), and may
  be collapsed, which hides its cards' bodies down to their titles.

Deadlines
- A card's deadline is a plain YYYY-MM-DD date, no time, no timezone.
- The app has an upcoming view across every board: overdue cards first, then
  today, then the next 60 days. list_upcoming returns exactly that set.

Priority
- A card may carry one of high, medium or low, or none at all. Pass null on
  create_card or update_card for none; search_cards filters by it.
- It is an ordering hint, not a deadline: a board can be sorted by priority, and
  nothing expires when one is set.

Tags
- A card's tags are its tags list: tags on create_card or update_card sets it,
  replacing what was there. The board shows and filters by these alone.
- A #tag written in a body is only a link to that tag's filter. It does not tag
  the card.

Card bodies: GitHub-flavored Markdown, plus these
- Task lists (- [ ] / - [x]) are first class: the card shows a done/total count
  and the boxes are clickable. Use check_task to tick one instead of rewriting
  the body.
- [[12]] links to another card, Obsidian style, and picks up that card's
  column color. It shows the card's current title, so prefer this form.
  [[12|Fix the sync bug]] pins the wording instead, and nothing updates it
  when that card is renamed. Ordinary [label](url) links work as normal.
- A line containing only -cut- ends the card's preview: the board card shows
  what is above it, the full body opens in the card view. Put the summary above
  the cut and the detail below it on long cards.
- Attachments are read-only here: get_card and get_board list a card's files,
  and an image embedded as ![alt](attachment:<key>) renders inline, but
  uploading goes through the app, not this server.

Writes sync to every device the account is signed in on, and deletes are
tombstones — they propagate rather than being undone by another device's next
sync. There is no undo, so confirm before deleting a column or a board.`
