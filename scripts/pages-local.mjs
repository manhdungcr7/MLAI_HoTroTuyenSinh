// Both Pages applications use the same local D1/KV. No remote AI connection by default.
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
import { spawnSync } from "node:child_process";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
export function chayPages(cms = false) {
  const localRoot = join(tmpdir(), `nvai-pages-${cms ? "cms" : "app"}-${process.pid}-${randomBytes(4).toString("hex")}`);
  const cwd = cms ? join(localRoot, "cms") : localRoot;
  const source = cms ? join(root, "cms") : root;
  const state = resolve(process.env.NV_TRANG_THAI || join(root, ".wrangler", "state"));
  if (!existsSync(join(source, "dist"))) throw new Error("Run the application build first.");
  // Resolve every recursive replacement inside our generated runtime directory.
  for (const name of ["cms/functions", "cms/dist", "src", "functions", "dist", "migrations"]) {
    const target = resolve(localRoot, name);
    if (!target.startsWith(localRoot + sep)) throw new Error("Invalid runtime target");
    rmSync(target, { recursive: true, force: true });
  }
  mkdirSync(cwd, { recursive: true });
  for (const name of ["src", "functions", "migrations"]) cpSync(join(root, name), join(localRoot, name), { recursive: true });
  for (const name of ["tsconfig.json", "package.json"]) cpSync(join(root, name), join(localRoot, name));
  symlinkSync(join(root, "node_modules"), join(localRoot, "node_modules"), "junction");
  cpSync(join(source, "dist"), join(cwd, "dist"), { recursive: true });
  if (cms) cpSync(join(source, "functions"), join(cwd, "functions"), { recursive: true });
  else {
    cpSync(join(root, "cms", "functions"), join(localRoot, "cms", "functions"), { recursive: true });
  }
  const raw = readFileSync(join(source, "wrangler.jsonc"), "utf8");
  const config = JSON.parse(raw.replace(/"(?:\\.|[^"\\])*"|\/\/[^\r\n]*|\/\*[\s\S]*?\*\//g, s => s.startsWith("/") ? "" : s).replace(/,\s*([}\]])/g, "$1"));
  if (process.env.NV_QA_SNAPSHOT === "1") {
    config.d1_databases = config.d1_databases.map(d => ({ ...d, database_id: "00000000-0000-0000-0000-000000000000" }));
    config.kv_namespaces = config.kv_namespaces.map(k => ({ ...k, id: k.binding }));
  }
  config.d1_databases = config.d1_databases.map(d => ({ ...d, migrations_dir: join(root, "migrations") }));
  if (process.env.NV_AI_REMOTE !== "1") { delete config.ai; delete config.vectorize; }
  writeFileSync(join(cwd, "wrangler.jsonc"), JSON.stringify(config));
  rmSync(join(cwd, "wrangler.json"), { force: true });
  let vars = existsSync(join(source, ".dev.vars")) ? readFileSync(join(source, ".dev.vars"), "utf8") : "";
  if (process.env.NV_QA_SNAPSHOT === "1" || process.env.NV_AI_REMOTE === "0") {
    // Local QA must not inherit provider credentials or other developer secrets.
    vars = "";
  }
  if (cms && !/^SESSION_SECRET\s*=/m.test(vars)) vars += `\nSESSION_SECRET=${randomBytes(32).toString("hex")}\n`;
  writeFileSync(join(cwd, ".dev.vars"), vars);
  const wrangler = join(root, "node_modules", "wrangler", "bin", "wrangler.js");
  const run = args => {
    const result = spawnSync(process.execPath, [wrangler, ...args], {
      cwd,
      stdio: "inherit",
      env: { ...process.env, CLOUDFLARE_LOAD_DEV_VARS_FROM_DOT_ENV: "false" },
    });
    if (result.status !== 0) process.exit(result.status ?? 1);
  };
  run(["d1", "migrations", "apply", "DB", "--local", "--persist-to", state]);
  const bindings = config.d1_databases.flatMap(d => ["--d1", `${d.binding}=${d.database_id}`]);
  bindings.push(...config.kv_namespaces.flatMap(k => ["--kv", `${k.binding}=${k.id}`]));
  if (config.ai) bindings.push("--ai", config.ai.binding);
  run(["pages", "dev", join(cwd, "dist"), "--port", cms ? "8788" : "8790", "--persist-to", state, ...bindings]);
}
