import { spawn, ChildProcessWithoutNullStreams } from "node:child_process";
import readline from "node:readline";

type JsonRpcResponse = {
  jsonrpc: "2.0";
  id?: number | string;
  result?: any;
  error?: any;
  method?: string;
  params?: any;
};

export class KiroACP {
  private process: ChildProcessWithoutNullStreams | null = null;
  private rl: readline.Interface | null = null;

  private nextId = 1;

  private pending = new Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
    }
  >();

  private sessionId: string | null = null;

  async start(): Promise<void> {
    if (this.process) {
      return;
    }

    this.process = spawn(
      "kiro-cli",
      ["acp"],
      {
        cwd: process.cwd(),
        stdio: ["pipe", "pipe", "pipe"],
        windowsHide: false,
      }
    );

    this.process.stderr.on("data", (data) => {
      console.error(
        `[Kiro ACP] ${data.toString().trim()}`
      );
    });

    this.process.on("exit", (code, signal) => {
      console.log(
        `[Kiro ACP] exited code=${code} signal=${signal}`
      );

      this.process = null;
      this.rl = null;
      this.sessionId = null;

      for (const pending of this.pending.values()) {
        pending.reject(
          new Error(
            `Kiro ACP process exited: code=${code}, signal=${signal}`
          )
        );
      }

      this.pending.clear();
    });

    this.rl = readline.createInterface({
      input: this.process.stdout,
      crlfDelay: Infinity,
    });

    this.rl.on("line", (line) => {
      this.handleMessage(line);
    });

    await this.request("initialize", {
      protocolVersion: 1,

      clientCapabilities: {
        fs: {
          readTextFile: true,
          writeTextFile: true,
        },
        terminal: true,
      },

      clientInfo: {
        name: "kiro-slack-bridge",
        version: "1.0.0",
      },
    });
  }

  async createSession(): Promise<string> {
    const result = await this.request(
      "session/new",
      {
        cwd: process.cwd(),
        mcpServers: [],
      }
    );

    this.sessionId = result.sessionId;

    if (!this.sessionId) {
      throw new Error(
        "Kiro ACP did not return a sessionId."
      );
    }

    console.log(
      `[Kiro ACP] session created: ${this.sessionId}`
    );

    return this.sessionId;
  }

  async sendPrompt(text: string): Promise<void> {
    if (!this.sessionId) {
      throw new Error(
        "Kiro ACP session has not been created."
      );
    }

    await this.request(
      "session/prompt",
      {
        sessionId: this.sessionId,

        content: [
          {
            type: "text",
            text,
          },
        ],
      }
    );
  }

  getSessionId(): string | null {
    return this.sessionId;
  }

  private request(
    method: string,
    params: any
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.process) {
        reject(
          new Error("Kiro ACP process is not running.")
        );
        return;
      }

      const id = this.nextId++;

      this.pending.set(id, {
        resolve,
        reject,
      });

      const message = JSON.stringify({
        jsonrpc: "2.0",
        id,
        method,
        params,
      });

      this.process.stdin.write(
        message + "\n"
      );
    });
  }

  private handleMessage(line: string): void {
    if (!line.trim()) {
      return;
    }

    let message: JsonRpcResponse;

    try {
      message = JSON.parse(line);
    } catch {
      console.error(
        "[Kiro ACP] Invalid JSON:",
        line
      );
      return;
    }

    // JSON-RPC response
    if (
      message.id !== undefined &&
      this.pending.has(Number(message.id))
    ) {
      const id = Number(message.id);
      const pending = this.pending.get(id);

      if (!pending) {
        return;
      }

      this.pending.delete(id);

      if (message.error) {
        pending.reject(
          new Error(
            message.error.message ??
            JSON.stringify(message.error)
          )
        );
      } else {
        pending.resolve(
          message.result
        );
      }

      return;
    }

    // ACP notification
    if (message.method) {
      this.handleNotification(message);
    }
  }

  private handleNotification(
    message: JsonRpcResponse
  ): void {
    if (
      message.method ===
      "session/notification"
    ) {
      const update =
        message.params;

      if (
        update?.update?.sessionUpdate ===
        "agent_message_chunk"
      ) {
        const text =
          update.update.content?.text;

        if (text) {
          process.stdout.write(text);
        }
      }
    }
  }
}