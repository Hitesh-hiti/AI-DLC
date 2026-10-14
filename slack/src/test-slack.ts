import "dotenv/config";
import { WebClient } from "@slack/web-api";

const token = process.env.SLACK_BOT_TOKEN;
const channel = process.env.SLACK_CHANNEL_ID;

if (!token) {
  throw new Error("SLACK_BOT_TOKEN is missing from .env");
}

if (!channel) {
  throw new Error("SLACK_CHANNEL_ID is missing from .env");
}

const channelId: string = channel;
const slack = new WebClient(token);

async function main() {
  const requestId = crypto.randomUUID();

  const result = await slack.chat.postMessage({
    channel: channelId,
    text:
      `🤖 *Question from Kiro*\n\n` +
      `*Request ID:* \`${requestId}\`\n\n` +
      `Can someone confirm the Kiro Slack Bridge is working?`,
  });

  console.log("Message sent successfully!");
  console.log("Request ID:", requestId);
  console.log("Channel:", result.channel);
  console.log("Thread timestamp:", result.ts);
}

main().catch((error) => {
  console.error("Slack error:");
  console.error(error.data ?? error);
  process.exit(1);
});