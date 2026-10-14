import "dotenv/config";

import crypto from "node:crypto";
import path from "node:path";
import { spawn } from "node:child_process";

import { WebClient } from "@slack/web-api";

import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";

import {
  StdioServerTransport,
} from "@modelcontextprotocol/sdk/server/stdio.js";

import { z } from "zod";

import fs from "node:fs";

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
    "C:\\Users\\Hitesh_C\\Documents\\TravelPlatform\\slack\\mcp-startup.log",
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
  process.env.WAIT_TIMEOUT_MS ?? "1800000"
);

const KIRO_INPUT_SCRIPT =
  process.env.KIRO_INPUT_SCRIPT ??
  path.resolve(process.cwd(), "kiro-input.py");


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
  createdAt: string;

  completed: boolean;
  processing: boolean;

  responderName?: string;
  replyTimestamp?: string;
  answer?: string;
}


const pendingRequests =
  new Map<string, PendingRequest>();


function createRequestId(): string {
  return crypto.randomUUID();
}


function slackTimestampToIndiaTime(timestamp: string): string {
  const seconds = Number(timestamp);

  if (!Number.isFinite(seconds)) {
    return "Unknown timestamp";
  }

  const date = new Date(seconds * 1000);

  // Convert to IST (UTC+5:30) manually to avoid Intl locale inconsistencies
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(date.getTime() + istOffsetMs);

  const year = istDate.getUTCFullYear();
  const month = String(istDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(istDate.getUTCDate()).padStart(2, "0");
  const hours = String(istDate.getUTCHours()).padStart(2, "0");
  const minutes = String(istDate.getUTCMinutes()).padStart(2, "0");
  const seconds2 = String(istDate.getUTCSeconds()).padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds2} IST`;
}


async function getResponderName(
  userId: string
): Promise<string> {
  try {
    const result =
      await slack.users.info({
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
  const result =
    await slack.conversations.replies({
      channel: SLACK_CHANNEL_ID!,
      ts: threadTs,
      limit: 100,
    });

  return result.messages ?? [];
}


/**
 * Inject the Slack response into the currently
 * visible Kiro chat.
 *
 * kiro-input.py handles:
 *
 * Ctrl+Shift+P
 * Kiro: Focus chat input
 * paste
 * Enter
 */
function injectIntoKiro(
  pending: PendingRequest
): void {
  if (!pending.answer) {
    return;
  }

  if (pending.processing) {
    console.error(
      `[Kiro] Already processing ${pending.requestId}`
    );

    return;
  }

  pending.processing = true;

  const payload = {
    responderName:
      pending.responderName ?? "Unknown",

    replyTimestampIso:
      pending.replyTimestamp ?? "Unknown",

    answer:
      pending.answer,
  };

  console.error(
    `[Kiro] Injecting Slack response for ${pending.requestId}`
  );

  console.error(
    `[Kiro] Input script: ${KIRO_INPUT_SCRIPT}`
  );

  const child = spawn(
    "python",
    [KIRO_INPUT_SCRIPT],
    {
      windowsHide: true,

      stdio: [
        "pipe",
        "pipe",
        "pipe",
      ],
    }
  );

  child.stdout.on(
    "data",
    (data: Buffer) => {
      console.error(
        `[Kiro-input] ${data.toString().trim()}`
      );
    }
  );

  child.stderr.on(
    "data",
    (data: Buffer) => {
      console.error(
        `[Kiro-input ERROR] ${data.toString().trim()}`
      );
    }
  );

  child.on(
    "error",
    (error) => {
      console.error(
        "[Kiro] Failed to start kiro-input.py:",
        error
      );

      pending.processing = false;
    }
  );

  child.on(
    "close",
    (code) => {
      if (code === 0) {
        console.error(
          `[Kiro] Response injected successfully for ${pending.requestId}`
        );
      } else {
        console.error(
          `[Kiro] kiro-input.py exited with code ${code}`
        );
      }

      pending.processing = false;
    }
  );

  child.stdin.write(
    JSON.stringify(payload) + "\n"
  );

  child.stdin.end();
}


/**
 * Check one pending Slack request.
 *
 * IMPORTANT:
 * This runs in the background.
 *
 * It is NEVER awaited by ask_slack.
 */
async function checkPendingRequest(
  pending: PendingRequest
): Promise<void> {
  if (pending.completed) {
    return;
  }

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

    const messages =
      await getThreadReplies(
        pending.threadTs
      );

    /**
     * First message is our original
     * Slack question.
     */
    for (const message of messages.slice(1)) {
      if (!message.ts) {
        continue;
      }

      /**
       * Ignore bot messages.
       */
      if (
        ("bot_id" in message &&
          message.bot_id) ||
        ("subtype" in message &&
          message.subtype === "bot_message")
      ) {
        continue;
      }

      /**
       * We need a real Slack user.
       */
      if (!message.user) {
        continue;
      }

      const answer =
        message.text?.trim();

      if (!answer) {
        continue;
      }

      const responderName =
        await getResponderName(
          message.user
        );

      const replyTimestamp =
        slackTimestampToIndiaTime(
          message.ts
        );

      pending.completed = true;
      pending.responderName =
        responderName;
      pending.replyTimestamp =
        replyTimestamp;
      pending.answer =
        answer;

      console.error(
        `[Slack] Response received for ${pending.requestId}`
      );

      console.error(
        `[Slack] Replied by: ${responderName}`
      );

      console.error(
        `[Slack] Timestamp: ${replyTimestamp}`
      );

      console.error(
        `[Slack] Answer: ${answer}`
      );

      /**
       * IMPORTANT:
       *
       * This is the point where we inject the
       * response into the existing Kiro chat.
       */
      injectIntoKiro(pending);

      return;
    }
  } catch (error) {
    console.error(
      `[Slack] Error checking ${pending.requestId}:`,
      error
    );
  }
}


/**
 * Background Slack polling loop.
 *
 * This keeps running even when there is no
 * active MCP tool call.
 */
async function pollSlackReplies(): Promise<void> {
  const requests =
    Array.from(
      pendingRequests.values()
    );

  for (const pending of requests) {
    if (pending.completed) {
      continue;
    }

    await checkPendingRequest(
      pending
    );
  }
}


/**
 * Start background polling.
 *
 * IMPORTANT:
 * Do not await this.
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
 * Send question to Slack.
 *
 * This ONLY sends the question and registers
 * the pending request.
 *
 * It does NOT wait for the human.
 */
async function sendSlackQuestion(
  question: string
): Promise<PendingRequest> {
  const requestId =
    createRequestId();

  const result =
    await slack.chat.postMessage({
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
    createdAt:
      new Date().toISOString(),

    completed: false,
    processing: false,
  };

  pendingRequests.set(
    requestId,
    pending
  );

  return pending;
}


const server =
  new McpServer({
    name: "kiro-slack-bridge",
    version: "1.0.0",
  });


/**
 * ask_slack
 *
 * Sends the question to Slack and RETURNS
 * IMMEDIATELY.
 */
server.tool(
  "ask_slack",

  "Ask a human a question in Slack. The question is sent and a Request ID is returned immediately. Do not wait for the human. The bridge monitors Slack in the background and automatically sends the human response back into the active Kiro chat.",

  {
    question: z
      .string()
      .min(1)
      .describe(
        "The exact question to send to the human."
      ),
  },

  async ({ question }) => {
    try {
      const pending =
        await sendSlackQuestion(
          question
        );

      console.error(
        `[Slack] Question sent. Request ID: ${pending.requestId}`
      );

      console.error(
        `[Slack] Thread: ${pending.threadTs}`
      );

      /**
       * CRITICAL:
       *
       * There is NO await here for the
       * Slack response.
       */
      return {
        content: [
          {
            type: "text",

            text: [
              "SLACK_REQUEST_SENT",
              "",
              `Request ID: ${pending.requestId}`,
              "",
            ].join("\n"),
          },
        ],
      };
    } catch (error) {
      console.error(
        "[Slack] ask_slack failed:",
        error
      );

      return {
        isError: true,

        content: [
          {
            type: "text",

            text:
              error instanceof Error
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
 * This tool NEVER waits.
 */
server.tool(
  "get_slack_response",

  "Check whether the human has replied to a previous Slack question. This tool never waits. If the human has not replied yet, it returns NOT_READY.",

  {
    requestId: z
      .string()
      .min(1)
      .describe(
        "The Request ID returned by ask_slack."
      ),
  },

  async ({ requestId }) => {
    const pending =
      pendingRequests.get(
        requestId
      );

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
              "The human has not replied yet.",
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
          ].join("\n"),
        },
      ],
    };
  }
);


const transport =
  new StdioServerTransport();

diagnosticLog("Starting MCP transport connection");
try {
  await server.connect(transport);
  diagnosticLog("MCP transport connected");
} catch (error) {
  diagnosticLog("MCP transport connection failed", error);
  throw error;
}


/**
 * Start background polling AFTER MCP
 * connection is established.
 */
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
  `[MCP] Kiro input script: ${KIRO_INPUT_SCRIPT}`
);