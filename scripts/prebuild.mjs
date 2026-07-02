import { execSync } from "node:child_process";

function isDevServerRunning() {
  try {
    if (process.platform === "win32") {
      const output = execSync(
        'powershell -NoProfile -Command "(Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Measure-Object).Count"',
        { encoding: "utf8" },
      ).trim();

      return Number.parseInt(output, 10) > 0;
    }

    execSync("lsof -i:3000", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

if (process.env.VERCEL || process.env.CI) {
  process.exit(0);
}

if (isDevServerRunning()) {
  console.error(
    "\n❌ Cierra `npm run dev` antes de ejecutar `npm run build`.\n" +
      "   Mezclar build y dev corrompe la caché y causa Internal Server Error.\n",
  );
  process.exit(1);
}
