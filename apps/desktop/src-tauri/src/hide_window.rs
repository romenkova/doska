use tauri::Window;

#[cfg(target_os = "macos")]
const EXIT_FULLSCREEN: std::time::Duration = std::time::Duration::from_secs(1);

/// Hiding a window that is in native fullscreen leaves its Space behind as a
/// black screen, so leave fullscreen first and hide once that has played out.
/// See https://github.com/tauri-apps/tauri/issues/10580 and the same fix in
/// https://github.com/cline/cline/pull/14271.
pub fn hide(window: &Window) {
    #[cfg(target_os = "macos")]
    if window.is_fullscreen().unwrap_or(false) {
        let _ = window.set_fullscreen(false);
        let window = window.clone();
        std::thread::spawn(move || {
            std::thread::sleep(EXIT_FULLSCREEN);
            let hidden = window.clone();
            let _ = window.run_on_main_thread(move || {
                let _ = hidden.hide();
            });
        });
        return;
    }
    let _ = window.hide();
}
