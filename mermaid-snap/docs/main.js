const notepadEle = document.getElementById("notepad");
let sendMessage = () => {};
let sendExport = () => {};
let previewEle = document.getElementById("previewEle");
let exportBt = document.getElementById("exportsBt");
let prevSvg = "";
let scale = 2;
async function svgToPngBase64(svgString) {
	scale = 4;
	const parser = new DOMParser;
	const doc = parser.parseFromString(svgString, "image/svg+xml");
	const svgEl = doc.documentElement;
	svgEl.style.position = "fixed";
	svgEl.style.top = "0";
	svgEl.style.left = "0";
	svgEl.style.opacity = "0";
	svgEl.style.pointerEvents = "none";
	document.body.appendChild(svgEl);
	await new Promise(requestAnimationFrame);
	const rect = svgEl.getBoundingClientRect();
	const width = rect.width;
	const height = rect.height;
	document.body.removeChild(svgEl);
	const img = new Image;
	img.src = "data:image/svg+xml;base64," + btoa(svgString);
	await img.decode();
	const canvas = document.createElement("canvas");
	canvas.width = width * scale;
	canvas.height = height * scale;
	const ctx = canvas.getContext("2d");
	ctx.scale(scale, scale);
	ctx.drawImage(img, 0, 0, width, height);
	const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/png"));
	const base64 = await new Promise(resolve => {
		const reader = new FileReader;
		reader.onloadend = () => resolve(reader.result.split(",")[1]);
		reader.readAsDataURL(blob)
	});
	return base64
}
if (window.acquireVsCodeApi) {
	const vscode = acquireVsCodeApi();
	vscode.postMessage({
		type: "get"
	});
	sendMessage = function() {
		vscode.postMessage({
			type: "edit",
			content: notepadEle.value
		})
	};
	sendExport = async function() {
		vscode.postMessage({
			type: "export",
			content: await svgToPngBase64(prevSvg)
		})
	};
	window.addEventListener("message", event => {
		const message = event.data;
		if (message.type == "setup" && message.content) {
			notepadEle.value = message.content;
			renderMermaid()
		}
	})
}
mermaid.initialize({
	startOnLoad: false,
	theme: "default"
});
let timer;
notepadEle.addEventListener("input", () => {
	sendMessage();
	clearTimeout(timer);
	timer = setTimeout(renderMermaid, 400)
});
async function renderMermaid() {
	const code = notepadEle.value.trim();
	if (!code) {
		previewEle.innerHTML = "";
		return
	}
	try {
		const {
			svg
		} = await mermaid.render("theGraph", code);
		prevSvg = svg;
		previewEle.innerHTML = "";
		const svgEle = document.createElement("iframe");
		svgEle.srcdoc = `<!DOCTYPE html><html><head><style>body,html{margin:0;padding:0;overflow:hidden;height:100%;width:100%}svg#theGraph{max-width:100%!important;max-height:100%!important}</style></head><body>${svg}</body></html>`;
		previewEle.insertAdjacentElement("beforeend", svgEle);
		svgEle.classList.add("imgSvg")
	} catch (err) {
		previewEle.innerHTML = `<p style="color:red;">${err.message}</p>`
	}
	document.getElementById("dtheGraph")?.remove()
}
notepadEle.value = `graph TD\n    A[Start] --\x3e B{Is it working?}\n    B --\x3e|Yes| C[Great!]\n    B --\x3e|No| D[Fix it]`;
renderMermaid();
exportBt.addEventListener("click", sendExport);
