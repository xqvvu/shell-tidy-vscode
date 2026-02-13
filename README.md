<p align="center">
  <img src="./assets/logo.png" alt="Shell Tidy logo" width="180" />
</p>

<h1 align="center">Shell Tidy</h1>

<p align="center">
  A modern formatter for shell and shell-like command text files in VS Code, powered by <code>shfmt</code>.
</p>

<p align="center">
  <a href="https://marketplace.visualstudio.com/items?itemName=xqvvu.shell-tidy-vscode">
    <img alt="Version" src="https://img.shields.io/visual-studio-marketplace/v/xqvvu.shell-tidy-vscode?style=flat-square" />
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=xqvvu.shell-tidy-vscode">
    <img alt="Downloads" src="https://img.shields.io/visual-studio-marketplace/d/xqvvu.shell-tidy-vscode?style=flat-square" />
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=xqvvu.shell-tidy-vscode">
    <img alt="Installs" src="https://img.shields.io/visual-studio-marketplace/i/xqvvu.shell-tidy-vscode?style=flat-square" />
  </a>
  <a href="https://marketplace.visualstudio.com/items?itemName=xqvvu.shell-tidy-vscode">
    <img alt="Rating" src="https://img.shields.io/visual-studio-marketplace/stars/xqvvu.shell-tidy-vscode?style=flat-square" />
  </a>
  <a href="https://github.com/xqvvu/shell-tidy-vscode/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/github/license/xqvvu/shell-tidy-vscode?style=flat-square" />
  </a>
  <a href="https://github.com/mvdan/sh/releases">
    <img alt="Bundled shfmt" src="https://img.shields.io/badge/shfmt-3.12.0-blue?style=flat-square" />
  </a>
</p>

> [!NOTE]
> `Shell Tidy` is currently at `0.1.0`.

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
  - uses `shellFormatter.executablePath` when set
  - falls back to `shfmt` on your `PATH`
  - auto-downloads a managed `shfmt` binary (optional)
- Honors editor indentation (`editor.tabSize`) unless `-i` is already set in args.
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
| `Shell Tidy: Download shfmt` | `shellFormatter.downloadShfmt` | Download managed `shfmt` for current platform |
| `Shell Tidy: Show shfmt Info` | `shellFormatter.showShfmtInfo` | Show current `shfmt` source/path/version |

## Configuration

| Setting | Type | Default | Description |
| --- | --- | --- | --- |
| `shellFormatter.executablePath` | `string \| null` | `null` | Absolute path to `shfmt`. Supports `${workspaceFolder}` / `${workspaceRoot}` |
| `shellFormatter.autoDownload` | `boolean` | `true` | Auto-download managed `shfmt` when not found |
| `shellFormatter.shfmt.version` | `string \| null` | `null` | Override managed `shfmt` version (built-in default is `3.12.0`) |
| `shellFormatter.args` | `string[]` | `[]` | Extra args passed to `shfmt` |
| `shellFormatter.enabledLanguages` | `string[]` | Built-in language list | Language IDs to register formatter for |
| `shellFormatter.logLevel` | `"info" \| "debug"` | `"info"` | Controls Output panel verbosity |

Example:

```json
{
  "shellFormatter.autoDownload": true,
  "shellFormatter.executablePath": null,
  "shellFormatter.shfmt.version": null,
  "shellFormatter.args": ["-mn"],
  "shellFormatter.logLevel": "info",
  "shellFormatter.enabledLanguages": [
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

## How `shfmt` Is Resolved

Resolution order:

1. `shellFormatter.executablePath`
2. `shfmt` from system `PATH`
3. Managed `shfmt` binary downloaded by extension (`shellFormatter.autoDownload: true`)

If all three fail, Shell Tidy reports an error and provides diagnostics/output logs.

## Troubleshooting

- Set `shellFormatter.logLevel` to `debug`.
- Open `View -> Output -> Shell Tidy`.
- If your network blocks GitHub downloads, install `shfmt` manually and set `shellFormatter.executablePath`.

## Links

- Source code: https://github.com/xqvvu/shell-tidy-vscode
- Marketplace: https://marketplace.visualstudio.com/items?itemName=xqvvu.shell-tidy-vscode
- shfmt: https://github.com/mvdan/sh

## License

MIT
