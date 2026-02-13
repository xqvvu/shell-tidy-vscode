import * as vscode from "vscode";
import { ShellFormatProvider } from "@/format-provider";
import { DEFAULT_SHFMT_VERSION, EXT_NAMESPACE, readSettings } from "@/settings";
import { ShfmtManager } from "@/shfmt-manager";
import packageJson from "../package.json";

const OUTPUT_CHANNEL_NAME = packageJson.displayName;

export function activate(context: vscode.ExtensionContext) {
  const output = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  const diagnostics =
    vscode.languages.createDiagnosticCollection(EXT_NAMESPACE);
  const log = (line: string) => output.appendLine(line);

  const shfmtManager = new ShfmtManager(context, log);

  const getRuntimeSettings = () => {
    const s = readSettings();
    const version = s.shfmtVersionOverride ?? DEFAULT_SHFMT_VERSION;
    return {
      version,
      executablePathSetting: s.executablePath,
      autoDownload: s.autoDownload,
      args: s.args,
      enabledLanguages: s.enabledLanguages,
      logLevel: s.logLevel,
    };
  };

  const resolveAndLogShfmtInfo = async () => {
    const s = getRuntimeSettings();
    try {
      const resolved = await shfmtManager.resolveShfmtExecutable({
        version: s.version,
        executablePathSetting: s.executablePathSetting,
        autoDownload: s.autoDownload,
      });
      log(`shfmt version (requested): ${s.version}`);
      log(`shfmt source: ${resolved.source}`);
      log(`shfmt path: ${resolved.executablePath}`);
      return resolved;
    } catch (err: unknown) {
      log(`Resolve shfmt failed: ${getErrorMessage(err)}`);
      return null;
    }
  };

  const provider = new ShellFormatProvider(
    shfmtManager,
    diagnostics,
    () => {
      const s = getRuntimeSettings();
      return {
        version: s.version,
        executablePathSetting: s.executablePathSetting,
        autoDownload: s.autoDownload,
        args: s.args,
        logLevel: s.logLevel,
      };
    },
    log,
  );

  const registrations: vscode.Disposable[] = [];
  const registrationsDisposable = new vscode.Disposable(() => {
    for (const d of registrations.splice(0)) d.dispose();
  });
  context.subscriptions.push(registrationsDisposable);

  const register = () => {
    for (const d of registrations.splice(0)) d.dispose();

    const s = getRuntimeSettings();
    for (const language of s.enabledLanguages) {
      for (const scheme of ["file", "untitled"] as const) {
        registrations.push(
          vscode.languages.registerDocumentFormattingEditProvider(
            { language, scheme },
            provider,
          ),
        );
      }
    }
  };

  register();
  void resolveAndLogShfmtInfo();
  context.subscriptions.push(output, diagnostics);

  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration(EXT_NAMESPACE)) {
        register();
      }
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "shellFormatter.downloadShfmt",
      async () => {
        const s = getRuntimeSettings();
        output.show(true);
        log(`Ensuring managed shfmt ${s.version} is installed...`);
        try {
          await shfmtManager.ensureManagedBinaryInstalled(s.version);
          log("Managed shfmt is installed.");
          void vscode.window.showInformationMessage(
            `shfmt ${s.version} installed for ${OUTPUT_CHANNEL_NAME}.`,
          );
        } catch (err: unknown) {
          log(`Install failed: ${getErrorMessage(err)}`);
          void vscode.window.showErrorMessage(
            `Failed to install shfmt ${s.version}. See "${OUTPUT_CHANNEL_NAME}" output for details.`,
          );
        }
      },
    ),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "shellFormatter.showShfmtInfo",
      async () => {
        output.show(true);
        const resolved = await resolveAndLogShfmtInfo();
        if (resolved) {
          void vscode.window.showInformationMessage(
            `${OUTPUT_CHANNEL_NAME} shfmt: ${resolved.source} (${resolved.executablePath})`,
          );
        } else {
          void vscode.window.showErrorMessage(
            `Unable to resolve shfmt. Configure "shellFormatter.executablePath" or enable auto-download. See "${OUTPUT_CHANNEL_NAME}" output for details.`,
          );
        }
      },
    ),
  );

  // Prewarm a managed shfmt in the background if it's the only possible source.
  void shfmtManager.prewarmIfNeeded({
    version: getRuntimeSettings().version,
    executablePathSetting: getRuntimeSettings().executablePathSetting,
    autoDownload: getRuntimeSettings().autoDownload,
  });
}

export function deactivate() {}

function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
