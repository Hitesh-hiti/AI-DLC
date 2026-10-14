# Kiro Slack Bridge - Human Response Handling

## Slack Human Response Handling

When `get_slack_response` returns `HUMAN_RESPONSE_RECEIVED`:

1. Treat the human response as authoritative.
2. Preserve the complete MCP tool result.
3. Do not summarize or omit any returned fields.
4. The final Kiro response MUST include:
   - Request ID
   - Answer
   - Replied by
   - Slack Reply Timestamp
   - Reply Timestamp (ISO)
5. Do not replace the human response with a generic message such as "Task done".
6. Do not omit timestamps even if they appear redundant.

Required response format:

HUMAN_RESPONSE_RECEIVED
Request ID: <requestId>
Answer: <human answer>
Replied by: <responder>
Slack Reply Timestamp: <slack timestamp>
Reply Timestamp (ISO): <ISO timestamp>
