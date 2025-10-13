const vscode = require("vscode");
const {
	randomUUID
} = require("crypto");
const terser = require("terser");
const beautify = require("js-beautify");
const jsonc = require("../node_modules/jsonc-parser/lib/esm/main.js");
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
async function minifyFile (content) {
	const e = await terser.minify(content, opts.minify);
	return e.code
}

function beautifyFile (content) {
	return beautify.js(content, opts.beautify)
}
async function mitifyFile (content) {
	return beautifyFile(await minifyFile(content))
}

function sortObject (value) {
	if (Array.isArray(value)) return value.map(sortObject);
	if (value && typeof value === "object") {
		const out = {};
		for (const k of Object.keys(value).sort()) {
			out[k] = sortObject(value[k])
		}
		return out
	}
	return value
}

function minifyJson (content) {
	return JSON.stringify(jsonc.parse(content))
}

function beautifyJson (content) {
	return JSON.stringify(jsonc.parse(content), null, "\t")
}

function sortJson (content) {
	return JSON.stringify(sortObject(jsonc.parse(content)), null, "\t")
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

function getDocInfo (doc) {
	return {
		lang: doc.languageId.replace(/^jsonc$/, "json"),
		content: doc.getText() ?? ""
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
		json: minifyJson
	},
	beautify: {
		javascript: beautifyFile,
		json: beautifyJson
	},
	mitify: {
		javascript: mitifyFile
	},
	sort: {
		json: sortJson
	}
};

function actionByLang (action, {
	content,
	lang
}) {
	const act = actions[action];
	if (!act) {
		throw new Error("Invalid action type.")
	}
	const actByLang = act[lang];
	if (!actByLang) {
		throw new Error("Invalid file type.")
	}
	if (content.trim() === "") {
		return ""
	}
	return actByLang(content)
}

function activate (context) {
	context.subscriptions.push(...[
		["minify", "Minified", "Minifier"],
		["beautify", "Beautified", "Beautifier"],
		["mitify", "Mitified", "Mitifier"],
		["sort", "Sorted", "Sorter"]
	].map(([action, sucMsg, ActionName]) => vscode.commands.registerCommand("minifier." + action, async uri => {
		try {
			const doc = await getDoc(uri);
			if (doc) {
				const info = getDocInfo(doc);
				let result = await actionByLang(action, info);
				if (info.content === result) {
					vscode.window.showWarningMessage(`${ActionName}: Nothing changed.`);
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
	const generateUuidCmd = vscode.commands.registerCommand("minifier.generateUuid", async () => {
		try {
			const editor = vscode.window.activeTextEditor;
			if (editor) {
				const uuid = randomUUID();
				await editor.edit(editBuilder => {
					for (const sel of editor.selections) {
						if (!sel.isEmpty) editBuilder.replace(sel, uuid);
						else editBuilder.insert(sel.start, uuid)
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
