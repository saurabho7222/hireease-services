import vinext from "vinext";
import { defineConfig } from "vite";
import fs from "node:fs";
import path from "node:path";
import hostingConfig from "./.openai/hosting.json";
import { readExecutionProfile } from "./scripts/execution-profile.mjs";
import { sites } from "./build/sites-vite-plugin";
import { connectorPreview } from "./build/connector-preview-plugin.mjs";

const SITE_CREATOR_PLACEHOLDER_DATABASE_ID =
  "00000000-0000-4000-8000-000000000000";

const { d1, r2 } = hostingConfig;

// macOS Seatbelt blocks FSEvents, so Codex previews need polling for HMR.
const isCodexSeatbeltSandbox = process.env.CODEX_SANDBOX === "seatbelt";
const managedLinux = readExecutionProfile() === "managed-linux";

const localBindingConfig = {
  main: "./build/sites-worker.ts",
  compatibility_flags: ["nodejs_compat"],
  d1_databases: d1
    ? [
        {
          binding: d1,
          database_name: "site-creator-d1",
          database_id: SITE_CREATOR_PLACEHOLDER_DATABASE_ID,
        },
      ]
    : [],
  r2_buckets: r2
    ? [
        {
          binding: r2,
          bucket_name: "site-creator-r2",
        },
      ]
    : [],
};

export default defineConfig(async ({ command }) => {
  // Use Miniflare's local Request.cf placeholder unless fetching is requested.
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= "false";
  process.env.WRANGLER_SEND_METRICS ??= "false";

  // Keep Wrangler and Miniflare state project-local. These are non-secret tool
  // settings; application environment belongs in ignored `.env*` files.
  process.env.WRANGLER_WRITE_LOGS ??= "false";
  process.env.WRANGLER_LOG_PATH ??= ".wrangler/logs";
  process.env.WRANGLER_REGISTRY_PATH ??= ".wrangler/dev-registry";
  process.env.MINIFLARE_REGISTRY_PATH ??= ".wrangler/registry";

  // Wrangler snapshots its log path while the Cloudflare plugin is imported.
  const { cloudflare } = await import("@cloudflare/vite-plugin");

  return {
    server: {
      ...(managedLinux
        ? { host: "0.0.0.0", allowedHosts: ["terminal.local"] }
        : {}),
      ...(isCodexSeatbeltSandbox
        ? { watch: { useFsEvents: false, usePolling: true } }
        : {}),
    },
    plugins: [
      {
        name: "security-headers",
        configureServer(server: any) {
          server.middlewares.use((_req: any, res: any, next: any) => {
            res.setHeader("X-Frame-Options", "DENY");
            res.setHeader("X-Content-Type-Options", "nosniff");
            res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
            res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), browsing-topics=()");
            res.setHeader(
              "Content-Security-Policy",
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://accounts.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: https: blob:; connect-src 'self' https://accounts.google.com https://oauth2.googleapis.com https://api.github.com https://api.resend.com; frame-src https://accounts.google.com; object-src 'none'; base-uri 'self'; form-action 'self'"
            );
            next();
          });
        },
      },
      {
        name: "resume-file-bridge",
        configureServer(server: any) {
          const resumesDir = path.join(process.cwd(), "public", "resumes");
          if (!fs.existsSync(resumesDir)) {
            fs.mkdirSync(resumesDir, { recursive: true });
          }

          server.middlewares.use("/__hireease_resume_bridge/save", async (req: any, res: any) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end("Method Not Allowed");
              return;
            }
            const fileName = req.headers["x-resume-filename"];
            if (
              !fileName ||
              typeof fileName !== "string" ||
              !fileName.toLowerCase().endsWith(".pdf") ||
              fileName.includes("..") ||
              fileName.includes("/") ||
              fileName.includes("\\")
            ) {
              res.statusCode = 400;
              res.end("Invalid filename");
              return;
            }

            const chunks: Buffer[] = [];
            req.on("data", (chunk: Buffer) => chunks.push(chunk));
            req.on("end", () => {
              try {
                const buffer = Buffer.concat(chunks);
                const targetPath = path.join(resumesDir, fileName);
                fs.writeFileSync(targetPath, buffer);
                res.statusCode = 200;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify({ success: true, path: `/resumes/${fileName}` }));
              } catch (err: any) {
                res.statusCode = 500;
                res.end(err?.message || "Failed to write resume file");
              }
            });
          });

          server.middlewares.use("/__hireease_resume_bridge/delete", async (req: any, res: any) => {
            if (req.method !== "POST") {
              res.statusCode = 405;
              res.end("Method Not Allowed");
              return;
            }
            const fileName = req.headers["x-resume-filename"];
            if (
              fileName &&
              typeof fileName === "string" &&
              fileName.toLowerCase().endsWith(".pdf") &&
              !fileName.includes("..")
            ) {
              const safeName = path.basename(fileName);
              const targetPath = path.join(resumesDir, safeName);
              if (fs.existsSync(targetPath)) {
                try {
                  fs.unlinkSync(targetPath);
                } catch {}
              }
            }
            res.statusCode = 200;
            res.end("OK");
          });
        },
      },
      vinext(),
      sites({ mockAuth: !managedLinux }),
      connectorPreview(),
      cloudflare({
        viteEnvironment: { name: "rsc", childEnvironments: ["ssr"] },
        inspectorPort: false,
        config: {
          ...localBindingConfig,
          ...(command === "serve"
            ? {
                services: [
                  {
                    binding: "CONNECTORS",
                    service: "sites-connector-preview",
                    entrypoint: "ConnectorPreview",
                  },
                ],
              }
            : {}),
        },
        ...(command === "serve"
          ? {
              auxiliaryWorkers: [
                {
                  config: {
                    name: "sites-connector-preview",
                    main: "./build/connector-preview-worker.mjs",
                    compatibility_date: "2026-05-15",
                  },
                },
              ],
            }
          : {}),
      }),
    ],
  };
});
