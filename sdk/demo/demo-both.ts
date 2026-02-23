import { spawn, spawnSync } from "node:child_process";
import process from "node:process";
import axios from "axios";

const MCPPort = 8787;
const MCPUrl = `http://localhost:${MCPPort}/mcp`;

async function waitForMCP(timeoutMs = 10000): Promise<void> {
  const start = Date.now();
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await axios.get(MCPUrl, { timeout: 1000 });
      return;
    } catch {
      if (Date.now() - start > timeoutMs) {
        throw new Error(`Timed out waiting for MCP at ${MCPUrl}`);
      }
      await new Promise((r) => setTimeout(r, 200));
    }
  }
}

function runDemo(persona: "trader" | "security"): {
  stdout: string;
  stderr: string;
  exitCode: number;
} {
  const result = spawnSync("npm", ["run", "demo:agent:offline"], {
    cwd: process.cwd(),
    env: { ...process.env, PERSONA: persona, OFFLINE: "1" },
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });

  return {
    stdout: String(result.stdout || ""),
    stderr: String(result.stderr || ""),
    exitCode: result.status ?? 1,
  };
}

async function main(): Promise<void> {
  console.log("🎬 TAMP COMBINED DEMO: Trader + Security Agent Simulation");
  console.log("=========================================================\n");

  console.log("📌 Starting MCP server...");
  const mcpProcess = spawn("npm", ["run", "demo:mcp"], {
    cwd: process.cwd(),
    detached: true,
    stdio: ["ignore", "ignore", "ignore"],
  });
  mcpProcess.unref();

  try {
    console.log("⏳ Waiting for MCP server to be ready...");
    await waitForMCP();
    console.log("✅ MCP server is ready!\n");

    await new Promise((r) => setTimeout(r, 500));

    // Run trader demo
    const sep = "════════════════════════════════════════════════════════════";
    console.log(sep);
    console.log("DEMO #1: TRADER AGENT (Real-time Trading Simulation)");
    console.log(sep);

    const traderResult = runDemo("trader");
    console.log(traderResult.stdout);
    if (traderResult.exitCode !== 0 && traderResult.stderr) {
      console.error("STDERR:", traderResult.stderr);
    }

    await new Promise((r) => setTimeout(r, 1000));

    // Run security demo
    console.log(`\n${sep}`);
    console.log("DEMO #2: SECURITY AGENT (Wallet Risk Assessment)");
    console.log(sep);

    const securityResult = runDemo("security");
    console.log(securityResult.stdout);
    if (securityResult.exitCode !== 0 && securityResult.stderr) {
      console.error("STDERR:", securityResult.stderr);
    }

    // Summary
    const separatorLine =
      "════════════════════════════════════════════════════════════";
    console.log(`\n${separatorLine}`);
    console.log(`✅ COMBINED DEMO COMPLETE`);
    console.log(separatorLine);
    console.log(
      [
        "\nYou just saw two Agent-to-Agent workflows via TAMP:",
        "",
        "  1️⃣  Trading Agent",
        "     • Discovered service agent via TAMP Registry",
        "     • Verified trust via on-chain Bond + Verification",
        "     • Got real-time quote via MCP trader_quote tool",
        "     • Made decision: quote looks good",
        "     • Executed trade via MCP trader_execute tool",
        "     • Confirmed on-chain transaction hash",
        "",
        "  2️⃣  Security Agent",
        "     • Discovered service agent via TAMP Registry",
        "     • Verified trust via on-chain Bond + Verification",
        "     • Performed risk check via MCP security_risk_check tool",
        "     • Made decision: escalated to deep review",
        "     • Ran detailed analysis via MCP security_deep_review tool",
        "     • Generated actionable security recommendations",
        "",
        "🔗 Key Innovation: Agents discovered each other without centralized lists,",
        "   verified economic trust on-chain (via bonds), and communicated via MCP.",
      ].join("\n"),
    );
  } finally {
    // Kill MCP process
    try {
      process.kill(-mcpProcess.pid!);
    } catch {
      // Ignore if already dead
    }
  }
}

main().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
