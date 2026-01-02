const titleEle = document.getElementById("title");
const mainEle = document.getElementById("main");
let loadCount = 0;
let loadInter = setInterval(() => {
	loadCount = (loadCount + 1) % 4;
	mainEle.innerText = "loading" + ".".repeat(loadCount)
}, 850);
const vscode = acquireVsCodeApi();
vscode.postMessage({
	type: "get"
});

function extractFile(pathInZip, isFolder) {
	vscode.postMessage({
		type: "download",
		path: pathInZip,
		isFolder
	})
}

function getTree(paths) {
	console.log(paths);
	const tree = {
		size: 0,
		next: {},
		file: []
	};
	for (const p of paths) {
		let isF;
		if (p.type === "Directory") {
			isF = true
		} else if (p.type === "File") {
			isF = false
		} else {
			continue
		}
		const arr = p.path.split("/").filter(Boolean);
		const fn = !isF ? arr.pop() : "";
		let cur = tree;
		for (const link of arr) {
			if (!cur.next[link]) {
				cur.next[link] = {
					size: 0,
					next: {},
					file: []
				}
			}
			cur = cur.next[link]
		}
		if (!isF) {
			cur.file.push({
				name: fn,
				size: p.size
			})
		}
	}

	function dfs(node) {
		node.file = node.file.sort();
		node.next = Object.fromEntries(Object.entries(node.next).sort(([a], [b]) => a.localeCompare(b)));
		node.size = node.file.reduce((a, b) => a + b.size, 0);
		for (const [name, child] of Object.entries(node.next)) {
			dfs(child);
			node.size += child.size
		}
	}
	dfs(tree);
	return tree
}

function formatSize(bytes, decimals = 2) {
	const units = ["B", "KB", "MB", "GB", "TB"];
	let value = bytes;
	let unitIndex = 0;
	while (unitIndex < units.length - 1 && value >= 1024 * .75) {
		value /= 1024;
		unitIndex++
	}
	return `${value.toFixed(decimals)} ${units[unitIndex]}`
}

function displayTree(message) {
	titleEle.innerText = message.name;
	mainEle.innerHTML = "";
	const tree = getTree(message.content);

	function getSpan(name, size, isFolder, path) {
		const span = document.createElement("span");
		span.classList.add("downloadFa");
		const spanL = document.createElement("span");
		const aR = document.createElement("a");
		spanL.innerText = `${name} (${formatSize(size)})`;
		spanL.title = size + "B";
		aR.href = "#";
		aR.innerText = "Download";
		aR.classList.add("download");
		aR.addEventListener("click", () => {
			extractFile(path, isFolder)
		});
		span.append(spanL);
		span.append(aR);
		return span
	}

	function dfs(node, father, path) {
		const ul = document.createElement("ul");
		const ent = Object.entries(node.next);
		if (!ent.length && !node.file.length) {
			const li = document.createElement("li");
			const span = document.createElement("span");
			span.classList.add("downloadFa");
			span.classList.add("emptyDir");
			span.innerText = "This directory is empty.";
			li.append(span);
			ul.append(li)
		}
		for (const [name, child] of ent) {
			const nPath = path + name + "/";
			const li = document.createElement("li");
			const det = document.createElement("details");
			const sum = document.createElement("summary");
			sum.append(getSpan(name, child.size, true, nPath));
			det.append(sum);
			li.classList.add("lisum");
			li.append(det);
			det.addEventListener("toggle", () => {
				dfs(child, det, nPath)
			}, {
				once: true
			});
			ul.append(li)
		}
		for (const {
				name,
				size
			}
			of node.file) {
			const li = document.createElement("li");
			li.append(getSpan(name, size, false, path + name));
			ul.append(li)
		}
		father.append(ul)
	}
	dfs(tree, mainEle, "")
}
window.addEventListener("message", event => {
	const message = event.data;
	if (message.type === "setup") {
		if (loadInter) {
			clearInterval(loadInter);
			loadInter = 0
		}
		displayTree(message)
	}
});
