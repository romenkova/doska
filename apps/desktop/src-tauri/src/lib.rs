mod quick_note;
mod shortcuts;
mod tear_off;
mod vault;

use tauri::{Manager, RunEvent, WindowEvent};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            vault::ignore_vault,
            quick_note::hide_quick_note,
            tear_off::start_tear_off,
            tear_off::end_tear_off,
            shortcuts::get_shortcut,
            shortcuts::suspend_shortcut,
            shortcuts::set_shortcut
        ])
        .plugin(
            tauri_plugin_window_state::Builder::default()
                .with_filter(|label| label == "main")
                .build(),
        )
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_persisted_scope::init())
        .setup(|app| {
            // Updater + process (relaunch) are desktop-only.
            #[cfg(desktop)]
            {
                app.handle()
                    .plugin(tauri_plugin_updater::Builder::new().build())?;
                app.handle().plugin(tauri_plugin_process::init())?;
            }
            quick_note::init(app.handle());
            shortcuts::init(app.handle())?;
            Ok(())
        })
        .on_window_event(|window, event| {
            quick_note::on_window_event(window, event);
            // Closing the main window only hides it, so the shortcut keeps
            // working; Cmd+Q still quits.
            if let ("main", WindowEvent::CloseRequested { api, .. }) = (window.label(), event) {
                api.prevent_close();
                let _ = window.hide();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| {
            #[cfg(target_os = "macos")]
            if let RunEvent::Reopen { .. } = event {
                if let Some(main) = app.get_webview_window("main") {
                    let _ = main.show();
                    let _ = main.set_focus();
                }
            }
            let _ = (app, &event);
        });
}
