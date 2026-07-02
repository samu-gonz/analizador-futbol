import { execSync } from "node:child_process";
import { rmSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextCache = path.join(projectRoot, ".next");

function killDevServers() {
  try {
    if (process.platform === "win32") {
      execSync(
        'powershell -NoProfile -Command "Get-NetTCPConnection -LocalPort 3000,3001 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"',
        { stdio: "ignore" },
      );
    } else {
      execSync("lsof -ti:3000,3001 | xargs kill -9 2>/dev/null || true", {
        stdio: "ignore",
        shell: true,
      });
    }
  } catch {
    // Sin servidores previos en esos puertos.
  }
}

killDevServers();

try {
  rmSync(nextCache, { recursive: true, force: true });
  console.log("✓ Caché .next eliminada");
} catch {
  console.log("· Sin caché .next previa");
}

console.log("→ Iniciando servidor de desarrollo...\n");

const child = spawn("npx", ["next", "dev"], {
  cwd: projectRoot,
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
