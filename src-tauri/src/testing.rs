use std::env;
use std::sync::Mutex;

/// Process-wide lock for tests that mutate environment variables.
///
/// Acquire before calling `EnvGuard::set` or `EnvGuard::remove` to prevent
/// races with other test threads that read the same keys.
pub static ENV_LOCK: Mutex<()> = Mutex::new(());

/// Temporarily sets or removes an environment variable for the duration of a test.
///
/// Saves the previous value on construction and restores it on drop, so the
/// environment is left in exactly the same state even if the test panics.
pub struct EnvGuard {
    key: &'static str,
    previous: Option<String>,
}

impl EnvGuard {
    /// Set `key` to `value` for the duration of the guard.
    pub fn set(key: &'static str, value: &str) -> Self {
        let previous = env::var(key).ok();
        env::set_var(key, value);
        EnvGuard { key, previous }
    }

    /// Remove `key` for the duration of the guard.
    pub fn remove(key: &'static str) -> Self {
        let previous = env::var(key).ok();
        env::remove_var(key);
        EnvGuard { key, previous }
    }
}

impl Drop for EnvGuard {
    fn drop(&mut self) {
        match &self.previous {
            Some(v) => env::set_var(self.key, v),
            None => env::remove_var(self.key),
        }
    }
}
