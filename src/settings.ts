import * as vscode from "vscode";

export const EXT_NAMESPACE = "shellTidy";

export type LogLevel = "info" | "debug";

export const DEFAULT_SHFMT_VERSION = "3.12.0";

export const DEFAULT_ENABLED_LANGUAGES = [
  "shellscript",
  "dockerfile",
  "dotenv",
  "ignore",
  "hosts",
  "jvmoptions",
  "properties",
  "spring-boot-properties",
  "azcli",
  "bats",
] as const;

export type EnabledLanguage = (typeof DEFAULT_ENABLED_LANGUAGES)[number];

export interface ShellFormatSettings {
  executablePath: string | null;
  args: string[];
  enabledLanguages: string[];
  autoDownload: boolean;
  shfmtVersionOverride: string | null;
  respectEditorConfig: boolean;
  editorConfigApplyIgnore: boolean;
  logLevel: LogLevel;
}

/**
 * Reads and normalizes Shell Tidy configuration from VS Code settings.
 * Filters out invalid values and applies defaults.
 *
 * @returns Normalized configuration object
 */
export function readSettings(): ShellFormatSettings {
  const cfg = vscode.workspace.getConfiguration(EXT_NAMESPACE);

  const executablePath = cfg.get<string | null>("executablePath", null);
  const args = cfg.get<string[]>("args", []);
  const enabledLanguages = cfg.get<string[]>("enabledLanguages", [
    ...DEFAULT_ENABLED_LANGUAGES,
  ]);

  const autoDownload = cfg.get<boolean>("autoDownload", true);
  const shfmtVersionOverride = cfg.get<string | null>("shfmt.version", null);
  const respectEditorConfig = cfg.get<boolean>("respectEditorConfig", false);
  const editorConfigApplyIgnore = cfg.get<boolean>(
    "editorConfigApplyIgnore",
    false,
  );
  const logLevel = cfg.get<LogLevel>("logLevel", "info");

  return {
    executablePath: normalizeOptionalString(executablePath),
    args: Array.isArray(args) ? args.filter((x) => typeof x === "string") : [],
    enabledLanguages: Array.isArray(enabledLanguages)
      ? enabledLanguages.filter((x) => typeof x === "string")
      : [...DEFAULT_ENABLED_LANGUAGES],
    autoDownload,
    shfmtVersionOverride: normalizeOptionalString(shfmtVersionOverride),
    respectEditorConfig,
    editorConfigApplyIgnore,
    logLevel,
  };
}

/**
 * Normalizes a string value by trimming whitespace.
 * Returns null for non-strings or empty strings.
 *
 * @param value - Value to normalize
 * @returns Trimmed string or null
 */
function normalizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}
