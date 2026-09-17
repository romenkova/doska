//! Auto-update straight from GitHub Releases. With a sync server configured
//! the client installs that server's version; without one it takes the latest.

use serde::Serialize;
use tauri::AppHandle;

const RELEASES: &str = "https://github.com/romenkova/doska/releases";

/// A release that differs from the running app.
#[derive(Serialize)]
pub struct Available {
    version: String,
    newer: bool,
}

fn manifest_url(server_version: Option<&str>) -> String {
    match server_version {
        Some(v) => format!("{RELEASES}/download/v{v}/latest.json"),
        None => format!("{RELEASES}/latest/download/latest.json"),
    }
}

#[cfg(desktop)]
async fn find_update(
    app: &AppHandle,
    server_version: Option<&str>,
) -> Result<Option<tauri_plugin_updater::Update>, String> {
    use tauri_plugin_updater::UpdaterExt;

    let url = tauri::Url::parse(&manifest_url(server_version)).map_err(|e| e.to_string())?;
    app.updater_builder()
        .endpoints(vec![url])
        .map_err(|e| e.to_string())?
        .version_comparator(|current, release| release.version != current)
        .build()
        .map_err(|e| e.to_string())?
        .check()
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn check_update(
    app: AppHandle,
    server_version: Option<String>,
) -> Result<Option<Available>, String> {
    #[cfg(desktop)]
    {
        let Some(update) = find_update(&app, server_version.as_deref()).await? else {
            return Ok(None);
        };
        let parse = |v: &str| semver::Version::parse(v).map_err(|e| e.to_string());
        let newer = parse(&update.version)? > parse(&update.current_version)?;
        Ok(Some(Available {
            version: update.version,
            newer,
        }))
    }
    #[cfg(not(desktop))]
    {
        let _ = (app, server_version);
        Ok(None)
    }
}

#[tauri::command]
pub async fn install_update(app: AppHandle, server_version: Option<String>) -> Result<(), String> {
    #[cfg(desktop)]
    {
        let Some(update) = find_update(&app, server_version.as_deref()).await? else {
            return Ok(());
        };
        update
            .download_and_install(|_, _| {}, || {})
            .await
            .map_err(|e| e.to_string())
    }
    #[cfg(not(desktop))]
    {
        let _ = (app, server_version);
        Ok(())
    }
}
