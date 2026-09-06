# Changelog

## [Unreleased]

### Added

- Single sign-on for self-hosted servers: any OIDC provider
  (Authentik, Keycloak, Pocket ID, Google). The first sign-in creates the
  account, and an existing password account can connect a provider from its
  account modal.
- Desktop signs in through the browser: press **Sign in in browser**, sign in
  there however you like, and come back.
- Sidebar folders and reorder.
- The sidebar layout is per user and syncs between devices.
- Cmd+V over selected text in the markdown editor wraps it in a link.
- Tooltips on every icon button, using the button's aria label.
- Docs: single sign-on guide, heading anchors.

### Changed

- Packages updated.

## [0.21.0] - 2026-09-01

### Added

- Folder sync on desktop: a board mirrors to a folder (two way sync)
- More docs, ui changes for the docs.

### Fixed

- The user id on a device is now stamped per sync server, so pointing the app
  at a second server no longer looks like a different person and wipes the
  local store. 
- Undo fix for the markdown editor.

## [0.20.0] - 2026-08-22

### Added

- Row view: a board can be shown as one list of rows grouped by deadline,
  overdue first and undated last. 

### Changed

- UI simplification.
- `@doska/client-db` has a SQLite adapter for futute integration with mobile.

### Removed

- Board prefixes. 

### Fixed

- The trash listed empty untitled cards, columns and boards.

## [0.19.0] - 2026-08-17

### Added

- Search, `⌘`+`K` on a board. It matches the card id, the title, the body and
  the names of attached files. Picking one opens the card and scrolls the board to it.
- Reveal on board: a card opened from search or from a link points at where it
  sits.
- Priority: high, medium or low on a card, or none. Set from the card, shown as
  a chip, and carried through the MCP server.
- A board can be sorted by priority, by deadline, or by both.
- Deleting a card offers an undo toast. Several at once stack into a pile.
- Delete and reveal buttons in the card panel header.
- Issue templates for bugs, crashes and feature requests.

### Changed

- macOS builds are signed with a Developer ID certificate and notarized by
  Apple
- A `[[card]]` reference UI simplification.
- Card reference lookups optimization.

### Fixed

- An error boundary now catches a render failure instead of blanking the page.
- Invalid HTML nesting warnings in the console.
- Meta icon sizes on mobile cards.

## [0.18.1] - 2026-08-11

### Added

- The installer now fetches the compose file and the backup helper for the
  release it is installing

### Fixed

- Offline / server is down reflects at UI

## [0.18.0] - 2026-08-11

### Added

- Accounts: a server holds more than one person. The admin adds them
  from the **Accounts** screen in settings, sets anyone's password, and
  deactivates without deleting — a deactivated account can't sign in and its
  boards stay put. Nobody can sign themselves up.
- Every board belongs to an account, and sync only ever serves what the
  signed-in one owns or has been given. 
- Boards are shareable. **Share** in the board menu opens a roster: the owner
  adds anyone with an account on the server, and takes them off again. A shared
  board syncs to everyone on it and is marked in the sidebar.
- Being taken off a board — or leaving one yourself — drops it and its cards
  from your devices. 
- An admin can delete a deactivated account outright, once it owns no board.
  Boards it was a member of let go of it first.
- A board can be published to a read-only link anyone can open without an
  account. **Share** → **Create link**, owner only. 
- Docs update, docs pages beta tags, and a page on public sharing.

### Changed

- **Accounts**, **Docs** and **GitHub** moved out of the sidebar and into the
  Settings modal. The sidebar footer was collecting buttons.
- `AUTH_LOGIN` / `AUTH_PASSWORD` seed the first admin account on first boot and
  do nothing after that. Editing them and restarting won't change a password;
  the Accounts screen will.
- Signing in as a different account wipes the local store first, so one person's
  boards can't surface in another's session. Signing out leaves the data alone —
  it's still the same person's.
- A board the server stops serving is dropped locally, rows, cursor and pending
  writes together, instead of being retried forever.
- Card, column and board rendering split into presentational views, so the
  public board draws the same components as the app rather than a second set.

### Fixed

- Share tokens leaked in the `Referer` header when a visitor followed a link out
  of a public board.
- `/p/` is disallowed in `robots.txt`, so share links stay out of search
  results.
- Server start script.

## [0.17.0] - 2026-08-08

### Added

- Attachments work out of the box on a self-hosted instance: files land in a
  local `doska-files` volume, and S3 becomes the opt-in alternative.
- `backup.sh` also archives the attachments volume.
- A card whose body is nothing but one image renders as a full-bleed image card.
- Markdown is highlighted. The tokenizer lives in
  `@doska/highlight` and emits plain data, so the mobile editor can reuse it.
- `[[ROAD-12|Fix the sync bug]]` pins a reference's wording.

### Changed

- The card body no longer gets spellchecked. 

### Removed

- `[tag]` pills. They complicated more than they earned; the idea will come back
  in a different shape.

### Fixed

- External links in the desktop app opened inside the webview; they now go to the
  system browser.
- Dokploy deployments served a stale build: the server sat on the shared proxy
  network instead of an internal one.

## [0.16.0] - 2026-08-05

### Added

- iOS app prototype: sync and sign-in, boards paged column by column, card editing in a
  native sheet, drag and drop, upcoming, trash, themes.
- `mobile-install` builds a release configuration onto a connected device.

### Changed

- Domain and data layers moved into `@doska/core`, reached through ports the host
  app installs at startup. `apps/client` is now views plus browser adapters, so a
  second platform imports the shared code instead of forking it.
- Platform-agnostic packages compile without DOM types, so a browser API can no
  longer reach shared code unnoticed.
- Markdown editing sits in `@doska/markdown` behind an adapter per platform, so
  both apps share the parser, slash commands, wikilinks and the cut line.
- Design tokens moved into `@doska/tokens`, shared by the client, the landing
  page and the mobile app.
- Record ids carry 12 hex characters of a uuid instead of 8. At ten thousand
  records that is a one in 5.6 million chance of a collision, not one in ninety.
- Columns narrow to their own width from 430px up, so tablets show a deck rather
  than one full-width column.

### Fixed

- Markdown preview was called as a function, not rendered, so its hooks landed in
  the editor's hook list and vanished when the preview closed.
- Dark theme on mobile.
- A board opened scrolled to its last column, and switching boards kept the
  previous board's scroll position.
- A server that could not be reached was reported as being signed out; the
  failure now surfaces instead of silently signing the account out.
- Flaky end-to-end specs.
- End-to-end job ran against a Playwright container older than the pinned
  package, so no browser launched.

### Security

- Refreshed transitive dependencies in the lock file.

## [0.15.0] - 2026-07-30

### Added

- Trash: deleted boards, columns and cards are recoverable until retention
  expires.
- `⌘`+`Z` takes back the last delete without a trip to the trash.
- Ticking a row in the upcoming view moves the card to its board's done column.
- Board and column actions collapsed into overflow menus.
- Help modal explaining how to mark a card done from the upcoming view when the
  board has no done column.
- Service worker update prompt for the installed PWA.
- Attachment opening from the installed PWA.

### Changed

- Landing page content and seed data.
- At most one done column per board; marking a column done clears the flag from
  the others.
- Trash retention cut from 30 to 14 days.
- MCP server tools cover trash, done columns and card references.

### Fixed

- PWA manifest served from the landing app.
- Upcoming view refreshes when changes arrive from another device.
- `typecheck` now covers the client and landing apps instead of silently passing.
- Checkbox state in the upcoming view.
- Board prefix state after renaming a board.
- Column styles on mobile.
- macOS traffic lights overlapping the desktop app header.
- Hybrid logical clock timestamps on writes made through the MCP server, which
  could order agent edits incorrectly against client edits.

### Security

- Overrode vulnerable transitive dependencies flagged by Dependabot.

## [0.14.0] - 2026-07-25

### Added

- Beta release channel, published separately from stable.
- Single click opens a card for editing.
- Public landing page with SEO metadata and its own deployment.
- Digest board prototype.
- Upcoming view: cards from every board ordered by deadline, overdue first.
- Zoom controls in the desktop app.
- Additional column colors.
- GitHub link in the app header.

### Changed

- Reduced card re-renders on board updates.
- Digest filters simplified.
- Mutation layer reorganized around per-entity hooks.

### Fixed

- Offline banner can be dismissed.
- Clicking an inline image opens the full-size attachment.
- Card font color in dark theme.
- Clearing a deadline from the mobile date picker.
- Stale IndexedDB version after a schema bump.
- PWA update prompt firing on every load.
- Browser zoom breaking board layout.
- List and quote continuation when pressing Enter in the editor.
- Slash menu placement near the viewport edge.
- Board prefix input sizing.
- Sync regression that dropped concurrent updates.
- Column width on narrow viewports.
- Caret and selection handling while editing cards on mobile.

## [0.13.0] - 2026-07-20

### Added

- Card references: `[[CARD-12]]` in a card body links to another card and picks
  up its column color.

### Fixed

- Race allocating card numbers when two cards synced at once.

## [0.12.1] - 2026-07-19

### Fixed

- Inline images not resolving in the desktop app.
- Server healthcheck endpoint.

## [0.12.0] - 2026-07-19

### Added

- Inline images: attachments referenced from card markdown render in place.
- Integration test suite for the server.

### Changed

- Server restructured: environment variable handling, MCP auth guard, module
  layout.

### Security

- Uploads rejected for unauthenticated requests.

## [0.11.0] - 2026-07-18

### Added

- Install scripts for self-hosting.

### Changed

- Repository made public.

## [0.10.1] - 2026-07-17

### Fixed

- Deleting a card closes the card panel.
- Preview cut rendering, card spacing, board height consistency.

## [0.10.0] - 2026-07-17

### Changed

- Cards open in a side panel instead of a modal.

## [0.9.0] - 2026-07-16

### Added

- Human-readable card ids (`BOARD-12`), allocated on first sync, with copy
  support.

### Changed

- Clock synchronization between clients tightened to reduce ordering conflicts.
- Mutation hooks colocated with their callers; runtime utilities split out.

## [0.8.1] - 2026-07-14

### Fixed

- MCP route proxying behind nginx.

## [0.8.0] - 2026-07-14

### Added

- MCP server exposing boards, columns and cards to AI agents, with OAuth.

### Changed

- Authentication reworked to share sessions between the app and MCP.

### Removed

- First-generation MCP implementation.

## [0.7.2] - 2026-07-10

### Fixed

- Column scrolling and attachment handling on mobile.
- IndexedDB storage persistence request.

## [0.7.1] - 2026-07-10

### Fixed

- Editor layout regressions.

## [0.7.0] - 2026-07-10

### Added

- PWA support: installable, works offline.

## [0.6.0] - 2026-07-09

### Added

- Attachments: upload, storage and card UI.

### Removed

- Filesystem sync backend, superseded by attachments.

## [0.5.0] - 2026-06-30

### Added

- Horizontal snap scrolling between columns on mobile.
- Slash menu as a floating button on mobile.
- Redesigned desktop date picker and checkboxes.

### Changed

- Desktop window is frameless with native drag regions.

### Removed

- Card locked state.

### Fixed

- Rubber-band overscroll on macOS.
- New cards open directly in edit mode.

## [0.4.4] - 2026-06-28

### Fixed

- Docker Compose image versions and always-pull policy.
- App version propagated to the web build environment.

## [0.4.3] - 2026-06-28

### Added

- Published Docker images for the client and server.

## [0.4.2] - 2026-06-28

### Fixed

- Updater modal styles.

## [0.4.1] - 2026-06-28

### Fixed

- Server version reporting and the release workflow.

## [0.4.0] - 2026-06-28

### Added

- Opt-in automatic updates for the desktop app.
- Column collapse persisted per board.
- `Cmd+X` cuts the current line when there is no selection, as in an IDE.

### Fixed

- Deadline placement in the card editor; button variant naming.

## [0.3.2] - 2026-06-27

### Added

- Deadline entry from the card context menu.

### Fixed

- Last opened board restored on launch.
- Empty cards get a default title instead of rendering blank.

## [0.3.1] - 2026-06-27

### Added

- Sync server can be self-hosted on its own, without the rest of the stack.

### Changed

- Project renamed to Doska.

## [0.3.0] - 2026-06-27

### Added

- Desktop app with auto-updater and version display.
- Card deadlines.
- Card context menu, including moving a card to another column.

### Changed

- Card title is a textarea, treated as the body's `h1` and hidden from the
  markdown editor.

## [0.2.0] - 2026-06-20

### Added

- Column CRUD, column reorder, delete confirmation.
- Interactive checkboxes, tag pills, `-cut-` preview marker.
- Sync indicator and a dedicated sync engine package.
- Authentication prototype and Docker deployment.

### Changed

- UI, IndexedDB access, e2e tests and shared configs split into packages.
- Server sync reworked; deleting a board cascades to its cards.

## [0.1.0] - 2026-06-18

Initial release. First commit 2026-06-17.

### Added

- Kanban boards with columns and cards, drag and drop ordered by fractional
  indexing.
- Local-first storage with dirty-ref tracking and a pull/push sync server.
- Monorepo tooling (pnpm workspaces, Turborepo), CI and end-to-end tests.
