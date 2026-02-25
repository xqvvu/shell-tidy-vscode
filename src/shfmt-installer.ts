import fs from "node:fs";
import fsp from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import {
  getShfmtArch,
  getShfmtExecutableExt,
  getShfmtPlatform,
} from "@/platform";

export interface DownloadOptions {
  url: string;
  destFilePath: string;
  log?: (line: string) => void;
  timeoutMs?: number;
}

/**
 * Custom error class for shfmt download failures.
 * Includes detailed context for troubleshooting.
 */
export class ShfmtDownloadError extends Error {
  constructor(
    message: string,
    public readonly context: {
      version?: string;
      url?: string;
      platform?: string;
      arch?: string;
      statusCode?: number;
      originalError?: unknown;
    },
  ) {
    super(message);
    this.name = "ShfmtDownloadError";
  }

  /**
   * Formats the error with full context for user-facing error messages.
   */
  toDetailedString(): string {
    const parts = [this.message];
    if (this.context.version) parts.push(`Version: ${this.context.version}`);
    if (this.context.platform) parts.push(`Platform: ${this.context.platform}`);
    if (this.context.arch) parts.push(`Architecture: ${this.context.arch}`);
    if (this.context.url) parts.push(`URL: ${this.context.url}`);
    if (this.context.statusCode) {
      parts.push(`HTTP Status: ${this.context.statusCode}`);
    }
    if (this.context.originalError) {
      parts.push(`Cause: ${String(this.context.originalError)}`);
    }
    return parts.join("\n");
  }
}

/**
 * Constructs the release filename for a specific shfmt version.
 * Format: shfmt_v{version}_{platform}_{arch}{ext}
 *
 * @param version - shfmt version (with or without 'v' prefix)
 * @returns Release filename for the current platform and architecture
 */
export function getShfmtReleaseFileName(version: string): string {
  const tag = version.startsWith("v") ? version : `v${version}`;
  const platform = getShfmtPlatform();
  const arch = getShfmtArch();
  const ext = getShfmtExecutableExt();
  return `shfmt_${tag}_${platform}_${arch}${ext}`;
}

/**
 * Constructs the GitHub release download URL for a specific shfmt version.
 *
 * @param version - shfmt version (with or without 'v' prefix)
 * @returns Full download URL for the shfmt binary
 */
export function getShfmtReleaseDownloadUrl(version: string): string {
  const tag = version.startsWith("v") ? version : `v${version}`;
  return `https://github.com/mvdan/sh/releases/download/${tag}/${getShfmtReleaseFileName(version)}`;
}

/**
 * Downloads and installs a managed shfmt binary from GitHub releases.
 * Uses atomic file operations (download to temp, then rename) for safety.
 * Includes timeout protection and detailed error reporting.
 *
 * @param version - shfmt version to install
 * @param managedFilePath - Destination path for the installed binary
 * @param log - Optional logging function
 * @throws {ShfmtDownloadError} With detailed context if download fails
 */
export async function installShfmtManagedBinary(
  version: string,
  managedFilePath: string,
  log?: (line: string) => void,
): Promise<void> {
  const platform = getShfmtPlatform();
  const arch = getShfmtArch();
  const url = getShfmtReleaseDownloadUrl(version);

  try {
    await fsp.mkdir(path.dirname(managedFilePath), { recursive: true });

    // Download into a temp file in the same directory, then rename for atomicity.
    const tmpPath = `${managedFilePath}.tmp`;
    await safeUnlink(tmpPath);

    log?.(`Downloading shfmt ${version} from: ${url}`);
    log?.(`Platform: ${platform}, Architecture: ${arch}`);
    log?.(`Installing to: ${managedFilePath}`);

    await downloadToFile({
      url,
      destFilePath: tmpPath,
      log,
      timeoutMs: 60000, // 60 second timeout
    });

    if (process.platform !== "win32") {
      await fsp.chmod(tmpPath, 0o755);
    }

    await safeUnlink(managedFilePath);
    await fsp.rename(tmpPath, managedFilePath);

    log?.(`Successfully installed shfmt ${version}`);
  } catch (err: unknown) {
    // Wrap any error with detailed context
    if (err instanceof ShfmtDownloadError) {
      throw err;
    }
    throw new ShfmtDownloadError(`Failed to download shfmt ${version}`, {
      version,
      url,
      platform,
      arch,
      originalError: err,
    });
  }
}

async function safeUnlink(filePath: string): Promise<void> {
  try {
    await fsp.unlink(filePath);
  } catch (err: unknown) {
    if (isErrnoException(err) && err.code === "ENOENT") return;
    throw err;
  }
}

async function downloadToFile(options: DownloadOptions): Promise<void> {
  const { url, destFilePath, log, timeoutMs = 60000 } = options;

  await new Promise<void>((resolve, reject) => {
    const maxRedirects = 10;
    let timeoutId: NodeJS.Timeout | null = null;
    let currentReq: ReturnType<typeof https.get> | null = null;

    // Set up overall timeout
    if (timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        if (currentReq) {
          currentReq.destroy();
        }
        reject(
          new ShfmtDownloadError(`Download timeout after ${timeoutMs}ms`, {
            url,
          }),
        );
      }, timeoutMs);
    }

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };

    const requestOnce = (currentUrl: string, redirectsLeft: number) => {
      currentReq = https.get(
        currentUrl,
        {
          headers: {
            // GitHub sometimes behaves oddly without a UA.
            "User-Agent": "shell-tidy-vscode",
          },
          timeout: 30000, // 30s socket timeout
        },
        (res) => {
          const code = res.statusCode ?? 0;

          if (
            code >= 300 &&
            code < 400 &&
            res.headers.location &&
            redirectsLeft > 0
          ) {
            const nextUrl = new URL(
              res.headers.location,
              currentUrl,
            ).toString();
            res.resume();
            return requestOnce(nextUrl, redirectsLeft - 1);
          }

          if (code < 200 || code >= 300) {
            cleanup();
            res.resume();
            return reject(
              new ShfmtDownloadError(
                `HTTP ${code} while downloading shfmt: ${res.statusMessage ?? "Unknown error"}`,
                {
                  url: currentUrl,
                  statusCode: code,
                },
              ),
            );
          }

          const file = fs.createWriteStream(destFilePath);
          let downloaded = 0;

          res.on("data", (chunk: Buffer) => {
            downloaded += chunk.length;
            if (downloaded % (1024 * 1024) < chunk.length) {
              log?.(
                `Downloaded ${(downloaded / (1024 * 1024)).toFixed(1)} MiB...`,
              );
            }
          });

          res.pipe(file);

          file.on("finish", () => {
            cleanup();
            file.close(() => resolve());
          });

          file.on("error", (err) => {
            cleanup();
            reject(
              new ShfmtDownloadError("File write error during download", {
                url: currentUrl,
                originalError: err,
              }),
            );
          });

          res.on("error", (err) => {
            cleanup();
            reject(
              new ShfmtDownloadError("Network error during download", {
                url: currentUrl,
                originalError: err,
              }),
            );
          });
        },
      );

      currentReq.on("timeout", () => {
        cleanup();
        if (currentReq) {
          currentReq.destroy();
        }
        reject(
          new ShfmtDownloadError("Socket timeout during download", {
            url: currentUrl,
          }),
        );
      });

      currentReq.on("error", (err) => {
        cleanup();
        reject(
          new ShfmtDownloadError("Request error", {
            url: currentUrl,
            originalError: err,
          }),
        );
      });
    };

    requestOnce(url, maxRedirects);
  });
}

function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === "object" && err !== null && "code" in err;
}
