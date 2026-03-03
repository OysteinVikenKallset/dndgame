import { execSync, spawn } from "node:child_process";

function run(command) {
  try {
    return execSync(command, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    }).trim();
  } catch {
    return "";
  }
}

function listBackendServerPids() {
  const output = run("ps -eo pid=,args=");

  if (!output) {
    return [];
  }

  return output
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      const firstSpace = line.indexOf(" ");

      if (firstSpace <= 0) {
        return null;
      }

      const pidRaw = line.slice(0, firstSpace).trim();
      const args = line.slice(firstSpace + 1);
      const pid = Number(pidRaw);

      if (!Number.isInteger(pid)) {
        return null;
      }

      return { pid, args };
    })
    .filter((entry) => entry !== null)
    .filter((entry) => {
      const args = entry.args;

      if (!args.includes("server.ts")) {
        return false;
      }

      const pointsToBackendServer =
        args.includes("Backend/src/server.ts") ||
        args.includes("src/server.ts");

      if (!pointsToBackendServer) {
        return false;
      }

      const looksLikeTsxServer =
        args.includes("tsx") || args.includes("tsx/dist");

      return looksLikeTsxServer;
    })
    .map((entry) => entry.pid)
    .filter((pid) => pid !== process.pid);
}

function signalPids(pids, signal) {
  for (const pid of pids) {
    try {
      process.kill(pid, signal);
    } catch {}
  }
}

async function sleep(ms) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function cleanupStaleBackendProcesses() {
  const initial = listBackendServerPids();

  if (initial.length === 0) {
    return;
  }

  console.log(
    `[safe-start] Found existing backend server process(es): ${initial.join(", ")}. Cleaning up before start...`,
  );

  signalPids(initial, "SIGTERM");
  await sleep(350);

  const remaining = listBackendServerPids();

  if (remaining.length > 0) {
    console.log(
      `[safe-start] Force-stopping remaining backend process(es): ${remaining.join(", ")}.`,
    );
    signalPids(remaining, "SIGKILL");
    await sleep(120);
  }
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function spawnBackend() {
  const child = spawn(npmCommand(), ["run", "start:raw"], {
    stdio: "inherit",
    env: process.env,
  });

  for (const signal of ["SIGINT", "SIGTERM", "SIGHUP"]) {
    process.on(signal, () => {
      try {
        child.kill(signal);
      } catch {}
    });
  }

  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

await cleanupStaleBackendProcesses();
spawnBackend();
