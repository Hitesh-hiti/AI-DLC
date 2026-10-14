<<<<<<< HEAD
const fs = require("fs");
const path = require("path");

const { NodeSDK } = require("@opentelemetry/sdk-node");
const { trace } = require("@opentelemetry/api");
=======
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
>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-proto");

<<<<<<< HEAD
const PHOENIX_ENDPOINT =
  process.env.PHOENIX_COLLECTOR_ENDPOINT ||
  "http://localhost:6006/v1/traces";

const PROJECT_ROOT = process.cwd();

function logError(error) {
  try {
    fs.appendFileSync(
      path.join(PROJECT_ROOT, ".kiro", "phoenix", "phoenix-errors.log"),
      `${new Date().toISOString()} ${error?.stack || error}\n`
=======
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
>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
    );
  } catch {
    // Observability must never break Kiro.
  }
}

<<<<<<< HEAD
=======

/* =========================================================
 * Endpoint normalization
 *
 * Protects against accidentally putting a Markdown link
 * into PHOENIX_COLLECTOR_ENDPOINT.
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

>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];

    process.stdin.on("data", (chunk) => {
      chunks.push(chunk);
    });

    process.stdin.on("end", () => {
<<<<<<< HEAD
      resolve(Buffer.concat(chunks).toString("utf8"));
=======
      resolve(
        Buffer.concat(chunks).toString("utf8")
      );
>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
    });
  });
}

function parseEvent(raw) {
<<<<<<< HEAD
  if (!raw) {
=======
  if (!raw || !raw.trim()) {
>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
    return {};
  }

  try {
    return JSON.parse(raw);
<<<<<<< HEAD
  } catch {
=======
  } catch (error) {
    logError(
      new Error(
        `Unable to parse Kiro hook JSON: ${error.message}`
      )
    );

>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
    return {};
  }
}

<<<<<<< HEAD
=======

/* =========================================================
 * Kiro event normalization
 * ======================================================= */

function normalizeHookEvent(event) {
  const raw =
    process.env.KIRO_HOOK_EVENT ||
    event.hook_event_name ||
    event.hookEventName ||
    event.trigger ||
    event.event ||
    "UserPromptSubmit";

  const normalized = String(raw)
    .trim()
    .toLowerCase();

  switch (normalized) {
    case "promptsubmit":
    case "userpromptsubmit":
    case "user_prompt_submit":
      return "UserPromptSubmit";

    case "pretooluse":
    case "pre_tool_use":
      return "PreToolUse";

    case "posttooluse":
    case "post_tool_use":
      return "PostToolUse";

    case "stop":
      return "Stop";

    default:
      return String(raw);
  }
}


/* =========================================================
 * Session / IDs
 * ======================================================= */

function getSessionId(event) {
  return (
    event.session_id ||
    event.sessionId ||
    process.env.KIRO_SESSION_ID ||
    "unknown-session"
  );
}

function getToolName(event) {
  return (
    event.tool_name ||
    event.toolName ||
    event.tool ||
    "unknown-tool"
  );
}

function getToolCallId(event) {
  return (
    event.tool_call_id ||
    event.toolCallId ||
    event.tool_use_id ||
    event.toolUseId ||
    event.request_id ||
    event.requestId ||
    event.id ||
    null
  );
}

function createId() {
  return crypto.randomUUID();
}

function hashKey(value) {
  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex");
}


/* =========================================================
 * Filesystem state
 * ======================================================= */

function ensureStateDirectories() {
  fs.mkdirSync(STATE_DIR, {
    recursive: true,
  });

  fs.mkdirSync(TOOL_STATE_DIR, {
    recursive: true,
  });
}

function sessionStatePath(sessionId) {
  return path.join(
    STATE_DIR,
    `session-${hashKey(sessionId)}.json`
  );
}

function toolStatePath(toolCallId) {
  return path.join(
    TOOL_STATE_DIR,
    `tool-${hashKey(toolCallId)}.json`
  );
}

function writeJson(file, value) {
  fs.writeFileSync(
    file,
    JSON.stringify(value, null, 2),
    "utf8"
  );
}

function readJson(file) {
  try {
    return JSON.parse(
      fs.readFileSync(file, "utf8")
    );
  } catch {
    return null;
  }
}

function deleteFile(file) {
  try {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  } catch {
    // Ignore cleanup errors.
  }
}

function loadSessionState(sessionId) {
  return readJson(
    sessionStatePath(sessionId)
  );
}

function saveSessionState(sessionId, state) {
  ensureStateDirectories();

  writeJson(
    sessionStatePath(sessionId),
    state
  );
}


/* =========================================================
 * Tool state correlation
 * ======================================================= */

function saveToolState(state) {
  ensureStateDirectories();

  writeJson(
    toolStatePath(state.toolCallId),
    state
  );
}

function loadToolState(toolCallId) {
  if (!toolCallId) {
    return null;
  }

  return readJson(
    toolStatePath(toolCallId)
  );
}

function removeToolState(toolCallId) {
  if (!toolCallId) {
    return;
  }

  deleteFile(
    toolStatePath(toolCallId)
  );
}

/**
 * Kiro versions/payloads may not expose a stable tool-call ID.
 * In that case, find the newest pending invocation matching
 * the session and tool name.
 */
function findLatestPendingToolState(
  sessionId,
  toolName
) {
  ensureStateDirectories();

  let files;

  try {
    files = fs.readdirSync(
      TOOL_STATE_DIR
    );
  } catch {
    return null;
  }

  const candidates = [];

  for (const file of files) {
    if (!file.endsWith(".json")) {
      continue;
    }

    const state = readJson(
      path.join(TOOL_STATE_DIR, file)
    );

    if (!state) {
      continue;
    }

    if (
      state.sessionId !== sessionId ||
      state.toolName !== toolName
    ) {
      continue;
    }

    candidates.push(state);
  }

  candidates.sort(
    (a, b) =>
      Number(b.startedAt || 0) -
      Number(a.startedAt || 0)
  );

  return candidates[0] || null;
}


/* =========================================================
 * Safe attribute helpers
 * ======================================================= */

function setStringAttribute(
  span,
  name,
  value,
  maxLength = MAX_ATTRIBUTE_LENGTH
) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return;
  }

  const stringValue = String(value);

  span.setAttribute(
    name,
    stringValue.slice(0, maxLength)
  );
}

function setNumberAttribute(
  span,
  name,
  value
) {
  if (
    value === undefined ||
    value === null ||
    Number.isNaN(Number(value))
  ) {
    return;
  }

  span.setAttribute(
    name,
    Number(value)
  );
}

function setBooleanAttribute(
  span,
  name,
  value
) {
  if (
    value === undefined ||
    value === null
  ) {
    return;
  }

  span.setAttribute(
    name,
    Boolean(value)
  );
}

function setJsonAttribute(
  span,
  name,
  value
) {
  if (
    value === undefined ||
    value === null
  ) {
    return;
  }

  try {
    setStringAttribute(
      span,
      name,
      JSON.stringify(value)
    );
  } catch {
    // Ignore values that cannot be serialized.
  }
}


/* =========================================================
 * Prompt / tool payload extraction
 * ======================================================= */

function getPrompt(event) {
  return (
    event.userPrompt ||
    event.prompt ||
    event.user_prompt ||
    process.env.USER_PROMPT ||
    ""
  );
}

function getToolInput(event) {
  return (
    event.tool_input ||
    event.toolInput ||
    event.input ||
    null
  );
}

function getToolOutput(event) {
  return (
    event.tool_result ||
    event.toolResult ||
    event.tool_output ||
    event.toolOutput ||
    event.result ||
    event.output ||
    null
  );
}

function getToolSuccess(event) {
  if (
    typeof event.success === "boolean"
  ) {
    return event.success;
  }

  if (
    typeof event.tool_success === "boolean"
  ) {
    return event.tool_success;
  }

  if (event.error) {
    return false;
  }

  if (event.tool_error) {
    return false;
  }

  return true;
}


/* =========================================================
 * Routing
 *
 * Preserves the routing behavior from your existing hook.
 * ======================================================= */

>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
function loadAgents() {
  const file = path.join(
    PROJECT_ROOT,
    ".kiro",
    "agents",
    "agentspicker.json"
  );

  try {
<<<<<<< HEAD
=======
    if (!fs.existsSync(file)) {
      return null;
    }

>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
    return JSON.parse(
      fs.readFileSync(file, "utf8")
    );
  } catch (error) {
    logError(error);
    return null;
  }
}

function findRouting(event, config) {
  if (!config?.agents) {
    return null;
  }

  const prompt = String(
<<<<<<< HEAD
    event.userPrompt ||
    event.prompt ||
    process.env.USER_PROMPT ||
    ""
=======
    getPrompt(event)
>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
  ).toLowerCase();

  if (!prompt) {
    return null;
  }

  const candidates = [];

<<<<<<< HEAD
  for (const [key, agent] of Object.entries(config.agents)) {
    const keywords = Array.isArray(agent.keywords)
      ? agent.keywords
      : [];

    const matchedKeywords = keywords.filter((keyword) =>
      prompt.includes(String(keyword).toLowerCase())
    );

    if (matchedKeywords.length === 0) {
=======
  for (const [key, agent] of Object.entries(
    config.agents
  )) {
    const keywords = Array.isArray(
      agent.keywords
    )
      ? agent.keywords
      : [];

    const matchedKeywords =
      keywords.filter((keyword) => {
        const normalized =
          String(keyword)
            .toLowerCase()
            .trim();

        return (
          normalized.length > 0 &&
          prompt.includes(normalized)
        );
      });

    if (
      matchedKeywords.length === 0
    ) {
>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
      continue;
    }

    candidates.push({
      key,
      agent,
      matchedKeywords,
    });
  }

<<<<<<< HEAD
  if (candidates.length === 0) {
=======
  if (
    candidates.length === 0
  ) {
>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
    return null;
  }

  const priorityOrder =
    config.routing?.priority || [];

  candidates.sort((a, b) => {
<<<<<<< HEAD
    const aPriority = priorityOrder.indexOf(
      a.agent.category
    );

    const bPriority = priorityOrder.indexOf(
      b.agent.category
    );
=======
    const aPriority =
      priorityOrder.indexOf(
        a.agent.category
      );

    const bPriority =
      priorityOrder.indexOf(
        b.agent.category
      );
>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0

    const aRank =
      aPriority === -1
        ? Number.MAX_SAFE_INTEGER
        : aPriority;

    const bRank =
      bPriority === -1
        ? Number.MAX_SAFE_INTEGER
        : bPriority;

    if (aRank !== bRank) {
      return aRank - bRank;
    }

    return (
      Number(a.agent.priority || 999) -
      Number(b.agent.priority || 999)
    );
  });

  const selected = candidates[0];

  return {
    targetAgent: selected.key,
    agentName: selected.agent.name,
    category: selected.agent.category,
    model: selected.agent.model,
    priority: selected.agent.priority,
<<<<<<< HEAD
    matchedKeywords: selected.matchedKeywords,
  };
}

async function main() {
  const raw = await readStdin();
  const event = parseEvent(raw);

  const hookEvent =
    process.env.KIRO_HOOK_EVENT ||
    event.hookEventName ||
    event.trigger ||
    "PromptSubmit";

  const projectName =
    process.env.PHOENIX_PROJECT_NAME ||
    "kiro-ide-travel-platform";

  const agentsConfig = loadAgents();

  const routing = findRouting(
    event,
    agentsConfig
  );

  const exporter = new OTLPTraceExporter({
    url: PHOENIX_ENDPOINT,
  });

  const sdk = new NodeSDK({
    traceExporter: exporter,
  });

  try {
    await sdk.start();

    const tracer = trace.getTracer(
      "kiro-ide-phoenix",
      "1.0.0"
    );

    const span = tracer.startSpan(
      `kiro.${hookEvent}`
    );

    span.setAttribute(
      "service.name",
      "kiro-ide"
    );

    span.setAttribute(
      "phoenix.project.name",
      projectName
    );

    span.setAttribute(
      "kiro.hook_event",
      hookEvent
    );

    span.setAttribute(
      "kiro.project",
      PROJECT_ROOT
    );

    if (event.session_id) {
      span.setAttribute(
        "kiro.session_id",
        String(event.session_id)
      );
    }

    const prompt =
      event.userPrompt ||
      event.prompt ||
      process.env.USER_PROMPT;

    if (prompt) {
      span.setAttribute(
        "kiro.user_prompt",
        String(prompt)
      );
    }

    if (routing) {
      span.setAttribute(
        "kiro.target_agent",
        routing.targetAgent
      );

      span.setAttribute(
        "kiro.agent_name",
        routing.agentName
      );

      span.setAttribute(
        "kiro.category",
        routing.category
      );

      if (routing.model) {
        span.setAttribute(
          "kiro.model",
          routing.model
        );
      }

      if (routing.priority !== undefined) {
        span.setAttribute(
          "kiro.priority",
          Number(routing.priority)
        );
      }

      span.setAttribute(
        "kiro.matched_keywords",
        routing.matchedKeywords.join(", ")
=======
    matchedKeywords:
      selected.matchedKeywords,
  };
}


/* =========================================================
 * Span context persistence
 *
 * Kiro starts a fresh Node process for each hook invocation.
 * Therefore the OpenTelemetry context cannot remain in memory.
 *
 * We persist the trace/span IDs and reconstruct the parent
 * context in the next hook process.
 * ======================================================= */

function serializeSpanContext(span) {
  const spanContext =
    span.spanContext();

  return {
    traceId: spanContext.traceId,
    spanId: spanContext.spanId,
    traceFlags:
      spanContext.traceFlags || 1,
  };
}

function isValidSpanContext(
  spanContext
) {
  return (
    spanContext &&
    typeof spanContext.traceId === "string" &&
    typeof spanContext.spanId === "string" &&
    spanContext.traceId.length === 32 &&
    spanContext.spanId.length === 16
  );
}

function contextFromSpanContext(
  spanContext
) {
  if (
    !isValidSpanContext(
      spanContext
    )
  ) {
    return context.active();
  }

  return trace.setSpanContext(
    context.active(),
    {
      traceId:
        spanContext.traceId,
      spanId:
        spanContext.spanId,
      traceFlags:
        spanContext.traceFlags || 1,
      isRemote: true,
    }
  );
}

function startChildSpan(
  tracer,
  name,
  parentSpanContext,
  options = {}
) {
  const parentContext =
    contextFromSpanContext(
      parentSpanContext
    );

  return tracer.startSpan(
    name,
    {
      kind:
        options.kind ||
        SpanKind.INTERNAL,
      attributes:
        options.attributes || {},
    },
    parentContext
  );
}


/* =========================================================
 * Common span metadata
 * ======================================================= */

function annotateCommon(
  span,
  event,
  hookEvent,
  sessionId,
  turnState
) {
  setStringAttribute(
    span,
    "service.name",
    SERVICE_NAME
  );

  setStringAttribute(
    span,
    "openinference.project.name",
    PHOENIX_PROJECT_NAME
  );

  setStringAttribute(
    span,
    "phoenix.project.name",
    PHOENIX_PROJECT_NAME
  );

  setStringAttribute(
    span,
    "kiro.hook_event",
    hookEvent
  );

  setStringAttribute(
    span,
    "kiro.project",
    PROJECT_ROOT,
    1000
  );

  setStringAttribute(
    span,
    "kiro.session_id",
    sessionId
  );

  if (turnState) {
    setStringAttribute(
      span,
      "kiro.turn_id",
      turnState.turnId
    );

    if (turnState.routing) {
      annotateRouting(
        span,
        turnState.routing
      );
    }
  }

  if (event.request_id) {
    setStringAttribute(
      span,
      "kiro.request_id",
      event.request_id
    );
  }

  if (event.requestId) {
    setStringAttribute(
      span,
      "kiro.request_id",
      event.requestId
    );
  }
}

function annotateRouting(
  span,
  routing
) {
  if (!routing) {
    setBooleanAttribute(
      span,
      "kiro.routing.selected",
      false
    );

    return;
  }

  setStringAttribute(
    span,
    "kiro.target_agent",
    routing.targetAgent
  );

  setStringAttribute(
    span,
    "kiro.agent_name",
    routing.agentName
  );

  setStringAttribute(
    span,
    "kiro.category",
    routing.category
  );

  setStringAttribute(
    span,
    "kiro.model",
    routing.model
  );

  setNumberAttribute(
    span,
    "kiro.priority",
    routing.priority
  );

  setStringAttribute(
    span,
    "kiro.matched_keywords",
    routing.matchedKeywords.join(", ")
  );

  setNumberAttribute(
    span,
    "kiro.routing.matched_keyword_count",
    routing.matchedKeywords.length
  );

  setBooleanAttribute(
    span,
    "kiro.routing.selected",
    true
  );
}


/* =========================================================
 * UserPromptSubmit
 * ======================================================= */

async function handleUserPromptSubmit(
  tracer,
  event,
  sessionId,
  routing
) {
  const turnId = createId();

  const span = tracer.startSpan(
    "kiro.agent.turn",
    {
      kind: SpanKind.INTERNAL,
    }
  );

  span.setStatus({
    code: SpanStatusCode.OK,
  });

  span.setStatus({
    code: SpanStatusCode.ERROR,
    message: "Kiro tool execution failed",
  });
  const startedAt =
    Date.now();

  try {
    annotateCommon(
      span,
      event,
      "UserPromptSubmit",
      sessionId,
      {
        turnId,
        routing,
      }
    );

    // OpenInference semantic convention.
    setStringAttribute(
      span,
      "openinference.span.kind",
      "AGENT"
    );

    const prompt =
      getPrompt(event);

    const capturePrompts =
      process.env.PHOENIX_CAPTURE_PROMPTS !==
      "false";

    if (
      capturePrompts &&
      prompt
    ) {
      setStringAttribute(
        span,
        "input.value",
        prompt
      );

      setStringAttribute(
        span,
        "input.mime_type",
        "text/plain"
      );

      setStringAttribute(
        span,
        "kiro.user_prompt",
        prompt
      );
    }

    setStringAttribute(
      span,
      "kiro.evaluation.status",
      "pending"
    );

    setBooleanAttribute(
      span,
      "kiro.evaluation.required",
      true
    );

    if (event.phase) {
      setStringAttribute(
        span,
        "kiro.sdlc.phase",
        event.phase
      );
    }

    if (event.sdlc_phase) {
      setStringAttribute(
        span,
        "kiro.sdlc.phase",
        event.sdlc_phase
      );
    }

    // End this process-local span.
    //
    // The persisted span context becomes the parent for
    // subsequent PreToolUse/PostToolUse/Stop spans.
    span.end();

    const rootSpanContext =
      serializeSpanContext(span);

    const turnState = {
      turnId,
      sessionId,
      startedAt,
      prompt:
        process.env.PHOENIX_CAPTURE_PROMPTS ===
        "false"
          ? undefined
          : String(prompt).slice(
              0,
              MAX_ATTRIBUTE_LENGTH
            ),
      routing,
      rootSpanContext,
    };

    saveSessionState(
      sessionId,
      turnState
    );
  } catch (error) {
    try {
      span.end();
    } catch {
      // Ignore.
    }

    throw error;
  }
}


/* =========================================================
 * PreToolUse
 * ======================================================= */

async function handlePreToolUse(
  tracer,
  event,
  sessionId
) {
  const turnState =
    loadSessionState(sessionId);

  const toolName =
    getToolName(event);

  const suppliedToolCallId =
    getToolCallId(event);

  const toolCallId =
    suppliedToolCallId ||
    createId();

  const startedAt =
    Date.now();

  const span = startChildSpan(
    tracer,
    `kiro.tool.${sanitizeSpanName(
      toolName
    )}`,
    turnState?.rootSpanContext,
    {
      kind: SpanKind.INTERNAL,
    }
  );

  try {
    annotateCommon(
      span,
      event,
      "PreToolUse",
      sessionId,
      turnState
    );

    setStringAttribute(
      span,
      "openinference.span.kind",
      "TOOL"
    );

    setStringAttribute(
      span,
      "tool.name",
      toolName
    );

    setStringAttribute(
      span,
      "kiro.tool_name",
      toolName
    );

    setStringAttribute(
      span,
      "kiro.tool_call_id",
      toolCallId
    );

    setNumberAttribute(
      span,
      "kiro.tool.started_at",
      startedAt
    );

    const captureToolInput =
      process.env.PHOENIX_CAPTURE_TOOL_INPUT ===
      "true";

    const toolInput =
      getToolInput(event);

    if (
      captureToolInput &&
      toolInput !== null
    ) {
      setJsonAttribute(
        span,
        "input.value",
        toolInput
      );

      setStringAttribute(
        span,
        "input.mime_type",
        "application/json"
      );

      setJsonAttribute(
        span,
        "kiro.tool_input",
        toolInput
>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
      );
    }

    span.end();

<<<<<<< HEAD
=======
    const toolSpanContext =
      serializeSpanContext(span);

    saveToolState({
      toolCallId,
      sessionId,
      turnId:
        turnState?.turnId ||
        null,
      toolName,
      startedAt,
      preToolSpanContext:
        toolSpanContext,
      rootSpanContext:
        turnState?.rootSpanContext ||
        null,
    });
  } catch (error) {
    try {
      span.end();
    } catch {
      // Ignore.
    }

    throw error;
  }
}


/* =========================================================
 * PostToolUse
 * ======================================================= */

async function handlePostToolUse(
  tracer,
  event,
  sessionId
) {
  const toolName =
    getToolName(event);

  let toolCallId =
    getToolCallId(event);

  let toolState =
    loadToolState(toolCallId);

  span.setStatus({
    code: success
      ? SpanStatusCode.OK
      : SpanStatusCode.ERROR,
  });

  /*
   * Some Kiro payloads may not expose the same call ID.
   * Fall back to the newest pending invocation.
   */
  if (!toolState) {
    toolState =
      findLatestPendingToolState(
        sessionId,
        toolName
      );

    if (toolState) {
      toolCallId =
        toolState.toolCallId;
    }
  }

  const turnState =
    loadSessionState(sessionId);

  const parentSpanContext =
    toolState?.preToolSpanContext ||
    turnState?.rootSpanContext;

  const span = startChildSpan(
    tracer,
    `kiro.tool.result.${sanitizeSpanName(
      toolName
    )}`,
    parentSpanContext,
    {
      kind: SpanKind.INTERNAL,
    }
  );

  try {
    annotateCommon(
      span,
      event,
      "PostToolUse",
      sessionId,
      turnState
    );

    setStringAttribute(
      span,
      "openinference.span.kind",
      "TOOL"
    );

    setStringAttribute(
      span,
      "tool.name",
      toolName
    );

    setStringAttribute(
      span,
      "kiro.tool_name",
      toolName
    );

    if (toolCallId) {
      setStringAttribute(
        span,
        "kiro.tool_call_id",
        toolCallId
      );
    }

    const completedAt =
      Date.now();

    if (toolState?.startedAt) {
      setNumberAttribute(
        span,
        "kiro.tool.duration_ms",
        completedAt -
          Number(
            toolState.startedAt
          )
      );
    }

    setNumberAttribute(
      span,
      "kiro.tool.completed_at",
      completedAt
    );

    const success =
      getToolSuccess(event);

    setBooleanAttribute(
      span,
      "kiro.tool.success",
      success
    );

    setStringAttribute(
      span,
      "kiro.tool.status",
      success
        ? "success"
        : "error"
    );

    const toolOutput =
      getToolOutput(event);

    const captureToolOutput =
      process.env.PHOENIX_CAPTURE_TOOL_OUTPUT ===
      "true";

    if (
      captureToolOutput &&
      toolOutput !== null
    ) {
      setJsonAttribute(
        span,
        "output.value",
        toolOutput
      );

      setStringAttribute(
        span,
        "output.mime_type",
        "application/json"
      );

      setJsonAttribute(
        span,
        "kiro.tool_output",
        toolOutput
      );
    }

    if (event.error) {
      setStringAttribute(
        span,
        "error.message",
        event.error
      );
    }

    if (event.tool_error) {
      setStringAttribute(
        span,
        "error.message",
        event.tool_error
      );
    }

    span.end();

    if (toolState) {
      removeToolState(
        toolState.toolCallId
      );
    }

    const currentTurnState =
      loadSessionState(sessionId);

    if (currentTurnState) {
      if (
        !Array.isArray(
          currentTurnState.completedTools
        )
      ) {
        currentTurnState.completedTools = [];
      }

      currentTurnState.completedTools.push({
        toolCallId:
          toolCallId || null,

        toolName,

        success,

        durationMs:
          toolState?.startedAt
            ? completedAt -
            Number(
              toolState.startedAt
            )
            : 0,

        completedAt,
      });

      saveSessionState(
        sessionId,
        currentTurnState
      );
    }
  } catch (error) {
    try {
      span.end();
    } catch {
      // Ignore.
    }

    throw error;
  }
}


/* =========================================================
 * Stop
 * ======================================================= */

async function handleStop(
  tracer,
  event,
  sessionId
) {
  const turnState =
    loadSessionState(sessionId);

  const span = startChildSpan(
    tracer,
    "kiro.agent.stop",
    turnState?.rootSpanContext,
    {
      kind: SpanKind.INTERNAL,
    }
  );

  try {
    annotateCommon(
      span,
      event,
      "Stop",
      sessionId,
      turnState
    );

    setStringAttribute(
      span,
      "openinference.span.kind",
      "CHAIN"
    );

    const stoppedAt =
      Date.now();

    if (turnState?.startedAt) {
      setNumberAttribute(
        span,
        "kiro.turn.duration_ms",
        stoppedAt -
          Number(
            turnState.startedAt
          )
      );
    }

    setNumberAttribute(
      span,
      "kiro.turn.stopped_at",
      stoppedAt
    );

    setStringAttribute(
      span,
      "kiro.evaluation.status",
      "pending"
    );

    setBooleanAttribute(
      span,
      "kiro.evaluation.required",
      true
    );

    span.end();

    await runTurnEvaluator(
      sessionId
    );

    /*
     * The turn is complete. Remove the current session state.
     * Individual tool state files are intentionally not required
     * for the trace itself after Stop.
     */
    deleteFile(
      sessionStatePath(sessionId)
    );
  } catch (error) {
    try {
      span.end();
    } catch {
      // Ignore.
    }

    throw error;
  }
}


/* =========================================================
 * Utility
 * ======================================================= */

function sanitizeSpanName(value) {
  return String(value || "unknown")
    .replace(/[^a-zA-Z0-9_.-]+/g, "_")
    .slice(0, 100);
}


/* =========================================================
 * OpenTelemetry SDK
 * ======================================================= */

function createSdk() {
  /*
   * NodeSDK reads these environment variables when the SDK
   * initializes. Set them only when the caller hasn't supplied
   * their own values.
   */
  if (!process.env.OTEL_SERVICE_NAME) {
    process.env.OTEL_SERVICE_NAME =
      SERVICE_NAME;
  }

  const existingResourceAttributes =
    process.env.OTEL_RESOURCE_ATTRIBUTES ||
    "";

  if (
    !existingResourceAttributes.includes(
      "openinference.project.name="
    )
  ) {
    process.env.OTEL_RESOURCE_ATTRIBUTES =
      [
        existingResourceAttributes,
        `openinference.project.name=${PHOENIX_PROJECT_NAME}`,
      ]
        .filter(Boolean)
        .join(",");
  }

  const exporterOptions = {
    url: PHOENIX_ENDPOINT,

    /*
     * Phoenix expects OTLP protobuf on /v1/traces.
     * The protobuf exporter normally supplies this header;
     * setting it explicitly also protects against configuration
     * accidentally selecting a JSON content type.
     */
    headers: {
      "Content-Type":
        "application/x-protobuf",
      Accept:
        "application/x-protobuf",
    },

    timeoutMillis:
      EXPORT_TIMEOUT_MS,
  };

  if (process.env.PHOENIX_API_KEY) {
    exporterOptions.headers.api_key =
      process.env.PHOENIX_API_KEY;
  }

  const exporter =
    new OTLPTraceExporter(
      exporterOptions
    );

  return new NodeSDK({
    traceExporter: exporter,
  });
}


/* =========================================================
 * Main
 * ======================================================= */

async function main() {
  let sdk;

  try {
    ensureStateDirectories();

    const raw =
      await readStdin();

    const event =
      parseEvent(raw);

    const hookEvent =
      normalizeHookEvent(event);

    const sessionId =
      getSessionId(event);

    const agentsConfig =
      loadAgents();

    /*
     * Routing is calculated for the prompt event and then
     * persisted in the session state so tool spans inherit
     * the same routing metadata.
     */
    const routing =
      hookEvent ===
      "UserPromptSubmit"
        ? findRouting(
            event,
            agentsConfig
          )
        : loadSessionState(
            sessionId
          )?.routing || null;

    sdk = createSdk();

    await sdk.start();

    const tracer =
      trace.getTracer(
        TRACER_NAME,
        TRACER_VERSION
      );

    switch (hookEvent) {
      case "UserPromptSubmit":
        await handleUserPromptSubmit(
          tracer,
          event,
          sessionId,
          routing
        );
        break;

      case "PreToolUse":
        await handlePreToolUse(
          tracer,
          event,
          sessionId
        );
        break;

      case "PostToolUse":
        await handlePostToolUse(
          tracer,
          event,
          sessionId
        );
        break;

      case "Stop":
        await handleStop(
          tracer,
          event,
          sessionId
        );
        break;

      default: {
        /*
         * Keep unknown/future Kiro events observable without
         * breaking the hook.
         */
        const span =
          tracer.startSpan(
            `kiro.${sanitizeSpanName(
              hookEvent
            )}`
          );

        try {
          annotateCommon(
            span,
            event,
            hookEvent,
            sessionId,
            loadSessionState(
              sessionId
            )
          );
        } finally {
          span.end();
        }
      }
    }

    /*
     * Kiro launches this Node process for the hook and then
     * expects it to exit. Explicit shutdown flushes OTLP.
     */
>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
    await sdk.shutdown();
  } catch (error) {
    logError(error);

<<<<<<< HEAD
    try {
      await sdk.shutdown();
    } catch {
      // Ignore shutdown errors.
    }
  }
}

main().catch(logError);
=======
    if (sdk) {
      try {
        await sdk.shutdown();
      } catch (shutdownError) {
        logError(shutdownError);
      }
    }

    /*
     * CRITICAL:
     *
     * Phoenix is observability only. A Phoenix outage must
     * never block/fail a Kiro workflow.
     */
    process.exitCode = 0;
  }
}

async function runTurnEvaluator(
  sessionId
) {
  const evaluator =
    path.join(
      PROJECT_ROOT,
      ".kiro",
      "phoenix",
      "evaluate-turn.js"
    );

  if (
    !fs.existsSync(evaluator)
  ) {
    return;
  }

  try {
    const {
      execFile,
    } = require("child_process");

    const {
      promisify,
    } = require("util");

    const execFileAsync =
      promisify(execFile);

    await execFileAsync(
      process.execPath,
      [
        evaluator,
        "--session-id",
        sessionId,
      ],
      {
        cwd: PROJECT_ROOT,
        windowsHide: true,
        timeout: 5000,
      }
    );
  } catch (error) {
    /*
     * Evaluation is non-blocking from Kiro's perspective.
     */
    logError(
      new Error(
        `Turn evaluation failed: ${
          error?.stack || error
        }`
      )
    );
  }
}

main().catch((error) => {
  logError(error);

  /*
   * Never break Kiro because observability failed.
   */
  process.exitCode = 0;
});
>>>>>>> 1ccdfb2ddbe7df7268e04d1ab4b3c14e663858d0
