# Sidebar Notes

A lightweight **VS Code extension** that adds a simple note-taking area to the **sidebar** — ideal for writing quick thoughts, reminders, or temporary text while coding.

---

## Features

### 1. Sidebar Notepad
- Opens directly inside the **VS Code sidebar**.
- Provides a single, large **textarea** for typing notes.
- Supports typing, editing, and clearing manually — just like a plain text pad.

---

### 2. Theme Integration
- The note area automatically adapts to your current **VS Code theme**:
  - Background color: `--vscode-input-background`
  - Text color: `--vscode-input-foreground`
  - Focus border: `--vscode-focusBorder`
  - Placeholder color: `--vscode-input-placeholderForeground`
- Works seamlessly in **light**, **dark**, and **high-contrast** themes.

---

### 3. Minimal UI
- Clean layout — no menus, no toolbars.
- Uses the font family `Consolas, Courier, monospace` for a code-friendly look.
- Displays placeholder text when empty:  
  > *“Write your notes here...”*

---

## Current Limitations
- Notes are **not saved** after closing VS Code.
- No sync, commands, or persistent storage yet.
- Focused purely on layout and theme adaptation for now.

---

## Installation

1. Open **VS Code**.
2. Go to **Extensions** (`Ctrl+Shift+X` / `Cmd+Shift+X`).
3. Search for **"Sidebar Notes"** by `lyuwenhan`.
4. Click **Install**.
5. Click the **Notes** icon in the Activity Bar to open your notepad.

---

## Technical Notes
- Built with **HTML + CSS + VS Code Webview API**.
- The notepad fills the entire sidebar panel.
- Uses VS Code’s built-in theme color tokens for styling.
- Contains no external dependencies or scripts.

---

## License

MIT License © 2025 **lyuwenhan**
