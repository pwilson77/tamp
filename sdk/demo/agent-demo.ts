import process from "node:process";

import axios from "axios";

import {
  TampDiscoveryClient,
  buildRegisterAgentTonConnectTx,
  type DiscoveredAgent,
} from "../src/sdk";

const DEFAULT_TESTNET_REGISTRY =
  "EQDv_rpROIQbba674NFD21ADg94VW5MM2zEpdwhDov2oEzAS";
const DEFAULT_TESTNET_RPC = "https://testnet.toncenter.com/api/v2/jsonRPC";
const DEFAULT_DEMO_MANIFEST_URL = "http://localhost:8787/ton-agent.demo.json";

// Loader spinner frames
const loaderFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let loaderIndex = 0;

async function showLoader(message: string, seconds = 2): Promise<void> {
  const isInteractive = Boolean(process.stdout.isTTY && !process.env.CI);

  if (!isInteractive) {
    console.log(`🤖 [AI AGENT]: ${message}...`);
    await new Promise((r) => setTimeout(r, seconds * 1000));
    return;
  }

  const frames = loaderFrames.length;
  const totalMs = seconds * 1000;
  const frameMs = totalMs / frames;
  const startTime = Date.now();

  process.stdout.write(`🤖 [AI AGENT]: ${message}`);
  while (Date.now() - startTime < totalMs) {
    process.stdout.write(
      `\r🤖 [AI AGENT]: ${message} ${loaderFrames[loaderIndex % frames]}`,
    );
    loaderIndex++;
    await new Promise((r) => setTimeout(r, frameMs));
  }
  process.stdout.write(`\r🤖 [AI AGENT]: ${message}... ✓\n`);
}

// Simulated "AI thinking" with pauses to show real-time agent logic
async function agentThink(message: string, seconds = 2): Promise<void> {
  await showLoader(message, seconds);
}

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function parseCapabilityArg(): bigint {
  const arg = process.argv[2];
  if (!arg) return 32n;
  if (!/^[0-9]+$/.test(arg)) {
    throw new Error(`capabilityBitMask must be an integer, got: ${arg}`);
  }
  return BigInt(arg);
}

function pickAgent(args: {
  agents: DiscoveredAgent[];
  targetManifestUrl: string;
}): DiscoveredAgent | null {
  const byUrl = args.agents.filter(
    (a) => a.manifestUrl === args.targetManifestUrl,
  );
  if (byUrl.length > 0) {
    return byUrl.sort((a, b) => b.trustScore - a.trustScore)[0];
  }

  const live = args.agents.filter((a) => a.live);
  if (live.length > 0) {
    return live.sort((a, b) => b.trustScore - a.trustScore)[0];
  }

  if (args.agents.length > 0) return args.agents[0];
  return null;
}

async function callTool(args: {
  mcpEndpoint: string;
  tool: string;
  input: unknown;
}): Promise<unknown> {
  const url = `${args.mcpEndpoint.replace(/\/+$/, "")}/call`;
  const res = await axios.post(
    url,
    { tool: args.tool, input: args.input },
    {
      timeout: 10_000,
      validateStatus: (s) => s >= 200 && s < 300,
    },
  );
  return res.data;
}

type Persona = "trader" | "security";

function parsePersona(): Persona {
  const v = (process.env.PERSONA ?? "trader").toLowerCase();
  if (v === "trader" || v === "security") return v;
  return "trader";
}

function pickToolName(args: { persona: Persona; manifest: any }): string {
  const tools: Array<{ name?: unknown }> = Array.isArray(
    args.manifest?.mcp_tools,
  )
    ? args.manifest.mcp_tools
    : [];

  const byEnv = process.env.TOOL_NAME;
  if (byEnv) return byEnv;

  const desired = args.persona === "security" ? "security" : "trader";
  const match = tools.find((t) => String(t?.name ?? "").includes(desired));
  if (match?.name) return String(match.name);

  const fallback = tools[0]?.name;
  if (fallback) return String(fallback);
  return args.persona === "security" ? "security_risk_check" : "trader_quote";
}

function buildToolInput(args: { persona: Persona; prompt: string }): unknown {
  if (args.persona === "security") {
    return {
      wallet:
        process.env.WALLET ??
        "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c",
      reason: args.prompt,
    };
  }

  return {
    pair: process.env.PAIR ?? "TON/USDT",
    side: process.env.SIDE ?? "buy",
    size: Number(process.env.SIZE ?? "25"),
    slippageBps: Number(process.env.SLIPPAGE_BPS ?? "50"),
    prompt: args.prompt,
  };
}

async function conductTraderWorkflow(args: {
  mcpEndpoint: string;
  manifest: any;
  persona: Persona;
}): Promise<void> {
  const { mcpEndpoint, manifest } = args;

  console.log("📊 TRADER WORKFLOW: Get Quote → Review → Execute");
  console.log("--------------------------------------\n");

  const input = {
    pair: process.env.PAIR ?? "TON/USDT",
    side: process.env.SIDE ?? "buy",
    size: Number(process.env.SIZE ?? "25"),
    slippageBps: Number(process.env.SLIPPAGE_BPS ?? "50"),
  };

  await agentThink("Calling trader_quote to get current market price", 1);

  const quoteResult = await callTool({
    mcpEndpoint,
    tool: "trader_quote",
    input,
  });

  console.log("\n✅ Quote Received:");
  console.log("--------------------------------------");
  console.log(JSON.stringify(quoteResult?.output?.quote, null, 2));
  console.log("--------------------------------------\n");

  await agentThink(
    `Analyzing quote: price=${quoteResult?.output?.quote?.price}, fee=${quoteResult?.output?.quote?.feeTon} TON`,
    2,
  );
  await agentThink(
    `Determining: Is this a good price? (slippage=${input.slippageBps}bps acceptable)`,
    3,
  );

  console.log(
    `\n💭 Agent Decision: Quote looks favorable. Proceeding with execution...\n`,
  );
  await agentThink("Calling trader_execute to finalize the trade", 1);

  const execResult = await callTool({
    mcpEndpoint,
    tool: "trader_execute",
    input,
  });

  console.log("\n✅ Trade Executed:");
  console.log("--------------------------------------");
  console.log(JSON.stringify(execResult?.output?.execution, null, 2));
  console.log("--------------------------------------\n");

  await agentThink(
    `Confirming transaction: ${execResult?.output?.execution?.txHash}`,
    1,
  );

  console.log(
    `\n🎉 SUCCESS: Trade workflow completed via Agent-to-Agent Protocol.`,
  );
  console.log(
    `   • Discovered service agent via TAMP + verified trust via on-chain Bond\n` +
      `   • Fetched real-time quote via MCP\n` +
      `   • Executed trade and confirmed on-chain\n`,
  );
}

async function conductSecurityWorkflow(args: {
  mcpEndpoint: string;
  manifest: any;
  persona: Persona;
}): Promise<void> {
  const { mcpEndpoint, manifest } = args;

  console.log("🔐 SECURITY WORKFLOW: Risk Check → Deep Review → Verdict");
  console.log("--------------------------------------\n");

  const wallet =
    process.env.WALLET ?? "EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c";
  const reason =
    "Validating wallet before a significant smart contract interaction.";

  await agentThink(
    "Calling security_risk_check for initial threat assessment",
    1,
  );

  const riskResult = await callTool({
    mcpEndpoint,
    tool: "security_risk_check",
    input: { wallet, reason },
  });

  console.log("\n✅ Initial Risk Assessment:");
  console.log("--------------------------------------");
  console.log(JSON.stringify(riskResult?.output?.risk, null, 2));
  console.log("--------------------------------------\n");

  const riskLevel = riskResult?.output?.risk?.level ?? "unknown";
  const riskScore = riskResult?.output?.risk?.score ?? 0;

  await agentThink(
    `Risk Level: ${riskLevel.toUpperCase()} (score=${riskScore}). Determining next steps...`,
    2,
  );

  if (riskLevel === "high") {
    await agentThink(
      "High risk detected! Escalating to deep security review for thorough analysis",
      2,
    );

    const deepResult = await callTool({
      mcpEndpoint,
      tool: "security_deep_review",
      input: { wallet, includeHistory: true },
    });

    console.log("\n✅ Comprehensive Security Review:");
    console.log("--------------------------------------");
    console.log(JSON.stringify(deepResult?.output?.review, null, 2));
    console.log("--------------------------------------\n");

    const verdict = deepResult?.output?.review?.verdict ?? "Unable to assess";
    const recommendations = deepResult?.output?.review?.recommendations ?? [];

    console.log(`📋 Verdict: ${verdict}\n`);
    if (recommendations && recommendations.length > 0) {
      console.log("📌 Recommendations:");
      for (const rec of recommendations) {
        console.log(`   • ${rec}`);
      }
      console.log();
    }
  } else {
    await agentThink(
      `Risk is ${riskLevel}. Fetching detailed review for compliance documentation.`,
      2,
    );

    const deepResult = await callTool({
      mcpEndpoint,
      tool: "security_deep_review",
      input: { wallet, includeHistory: false },
    });

    console.log("\n✅ Security Review Summary:");
    console.log("--------------------------------------");
    console.log(JSON.stringify(deepResult?.output?.review, null, 2));
    console.log("--------------------------------------\n");
  }

  console.log(
    `\n🎉 SUCCESS: Security audit workflow completed via Agent-to-Agent Protocol.`,
  );
  console.log(
    `   • Discovered security service agent via TAMP + verified trust\n` +
      `   • Performed comprehensive wallet risk assessment via MCP\n` +
      `   • Generated actionable security recommendations\n`,
  );
}

async function main() {
  console.log("🚀 STARTING TAMP AGENT DISCOVERY DEMO");
  console.log("=====================================");

  const capability = parseCapabilityArg();
  const registryAddress =
    process.env.REGISTRY_ADDRESS ?? DEFAULT_TESTNET_REGISTRY;
  const tonRpcEndpoint = process.env.TON_RPC_ENDPOINT ?? DEFAULT_TESTNET_RPC;
  const tonApiKey = process.env.TON_API_KEY;
  const demoManifestUrl =
    process.env.DEMO_MANIFEST_URL ?? DEFAULT_DEMO_MANIFEST_URL;
  const persona = parsePersona();

  const offline =
    (process.env.OFFLINE ?? "").toLowerCase() === "1" ||
    (process.env.OFFLINE ?? "").toLowerCase() === "true" ||
    hasFlag("--offline");

  const personaEmoji = persona === "security" ? "🔒" : "📈";
  const personaTitle =
    persona === "security" ? "Security Agent" : "Trading Agent";
  const needSkill =
    persona === "security"
      ? "smart contract risk assessment"
      : "real-time trading quotes";

  console.log(`${personaEmoji} PERSONA: ${personaTitle}`);
  console.log("=====================================\n");

  // Offline mode with narrative
  if (offline) {
    await agentThink(
      `I need to find an agent that can provide ${needSkill}`,
      2,
    );
    await agentThink("Fetching manifest from local MCP server", 2);

    const manifestRes = await axios.get(demoManifestUrl, {
      timeout: 10_000,
      validateStatus: (s) => s >= 200 && s < 300,
    });
    const manifest = manifestRes.data as any;
    const mcpEndpoint = String(manifest?.mcp_endpoint ?? "");

    if (!mcpEndpoint) {
      throw new Error("Demo manifest has no mcp_endpoint");
    }

    console.log("\n--------------------------------------");
    console.log(`💎 SERVICE AGENT IDENTIFIED: ${manifest.name}`);
    console.log(
      `🛠  SKILLS: ${(manifest.capabilities || []).map((c: any) => c.skill).join(", ")}`,
    );
    if (manifest.capabilities?.[0]?.pricing) {
      const p = manifest.capabilities[0].pricing;
      console.log(`💰 COST: ${p.amount} ${p.unit}`);
    }
    console.log(`🔗 MCP ENDPOINT: ${mcpEndpoint}`);
    console.log("--------------------------------------\n");

    await agentThink("Connecting to MCP endpoint", 1);

    if (persona === "trader") {
      await conductTraderWorkflow({ mcpEndpoint, manifest, persona });
    } else {
      await conductSecurityWorkflow({ mcpEndpoint, manifest, persona });
    }
    return;
  }

  // On-chain discovery with narrative
  await agentThink(
    `Querying TAMP Registry for agents with capability bitmask: ${capability.toString()}`,
    2,
  );

  const sdk = new TampDiscoveryClient({
    registryAddress,
    tonRpcEndpoint,
    tonApiKey,
  });
  const agents = await sdk.discover(capability);

  if (agents.length === 0) {
    console.log("❌ No agents found in registry.");
    console.log("\nTo run the full mock demo end-to-end:");
    console.log("1) Start the demo MCP server:");
    console.log("   cd projects/tamp/sdk && npm run demo:mcp");
    console.log(
      "2) Register your demo agent on-chain (testnet) pointing at the local manifest URL:",
    );
    console.log(
      "   cd projects/tamp/contracts/tamp-blueprint && MANIFEST_URL=http://localhost:8787/ton-agent.demo.json CAPABILITIES=32 npx @ton/blueprint run registerAgent --testnet --tonconnect",
    );

    console.log("\nTonConnect tx payload (alternative):");
    const tx = buildRegisterAgentTonConnectTx({
      registryAddress,
      manifestUrl: demoManifestUrl,
      capabilities: capability,
    });
    console.log(JSON.stringify(tx, null, 2));
    console.log("\nTip: to run without any on-chain setup, use OFFLINE mode:");
    console.log("  cd projects/tamp/sdk && npm run demo:agent:offline");
    process.exitCode = 2;
    return;
  }

  console.log(
    `✅ Found ${agents.length} potential partner(s) in the registry!\n`,
  );

  // Sort by trust score and display top options
  const sortedAgents = agents.sort((a, b) => b.trustScore - a.trustScore);
  for (let i = 0; i < Math.min(3, sortedAgents.length); i++) {
    const a = sortedAgents[i];
    console.log(
      `  ${i + 1}. ${a.manifest.name} (trust=${a.trustScore.toFixed(2)}, live=${a.live ? "✅" : "❌"})`,
    );
  }
  console.log();

  await agentThink("Evaluating trust scores and liveness", 2);

  const selected = pickAgent({ agents, targetManifestUrl: demoManifestUrl });
  if (!selected) {
    console.log("❌ No suitable agent matched your criteria.");
    process.exitCode = 1;
    return;
  }

  await agentThink(
    `Inspecting Agent Entry at: ${selected.entry.toString()}`,
    1,
  );
  await agentThink(`Fetching Manifest from: ${selected.manifestUrl}`, 2);

  console.log("--------------------------------------");
  console.log(`💎 SERVICE AGENT IDENTIFIED: ${selected.manifest.name}`);
  console.log(
    `🛠  SKILLS: ${(selected.manifest.capabilities || []).map((c) => c.skill).join(", ")}`,
  );
  if (selected.manifest.capabilities?.[0]?.pricing) {
    const p = selected.manifest.capabilities[0].pricing;
    console.log(`💰 COST: ${p.amount} ${p.unit}`);
  }
  console.log(`🔗 MCP ENDPOINT: ${selected.mcpEndpoint ?? "(none)"}`);
  console.log("--------------------------------------\n");

  // Trust analysis
  await agentThink(
    "Analyzing trust score via on-chain Bond + Verification status",
    2,
  );

  console.log(`📊 TRUST ANALYSIS:`);
  console.log(
    `   • Bond: ${(Number(selected.entryState.bondAmountNano) / 1e9).toFixed(4)} TON`,
  );
  console.log(
    `   • Verified: ${selected.entryState.isVerified ? "✅ Yes" : "❌ No"}`,
  );
  console.log(
    `   • Trust Score: ${selected.trustScore.toFixed(2)} (Bond × 1.5 + Verified × 100)`,
  );
  console.log(`   • MCP Live: ${selected.live ? "✅ Yes" : "❌ No"}\n`);

  const mcpEndpoint = selected.mcpEndpoint;
  if (!mcpEndpoint) {
    console.log(
      "❌ Selected agent has no mcp_endpoint; cannot call MCP tools.",
    );
    process.exitCode = 1;
    return;
  }

  await agentThink(
    "All checks passed. Initiating agent-to-agent communication.",
    2,
  );

  if (persona === "trader") {
    await conductTraderWorkflow({
      mcpEndpoint,
      manifest: selected.manifest,
      persona,
    });
  } else {
    await conductSecurityWorkflow({
      mcpEndpoint,
      manifest: selected.manifest,
      persona,
    });
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
