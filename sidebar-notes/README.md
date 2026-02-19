# Sidebar Notes

A lightweight **VS Code extension** that adds a simple note-taking area to the **sidebar** - ideal for writing quick thoughts, reminders, or temporary text while coding.

---

## Features

![Demo](https://lyuwenhan.github.io/extensions/vscode/data/sidebar-notes/images/1.png)

### 1. Sidebar Notepad
- Opens directly inside the **VS Code sidebar**.
- Provides a single, large **textarea** for typing notes.
- Supports multiple **languages** with syntax highlighting powered by **CodeMirror**:
  - plain text  
  - markdown  
  - javascript  
  - python  
  - c
  - c++  
  - java  
  - json  
  - html  
  - css  
  - shell  
  - sql  
  - yaml
- Supports **Alt + Mouse Wheel** or toolbar buttons (`+`, `=`, `–`) to adjust font size.
- Allows toggling **Preview** Mode for Markdown and HTML.

---

### 2. Syntax Highlighting
- Integrated with **CodeMirror** for smooth editing and syntax coloring.
- Supports **auto-close brackets**, **auto-close tags**, and **matching brackets**.
- Adjustable font size for comfortable reading.
- Keeps the cursor position and scroll location when switching languages.

---

### 3. Markdown & HTML Preview
- **Preview Mode** can be toggled manually by clicking the **Preview** button.
- Not real-time - content is rendered only when entering preview mode.
- Uses:
  - [marked.js](https://github.com/markedjs/marked) for Markdown parsing  
  - [Prism.js](https://prismjs.com/) for syntax highlighting  
  - [DOMPurify](https://github.com/cure53/DOMPurify) for sanitization  
  - [MathJax](https://www.mathjax.org/) for LaTeX math rendering
- Prevents unsafe HTML and scripts for secure rendering.

---

### 4. Minimal UI
- Clean layout - no menus, no toolbars.
- Uses `Consolas, Courier, monospace` for a code-friendly look.
- Displays placeholder text when empty:  
  *Write your notes here...*

---

## License

MIT License © 2025 **lyuwenhan**
