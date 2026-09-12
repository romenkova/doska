use std::{
    sync::atomic::{AtomicBool, Ordering},
    thread,
    time::{Duration, Instant},
};
use tauri::{AppHandle, Manager, PhysicalPosition};

pub const WINDOW: &str = "tear-ghost";
/// How often the ghost catches up with the cursor.
const FRAME: Duration = Duration::from_millis(16);

const MAX_DRAG: Duration = Duration::from_secs(30);

static FOLLOWING: AtomicBool = AtomicBool::new(false);

fn follow(app: &AppHandle) {
    let (Some(win), Ok(cursor)) = (app.get_webview_window(WINDOW), app.cursor_position()) else {
        return;
    };
    let Ok(size) = win.outer_size() else {
        return;
    };
    let _ = win.set_position(PhysicalPosition::new(
        cursor.x - f64::from(size.width) / 2.0,
        cursor.y - f64::from(size.height) / 2.0,
    ));
}

/// Shows the drag stand-in and keeps it under the cursor
#[tauri::command]
pub fn start_tear_off(app: AppHandle, theme: String) {
    if FOLLOWING.swap(true, Ordering::SeqCst) {
        return;
    }

    let apply_theme = if theme == "light" {
        "document.documentElement.className = 'light'"
    } else {
        "document.documentElement.className = 'dark'"
    };

    let handle = app.clone();
    let _ = app.run_on_main_thread(move || {
        follow(&handle);
        if let Some(win) = handle.get_webview_window(WINDOW) {
            let _ = win.eval(apply_theme);
            let _ = win.show();
            let _ = win.set_ignore_cursor_events(true);
        }
    });
    thread::spawn(move || {
        let started = Instant::now();
        while FOLLOWING.load(Ordering::SeqCst) {
            if started.elapsed() > MAX_DRAG {
                end_tear_off(app);
                return;
            }
            thread::sleep(FRAME);
            let handle = app.clone();
            let _ = app.run_on_main_thread(move || follow(&handle));
        }
    });
}

#[tauri::command]
pub fn end_tear_off(app: AppHandle) {
    FOLLOWING.store(false, Ordering::SeqCst);
    if let Some(win) = app.get_webview_window(WINDOW) {
        let _ = win.hide();
    }
}
