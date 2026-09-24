// The share extension opens the app on `<scheme>://dataUrl=<key>`. That's no
// route: expo-share-intent reads it off the linking URL, so land on the board.
export function redirectSystemPath({ path }: { path: string }): string {
  return path.includes("dataUrl=") ? "/" : path
}
