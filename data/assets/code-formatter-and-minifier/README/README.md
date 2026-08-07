# Code Formatter & Minifier

A simple VS Code extension to **Minify**, **Beautify**, **Mitify**, **Sort**, **Sort lists**, **Sort lists by keys**, and provide **UUID generation** utilities.
This extension can also **Run [action] as [language]**.

## Supported Actions

For each language, the table below shows whether the action is supported.

|**Languages**|**Minify**|**Beautify**|**Mitify**|**Sort**|**Sort lists**|**Sort lists by keys**|
|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
|**JavaScript**|✔|✔|✔|✖|✖|✖|
|**TypeScript**|✔|✔|✔|✖|✖|✖|
|**HTML**|✔|✔|✔|✖|✖|✖|
|**CSS**|✔|✔|✔|✖|✖|✖|
|**Java**|✖|✔|✖|✖|✖|✖|
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

Before

```javascript
function   test( ){ console.log(  "x"  )  }
```

After

```javascript
function test(){console.log("x")}
```

### Beautify

- Formats your code to a unified, readable style.
- Makes your code look cleaner and more consistent.
- Example:

Before

```javascript
function   test( ){ console.log(  "x"  )  }
```

After

```javascript
function test() {
	console.log("x")
}
```

### Mitify

- A combination of minify and beautify.
- Useful when your code is too messy and beautify alone is not effective.
- Normally runs minify and beautify in sequence.
- When minify is disabled for the selected language, Mitify runs beautify only.
- When beautify or Mitify is disabled for the selected language, Mitify is unavailable.
- Example:

Before

```javascript
function   test( ){ console.log(  "x"  )  }
```

After

```javascript
function test() {
	console.log("x")
}
```

### Sort

- **Does not** change the actual data.
- Only works with **JSON**, **JSONC**, and **JSON Lines**.
- Sorts the keys of all objects alphabetically.
- Example:

Before

```json
{
	"banana": 5,
	"pear": 3,
	"apple": 4
}
```

After

```json
{
	"apple": 4,
	"banana": 5,
	"pear": 3
}
```

### Sort lists

- **Does** change the actual data.
- **Do not** use this unless you know exactly what you are doing.
- This action is **irreversible**.
- Sorts the items inside lists alphabetically.
- Example:

Before

```json
[
	"banana",
	"pear",
	"apple"
]
```

After

```json
[
	"apple",
	"banana",
	"pear"
]
```

### Sort lists by keys

- **Does** change the actual data.
- **Do not** use this unless you know exactly what you are doing.
- This action is **irreversible**.
- Sorts the list based on a chosen key within each item, in alphabetical order.
- Example:

Before

```json
[
	{
		"type": "banana",
		"price": 5
	},
	{
		"type": "pear",
		"price": 3
	},
	{
		"type": "apple",
		"price": 4
	}
]
```

After (sort by type)

```json
[
	{
		"type": "apple",
		"price": 4
	},
	{
		"type": "banana",
		"price": 5
	},
	{
		"type": "pear",
		"price": 3
	}
]
```

After (sort by price)

```json
[
	{
		"type": "pear",
		"price": 3
	},
	{
		"type": "apple",
		"price": 4
	},
	{
		"type": "banana",
		"price": 5
	}
]
```

### Generate UUID

- Inserts a freshly generated UUID at every selected cursor position in the active editor.

### Run [action] as [language]

- Use these commands to manually choose both the **operation** and the **language processor**.

- You will be prompted twice:

1. Select the **action**
2. Select the **language** (**JavaScript**, **TypeScript**, **Java**, **HTML**, **CSS**, **JSON**, **JSON Lines**)

- This provides full manual control, allowing any supported operation to be executed using any supported processor. Works with entire files and selected text.

- These commands can be invoked from the Command Palette (**Ctrl + Shift + P**).
- This action is **not** shown in the editor's context menu.

## Usage

1. Open any file in VS Code.
   - For formatting-related actions, the file should be one of:
     `.js`, `.ts`, `.java`, `.json`, `.jsonc`, `.jsonl`, `.html`, `.css`.

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

# Formatter & Minifier Settings

This extension provides a **customizable configuration system** for controlling formatter and minifier behavior for **JavaScript**, **TypeScript**, **Java**, **HTML**, **CSS**, **JSON**, and **JSON Lines**.
All fields are optional — missing values automatically fall back to the built-in defaults.

---

## Configuration

You can modify settings through:

### **VS Code Settings UI**

Search for:

```
Minifier: Code Setting
```

### **Or in settings.json**

```jsonc
{
	"minifier.codeSetting": {
		"javascript": {
			"minify": {
				/* terser options */
			},
			"beautify": {
				/* js-beautify options */
			}
		},
		"typescript": {
			"minify": {
				/* @babel/generator options */
			},
			"beautify": {
				/* babel pretty-print (indent via indentSize + convertTabsToSpaces) + typescript FormatCodeSettings */
			}
		},
		"html": {
			"minify": {
				/* html-minifier-terser options */
			},
			"beautify": {
				/* js-beautify options */
			}
		},
		"css": {
			"minify": {
				/* cssnano options */
			},
			"beautify": {
				/* js-beautify options */
			}
		},
        "json": {
            "minify": {
				/* minify options */
            },
            "jsonLMinify": {
				/* minify options for JSON Lines */
            },
            "beautify": {
				/* beautify options */
            }
        },
		"java": {
			"beautify": {
				/* Google Java Format options */
			}
		},
		"excludedDirs": [
		],
		"excludedFiles": [
		],
		"disable": [
		]
	}
}
```

Only specified fields override defaults.

---

## Excluding Files and Directories

Use `excludedDirs` and `excludedFiles` to prevent matching paths from being processed.
Matching is performed against the file or directory **basename**, not the full path, and is case-sensitive.

Both settings support these wildcard characters:

| Wildcard | Meaning |
|:--:|---|
| `*` | Matches zero or more arbitrary characters |
| `?` | Matches exactly one arbitrary character |

All other characters are treated literally.

```jsonc
"minifier.codeSetting": {
	"excludedDirs": [
		"node_modules",
		"build*",
		"temp?"
	],
	"excludedFiles": [
		"*.min.js",
		"package-lock.*",
		"test?.json"
	]
}
```

Examples:

- `build*` matches `build`, `build-prod`, and `builder`.
- `temp?` matches `temp1`, but not `temp10`.
- `*.min.js` matches `app.min.js`.
- `test?.json` matches `test1.json`, but not `test10.json`.

Excluded files and directories are skipped when a file or directory URI is expanded for an operation, including folder traversal and directly selected file resources.

---

## Disabling Operations

Use the `disable` array to disable operations by language and action.
Each entry must use one of the supported forms below; entries are matched exactly against these forms rather than being interpreted as general glob patterns.

| Form | Effect |
|---|---|
| `language.action` | Disables one action for one language |
| `*.action` | Disables one action for every language |
| `language.*` | Disables every action for one language |
| `*.*` | Disables every action for every language |
| `*` | Disables every action for every language |

Supported language identifiers:

```text
javascript
typescript
json
jsonl
html
css
java
```

`jsonc` uses the `json` identifier.

Supported action identifiers:

```text
minify
beautify
mitify
sort
sortList
sortListByKey
```

Example:

```jsonc
"minifier.codeSetting": {
	"disable": [
		"javascript.minify",
		"json.sortList",
		"*.sortListByKey",
		"java.*"
	]
}
```

Disabled operations are blocked consistently for current-file commands, selection commands, folder processing, **Run [action] as [language]**, and document formatting. Languages whose selected operation is disabled are omitted from the corresponding **Run As** language list.

### Mitify interaction

Mitify uses these additional rules:

| Disabled entry affecting a language | Mitify behavior |
|---|---|
| No related disable entry | Runs minify, then beautify |
| `minify` only | Runs beautify only |
| `beautify` | Mitify is disabled |
| `mitify` | Mitify is disabled |
| Both `minify` and `beautify` | Mitify is disabled |

Wildcard entries participate in the same rules. For example, `*.minify` makes Mitify run beautify only for all languages that support Mitify, while `*.beautify` disables Mitify for all languages.

---

# Default Settings

These are the built-in defaults used by the extension:

```jsonc
{
	"minifier.codeSetting": {
		"javascript": {
			"minify": {
				"compress": false,
				"mangle": false,
				"format": {
					"beautify": false,
					"semicolons": true,
					"shorthand": true
				}
			},
		"beautify": {
			"indent_size": 4,
			"indent_char": "\t",
			"indent_level": 0,
			"brace_style": "collapse",
			"eol": "\n",
			"end_with_newline": true,
			"preserve_newlines": false,
			"indent_with_tabs": true,
			"max_preserve_newlines": 1,
			"jslint_happy": false,
			"space_after_named_function": false,
			"space_after_anon_function": false,
			"keep_array_indentation": false,
			"keep_function_indentation": false,
			"space_before_conditional": true,
			"break_chained_methods": false,
			"eval_code": false,
			"unescape_strings": false,
			"wrap_line_length": 0,
			"indent_empty_lines": false,
			"templating": [
				"auto"
			]
		}
	},
	"typescript": {
		"minify": {
			"comments": false,
			"jsescOption": {
				"minimal": true
			},
			"retainLines": false
		},
		"beautify": {
			"indentSize": 4,
			"tabSize": 4,
			"convertTabsToSpaces": false,
			"newLineCharacter": "\n",
			"insertSpaceAfterCommaDelimiter": true,
			"insertSpaceAfterSemicolonInForStatements": true,
			"insertSpaceBeforeAndAfterBinaryOperators": true,
			"insertSpaceAfterConstructor": false,
			"insertSpaceAfterKeywordsInControlFlowStatements": true,
			"insertSpaceAfterFunctionKeywordForAnonymousFunctions": false,
			"insertSpaceAfterOpeningAndBeforeClosingNonemptyParenthesis": false,
			"insertSpaceAfterOpeningAndBeforeClosingNonemptyBrackets": false,
			"insertSpaceAfterOpeningAndBeforeClosingNonemptyBraces": true,
			"insertSpaceAfterOpeningAndBeforeClosingTemplateStringBraces": false,
			"insertSpaceAfterTypeAssertion": false,
			"insertSpaceBeforeFunctionParenthesis": false,
			"placeOpenBraceOnNewLineForFunctions": false,
			"placeOpenBraceOnNewLineForControlBlocks": false,
			"semicolons": "ignore"
		}
	},
	"html": {
			"minify": {
				"collapseWhitespace": true,
				"removeComments": true,
				"removeEmptyAttributes": true,
				"removeTagWhitespace": false,
				"removeAttributeQuotes": false,
				"removeEmptyElements": false,
				"removeRedundantAttributes": false,
				"removeOptionalTags": false,
				"sortAttributes": false,
				"sortClassName": false,
				"keepClosingSlash": true,
				"processConditionalComments": false,
				"ignoreCustomComments": [],
				"ignoreCustomFragments": [],
				"caseSensitive": false,
				"html5": true
			},
			"beautify": {
				"indent_size": 4,
				"indent_char": "\t",
				"indent_with_tabs": true,
				"eol": "\n",
				"end_with_newline": true,
				"preserve_newlines": false,
				"max_preserve_newlines": 1,
				"wrap_line_length": 0,
				"indent_inner_html": true,
				"indent_empty_lines": false
			}
		},
		"css": {
			"minify": {
				"normalizeWhitespace": true,
				"discardComments": {
					"remove": false
				},
				"minifySelectors": false,
				"mergeLonghand": false,
				"reduceTransforms": false,
				"convertValues": false,
				"colormin": false,
				"mergeRules": true,
				"discardDuplicates": true,
				"uniqueSelectors": false,
				"minifyFontValues": false,
				"normalizeCharset": true
			},
			"beautify": {
				"indent_size": 4,
				"indent_char": "\t",
				"indent_with_tabs": true,
				"eol": "\n",
				"end_with_newline": true,
				"newline_between_rules": false,
				"selector_separator_newline": false,
				"preserve_newlines": false,
				"max_preserve_newlines": 1,
				"wrap_line_length": 0,
				"space_around_combinator": true,
				"space_around_selector_separator": true,
				"indent_empty_lines": false
			}
		},
		"json": {
			"minify": {
				"singleLineSpacing": false
			},
			"jsonLMinify": {
				"singleLineSpacing": true
			},
			"beautify": {
				"indent": "\t"
			}
		},
		"java": {
			"beautify": {
				"overrideJarPath": "",
				"javaPath": "java",
				"skipRemovingUnusedImports": false,
				"skipSortingImports": false,
				"aosp": true,
				"indentWithTabs": true
			}
		},
		"excludedDirs": [
			"node_modules",
			".git",
			"run",
			"build",
			"gradle",
			".gradle"
		],
		"excludedFiles": [],
		"disable": []
	}
}
```

---

# Example Custom Configuration

```jsonc
"minifier.codeSetting": {
	"javascript": {
		"minify": {
			"mangle": true,
			"compress": { "drop_console": true }
		},
		"beautify": { "indent_size": 2 }
	},
	"html": {
		"minify": { "collapseWhitespace": true }
	},
	"css": {
		"beautify": { "indent_size": 2 }
	},
	"json": {
		"minify": {
			"singleLineSpacing": false
		},
		"jsonLMinify": {
			"singleLineSpacing": true
		},
		"beautify": {
			"indent": 2
		}
	},
	"java": {
		"beautify": {
			"overrideJarPath": "",
			"javaPath": "java",
			"skipRemovingUnusedImports": false,
			"skipSortingImports": false,
			"aosp": true,
			"indentWithTabs": false
		}
	},
	"excludedDirs": [
		"node_modules",
		".git",
		"run",
		"build",
		"gradle",
		".gradle"
	],
	"excludedFiles": [
		"*.min.js",
		"package-lock.*",
		"generated?.json"
	],
	"disable": [
		"javascript.minify",
		"json.sortList",
		"*.sortListByKey"
	]
}
```

---

# Behavior Notes

* Invalid or non-object values are ignored safely.
* Missing sections are auto-filled using defaults.
* Settings take effect immediately.
* Exclusion patterns match basenames and are case-sensitive.
* `disable` entries use only the documented exact and wildcard forms.
* `jsonc` uses the `json` disable rules.
* Java beautification uses the bundled `google-java-format` jar when `java.beautify.overrideJarPath` is empty.
* Set `java.beautify.overrideJarPath` only when you want to force an external `google-java-format` jar.

---

# Summary

The configuration system allows you to:

* Customize formatting and minification per language
* Exclude files and directories with `*` and `?` patterns
* Disable actions globally or per language
* Control Mitify fallback behavior through disabled Minify and Beautify actions
* Override only what you need
* Rely on defaults for everything else

## Notes

- **JavaScript** minification uses [terser](https://github.com/terser/terser).
- **TypeScript** minification uses [@babel/parser](https://github.com/babel/babel/tree/main/packages/babel-parser) and [@babel/generator](https://github.com/babel/babel/tree/main/packages/babel-generator) (`compact:true, minified:true`), preserving all TypeScript syntax (generics, decorators, parameter properties, `as`, `satisfies`, `infer`, `namespace`, `enum`, etc.).
- **HTML** minification uses [html-minifier-terser](https://github.com/terser/html-minifier-terser).
- **CSS** minification uses [cssnano](https://github.com/cssnano/cssnano), [postcss](https://github.com/postcss/postcss), and [clean-css](https://github.com/jakubpawlowicz/clean-css).
- **JavaScript**, **HTML**, **CSS** beautification uses [js-beautify](https://github.com/beautify-web/js-beautify).
- **TypeScript** beautification first pretty-prints with [@babel/parser](https://github.com/babel/babel/tree/main/packages/babel-parser) + [@babel/generator](https://github.com/babel/babel/tree/main/packages/babel-generator) (`compact: false`) so minified or single-line code is split across lines, then applies the [typescript](https://github.com/microsoft/TypeScript) formatter (`LanguageService.getFormattingEditsForDocument`) for spacing — same engine as VS Code's built-in TypeScript formatter on the expanded source.
- **Java** beautification uses the bundled `google-java-format` jar and runs it through the configured Java executable.
- **JSON** parsing uses [jsonc-parser](https://github.com/microsoft/node-jsonc-parser).
- **JSON Lines** parsing uses [jsonparse](https://github.com/creationix/jsonparse).
- **JSON** and **JSON Lines** stringification uses native `JSON.stringify`.
- **JSON** operations remove comments on save.
- **UUID Generator** uses [crypto](https://nodejs.org/api/crypto.html)

## Extra

- All edit operations automatically save the document (unless untitled).
- Both `LF (\n)` and `CRLF (\r\n)` line endings are supported.
- Works with multiple selections.
- Java formatting requires a working Java runtime.
- Displays success, warning, and error messages consistently.
