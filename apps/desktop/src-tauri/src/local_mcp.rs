//! Local MCP: an HTTP endpoint on 127.0.0.1 for agents on this computer.

pub mod bridge;
mod server;
mod settings;

use serde::Serialize;
use server::Listener;
use settings::{new_token, Settings};
use std::{
    sync::{
        atomic::{AtomicBool, Ordering},
        Mutex, MutexGuard,
    },
    thread,
    time::Duration,
};
use tauri::{AppHandle, Emitter, Manager, State};

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    enabled: bool,
    url: Option<String>,
    token: Option<String>,
    error: Option<String>,
    save_error: Option<String>,
}

#[derive(Default)]
struct Inner {
    settings: Settings,
    listener: Option<Listener>,
    error: Option<String>,
    save_error: Option<String>,
}

pub struct LocalMcp(Mutex<Inner>);

impl LocalMcp {
    fn lock(&self) -> MutexGuard<'_, Inner> {
        self.0.lock().unwrap()
    }
}

impl Inner {
    fn status(&self) -> Status {
        Status {
            enabled: self.settings.enabled,
            url: self
                .settings
                .port
                .map(|port| format!("http://127.0.0.1:{port}/mcp")),
            token: self.settings.token.clone(),
            error: self.error.clone(),
            save_error: self.save_error.clone(),
        }
    }

    fn save(&mut self, app: &AppHandle) {
        self.save_error = self.settings.save(app).err();
    }

    fn stop(&mut self) {
        if let Some(listener) = self.listener.take() {
            listener.stop();
        }
        self.error = None;
    }

    /// Starts on the stored port, never another one: agents already have its URL.
    fn start(&mut self, app: &AppHandle) {
        self.settings.token.get_or_insert_with(new_token);
        let bound = match self.settings.port {
            Some(port) => Listener::bind(port),
            None => Listener::bind_free(),
        };
        self.serve(app, bound);
    }

    fn serve(&mut self, app: &AppHandle, bound: Result<Listener, String>) {
        match bound {
            Ok(listener) => {
                self.settings.port = Some(listener.port);
                listener.serve(app.clone(), token, restart_after_crash);
                self.listener = Some(listener);
                self.error = None;
            }
            Err(e) => self.error = Some(e),
        }
    }
}

fn token(app: &AppHandle) -> Option<String> {
    app.state::<LocalMcp>().lock().settings.token.clone()
}

/// Restarts on the same port. Checked under the lock, so a listener stopped on
/// purpose never counts.
fn restart_after_crash(app: &AppHandle, stopped: &AtomicBool) {
    if stopped.load(Ordering::SeqCst) {
        return;
    }
    // A pause, so an accept that keeps failing straight away doesn't spin.
    thread::sleep(Duration::from_secs(1));
    let state = app.state::<LocalMcp>();
    let mut inner = state.lock();
    if !stopped.load(Ordering::SeqCst) {
        inner.listener = None;
        inner.start(app);
        let _ = app.emit("local-mcp:status", inner.status());
    }
}

pub fn init(app: &AppHandle) {
    app.manage(bridge::Bridge::default());
    app.manage(LocalMcp(Mutex::new(Inner {
        settings: Settings::load(app),
        ..Default::default()
    })));
    // Requests read the state above, so it has to be managed before this. Off
    // the main thread, since binding can wait on a port.
    let app = app.clone();
    thread::spawn(move || {
        let state = app.state::<LocalMcp>();
        let mut inner = state.lock();
        if inner.settings.enabled {
            inner.start(&app);
            inner.save(&app);
            let _ = app.emit("local-mcp:status", inner.status());
        }
    });
}

#[tauri::command]
pub fn get_local_mcp(state: State<LocalMcp>) -> Status {
    state.lock().status()
}

// Async ones run off the main thread, since binding can wait on a port.
#[tauri::command]
pub async fn set_local_mcp_enabled(app: AppHandle, enabled: bool) -> Status {
    let state = app.state::<LocalMcp>();
    let mut inner = state.lock();
    if enabled && inner.listener.is_some() {
        return inner.status();
    }
    inner.stop();
    inner.settings.enabled = enabled;
    if enabled {
        inner.start(&app);
    }
    inner.save(&app);
    inner.status()
}

#[tauri::command]
pub fn reset_local_mcp_token(app: AppHandle, state: State<LocalMcp>) -> Status {
    let mut inner = state.lock();
    inner.settings.token = Some(new_token());
    inner.save(&app);
    inner.status()
}

/// The way out when the stored port is taken; agents need the new URL.
#[tauri::command]
pub async fn pick_local_mcp_port(app: AppHandle) -> Status {
    let state = app.state::<LocalMcp>();
    let mut inner = state.lock();
    if !inner.settings.enabled {
        return inner.status();
    }
    inner.stop();
    inner.serve(&app, Listener::bind_free());
    inner.save(&app);
    inner.status()
}
