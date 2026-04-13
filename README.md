# Screeny

A cross-platform GIF recording and editing application built with Tauri, SvelteKit, and Rust.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Svelte](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer).

## Testing

### Unit Tests

Fast frontend unit tests using Vitest:

```sh
pnpm test:unit
```

### E2E Tests

Full-stack end-to-end tests that exercise the Svelte UI, Tauri IPC boundary, and Rust backend together using WebDriver.

#### Prerequisites

1. **Build the Tauri app** (E2E tests run against the release binary):
   ```sh
   pnpm tauri build
   ```
   Note: on some Linux setups the AppImage bundling step may fail — the release binary at
   `src-tauri/target/release/screeny` is still produced and is all the E2E harness needs.

2. **Install `tauri-driver`**:
   ```sh
   cargo install tauri-driver
   ```

3. **WebKitWebDriver** must be available on `PATH`. On most Linux distributions this is provided by the `webkit2gtk` or
   `webkit2gtk-driver` package. Check:
   ```sh
   which WebKitWebDriver
   ```

4. **Display / session**: the tests launch a real GUI window, so a running display server is required. On Wayland
   compositors (e.g. Hyprland) the current session works. In headless CI, use a virtual framebuffer:
   ```sh
   # Example with weston
   weston --backend=headless &
   export WAYLAND_DISPLAY=wayland-0
   ```

5. **Test fixture**: `tests/fixtures/test.gif` must exist. It is checked into the repo. To regenerate:
   ```sh
   cargo test --manifest-path src-tauri/Cargo.toml --test generate_fixture -- --ignored
   ```

#### Running

```sh
pnpm test:e2e
```

This launches `tauri-driver` → `WebKitWebDriver` → the Screeny release binary with `SCREENY_E2E=1`, then runs 13
scenarios covering app launch, GIF open, frame selection, frame deletion, and export.

#### E2E Mode

When `SCREENY_E2E=1` is set, the app exposes deterministic Tauri commands (`e2e_open_fixture`, `e2e_save_path`) that
bypass native file dialogs, using fixture/temp paths instead. This keeps tests reliable without platform dialog
automation.

Environment variable overrides:

- `SCREENY_E2E_FIXTURE` — custom path to the input GIF fixture
- `SCREENY_E2E_EXPORT` — custom path for export output (defaults to `/tmp/screeny-e2e/export.gif`)

### Known Limitations

- **macOS**: `tauri-driver` does not support macOS. E2E tests are Linux and Windows only.
- **Windows**: not yet tested or set up. `tauri-driver` supports Windows via the Edge WebDriver, but the wdio config and
  prerequisites need adapting.
- **WebKitWebDriver click interactability**: some elements require JavaScript-based clicks (
  `browser.execute(el => el.click(), element)`) because WebKitWebDriver rejects standard WebDriver clicks on certain
  toolbar buttons despite them being visible and enabled.
- **wdio v9 / `@wdio/tauri-service`**: the official Tauri wdio service requires wdio v8 and is incompatible with v9. The
  harness manages `tauri-driver` lifecycle manually via `beforeSession`/`afterSession` hooks.
