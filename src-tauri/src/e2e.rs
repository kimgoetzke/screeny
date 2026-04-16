use std::env;
use std::path::PathBuf;

/// Returns true when the app was launched with `SCREENY_E2E=1`.
pub fn is_e2e_mode() -> bool {
    env::var("SCREENY_E2E").map_or(false, |v| v == "1")
}

/// Return the absolute path to the E2E fixture GIF.
///
/// The fixture lives at `<repo>/tests/fixtures/test.gif`.
/// `SCREENY_E2E_FIXTURE` overrides the path for custom setups.
pub fn fixture_path() -> Result<String, String> {
    if let Ok(path) = env::var("SCREENY_E2E_FIXTURE") {
        return Ok(path);
    }

    let exe = env::current_exe().map_err(|e| format!("Failed to locate exe: {e}"))?;
    // Walk up from the exe to find the repo root.
    // In dev the exe is inside src-tauri/target/…, so the repo root is
    // several levels up.  We look for tests/fixtures/test.gif starting from
    // each ancestor.
    let mut dir = exe.as_path();
    while let Some(parent) = dir.parent() {
        let candidate = parent.join("tests/fixtures/test.gif");
        if candidate.exists() {
            return Ok(candidate.to_string_lossy().to_string());
        }
        dir = parent;
    }

    Err("Could not locate tests/fixtures/test.gif from exe path".to_string())
}

/// Return the absolute path for E2E export output.
///
/// Uses a temp directory so tests don't pollute the repo.
/// `SCREENY_E2E_EXPORT` overrides the path for custom setups.
fn export_path() -> Result<String, String> {
    if let Ok(path) = env::var("SCREENY_E2E_EXPORT") {
        return Ok(path);
    }

    let dir = env::temp_dir().join("screeny-e2e");
    std::fs::create_dir_all(&dir)
        .map_err(|e| format!("Failed to create E2E export dir: {e}"))?;
    Ok(dir.join("export.gif").to_string_lossy().to_string())
}

// -- Tauri commands ----------------------------------------------------------

#[tauri::command]
pub fn e2e_check() -> bool {
    is_e2e_mode()
}

#[tauri::command]
pub fn e2e_fixture_dir() -> Result<String, String> {
    if !is_e2e_mode() {
        return Err("Not in E2E mode".to_string());
    }
    let path = fixture_path()?;
    PathBuf::from(&path)
        .parent()
        .ok_or_else(|| format!("Fixture path '{path}' has no parent directory"))
        .map(|p| p.to_string_lossy().into_owned())
}

#[tauri::command]
pub fn e2e_save_path() -> Result<Option<String>, String> {
    if !is_e2e_mode() {
        return Err("Not in E2E mode".to_string());
    }
    Ok(Some(export_path()?))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_e2e_check_off_by_default() {
        // Ensure SCREENY_E2E is not set (it shouldn't be in normal test runs)
        env::remove_var("SCREENY_E2E");
        assert!(!is_e2e_mode());
    }

    #[test]
    fn test_fixture_path_override() {
        env::set_var("SCREENY_E2E_FIXTURE", "/tmp/custom.gif");
        let result = fixture_path().unwrap();
        assert_eq!(result, "/tmp/custom.gif");
        env::remove_var("SCREENY_E2E_FIXTURE");
    }

    #[test]
    fn test_export_path_override() {
        env::set_var("SCREENY_E2E_EXPORT", "/tmp/custom-export.gif");
        let result = export_path().unwrap();
        assert_eq!(result, "/tmp/custom-export.gif");
        env::remove_var("SCREENY_E2E_EXPORT");
    }
}
