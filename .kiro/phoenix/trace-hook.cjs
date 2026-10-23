"use strict";

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const { NodeSDK } = require("@opentelemetry/sdk-node");
const {
  trace,
  context,
  SpanKind,
  SpanStatusCode,
} = require("@opentelemetry/api");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-proto");

const PROJECT_ROOT = process.cwd();

const PHOENIX_DIR = path.join(
  PROJECT_ROOT,
  ".kiro",
  "phoenix"
);

const STATE_DIR = path.join(
  PHOENIX_DIR,
  "trace-state"
);

const TOOL_STATE_DIR = path.join(
  STATE_DIR,
  "tools"
);

const ERROR_LOG = path.join(
  PHOENIX_DIR,
  "phoenix-errors.log"
);

const PHOENIX_ENDPOINT = normalizeEndpoint(
  process.env.PHOENIX_COLLECTOR_ENDPOINT ||
    "http://localhost:6006/v1/traces"
);

const PHOENIX_PROJECT_NAME =
  process.env.PHOENIX_PROJECT_NAME ||
  "kiro-ide-travel-platform";

const SERVICE_NAME =
  process.env.PHOENIX_SERVICE_NAME ||
  "kiro-ide";

const TRACER_NAME =
  process.env.PHOENIX_TRACER_NAME ||
  "kiro-ide-phoenix";

const TRACER_VERSION = "2.0.0";

const MAX_ATTRIBUTE_LENGTH = Number(
  process.env.PHOENIX_MAX_ATTRIBUTE_LENGTH || 8000
);

const EXPORT_TIMEOUT_MS = Number(
  process.env.PHOENIX_EXPORT_TIMEOUT_MS || 2000
);

/* =========================================================
 * Logging
 * ======================================================= */

function logError(error) {
  try {
    fs.mkdirSync(PHOENIX_DIR, {
      recursive: true,
    });

    fs.appendFileSync(
      ERROR_LOG,
      `${new Date().toISOString()} ${
        error?.stack || error
      }\n`
    );
  } catch {
    // Observability must never break Kiro.
  }
}

/* =========================================================
 * Endpoint normalization
 * ======================================================= */

function normalizeEndpoint(value) {
  let endpoint = String(value || "").trim();

  const markdownMatch = endpoint.match(
    /^\[[^\]]+\]\((https?:\/\/[^)]+)\)$/
  );

  if (markdownMatch) {
    endpoint = markdownMatch[1];
  }

  return endpoint;
}

/* =========================================================
 * Input
 * ======================================================= */

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];

    process.stdin.on("data", (chunk) => {
      chunks.push(chunk);
    });

    process.stdin.on("end", () => {
      resolve(
        Buffer.concat(chunks).toString("utf8")
      );
    });
  });
}

function parseEvent(raw) {
  if (!raw || !raw.trim()) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    logError(
      new Error(
        `Unable to parse Kiro hook JSON: ${error.message}`
      )
    );

    return {};
  }
}

/* =========================================================
 * Stub main - placeholder for full implementation
 * ======================================================= */

async function main() {
  try {
    const raw = await readStdin();
    const event = parseEvent(raw);

    const exporter = new OTLPTraceExporter({
      url: PHOENIX_ENDPOINT,
    });

    const sdk = new NodeSDK({
      traceExporter: exporter,
    });

    await sdk.start();

    const tracer = trace.getTracer(
      TRACER_NAME,
      TRACER_VERSION
    );

    const span = tracer.startSpan("kiro.hook");
    span.setStatus({ code: SpanStatusCode.OK });
    span.end();

    await sdk.shutdown();
  } catch (error) {
    logError(error);
    process.exit(1);
  }
}

main().catch((error) => {
  logError(error);
  process.exit(1);
});
