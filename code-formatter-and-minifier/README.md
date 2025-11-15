# Code Formatter & Minifier

A simple VS Code extension to **minify**, **beautify**, **mitify**, **sort JSON**, **sort JSON arrays**, **sort JSON arrays by key**, and provide **UUID generation** utilities.

## Features

### JavaScript
- Right-click inside a **JavaScript (.js)** file:
  - **"Minify current file"** -> Minify using [terser](https://github.com/terser/terser).
  - **"Beautify current file"** -> Beautify using [js-beautify](https://github.com/beautify-web/js-beautify).
  - **"Mitify current file"** -> Runs **minify + beautify**.

### HTML
- Right-click inside an **HTML (.html)** file:
  - **"Minify current file"** -> Uses [html-minifier-terser](https://github.com/terser/html-minifier-terser)  
  - **"Beautify current file"** -> Beautify using js-beautify (HTML).
  - **"Mitify current file"** -> Runs **minify + beautify**.

### CSS
- Right-click inside a **CSS (.css)** file:
  - **"Minify current file"** -> Minify using [clean-css](https://github.com/jakubpawlowicz/clean-css).
  - **"Beautify current file"** -> Format using js-beautify (CSS).
  - **"Mitify current file"** -> Runs **minify + beautify**.

### JSON / JSONC
- Right-click inside a **JSON (.json)** or **JSONC (.jsonc)** file:
  - **"Minify current file"** -> Compact JSON into a single line.
  - **"Beautify current file"** -> Format JSON with indentation (using tabs).
  - **"Sort current file"** -> Sort JSON keys recursively in alphabetical order.
  - **"Sort lists from current file"** -> Sort all arrays recursively by their JSON stringified values.
  - **"Sort lists by keys from current file"** -> Prompt for a key name and sort JSON arrays of objects by that key.
- **Note:**
  `.jsonc` files are automatically parsed as `.json` (comments are stripped).

  The output file will **not** contain comments, as they are removed during parsing.

### JSONL
- Right-click inside a **JSON Lines (.jsonl)** file:
  - **"Minify current file"** -> Compress each JSON object on every line into a single compact line.
  - **"Beautify current file"** -> Format each JSON object on every line with indentation and line breaks.
  - **"Sort current file"** -> Sort JSON keys recursively within each JSON object.
  - **"Sort lists from current file"** -> Sort JSON objects and arrays line by line recursively.
  - **"Sort lists by keys from current file"** -> Prompt for a key name and sort JSON objects by that key line by line.
- Each line is parsed and processed independently without merging across lines.
- **Note:**
  Internally, JSONL parsing uses [jsonparse](https://github.com/creationix/jsonparse) and a custom circular-safe stringifier.

### Sorting by Key
- Use the **"Sort lists by keys from current file"** command to sort JSON or JSONL arrays of objects by a specific key.
  You will be prompted to enter the key name in an input box.
  Works for both **entire files** and **selected text**.

### UUID Generator
- Right-click to use **Generate UUID**.
- Inserts a freshly generated UUID at every selected cursor position in the active editor.

### Run [action] as [language]
Use these commands to manually choose both the **operation** and the **language processor**.

- **"Run [action] as [language]"**
- **"Run [action] as [language] from current selection"**

You will be prompted twice:

1. Select the **action**  
   (minify, beautify, mitify, sort, sort lists, sort lists by keys)
2. Select the **language**  
   (JavaScript, HTML, CSS, JSON, JSONL)

This provides full manual control, allowing any supported operation to be executed using any supported processor. Works with entire files and selected text.

- These commands can be invoked from the Command Palette (**Ctrl + Shift + P**).
- They are not shown in the editor's context menu.

## Usage
1. Open a `.js`, `.json`, `.jsonc`, or `.jsonl` file in VS Code.
2. Right-click inside the editor.
3. Choose the desired operation from the context menu.
   - **"Minify current file"**
   - **"Beautify current file"**
   - **"Mitify current file"**
   - **"Sort current file"**
   - **"Sort lists from current file"**
   - **"Sort lists by keys from current file"**
4. You can also **select text** and run:
   - **"Minify current selection"**
   - **"Beautify current selection"**
   - **"Mitify current selection"**
   - **"Sort current selection"**
   - **"Sort lists from current selection"**
   - **"Sort lists by keys from current selection"**

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
