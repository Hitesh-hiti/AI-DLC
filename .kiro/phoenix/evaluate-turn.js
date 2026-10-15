"use strict";

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = process.cwd();

const PHOENIX_ENDPOINT =
  process.env.PHOENIX_COLLECTOR_ENDPOINT ||
  "http://localhost:6006/v1/traces";

const PHOENIX_BASE_URL =
  PHOENIX_ENDPOINT
    .replace(/\/v1\/traces\/?$/, "")
    .replace(/\/+$/, "");

const PHOENIX_PROJECT_NAME =
  process.env.PHOENIX_PROJECT_NAME ||
  "kiro-ide-travel-platform";

const PHOENIX_API_KEY =
  process.env.PHOENIX_API_KEY || "";

const PHOENIX_ANNOTATION_ENDPOINT =
  `${PHOENIX_BASE_URL}/v1/span_annotations`;

const STATE_DIR = path.join(
  PROJECT_ROOT,
  ".kiro",
  "phoenix",
  "trace-state"
);

const ERROR_LOG = path.join(
  PROJECT_ROOT,
  ".kiro",
  "phoenix",
  "phoenix-errors.log"
);

const MODEL_POLICY_FILE = path.join(
  PROJECT_ROOT,
  ".kiro",
  "steering",
  "framework-model-policy.md"
);

const AGENTS_FILE = path.join(
  PROJECT_ROOT,
  ".kiro",
  "agents",
  "agentspicker.json"
);

const TOOL_LATENCY_THRESHOLD_MS =
  Number(
    process.env.PHOENIX_TOOL_LATENCY_THRESHOLD_MS ||
      30000
  );


/* =========================================================
 * Logging
 * ======================================================= */

function logError(error) {
  try {
    fs.mkdirSync(
      path.dirname(ERROR_LOG),
      { recursive: true }
    );

    fs.appendFileSync(
      ERROR_LOG,
      `${new Date().toISOString()} ${
        error?.stack || error
      }\n`
    );
  } catch {
    // Evaluation must never break Kiro.
  }
}


/* =========================================================
 * CLI
 * ======================================================= */

function getArgument(name) {
  const index =
    process.argv.indexOf(name);

  if (
    index === -1 ||
    index + 1 >= process.argv.length
  ) {
    return null;
  }

  return process.argv[index + 1];
}


/* =========================================================
 * Files
 * ======================================================= */

function readJson(file) {
  try {
    return JSON.parse(
      fs.readFileSync(file, "utf8")
    );
  } catch {
    return null;
  }
}

function writeJson(file, value) {
  fs.mkdirSync(
    path.dirname(file),
    { recursive: true }
  );

  fs.writeFileSync(
    file,
    JSON.stringify(value, null, 2),
    "utf8"
  );
}

function loadSessionState(sessionId) {
  const crypto = require("crypto");

  const hash = crypto
    .createHash("sha256")
    .update(String(sessionId))
    .digest("hex");

  const file = path.join(
    STATE_DIR,
    `session-${hash}.json`
  );

  return {
    file,
    state: readJson(file),
  };
}


/* =========================================================
 * Model policy parser
 *
 * Reads framework-model-policy.md instead of duplicating
 * the policy in JavaScript.
 * ======================================================= */

function loadModelPolicy() {
  const result = {};

  if (
    !fs.existsSync(
      MODEL_POLICY_FILE
    )
  ) {
    return result;
  }

  const content =
    fs.readFileSync(
      MODEL_POLICY_FILE,
      "utf8"
    );

  const lines =
    content.split(/\r?\n/);

  for (const line of lines) {
    const match =
      line.match(
        /^\|\s*([A-Z_]+)\s*\|\s*([^|]+)\s*\|/
      );

    if (!match) {
      continue;
    }

    const category =
      match[1].trim();

    const modelId =
      match[2].trim();

    if (
      category === "Routing Category" ||
      category === "---" ||
      modelId === "---"
    ) {
      continue;
    }

    result[category] =
      modelId;
  }

  return result;
}


/* =========================================================
 * Agents
 * ======================================================= */

function loadAgents() {
  if (
    !fs.existsSync(
      AGENTS_FILE
    )
  ) {
    return null;
  }

  return readJson(
    AGENTS_FILE
  );
}


/* =========================================================
 * Evaluation result
 * ======================================================= */

function result(
  name,
  passed,
  explanation,
  score = passed ? 1 : 0
) {
  return {
    name,
    label: passed
      ? "pass"
      : "fail",
    score,
    explanation,
  };
}


/* =========================================================
 * Routing validity
 *
 * This is intentionally NOT called "routing accuracy".
 *
 * Accuracy requires ground-truth examples.
 * This check verifies that the selected routing decision
 * is internally valid against the configured agents.
 * ======================================================= */

function evaluateRoutingValidity(
  turnState,
  agentsConfig
) {
  const routing =
    turnState?.routing;

  if (!routing) {
    return result(
      "routing_validity",
      false,
      "No routing decision was recorded."
    );
  }

  if (!agentsConfig?.agents) {
    return result(
      "routing_validity",
      false,
      "agentspicker.json is unavailable; routing cannot be validated."
    );
  }

  const agent =
    agentsConfig.agents[
      routing.targetAgent
    ];

  if (!agent) {
    return result(
      "routing_validity",
      false,
      `Selected agent '${routing.targetAgent}' does not exist in agentspicker.json.`
    );
  }

  const categoryMatches =
    agent.category ===
    routing.category;

  const modelMatches =
    !agent.model ||
    !routing.model ||
    agent.model ===
      routing.model;

  if (
    !categoryMatches ||
    !modelMatches
  ) {
    return result(
      "routing_validity",
      false,
      `Routing metadata does not match the configured agent. ` +
        `Recorded category=${routing.category}, model=${routing.model}; ` +
        `configured category=${agent.category}, model=${agent.model}.`
    );
  }

  return result(
    "routing_validity",
    true,
    `Agent '${routing.targetAgent}' is valid and its category/model match agentspicker.json.`
  );
}


/* =========================================================
 * Model policy compliance
 * ======================================================= */

function evaluateModelPolicy(
  turnState
) {
  const routing =
    turnState?.routing;

  if (!routing) {
    return result(
      "model_policy_compliance",
      false,
      "No routing decision was recorded."
    );
  }

  const policy =
    loadModelPolicy();

  const expectedModel =
    policy[
      String(
        routing.category || ""
      ).toUpperCase()
    ];

  if (!expectedModel) {
    return result(
      "model_policy_compliance",
      false,
      `No global model policy entry exists for category '${routing.category}'.`
    );
  }

  const actualModel =
    String(
      routing.model || ""
    ).trim();

  const passed =
    actualModel ===
    expectedModel;

  return result(
    "model_policy_compliance",
    passed,
    passed
      ? `Selected model '${actualModel}' matches the global policy for ${routing.category}.`
      : `Model policy violation: category '${routing.category}' requires '${expectedModel}', but '${actualModel}' was selected.`
  );
}


/* =========================================================
 * Tool success
 * ======================================================= */

function evaluateToolSuccess(
  turnState
) {
  const tools =
    Array.isArray(
      turnState?.completedTools
    )
      ? turnState.completedTools
      : [];

  if (
    tools.length === 0
  ) {
    return result(
      "tool_success_rate",
      true,
      "No completed tool calls were recorded for this turn.",
      1
    );
  }

  const successful =
    tools.filter(
      (tool) =>
        tool.success === true
    ).length;

  const score =
    successful / tools.length;

  const passed =
    successful ===
    tools.length;

  return result(
    "tool_success_rate",
    passed,
    `${successful}/${tools.length} tool calls completed successfully.`,
    score
  );
}


/* =========================================================
 * Tool latency
 * ======================================================= */

function evaluateToolLatency(
  turnState
) {
  const tools =
    Array.isArray(
      turnState?.completedTools
    )
      ? turnState.completedTools
      : [];

  if (
    tools.length === 0
  ) {
    return result(
      "tool_latency",
      true,
      "No completed tool calls were recorded.",
      1
    );
  }

  const slowTools =
    tools.filter(
      (tool) =>
        Number(
          tool.durationMs || 0
        ) >
        TOOL_LATENCY_THRESHOLD_MS
    );

  const passed =
    slowTools.length === 0;

  if (passed) {
    return result(
      "tool_latency",
      true,
      `All tool calls completed within ${TOOL_LATENCY_THRESHOLD_MS} ms.`
    );
  }

  const names =
    slowTools
      .map(
        (tool) =>
          `${tool.toolName}=${tool.durationMs}ms`
      )
      .join(", ");

  return result(
    "tool_latency",
    false,
    `Tool latency exceeded ${TOOL_LATENCY_THRESHOLD_MS} ms: ${names}.`
  );
}


/* =========================================================
 * Phoenix annotation
 * ======================================================= */

async function logAnnotations(
  spanId,
  evaluations
) {
  if (!spanId) {
    throw new Error(
      "Cannot log Phoenix evaluations without a span ID."
    );
  }

  const data =
    evaluations.map(
      (evaluation) => ({
        span_id: spanId,
        name: evaluation.name,
        annotator_kind: "CODE",
        result: {
          label: evaluation.label,
          score: evaluation.score,
          explanation:
            evaluation.explanation,
        },
        metadata: {
          evaluator:
            "kiro-deterministic-evaluator",
          version: "1.0.0",
          project:
            PHOENIX_PROJECT_NAME,
        },
        identifier:
          `kiro-eval-v1:${evaluation.name}`,
      })
    );

  const headers = {
    "content-type":
      "application/json",
  };

  if (PHOENIX_API_KEY) {
    headers.authorization =
      `Bearer ${PHOENIX_API_KEY}`;
  }

  const response =
    await fetch(
      `${PHOENIX_ANNOTATION_ENDPOINT}?sync=false`,
      {
        method: "POST",
        headers,
        body: JSON.stringify({
          data,
        }),
      }
    );

  if (!response.ok) {
    const body =
      await response.text();

    throw new Error(
      `Phoenix annotation request failed: ` +
        `${response.status} ${response.statusText} ${body}`
    );
  }
}


/* =========================================================
 * Main evaluation
 * ======================================================= */

async function main() {
  const sessionId =
    getArgument(
      "--session-id"
    );

  if (!sessionId) {
    throw new Error(
      "Usage: node evaluate-turn.js --session-id <session-id>"
    );
  }

  const {
    state: turnState,
  } =
    loadSessionState(
      sessionId
    );

  if (!turnState) {
    throw new Error(
      `No Phoenix turn state found for session '${sessionId}'.`
    );
  }

  const agentsConfig =
    loadAgents();

  const evaluations = [
    evaluateRoutingValidity(
      turnState,
      agentsConfig
    ),

    evaluateModelPolicy(
      turnState
    ),

    evaluateToolSuccess(
      turnState
    ),

    evaluateToolLatency(
      turnState
    ),
  ];

  /*
   * Persist the evaluation result locally as well.
   * This gives you an audit trail even if Phoenix is
   * temporarily unavailable.
   */
  const evaluationDir =
    path.join(
      PROJECT_ROOT,
      ".kiro",
      "phoenix",
      "evaluations"
    );

  writeJson(
    path.join(
      evaluationDir,
      `${turnState.turnId}.json`
    ),
    {
      turnId:
        turnState.turnId,
      sessionId,
      evaluatedAt:
        new Date().toISOString(),
      traceId:
        turnState.rootSpanContext
          ?.traceId,
      spanId:
        turnState.rootSpanContext
          ?.spanId,
      evaluations,
    }
  );

  await logAnnotations(
    turnState
      .rootSpanContext
      ?.spanId,
    evaluations
  );
}


main().catch((error) => {
  logError(error);

  /*
   * Evaluation failure must never break Kiro.
   */
  process.exitCode = 0;
});