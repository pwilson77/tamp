import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { toNano } = require("@ton/core");
const {
  TampRegistry,
} = require("../build/TampRegistry/TampRegistry_TampRegistry");

export async function run(provider: any) {
  const registry = provider.open(await TampRegistry.fromInit());
  const contractAddress = registry.address.toString();

  console.log("Registry contract address:", contractAddress);

  try {
    const isDeployed = await provider.isContractDeployed(registry.address);

    if (isDeployed) {
      console.log("✅ Contract already deployed!");
      return;
    }

    console.log("Sending deploy transaction...");
    await registry.send(
      provider.sender(),
      { value: toNano("0.05") },
      { $$type: "Deploy", queryId: 0n },
    );

    console.log("✅ Transaction sent! Waiting for confirmation...");

    try {
      await provider.waitForDeploy(registry.address);
      console.log(
        "✅ Registry contract deployed successfully at:",
        contractAddress,
      );
    } catch (e) {
      console.log(
        "⏳ Deployment still pending. Contract address:",
        contractAddress,
      );
      console.log("Check Tonkeeper for transaction status.");
      console.log(
        "You can verify deployment at: https://testnet.tonviewer.com/" +
          contractAddress,
      );
    }
  } catch (e: any) {
    console.log("Registry contract address:", contractAddress);
    console.log(
      "Error or still pending. Check Tonkeeper for transaction status.",
    );
    console.log(
      "You can verify deployment at: https://testnet.tonviewer.com/" +
        contractAddress,
    );
  }
}
