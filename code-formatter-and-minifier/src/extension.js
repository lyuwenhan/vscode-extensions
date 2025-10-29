const vscode = require("vscode");
const {
	randomUUID
} = require("crypto");
const terser = require("terser");
const beautify = require("js-beautify");
const JSONParse = require("jsonparse");
const jsonc = require("jsonc-parser/lib/esm/main.js");
const {
	error
} = require("console");
const opts = {
	minify: {
		compress: false,
		mangle: false,
		format: {
			beautify: false,
			semicolons: true,
			shorthand: true
		}
	},
	beautify: {
		indent_size: 4,
		indent_char: "\t",
		indent_level: 0,
		brace_style: "collapse",
		eol: "\n",
		end_with_newline: true,
		preserve_newlines: false,
		indent_with_tabs: true,
		max_preserve_newlines: 1,
		jslint_happy: false,
		space_after_named_function: true,
		space_after_anon_function: true,
		keep_array_indentation: false,
		keep_function_indentation: false,
		space_before_conditional: true,
		break_chained_methods: false,
		eval_code: false,
		unescape_strings: false,
		wrap_line_length: 0,
		indent_empty_lines: false,
		templating: ["auto"]
	}
};

function jsonStringify1L (data) {
	var seen = [];
	return function stringify (node) {
		if (node && node.toJSON && typeof node.toJSON === "function") {
			node = node.toJSON()
		}
		if (node === undefined) {
			return
		}
		if (typeof node == "number") {
			return isFinite(node) ? "" + node : "null"
		}
		if (typeof node !== "object") {
			return JSON.stringify(node)
		}
		var i, out;
		if (Array.isArray(node)) {
			out = "[";
			for (i = 0; i < node.length; i++) {
				if (i) {
					out += ", "
				}
				out += stringify(node[i]) || "null"
			}
			return out + "]"
		}
		if (node === null) {
			return "null"
		}
		if (seen.indexOf(node) !== -1) {
			throw new TypeError("Converting circular structure to JSON")
		}
		var seenIndex = seen.push(node) - 1;
		var keys = Object.keys(node);
		out = "";
		for (i = 0; i < keys.length; i++) {
			var key = keys[i];
			var value = stringify(node[key]);
			if (!value) {
				continue
			}
			if (out) {
				out += ", "
			}
			out += JSON.stringify(key) + ": " + value
		}
		seen.splice(seenIndex, 1);
		return "{" + out + "}"
	}(data)
}

function minifyFile (content) {
	return terser.minify_sync(content, opts.minify).code
}

function beautifyFile (content) {
	return beautify.js(content, opts.beautify)
}

function mitifyFile (content) {
	return beautifyFile(minifyFile(content))
}

function sortObject (value) {
	if (Array.isArray(value)) {
		return value.map(sortObject)
	}
	if (value && typeof value === "object") {
		const out = {};
		for (const k of Object.keys(value).sort()) {
			out[k] = sortObject(value[k])
		}
		return out
	}
	return value
}

function getKey (a, key) {
	return JSON.stringify(a?.[key])
}

function sortCompare (a, b) {
	return a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0
}

function sortArray (value, key) {
	if (Array.isArray(value)) {
		return value.map(e => [e, JSON.stringify(e)]).sort(sortCompare).map(e => e[0]).map(v => sortArray(v, key))
	}
	if (value && typeof value === "object") {
		const out = {};
		for (const k of Object.keys(value)) {
			out[k] = sortArray(value[k], key)
		}
		return out
	}
	return value
}

function sortArrayByKey (value, key) {
	if (Array.isArray(value)) {
		return value.map(e => [e, getKey(e, key)]).sort(sortCompare).map(e => e[0]).map(v => sortArrayByKey(v, key))
	}
	if (value && typeof value === "object") {
		const out = {};
		for (const k of Object.keys(value)) {
			out[k] = sortArrayByKey(value[k], key)
		}
		return out
	}
	return value
}

function parseJsonL (text) {
	const parser = new JSONParse;
	const result = [];
	parser.onValue = function (value) {
		if (this.stack.length === 0) {
			result.push(value)
		}
	};
	parser.write(text);
	return result
}

function jsonStringify (json) {
	return JSON.stringify(json, null, "\t")
}

function minifyJson (content) {
	return JSON.stringify(jsonc.parse(content))
}

function beautifyJson (content) {
	return jsonStringify(jsonc.parse(content))
}

function sortJson (content) {
	return jsonStringify(sortObject(jsonc.parse(content)))
}

function sortListJson (content) {
	return jsonStringify(sortArray(jsonc.parse(content)))
}
async function sortListByKeyJson (content) {
	const key = await vscode.window.showInputBox({
		prompt: "Enter the key name to sort by",
		ignoreFocusOut: true
	});
	if (!key) {
		throw new error("Sorter: Operation canceled.")
	}
	return jsonStringify(sortArrayByKey(jsonc.parse(content), key))
}

function minifyJsonL (content) {
	return parseJsonL(content).map(jsonStringify1L).join("\n")
}

function beautifyJsonL (content) {
	return parseJsonL(content).map(jsonStringify).join("\n")
}
async function getDoc (uri) {
	if (!uri || !uri.fsPath) {
		return vscode.window.activeTextEditor?.document
	}
	const filePath = uri.fsPath;
	let found;
	if (uri.scheme !== "untitled") {
		for (const doc of vscode.workspace.textDocuments.filter(d => d.uri.fsPath === filePath)) {
			found ??= doc;
			if (doc.isDirty) {
				await doc.save()
			}
		}
	}
	return found ?? await vscode.workspace.openTextDocument(uri)
}

function normEol (content) {
	return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function getDocInfo (doc) {
	return {
		lang: doc.languageId.replace(/^jsonc$/, "json"),
		content: normEol(doc.getText() ?? "")
	}
}
async function saveDocContent (doc, content) {
	const edit = new vscode.WorkspaceEdit;
	edit.replace(doc.uri, new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), content);
	await vscode.workspace.applyEdit(edit);
	if (!doc.isUntitled) {
		await doc.save()
	}
}
const actions = {
	minify: {
		javascript: minifyFile,
		json: minifyJson,
		jsonl: minifyJsonL
	},
	beautify: {
		javascript: beautifyFile,
		json: beautifyJson,
		jsonl: beautifyJsonL
	},
	mitify: {
		javascript: mitifyFile
	},
	sort: {
		json: sortJson
	},
	sortList: {
		json: sortListJson
	},
	sortListByKey: {
		json: sortListByKeyJson
	}
};
async function actionByLang (action, {
	content,
	lang
}) {
	const act = actions[action];
	if (!act) {
		throw new Error("Invalid action type.")
	}
	const actByLang = act[lang];
	if (!actByLang) {
		throw new Error("Invalid file type." + lang)
	}
	content = content.trim();
	if (content === "") {
		return ""
	}
	return (await actByLang(content)).trim()
}

function activate (context) {
	const opers = [
		["minify", "Minified", "Minifier"],
		["beautify", "Beautified", "Beautifier"],
		["mitify", "Mitified", "Mitifier"],
		["sort", "Sorted", "Sorter"],
		["sortList", "Sorted", "Sorter"],
		["sortListByKey", "Sorted", "Sorter"]
	];
	context.subscriptions.push(...opers.map(([action, sucMsg, ActionName]) => vscode.commands.registerCommand("minifier." + action, async uri => {
		console.log("minifier." + action);
		try {
			const doc = await getDoc(uri);
			if (doc) {
				const info = getDocInfo(doc);
				let result = await actionByLang(action, info) + "\n";
				if (info.content === result) {
					vscode.window.showWarningMessage(ActionName + ": Nothing changed.");
					return
				}
				await saveDocContent(doc, result);
				vscode.window.showInformationMessage(sucMsg + " successfully.")
			} else {
				throw new Error(ActionName + ": No file selected.")
			}
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e))
		}
	})));
	context.subscriptions.push(...opers.map(([action, sucMsg, ActionName]) => vscode.commands.registerCommand("minifier." + action + "Sel", async () => {
		try {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const sels = editor.selections.filter(e => !e.isEmpty);
				if (!sels.length) {
					vscode.window.showWarningMessage(ActionName + ": No text selected.");
					return
				}
				const replacements = [];
				const {
					lang
				} = getDocInfo(editor.document);
				for (const sel of sels) {
					const content = editor.document.getText(sel);
					const result = await actionByLang(action, {
						content,
						lang
					});
					if (content !== result) {
						replacements.push({
							sel,
							result
						})
					}
				}
				if (replacements.length) {
					await editor.edit(editBuilder => {
						for (const item of replacements) {
							editBuilder.replace(item.sel, item.result)
						}
					})
				} else {
					vscode.window.showWarningMessage(ActionName + ": Nothing changed.");
					return
				}
				vscode.window.showInformationMessage(sucMsg + " successfully.")
			} else {
				throw new Error(ActionName + ": No file selected.")
			}
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e))
		}
	})));
	const generateUuidCmd = vscode.commands.registerCommand("minifier.generateUuid", async () => {
		try {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const uuid = randomUUID();
				await editor.edit(editBuilder => {
					for (const sel of editor.selections) {
						if (!sel.isEmpty) {
							editBuilder.replace(sel, uuid)
						} else {
							editBuilder.insert(sel.start, uuid)
						}
					}
				});
				vscode.window.showInformationMessage("UUID Generator: Generated successfully.")
			} else {
				vscode.window.showErrorMessage("No active editor.")
			}
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e))
		}
	});
	context.subscriptions.push(generateUuidCmd)
}

function deactivate () {}
module.exports = {
	activate,
	deactivate
};
