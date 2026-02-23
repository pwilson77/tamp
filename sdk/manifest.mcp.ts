export type McpTool = {
  name: string;
  description: string;
  input_schema?: Record<string, unknown>;
  output_schema?: Record<string, unknown>;
  [k: string]: unknown;
};

export type TampManifestMcp = {
  protocol_version: string;

  // Standard fields
  name: string;
  description: string;
  homepage: string;

  // Trust metrics
  verification_ref: string; // e.g. IdentityHub profile URL or identifier

  // Contact + MCP support
  contact: {
    tg_bot?: string;
    email?: string;
    [k: string]: unknown;
  };

  mcp_endpoint: string;
  mcp_tools: McpTool[];

  // Existing demo fields
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
