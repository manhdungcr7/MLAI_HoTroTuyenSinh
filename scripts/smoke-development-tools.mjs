// Harmless verification of configured development integrations. No student data or tokens logged.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";

const results = [];
const client = new Client({ name: "nvai-development-smoke", version: "0.1.0" });
try {
  await client.connect(new StreamableHTTPClientTransport(new URL("https://developers.openai.com/mcp")), { timeout: 20000 });
  const { tools } = await client.listTools({}, { timeout: 20000 });
  const search = tools.find(t => /search.*docs|search.*documentation/i.test(t.name));
  if (!search) throw new Error("Documentation search tool not discoverable");
  const response = await client.callTool({ name: search.name, arguments: { query: "Codex MCP configuration", limit: 1 } }, undefined, { timeout: 20000 });
  if (response.isError) throw new Error("Documentation search returned an error");
  results.push({ integration: "openaiDeveloperDocs", ok: true, tools: tools.map(t => t.name), harmlessCall: search.name });
} catch (error) {
  results.push({ integration: "openaiDeveloperDocs", ok: false, error: error instanceof Error ? error.message.slice(0, 250) : "connection failed" });
} finally { await client.close().catch(() => {}); }

const github = spawnSync("gh", ["api", "repos/manhdungcr7/MLAI_HoTroTuyenSinh", "--jq", "{name:.full_name,default_branch:.default_branch,private:.private}"], { encoding: "utf8", timeout: 15000, windowsHide: true });
results.push({ integration: "github-native-cli", ok: github.status === 0, ...(github.status === 0 ? { repository: JSON.parse(github.stdout) } : { error: "Read-only repository metadata request failed" }) });
mkdirSync(".agent-runtime", { recursive: true });
writeFileSync(".agent-runtime/development-tools.json", JSON.stringify({ results }, null, 2));
console.log(JSON.stringify({ results }, null, 2));
if (results.some(r => !r.ok)) process.exitCode = 1;
