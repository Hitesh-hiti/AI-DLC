const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

// Expected layout:
// <projectRoot>/slack/mcp-launcher.cjs
// <projectRoot>/slack/dist/index.js
const projectRoot = path.resolve(__dirname, "../..");
const slackRoot = path.join(projectRoot, "slack");
const serverPath = path.join(slackRoot, "dist", "index.js");
const logDir = path.join(projectRoot, "logs");
const logFile = path.join(logDir, "mcp-launcher.log");
const historyDir = path.join(projectRoot,"phases","requirement-gap-analysis");

function log(message, error) {
  const detail =
    error instanceof Error
      ? error.stack || error.message
      : error === undefined
        ? ""
        : String(error);

  const line = `${new Date().toISOString()} ${message}${
    detail ? `\n${detail}` : ""
  }\n`;

  try {
    fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(logFile, line, "utf8");
  } catch (loggingError) {
    // Keep diagnostics available even if file logging fails.
    console.error("[MCP Launcher] Could not write launcher log:", loggingError);
  }

  console.error(`[MCP Launcher] ${message}`, detail);
}

log("Launcher process started");
log(`Project root: ${projectRoot}`);
log(`Slack server entry point: ${serverPath}`);

if (!fs.existsSync(serverPath)) {
  const error = new Error(
    `MCP server entry point was not found: ${serverPath}. Build the Slack MCP server and verify the launcher path.`
  );
  log("Cannot start MCP server", error);
  process.exit(1);
}

// Keep cwd at slackRoot so dotenv/config can load slack/.env by default.
// KIRO_PROJECT_ROOT gives the server an explicit project-root path.
// The server source must use this variable when resolving HISTORY_FILE.
const childEnv = {
  ...process.env,
  KIRO_PROJECT_ROOT: process.env.KIRO_PROJECT_ROOT || projectRoot,
  HISTORY_DIR: process.env.KIRO_PROJECT_ROOT || historyDir
};

log("Starting Slack MCP server");

const child = spawn(process.execPath, [serverPath], {
  cwd: slackRoot,
  env: childEnv,
  stdio: "inherit",
});

child.on("error", (error) => {
  log("Failed to start Slack MCP server", error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  log(
    `Slack MCP server exited (code=${code ?? "null"}, signal=${signal ?? "none"})`
  );
  process.exitCode = code ?? (signal ? 1 : 0);
});
