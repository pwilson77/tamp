export const CAPABILITY_BITS = {
  trader: 4,
  security: 5,
} as const;

export type CapabilityKey = keyof typeof CAPABILITY_BITS;

export const CAPABILITIES: Record<CapabilityKey, bigint> = {
  trader: 1n << BigInt(CAPABILITY_BITS.trader),
  security: 1n << BigInt(CAPABILITY_BITS.security),
};

export const CAPABILITY_KEYS = Object.keys(CAPABILITIES) as CapabilityKey[];

export function combineCapabilities(keys: CapabilityKey[]): bigint {
  return keys.reduce((mask, key) => mask | CAPABILITIES[key], 0n);
}

export function hasCapability(mask: bigint, key: CapabilityKey): boolean {
  return (mask & CAPABILITIES[key]) !== 0n;
}

export function parseCapabilityKeys(input: string): CapabilityKey[] {
  const raw = input
    .split(",")
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);

  const out: CapabilityKey[] = [];
  const seen = new Set<string>();

  for (const item of raw) {
    if (!(item in CAPABILITIES)) {
      throw new Error(
        `Unknown capability: ${item}. Valid keys: ${CAPABILITY_KEYS.join(", ")}`,
      );
    }
    if (seen.has(item)) continue;
    seen.add(item);
    out.push(item as CapabilityKey);
  }

  return out;
}

export function decodeCapabilities(mask: bigint): CapabilityKey[] {
  return CAPABILITY_KEYS.filter((key) => hasCapability(mask, key));
}
