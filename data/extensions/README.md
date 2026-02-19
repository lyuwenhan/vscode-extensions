# Zipper

A lightweight **VS Code extension** that adds simple **ZIP compression, extraction, and preview** capabilities directly to the **Explorer context menu**.

Designed for quick, local archive operations without leaving the editor.

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

![Demo](https://lyuwenhan.github.io/extensions/vscode/data/zipper/images/1.png)

### 2. Unzip Archives

- Right-click a `.zip` file in the **Explorer**
- Select **Extract**
- Extracts contents into a folder with the same name

**Behavior**
  `example.zip` → `example/`

![Demo](https://lyuwenhan.github.io/extensions/vscode/data/zipper/images/2.png)

### 3. ZIP Preview

Zipper provides a **read-only archive preview** inside VS Code, allowing you to **browse archive contents without extracting**.

![Demo](https://lyuwenhan.github.io/extensions/vscode/data/zipper/images/4.png)

### 4. Download a Single File or Folder

From the ZIP preview, you can select **one file or one folder** and extract it locally.

> "Download" refers to extracting the selected item to disk.

![Demo](https://lyuwenhan.github.io/extensions/vscode/data/zipper/images/5.png)

### 5. Download Multiple Files and Folders

You can select **multiple files and folders** in the preview and extract them together.

![Demo](https://lyuwenhan.github.io/extensions/vscode/data/zipper/images/6.png)

### 5. Editing archive

You can delete selected files and folders, rename files and folders, create new folders, and upload external files or folders in the editing view before exporting a new archive.

- Uploaded files are added at the selected location.
- Uploaded folders are imported recursively, preserving their internal structure.
- Empty folders are preserved.
- Existing entries with the same path are not overwritten.

**This feature is still under development and is not guaranteed to be stable or fully functional.**

**No image available.**

---

## Capabilities
- Open `.zip`, `.vsix`, `.jar`, `.apk` directly in the editor
- Tree-based folder structure view
- Expand / collapse directories
- No automatic extraction
- Supports selective extraction (single or multiple items)
- Tested on:
  - Windows 11
  - Ubuntu 22.04 LTS
  - macOS

---

## Selective Extraction

- Extract individual files or folders from the preview
- Extract multiple files and folders at once
- Extracted items are placed into a local `exports/` directory next to the archive
- Name conflicts are resolved automatically:
  - `file.txt`
  - `file (1).txt`
  - `file (2).txt`

---

## Safety

- Protection against Zip Slip path traversal attacks
- All extracted files are guaranteed to stay within the target directory

---

## Usage

1. Open the **Explorer** in VS Code
2. Select files or folders
3. Right-click and choose:
   - **Compress** - create a ZIP archive
   - **Extract** - extract a ZIP file
4. Open a supported archive file to preview its contents

Progress and results are shown via VS Code notifications.

---

## Current Limitations

- Only **ZIP** format is supported
- No password-protected archives

---

## License

MIT License © 2025 **lyuwenhan**
