import process from "node:process";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import fs from "node:fs/promises";

import { buildRegisterAgentTonConnectTx } from "../src/sdk";
import { CAPABILITIES, CAPABILITY_BITS } from "../src/capabilities";

const DEFAULT_REGISTRY = "EQDv_rpROIQbba674NFD21ADg94VW5MM2zEpdwhDov2oEzAS";
const DEFAULT_BASE_URL = "http://localhost:8787";
const DEFAULT_WALLET_B = "0QCL1y3V2sGkg5Qb-VmgSAW2abYZSKs6rUD1471lrRmZRNik";

const CAP_TRADER = CAPABILITIES.trader;
const CAP_SECURITY = CAPABILITIES.security;

function hasFlag(name: string): boolean {
  return process.argv.includes(name);
}

function runBlueprintRegister(args: {
  contractsDir: string;
  manifestUrl: string;
  capabilities: bigint;
}): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      "npx",
      ["@ton/blueprint", "run", "registerAgent", "--testnet", "--tonconnect"],
      {
        cwd: args.contractsDir,
        stdio: "inherit",
        env: {
          ...process.env,
          MANIFEST_URL: args.manifestUrl,
          CAPABILITIES: args.capabilities.toString(),
        },
      },
    );

    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
}

async function resetTonConnectSession(contractsDir: string): Promise<void> {
  const sessionFile = path.resolve(
    contractsDir,
    "temp",
    "testnet",
    "tonconnect.json",
  );
  try {
    await fs.rm(sessionFile, { force: true });
    console.log(`🧹 Cleared TonConnect session: ${sessionFile}`);
  } catch (e) {
    console.warn("Could not clear TonConnect session cache", e);
  }
}

async function waitForEnter(prompt: string): Promise<void> {
  await new Promise((resolve) => {
    process.stdout.write(`${prompt}\n`);
    process.stdin.resume();
    process.stdin.once("data", () => {
      process.stdin.pause();
      resolve(undefined);
    });
  });
}

async function main() {
  const registryAddress = process.env.REGISTRY_ADDRESS ?? DEFAULT_REGISTRY;
  const baseUrl = process.env.MANIFEST_BASE_URL ?? DEFAULT_BASE_URL;
  const walletA = process.env.WALLET_A ?? "<your_wallet_A>";
  const walletB = process.env.WALLET_B ?? DEFAULT_WALLET_B;
  const useTonConnect = hasFlag("--tonconnect");

  const traderManifestUrl = `${baseUrl}/ton-agent.trader.json`;
  const securityManifestUrl = `${baseUrl}/ton-agent.security.json`;

  const traderTx = buildRegisterAgentTonConnectTx({
    registryAddress,
    manifestUrl: traderManifestUrl,
    capabilities: CAP_TRADER,
    valueNano: 60_000_000n,
    validForSeconds: 600,
  });

  const securityTx = buildRegisterAgentTonConnectTx({
    registryAddress,
    manifestUrl: securityManifestUrl,
    capabilities: CAP_SECURITY,
    valueNano: 60_000_000n,
    validForSeconds: 600,
  });

  console.log("\n=== TAMP Mock Agent Registration Payloads ===\n");
  console.log(`Registry: ${registryAddress}`);
  console.log(`Manifest Base URL: ${baseUrl}\n`);
  console.log("Wallet mapping:");
  console.log(`- Wallet A (Trader signer):   ${walletA}`);
  console.log(`- Wallet B (Security signer): ${walletB}\n`);

  console.log("1) Trader Agent (sign with Wallet A)");
  console.log(`   manifestUrl: ${traderManifestUrl}`);
  console.log(
    `   capability: ${CAP_TRADER.toString()} (1<<${CAPABILITY_BITS.trader})\n`,
  );
  console.log(JSON.stringify(traderTx, null, 2));

  console.log("\n2) Security Agent (sign with Wallet B)");
  console.log(`   manifestUrl: ${securityManifestUrl}`);
  console.log(
    `   capability: ${CAP_SECURITY.toString()} (1<<${CAPABILITY_BITS.security})\n`,
  );
  console.log(JSON.stringify(securityTx, null, 2));

  console.log("\nIMPORTANT:");
  console.log(
    "- Use TWO different wallets if you want two distinct agents on-chain.",
  );
  console.log("- One wallet maps to one AgentEntry in this registry design.");
  console.log("- Start local manifest server first: npm run demo:mcp");

  if (!useTonConnect) {
    console.log("\nTip: run with --tonconnect for interactive wallet signing.");
    return;
  }

  const here = path.dirname(fileURLToPath(import.meta.url));
  const contractsDir = path.resolve(here, "../../contracts/tamp-blueprint");

  console.log("\n=== Interactive TonConnect Signing Mode ===");
  await resetTonConnectSession(contractsDir);
  console.log("Step 1/2: Sign Trader registration with Wallet A");
  let code = await runBlueprintRegister({
    contractsDir,
    manifestUrl: traderManifestUrl,
    capabilities: CAP_TRADER,
  });
  if (code !== 0) {
    console.error(`Trader registration command exited with code ${code}`);
    process.exit(code);
  }

  await waitForEnter(
    "\nSwitch to Wallet B in TonConnect, then press Enter to continue with Security registration...",
  );

  await resetTonConnectSession(contractsDir);

  console.log("\nStep 2/2: Sign Security registration with Wallet B");
  code = await runBlueprintRegister({
    contractsDir,
    manifestUrl: securityManifestUrl,
    capabilities: CAP_SECURITY,
  });
  if (code !== 0) {
    console.error(`Security registration command exited with code ${code}`);
    process.exit(code);
  }

  process.stdin.pause();
  console.log("\n✅ Both registration commands submitted.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
