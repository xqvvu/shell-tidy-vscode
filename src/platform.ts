export type ShfmtPlatform =
  | "darwin"
  | "linux"
  | "freebsd"
  | "netbsd"
  | "openbsd"
  | "windows";

export type ShfmtArch = "amd64" | "arm64" | "arm" | "386";

/**
 * Maps Node.js platform identifier to shfmt platform name.
 *
 * @returns Platform identifier for shfmt binary downloads
 * @throws Error if the current platform is not supported
 */
export function getShfmtPlatform(): ShfmtPlatform {
  switch (process.platform) {
    case "darwin":
      return "darwin";
    case "linux":
      return "linux";
    case "freebsd":
      return "freebsd";
    case "netbsd":
      return "netbsd";
    case "openbsd":
      return "openbsd";
    case "win32":
      return "windows";
    default:
      throw new Error(
        `Unsupported platform "${process.platform}". Configure "shellTidy.executablePath" to use a custom shfmt.`,
      );
  }
}

/**
 * Maps Node.js architecture identifier to shfmt architecture name.
 *
 * @returns Architecture identifier for shfmt binary downloads
 * @throws Error if the current architecture is not supported
 */
export function getShfmtArch(): ShfmtArch {
  switch (process.arch) {
    case "x64":
      return "amd64";
    case "arm64":
      return "arm64";
    case "arm":
      return "arm";
    case "ia32":
      return "386";
    default:
      throw new Error(
        `Unsupported architecture "${process.arch}". Configure "shellTidy.executablePath" to use a custom shfmt.`,
      );
  }
}

/**
 * Returns the appropriate executable extension for the current platform.
 *
 * @returns ".exe" on Windows, empty string on other platforms
 */
export function getShfmtExecutableExt(): string {
  return process.platform === "win32" ? ".exe" : "";
}
