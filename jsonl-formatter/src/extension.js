const vscode = require("vscode");
const jsonc = require("../node_modules/jsonc-parser/lib/esm/main.js");

function beautifyJson (content) {
	if (content.trim() === "") {
		return ""
	}
	return JSON.stringify(jsonc.parse(content), null, "\t")
}

function getDocInfo (doc) {
	return {
		lang: doc.languageId.replace(/^jsonc$/, "json"),
		content: doc.getText() ?? ""
	}
}

function activate (context) {
	context.subscriptions.push(vscode.commands.registerCommand("jsonl-formatter.beautify", async () => {
		try {
			const doc = vscode.window.activeTextEditor?.document;
			if (doc) {
				const info = getDocInfo(doc);
				if (info.lang !== "jsonl") {
					vscode.window.showInformationMessage(info.lang);
					throw new Error("Invalid file type.")
				}
				let result = info.content.split("\n").map(beautifyJson).filter(e => e !== "").join("\n") + "\n";
				const edit = new vscode.WorkspaceEdit;
				edit.replace(doc.uri, new vscode.Range(doc.positionAt(0), doc.positionAt(doc.getText().length)), result);
				await vscode.workspace.applyEdit(edit);
				vscode.window.showInformationMessage("Beautified successfully.")
			} else {
				throw new Error("Beautifier: No file selected.")
			}
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e))
		}
	}))
}

function deactivate () {}
module.exports = {
	activate,
	deactivate
};
