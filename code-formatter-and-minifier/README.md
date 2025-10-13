# Code Formatter & Minifier

A simple VS Code extension to **minify**, **beautify**, **mitify**, **sort JSON**, and provide **UUID generation** utilities.

## Features

### JavaScript
- Right-click inside a **JavaScript (.js)** file:
  - **“Minify this file”** -> Minify using [terser](https://github.com/terser/terser).
  - **“Beautify this file”** -> Beautify using [js-beautify](https://github.com/beautify-web/js-beautify).
  - **“Mitify this file”** -> Runs **minify + beautify** in sequence (for normalized, clean code).

### JSON / JSONC
- Right-click inside a **JSON (.json)** or **JSONC (.jsonc)** file:
  - **“Minify this file”** -> Compact JSON into a single line.
  - **“Sort this file”** -> Sort JSON keys recursively in alphabetical order.
  - **“Beautify this file”** -> Format JSON with indentation (using tabs).
- **Note:** `.jsonc` files are automatically parsed as `.json` (comments are stripped).

### UUID Generator
- Right-click to use `Generate UUID`
- Inserts a freshly generated UUID at each selected cursor position in the active editor.

## Usage
1. Open a `.js`, `.json`, or `.jsonc` file in VS Code.
2. Right-click inside the editor.
3. Choose the operation you want from the context menu.

## Notes
- JavaScript minification uses [terser](https://github.com/terser/terser).
- JavaScript beautification uses [js-beautify](https://github.com/beautify-web/js-beautify).
- JSON parsing uses [jsonc-parser](https://github.com/microsoft/node-jsonc-parser).
- JSON operations do not preserve comments when saving.

## Extra
- All edit operations automatically save the document (unless untitled).
