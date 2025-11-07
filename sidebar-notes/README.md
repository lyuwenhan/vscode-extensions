# Code Formatter & Minifier

A simple VS Code extension to **minify**, **beautify**, **mitify**, **sort JSON**, **sort JSON arrays**, **sort JSON arrays by key**, and provide **UUID generation** utilities.

## Features

### JavaScript
- Right-click inside a **JavaScript (.js)** file:
  - **“Minify this file”** -> Minify using [terser](https://github.com/terser/terser).
  - **“Beautify this file”** -> Beautify using [js-beautify](https://github.com/beautify-web/js-beautify).
  - **“Mitify this file”** -> Runs **minify + beautify** in sequence (for normalized, clean code).
- **Note:** The “Mitify” command is available **only for JavaScript files**.

### JSON / JSONC
- Right-click inside a **JSON (.json)** or **JSONC (.jsonc)** file:
  - **“Minify this file”** -> Compact JSON into a single line.
  - **“Beautify this file”** -> Format JSON with indentation (using tabs).
  - **“Sort this file”** -> Sort JSON keys recursively in alphabetical order.
  - **“Sort List”** -> Sort all arrays recursively by their JSON stringified values.
  - **“Sort List by Key”** -> Prompt for a key name and sort JSON arrays of objects by that key.
- **Note:**
  `.jsonc` files are automatically parsed as `.json` (comments are stripped).

  The output file will **not** contain comments, as they are removed during parsing.

### JSONL
- Right-click inside a **JSON Lines (.jsonl)** file:
  - **“Minify this file”** -> Compress each JSON object on every line into a single compact line.
  - **“Beautify this file”** -> Format each JSON object on every line with indentation and line breaks.
  - **“Sort this file”** -> Sort JSON keys recursively within each JSON object.
  - **“Sort List”** -> Sort JSON objects and arrays line by line recursively.
  - **“Sort List by Key”** -> Prompt for a key name and sort JSON objects by that key line by line.
- Each line is parsed and processed independently without merging across lines.
- **Note:**
  Internally, JSONL parsing uses [jsonparse](https://github.com/creationix/jsonparse) and a custom circular-safe stringifier.

### Sorting by Key
- Use the **“Sort List by Key”** command to sort JSON or JSONL arrays of objects by a specific key.
  You will be prompted to enter the key name in an input box.
  Works for both **entire files** and **selected text**.

### UUID Generator
- Right-click to use **Generate UUID**.
- Inserts a freshly generated UUID at every selected cursor position in the active editor.

## Usage
1. Open a `.js`, `.json`, `.jsonc`, or `.jsonl` file in VS Code.
2. Right-click inside the editor.
3. Choose the desired operation from the context menu.
4. You can also **select text** and run:
   - **“Minify current selection”**
   - **“Beautify current selection”**
   - **“Mitify current selection”**
   - **“Sort current selection”**
   - **“Sort lists (selection)”**
   - **“Sort lists by keys (selection)”**

## Notes
- JavaScript minification uses [terser](https://github.com/terser/terser).
- JavaScript beautification uses [js-beautify](https://github.com/beautify-web/js-beautify).
- JSON parsing uses [jsonc-parser](https://github.com/microsoft/node-jsonc-parser).
- JSONL parsing uses [jsonparse](https://github.com/creationix/jsonparse).
- JSON operations remove comments on save.

## Extra
- All edit operations automatically save the document (unless untitled).
- Both `LF (\n)` and `CRLF (\r\n)` line endings are supported.
- Works with multiple selections.
- Displays success, warning, and error messages consistently.
