import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";

import axios from "axios";

function nowStamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

async function waitForHttpOk(url: string, timeoutMs: number) {
  const started = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const res = await axios.get(url, {
        timeout: 1_000,
        validateStatus: (s) => s >= 200 && s < 300,
      });
      if (res.status >= 200 && res.status < 300) return;
    } catch {
      // ignore
    }
    if (Date.now() - started > timeoutMs) {
      throw new Error(`Timed out waiting for ${url}`);
    }
    await new Promise((r) => setTimeout(r, 150));
  }
}

async function main() {
  const port = Number.parseInt(process.env.PORT ?? "8787", 10);
  const persona = (process.env.PERSONA ?? "trader").toLowerCase();
  const outFile = path.resolve(
    process.cwd(),
    "demo",
    `demo-transcript-${persona}-${nowStamp()}.txt`,
  );

  const envBase = {
    ...process.env,
    PORT: String(port),
    DEMO_MANIFEST_URL: `http://localhost:${port}/ton-agent.demo.json`,
  };

  const transcript: string[] = [];
  const log = (s: string) => {
    transcript.push(s);
    // eslint-disable-next-line no-console
    console.log(s);
  };

  log(`# TAMP demo transcript (${new Date().toISOString()})`);
  log(`# persona=${persona}`);
  log("# mode=offline (no TON wallet required)");

  const server = spawn("npm", ["run", "demo:mcp"], {
    env: envBase,
    stdio: ["ignore", "pipe", "pipe"],
  });

  const serverLines: string[] = [];
  server.stdout?.on("data", (d) => serverLines.push(String(d)));
  server.stderr?.on("data", (d) => serverLines.push(String(d)));

  try {
    await waitForHttpOk(`http://localhost:${port}/mcp`, 10_000);
    log("\n## MCP server ready");
    log(`GET http://localhost:${port}/mcp -> 200`);

    log("\n## Running agent demo");
    const agent = spawn("npm", ["run", "demo:agent:offline"], {
      env: { ...envBase, PERSONA: persona },
      stdio: ["ignore", "pipe", "pipe"],
    });

    const agentOut: string[] = [];
    agent.stdout?.on("data", (d) => agentOut.push(String(d)));
    agent.stderr?.on("data", (d) => agentOut.push(String(d)));

    const exitCode: number = await new Promise((resolve, reject) => {
      agent.on("error", reject);
      agent.on("close", (code) => resolve(code ?? 0));
    });

    log("\n### Agent output");
    log(agentOut.join("").trimEnd());
    log(`\n# agent_exit_code=${exitCode}`);
  } finally {
    server.kill("SIGTERM");
  }

  const full = [
    ...transcript,
    "\n## MCP server raw output",
    serverLines.join("").trimEnd(),
    "",
  ].join("\n");

  await fs.mkdir(path.dirname(outFile), { recursive: true });
  await fs.writeFile(outFile, full, "utf8");

  log(`\nSaved transcript: ${outFile}`);
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
