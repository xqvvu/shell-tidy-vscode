<p align="center">
  <img src="./assets/logo.png" alt="Shell Tidy logo" width="180" />
</p>

<h1 align="center">Shell Tidy</h1>

<p align="center">
  A modern formatter for shell and shell-like command text files in VS Code, powered by <code>shfmt</code>.
</p>

<p align="center">
  <a href="https://github.com/xqvvu/shell-tidy-vscode/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/xqvvu/shell-tidy-vscode?style=flat-square" />
  </a>

  <a href="https://github.com/mvdan/sh/releases">
    <img alt="Bundled shfmt" src="https://img.shields.io/badge/shfmt-3.12.0-blue?style=flat-square" />
  </a>
</p>

## Get It on VS Code Marketplace

Install from Marketplace:

- https://marketplace.visualstudio.com/items?itemName=xqvvu.shell-tidy-vscode

Or install locally from VSIX:

```bash
code --install-extension shell-tidy.vsix
```

## Features

- Multi-file formatting powered by `shfmt`.
- Smart `shfmt` resolution:
  - uses `shellTidy.executablePath` when set
  - falls back to `shfmt` on your `PATH`
  - auto-downloads a managed `shfmt` binary (optional)
- Honors editor indentation (`editor.tabSize`) unless `-i` is already set in args.
- Optional `.editorconfig` integration via `editorconfig` package.
- Automatically injects `--ln=bats` for `.bats` files when needed.
- Surfaces formatter errors in Diagnostics and Output panel.

## Supported File Types / Languages

| Language ID | File patterns | Description |
| --- | --- | --- |
| `shellscript` | `.sh`, `.bash` | Shell script files |
| `dockerfile` | `Dockerfile`, `Dockerfile.*`, `*.dockerfile` | Docker files |
| `ignore` | `.gitignore`, `.dockerignore` | Ignore files |
| `dotenv` | `.env`, `.env.*`, `env` | Dotenv files |
| `properties` | `.properties` | Java properties files |
| `spring-boot-properties` | `*.properties` (when language ID is provided by other extension) | Spring Boot properties |
| `jvmoptions` | `.vmoptions`, `jvm.options` | JVM options files |
| `hosts` | `hosts` (for example `/etc/hosts`) | Hosts file |
| `azcli` | `.azcli` | Azure CLI script files |
| `bats` | `.bats` | Bats test files |

## Usage

Format current document:

- macOS: `Shift + Option + F`
- Linux/Windows: `Shift + Alt + F`
- Command Palette: `Format Document`

Optional: set Shell Tidy as default for shellscript:

```json
{
  "[shellscript]": {
    "editor.defaultFormatter": "xqvvu.shell-tidy-vscode"
  }
}
```

## Commands

| Command | ID | Description |
| --- | --- | --- |
| `Shell Tidy: Download shfmt` | `shellTidy.downloadShfmt` | Download managed `shfmt` for current platform |
| `Shell Tidy: Show shfmt Info` | `shellTidy.showShfmtInfo` | Show current `shfmt` source/path/version |

## Configuration

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `shellTidy.executablePath` | `string \| null` | `null` | Absolute path to `shfmt`. Supports `${workspaceFolder}` / `${workspaceRoot}` |
| `shellTidy.autoDownload` | `boolean` | `true` | Auto-download managed `shfmt` when not found |
| `shellTidy.shfmt.version` | `string \| null` | `null` | Override managed `shfmt` version (built-in default is `3.12.0`) |
| `shellTidy.args` | `string[]` | `[]` | Extra args passed to `shfmt` |
| `shellTidy.respectEditorConfig` | `boolean` | `false` | Resolve `.editorconfig` and map shfmt-related keys to flags |
| `shellTidy.editorConfigApplyIgnore` | `boolean` | `false` | When EditorConfig mode is enabled, pass `--apply-ignore` |
| `shellTidy.enabledLanguages` | `string[]` | Built-in language list | Language IDs to register formatter for |
| `shellTidy.logLevel` | `"info" \| "debug"` | `"info"` | Controls Output panel verbosity |

Example:

```json
{
  "shellTidy.autoDownload": true,
  "shellTidy.executablePath": null,
  "shellTidy.shfmt.version": null,
  "shellTidy.args": ["-mn"],
  "shellTidy.respectEditorConfig": false,
  "shellTidy.editorConfigApplyIgnore": false,
  "shellTidy.logLevel": "info",
  "shellTidy.enabledLanguages": [
    "shellscript",
    "dockerfile",
    "dotenv",
    "ignore",
    "hosts",
    "jvmoptions",
    "properties",
    "spring-boot-properties",
    "azcli",
    "bats"
  ]
}
```

When `shellTidy.respectEditorConfig` is enabled, effective precedence is:

1. `shellTidy.args`
2. `.editorconfig` mapped keys
3. VS Code formatting options (`editor.insertSpaces` / `editor.tabSize`)

Only local file-backed documents participate in `.editorconfig` resolution. Untitled/virtual documents skip `.editorconfig`.

Mapped `.editorconfig` keys:

| EditorConfig key | shfmt flag |
| --- | --- |
| `indent_style=tab` | `-i=0` |
| `indent_style=space` + `indent_size=<n>` | `-i=<n>` |
| `shell_variant=<name>` | `-ln=<name>` |
| `binary_next_line=true` | `-bn` |
| `switch_case_indent=true` | `-ci` |
| `space_redirects=true` | `-sr` |
| `keep_padding=true` | `-kp` |
| `function_next_line=true` | `-fn` |

## How `shfmt` Is Resolved

Resolution order:

1. `shellTidy.executablePath`
2. `shfmt` from system `PATH`
3. Managed `shfmt` binary downloaded by extension (`shellTidy.autoDownload: true`)

If all three fail, Shell Tidy reports an error and provides diagnostics/output logs.

## Troubleshooting

- Set `shellTidy.logLevel` to `debug`.
- Open `View -> Output -> Shell Tidy`.
- If your network blocks GitHub downloads, install `shfmt` manually and set `shellTidy.executablePath`.

## Links

- Source code: https://github.com/xqvvu/shell-tidy-vscode
- Marketplace: https://marketplace.visualstudio.com/items?itemName=xqvvu.shell-tidy-vscode
- shfmt: https://github.com/mvdan/sh

## License

MIT
