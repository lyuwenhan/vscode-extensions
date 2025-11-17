# Code Formatter & Minifier

A simple VS Code extension to **Minify**, **Beautify**, **Mitify**, **Sort**, **Sort lists**, **Sort lists by keys**, and provide **UUID generation** utilities.
This extension can also **Run [action] as [language]**.

## Supported Actions

For each language, the table below shows whether the action is supported.

|**Languages**|**Minify**|**Beautify**|**Mitify**|**Sort**|**Sort lists**|**Sort lists by keys**|
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
|**JavaScript**|✔|✔|✔|✖|✖|✖|
|**HTML**|✔|✔|✔|✖|✖|✖|
|**CSS**|✔|✔|✔|✖|✖|✖|
|**JSON / JSONC**|✔|✔|✖|✔|✔|✔|
|**JSON Lines**|✔|✔|✖|✔|✔|✔|

**Notes:** **UUID generation** works with all languages.

---

## Action Descriptions

### Minify
- Makes your code smaller by removing unnecessary whitespace.
- This action only performs whitespace-related changes.
- The actual data remains unchanged.
- Example:
> Before
> ```javascript
> function   test( ){ console.log(  "x"  )  }
> ```
> After
> ```javascript
> function test(){console.log("x")}
> ```

### Beautify
- Formats your code to a unified, readable style.
- Makes your code look cleaner and more consistent.
- Example:
> Before
> ```javascript
> function   test( ){ console.log(  "x"  )  }
> ```
> After
> ```javascript
> function test() {
> 	console.log("x")
> }
> ```

### Mitify
- A combination of minify and beautify.
- Useful when your code is too messy and beautify alone is not effective.
- Runs both minify and beautify in sequence.
- Example:
> Before
> ```javascript
> function   test( ){ console.log(  "x"  )  }
> ```
> After
> ```javascript
> function test() {
> 	console.log("x")
> }
> ```

### Sort
- **Does not** change the actual data.
- Only works with **JSON**, **JSONC**, and **JSON Lines**.
- Sorts the keys of all objects alphabetically.
- Example:
> Before
> ```json
> {
> 	"banana": 5,
> 	"pear": 3,
> 	"apple": 4
> }
> ```
> After
> ```json
> {
> 	"apple": 4,
> 	"banana": 5,
> 	"pear": 3
> }
> ```

### Sort lists
- **Does** change the actual data.
- **Do not** use this unless you know exactly what you are doing.
- This action is **irreversible**.
- Sorts the items inside lists alphabetically.
- Example:
> Before
> ```json
> [
> 	"banana",
> 	"pear",
> 	"apple"
> ]
> ```
> After
> ```json
> [
> 	"apple",
> 	"banana",
> 	"pear"
> ]
> ```

### Sort lists by keys
- **Does** change the actual data.
- **Do not** use this unless you know exactly what you are doing.
- This action is **irreversible**.
- Sorts the list based on a chosen key within each item, in alphabetical order.
- Example:
> Before
> ```json
> [
> 	{
> 		"type": "banana",
> 		"price": 5
> 	},
> 	{
> 		"type": "pear",
> 		"price": 3
> 	},
> 	{
> 		"type": "apple",
> 		"price": 4
> 	}
> ]
> ```
> After (sort by type)
> ```json
> [
> 	{
> 		"type": "apple",
> 		"price": 4
> 	},
> 	{
> 		"type": "banana",
> 		"price": 5
> 	},
> 	{
> 		"type": "pear",
> 		"price": 3
> 	}
> ]
> ```
> After (sort by price)
> ```json
> [
> 	{
> 		"type": "pear",
> 		"price": 3
> 	},
> 	{
> 		"type": "apple",
> 		"price": 4
> 	},
> 	{
> 		"type": "banana",
> 		"price": 5
> 	}
> ]
> ```

### Generate UUID
- Inserts a freshly generated UUID at every selected cursor position in the active editor.

### Run [action] as [language]
- Use these commands to manually choose both the **operation** and the **language processor**.

- You will be prompted twice:

1. Select the **action**
2. Select the **language** (**JavaScript**, **HTML**, **CSS**, **JSON**, **JSON Lines**)

- This provides full manual control, allowing any supported operation to be executed using any supported processor. Works with entire files and selected text.

- These commands can be invoked from the Command Palette (**Ctrl + Shift + P**).
- This action is **not** shown in the editor's context menu.

## Usage

1. Open any file in VS Code.  
   - For formatting-related actions, the file should be one of:  
     `.js`, `.json`, `.jsonc`, `.jsonl`, `.html`, `.css`.

2. Right-click inside the editor.

3. Choose the desired operation from the context menu:
   - **"Minify current file"**
   - **"Beautify current file"**
   - **"Mitify current file"**
   - **"Sort current file"**
   - **"Sort lists from current file"**
   - **"Sort lists by keys from current file"**
   - **"Generate UUID"** ← *works in any file type*

4. You can also **select text** and run:
   - **"Minify current selection"**
   - **"Beautify current selection"**
   - **"Mitify current selection"**
   - **"Sort current selection"**
   - **"Sort lists from current selection"**
   - **"Sort lists by keys from current selection"**

5. All actions can also be invoked from the Command Palette (**Ctrl + Shift + P**):
   - **"Run [action] as [language] from current file"**
   - **"Run [action] as [language] from current selection"**

   These two commands work in **any file** and let you manually choose both the action and the processor.

## Notes
- **JavaScript** minification uses [terser](https://github.com/terser/terser).
- **HTML** minification uses [html-minifier-terser](https://github.com/terser/html-minifier-terser).
- **CSS** minification uses [clean-css](https://github.com/jakubpawlowicz/clean-css).
- **JavaScript**, **HTML**, **CSS** beautification uses [js-beautify](https://github.com/beautify-web/js-beautify).
- **JSON** parsing uses [jsonc-parser](https://github.com/microsoft/node-jsonc-parser).
- **JSON Lines** parsing uses [jsonparse](https://github.com/creationix/jsonparse).
- **JSON** and **JSON Lines** stringification uses native `JSON.stringify`.
- **JSON** operations remove comments on save.
- **UUID Generator** uses [crypto](https://nodejs.org/api/crypto.html)

## Extra
- All edit operations automatically save the document (unless untitled).
- Both `LF (\n)` and `CRLF (\r\n)` line endings are supported.
- Works with multiple selections.
- Displays success, warning, and error messages consistently.
