import child_process from "node:child_process";
import type * as vscode from "vscode";

export interface ShfmtRunResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
}

/**
 * Executes shfmt with the given arguments and input text.
 * Supports cancellation via VS Code's cancellation token.
 *
 * @param options - Configuration for running shfmt
 * @param options.executablePath - Path to the shfmt executable
 * @param options.args - Command-line arguments to pass to shfmt
 * @param options.input - Input text to format (passed via stdin)
 * @param options.token - Optional cancellation token
 * @returns Promise resolving to stdout, stderr, and exit code
 */
export async function runShfmt(options: {
  executablePath: string;
  args: string[];
  input: string;
  token?: vscode.CancellationToken;
}): Promise<ShfmtRunResult> {
  const { executablePath, args, input, token } = options;

  return new Promise<ShfmtRunResult>((resolve, reject) => {
    const proc = child_process.spawn(executablePath, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    const stdoutChunks: Buffer[] = [];
    const stderrChunks: Buffer[] = [];

    proc.stdout.on("data", (d: Buffer) => stdoutChunks.push(d));
    proc.stderr.on("data", (d: Buffer) => stderrChunks.push(d));

    const cancelSub = token?.onCancellationRequested(() => {
      // Best effort: stop the formatter. VS Code will ignore late results anyway.
      try {
        proc.kill();
      } catch {
        // no-op
      }
    });

    proc.on("error", (err) => {
      cancelSub?.dispose();
      reject(err);
    });

    proc.on("close", (code) => {
      cancelSub?.dispose();
      resolve({
        stdout: Buffer.concat(stdoutChunks).toString("utf8"),
        stderr: Buffer.concat(stderrChunks).toString("utf8"),
        exitCode: code,
      });
    });

    proc.stdin.write(input);
    proc.stdin.end();
  });
}
