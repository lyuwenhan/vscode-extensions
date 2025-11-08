const vscode = require("vscode");
const path = require("path");
class LeftPanelWebviewProvider {
	constructor (context) {
		this.context = context;
		this.content = "";
		this.fontSize = 16
	}
	refresh () {}
	resolveWebviewView (webviewView) {
		webviewView.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, "docs"))],
			retainContextWhenHidden: true
		};
		webviewView.webview.html = this.getHtml(webviewView);
		this.activateMessageListener(webviewView)
	}
	getHtml (webviewView) {
		const scriptUri = webviewView.webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "docs", "main.js")));
		const styleUri = webviewView.webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "docs", "main.css")));
		return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${styleUri}"></head><body><textarea id="notepad" placeholder="Write your notes here..."></textarea><div id="panel"><svg id="add" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 5"><path d="M1 2L2 2L2 1L3 1L3 2L4 2L4 3L3 3L3 4L2 4L2 3L1 3Z"/></svg><svg id="equal" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 5"><path d="M1 1L4 1L4 2L1 2ZM1 3L4 3L4 4L1 4Z"/></svg><svg id="minus" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 5 5"><path d="M1 2L4 2L4 3L1 3Z"/></svg></div><script src="${scriptUri}"><\/script></body></html>`
	}
	sendSetup (webviewView) {
		webviewView.webview.postMessage({
			type: "setup",
			content: this.content,
			fontSize: this.fontSize
		})
	}
	activateMessageListener (webviewView) {
		webviewView.webview.onDidReceiveMessage(async message => {
			if (message.type == "edit") {
				this.content = message.content ?? "";
				this.fontSize = +(message.fontSize ?? "16")
			} else if (message.type == "get") {
				this.sendSetup(webviewView)
			}
		})
	}
}

function activate (context) {
	context.subscriptions.push(vscode.window.registerWebviewViewProvider("notesView", new LeftPanelWebviewProvider(context)))
}

function deactivate () {}
module.exports = {
	activate,
	deactivate
};
