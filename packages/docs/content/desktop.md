---
title: Desktop and mobile
nav: Desktop & mobile
description: "The signed, auto-updating macOS app, and installing the same client as a PWA on a phone or a dock."
order: 6
updated: "2026-09-02"
---

The same client runs in three places: a browser tab, a phone home screen, and a
Tauri macOS app.

## macOS app

Download the latest build from
[Releases](https://github.com/romenkova/doska/releases/latest). It wraps the client
with [Tauri](https://tauri.app) and auto-updates.

Builds are signed with a Developer ID certificate and notarized by Apple.

To sync, open the app's sync settings, set the server URL to your server's
address, the same one you open the web UI at, and press **Sign in in browser**.
Sign in there however you like, then come back and press **I've signed in**.

The desktop app follows whatever version its server runs, and downloads the same version of the app on updates.

## Install as a PWA

From the browser, install the app to your home screen or dock. It runs
fullscreen, and because the boards are already local it works offline the same
way the tab does.
