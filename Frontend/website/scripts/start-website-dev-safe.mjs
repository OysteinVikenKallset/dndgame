import { execSync, spawn } from "node:child_process";

const WEBSITE_PORT = 3001;
const WEBSITE_PATH_HINT = "Frontend/website";

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

function listPidsListeningOnWebsitePort() {
  const output = run("ss -ltnp");

  if (!output) {
    return [];
  }

  const pids = new Set();

  for (const line of output.split("\n")) {
    if (!line.includes(`:${WEBSITE_PORT} `)) {
      continue;
    }

    const matches = line.matchAll(/pid=(\d+)/g);

    for (const match of matches) {
      const parsed = Number(match[1]);

      if (Number.isInteger(parsed)) {
        pids.add(parsed);
      }
    }
  }

  return Array.from(pids);
}

function listWebsiteNextPids() {
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

      const pid = Number(line.slice(0, firstSpace).trim());
      const args = line.slice(firstSpace + 1);

      if (!Number.isInteger(pid)) {
        return null;
      }

      return { pid, args };
    })
    .filter((entry) => entry !== null)
    .filter((entry) => {
      const args = entry.args;

      const looksLikeNextWebsiteProcess =
        args.includes(WEBSITE_PATH_HINT) &&
        (args.includes("next dev") ||
          args.includes("next start") ||
          args.includes("next-server"));

      const looksLikePortBoundNext =
        args.includes("next dev --port 3001") ||
        args.includes("next start --port 3001") ||
        args.includes("next-server") ||
        args.includes("/node_modules/.bin/next dev --port 3001") ||
        args.includes("/node_modules/.bin/next start --port 3001");

      return looksLikeNextWebsiteProcess || looksLikePortBoundNext;
    })
    .map((entry) => entry.pid)
    .filter((pid) => pid !== process.pid);
}

function uniquePids(...pidLists) {
  const pids = new Set();

  for (const list of pidLists) {
    for (const pid of list) {
      pids.add(pid);
    }
  }

  return Array.from(pids);
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

async function cleanupStaleWebsiteProcesses() {
  const initial = uniquePids(
    listPidsListeningOnWebsitePort(),
    listWebsiteNextPids(),
  );

  if (initial.length === 0) {
    return;
  }

  console.log(
    `[safe-start] Found existing website process(es): ${initial.join(", ")}. Cleaning up before start...`,
  );

  signalPids(initial, "SIGTERM");
  await sleep(350);

  const remaining = uniquePids(
    listPidsListeningOnWebsitePort(),
    listWebsiteNextPids(),
  );

  if (remaining.length > 0) {
    console.log(
      `[safe-start] Force-stopping remaining website process(es): ${remaining.join(", ")}.`,
    );
    signalPids(remaining, "SIGKILL");
    await sleep(120);
  }
}

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function spawnWebsiteDev() {
  const child = spawn(npmCommand(), ["run", "dev:raw"], {
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

await cleanupStaleWebsiteProcesses();
spawnWebsiteDev();
