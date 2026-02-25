import { execSync } from "node:child_process";

function run(command) {
  return execSync(command, { encoding: "utf8" }).trim();
}

function getCiRange() {
  const baseRef = process.env["GITHUB_BASE_REF"];

  if (baseRef) {
    const mergeBase = run(`git merge-base HEAD origin/${baseRef}`);
    return `${mergeBase}..HEAD`;
  }

  try {
    run("git rev-parse --verify HEAD~1");
    return "HEAD~1..HEAD";
  } catch {
    return null;
  }
}

function getChangedFiles(mode) {
  if (mode === "staged") {
    const output = run("git diff --cached --name-only --diff-filter=ACMR");
    return output.length > 0 ? output.split("\n") : [];
  }

  if (mode === "ci") {
    const range = getCiRange();

    if (!range) {
      return [];
    }

    const output = run(`git diff --name-only --diff-filter=ACMR ${range}`);
    return output.length > 0 ? output.split("\n") : [];
  }

  throw new Error(`Unknown mode: ${mode}`);
}

function getNameStatusLines(mode) {
  if (mode === "staged") {
    const output = run("git diff --cached --name-status --diff-filter=ACMR");
    return output.length > 0 ? output.split("\n") : [];
  }

  if (mode === "ci") {
    const range = getCiRange();

    if (!range) {
      return [];
    }

    const output = run(`git diff --name-status --diff-filter=ACMR ${range}`);
    return output.length > 0 ? output.split("\n") : [];
  }

  throw new Error(`Unknown mode: ${mode}`);
}

function parseAddedSkillFiles(nameStatusLines) {
  const added = [];

  for (const line of nameStatusLines) {
    const parts = line.split("\t");
    const status = parts[0];

    if (status === "A") {
      const filePath = parts[1];

      if (
        filePath &&
        filePath.startsWith("docs/skills/") &&
        filePath.endsWith(".skill.md") &&
        !filePath.endsWith("skill-template.skill.md")
      ) {
        added.push(filePath);
      }
    }
  }

  return added;
}

function fail(message, details = []) {
  console.error(`\n[docs-guard] ${message}`);

  for (const detail of details) {
    console.error(`- ${detail}`);
  }

  process.exit(1);
}

const mode = process.argv[2] ?? "staged";
const changedFiles = getChangedFiles(mode);

if (changedFiles.length === 0) {
  console.log("[docs-guard] No relevant file changes detected. Skipping.");
  process.exit(0);
}

const changedSet = new Set(changedFiles);
const codeChanged = changedFiles.some(
  (filePath) => filePath.startsWith("src/") && filePath.endsWith(".ts"),
);
const docsChanged = changedFiles.some((filePath) =>
  filePath.startsWith("docs/"),
);

if (codeChanged && !docsChanged) {
  fail("Code changes require docs updates in the same change set.", [
    "Changed code under src/ detected.",
    "No files under docs/ were changed.",
    "Update relevant docs or explain/document policy in docs within this change.",
  ]);
}

const addedSkillFiles = parseAddedSkillFiles(getNameStatusLines(mode));

if (addedSkillFiles.length > 0) {
  const requiredDocs = ["docs/skills/README.md", "docs/README.md"];
  const missing = requiredDocs.filter(
    (requiredPath) => !changedSet.has(requiredPath),
  );

  if (missing.length > 0) {
    fail("Adding a new skill requires required docs index updates.", [
      `New skills: ${addedSkillFiles.join(", ")}`,
      ...missing.map((path) => `Missing update: ${path}`),
    ]);
  }
}

console.log("[docs-guard] OK");
