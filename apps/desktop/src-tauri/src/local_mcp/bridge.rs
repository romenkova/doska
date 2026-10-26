//! Hands authorized requests to the main window, which runs the MCP server on
//! the app's own data, and waits for its answer.

use serde::Serialize;
use std::{
    collections::HashMap,
    sync::{
        atomic::{AtomicU64, Ordering},
        mpsc, Mutex,
    },
    time::Duration,
};
use tauri::{AppHandle, Emitter, Manager, State};

const TIMEOUT: Duration = Duration::from_secs(60);

#[derive(Serialize, Clone)]
struct McpRequest {
    id: u64,
    method: String,
    headers: Vec<(String, String)>,
    body: String,
}

pub struct Response {
    pub status: u16,
    pub content_type: String,
    pub body: String,
}

#[derive(Default)]
pub struct Bridge {
    next_id: AtomicU64,
    pending: Mutex<HashMap<u64, mpsc::Sender<Response>>>,
}

/// None when the app doesn't answer in time.
pub fn forward(
    app: &AppHandle,
    method: String,
    headers: Vec<(String, String)>,
    body: String,
) -> Option<Response> {
    let bridge = app.state::<Bridge>();
    let id = bridge.next_id.fetch_add(1, Ordering::SeqCst);
    let (sender, receiver) = mpsc::channel();
    bridge.pending.lock().unwrap().insert(id, sender);
    let request = McpRequest {
        id,
        method,
        headers,
        body,
    };
    let response = match app.emit_to("main", "local-mcp:request", request) {
        Ok(()) => receiver.recv_timeout(TIMEOUT).ok(),
        Err(_) => None,
    };
    bridge.pending.lock().unwrap().remove(&id);
    response
}

#[tauri::command]
pub fn local_mcp_reply(
    state: State<Bridge>,
    id: u64,
    status: u16,
    content_type: String,
    body: String,
) {
    if let Some(sender) = state.pending.lock().unwrap().remove(&id) {
        let _ = sender.send(Response {
            status,
            content_type,
            body,
        });
    }
}
