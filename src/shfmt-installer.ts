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
}

export function getShfmtReleaseFileName(version: string): string {
  const tag = version.startsWith("v") ? version : `v${version}`;
  const platform = getShfmtPlatform();
  const arch = getShfmtArch();
  const ext = getShfmtExecutableExt();
  return `shfmt_${tag}_${platform}_${arch}${ext}`;
}

export function getShfmtReleaseDownloadUrl(version: string): string {
  const tag = version.startsWith("v") ? version : `v${version}`;
  return `https://github.com/mvdan/sh/releases/download/${tag}/${getShfmtReleaseFileName(version)}`;
}

export async function installShfmtManagedBinary(
  version: string,
  managedFilePath: string,
  log?: (line: string) => void,
): Promise<void> {
  await fsp.mkdir(path.dirname(managedFilePath), { recursive: true });

  // Download into a temp file in the same directory, then rename for atomicity.
  const tmpPath = `${managedFilePath}.tmp`;
  await safeUnlink(tmpPath);

  const url = getShfmtReleaseDownloadUrl(version);
  log?.(`Downloading shfmt ${version} from: ${url}`);
  log?.(`Installing to: ${managedFilePath}`);

  await downloadToFile({ url, destFilePath: tmpPath, log });

  if (process.platform !== "win32") {
    await fsp.chmod(tmpPath, 0o755);
  }

  await safeUnlink(managedFilePath);
  await fsp.rename(tmpPath, managedFilePath);
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
  const { url, destFilePath, log } = options;

  await new Promise<void>((resolve, reject) => {
    const maxRedirects = 10;

    const requestOnce = (currentUrl: string, redirectsLeft: number) => {
      const req = https.get(
        currentUrl,
        {
          headers: {
            // GitHub sometimes behaves oddly without a UA.
            "User-Agent": "shell-tidy-vscode",
          },
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
            res.resume();
            return reject(
              new Error(
                `HTTP ${code} while downloading shfmt (${res.statusMessage ?? ""})`,
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

          file.on("finish", () => file.close(() => resolve()));
          file.on("error", (err) => reject(err));
          res.on("error", (err) => reject(err));
        },
      );

      req.on("error", (err) => reject(err));
    };

    requestOnce(url, maxRedirects);
  });
}

function isErrnoException(err: unknown): err is NodeJS.ErrnoException {
  return typeof err === "object" && err !== null && "code" in err;
}
