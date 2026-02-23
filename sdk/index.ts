import process from "node:process";

import { TampDiscoveryClient, type AgentCard } from "./src/sdk";

function usage(): never {
  // Keep CLI minimal: env + one positional arg.
  console.error(
    [
      "Usage:",
      "  REGISTRY_ADDRESS=<addr> TON_RPC_ENDPOINT=<url> [TON_API_KEY=<key>] npm run discover -- <capabilityBitMask>",
      "",
      "Example:",
      "  REGISTRY_ADDRESS=EQ... TON_RPC_ENDPOINT=https://toncenter.com/api/v2/jsonRPC TON_API_KEY=... npm run discover -- 32",
      "  (32 == 1<<5)",
    ].join("\n"),
  );
  process.exit(2);
}

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    console.error(`Missing env var ${name}`);
    usage();
  }
  return v;
}

function marketplacePrint(agentAddr: string, card: AgentCard) {
  console.log("=".repeat(80));
  console.log(`${card.name}  (owner=${agentAddr})`);
  console.log(card.description);
  console.log(`Homepage: ${card.homepage}`);
  console.log(`VerificationRef: ${card.verification_ref}`);
  if (card.security) {
    console.log(
      `Security: hitl_required=${card.security.hitl_required} veritas_verified=${card.security.veritas_verified}`,
    );
  }
  if (card.mcp_endpoint) {
    console.log(`MCP: ${card.mcp_endpoint}`);
  }
  console.log("Capabilities:");
  for (const c of card.capabilities ?? []) {
    const price = c.pricing
      ? `${c.pricing.amount} ${c.pricing.unit} (${c.pricing.type})`
      : "n/a";
    console.log(`- ${c.skill}: ${c.description}`);
    console.log(`  inputs: ${(c.inputs ?? []).join(", ")}`);
    console.log(`  price:  ${price}`);
  }
}

async function main() {
  const capabilityArg = process.argv[2];
  if (!capabilityArg) usage();

  const capability = BigInt(capabilityArg);

  const sdk = new TampDiscoveryClient({
    registryAddress: getEnv("REGISTRY_ADDRESS"),
    tonRpcEndpoint: getEnv("TON_RPC_ENDPOINT"),
    tonApiKey: process.env.TON_API_KEY,
  });

  console.log(
    `Querying registry ${getEnv("REGISTRY_ADDRESS")} for capability=${capability.toString()} ...`,
  );

  const agents = await sdk.discover(capability);
  if (agents.length === 0) {
    console.log("No agents found.");
    return;
  }

  console.log(`Found ${agents.length} agent(s).`);
  for (const a of agents) {
    console.log("=".repeat(80));
    console.log(`${a.manifest.name}`);
    console.log(`owner: ${a.owner.toString()}`);
    console.log(`entry: ${a.entry.toString()}`);
    console.log(`caps:  ${a.entryState.capabilities.toString()}`);
    console.log(
      `bond:  ${(Number(a.entryState.bondAmountNano) / 1e9).toFixed(4)} TON`,
    );
    console.log(`verified: ${a.entryState.isVerified}`);
    console.log(`live: ${a.live}`);
    console.log(`trust_score: ${a.trustScore.toFixed(2)}`);
    marketplacePrint(a.owner.toString(), a.manifest as AgentCard);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
