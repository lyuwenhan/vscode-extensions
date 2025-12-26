# Zipper

A lightweight **VS Code extension** that adds simple **ZIP compression and extraction** capabilities directly to the **Explorer context menu**.

Designed for quick, local file operations without leaving the editor.

---

## Features

### 1. Zip Files and Folders

- Right-click one or more files / folders in the **Explorer**
- Select **Zip**
- Creates a `.zip` archive in the same directory

**Behavior**
- Single selection:
  `example.txt` → `example.zip`
- Multiple selections:
  → `archive.zip`

### 2. Unzip Archives

- This feature is **not** yet complete.

---

## Usage

1. Open the **Explorer** in VS Code
2. Select files or folders
3. Right-click and choose:
   - **Zip** - to create a ZIP archive

Progress and results are shown via VS Code notifications.

---

## Current Limitations

- Only ZIP format is supported
- No password-protected archives

---

## License

MIT License © 2025 **lyuwenhan**
