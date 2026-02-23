import http from "node:http";
import { URL } from "node:url";

const port = Number.parseInt(process.env.PORT ?? "8787", 10);

const manifest = {
  protocol_version: "1.0.0",
  name: "TAMP Demo Agent",
  description:
    "Mock MCP agent used for demonstrating TAMP discovery + tool calling.",
  homepage: "https://example.invalid/tamp-demo",
  verification_ref: "demo://unverified",
  contact: {
    tg_bot: "@tamp_demo_bot",
    mcp_endpoint: `http://localhost:${port}/mcp`,
  },
  mcp_endpoint: `http://localhost:${port}/mcp`,
  mcp_tools: [
    {
      name: "trader_quote",
      description: "Return a mock trade quote (demo only).",
      input_schema: {
        type: "object",
        properties: {
          pair: { type: "string" },
          side: { type: "string", enum: ["buy", "sell"] },
          size: { type: "number" },
          slippageBps: { type: "number" },
        },
        required: ["pair", "side", "size"],
        additionalProperties: true,
      },
      output_schema: {
        type: "object",
        properties: {
          quote: {
            type: "object",
            properties: {
              price: { type: "string" },
              unit: { type: "string" },
              feeTon: { type: "string" },
              expiresInSeconds: { type: "number" },
            },
            required: ["price", "unit", "feeTon", "expiresInSeconds"],
            additionalProperties: true,
          },
          notes: { type: "string" },
        },
        required: ["quote"],
        additionalProperties: true,
      },
    },
    {
      name: "trader_execute",
      description: "Execute a trade based on a validated quote (demo only).",
      input_schema: {
        type: "object",
        properties: {
          pair: { type: "string" },
          side: { type: "string", enum: ["buy", "sell"] },
          size: { type: "number" },
          slippageBps: { type: "number" },
        },
        required: ["pair", "side", "size"],
        additionalProperties: true,
      },
      output_schema: {
        type: "object",
        properties: {
          execution: {
            type: "object",
            properties: {
              txHash: { type: "string" },
              executedPrice: { type: "string" },
              amountOut: { type: "string" },
              feePaid: { type: "string" },
            },
            required: ["txHash", "executedPrice", "amountOut", "feePaid"],
            additionalProperties: true,
          },
          notes: { type: "string" },
        },
        required: ["execution"],
        additionalProperties: true,
      },
    },
    {
      name: "security_risk_check",
      description: "Return a mock security risk assessment (demo only).",
      input_schema: {
        type: "object",
        properties: {
          wallet: { type: "string" },
          reason: { type: "string" },
        },
        required: ["wallet"],
        additionalProperties: true,
      },
      output_schema: {
        type: "object",
        properties: {
          risk: {
            type: "object",
            properties: {
              level: { type: "string", enum: ["low", "medium", "high"] },
              score: { type: "number" },
              flags: { type: "array", items: { type: "string" } },
            },
            required: ["level", "score", "flags"],
            additionalProperties: true,
          },
          notes: { type: "string" },
        },
        required: ["risk"],
        additionalProperties: true,
      },
    },
    {
      name: "security_deep_review",
      description: "Return a detailed security review of a wallet (demo only).",
      input_schema: {
        type: "object",
        properties: {
          wallet: { type: "string" },
          includeHistory: { type: "boolean" },
        },
        required: ["wallet"],
        additionalProperties: true,
      },
      output_schema: {
        type: "object",
        properties: {
          review: {
            type: "object",
            properties: {
              overallRisk: { type: "string" },
              verdict: { type: "string" },
              recommendations: { type: "array", items: { type: "string" } },
            },
            required: ["overallRisk", "verdict"],
            additionalProperties: true,
          },
          notes: { type: "string" },
        },
        required: ["review"],
        additionalProperties: true,
      },
    },
  ],
  capabilities: [
    {
      skill: "trader",
      description: "Mock trading capability used for demos.",
      inputs: ["pair", "side", "size"],
      pricing: { amount: "0.02", unit: "TON", type: "per_call" },
    },
    {
      skill: "security",
      description: "Mock security capability used for demos.",
      inputs: ["wallet"],
      pricing: { amount: "0.03", unit: "TON", type: "per_call" },
    },
  ],
  security: {
    hitl_required: false,
    veritas_verified: false,
  },
} as const;

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  const json = JSON.stringify(body, null, 2);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(json),
  });
  res.end(json);
}

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  if (chunks.length === 0) return null;
  const raw = Buffer.concat(chunks).toString("utf8");
  return JSON.parse(raw);
}

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url ?? "/", `http://127.0.0.1:${port}`);

  if (req.method === "GET" && u.pathname === "/") {
    return sendJson(res, 200, {
      ok: true,
      service: "tamp-demo-mcp",
      manifest: `http://localhost:${port}/ton-agent.demo.json`,
      mcp_endpoint: `http://localhost:${port}/mcp`,
    });
  }

  if (req.method === "GET" && u.pathname === "/ton-agent.demo.json") {
    return sendJson(res, 200, manifest);
  }

  if (req.method === "GET" && u.pathname === "/mcp") {
    return sendJson(res, 200, {
      ok: true,
      mcp: "demo",
      tools: manifest.mcp_tools,
    });
  }

  if (req.method === "GET" && u.pathname === "/mcp/tools") {
    return sendJson(res, 200, { tools: manifest.mcp_tools });
  }

  if (req.method === "POST" && u.pathname === "/mcp/call") {
    try {
      const body = (await readJsonBody(req)) as any;
      const tool = String(body?.tool ?? "");
      const input = body?.input ?? {};

      if (tool === "trader_quote") {
        const pair = String(input?.pair ?? "TON/USDT");
        const side = String(input?.side ?? "buy");
        const size = Number(input?.size ?? 0);
        const slippageBps = Number(input?.slippageBps ?? 50);

        return sendJson(res, 200, {
          ok: true,
          tool,
          output: {
            quote: {
              price: side === "sell" ? "2.14" : "2.16",
              unit: "USDT",
              feeTon: "0.02",
              expiresInSeconds: 30,
            },
            notes: `mock trader_quote pair=${pair} side=${side} size=${size} slippageBps=${slippageBps}`,
          },
        });
      }

      if (tool === "trader_execute") {
        const pair = String(input?.pair ?? "TON/USDT");
        const side = String(input?.side ?? "buy");
        const size = Number(input?.size ?? 0);
        const slippageBps = Number(input?.slippageBps ?? 50);

        const executedPrice = side === "sell" ? "2.135" : "2.165";
        const amountOut = (size * Number(executedPrice)).toFixed(2);
        const nonce = Math.floor(Math.random() * 1000000);
        const txHash = `0x${nonce.toString(16).padStart(8, "0")}`;

        return sendJson(res, 200, {
          ok: true,
          tool,
          output: {
            execution: {
              txHash,
              executedPrice,
              amountOut,
              feePaid: "0.015",
            },
            notes: `mock trader_execute pair=${pair} side=${side} size=${size} slippageBps=${slippageBps}`,
          },
        });
      }

      if (tool === "security_risk_check") {
        const wallet = String(input?.wallet ?? "");
        if (!wallet) {
          return sendJson(res, 400, {
            ok: false,
            error: "validation_error",
            message: "wallet is required",
          });
        }

        const flags = ["demo_only", "no_onchain_checks", "no_signatures"];
        const score = wallet.length % 100;
        const level = score > 70 ? "high" : score > 35 ? "medium" : "low";

        return sendJson(res, 200, {
          ok: true,
          tool,
          output: {
            risk: {
              level,
              score,
              flags,
            },
            notes: `mock security_risk_check for wallet=${wallet}`,
          },
        });
      }

      if (tool === "security_deep_review") {
        const wallet = String(input?.wallet ?? "");
        if (!wallet) {
          return sendJson(res, 400, {
            ok: false,
            error: "validation_error",
            message: "wallet is required",
          });
        }

        const score = wallet.length % 100;
        const riskLevel = score > 70 ? "high" : score > 35 ? "medium" : "low";
        const verdict =
          riskLevel === "high"
            ? "⚠️  UNSAFE: Proceed with extreme caution or avoid interaction."
            : riskLevel === "medium"
              ? "⚡ MODERATE: Safe for small amounts; monitor activity."
              : "✅ SAFE: No obvious red flags detected.";

        const includeHistory = input?.includeHistory ?? true;
        const recommendations =
          riskLevel === "high"
            ? [
                "Use a hardware wallet for protection",
                "Consult on-chain auditors",
                "Limit first transaction amount",
              ]
            : riskLevel === "medium"
              ? [
                  "Enable 2FA on related accounts",
                  "Start with a small test transaction",
                  "Monitor for unusual activity",
                ]
              : ["Proceed normally", "Keep standard security practices"];

        return sendJson(res, 200, {
          ok: true,
          tool,
          output: {
            review: {
              overallRisk: riskLevel.toUpperCase(),
              verdict,
              recommendations,
            },
            notes: `mock security_deep_review for wallet=${wallet} includeHistory=${includeHistory}`,
          },
        });
      }

      return sendJson(res, 404, { ok: false, error: "unknown_tool", tool });
    } catch (e: any) {
      return sendJson(res, 400, {
        ok: false,
        error: "bad_request",
        message: String(e?.message ?? e),
      });
    }
  }

  return sendJson(res, 404, {
    ok: false,
    error: "not_found",
    path: u.pathname,
  });
});

server.listen(port, "0.0.0.0", () => {
  // eslint-disable-next-line no-console
  console.log(`TAMP demo MCP server listening on http://localhost:${port}`);
  // eslint-disable-next-line no-console
  console.log(`Manifest: http://localhost:${port}/ton-agent.demo.json`);
});
