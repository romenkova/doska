use std::{thread, time::Duration};
use tauri::{AppHandle, Emitter, Manager, Window, WindowEvent};

#[cfg(target_os = "macos")]
mod macos;

pub const WINDOW: &str = "quick-note";
const SHORTCUT: &str = "Ctrl+Alt+D";
/// Sent to the popup when focus has moved on; it closes itself.
const BLUR_EVENT: &str = "quick-note:blur";
/// Long enough for whatever took focus to have become key.
const BLUR_SETTLE: Duration = Duration::from_millis(150);

/// Registers the global shortcut and prepares the popup window.
pub fn init(app: &AppHandle) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(desktop)]
    {
        use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};

        app.plugin(
            tauri_plugin_global_shortcut::Builder::new()
                .with_handler(|app, _shortcut, event| {
                    if event.state() == ShortcutState::Pressed {
                        toggle(app);
                    }
                })
                .build(),
        )?;
        app.global_shortcut().register(SHORTCUT)?;
    }
    #[cfg(target_os = "macos")]
    macos::setup(app);
    Ok(())
}

pub fn on_window_event(window: &Window, event: &WindowEvent) {
    if window.label() == WINDOW && matches!(event, WindowEvent::Focused(false)) {
        on_blur(window.app_handle());
    }
}

fn toggle(app: &AppHandle) {
    let Some(win) = app.get_webview_window(WINDOW) else {
        return;
    };
    if win.is_visible().unwrap_or(false) {
        hide(app);
        return;
    }
    let _ = win.center();
    #[cfg(target_os = "macos")]
    macos::show(app);
    #[cfg(not(target_os = "macos"))]
    {
        let _ = win.show();
        let _ = win.set_focus();
    }
}

fn hide(app: &AppHandle) {
    if let Some(win) = app.get_webview_window(WINDOW) {
        let _ = win.hide();
    }
}

#[tauri::command]
pub fn hide_quick_note(app: AppHandle) {
    hide(&app);
}

/// A click elsewhere closes the popup, but one of our own dialogs (the file
/// picker) must not: the key window decides, once it has settled.
fn on_blur(app: &AppHandle) {
    let app = app.clone();
    thread::spawn(move || {
        thread::sleep(BLUR_SETTLE);
        let handle = app.clone();
        let _ = app.run_on_main_thread(move || {
            let Some(win) = handle.get_webview_window(WINDOW) else {
                return;
            };
            if !win.is_visible().unwrap_or(false) || win.is_focused().unwrap_or(false) {
                return;
            }
            #[cfg(target_os = "macos")]
            if macos::focus_in_own_dialog(&handle) {
                return;
            }
            let _ = handle.emit_to(WINDOW, BLUR_EVENT, ());
        });
    });
}
