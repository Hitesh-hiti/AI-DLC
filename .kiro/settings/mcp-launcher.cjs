
const path = require("node:path");
const { spawn } = require("node:child_process");

const projectRoot = path.resolve(__dirname, "../..");
const slackRoot = path.join(projectRoot, "slack");
const serverPath = path.join(slackRoot, "dist", "index.js");

const child = spawn(process.execPath, [serverPath], {
  cwd: slackRoot,
  env: process.env,
  stdio: "inherit",
});

child.on("error", (error) => {
  console.error("[MCP Launcher] Failed to start:", error);
  process.exitCode = 1;
});

child.on("exit", (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0);
});
