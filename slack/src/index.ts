import "dotenv/config";

import crypto from "node:crypto";
import path from "node:path";
import fs from "node:fs";
import { WebClient } from "@slack/web-api";

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { z } from "zod";

const DEBUG_LOG = path.resolve(
  process.env.KIRO_PROJECT_ROOT || process.cwd(),
  "slack",
  "ask-slack-debug.log"
);

function debugLog(message: string, data?: unknown) {
  const line =
    `${new Date().toISOString()} ${message}` +
    (data === undefined
      ? ""
      : ` ${JSON.stringify(data)}`) +
    "\n";

  try {
    fs.appendFileSync(DEBUG_LOG, line, "utf8");
  } catch (error) {
    console.error("[Slack Debug] Failed to write log:", error);
  }
}


const diagnosticLog = (
  message: string,
  error?: unknown
) => {
  const detail =
    error instanceof Error
      ? `${error.stack ?? error.message}`
      : error === undefined
        ? ""
        : String(error);

  fs.appendFileSync(
    "C:\\Users\\Bharathi_K\\Documents\\TravelPlatform\\slack\\mcp-startup.log",
    `${new Date().toISOString()} ${message} ${detail}\n`
  );
};

diagnosticLog("Process started");

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;

const POLL_INTERVAL_MS = Number(
  process.env.POLL_INTERVAL_MS ?? "2000"
);

const WAIT_TIMEOUT_MS = Number(
  process.env.WAIT_TIMEOUT_MS ?? "86400000"
);

// History file path
// HISTORY_DIR must point to a directory (not the project root).
// Fall back to <projectRoot>/phases/requirement-gap-analysis when
// HISTORY_DIR is absent or points to the project root itself.
const _defaultHistoryDir = path.resolve(
  process.env.KIRO_PROJECT_ROOT || process.cwd(),
  "phases",
  "requirement-gap-analysis"
);
const _rawHistoryDir = process.env.HISTORY_DIR;
const _resolvedHistoryDir =
  _rawHistoryDir &&
  path.resolve(_rawHistoryDir) !== path.resolve(process.env.KIRO_PROJECT_ROOT || process.cwd())
    ? _rawHistoryDir
    : _defaultHistoryDir;

const HISTORY_FILE = path.join(_resolvedHistoryDir, "history.txt");

if (!SLACK_BOT_TOKEN) {
  throw new Error("SLACK_BOT_TOKEN is required.");
}

if (!SLACK_CHANNEL_ID) {
  throw new Error("SLACK_CHANNEL_ID is required.");
}

const slack = new WebClient(SLACK_BOT_TOKEN);

interface PendingRequest {
  requestId: string;
  threadTs: string;
  question: string;
  summary?: string;
  gaps?: string[];
  questions?: string[];
  createdAt: string;

  completed: boolean;
  processing: boolean;

  responderName?: string;
  replyTimestamp?: string;
  answer?: string;

  processedReplyTimestamps?: Set<string>;
  answers?: string[];
}

const pendingRequests =
  new Map<string, PendingRequest>();

function createRequestId(): string {
  return crypto.randomUUID();
}

function slackTimestampToIndiaTime(
  timestamp: string
): string {
  const seconds = Number(timestamp);

  if (!Number.isFinite(seconds)) {
    return "Unknown timestamp";
  }

  const date = new Date(seconds * 1000);

  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(
    date.getTime() + istOffsetMs
  );

  const year = istDate.getUTCFullYear();
  const month = String(
    istDate.getUTCMonth() + 1
  ).padStart(2, "0");

  const day = String(
    istDate.getUTCDate()
  ).padStart(2, "0");

  const hours = String(
    istDate.getUTCHours()
  ).padStart(2, "0");

  const minutes = String(
    istDate.getUTCMinutes()
  ).padStart(2, "0");

  const seconds2 = String(
    istDate.getUTCSeconds()
  ).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds2} IST`;
}

async function getResponderName(
  userId: string
): Promise<string> {
  try {
    const result = await slack.users.info({
      user: userId,
    });

    const user = result.user;

    if (!user) {
      return "Unknown";
    }

    return (
      user.profile?.display_name ||
      user.profile?.real_name ||
      user.real_name ||
      user.name ||
      "Unknown"
    );
  } catch (error) {
    console.error(
      "[Slack] Could not resolve responder:",
      error
    );

    return "Unknown";
  }
}

async function getThreadReplies(
  threadTs: string
) {
  const result = await slack.conversations.replies({
    channel: SLACK_CHANNEL_ID!,
    ts: threadTs,
    limit: 100,
  });

  return result.messages ?? [];
}

/**
 * Append the Slack response to the history file.
 *
 * Creates the parent directory if it does not exist.
 * Existing history entries are preserved.
 */
async function writeReplyToHistory(
  pending: PendingRequest
): Promise<void> {
  if (!pending.answer) {
    throw new Error(
      `No answer available for request ${pending.requestId}`
    );
  }

  const questionsSection = pending.questions?.length
    ? "\nQuestions Asked:\n" +
      pending.questions
        .map((q, i) => `  ${i + 1}. ${q}`)
        .join("\n")
    : "";

  const entry = [
    "",
    "============================================================",
    `Request ID : ${pending.requestId}`,
    `Responder  : ${pending.responderName ?? "Unknown"}`,
    `Reply Time : ${pending.replyTimestamp ?? "Unknown"}`,
    questionsSection,
    "",
    "PO/Owner Answer:",
    pending.answer,
    "============================================================",
    "",
  ]
    .filter((line) => line !== "")
    .join("\n");

  await fs.promises.mkdir(
    path.dirname(HISTORY_FILE),
    { recursive: true }
  );

  await fs.promises.appendFile(
    HISTORY_FILE,
    entry,
    "utf8"
  );

  console.error(
    `[History] Reply saved to: ${HISTORY_FILE}`
  );

  console.error(
    `[History] Request ID: ${pending.requestId}`
  );
}

/**
 * Check one pending Slack request.
 *
 * Polling happens in the background.
 * Replies are written to history.txt instead of
 * being injected into the Kiro chat.
 */
async function checkPendingRequest(
  pending: PendingRequest
): Promise<void> {
  if (pending.completed || pending.processing) {
    return;
  }

  // Prevent overlapping polling from processing
  // the same request simultaneously.
  pending.processing = true;

  try {
    const age =
      Date.now() -
      new Date(pending.createdAt).getTime();

    if (age > WAIT_TIMEOUT_MS) {
      console.error(
        `[Slack] Request timed out: ${pending.requestId}`
      );

      pending.completed = true;
      return;
    }

    const messages = await getThreadReplies(
      pending.threadTs
    );

    // Skip the original Slack question.
    for (const message of messages.slice(1)) {
      if (!message.ts) {
        continue;
      }

      // Ignore bot messages.
      if (
        ("bot_id" in message && message.bot_id) ||
        ("subtype" in message &&
          message.subtype === "bot_message")
      ) {
        continue;
      }

      // Only accept replies from real Slack users.
      if (!message.user) {
        continue;
      }

      const answer = message.text?.trim();

      if (!answer) {
        continue;
      }

      const responderName = await getResponderName(
        message.user
      );

      const replyTimestamp =
        slackTimestampToIndiaTime(message.ts);

      // Store the reply details.
      pending.responderName = responderName;
      pending.replyTimestamp = replyTimestamp;
      pending.answer = answer;

      console.error(
        `[Slack] Response received for ${pending.requestId}`
      );

      console.error(
        `[Slack] Replied by: ${responderName}`
      );

      console.error(
        `[Slack] Timestamp: ${replyTimestamp}`
      );

      // Persist the reply before marking the request
      // completed. If saving fails, a later poll can retry.
      try {
        await writeReplyToHistory(pending);

        pending.completed = true;

        console.error(
          `[Slack] Request completed: ${pending.requestId}`
        );
      } catch (error) {
        console.error(
          `[History] Failed to save reply for ${pending.requestId}:`,
          error
        );

        // Keep the request pending so a later poll
        // can retry saving the response.
      }

      return;
    }
  } catch (error) {
    console.error(
      `[Slack] Error checking ${pending.requestId}:`,
      error
    );
  } finally {
    pending.processing = false;
  }
}

/**
 * Background Slack polling loop.
 */
async function pollSlackReplies(): Promise<void> {
  const requests = Array.from(
    pendingRequests.values()
  );

  for (const pending of requests) {
    if (pending.completed || pending.processing) {
      continue;
    }

    await checkPendingRequest(pending);
  }
}

/**
 * Start background polling.
 */
function startBackgroundPolling(): void {
  setInterval(
    () => {
      void pollSlackReplies();
    },
    POLL_INTERVAL_MS
  );

  console.error(
    `[Slack] Background polling started every ${POLL_INTERVAL_MS}ms`
  );
}

/**
 * Send a question to Slack.
 *
 * Sends the question and registers the request
 * without waiting for a human response.
 */
async function sendSlackQuestion(
  question: string,
  summary?: string,
  gaps?: string[],
  questions?: string[]
): Promise<PendingRequest> {
  const requestId = createRequestId();

  const result = await slack.chat.postMessage({
    channel: SLACK_CHANNEL_ID!,
    text: question,
  });

  if (!result.ts) {
    throw new Error(
      "Slack did not return a message timestamp."
    );
  }

  const pending: PendingRequest = {
    requestId,
    threadTs: result.ts,
    question,
    summary,
    gaps,
    questions,
    createdAt: new Date().toISOString(),
    completed: false,
    processing: false,
    processedReplyTimestamps: new Set<string>(),
    answers: [],
  };

  pendingRequests.set(requestId, pending);

  return pending;
}

const server = new McpServer({
  name: "kiro-slack-bridge",
  version: "1.0.0",
});

/**
 * ask_slack
 *
 * Sends a question to Slack and returns immediately.
 */

server.tool(
  "ask_slack",

  "Escalate requirement gaps to a human in Slack. Send the analysis summary, identified gaps, and specific decisions/questions that require human input. Use this tool whenever a gap analysis identifies blockers or requires PO/Owner approval.",

  {
    question: z.string().min(1).describe(
      "The specific decision or question that the human must answer."
    ),

    summary: z.string().optional().describe(
      "A concise summary of the analysis and why escalation is required."
    ),

    gaps: z.array(z.string()).optional().describe(
      "The identified requirement gaps, including their IDs, severity, and descriptions."
    ),

    questions: z.array(z.string()).optional().describe(
      "Explicit questions that the PO/Owner must answer."
    ),
  },

  async ({ question, summary, gaps, questions }) => {
    try {
      const slackMessage = [
        "*HITL ESCALATION — REQUIREMENT GAP ANALYSIS*",
        "",
        summary ? `*Summary*\n${summary}` : "",
        "",
        "*Decision Required*",
        question,
        "",
        gaps?.length
          ? `*Identified Gaps*\n${gaps.map(
              (gap, index) => `${index + 1}. ${gap}`
            ).join("\n")}`
          : "",
        "",
        questions?.length
          ? `*Questions for PO/Owner*\n${questions.map(
              (q, index) => `${index + 1}. ${q}`
            ).join("\n")}`
          : "",
        "",
        "_Please reply in this Slack thread so the response can be recorded in the requirement-analysis history._",
      ]
        .filter((section) => section !== "")
        .join("\n");

      const pending = await sendSlackQuestion(slackMessage, summary, gaps, questions);
      debugLog("ask_slack invoked", {
        question,
        summary,
        gaps,
        questions,
      });

      debugLog("Slack payload being sent", {
        payload: slackMessage,
      });
      // console.error("[Slack] New ask_slack invocation");
      // console.error("[Slack] Question:", question);
      // console.error("[Slack] Summary:", summary ?? "(none)");
      // console.error("[Slack] Gap count:", gaps?.length ?? 0);
      // console.error("[Slack] Questions count:", questions?.length ?? 0);
      // console.error("[Slack] Payload preview:", slackMessage.slice(0, 1500));

      console.error(
        `[Slack] HITL escalation sent. Request ID: ${pending.requestId}`
      );

      return {
        content: [
          {
            type: "text",
            text: [
              "SLACK_ESCALATION_SENT",
              `Request ID: ${pending.requestId}`,
              `Decision: ${question}`,
            ].join("\n"),
          },
        ],
      };
    } catch (error) {
      console.error("[Slack] Escalation failed:", error);

      return {
        isError: true,
        content: [
          {
            type: "text",
            text: error instanceof Error
              ? error.message
              : String(error),
          },
        ],
      };
    }
  }
);

/**
 * get_slack_response
 *
 * Checks the current status without waiting.
 */
server.tool(
  "get_slack_response",

  "Check whether the human has replied to a previous Slack question. This tool never waits. If the reply is not ready, it returns NOT_READY. Received replies are appended to the history file.",

  {
    requestId: z
      .string()
      .min(1)
      .describe(
        "The Request ID returned by ask_slack."
      ),
  },

  async ({ requestId }) => {
    const pending = pendingRequests.get(requestId);

    if (!pending) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: [
              "UNKNOWN_REQUEST",
              "",
              `No Slack request exists for Request ID: ${requestId}`,
            ].join("\n"),
          },
        ],
      };
    }

    if (!pending.completed) {
      return {
        content: [
          {
            type: "text",
            text: [
              "NOT_READY",
              "",
              `Request ID: ${requestId}`,
              "",
              "The human has not replied yet, or the reply could not be saved.",
              "Continue your work. Do not wait.",
            ].join("\n"),
          },
        ],
      };
    }

    return {
      content: [
        {
          type: "text",
          text: [
            "SLACK_RESPONSE_RECEIVED",
            "",
            `Request ID: ${requestId}`,
            `User: ${pending.responderName ?? "Unknown"}`,
            `Timestamp: ${pending.replyTimestamp ?? "Unknown"}`,
            "",
            `Answer: ${pending.answer ?? ""}`,
            "",
            `History file: ${HISTORY_FILE}`,
          ].join("\n"),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();

diagnosticLog("Starting MCP transport connection");

try {
  await server.connect(transport);
  diagnosticLog("MCP transport connected");
} catch (error) {
  diagnosticLog(
    "MCP transport connection failed",
    error
  );

  throw error;
}

// Start background polling after MCP connects.
startBackgroundPolling();

console.error(
  "[MCP] Kiro Slack Bridge started."
);

console.error(
  `[MCP] Slack channel: ${SLACK_CHANNEL_ID}`
);

console.error(
  `[MCP] Poll interval: ${POLL_INTERVAL_MS}ms`
);

console.error(
  `[MCP] Wait timeout: ${WAIT_TIMEOUT_MS}ms`
);

console.error(
  `[History] Output file: ${HISTORY_FILE}`
);