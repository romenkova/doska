import type { ConfigContext, ExpoConfig } from "expo/config"

// Distinct bundle id so a dev build installs alongside the TestFlight app
// instead of replacing it. Consequence: separate keychain and SQLite, so the
// dev build starts logged out.
const isDev = process.env.APP_VARIANT === "dev"

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: isDev ? "Doska Dev" : (config.name ?? "Doska"),
  slug: config.slug ?? "doska",
  scheme: isDev ? "doska-dev" : config.scheme,
  icon: isDev ? "./assets/icon-dev.png" : config.icon,
  ios: {
    ...config.ios,
    bundleIdentifier: isDev ? "com.doska.app.dev" : "com.doska.app",
  },
  android: {
    ...config.android,
    package: isDev ? "com.doska.app.dev" : "com.doska.app",
    adaptiveIcon: {
      ...config.android?.adaptiveIcon,
      foregroundImage: isDev
        ? "./assets/adaptive-icon-dev.png"
        : "./assets/adaptive-icon.png",
    },
  },
})
