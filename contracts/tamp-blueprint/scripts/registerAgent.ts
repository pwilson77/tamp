import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { toNano } = require("@ton/core");
const {
  TampRegistry,
} = require("../build/TampRegistry/TampRegistry_TampRegistry");

function requiredEnv(name: any) {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing env var ${name}`);
  }
  return v;
}

export async function run(provider: any) {
  const registry = provider.open(await TampRegistry.fromInit());
  const contractAddress = registry.address.toString();

  console.log("Registry contract address:", contractAddress);

  const manifestUrl = requiredEnv("MANIFEST_URL");
  const capabilitiesRaw = requiredEnv("CAPABILITIES");

  let capabilities;
  try {
    capabilities = BigInt(capabilitiesRaw);
  } catch {
    throw new Error(
      `CAPABILITIES must be an integer (e.g. 32). Got: ${capabilitiesRaw}`,
    );
  }

  const isDeployed = await provider.isContractDeployed(registry.address);
  if (!isDeployed) {
    throw new Error(
      "Registry is not deployed on this network yet. Deploy it first.",
    );
  }

  console.log("Registering agent...");
  console.log("manifestUrl:", manifestUrl);
  console.log("capabilities:", capabilities.toString());

  await registry.send(
    provider.sender(),
    { value: toNano("0.06") },
    {
      $$type: "RegisterAgent",
      manifestUrl,
      capabilities,
    },
  );

  console.log(
    "✅ Transaction sent! Wait for confirmation in your wallet/explorer.",
  );
}
