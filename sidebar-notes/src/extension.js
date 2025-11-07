const vscode = require("vscode");
class LeftPanelWebviewProvider {
	constructor (context) {
		this.context = context;
		this.content = "";
		this.fontSize = 16
	}
	refresh (webviewView) {}
	resolveWebviewView (webviewView) {
		webviewView.webview.options = {
			enableScripts: true,
			retainContextWhenHidden: true
		};
		webviewView.webview.html = this.getHtml();
		this.activateMessageListener(webviewView);
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
			}else if (message.type == "get") {
				this.sendSetup(webviewView);
			}
		})
	}
	getHtml () {
		return '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>body,html{margin:0;padding:0;height:100%}*,body,html{font-family:Consolas,Courier,monospace}#notepad{position:fixed;top:0;left:0;width:calc(100% - 22px);height:calc(100% - 22px);padding:10px;font-size:16px;border:none;outline:0;resize:none;background-color:var(--vscode-input-background);color:var(--vscode-input-foreground)}#notepad:focus{border:1px solid var(--vscode-focusBorder)}#notepad::placeholder{color:var(--vscode-input-placeholderForeground,#888)}</style></head><body><textarea id="notepad" placeholder="Write your notes here..."></textarea><script>let fontSize=16;const vscode=acquireVsCodeApi(),textarea=document.getElementById("notepad");vscode.postMessage({type:"get"});function sendMessage(){vscode.postMessage({type:"edit",content:textarea.value,fontSize})}function sendResize(){sendMessage();textarea.style.fontSize=fontSize+"px"}window.addEventListener("wheel",e=>{if(e.altKey){e.preventDefault();if(e.deltaY<0){fontSize=Math.min(fontSize+1,40)}else{fontSize=Math.max(fontSize-1,8)}sendResize()}},{passive:false});window.addEventListener("keydown",e=>{if(e.altKey&&e.key==="+"){fontSize=Math.min(fontSize+1,40);e.preventDefault();sendResize()}if(e.altKey&&e.key==="="){fontSize=16;e.preventDefault();sendResize()}if(e.altKey&&e.key==="-"){fontSize=Math.max(fontSize-1,8);e.preventDefault();sendResize()}});textarea.addEventListener("input",()=>{sendMessage()});window.addEventListener("message",event=>{const message=event.data;if(message.type=="setup"){document.getElementById("notepad").value=message.content??"";fontSize=+(message.fontSize??"16");textarea.style.fontSize=fontSize+"px"}});<\/script></body></html>'
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
