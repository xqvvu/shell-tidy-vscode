import fs from "node:fs";
import path from "node:path";
import * as vscode from "vscode";

/**
 * Substitutes VS Code workspace variables in a path string.
 * Supports ${workspaceRoot} and ${workspaceFolder} placeholders.
 *
 * @param inputPath - Path string potentially containing variables
 * @returns Path with variables replaced by actual workspace folder path
 */
export function substituteVariables(inputPath: string): string {
  const workspaceFolder =
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? "";

  return inputPath
    .replace(/\${workspaceRoot}/g, workspaceFolder)
    .replace(/\${workspaceFolder}/g, workspaceFolder);
}

/**
 * Searches for an executable in the system PATH.
 * Automatically appends .exe extension on Windows if needed.
 *
 * @param toolName - Name of the executable to find
 * @returns Absolute path to the executable if found, null otherwise
 */
export function findExecutableOnPath(toolName: string): string | null {
  const corrected = correctBinName(toolName);
  if (path.isAbsolute(corrected)) return corrected;

  const rawPath = process.env.PATH ?? "";
  const parts = rawPath.split(path.delimiter).filter(Boolean);
  for (const p of parts) {
    const candidate = path.join(p, corrected);
    if (isFile(candidate)) return candidate;
  }
  return null;
}

function correctBinName(binName: string): string {
  if (process.platform === "win32" && path.extname(binName) !== ".exe") {
    return `${binName}.exe`;
  }
  return binName;
}

function isFile(filePath: string): boolean {
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}
