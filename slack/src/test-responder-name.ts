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

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log("Sending question to Slack...");

  const sent = await slack.chat.postMessage({
    channel: channelId,
    text:
      "🤖 *Responder name test*\n\n" +
      "Please reply to this thread with your answer.",
  });

  if (!sent.ts) {
    throw new Error("Slack did not return a message timestamp");
  }

  const threadTs = sent.ts;

  console.log("Question sent!");
  console.log("Waiting for a human reply...");

  while (true) {
    await sleep(3000);

    const result = await slack.conversations.replies({
      channel: channelId,
      ts: threadTs,
    });

    const messages = result.messages ?? [];

    const humanReply = messages.find(
      (message) =>
        message.ts !== threadTs &&
        message.text &&
        !message.bot_id
    );

    if (humanReply?.text) {
      let responderName = "Unknown user";

      if (humanReply.user) {
        const userInfo = await slack.users.info({
          user: humanReply.user,
        });

        console.log("Slack user ID:", humanReply.user);
        console.log("Slack user info:", userInfo.user);

        responderName =
          userInfo.user?.profile?.display_name ||
          userInfo.user?.real_name ||
          userInfo.user?.name ||
          "Unknown user";
      }

      console.log("\nHuman reply received!");
      console.log("Answer:", humanReply.text);
      console.log("Replied by:", responderName);

      break;
    }

    console.log("No reply yet...");
  }
}

main().catch((error) => {
  console.error("Slack error:");
  console.error(error.data ?? error);
  process.exit(1);
});