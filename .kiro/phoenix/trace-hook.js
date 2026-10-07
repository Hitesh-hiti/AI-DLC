const fs = require("fs");
const path = require("path");

const { NodeSDK } = require("@opentelemetry/sdk-node");
const { trace } = require("@opentelemetry/api");
const {
  OTLPTraceExporter,
} = require("@opentelemetry/exporter-trace-otlp-proto");

const PHOENIX_ENDPOINT =
  process.env.PHOENIX_COLLECTOR_ENDPOINT ||
  "http://localhost:6006/v1/traces";

const PROJECT_ROOT = process.cwd();

function logError(error) {
  try {
    fs.appendFileSync(
      path.join(PROJECT_ROOT, ".kiro", "phoenix", "phoenix-errors.log"),
      `${new Date().toISOString()} ${error?.stack || error}\n`
    );
  } catch {
    // Observability must never break Kiro.
  }
}

function readStdin() {
  return new Promise((resolve) => {
    const chunks = [];

    process.stdin.on("data", (chunk) => {
      chunks.push(chunk);
    });

    process.stdin.on("end", () => {
      resolve(Buffer.concat(chunks).toString("utf8"));
    });
  });
}

function parseEvent(raw) {
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function loadAgents() {
  const file = path.join(
    PROJECT_ROOT,
    ".kiro",
    "agents",
    "agentspicker.json"
  );

  try {
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
    event.userPrompt ||
    event.prompt ||
    process.env.USER_PROMPT ||
    ""
  ).toLowerCase();

  if (!prompt) {
    return null;
  }

  const candidates = [];

  for (const [key, agent] of Object.entries(config.agents)) {
    const keywords = Array.isArray(agent.keywords)
      ? agent.keywords
      : [];

    const matchedKeywords = keywords.filter((keyword) =>
      prompt.includes(String(keyword).toLowerCase())
    );

    if (matchedKeywords.length === 0) {
      continue;
    }

    candidates.push({
      key,
      agent,
      matchedKeywords,
    });
  }

  if (candidates.length === 0) {
    return null;
  }

  const priorityOrder =
    config.routing?.priority || [];

  candidates.sort((a, b) => {
    const aPriority = priorityOrder.indexOf(
      a.agent.category
    );

    const bPriority = priorityOrder.indexOf(
      b.agent.category
    );

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
      );
    }

    span.end();

    await sdk.shutdown();
  } catch (error) {
    logError(error);

    try {
      await sdk.shutdown();
    } catch {
      // Ignore shutdown errors.
    }
  }
}

main().catch(logError);