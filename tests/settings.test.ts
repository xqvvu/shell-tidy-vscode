import { beforeEach, describe, expect, it, vi } from "vitest";
import * as vscode from "vscode";
import {
  DEFAULT_ENABLED_LANGUAGES,
  EXT_NAMESPACE,
  readSettings,
} from "@/settings";

vi.mock("vscode", () => ({
  workspace: {
    getConfiguration: vi.fn(),
  },
}));

type ConfigMap = Record<string, unknown>;

const getConfigurationMock = vscode.workspace
  .getConfiguration as unknown as ReturnType<typeof vi.fn>;

function mockConfiguration(values: ConfigMap): void {
  const get = vi.fn((key: string, defaultValue?: unknown) => {
    if (Object.hasOwn(values, key)) {
      return values[key];
    }
    return defaultValue;
  });

  getConfigurationMock.mockReturnValue({
    get,
  } as unknown as vscode.WorkspaceConfiguration);
}

describe("readSettings", () => {
  beforeEach(() => {
    getConfigurationMock.mockReset();
  });

  it("uses documented defaults", () => {
    mockConfiguration({});

    const actual = readSettings();

    expect(getConfigurationMock).toHaveBeenCalledWith(EXT_NAMESPACE);
    expect(actual).toEqual({
      executablePath: null,
      args: [],
      enabledLanguages: [...DEFAULT_ENABLED_LANGUAGES],
      autoDownload: true,
      shfmtVersionOverride: null,
      respectEditorConfig: false,
      editorConfigApplyIgnore: false,
      logLevel: "info",
    });
  });

  it("reads and normalizes configured values", () => {
    mockConfiguration({
      executablePath: "  /opt/shfmt  ",
      args: ["-mn", 123, "-ci"],
      enabledLanguages: [" shellscript ", "dotenv", "dotenv", " ", 7],
      autoDownload: false,
      "shfmt.version": "  3.10.0 ",
      respectEditorConfig: true,
      editorConfigApplyIgnore: true,
      logLevel: "debug",
    });

    const actual = readSettings();

    expect(actual).toEqual({
      executablePath: "/opt/shfmt",
      args: ["-mn", "-ci"],
      enabledLanguages: ["shellscript", "dotenv"],
      autoDownload: false,
      shfmtVersionOverride: "3.10.0",
      respectEditorConfig: true,
      editorConfigApplyIgnore: true,
      logLevel: "debug",
    });
  });

  it('falls back to "info" for unknown logLevel values', () => {
    mockConfiguration({
      logLevel: "trace",
    });

    const actual = readSettings();

    expect(actual.logLevel).toBe("info");
  });
});
