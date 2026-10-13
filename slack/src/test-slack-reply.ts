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
const threadTs = "1789979809.119269";

const slack = new WebClient(token);

async function main() {
  const result = await slack.conversations.replies({
    channel: channelId,
    ts: threadTs,
  });

  console.log("Thread messages:");
  console.log(JSON.stringify(result.messages, null, 2));
}

main().catch((error) => {
  console.error("Slack error:");
  console.error(error.data ?? error);
  process.exit(1);
});