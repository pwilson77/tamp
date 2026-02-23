import "@stdlib/deploy";

// TAMP (TON Agent Manifest Protocol)
// Registry contract: maps AgentID (developer wallet address) -> manifest URL + capability bitmask.
//
// Capability discovery is done via an on-chain index (one set per capability bit) so that
// off-chain discovery does not need to scan the entire registry.
//
// Notes for A2A (Agent-to-Agent) communication:
// - An agent can discover other agents via capability bits.
// - It can then fetch the other agent's hosted manifest (ton-agent.json) from the URL stored here.
// - Payments and safety checks happen off-chain / via complementary protocols (ton402, TON-HITL).

struct AgentRecord {
  manifestUrl: String;
  capabilities: Int; // bitmask
}

message RegisterAgent {
  manifestUrl: String;
  capabilities: Int;
}

contract Registry with Deployable {
  // A small deposit discourages spam registrations.
  const MIN_DEPOSIT: Int = ton("0.05");

  agents: map<Address, AgentRecord>;

  // Capability index.
  // We keep one address-set per bit position (0..31) to avoid scanning `agents`.
  // The `findAgentsByCapability` getter expects `capability` to be a single-bit mask.
  cap0: map<Address, Bool>;
  cap1: map<Address, Bool>;
  cap2: map<Address, Bool>;
  cap3: map<Address, Bool>;
  cap4: map<Address, Bool>;
  cap5: map<Address, Bool>;
  cap6: map<Address, Bool>;
  cap7: map<Address, Bool>;
  cap8: map<Address, Bool>;
  cap9: map<Address, Bool>;
  cap10: map<Address, Bool>;
  cap11: map<Address, Bool>;
  cap12: map<Address, Bool>;
  cap13: map<Address, Bool>;
  cap14: map<Address, Bool>;
  cap15: map<Address, Bool>;
  cap16: map<Address, Bool>;
  cap17: map<Address, Bool>;
  cap18: map<Address, Bool>;
  cap19: map<Address, Bool>;
  cap20: map<Address, Bool>;
  cap21: map<Address, Bool>;
  cap22: map<Address, Bool>;
  cap23: map<Address, Bool>;
  cap24: map<Address, Bool>;
  cap25: map<Address, Bool>;
  cap26: map<Address, Bool>;
  cap27: map<Address, Bool>;
  cap28: map<Address, Bool>;
  cap29: map<Address, Bool>;
  cap30: map<Address, Bool>;
  cap31: map<Address, Bool>;

  init() {
    self.agents = emptyMap();

    self.cap0 = emptyMap();
    self.cap1 = emptyMap();
    self.cap2 = emptyMap();
    self.cap3 = emptyMap();
    self.cap4 = emptyMap();
    self.cap5 = emptyMap();
    self.cap6 = emptyMap();
    self.cap7 = emptyMap();
    self.cap8 = emptyMap();
    self.cap9 = emptyMap();
    self.cap10 = emptyMap();
    self.cap11 = emptyMap();
    self.cap12 = emptyMap();
    self.cap13 = emptyMap();
    self.cap14 = emptyMap();
    self.cap15 = emptyMap();
    self.cap16 = emptyMap();
    self.cap17 = emptyMap();
    self.cap18 = emptyMap();
    self.cap19 = emptyMap();
    self.cap20 = emptyMap();
    self.cap21 = emptyMap();
    self.cap22 = emptyMap();
    self.cap23 = emptyMap();
    self.cap24 = emptyMap();
    self.cap25 = emptyMap();
    self.cap26 = emptyMap();
    self.cap27 = emptyMap();
    self.cap28 = emptyMap();
    self.cap29 = emptyMap();
    self.cap30 = emptyMap();
    self.cap31 = emptyMap();
  }

  // Developers call this to register (or update) their agent.
  // AgentID is the sender address.
  receive(msg: RegisterAgent) {
    let ctx = context();
    require(ctx.value >= self.MIN_DEPOSIT, "deposit_too_small");

    // Basic sanity to reduce junk data on-chain.
    require(msg.manifestUrl != "", "manifest_url_empty");

    let agent = ctx.sender;
    self.agents.set(agent, AgentRecord{ manifestUrl: msg.manifestUrl, capabilities: msg.capabilities });

    // Update the capability index.
    // For simplicity we only add membership (and do not eagerly remove old bits).
    // Off-chain discovery will still be correct because it filters using `agents[addr].capabilities`.
    self.addToCapabilityIndex(agent, msg.capabilities);
  }

  fun addToCapabilityIndex(agent: Address, caps: Int) {
    if ((caps & (1 << 0)) != 0) { self.cap0.set(agent, true); }
    if ((caps & (1 << 1)) != 0) { self.cap1.set(agent, true); }
    if ((caps & (1 << 2)) != 0) { self.cap2.set(agent, true); }
    if ((caps & (1 << 3)) != 0) { self.cap3.set(agent, true); }
    if ((caps & (1 << 4)) != 0) { self.cap4.set(agent, true); }
    if ((caps & (1 << 5)) != 0) { self.cap5.set(agent, true); }
    if ((caps & (1 << 6)) != 0) { self.cap6.set(agent, true); }
    if ((caps & (1 << 7)) != 0) { self.cap7.set(agent, true); }
    if ((caps & (1 << 8)) != 0) { self.cap8.set(agent, true); }
    if ((caps & (1 << 9)) != 0) { self.cap9.set(agent, true); }
    if ((caps & (1 << 10)) != 0) { self.cap10.set(agent, true); }
    if ((caps & (1 << 11)) != 0) { self.cap11.set(agent, true); }
    if ((caps & (1 << 12)) != 0) { self.cap12.set(agent, true); }
    if ((caps & (1 << 13)) != 0) { self.cap13.set(agent, true); }
    if ((caps & (1 << 14)) != 0) { self.cap14.set(agent, true); }
    if ((caps & (1 << 15)) != 0) { self.cap15.set(agent, true); }
    if ((caps & (1 << 16)) != 0) { self.cap16.set(agent, true); }
    if ((caps & (1 << 17)) != 0) { self.cap17.set(agent, true); }
    if ((caps & (1 << 18)) != 0) { self.cap18.set(agent, true); }
    if ((caps & (1 << 19)) != 0) { self.cap19.set(agent, true); }
    if ((caps & (1 << 20)) != 0) { self.cap20.set(agent, true); }
    if ((caps & (1 << 21)) != 0) { self.cap21.set(agent, true); }
    if ((caps & (1 << 22)) != 0) { self.cap22.set(agent, true); }
    if ((caps & (1 << 23)) != 0) { self.cap23.set(agent, true); }
    if ((caps & (1 << 24)) != 0) { self.cap24.set(agent, true); }
    if ((caps & (1 << 25)) != 0) { self.cap25.set(agent, true); }
    if ((caps & (1 << 26)) != 0) { self.cap26.set(agent, true); }
    if ((caps & (1 << 27)) != 0) { self.cap27.set(agent, true); }
    if ((caps & (1 << 28)) != 0) { self.cap28.set(agent, true); }
    if ((caps & (1 << 29)) != 0) { self.cap29.set(agent, true); }
    if ((caps & (1 << 30)) != 0) { self.cap30.set(agent, true); }
    if ((caps & (1 << 31)) != 0) { self.cap31.set(agent, true); }
  }

  // --- Getters ---

  get fun getAgent(agent: Address): AgentRecord? {
    return self.agents.get(agent);
  }

  // Convenience getter for discovery scripts: avoids having to decode optional structs.
  get fun getAgentManifestUrl(agent: Address): String? {
    let rec = self.agents.get(agent);
    if (rec == null) {
      return null;
    }
    return (rec!!).manifestUrl;
  }

  // Returns all agents for a single-bit capability.
  // NOTE: Tact ABI does not expose `Address[]` in this compiler version, so we return
  // a dictionary (address -> true). Off-chain clients treat dictionary keys as the list.
  // Clients should still re-check `agents[addr].capabilities` to handle capability updates.
  get fun findAgentsByCapability(capability: Int): map<Address, Bool> {
    return self.getCapabilitySet(capability);
  }

  fun getCapabilitySet(capability: Int): map<Address, Bool> {
    if (capability == (1 << 0)) { return self.cap0; }
    if (capability == (1 << 1)) { return self.cap1; }
    if (capability == (1 << 2)) { return self.cap2; }
    if (capability == (1 << 3)) { return self.cap3; }
    if (capability == (1 << 4)) { return self.cap4; }
    if (capability == (1 << 5)) { return self.cap5; }
    if (capability == (1 << 6)) { return self.cap6; }
    if (capability == (1 << 7)) { return self.cap7; }
    if (capability == (1 << 8)) { return self.cap8; }
    if (capability == (1 << 9)) { return self.cap9; }
    if (capability == (1 << 10)) { return self.cap10; }
    if (capability == (1 << 11)) { return self.cap11; }
    if (capability == (1 << 12)) { return self.cap12; }
    if (capability == (1 << 13)) { return self.cap13; }
    if (capability == (1 << 14)) { return self.cap14; }
    if (capability == (1 << 15)) { return self.cap15; }
    if (capability == (1 << 16)) { return self.cap16; }
    if (capability == (1 << 17)) { return self.cap17; }
    if (capability == (1 << 18)) { return self.cap18; }
    if (capability == (1 << 19)) { return self.cap19; }
    if (capability == (1 << 20)) { return self.cap20; }
    if (capability == (1 << 21)) { return self.cap21; }
    if (capability == (1 << 22)) { return self.cap22; }
    if (capability == (1 << 23)) { return self.cap23; }
    if (capability == (1 << 24)) { return self.cap24; }
    if (capability == (1 << 25)) { return self.cap25; }
    if (capability == (1 << 26)) { return self.cap26; }
    if (capability == (1 << 27)) { return self.cap27; }
    if (capability == (1 << 28)) { return self.cap28; }
    if (capability == (1 << 29)) { return self.cap29; }
    if (capability == (1 << 30)) { return self.cap30; }
    if (capability == (1 << 31)) { return self.cap31; }

    // Unknown capability: return empty set.
    return emptyMap();
  }
}
