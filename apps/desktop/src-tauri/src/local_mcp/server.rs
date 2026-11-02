//! The HTTP listener on 127.0.0.1 and the checks every request goes through.

use super::bridge;
use std::{
    error::Error,
    io::{self, ErrorKind, Read, Write},
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc,
    },
    thread,
    time::Duration,
};
use tauri::AppHandle;
use tiny_http::{Request, Server, StatusCode};

const DEFAULT_PORT: u16 = 3846;
const PORT_COUNT: u16 = 10;
const MAX_BODY: u64 = 4 * 1024 * 1024;

/// Only what the MCP transport reads, so the Authorization header stays out of
/// the webview.
const FORWARDED: [&str; 4] = [
    "Content-Type",
    "Accept",
    "Mcp-Protocol-Version",
    "Mcp-Session-Id",
];

pub struct Listener {
    server: Arc<Server>,
    stopped: Arc<AtomicBool>,
    pub port: u16,
}

impl Listener {
    pub fn bind(port: u16) -> Result<Listener, String> {
        open(port, 10)
    }

    /// The first free port from the default up. Not port 0: the OS hands out
    /// ephemeral ones, which outgoing connections or Windows' reserved ranges
    /// can take after a reboot.
    pub fn bind_free() -> Result<Listener, String> {
        let last = DEFAULT_PORT + PORT_COUNT - 1;
        for port in DEFAULT_PORT..=last {
            if let Ok(listener) = open(port, 0) {
                return Ok(listener);
            }
        }
        Err(format!("Ports {DEFAULT_PORT}-{last} are all in use."))
    }

    pub fn serve(
        &self,
        app: AppHandle,
        token: fn(&AppHandle) -> Option<String>,
        on_exit: fn(&AppHandle, &AtomicBool),
    ) {
        let server = self.server.clone();
        let stopped = self.stopped.clone();
        thread::spawn(move || {
            for request in server.incoming_requests() {
                let app = app.clone();
                // Each one waits on the app, so a slow agent can't hold up the rest.
                thread::spawn(move || handle(&app, token, request));
            }
            // The socket only closes on drop; holding it would block a rebind.
            drop(server);
            // tiny_http gives up for good on an accept error.
            on_exit(&app, &stopped);
        });
    }

    pub fn stop(self) {
        self.stopped.store(true, Ordering::SeqCst);
        self.server.unblock();
    }
}

/// Retries are for a port we just stopped: it frees up only once tiny_http's
/// accept thread exits.
fn open(port: u16, retries: u32) -> Result<Listener, String> {
    let mut result = Server::http(("127.0.0.1", port));
    for _ in 0..retries {
        let in_use =
            matches!(&result, Err(e) if error_kind(e.as_ref()) == Some(ErrorKind::AddrInUse));
        if !in_use {
            break;
        }
        thread::sleep(Duration::from_millis(50));
        result = Server::http(("127.0.0.1", port));
    }
    match result {
        Ok(server) => Ok(Listener {
            server: Arc::new(server),
            stopped: Arc::new(AtomicBool::new(false)),
            port,
        }),
        Err(e) => match error_kind(e.as_ref()) {
            // Windows answers PermissionDenied for ports Hyper-V or WSL reserved.
            Some(ErrorKind::AddrInUse | ErrorKind::PermissionDenied) => {
                Err(format!("Port {port} is in use."))
            }
            _ => Err(e.to_string()),
        },
    }
}

fn error_kind(error: &(dyn Error + Send + Sync + 'static)) -> Option<ErrorKind> {
    error.downcast_ref::<io::Error>().map(|e| e.kind())
}

/// Constant time, so response timing doesn't leak the token.
fn constant_time_eq(a: &[u8], b: &[u8]) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut diff = 0;
    for (x, y) in a.iter().zip(b) {
        diff |= x ^ y;
    }
    diff == 0
}

fn header<'a>(request: &'a Request, name: &'static str) -> Option<&'a str> {
    request
        .headers()
        .iter()
        .find(|h| h.field.equiv(name))
        .map(|h| h.value.as_str())
}

/// Written by hand because tiny_http drops a Connection header, and a
/// kept-alive connection outlives a stop and hangs.
fn respond(request: Request, status: u16, headers: &[(&str, &str)], body: &str) {
    let reason = StatusCode(status).default_reason_phrase();
    let mut head = format!("HTTP/1.1 {status} {reason}\r\n");
    for (name, value) in headers {
        head.push_str(&format!("{name}: {value}\r\n"));
    }
    head.push_str(&format!(
        "Content-Length: {}\r\nConnection: close\r\n\r\n",
        body.len()
    ));
    let mut writer = request.into_writer();
    let _ = writer.write_all(head.as_bytes());
    let _ = writer.write_all(body.as_bytes());
    let _ = writer.flush();
}

fn respond_text(request: Request, status: u16, text: &str) {
    respond(request, status, &[("Content-Type", "text/plain")], text);
}

/// A DNS-rebound page names its own domain here.
fn local_host(host: &str) -> bool {
    let name = host.rsplit_once(':').map_or(host, |(name, _)| name);
    name == "127.0.0.1" || name.eq_ignore_ascii_case("localhost")
}

fn handle(app: &AppHandle, token: fn(&AppHandle) -> Option<String>, mut request: Request) {
    if request.url() != "/mcp" {
        return respond_text(request, 404, "Not found.");
    }
    // Browsers always send Origin and MCP clients don't, so this shuts out web
    // pages calling localhost.
    if header(&request, "Origin").is_some() {
        return respond_text(request, 403, "Browsers are not allowed.");
    }
    if header(&request, "Host").is_some_and(|host| !local_host(host)) {
        return respond_text(request, 403, "Wrong host.");
    }
    let given = header(&request, "Authorization")
        .and_then(|value| value.split_once(' '))
        .filter(|(scheme, _)| scheme.eq_ignore_ascii_case("Bearer"))
        .map(|(_, given)| given);
    let authorized = match (token(app), given) {
        (Some(token), Some(given)) => constant_time_eq(token.as_bytes(), given.as_bytes()),
        _ => false,
    };
    if !authorized {
        return respond_text(request, 401, "Wrong or missing token.");
    }
    // Stateless, so there's no stream to open; the spec allows 405 here.
    if request.method().as_str() == "GET" {
        return respond(
            request,
            405,
            &[("Allow", "POST, DELETE"), ("Content-Type", "text/plain")],
            "No event stream.",
        );
    }

    let mut bytes = Vec::new();
    if request
        .as_reader()
        .take(MAX_BODY + 1)
        .read_to_end(&mut bytes)
        .is_err()
    {
        return respond_text(request, 400, "Couldn't read the body.");
    }
    if bytes.len() as u64 > MAX_BODY {
        return respond_text(request, 413, "The body is too big.");
    }
    let Ok(body) = String::from_utf8(bytes) else {
        return respond_text(request, 400, "The body isn't UTF-8.");
    };
    let headers = FORWARDED
        .iter()
        .filter_map(|&name| {
            header(&request, name).map(|value| (name.to_string(), value.to_string()))
        })
        .collect();
    let method = request.method().as_str().to_string();
    let Some(response) = bridge::forward(app, method, headers, body) else {
        return respond_text(request, 504, "The app didn't answer.");
    };
    let content_type = if response.content_type.contains(['\r', '\n']) {
        "application/json"
    } else {
        response.content_type.as_str()
    };
    respond(
        request,
        response.status,
        &[("Content-Type", content_type)],
        &response.body,
    );
}
