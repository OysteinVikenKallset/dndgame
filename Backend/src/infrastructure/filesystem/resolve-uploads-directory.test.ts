import { describe, expect, it } from "vitest";
import { resolveUploadsDirectory } from "./resolve-uploads-directory";

describe("resolveUploadsDirectory", () => {
  it("returns repo-root uploads when it exists", () => {
    const result = resolveUploadsDirectory(
      "/workspace",
      (path) => path === "/workspace/Backend/data/uploads",
    );

    expect(result).toBe("/workspace/Backend/data/uploads");
  });

  it("returns backend-root uploads when backend is cwd", () => {
    const result = resolveUploadsDirectory(
      "/workspace/Backend",
      (path) => path === "/workspace/Backend/data/uploads",
    );

    expect(result).toBe("/workspace/Backend/data/uploads");
  });

  it("falls back to repo-root candidate when no directory exists yet", () => {
    const result = resolveUploadsDirectory("/workspace", () => false);

    expect(result).toBe("/workspace/Backend/data/uploads");
  });
});
