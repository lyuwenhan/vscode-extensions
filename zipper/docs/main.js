"use strict";
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

function extractFile(files) {
	vscode.postMessage({
		type: "download",
		files
	})
}

function getTree(paths) {
	const tree = {
		size: 0,
		next: {},
		files: []
	};
	for (let i = 0; i < paths.length; i++) {
		const p = paths[i];
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
					files: []
				}
			}
			cur = cur.next[link]
		}
		if (!isF) {
			cur.files.push({
				name: fn,
				size: p.size,
				i
			})
		}
	}

	function dfs(node) {
		node.files = node.files.sort();
		node.next = Object.fromEntries(Object.entries(node.next).sort(([a], [b]) => a.localeCompare(b)));
		node.size = node.files.reduce((a, b) => a + b.size, 0);
		for (const [name, child] of Object.entries(node.next)) {
			dfs(child);
			node.size += child.size
		}
	}
	dfs(tree);
	return tree
}

function getFilesFromTree(root) {
	const files = [];
	const folders = [];

	function dfs(node, path) {
		for (const f of node.files) {
			files.push(f.i)
		}
		const nextKeys = Object.keys(node.next);
		if (node.files.length === 0 && nextKeys.length === 0) {
			if (path !== "") {
				folders.push(path)
			}
			return
		}
		for (const name of nextKeys) {
			const child = node.next[name];
			const childPath = path ? `${path}/${name}` : name;
			dfs(child, childPath)
		}
	}
	dfs(root, "");
	return {
		files,
		folders
	}
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

	function getSpan(name, size, files) {
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
			extractFile(files)
		});
		span.append(spanL);
		span.append(aR);
		return span
	}

	function dfs(node, father, path) {
		const ul = document.createElement("ul");
		const ent = Object.entries(node.next);
		if (!ent.length && !node.files.length) {
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
			sum.append(getSpan(name, child.size, {
				folderName: name,
				rootPath: nPath,
				...getFilesFromTree(child)
			}));
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
				size,
				i
			}
			of node.files) {
			const li = document.createElement("li");
			li.append(getSpan(name, size, {
				folderName: "",
				files: [i],
				folders: [],
				rootPath: path
			}));
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
