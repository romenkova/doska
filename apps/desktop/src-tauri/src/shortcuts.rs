//! Global shortcuts, each named so the settings UI can rebind it. Saved as a
//! name -> shortcut map in `shortcuts.json`; missing names use their default.

use std::{collections::BTreeMap, fs, path::PathBuf};
use tauri::{AppHandle, Manager};

use crate::quick_note;

struct Action {
    name: &'static str,
    default: &'static str,
    run: fn(&AppHandle),
}

const ACTIONS: &[Action] = &[Action {
    name: "quick-note",
    default: "Ctrl+Alt+D",
    run: quick_note::toggle,
}];

const FILE: &str = "shortcuts.json";

type Saved = BTreeMap<String, String>;

fn action(name: &str) -> Result<&'static Action, String> {
    ACTIONS
        .iter()
        .find(|a| a.name == name)
        .ok_or_else(|| format!("unknown shortcut: {name}"))
}

fn path(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_config_dir().ok().map(|dir| dir.join(FILE))
}

fn load(app: &AppHandle) -> Saved {
    path(app)
        .and_then(|p| fs::read_to_string(p).ok())
        .and_then(|s| serde_json::from_str(&s).ok())
        .unwrap_or_default()
}

fn save(app: &AppHandle, saved: &Saved) -> Result<(), String> {
    let Some(path) = path(app) else {
        return Ok(());
    };
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(saved).map_err(|e| e.to_string())?;
    fs::write(path, json).map_err(|e| e.to_string())
}

fn current(app: &AppHandle, action: &Action) -> String {
    load(app)
        .remove(action.name)
        .unwrap_or_else(|| action.default.to_string())
}

#[cfg(desktop)]
fn register(app: &AppHandle, action: &'static Action, shortcut: &str) -> Result<(), String> {
    use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

    app.global_shortcut()
        .on_shortcut(shortcut, move |app, _, event| {
            if event.state() == ShortcutState::Pressed {
                (action.run)(app);
            }
        })
        .map_err(|e| e.to_string())
}

#[cfg(desktop)]
fn unregister(app: &AppHandle, shortcut: &str) {
    use tauri_plugin_global_shortcut::GlobalShortcutExt;
    let _ = app.global_shortcut().unregister(shortcut);
}

#[cfg(not(desktop))]
fn register(_: &AppHandle, _: &'static Action, _: &str) -> Result<(), String> {
    Ok(())
}

#[cfg(not(desktop))]
fn unregister(_: &AppHandle, _: &str) {}

pub fn init(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(desktop)]
    app.plugin(tauri_plugin_global_shortcut::Builder::new().build())?;
    for action in ACTIONS {
        // A saved shortcut this build can't parse must not block startup.
        if register(app, action, &current(app, action)).is_err() {
            register(app, action, action.default)?;
        }
    }
    Ok(())
}

#[tauri::command]
pub fn get_shortcut(app: AppHandle, name: String) -> Result<String, String> {
    Ok(current(&app, action(&name)?))
}

/// Lets the settings recorder hear the current shortcut; `set` brings one back.
#[tauri::command]
pub fn suspend_shortcut(app: AppHandle, name: String) -> Result<(), String> {
    unregister(&app, &current(&app, action(&name)?));
    Ok(())
}

/// Swaps one shortcut; on a bad one the old stays and the error is returned.
#[tauri::command]
pub fn set_shortcut(app: AppHandle, name: String, shortcut: String) -> Result<(), String> {
    let action = action(&name)?;
    let old = current(&app, action);
    unregister(&app, &old);
    if let Err(e) = register(&app, action, &shortcut) {
        let _ = register(&app, action, &old);
        return Err(e);
    }
    let mut saved = load(&app);
    saved.insert(name, shortcut);
    save(&app, &saved)
}
