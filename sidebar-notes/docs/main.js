let fontSize = 16;
const vscode = acquireVsCodeApi(),
	textarea = document.getElementById("notepad");
addEle = document.getElementById("add");
equalEle = document.getElementById("equal");
minusEle = document.getElementById("minus");
vscode.postMessage({
	type: "get"
});

function sendMessage () {
	vscode.postMessage({
		type: "edit",
		content: textarea.value,
		fontSize
	})
}

function sendResize () {
	sendMessage();
	textarea.style.fontSize = fontSize + "px"
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
textarea.addEventListener("input", () => {
	sendMessage()
});
window.addEventListener("message", event => {
	const message = event.data;
	if (message.type == "setup") {
		document.getElementById("notepad").value = message.content ?? "";
		fontSize = +(message.fontSize ?? "16");
		textarea.style.fontSize = fontSize + "px"
	}
});
addEle.addEventListener("click", sizeUp);
equalEle.addEventListener("click", sizeRe);
minusEle.addEventListener("click", sizeDown);
