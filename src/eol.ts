import * as vscode from "vscode";

/**
 * Normalizes line endings in text to match the document's EOL setting.
 * Ensures consistent line endings after formatting.
 *
 * @param text - Text to normalize
 * @param eol - Target end-of-line style (LF or CRLF)
 * @returns Text with normalized line endings
 */
export function normalizeEolForDocument(
  text: string,
  eol: vscode.EndOfLine,
): string {
  if (eol === vscode.EndOfLine.CRLF) {
    // Convert LF and CRLF to CRLF.
    return text.replace(/\r?\n/g, "\r\n");
  }
  // Convert CRLF to LF.
  return text.replace(/\r\n/g, "\n");
}
