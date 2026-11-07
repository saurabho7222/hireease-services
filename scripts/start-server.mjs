import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");

const port = process.env.PORT || "3000";
const host = process.env.HOST || "127.0.0.1";

const wranglerBin = path.join(projectRoot, "node_modules", "wrangler", "bin", "wrangler.js");
const configFile = path.join(projectRoot, "dist", "server", "wrangler.json");
const sitesEnv = path.join(projectRoot, "scripts", "sites-env.mjs");

const args = [
  "--import",
  sitesEnv,
  wranglerBin,
  "dev",
  "--config",
  configFile,
  "--local",
  "--persist-to",
  ".wrangler/state",
  "--ip",
  host,
  "--port",
  port,
  "--inspector-port",
  "0",
];

console.log(`[HireEase] Starting production server on http://${host}:${port}...`);

const child = spawn(process.execPath, args, {
  cwd: projectRoot,
  stdio: "inherit",
  env: {
    ...process.env,
    NODE_ENV: "production",
  },
});

child.on("exit", (code, signal) => {
  if (code !== 0 && code !== null) {
    console.error(`[HireEase] Process exited with code ${code} / signal ${signal}`);
  }
  process.exit(code ?? 0);
});

// Forward termination signals gracefully
process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));

