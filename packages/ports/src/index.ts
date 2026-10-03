/**
 * The interfaces that stand between the shared code and a platform. Every one is
 * a type — this package emits nothing at runtime — and each has one
 * implementation per platform, injected at startup rather than picked by a
 * sniff at the call site.
 *
 * Two of them predate this package and keep their definitions where their
 * adapters live; they are re-exported so callers have one place to import from.
 */

// The interface subpaths, not the package roots: those also export the web
// adapters, and importing one drags `lib.dom` into every neutral package's
// program.
export type { ClientDB, KeyRange, Query } from "@doska/client-db/client-db"
export type {
  FileInput,
  FileStorage as Files,
  StoredFile,
} from "@doska/file-storage"

export type { KeyValue } from "./key-value"
export type { Http } from "./http"
export type { Auth } from "./auth"
export type { Net } from "./net"
export type { Foreground } from "./foreground"
