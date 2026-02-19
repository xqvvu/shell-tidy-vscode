import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildShfmtArgs } from "@/shfmt-args";
import { FIXTURE_MATRIX } from "~tests/fixtures/matrix";

const INPUT_DIR = path.resolve("tests/fixtures/input");
const EXPECTED_DIR = path.resolve("tests/fixtures/expected");

describe("fixture matrix completeness", () => {
  it("has matching input and expected files", () => {
    for (const m of FIXTURE_MATRIX) {
      const inputPath = path.join(INPUT_DIR, m.inputFile);
      const expectedPath = path.join(EXPECTED_DIR, m.expectedFile);

      expect(fs.existsSync(inputPath), `${m.id} input missing`).toBe(true);
      expect(fs.existsSync(expectedPath), `${m.id} expected missing`).toBe(
        true,
      );
      expect(fs.readFileSync(inputPath, "utf8").length).toBeGreaterThan(0);
      expect(fs.readFileSync(expectedPath, "utf8").length).toBeGreaterThan(0);
    }
  });
});

describe("buildShfmtArgs fixture matrix", () => {
  for (const m of FIXTURE_MATRIX) {
    it(m.id, () => {
      const actual = buildShfmtArgs({
        baseArgs: m.baseArgs,
        document: {
          languageId: m.languageId,
          fileName: m.fileName,
        },
        formatting: m.formatting,
      });

      expect(actual).toEqual(m.expectedArgs);
    });
  }
});

describe("buildShfmtArgs editorconfig integration", () => {
  it("does not inject editorconfig-derived flags when disabled", () => {
    const actual = buildShfmtArgs({
      baseArgs: [],
      document: {
        languageId: "shellscript",
        fileName: "/repo/demo.sh",
        uriScheme: "file",
      },
      formatting: { insertSpaces: true, tabSize: 6 },
      respectEditorConfig: false,
      editorConfigApplyIgnore: true,
      editorConfig: {
        indentStyle: "space",
        indentSize: 2,
        shellVariant: "bash",
        binaryNextLine: true,
        keepPadding: true,
      },
    });

    // Still follows VS Code formatting options, but does not map .editorconfig keys.
    expect(actual).toEqual(["-i=6"]);
  });

  it("applies editorconfig flags and filename context", () => {
    const actual = buildShfmtArgs({
      baseArgs: [],
      document: {
        languageId: "shellscript",
        fileName: "/repo/demo.sh",
        uriScheme: "file",
      },
      formatting: { insertSpaces: true, tabSize: 2 },
      respectEditorConfig: true,
      editorConfigApplyIgnore: true,
      editorConfig: {
        indentStyle: "space",
        indentSize: 4,
        shellVariant: "bash",
        binaryNextLine: true,
        keepPadding: true,
      },
    });

    expect(actual).toEqual([
      "--filename=/repo/demo.sh",
      "--apply-ignore",
      "-i=4",
      "-ln=bash",
      "-bn",
      "-kp",
    ]);
  });

  it("prefers explicit shellTidy.args over editorconfig", () => {
    const warnings: string[] = [];
    const actual = buildShfmtArgs({
      baseArgs: ["-i=8", "-ln=mksh", "-bn"],
      document: {
        languageId: "shellscript",
        fileName: "/repo/demo.sh",
        uriScheme: "file",
      },
      formatting: { insertSpaces: true, tabSize: 2 },
      respectEditorConfig: true,
      editorConfig: {
        indentStyle: "space",
        indentSize: 2,
        shellVariant: "bash",
        binaryNextLine: true,
      },
      onWarning: (line) => warnings.push(line),
    });

    expect(actual).toEqual([
      "-i=8",
      "-ln=mksh",
      "-bn",
      "--filename=/repo/demo.sh",
    ]);
    expect(warnings).toEqual([
      "EditorConfig indent settings were ignored because shellTidy.args already set an indent flag.",
      "EditorConfig shell_variant was ignored because shellTidy.args already set -ln/--ln.",
      "EditorConfig binary_next_line was ignored because shellTidy.args already set -bn.",
    ]);
  });

  it("does not add filename flags for untitled documents", () => {
    const actual = buildShfmtArgs({
      baseArgs: [],
      document: {
        languageId: "shellscript",
        fileName: "Untitled-1",
        uriScheme: "untitled",
      },
      formatting: { insertSpaces: true, tabSize: 2 },
      respectEditorConfig: true,
      editorConfigApplyIgnore: true,
    });

    expect(actual).toEqual(["-i=2"]);
  });
});
