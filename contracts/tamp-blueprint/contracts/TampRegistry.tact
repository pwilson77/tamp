import "@stdlib/deploy";
import "./AgentEntry.tact";

// Parent/factory contract.
// - Agents register via a single message.
// - Registry deploys a deterministic AgentEntry child per sender.
// - Registry maintains a per-capability index for discovery.

message RegisterAgent {
  manifestUrl: String;
  capabilities: Int;
}

contract TampRegistry with Deployable {
  const MIN_REGISTER_DEPOSIT: Int = ton("0.05");

  // Capability index: one set per bit position.
  // We only add membership (never eagerly remove). Off-chain discovery must re-check
  // capabilities from the AgentEntry state.
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

  // Deterministic child address for a given owner.
  get fun calculateEntryAddress(owner: Address): Address {
    let init = initOf AgentEntry(owner, myAddress());
    return contractAddress(init);
  }

  // Discovery: return the membership set for a single-bit capability mask.
  get fun findAgentsByCapability(capability: Int): map<Address, Bool> {
    return self.getCapabilitySet(capability);
  }

  receive(msg: RegisterAgent) {
    let ctx = context();
    require(ctx.value >= self.MIN_REGISTER_DEPOSIT, "deposit_too_small");
    require(msg.manifestUrl != "", "manifest_url_empty");

    let owner = ctx.sender;

    // Deploy or reuse the deterministic AgentEntry.
    let init = initOf AgentEntry(owner, myAddress());
    let entry = contractAddress(init);

    // Encode AgentEntry.RegistryUpsert into a Cell.
    let upsertBody = RegistryUpsert{ manifestUrl: msg.manifestUrl, capabilities: msg.capabilities }.toCell();

    // Send an upsert message to the child. Attach init code/data to deploy if needed.
    send(SendParameters{
      to: entry,
      value: ton("0.03"),
      bounce: false,
      mode: 0,
      body: upsertBody,
      code: init.code,
      data: init.data
    });

    self.addToCapabilityIndex(owner, msg.capabilities);
  }

  fun addToCapabilityIndex(owner: Address, caps: Int) {
    if ((caps & (1 << 0)) != 0) { self.cap0.set(owner, true); }
    if ((caps & (1 << 1)) != 0) { self.cap1.set(owner, true); }
    if ((caps & (1 << 2)) != 0) { self.cap2.set(owner, true); }
    if ((caps & (1 << 3)) != 0) { self.cap3.set(owner, true); }
    if ((caps & (1 << 4)) != 0) { self.cap4.set(owner, true); }
    if ((caps & (1 << 5)) != 0) { self.cap5.set(owner, true); }
    if ((caps & (1 << 6)) != 0) { self.cap6.set(owner, true); }
    if ((caps & (1 << 7)) != 0) { self.cap7.set(owner, true); }
    if ((caps & (1 << 8)) != 0) { self.cap8.set(owner, true); }
    if ((caps & (1 << 9)) != 0) { self.cap9.set(owner, true); }
    if ((caps & (1 << 10)) != 0) { self.cap10.set(owner, true); }
    if ((caps & (1 << 11)) != 0) { self.cap11.set(owner, true); }
    if ((caps & (1 << 12)) != 0) { self.cap12.set(owner, true); }
    if ((caps & (1 << 13)) != 0) { self.cap13.set(owner, true); }
    if ((caps & (1 << 14)) != 0) { self.cap14.set(owner, true); }
    if ((caps & (1 << 15)) != 0) { self.cap15.set(owner, true); }
    if ((caps & (1 << 16)) != 0) { self.cap16.set(owner, true); }
    if ((caps & (1 << 17)) != 0) { self.cap17.set(owner, true); }
    if ((caps & (1 << 18)) != 0) { self.cap18.set(owner, true); }
    if ((caps & (1 << 19)) != 0) { self.cap19.set(owner, true); }
    if ((caps & (1 << 20)) != 0) { self.cap20.set(owner, true); }
    if ((caps & (1 << 21)) != 0) { self.cap21.set(owner, true); }
    if ((caps & (1 << 22)) != 0) { self.cap22.set(owner, true); }
    if ((caps & (1 << 23)) != 0) { self.cap23.set(owner, true); }
    if ((caps & (1 << 24)) != 0) { self.cap24.set(owner, true); }
    if ((caps & (1 << 25)) != 0) { self.cap25.set(owner, true); }
    if ((caps & (1 << 26)) != 0) { self.cap26.set(owner, true); }
    if ((caps & (1 << 27)) != 0) { self.cap27.set(owner, true); }
    if ((caps & (1 << 28)) != 0) { self.cap28.set(owner, true); }
    if ((caps & (1 << 29)) != 0) { self.cap29.set(owner, true); }
    if ((caps & (1 << 30)) != 0) { self.cap30.set(owner, true); }
    if ((caps & (1 << 31)) != 0) { self.cap31.set(owner, true); }
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

    return emptyMap();
  }
}
