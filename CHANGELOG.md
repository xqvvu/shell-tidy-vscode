# shell-tidy-vscode

## 1.1.1

### Patch Changes

- Fix extension activation by shipping `editorconfig` as a runtime dependency.

## 1.1.0

### Minor Changes

- Add optional `.editorconfig` integration for shfmt arguments.

  - Add `shellTidy.respectEditorConfig` to resolve shfmt-related keys from `.editorconfig`.
  - Add `shellTidy.editorConfigApplyIgnore` to pass `--apply-ignore` during formatting.
  - Map resolved EditorConfig keys such as `indent_style`, `indent_size`, and `shell_variant` to shfmt flags.
  - Keep `shellTidy.args` as the highest-precedence source when flags conflict.

## 1.0.1

### Patch Changes

- Align remaining extension command IDs, configuration keys, and docs with the `shellTidy.*` namespace for consistent Shell Tidy branding.

## 1.0.0

### Major Changes

- Release the first stable major version of Shell Tidy.
- Breaking change: the extension identifier is now `xqvvu.shell-tidy-vscode`. If you configured a default formatter, update it to this ID.
- Improvements:
  - Unify user-facing branding to **Shell Tidy** across command titles, Output channel naming, and documentation.
  - Refresh package metadata and repository links to the new project name.
  - Continue providing `shfmt`-based formatting for shell and shell-like command text files.

### Patch Changes

- Rename user-facing branding to Shell Tidy across commands, output channel, and docs.
- Improve extension/task descriptions to clarify support for shell and shell-like command text files.
- Configure Changesets to use `@changesets/changelog-github` for richer `CHANGELOG.md` entries linked to repository metadata.

## 0.1.0

### Patch Changes

- Release maintenance updates and prepare a new public release.
