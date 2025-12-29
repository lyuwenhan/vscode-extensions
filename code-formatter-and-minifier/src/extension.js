const vscode = require("vscode");
const {
	randomUUID
} = require("crypto");
const htmlMinify = require("html-minifier-terser").minify;
const postcss = require("postcss");
const cssnano = require("cssnano");
const terser = require("terser");
const beautify = require("js-beautify");
const JSONParse = require("jsonparse");
const jsonc = require("./lib/jsonc-parser.js");
const oldOpts = {
	javascript: {
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
			space_after_named_function: false,
			space_after_anon_function: false,
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
	},
	html: {
		minify: {
			collapseWhitespace: true,
			removeComments: true,
			removeEmptyAttributes: true,
			removeTagWhitespace: false,
			minifyCSS: minifyCss,
			minifyJS: minifyFile,
			removeAttributeQuotes: false,
			removeEmptyElements: false,
			removeRedundantAttributes: false,
			removeOptionalTags: false,
			sortAttributes: false,
			sortClassName: false,
			keepClosingSlash: true,
			processConditionalComments: false,
			ignoreCustomComments: [],
			ignoreCustomFragments: [],
			caseSensitive: false,
			html5: true
		},
		beautify: {
			indent_size: 4,
			indent_char: "\t",
			indent_with_tabs: true,
			eol: "\n",
			end_with_newline: true,
			preserve_newlines: false,
			max_preserve_newlines: 1,
			wrap_line_length: 0,
			indent_inner_html: true,
			indent_empty_lines: false
		}
	},
	css: {
		minify: {
			preset: ["default", {
				mergeRules: false,
				mergeLonghand: false,
				discardDuplicates: false,
				discardUnused: false,
				reduceIdents: false,
				normalizeUnicode: false,
				normalizeUrl: false,
				colormin: false,
				minifySelectors: false,
				minifyParams: false,
				discardComments: true,
				normalizeWhitespace: true
			}]
		},
		beautify: {
			indent_size: 4,
			indent_char: "\t",
			indent_with_tabs: true,
			eol: "\n",
			end_with_newline: true,
			newline_between_rules: false,
			selector_separator_newline: false,
			preserve_newlines: false,
			max_preserve_newlines: 1,
			wrap_line_length: 0,
			space_around_combinator: true,
			space_around_selector_separator: true,
			indent_empty_lines: false
		}
	},
	json: {
		minify: {
			singleLineSpacing: false
		},
		jsonLMinify: {
			singleLineSpacing: true
		},
		beautify: {
			indent: "\t"
		}
	}
};
let opts = oldOpts;

function toJson(input) {
	return Object.prototype.toString.call(input) === "[object Object]" ? input : {}
}

function readSettings() {
	const config = vscode.workspace.getConfiguration("minifier");
	const settings = toJson(config.get("codeSetting"));
	const newOpts = {
		javascript: {
			minify: {
				...oldOpts.javascript.minify,
				...toJson(settings.javascript?.minify)
			},
			beautify: {
				...oldOpts.javascript.beautify,
				...toJson(settings.javascript?.beautify)
			}
		},
		html: {
			minify: {
				...oldOpts.html.minify,
				...toJson(settings.html?.minify)
			},
			beautify: {
				...oldOpts.html.beautify,
				...toJson(settings.html?.beautify)
			}
		},
		css: {
			minify: {
				...oldOpts.css.minify,
				...toJson(settings.css?.minify)
			},
			beautify: {
				...oldOpts.css.beautify,
				...toJson(settings.css?.beautify)
			}
		},
		json: {
			minify: {
				...oldOpts.json.minify,
				...toJson(settings.json?.minify)
			},
			jsonLMinify: {
				...oldOpts.json.jsonLMinify,
				...toJson(settings.json?.jsonLMinify)
			},
			beautify: {
				...oldOpts.json.beautify,
				...toJson(settings.json?.beautify)
			}
		}
	};
	opts = newOpts
}

function jsonStringify1L(data, usingSpace) {
	const spaceIf = usingSpace ? " " : "";
	var seen = [];
	return function stringify(node) {
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
					out += "," + spaceIf
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
				out += "," + spaceIf
			}
			out += JSON.stringify(key) + ":" + spaceIf + value
		}
		seen.splice(seenIndex, 1);
		return "{" + out + "}"
	}(data)
}
async function minifyHtml(content) {
	return await htmlMinify(content, opts.html.minify)
}

function beautifyHtml(content) {
	return beautify.html(content, opts.html.beautify)
}
async function mitifyHtml(content) {
	const min = await minifyHtml(content);
	return beautifyHtml(min)
}

function minifyCss(content) {
	return postcss([cssnano(opts.css.minify)]).process(content, {
		from: undefined
	}).then(e => e.css)
}

function beautifyCss(content) {
	return beautify.css(content, opts.css.beautify)
}
async function mitifyCss(content) {
	return beautifyCss(await minifyCss(content))
}

function minifyFile(content) {
	return terser.minify(content, opts.javascript.minify).then(e => e.code)
}

function beautifyFile(content) {
	return beautify.js(content, opts.javascript.beautify)
}

function mitifyFile(content) {
	return minifyFile(content).then(beautifyFile)
}

function sortCompare2(a, b, isD) {
	return (a < b ? -1 : a > b ? 1 : 0) * (isD ? -1 : 1)
}

function sortObject(value, isD) {
	if (Array.isArray(value)) {
		return value.map(e => sortObject(e, isD))
	}
	if (value && typeof value === "object") {
		const out = {};
		for (const k of Object.keys(value).sort((e, e2) => sortCompare2(e, e2, isD))) {
			out[k] = sortObject(value[k], isD)
		}
		return out
	}
	return value
}

function getKey(a, key) {
	return JSON.stringify(a?.[key])
}

function sortCompare(a, b, isD) {
	return (a[1] < b[1] ? -1 : a[1] > b[1] ? 1 : 0) * (isD ? -1 : 1)
}

function sortArray(value, isD) {
	if (Array.isArray(value)) {
		return value.map(e => [e, JSON.stringify(e)]).sort((e, e2) => sortCompare(e, e2, isD)).map(e => e[0]).map(v => sortArray(v, isD))
	}
	if (value && typeof value === "object") {
		const out = {};
		for (const k of Object.keys(value)) {
			out[k] = sortArray(value[k], isD)
		}
		return out
	}
	return value
}

function sortArrayByKey(value, key, isD) {
	if (Array.isArray(value)) {
		return value.map(e => [e, getKey(e, key)]).sort((e, e2) => sortCompare(e, e2, isD)).map(e => e[0]).map(v => sortArrayByKey(v, key, isD))
	}
	if (value && typeof value === "object") {
		const out = {};
		for (const k of Object.keys(value)) {
			out[k] = sortArrayByKey(value[k], key, isD)
		}
		return out
	}
	return value
}
async function getArrayKey() {
	const key = await vscode.window.showInputBox({
		prompt: "Enter the key name to sort by",
		ignoreFocusOut: true
	});
	if (!key) {
		throw new Error("Sorter: Operation canceled.")
	}
	return key
}
async function getAD() {
	const items = [{
		label: "Ascending order",
		dec: false
	}, {
		label: "Descending order",
		dec: true
	}];
	const picked = await vscode.window.showQuickPick(items, {
		placeHolder: "Choose the order",
		ignoreFocusOut: true
	});
	if (!picked) {
		throw new Error("Sorter: Operation canceled.")
	}
	return picked.dec
}

function parseJsonL(text) {
	const parser = new JSONParse;
	const result = [];
	parser.onValue = function(value) {
		if (this.stack.length === 0) {
			result.push(value)
		}
	};
	parser.write(text);
	return result
}

function jsonStringify(json) {
	return JSON.stringify(json, null, opts.json.beautify.indent)
}

function minifyJson(content) {
	return jsonStringify1L(jsonc.parse(content), opts.json.minify.singleLineSpacing)
}

function beautifyJson(content) {
	return jsonStringify(jsonc.parse(content))
}
async function sortJson(content) {
	const isD = await getAD();
	return jsonStringify(sortObject(jsonc.parse(content), isD))
}
async function sortListJson(content) {
	const isD = await getAD();
	return jsonStringify(sortArray(jsonc.parse(content), isD))
}
async function sortListByKeyJson(content) {
	const isD = await getAD();
	const key = await getArrayKey();
	return jsonStringify(sortArrayByKey(jsonc.parse(content), key, isD))
}

function minifyJsonL(content) {
	return parseJsonL(content).map(e => jsonStringify1L(e, opts.json.jsonLMinify.singleLineSpacing)).join("\n")
}

function beautifyJsonL(content) {
	return parseJsonL(content).map(jsonStringify).join("\n")
}
async function sortJsonL(content) {
	const isD = await getAD();
	return parseJsonL(content).map(e => sortObject(e, isD)).map(jsonStringify).join("\n")
}
async function sortListJsonL(content) {
	const isD = await getAD();
	return sortArray(parseJsonL(content), isD).map(jsonStringify).join("\n")
}
async function sortListByKeyJsonL(content) {
	const key = await getArrayKey();
	const isD = await getAD();
	return sortArrayByKey(parseJsonL(content), key, isD).map(jsonStringify).join("\n")
}
async function getDoc(uri) {
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

function normEol(content) {
	return content.replace(/\r\n/g, "\n").replace(/\r/g, "\n")
}

function getDocInfo(doc) {
	return {
		lang: doc.languageId.replace(/^jsonc$/, "json"),
		content: normEol(doc.getText() ?? "")
	}
}
async function saveDocContent(doc, content) {
	const edit = new vscode.WorkspaceEdit;
	edit.replace(doc.uri, new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), content);
	await vscode.workspace.applyEdit(edit);
	if (!doc.isUntitled) {
		await doc.save()
	}
}
const actions = {
	minify: {
		sucMsg: "Minified",
		actionName: "Minifier",
		opers: {
			javascript: minifyFile,
			json: minifyJson,
			jsonl: minifyJsonL,
			html: minifyHtml,
			css: minifyCss
		}
	},
	beautify: {
		sucMsg: "Beautified",
		actionName: "Beautifier",
		opers: {
			javascript: beautifyFile,
			json: beautifyJson,
			jsonl: beautifyJsonL,
			html: beautifyHtml,
			css: beautifyCss
		}
	},
	mitify: {
		sucMsg: "Mitified",
		actionName: "Mitifier",
		opers: {
			javascript: mitifyFile,
			html: mitifyHtml,
			css: mitifyCss
		}
	},
	sort: {
		sucMsg: "Sorted",
		actionName: "Sorter",
		opers: {
			json: sortJson,
			jsonl: sortJsonL
		}
	},
	sortList: {
		sucMsg: "Sorted",
		actionName: "Sorter",
		opers: {
			json: sortListJson,
			jsonl: sortListJsonL
		}
	},
	sortListByKey: {
		sucMsg: "Sorted",
		actionName: "Sorter",
		opers: {
			json: sortListByKeyJson,
			jsonl: sortListByKeyJsonL
		}
	}
};
async function runAction(oper, content) {
	content = content.trim();
	oper ??= e => e;
	if (content === "") {
		return ""
	}
	readSettings();
	return (await oper(content)).trim()
}

function activate(context) {
	Object.entries(actions).forEach(([action, {
		sucMsg,
		actionName,
		opers
	}]) => {
		if (!opers) {
			return
		}
		context.subscriptions.push(vscode.commands.registerCommand("minifier." + action, async uri => {
			try {
				const doc = await getDoc(uri);
				if (!doc) {
					throw new Error(actionName + ": No file selected.")
				}
				const {
					lang,
					content
				} = getDocInfo(doc);
				const actByLang = opers[lang];
				if (!actByLang) {
					vscode.window.showErrorMessage("Invalid file type.");
					return
				}
				let result = await runAction(actByLang, content) + "\n";
				if (content === result) {
					vscode.window.showWarningMessage(actionName + ": Nothing changed.");
					return
				}
				await saveDocContent(doc, result);
				vscode.window.showInformationMessage(sucMsg + " successfully.")
			} catch (e) {
				vscode.window.showErrorMessage(e.message || String(e))
				console.error(e);
				console.error(e.stack);
			}
		}), vscode.commands.registerCommand("minifier." + action + "Sel", async () => {
			try {
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					vscode.window.showErrorMessage(actionName + ": No file selected.");
					return
				}
				const sels = editor.selections.filter(e => !e.isEmpty);
				if (!sels.length) {
					vscode.window.showWarningMessage(actionName + ": No text selected.");
					return
				}
				const replacements = [];
				const {
					lang
				} = getDocInfo(editor.document);
				const actByLang = opers[lang];
				if (!actByLang) {
					vscode.window.showErrorMessage("Invalid file type.");
					return
				}
				for (const sel of sels) {
					const content = editor.document.getText(sel);
					let result = await runAction(actByLang, content);
					if (content !== result) {
						replacements.push({
							sel,
							result
						})
					}
				}
				if (!replacements.length) {
					vscode.window.showWarningMessage(actionName + ": Nothing changed.");
					return
				}
				await editor.edit(editBuilder => {
					for (const item of replacements) {
						editBuilder.replace(item.sel, item.result)
					}
				});
				vscode.window.showInformationMessage(sucMsg + " successfully.")
			} catch (e) {
				vscode.window.showErrorMessage(e.message || String(e))
				console.error(e);
				console.error(e.stack);
			}
		}))
	});
	const generateUuidCmd = vscode.commands.registerCommand("minifier.generateUuid", async () => {
		try {
			const editor = vscode.window.activeTextEditor;
			if (!editor) {
				vscode.window.showErrorMessage("UUID Generator: No active editor.");
				return
			}
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
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e))
			console.error(e);
			console.error(e.stack);
		}
	});
	[{
		addText: "Sel",
		runAct: async (editor, actionName, actByLang) => {
			const sels = editor.selections.filter(e => !e.isEmpty);
			if (!sels.length) {
				vscode.window.showWarningMessage(actionName + ": No text selected.");
				return
			}
			const replacements = [];
			for (const sel of sels) {
				const content = editor.document.getText(sel);
				let result = await runAction(actByLang, content);
				if (content !== result) {
					replacements.push({
						sel,
						result
					})
				}
			}
			if (!replacements.length) {
				vscode.window.showWarningMessage(actionName + ": Nothing changed.");
				return
			}
			await editor.edit(editBuilder => {
				for (const item of replacements) {
					editBuilder.replace(item.sel, item.result)
				}
			})
		}
	}, {
		addText: "",
		runAct: async (editor, actionName, actByLang) => {
			const doc = editor.document;
			const {
				content
			} = getDocInfo(doc);
			let result = await runAction(actByLang, content) + "\n";
			if (content === result) {
				vscode.window.showWarningMessage(actionName + ": Nothing changed.");
				return
			}
			await saveDocContent(doc, result)
		}
	}].map(({
		addText,
		runAct
	}) => {
		vscode.commands.registerCommand("minifier.runAs" + addText, async () => {
			try {
				const items = Object.keys(actions).map(action => ({
					label: action
				}));
				const picked = await vscode.window.showQuickPick(items, {
					placeHolder: "Choose an action",
					ignoreFocusOut: true
				});
				const actionName = picked?.label;
				const action = actions?.[actionName];
				if (!picked || !actionName || !action) {
					vscode.window.showWarningMessage("Operation canceled.");
					return
				}
				const items2 = Object.keys(action.opers).map(action => ({
					label: action
				}));
				const picked2 = await vscode.window.showQuickPick(items2, {
					placeHolder: "Choose the language for " + actionName,
					ignoreFocusOut: true
				});
				const lang = picked2?.label;
				const actByLang = action.opers[lang];
				if (!picked2 || !lang || !actByLang) {
					vscode.window.showWarningMessage("Operation canceled.");
					return
				}
				vscode.window.showInformationMessage(`Running ${actionName} as ${lang}.`);
				const editor = vscode.window.activeTextEditor;
				if (!editor) {
					throw new Error(action.actionName + ": No file selected.")
				}
				await runAct(editor, action.actionName, actByLang);
				vscode.window.showInformationMessage(action.sucMsg + " successfully.")
			} catch (e) {
				vscode.window.showErrorMessage(e.message || String(e))
				console.error(e);
				console.error(e.stack);
			}
		})
	});
	context.subscriptions.push(generateUuidCmd)
}

function deactivate() {}
module.exports = {
	activate,
	deactivate
};
