//! Local MCP settings, kept in `local-mcp.json`.

use serde::{Deserialize, Serialize};
use std::{
    fs,
    io::{self, Write},
    path::{Path, PathBuf},
};
use tauri::{AppHandle, Manager};

const FILE: &str = "local-mcp.json";

#[derive(Serialize, Deserialize, Default)]
pub struct Settings {
    pub enabled: bool,
    pub port: Option<u16>,
    pub token: Option<String>,
}

fn path(app: &AppHandle) -> Option<PathBuf> {
    app.path().app_config_dir().ok().map(|dir| dir.join(FILE))
}

pub fn new_token() -> String {
    format!("dsk_{}", uuid::Uuid::new_v4().simple())
}

impl Settings {
    pub fn load(app: &AppHandle) -> Settings {
        path(app)
            .and_then(|p| fs::read_to_string(p).ok())
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    }

    pub fn save(&self, app: &AppHandle) -> Result<(), String> {
        let Some(path) = path(app) else {
            return Ok(());
        };
        if let Some(dir) = path.parent() {
            fs::create_dir_all(dir).map_err(|e| e.to_string())?;
        }
        let json = serde_json::to_string_pretty(self).map_err(|e| e.to_string())?;
        // A write cut short would lose the token and port, so swap in a whole file.
        let temp = path.with_extension("json.tmp");
        write_private(&temp, json.as_bytes())
            .and_then(|()| fs::rename(&temp, &path))
            .map_err(|e| e.to_string())
    }
}

/// It holds the token, so other users on the machine mustn't read it.
#[cfg(unix)]
fn write_private(path: &Path, bytes: &[u8]) -> io::Result<()> {
    use std::os::unix::fs::{OpenOptionsExt, PermissionsExt};
    let mut file = fs::OpenOptions::new()
        .write(true)
        .create(true)
        .truncate(true)
        .mode(0o600)
        .open(path)?;
    // mode only applies on create; this fixes a temp file left by a crash.
    file.set_permissions(fs::Permissions::from_mode(0o600))?;
    file.write_all(bytes)
}

#[cfg(not(unix))]
fn write_private(path: &Path, bytes: &[u8]) -> io::Result<()> {
    fs::write(path, bytes)
}
