//! Spotlight-style panel: becomes key without activating the app, so it can
//! appear on any Space, including another app's fullscreen one. A regular
//! window can only take focus by activating the app, and activation switches
//! Spaces.
use objc2::{
    define_class, rc::Retained, runtime::AnyObject, ClassType, MainThreadMarker, MainThreadOnly,
};
use objc2_app_kit::{
    NSApplication, NSPanel, NSPopUpMenuWindowLevel, NSWindowCollectionBehavior, NSWindowStyleMask,
};
use tauri::{AppHandle, Manager};

use super::WINDOW;

define_class!(
    // SAFETY: NSPanel adds no instance variables over NSWindow, which is
    // what makes re-classing an existing window into it sound; no Drop.
    #[unsafe(super(NSPanel))]
    #[thread_kind = MainThreadOnly]
    #[name = "QuickNotePanel"]
    struct QuickNotePanel;

    impl QuickNotePanel {
        #[unsafe(method(canBecomeKeyWindow))]
        fn can_become_key_window(&self) -> bool {
            true
        }

        #[unsafe(method(canBecomeMainWindow))]
        fn can_become_main_window(&self) -> bool {
            false
        }
    }
);

fn with_panel(app: &AppHandle, f: impl FnOnce(&QuickNotePanel) + Send + 'static) {
    let app = app.clone();
    let _ = app.clone().run_on_main_thread(move || {
        let Some(win) = app.get_webview_window(WINDOW) else {
            return;
        };
        let Ok(ptr) = win.ns_window() else {
            return;
        };
        // SAFETY: main thread (above), and the pointer is a live NSWindow
        // owned by tao for as long as the webview window exists.
        let obj = unsafe { &*(ptr as *const AnyObject) };
        if obj.class() != QuickNotePanel::class() {
            unsafe { AnyObject::set_class(obj, QuickNotePanel::class()) };
        }
        f(unsafe { &*(ptr as *const QuickNotePanel) });
    });
}

/// Runs once at startup, before the popup is ever shown.
pub fn setup(app: &AppHandle) {
    with_panel(app, |panel| {
        panel.setStyleMask(panel.styleMask() | NSWindowStyleMask::NonactivatingPanel);
        panel.setCollectionBehavior(
            NSWindowCollectionBehavior::CanJoinAllSpaces
                | NSWindowCollectionBehavior::FullScreenAuxiliary,
        );
        // `alwaysOnTop` only gives the floating level, which a fullscreen
        // app still covers.
        panel.setLevel(NSPopUpMenuWindowLevel);
    });
}

pub fn show(app: &AppHandle) {
    with_panel(app, |panel| {
        panel.orderFrontRegardless();
        panel.makeKeyWindow();
    });
}

/// Whether the key window is one of ours other than the popup, like the file picker.
pub fn focus_in_own_dialog(app: &AppHandle) -> bool {
    let mtm = MainThreadMarker::new().expect("run_on_main_thread");
    let Some(key) = NSApplication::sharedApplication(mtm).keyWindow() else {
        return false;
    };
    let main = app
        .get_webview_window("main")
        .and_then(|w| w.ns_window().ok());
    Some(Retained::as_ptr(&key).cast_mut().cast()) != main
}
