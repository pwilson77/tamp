import "@stdlib/deploy";

// Child contract deployed per agent owner (deterministic by init args).
// Stores the agent manifest URL + capabilities, plus trust/bond data.

message RegistryUpsert {
  manifestUrl: String;
  capabilities: Int;
}

message UpdateManifest {
  newUrl: String;
  newCaps: Int;
}

message TopUpBond {
}

message SetVerified {
  verified: Bool;
}

struct EntryState {
  owner: Address;
  manifestUrl: String;
  capabilities: Int;
  isVerified: Bool;
  bondAmount: Int;
}

contract AgentEntry {
  owner: Address;
  registry: Address;

  // Stored using TON "snake" encoding for gas-efficient long strings.
  manifestUrl: String;

  capabilities: Int;
  isVerified: Bool;

  // Accumulated bond top-ups (nanotons).
  bondAmount: Int;

  init(owner: Address, registry: Address) {
    self.owner = owner;
    self.registry = registry;

    self.manifestUrl = "";
    self.capabilities = 0;

    self.isVerified = false;
    self.bondAmount = 0;
  }

  // Registry-driven upsert (used by the factory registration flow).
  receive(msg: RegistryUpsert) {
    let ctx = context();
    require(ctx.sender == self.registry, "access_denied");
    require(msg.manifestUrl != "", "manifest_url_empty");

    self.manifestUrl = msg.manifestUrl;
    self.capabilities = msg.capabilities;
  }

  // Owner-driven update (direct call to the entry contract).
  receive(msg: UpdateManifest) {
    let ctx = context();
    require(ctx.sender == self.owner, "access_denied");
    require(msg.newUrl != "", "manifest_url_empty");

    self.manifestUrl = msg.newUrl;
    self.capabilities = msg.newCaps;
  }

  // Anyone can top up the bond. The attached TON amount is accumulated.
  receive(msg: TopUpBond) {
    let ctx = context();
    require(ctx.value > 0, "bond_zero");
    self.bondAmount += ctx.value;
  }

  // Optional: registry can set on-chain verification status.
  receive(msg: SetVerified) {
    let ctx = context();
    require(ctx.sender == self.registry, "access_denied");
    self.isVerified = msg.verified;
  }

  // --- Getters ---

  get fun getOwner(): Address { return self.owner; }
  get fun getManifestUrl(): String { return self.manifestUrl; }
  get fun getCapabilities(): Int { return self.capabilities; }
  get fun getIsVerified(): Bool { return self.isVerified; }
  get fun getBondAmount(): Int { return self.bondAmount; }

  // Convenience getter for discovery: one call to fetch everything.
  get fun getEntryState(): EntryState {
    return EntryState{
      owner: self.owner,
      manifestUrl: self.manifestUrl,
      capabilities: self.capabilities,
      isVerified: self.isVerified,
      bondAmount: self.bondAmount
    };
  }
}
