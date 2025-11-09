const textarea = document.getElementById("notepad");
const languageModes = {
	"plain text": {
		mode: "null"
	},
	c: {
		mode: "text/x-csrc",
		matchBrackets: true,
		autoCloseBrackets: true
	},
	cpp: {
		mode: "text/x-c++src",
		matchBrackets: true,
		autoCloseBrackets: true
	},
	css: {
		mode: "css",
		autoCloseBrackets: true,
		autoCloseTags: true
	},
	java: {
		mode: "text/x-java",
		matchBrackets: true,
		autoCloseBrackets: true
	},
	json: {
		mode: "javascript",
		matchBrackets: true,
		autoCloseBrackets: true
	},
	html: {
		mode: "htmlmixed",
		matchBrackets: true,
		autoCloseTags: true
	},
	shell: {
		mode: "shell",
		matchBrackets: true
	},
	python: {
		mode: "python",
		matchBrackets: true,
		autoCloseBrackets: true
	},
	markdown: {
		mode: "markdown"
	},
	javascript: {
		mode: "javascript",
		matchBrackets: true,
		autoCloseBrackets: true
	},
	yaml: {
		mode: "yaml"
	},
	sql: {
		mode: "text/x-sql",
		matchBrackets: true,
		autoCloseBrackets: true
	}
};

function tomode (mode) {
	return {
		theme: "default",
		lineNumbers: true,
		tabSize: 4,
		indentUnit: 4,
		indentWithTabs: true,
		styleActiveLine: true,
		placeholder: "Write your notes here...",
		...mode
	}
}
let sendMessage = () => {};
const codeEle = textarea;
const codeLangEle = document.getElementById("lang-choose");
let lang = codeLangEle.value || "plain text";
var edtlang = languageModes[lang];
let editor;

function ed_init () {
	editor?.toTextArea();
	editor = CodeMirror.fromTextArea(codeEle, tomode(edtlang));
	editor.getWrapperElement().classList.add("code-cm");
	editor.setSize("auto", `${innerHeight}px`);
	editor.on("change", () => {
		editor.setSize("auto", `${innerHeight}px`);
		sendMessage()
	})
}
ed_init();
codeLangEle.addEventListener("change", function () {
	lang = this.value || "plain text";
	edtlang = languageModes[lang];
	ed_init();
	sendMessage()
});
let fontSize = 16;
addEle = document.getElementById("add");
equalEle = document.getElementById("equal");
minusEle = document.getElementById("minus");
if (window.acquireVsCodeApi) {
	const vscode = acquireVsCodeApi();
	vscode.postMessage({
		type: "get"
	});
	sendMessage = function () {
		console.log({
			type: "edit",
			content: editor.getValue(),
			fontSize,
			lang
		});
		vscode.postMessage({
			type: "edit",
			content: editor.getValue(),
			fontSize,
			lang
		})
	};
	window.addEventListener("message", event => {
		const message = event.data;
		if (message.type == "setup") {
			console.log(message);
			lang = message.lang ?? "plain text";
			codeLangEle.value = lang
			edtlang = languageModes[lang];
			fontSize = +(message.fontSize ?? "16");
			ed_init();
			editor.getWrapperElement().style.fontSize = fontSize + "px";
			editor.refresh();
			editor.setValue(message.content ?? "");
		}
	})
}

function sendResize () {
	sendMessage();
	editor.getWrapperElement().style.fontSize = fontSize + "px";
	editor.refresh()
}

function sizeUp () {
	fontSize = Math.min(fontSize + 1, 40);
	sendResize()
}

function sizeDown () {
	fontSize = Math.max(fontSize - 1, 8);
	sendResize()
}

function sizeRe () {
	fontSize = 16;
	sendResize()
}
window.addEventListener("wheel", e => {
	if (e.altKey) {
		e.preventDefault();
		if (e.deltaY < 0) {
			sizeUp()
		} else {
			sizeDown()
		}
	}
}, {
	passive: false
});
window.addEventListener("keydown", e => {
	if (e.altKey && e.key === "+") {
		e.preventDefault();
		sizeUp()
	}
	if (e.altKey && e.key === "=") {
		e.preventDefault();
		sizeRe()
	}
	if (e.altKey && e.key === "-") {
		e.preventDefault();
		sizeDown()
	}
});
addEle.addEventListener("click", sizeUp);
equalEle.addEventListener("click", sizeRe);
minusEle.addEventListener("click", sizeDown);
