import * as editorconfig from "editorconfig";
import type { ShfmtArgEditorConfigLike } from "@/shfmt-args";

const EDITORCONFIG_CACHE = new Map<string, editorconfig.ProcessedFileConfig>();

/**
 * Resolves and normalizes EditorConfig settings for a file.
 * Maps EditorConfig properties to shfmt-compatible settings.
 *
 * Supported EditorConfig keys:
 * - indent_style, indent_size
 * - shell_variant
 * - binary_next_line, switch_case_indent, space_redirects
 * - keep_padding, function_next_line
 *
 * @param options - Configuration for EditorConfig resolution
 * @returns Normalized EditorConfig settings or null if disabled/unavailable
 */
export async function resolveEditorConfigForShfmt(options: {
  enabled: boolean;
  fileName: string;
  uriScheme: string;
  log?: (line: string) => void;
}): Promise<ShfmtArgEditorConfigLike | null> {
  if (!options.enabled) return null;
  if (options.uriScheme !== "file") return null;

  try {
    const parsed = await editorconfig.parse(options.fileName, {
      cache: EDITORCONFIG_CACHE,
    });
    const normalized = normalizeEditorConfig(parsed);
    if (!hasAnyResolvedSetting(normalized)) return null;

    if (options.log) {
      options.log(
        `Resolved .editorconfig: ${JSON.stringify({
          file: options.fileName,
          ...normalized,
        })}`,
      );
    }

    return normalized;
  } catch (err: unknown) {
    options.log?.(
      `Failed to resolve .editorconfig for ${options.fileName}: ${getErrorMessage(err)}`,
    );
    return null;
  }
}

function normalizeEditorConfig(
  raw: editorconfig.Props,
): ShfmtArgEditorConfigLike {
  return {
    indentStyle: normalizeIndentStyle(raw.indent_style),
    indentSize: normalizeIndentSize(raw.indent_size),
    shellVariant: normalizeOptionalString(raw.shell_variant),
    binaryNextLine: normalizeBoolean(raw.binary_next_line),
    switchCaseIndent: normalizeBoolean(raw.switch_case_indent),
    spaceRedirects: normalizeBoolean(raw.space_redirects),
    keepPadding: normalizeBoolean(raw.keep_padding),
    functionNextLine: normalizeBoolean(raw.function_next_line),
  };
}

function hasAnyResolvedSetting(settings: ShfmtArgEditorConfigLike): boolean {
  return Object.values(settings).some((value) => value !== undefined);
}

function normalizeIndentStyle(value: unknown): "tab" | "space" | undefined {
  if (value === "tab" || value === "space") return value;
  return undefined;
}

function normalizeIndentSize(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) {
    return Math.max(0, Math.trunc(value));
  }
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return undefined;
  return Number.parseInt(trimmed, 10);
}

function normalizeOptionalString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (trimmed.length === 0 || trimmed === "unset") return undefined;
  return trimmed;
}

function normalizeBoolean(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
    return undefined;
  }
  if (typeof value !== "string") return undefined;
  const lowered = value.trim().toLowerCase();
  if (lowered === "true" || lowered === "1" || lowered === "on") return true;
  if (lowered === "false" || lowered === "0" || lowered === "off") {
    return false;
  }
  return undefined;
}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
