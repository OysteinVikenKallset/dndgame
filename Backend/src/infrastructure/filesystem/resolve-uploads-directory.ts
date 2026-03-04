import { existsSync } from "node:fs";
import { resolve } from "node:path";

type PathExists = (path: string) => boolean;

export function resolveUploadsDirectory(
  cwd = process.cwd(),
  pathExists: PathExists = existsSync,
): string {
  const repoRootCandidate = resolve(cwd, "Backend/data/uploads");
  const backendRootCandidate = resolve(cwd, "data/uploads");

  if (pathExists(repoRootCandidate)) {
    return repoRootCandidate;
  }

  if (pathExists(backendRootCandidate)) {
    return backendRootCandidate;
  }

  return repoRootCandidate;
}
