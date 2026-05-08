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
const VALID_THEMES = ["auto", "light", "dim", "dark"];
const CYCLE_ORDER = ["auto", "dark", "dim", "light"];
const SVG_NS = "http://www.w3.org/2000/svg";
const THEME_ICONS = {
	auto: '<path fill-rule="evenodd" d="M1 0L4 0L4 1L5 1L5 4L4 4L4 5L1 5L1 4L0 4L0 1L1 1Z M3 1L4 1L4 4L3 4Z"/>',
	dark: '<path d="M1 0L4 0L4 1L5 1L5 4L4 4L4 5L1 5L1 4L0 4L0 1L1 1Z"/>',
	dim: '<path d="M1 0L3 0L3 1L2 1L2 2L1 2L1 3L2 3L2 4L3 4L3 5L1 5L1 4L0 4L0 1L1 1Z"/>',
	light: '<path d="M2 0L3 0L3 1L4 1L4 2L5 2L5 3L4 3L4 4L3 4L3 5L2 5L2 4L1 4L1 3L0 3L0 2L1 2L1 1L2 1Z"/>'
};

function applyTheme (theme) {
	if (!VALID_THEMES.includes(theme)) {
		theme = "auto"
	}
	const body = document.body;
	for (const t of VALID_THEMES) {
		body.classList.remove("sn-theme-" + t)
	}
	body.classList.add("sn-theme-" + theme)
}
let sendMessage = () => {};
const codeEle = textarea;
const codeLangEle = document.getElementById("lang-choose");
let lang = codeLangEle.value || "plain text";
let previewButEle = document.getElementById("preview-button");
let previewEle = document.getElementById("preview");
var edtlang = languageModes[lang];
let editor;
let prev = false;

function ed_init () {
	editor?.toTextArea();
	editor = CodeMirror.fromTextArea(codeEle, tomode(edtlang));
	editor.setSize("auto", `${innerHeight}px`);
	editor.on("change", () => {
		editor.setSize("auto", `${innerHeight}px`);
		sendMessage()
	})
}
ed_init();
codeLangEle.addEventListener("change", function () {
	lang = this.value || "plain text";
	previewButEle.hidden = lang !== "markdown" && lang !== "html";
	if(previewButEle.hidden){
		prev = false;
	}
	edtlang = languageModes[lang];
	ed_init();
	sendMessage()
});
let fontSize = 16;
let addEle = document.getElementById("add");
let equalEle = document.getElementById("equal");
let minusEle = document.getElementById("minus");
let themeEle = document.getElementById("theme");
let currentTheme = "auto";
let requestThemeChange = () => {};

function renderThemeButton () {
	if (!themeEle) return;
	const label = currentTheme[0].toUpperCase() + currentTheme.slice(1);
	const text = `Theme: ${label} (click to switch)`;
	const iconMarkup = THEME_ICONS[currentTheme] || THEME_ICONS.auto;
	themeEle.innerHTML = `<title>${text}</title>${iconMarkup}`;
	themeEle.setAttribute("aria-label", text)
}
if (themeEle) {
	themeEle.addEventListener("click", () => {
		const idx = CYCLE_ORDER.indexOf(currentTheme);
		const next = CYCLE_ORDER[(idx === -1 ? 0 : (idx + 1) % CYCLE_ORDER.length)];
		applyTheme(next);
		currentTheme = next;
		renderThemeButton();
		requestThemeChange(next)
	})
}
if (window.acquireVsCodeApi) {
	const vscode = acquireVsCodeApi();
	vscode.postMessage({
		type: "get"
	});
	sendMessage = function () {
		vscode.postMessage({
			type: "edit",
			content: editor.getValue(),
			fontSize,
			lang
		})
	};
	requestThemeChange = function (theme) {
		vscode.postMessage({
			type: "setTheme",
			theme
		})
	};
	window.addEventListener("message", event => {
		const message = event.data;
		if (message.type === "setup") {
			lang = message.lang ?? "plain text";
			previewButEle.hidden = lang !== "markdown" && lang !== "html";
			if(previewButEle.hidden){
				prev = false;
			}
			codeLangEle.value = lang;
			edtlang = languageModes[lang];
			fontSize = +(message.fontSize ?? "16");
			currentTheme = VALID_THEMES.includes(message.theme) ? message.theme : "auto";
			applyTheme(currentTheme);
			renderThemeButton();
			ed_init();
			editor.getWrapperElement().style.fontSize = fontSize + "px";
			editor.refresh();
			editor.setValue(message.content ?? "")
		} else if (message.type === "theme") {
			currentTheme = VALID_THEMES.includes(message.theme) ? message.theme : "auto";
			applyTheme(currentTheme);
			renderThemeButton();
			if (editor) {
				editor.refresh()
			}
		}
	})
}
const renderer = new marked.Renderer;
const escapeHtml = code => code.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
renderer.codespan = function (text) {
	return `<code class='code'>${text.text}</code>`
};
renderer.code = function (code) {
	if (!code.lang) {
		code.lang = "none"
	}
	if (code.lang === "c++") {
		code.lang = "cpp"
	}
	return `<pre class="line-numbers language-${code.lang}"><code class="language-${code.lang}">${escapeHtml(code.text)}</code></pre>`
};
marked.setOptions({
	renderer,
	highlight: function (code, lang) {
		const language = Prism.languages[lang] || Prism.languages.javascript;
		return Prism.highlight(code, language, lang)
	}
});
DOMPurify.addHook("uponSanitizeAttribute", (node, data) => {
	if (data.attrName === "style" && /position\s*:/.test(data.attrValue)) {
		data.keepAttr = false
	}
});
previewButEle.addEventListener("click", () => {
	if (lang === "markdown" || lang === "html") {
		prev = !prev;
		if (prev) {
			previewEle.hidden = false;
			editor.getWrapperElement().hidden = true;
			let text = editor.getValue();
			if (lang === "markdown") {
				text = marked.parse(text)
			}
			text = DOMPurify.sanitize(text, {
				USE_PROFILES: {
					html: true
				},
				FORBID_TAGS: ["style", "iframe", "script", "object", "embed", "form"],
				FORBID_ATTR: [/^on/i, "srcset"],
				ALLOW_UNKNOWN_PROTOCOLS: false,
				RETURN_TRUSTED_TYPE: false,
				FORBID_CONTENTS: ["script", "iframe"]
			});
			previewEle.innerHTML = text;
			if (lang === "markdown") {
				MathJax.typesetPromise([previewEle]);
				Prism.highlightAllUnder(previewEle)
			}
		} else {
			previewEle.hidden = true;
			editor.getWrapperElement().hidden = false;
			editor.refresh()
		}
	}
});

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
