import { spawn, type ChildProcess } from "node:child_process";
import { resolve } from "node:path";

const repoRoot = resolve(import.meta.dirname, "../..");
const appBinary = resolve(repoRoot, "src-tauri/target/release/screeny");

let tauriDriver: ChildProcess;

export const config: WebdriverIO.Config = {
  runner: "local",
  hostname: "127.0.0.1",
  port: 4444,
  specs: [resolve(repoRoot, "tests/e2e/specs/**/*.ts")],
  maxInstances: 1,
  capabilities: [
    {
      // @ts-expect-error — wdio types don't include alwaysMatch W3C format
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
