export const initialTasks = [
  { label: "Written in Markdown", done: true },
  { label: "Slash menu for formatting", done: true },
  { label: "Tick a box — watch the count", done: false },
  { label: "Nothing left to do", done: false },
]

export type Task = (typeof initialTasks)[number]
