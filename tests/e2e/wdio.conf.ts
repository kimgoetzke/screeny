import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const appBinary = resolve(repoRoot, "src-tauri/target/release/screeny");

let tauriDriver: ChildProcess;

export const config = {
  runner: "local",
  hostname: "127.0.0.1",
  port: 4444,
  specs: [
    resolve(repoRoot, "tests/e2e/specs/splashscreen.ts"),
    resolve(repoRoot, "tests/e2e/specs/app-launch.ts"),
    resolve(repoRoot, "tests/e2e/specs/open-close.ts"),
    resolve(repoRoot, "tests/e2e/specs/import.ts"),
    resolve(repoRoot, "tests/e2e/specs/playback.ts"),
    resolve(repoRoot, "tests/e2e/specs/frame-editing.ts"),
    resolve(repoRoot, "tests/e2e/specs/keyboard.ts"),
    resolve(repoRoot, "tests/e2e/specs/canvas.ts"),
    resolve(repoRoot, "tests/e2e/specs/inspector.ts"),
  ],
  maxInstances: 1,
  capabilities: [
    {
      alwaysMatch: {
        "tauri:options": {
          application: appBinary,
        },
      },
      firstMatch: [{}],
    },
  ],
  framework: "mocha",
  reporters: ["spec"],
  mochaOpts: {
    ui: "bdd",
    timeout: 60_000,
  },

  // Start tauri-driver before each WebDriver session
  beforeSession() {
    tauriDriver = spawn("tauri-driver", [], {
      stdio: ["ignore", "pipe", "pipe"],
      env: {
        ...process.env,
        SCREENY_E2E: "1",
      },
    });

    // Give tauri-driver time to bind port 4444
    return new Promise<void>((resolve) => setTimeout(resolve, 500));
  },

  // Stop tauri-driver after each session
  afterSession() {
    tauriDriver?.kill();
  },
};
