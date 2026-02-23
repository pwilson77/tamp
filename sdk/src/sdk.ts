import fs from "node:fs/promises";

import Ajv from "ajv/dist/2020";
import axios from "axios";
import {
  Address,
  beginCell,
  Cell,
  contractAddress,
  Dictionary,
  type TupleItem,
} from "@ton/core";
import { TonClient } from "@ton/ton";

export const TAMP_OPCODES = {
  // register_agent#a293495e manifestUrl:^string capabilities:int257
  RegisterAgent: 0xa293495e,
} as const;

export type TonConnectMessage = {
  address: string;
  amount: string;
  payload?: string;
  stateInit?: string;
};

export type TonConnectSendTransactionRequest = {
  validUntil: number;
  messages: TonConnectMessage[];
};

export type AgentCard = {
  protocol_version: string;
  name: string;
  description: string;
  homepage: string;

  verification_ref: string;

  contact: {
    tg_bot?: string;
    mcp_endpoint?: string;
    [k: string]: unknown;
  };

  mcp_endpoint?: string;
  mcp_tools?: Array<{
    name: string;
    description: string;
    input_schema?: Record<string, unknown>;
    output_schema?: Record<string, unknown>;
    [k: string]: unknown;
  }>;

  capabilities: Array<{
    skill: string;
    description: string;
    inputs: string[];
    pricing: {
      amount: string;
      unit: string;
      type: string;
      [k: string]: unknown;
    };
    [k: string]: unknown;
  }>;

  security: {
    hitl_required: boolean;
    veritas_verified: boolean;
    [k: string]: unknown;
  };

  [k: string]: unknown;
};

export type EntryState = {
  owner: Address;
  manifestUrl: string;
  capabilities: bigint;
  isVerified: boolean;
  bondAmountNano: bigint;
};

export type DiscoveredAgent = {
  owner: Address;
  entry: Address;
  entryState: EntryState;
  manifestUrl: string;
  manifest: AgentCard;
  mcpEndpoint: string | null;
  live: boolean;
  trustScore: number;
};

export type TampDiscoveryConfig = {
  registryAddress: string;
  tonRpcEndpoint: string;
  tonApiKey?: string;
  schemaPath?: URL;
};

// Embedded to keep deterministic address derivation self-contained.
// This is the compiled AgentEntry code cell (BOC, base64) from `tamp-blueprint`.
const AGENT_ENTRY_CODE_BOC_B64 = `
te6ccgECFwEAA28AAiz/AI6I9KQT9LzyyAvtUyCOgTDh7UPZAQICAnEDBATwAdBy1yHSANIA+kAhEDRQ
Zm8E+GEC+GLtRNDSAAGOH/pA+kDUAdABgQEB1wDSANQB0IEBAdcAMBYVFEMwbBad+kD6QFkC0QGLCHBw
IeIHkl8H4AXXDR/y4IIhghBDgnQIuuMCIYIQuG7KHLrjAiGCEPm1l1W64wI2ExQVFgICdgUGAgEgCQoB
ea9G9qJoaQAAxw/9IH0gagDoAMCAgOuAaQBqAOhAgIDrgBgLCoohmDYLTv0gfSAsgWiAxYQ4OBDxbZ42
MMAHAXmvrPaiaGkAAMcP/SB9IGoA6ADAgIDrgGkAagDoQICA64AYCwqKIZg2C079IH0gLIFogMWEODgQ
8W2eNjDACAACIQACIwIBIAsMAgFuDxABebXRPaiaGkAAMcP/SB9IGoA6ADAgIDrgGkAagDoQICA64AYC
wqKIZg2C079IH0gLIFogMWEODgQ8W2eNjDANAXm0BB2omhpAADHD/0gfSBqAOgAwICA64BpAGoA6ECAg
OuAGAsKiiGYNgtO/SB9ICyBaIDFhDg4EPFtnjYywDgACJQAKVHUyU0MBeazz9qJoaQAAxw/9IH0gagDo
AMCAgOuAaQBqAOhAgIDrgBgLCoohmDYLTv0gfSAsgWiAxYQ4OBDxbZ42MMARAXmsKnaiaGkAAMcP/SB9
IGoA6ADAgIDrgGkAagDoQICA64AYCwqKIZg2C079IH0gLIFogMWEODgQ8W2eNjDAEgACIgACIACgbDHU
AdABgQEB1wAw+EFvJFuBEiUyJMcF8vSBbUaLCFIwAfkBAfkBvfL0EDVVEsh/AcoAVVBQVs4TzgHIzs2B
AQHPAMoAAciBAQHPAM3J7VQAoGwx1AHQAYEBAdcAMPhBbyRbgRIlMiXHBfL0gW1GiwhSMAH5AQH5Ab3y
9BA1VRLIfwHKAFVQUFbOE84ByM7NgQEBzwDKAAHIgQEBzwDNye1UAHJb+EFvJBNfA4EKXyHCAPL0FqAQ
NUQwEsh/AcoAVVBQVs4TzgHIzs2BAQHPAMoAAciBAQHPAM3J7VQAjoIQXDVDDrqOOATSADD4QW8kW4ES
JTIkxwXy9BA1RAPIfwHKAFVQUFbOE84ByM7NgQEBzwDKAAHIgQEBzwDNye1U4F8G8sCC
`;

function agentEntryCodeCell(): Cell {
  const b64 = AGENT_ENTRY_CODE_BOC_B64.replace(/\s+/g, "");
  const cells = Cell.fromBoc(Buffer.from(b64, "base64"));
  if (cells.length < 1) {
    throw new Error("Failed to decode AgentEntry code BOC");
  }
  return cells[0];
}

export function calculateAgentEntryAddress(
  owner: Address,
  registry: Address,
): Address {
  const data = beginCell()
    .storeUint(0, 1)
    .storeAddress(owner)
    .storeAddress(registry)
    .endCell();
  return contractAddress(0, { code: agentEntryCodeCell(), data });
}

export function buildRegisterAgentPayload(args: {
  manifestUrl: string;
  capabilities: bigint;
}): Cell {
  return beginCell()
    .storeUint(TAMP_OPCODES.RegisterAgent, 32)
    .storeStringRefTail(args.manifestUrl)
    .storeInt(args.capabilities, 257)
    .endCell();
}

export function buildRegisterAgentTonConnectTx(args: {
  registryAddress: string | Address;
  manifestUrl: string;
  capabilities: bigint;
  valueNano?: bigint;
  validForSeconds?: number;
}): TonConnectSendTransactionRequest {
  const registry =
    typeof args.registryAddress === "string"
      ? Address.parse(args.registryAddress)
      : args.registryAddress;

  const valueNano = args.valueNano ?? 60_000_000n;
  const validForSeconds = args.validForSeconds ?? 300;
  const payloadCell = buildRegisterAgentPayload({
    manifestUrl: args.manifestUrl,
    capabilities: args.capabilities,
  });

  return {
    validUntil: Math.floor(Date.now() / 1000) + validForSeconds,
    messages: [
      {
        address: registry.toString(),
        amount: valueNano.toString(),
        payload: payloadCell.toBoc().toString("base64"),
      },
    ],
  };
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await axios.get(url, {
    timeout: 10_000,
    maxRedirects: 3,
    responseType: "json",
    validateStatus: (s) => s >= 200 && s < 300,
  });
  return res.data;
}

async function pingMcpEndpoint(endpoint: string): Promise<boolean> {
  try {
    const res = await axios.get(endpoint, {
      timeout: 5_000,
      maxRedirects: 2,
      validateStatus: (s) => s >= 200 && s < 300,
    });
    return res.status >= 200 && res.status < 300;
  } catch {
    return false;
  }
}

async function runMethodWithRetry(
  client: TonClient,
  address: Address,
  method: string,
  stack: TupleItem[] = [],
  maxAttempts = 6,
) {
  let lastErr: unknown = null;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await client.runMethod(address, method, stack);
    } catch (e: any) {
      lastErr = e;
      const status = e?.response?.status;
      const isRateLimit = status === 429;
      const isTransient = isRateLimit || status === 500 || status === 503;
      if (!isTransient || attempt === maxAttempts) {
        throw e;
      }
      const backoffMs = Math.min(8_000, 500 * 2 ** (attempt - 1));
      await new Promise((r) => setTimeout(r, backoffMs));
    }
  }
  throw lastErr;
}

function decodeEntryStateStack(stack: any): EntryState {
  // Depending on ABI shape, struct may be returned as a tuple or as flat stack items.
  const s = stack;
  if (s.remaining > 0 && s.peek().type === "tuple") {
    const t = s.readTuple();
    return {
      owner: t.readAddress(),
      manifestUrl: t.readString(),
      capabilities: t.readBigNumber(),
      isVerified: t.readBoolean(),
      bondAmountNano: t.readBigNumber(),
    };
  }

  return {
    owner: s.readAddress(),
    manifestUrl: s.readString(),
    capabilities: s.readBigNumber(),
    isVerified: s.readBoolean(),
    bondAmountNano: s.readBigNumber(),
  };
}

export class TampDiscoveryClient {
  readonly registry: Address;
  readonly client: TonClient;

  private validate: ((data: unknown) => data is AgentCard) | null = null;
  private readonly ajv: Ajv;

  constructor(cfg: TampDiscoveryConfig) {
    this.registry = Address.parse(cfg.registryAddress);
    this.client = new TonClient({
      endpoint: cfg.tonRpcEndpoint,
      apiKey: cfg.tonApiKey,
    });

    const schemaUrl =
      cfg.schemaPath ?? new URL("../manifest.schema.json", import.meta.url);

    this.ajv = new Ajv({ allErrors: true, strict: false });
    // We lazily load schema in init() to keep constructor sync.
    this._schemaUrl = schemaUrl;
  }

  private _schemaUrl: URL;
  private _initialized = false;

  async init() {
    if (this._initialized) return;
    const raw = await fs.readFile(this._schemaUrl, "utf8");
    const schema = JSON.parse(raw) as object;
    this.validate = this.ajv.compile<AgentCard>(schema);
    this._initialized = true;
  }

  async findOwnersByCapability(capability: bigint): Promise<Address[]> {
    const res = await runMethodWithRetry(
      this.client,
      this.registry,
      "findAgentsByCapability",
      [{ type: "int", value: capability }],
    );

    const owners: Address[] = [];
    const ownersCell = res.stack.readCellOpt();
    if (!ownersCell) return owners;

    const dict = Dictionary.loadDirect(
      Dictionary.Keys.Address(),
      Dictionary.Values.Bool(),
      ownersCell,
    );

    for (const [addr] of dict) {
      owners.push(addr);
    }

    return owners;
  }

  async getEntryState(
    owner: Address,
  ): Promise<{ entry: Address; state: EntryState }> {
    const entry = calculateAgentEntryAddress(owner, this.registry);
    const res = await runMethodWithRetry(this.client, entry, "getEntryState");
    const state = decodeEntryStateStack(res.stack);
    return { entry, state };
  }

  async discover(capability: bigint): Promise<DiscoveredAgent[]> {
    await this.init();
    if (!this.validate) {
      throw new Error("SDK not initialized");
    }

    const owners = await this.findOwnersByCapability(capability);
    const out: DiscoveredAgent[] = [];

    for (const owner of owners) {
      let entry: Address;
      let state: EntryState;
      try {
        ({ entry, state } = await this.getEntryState(owner));
      } catch {
        continue;
      }

      // Index is append-only, so re-check actual caps.
      if ((state.capabilities & capability) === 0n) {
        continue;
      }

      let json: unknown;
      try {
        json = await fetchJson(state.manifestUrl);
      } catch {
        continue;
      }
      if (!this.validate(json)) {
        continue;
      }

      const manifest = json as AgentCard;
      const mcpEndpoint =
        manifest.mcp_endpoint ?? manifest.contact?.mcp_endpoint ?? null;
      const live = mcpEndpoint ? await pingMcpEndpoint(mcpEndpoint) : false;

      const bondTon = Number(state.bondAmountNano) / 1e9;
      const trustScore = bondTon * 1.5 + (state.isVerified ? 100 : 0);

      out.push({
        owner: state.owner,
        entry,
        entryState: state,
        manifestUrl: state.manifestUrl,
        manifest,
        mcpEndpoint,
        live,
        trustScore,
      });
    }

    return out;
  }
}
