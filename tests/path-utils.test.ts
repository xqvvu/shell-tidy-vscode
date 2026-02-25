import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type * as vscode from "vscode";
import { findExecutableOnPath, substituteVariables } from "@/path-utils";

let mockWorkspaceFolders: readonly vscode.WorkspaceFolder[] | undefined = [];

vi.mock("vscode", () => ({
  workspace: {
    get workspaceFolders() {
      return mockWorkspaceFolders;
    },
  },
}));

function createTempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "shell-tidy-path-utils-"));
}

describe("substituteVariables", () => {
  it("replaces workspaceRoot/workspaceFolder placeholders", () => {
    const workspacePath = "/repo/workspace";
    mockWorkspaceFolders = [
      {
        uri: { fsPath: workspacePath },
      } as unknown as vscode.WorkspaceFolder,
    ];
    const workspaceRootPlaceholder = "$" + "{workspaceRoot}";
    const workspaceFolderPlaceholder = "$" + "{workspaceFolder}";

    const actual = substituteVariables(
      `${workspaceRootPlaceholder}/tools:${workspaceFolderPlaceholder}/bin`,
    );

    expect(actual).toBe(`${workspacePath}/tools:${workspacePath}/bin`);
  });
});

describe("findExecutableOnPath", () => {
  const originalPath = process.env.PATH;

  afterEach(() => {
    process.env.PATH = originalPath;
  });

  it("finds executables from PATH", () => {
    const dir = createTempDir();
    const binName = process.platform === "win32" ? "shfmt.exe" : "shfmt";
    const filePath = path.join(dir, binName);
    fs.writeFileSync(filePath, "binary");
    if (process.platform !== "win32") {
      fs.chmodSync(filePath, 0o755);
    }
    process.env.PATH = dir;

    const actual = findExecutableOnPath("shfmt");

    expect(actual).toBe(filePath);
  });

  it("returns null for non-executable files on PATH", () => {
    const dir = createTempDir();
    const binName = process.platform === "win32" ? "shfmt.exe" : "shfmt";
    const filePath = path.join(dir, binName);
    fs.writeFileSync(filePath, "binary");
    if (process.platform !== "win32") {
      fs.chmodSync(filePath, 0o644);
    }
    process.env.PATH = dir;

    const actual = findExecutableOnPath("shfmt");

    if (process.platform === "win32") {
      expect(actual).toBe(filePath);
    } else {
      expect(actual).toBeNull();
    }
  });

  it("returns null for missing absolute paths", () => {
    const missingPath = path.join(createTempDir(), "missing-shfmt");

    const actual = findExecutableOnPath(missingPath);

    expect(actual).toBeNull();
  });
});
