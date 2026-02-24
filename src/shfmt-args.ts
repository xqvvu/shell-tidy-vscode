export interface ShfmtArgDocumentLike {
  languageId: string;
  fileName: string;
  uriScheme?: string;
}

export interface ShfmtArgFormattingOptionsLike {
  insertSpaces: boolean;
  tabSize: number;
}

export interface ShfmtArgEditorConfigLike {
  indentStyle?: "tab" | "space";
  indentSize?: number;
  shellVariant?: string;
  binaryNextLine?: boolean;
  switchCaseIndent?: boolean;
  spaceRedirects?: boolean;
  keepPadding?: boolean;
  functionNextLine?: boolean;
}

/**
 * Builds the complete argument list for shfmt based on configuration,
 * document properties, and EditorConfig settings.
 *
 * Precedence order:
 * 1. User-provided args (shellTidy.args)
 * 2. EditorConfig settings (when enabled)
 * 3. VS Code formatting options (editor.insertSpaces, editor.tabSize)
 *
 * @param options - Configuration for building shfmt arguments
 * @returns Array of command-line arguments for shfmt
 */
export function buildShfmtArgs(options: {
  baseArgs: string[];
  document: ShfmtArgDocumentLike;
  formatting: ShfmtArgFormattingOptionsLike;
  respectEditorConfig?: boolean;
  editorConfigApplyIgnore?: boolean;
  editorConfig?: ShfmtArgEditorConfigLike | null;
  onWarning?: (line: string) => void;
}): string[] {
  const ctx = options;
  const args = [...ctx.baseArgs];
  const isFileDocument = (ctx.document.uriScheme ?? "file") === "file";
  const respectEditorConfig = Boolean(ctx.respectEditorConfig);

  if (respectEditorConfig && isFileDocument && !hasFilenameFlag(args)) {
    args.push(`--filename=${ctx.document.fileName}`);
  }
  if (
    respectEditorConfig &&
    isFileDocument &&
    ctx.editorConfigApplyIgnore &&
    !hasApplyIgnoreFlag(args)
  ) {
    args.push("--apply-ignore");
  }

  if (respectEditorConfig && ctx.editorConfig) {
    applyEditorConfigArgs({
      args,
      baseArgs: ctx.baseArgs,
      editorConfig: ctx.editorConfig,
      onWarning: ctx.onWarning,
    });
  }

  // bats files need an explicit dialect.
  if (
    ctx.document.languageId === "bats" ||
    ctx.document.fileName.endsWith(".bats")
  ) {
    if (!hasLangFlag(args)) {
      args.push("--ln=bats");
    }
  }

  // Respect editor indentation if the user didn't explicitly set shfmt's indent.
  if (ctx.formatting.insertSpaces && !hasIndentFlag(args)) {
    args.push(`-i=${ctx.formatting.tabSize}`);
  }

  return args.filter((x) => typeof x === "string" && x.length > 0);
}

function hasIndentFlag(args: string[]): boolean {
  return args.some(
    (a) => a === "-i" || a.startsWith("-i=") || a.startsWith("-i"),
  );
}

function hasFilenameFlag(args: string[]): boolean {
  return args.some(
    (a, i) =>
      (a === "--filename" && typeof args[i + 1] === "string") ||
      a.startsWith("--filename="),
  );
}

function hasApplyIgnoreFlag(args: string[]): boolean {
  return args.includes("--apply-ignore");
}

function hasLangFlag(args: string[]): boolean {
  return args.some(
    (a) =>
      a === "-ln" ||
      a.startsWith("-ln=") ||
      a === "--ln" ||
      a.startsWith("--ln="),
  );
}

function applyEditorConfigArgs(options: {
  args: string[];
  baseArgs: string[];
  editorConfig: ShfmtArgEditorConfigLike;
  onWarning?: (line: string) => void;
}): void {
  const { args, baseArgs, editorConfig, onWarning } = options;

  if (editorConfig.indentStyle === "tab") {
    if (hasIndentFlag(args)) {
      if (hasIndentFlag(baseArgs)) {
        onWarning?.(
          "EditorConfig indent settings were ignored because shellTidy.args already set an indent flag.",
        );
      }
    } else {
      args.push("-i=0");
    }
  } else if (
    editorConfig.indentStyle === "space" &&
    Number.isFinite(editorConfig.indentSize)
  ) {
    if (hasIndentFlag(args)) {
      if (hasIndentFlag(baseArgs)) {
        onWarning?.(
          "EditorConfig indent settings were ignored because shellTidy.args already set an indent flag.",
        );
      }
    } else {
      args.push(`-i=${editorConfig.indentSize}`);
    }
  }

  if (editorConfig.shellVariant) {
    if (hasLangFlag(args)) {
      if (hasLangFlag(baseArgs)) {
        onWarning?.(
          "EditorConfig shell_variant was ignored because shellTidy.args already set -ln/--ln.",
        );
      }
    } else {
      args.push(`-ln=${editorConfig.shellVariant}`);
    }
  }

  pushBooleanEditorConfigFlag({
    args,
    baseArgs,
    enabled: editorConfig.binaryNextLine === true,
    shortFlag: "-bn",
    longFlag: "--binary-next-line",
    key: "binary_next_line",
    onWarning,
  });
  pushBooleanEditorConfigFlag({
    args,
    baseArgs,
    enabled: editorConfig.switchCaseIndent === true,
    shortFlag: "-ci",
    longFlag: "--case-indent",
    key: "switch_case_indent",
    onWarning,
  });
  pushBooleanEditorConfigFlag({
    args,
    baseArgs,
    enabled: editorConfig.spaceRedirects === true,
    shortFlag: "-sr",
    longFlag: "--space-redirects",
    key: "space_redirects",
    onWarning,
  });
  pushBooleanEditorConfigFlag({
    args,
    baseArgs,
    enabled: editorConfig.keepPadding === true,
    shortFlag: "-kp",
    longFlag: "--keep-padding",
    key: "keep_padding",
    onWarning,
  });
  pushBooleanEditorConfigFlag({
    args,
    baseArgs,
    enabled: editorConfig.functionNextLine === true,
    shortFlag: "-fn",
    longFlag: "--func-next-line",
    key: "function_next_line",
    onWarning,
  });
}

function pushBooleanEditorConfigFlag(options: {
  args: string[];
  baseArgs: string[];
  enabled: boolean;
  shortFlag: string;
  longFlag: string;
  key: string;
  onWarning?: (line: string) => void;
}): void {
  if (!options.enabled) return;
  if (hasFlag(options.args, options.shortFlag, options.longFlag)) {
    if (hasFlag(options.baseArgs, options.shortFlag, options.longFlag)) {
      options.onWarning?.(
        `EditorConfig ${options.key} was ignored because shellTidy.args already set ${options.shortFlag}.`,
      );
    }
    return;
  }
  options.args.push(options.shortFlag);
}

function hasFlag(args: string[], shortFlag: string, longFlag: string): boolean {
  return args.includes(shortFlag) || args.includes(longFlag);
}
