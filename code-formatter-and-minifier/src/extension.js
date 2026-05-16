const vscode = require("vscode");
const {
	randomUUID
} = require("crypto");
const htmlMinify = require("html-minifier-terser").minify;
const postcss = require("postcss");
const cssnano = require("cssnano");
const cleanCSS = require("clean-css");
const terser = require("terser");
const beautify = require("js-beautify");
const JSONParse = require("jsonparse");
const ts = require("typescript");
const babelParser = require("@babel/parser");
const babelGenerate = require("@babel/generator").default;
const jsonc = require("./lib/jsonc-parser.js");
const oldOpts = require("./lib/default-setting.json");
let cleanCSSRunner = new cleanCSS({
	level: 2
});
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
		typescript: {
			minify: {
				...oldOpts.typescript.minify,
				...toJson(settings.typescript?.minify)
			},
			beautify: {
				...oldOpts.typescript.beautify,
				...toJson(settings.typescript?.beautify)
			}
		},
		html: {
			minify: {
				...oldOpts.html.minify,
				...toJson(settings.html?.minify),
				minifyCSS: async content => {
					try {
						return await minifyCss(content)
					} catch (e) {
						try {
							return cleanCSSRunner.minify(content).styles
						} catch {
							throw e
						}
					}
				},
				minifyJS: minifyJavascript
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
		if (typeof node === "number") {
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

function minifyHtml(content) {
	return htmlMinify(content, opts.html.minify)
}

function beautifyHtml(content) {
	return beautify.html(content, opts.html.beautify)
}
async function mitifyHtml(content) {
	return beautifyHtml(await minifyHtml(content))
}
async function minifyCss(content) {
	const result = await postcss([cssnano(opts.css.minify)]).process(content, {
		from: undefined
	});
	return result.css
}

function beautifyCss(content) {
	return beautify.css(content, opts.css.beautify)
}
async function mitifyCss(content) {
	return beautifyCss(await minifyCss(content))
}
async function minifyJavascript(content) {
	const result = await terser.minify(content, opts.javascript.minify);
	return result.code.replace(/\x1b/g, "\\x1b")
}

function beautifyJavascript(content) {
	return beautify.js(content, opts.javascript.beautify)
}

function mitifyJavascript(content) {
	return minifyJavascript(content).then(beautifyJavascript)
}

function createTsLanguageServiceHost(fileName, source) {
	const snapshot = ts.ScriptSnapshot.fromString(source);
	return {
		getScriptFileNames: () => [fileName],
		getScriptVersion: () => "0",
		getScriptSnapshot: f => f === fileName ? snapshot : undefined,
		getCurrentDirectory: () => "",
		getCompilationSettings: () => ({
			allowJs: true,
			target: ts.ScriptTarget.Latest,
			module: ts.ModuleKind.ESNext,
			jsx: ts.JsxEmit.Preserve
		}),
		getDefaultLibFileName: ts.getDefaultLibFilePath,
		readFile: () => undefined,
		fileExists: f => f === fileName
	}
}

function formatTypescriptDocument(content) {
	const fileName = "in-memory.ts";
	const ls = ts.createLanguageService(createTsLanguageServiceHost(fileName, content), ts.createDocumentRegistry());
	const edits = ls.getFormattingEditsForDocument(fileName, opts.typescript.beautify);
	edits.sort((a, b) => b.span.start - a.span.start);
	let out = content;
	for (const e of edits) {
		out = out.slice(0, e.span.start) + e.newText + out.slice(e.span.start + e.span.length)
	}
	return out
}

function beautifyTypescript(content) {
	const ast = babelParser.parse(content, {
		sourceType: "module",
		allowReturnOutsideFunction: true,
		allowAwaitOutsideFunction: true,
		errorRecovery: true,
		plugins: ["typescript", ["decorators", {
			decoratorsBeforeExport: true
		}], "classProperties", "classPrivateProperties", "classPrivateMethods", "explicitResourceManagement"]
	});
	const fmt = opts.typescript.beautify;
	const indentSize = Math.max(1, Number(fmt.indentSize) || 4);
	const indentStyle = fmt.convertTabsToSpaces ? " ".repeat(indentSize) : "\t";
	const pretty = babelGenerate(ast, {
		compact: false,
		comments: fmt.comments !== false,
		retainLines: false,
		jsescOption: {
			minimal: true,
			...toJson(fmt.jsescOption)
		},
		indent: {
			style: indentStyle
		}
	}).code;
	return formatTypescriptDocument(pretty)
}

function minifyTypescript(content) {
	const ast = babelParser.parse(content, {
		sourceType: "module",
		allowReturnOutsideFunction: true,
		allowAwaitOutsideFunction: true,
		errorRecovery: true,
		plugins: ["typescript", ["decorators", {
			decoratorsBeforeExport: true
		}], "classProperties", "classPrivateProperties", "classPrivateMethods", "explicitResourceManagement"]
	});
	const result = babelGenerate(ast, {
		...opts.typescript.minify,
		compact: true,
		minified: true
	});
	return result.code
}

function mitifyTypescript(content) {
	return beautifyTypescript(minifyTypescript(content))
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
	const items = {
		"Ascending order": 1,
		"Descending order": 2
	};
	const pickedItem = await vscode.window.showInformationMessage("Choose the order", {
		modal: true
	}, ...Object.keys(items));
	const picked = items[pickedItem] || 0;
	if (!picked) {
		throw new Error("Sorter: Operation canceled.")
	}
	return picked === 2
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
	let found;
	if (uri.scheme !== "untitled") {
		for (const doc of vscode.workspace.textDocuments.filter(d => d.uri.toString() === uri.toString())) {
			found ??= doc;
			if (uri.scheme === "file" && doc.isDirty) {
				await doc.save()
			}
		}
	}
	try {
		found ??= await vscode.workspace.openTextDocument(uri)
	} catch (e) {
		console.error(e)
	}
	return found
}
async function expandUriToFileUris(uri) {
	try {
		const stat = await vscode.workspace.fs.stat(uri);
		if ((stat.type & vscode.FileType.File) !== 0) {
			return [uri]
		}
		if ((stat.type & vscode.FileType.Directory) !== 0) {
			const out = [];
			const entries = await vscode.workspace.fs.readDirectory(uri);
			for (const [name] of entries) {
				const child = vscode.Uri.joinPath(uri, name);
				out.push(...await expandUriToFileUris(child))
			}
			return out
		}
	} catch (e) {
		console.error(e)
	}
	return []
}
async function uniqueFileUrisFromUris(uris) {
	const seen = new Set;
	const result = [];
	for (const u of uris) {
		for (const fileUri of await expandUriToFileUris(u)) {
			const key = fileUri.toString();
			if (!seen.has(key)) {
				seen.add(key);
				result.push(fileUri)
			}
		}
	}
	return result
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
			javascript: minifyJavascript,
			typescript: minifyTypescript,
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
			javascript: beautifyJavascript,
			typescript: beautifyTypescript,
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
			javascript: mitifyJavascript,
			typescript: mitifyTypescript,
			json: beautifyJson,
			jsonl: beautifyJsonL,
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
	if (content === "") {
		return ""
	}
	oper ??= e => e;
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
		context.subscriptions.push(vscode.commands.registerCommand("minifier." + action, async (uri, selectedUris) => {
			try {
				let uris = await uniqueFileUrisFromUris(Array.isArray(selectedUris) && selectedUris.length > 0 ? selectedUris : uri ? [uri] : []);
				const docs = (await Promise.all(uris.map(getDoc))).filter(Boolean);
				if (!docs.length) {
					if (selectedUris.length || uri) {
						vscode.window.showWarningMessage(actionName + ": Nothing changed.")
					} else {
						vscode.window.showErrorMessage(actionName + ": No file selected.")
					}
					return
				}
				let NC = false,
					suc = false;
				while (uris.length > 0) {
					const batch = uris.splice(0, 100);
					await Promise.all(batch.map(async uri => {
						const doc = await getDoc(uri);
						if (!doc) {
							return
						}
						const {
							lang,
							content
						} = getDocInfo(doc);
						const actByLang = opers[lang];
						if (!actByLang) {
							return
						}
						let result = await runAction(actByLang, content) + "\n";
						if (content === result) {
							NC = true;
							return
						}
						await saveDocContent(doc, result);
						suc = true
					}))
				}
				if (suc) {
					vscode.window.showInformationMessage(sucMsg + " successfully.")
				} else if (NC) {
					vscode.window.showWarningMessage(actionName + ": Nothing changed.")
				} else {
					vscode.window.showErrorMessage(actionName + ": Invalid file type.")
				}
			} catch (e) {
				vscode.window.showErrorMessage(e.message || String(e));
				console.error(e);
				console.error(e.stack)
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
				vscode.window.showErrorMessage(e.message || String(e));
				console.error(e);
				console.error(e.stack)
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
			vscode.window.showErrorMessage(e.message || String(e));
			console.error(e);
			console.error(e.stack)
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
				vscode.window.showErrorMessage(e.message || String(e));
				console.error(e);
				console.error(e.stack)
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
