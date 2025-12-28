# Zipper

A lightweight **VS Code extension** that adds simple **ZIP compression and extraction** capabilities directly to the **Explorer context menu**.

Designed for quick, local file operations without leaving the editor.

---

## Features

### 1. Zip Files and Folders

- Right-click one or more files / folders in the **Explorer**
- Select **Compress**
- Creates a `.zip` archive in the same directory

**Behavior**
- Single selection:
  `example.txt` → `example.zip`
- Multiple selections:
  → `archive.zip`

### 2. Unzip Archives

- Right-click a `.zip` file in the **Explorer**
- Select **Extract**
- Extracts contents into a folder with the same name:

**Behavior**
  `example.zip` → `example/`

### 3. ZIP Preview

Zipper provides a **read-only ZIP preview** inside VS Code, allowing you to **browse archive contents without extracting**.

---

## Capabilities
- Open `.zip`, `.vsix`, `.jar`, `.apk` directly in the editor
- Tree-based folder structure view
- Expand / collapse directories
- No automatic extraction

---

## Selective Extraction
- Download individual files or folders
- Extracted items are placed into a local `exports/` directory
- Name conflicts are resolved automatically:
  - `file.txt`
  - `file (1).txt`
  - `file (2).txt`

---

## Safety
- Protection against Zip Slip path traversal
- All extracted files stay within the target directory

---

## Usage

1. Open the **Explorer** in VS Code
2. Select files or folders
3. Right-click and choose:
   - **Compress** - to create a ZIP archive
   - **Extract** - to extract a ZIP file

Progress and results are shown via VS Code notifications.

---

## Current Limitations

- Only **ZIP** format is supported
- No password-protected archives
- This was only tested on `windows` and `wsl`
- This might not work on `linux` and `mac`

---

## License

MIT License © 2025 **lyuwenhan**
