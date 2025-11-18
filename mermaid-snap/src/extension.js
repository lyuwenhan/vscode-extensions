const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
async function savePng(context, pngBuffer) {
	const uri = await vscode.window.showSaveDialog({
		defaultUri: vscode.Uri.file("mermaid.png"),
		filters: {
			"PNG Image": ["png"]
		}
	});
	if (!uri) {
		return
	}
	await fs.promises.writeFile(uri.fsPath, pngBuffer);
	await vscode.commands.executeCommand("vscode.open", uri)
}
class LeftPanelWebviewProvider {
	constructor(context) {
		this.context = context;
		this.content = ""
	}
	refresh() {}
	resolveWebviewView(webviewView) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, "docs"))]
		};
		webviewView.webview.html = this.getHtml(webviewView);
		console.log(webviewView.webview.html);
		this.activateMessageListener(webviewView)
	}
	getHtml(webviewView) {
		const maincss = webviewView.webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "docs", "main.css")));
		const mainjs = webviewView.webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "docs", "main.js")));
		const scriptsjs = webviewView.webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "docs", "scripts.js")));
		return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport"content="width=device-width,initial-scale=1"><link rel="stylesheet"href="${maincss}"><script src="${scriptsjs}"></script></head><body><textarea id="notepad"placeholder="Type your mermaid here..."></textarea><div id="preview"><div id="prevtext"><h2>Preview:</h2><button id="exportsBt">Export</button></div><div id="previewEle"></div><div id="panel"><svg id="add"xmlns="http://www.w3.org/2000/svg"viewBox="0 0 5 5"><path d="M1 2L2 2L2 1L3 1L3 2L4 2L4 3L3 3L3 4L2 4L2 3L1 3Z"/></svg><svg id="equal"xmlns="http://www.w3.org/2000/svg"viewBox="0 0 5 5"><path d="M1 1L4 1L4 2L1 2ZM1 3L4 3L4 4L1 4Z"/></svg><svg id="minus"xmlns="http://www.w3.org/2000/svg"viewBox="0 0 5 5"><path d="M1 2L4 2L4 3L1 3Z"/></svg></div></div><script src="${mainjs}"></script></body></html>`
	}
	sendSetup(webviewView) {
		webviewView.webview.postMessage({
			type: "setup",
			content: this.content
		})
	}
	async showExports(content) {
		if (!content) {
			return
		}
		savePng(this.context, Buffer.from(content, "base64"))
	}
	activateMessageListener(webviewView) {
		webviewView.webview.onDidReceiveMessage(async message => {
			if (message.type == "edit") {
				this.content = message.content ?? ""
			} else if (message.type == "get") {
				this.sendSetup(webviewView)
			} else if (message.type == "export") {
				this.showExports(message.content ?? "")
			}
		})
	}
}

function activate(context) {
	context.subscriptions.push(vscode.window.registerWebviewViewProvider("mmdPreview", new LeftPanelWebviewProvider(context)))
}

function deactivate() {}
module.exports = {
	activate,
	deactivate
};
