const textarea = document.getElementById("notepad");
let sendMessage = () => {};
let previewEle = document.getElementById("previewEle");
if (window.acquireVsCodeApi) {
	const vscode = acquireVsCodeApi();
	vscode.postMessage({
		type: "get"
	});
	sendMessage = function () {
		vscode.postMessage({
			type: "edit",
			content: textarea.value
		})
	};
	window.addEventListener("message", event => {
		// const message = event.data;
		// if (message.type == "setup") {
		// 	textarea.value = message.content ?? ""
		// }
	})
}
mermaid.initialize({
	startOnLoad: false,
	theme: "default"
});
let timer;
textarea.addEventListener("input", () => {
	clearTimeout(timer);
	timer = setTimeout(renderMermaid, 400)
});
async function renderMermaid () {
	const code = textarea.value.trim();
	if (!code) {
		previewEle.innerHTML = "";
		return
	}
	try {
		const {
			svg
		} = await mermaid.render("theGraph", code);
		previewEle.innerHTML = "";
		const svgEle = document.createElement("iframe");
		svgEle.srcdoc = `<!DOCTYPE html><html><head><style>body,html{margin:0;padding:0;overflow:hidden;height:100%;width:100%}svg#theGraph{max-width:100%!important;max-height:100%!important}</style></head><body>${svg}</body></html>`;
		previewEle.insertAdjacentElement("beforeend", svgEle);
		svgEle.classList.add("imgSvg")
	} catch (err) {
		previewEle.innerHTML = `<pre style="color:red;">${err.message}</pre>`
	}
}
textarea.value = `graph TD\n    A[Start] --\x3e B{Is it working?}\n    B --\x3e|Yes| C[Great!]\n    B --\x3e|No| D[Fix it]`;
renderMermaid();
