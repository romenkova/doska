const types = ["feat", "fix", "refactor", "chore", "docs"]

export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", types],
  },
  // cz-git prompt (used by commitizen) — same trimmed set.
  prompt: {
    types: [
      { value: "feat", name: "feat:     A new feature" },
      { value: "fix", name: "fix:      A bug fix" },
      { value: "refactor", name: "refactor: A code change that's neither a fix nor a feature" },
      { value: "chore", name: "chore:    Tooling, deps, config, housekeeping" },
      { value: "docs", name: "docs:     Documentation only" },
    ],
  },
}
