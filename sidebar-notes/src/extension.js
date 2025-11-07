const vscode = require("vscode");
class LeftPanelWebviewProvider {
	constructor () {}
	refresh () {}
	resolveWebviewView (webviewView) {
		webviewView.webview.html = this.getHtml();
		this.activateMessageListener()
	}
	activateMessageListener () {}
	getHtml () {
		return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body,html{margin:0;padding:0;height:100%}*,body,html{font-family:Consolas,Courier,monospace}#notepad{position:fixed;top:0;left:0;width:calc(100% - 22px);height:calc(100% - 22px);padding:10px;font-size:16px;border:none;outline:0;resize:none;background-color:var(--vscode-input-background);color:var(--vscode-input-foreground)}#notepad:focus{border:1px solid var(--vscode-focusBorder)}#notepad::placeholder{color:var(--vscode-input-placeholderForeground,#888)}</style></head><body><textarea id="notepad" placeholder="Write your notes here..."></textarea></body></html>'
	}
}

function activate (context) {
	context.subscriptions.push(vscode.window.registerWebviewViewProvider("notesView", new LeftPanelWebviewProvider))
}

function deactivate () {}
module.exports = {
	activate,
	deactivate
};
