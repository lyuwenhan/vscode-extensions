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
	const tree = {
		isFolder: true,
		size: 0,
		next: {}
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
		let cur = tree;
		for (const link of arr) {
			if (!cur.isFolder) {
				break
			}
			if (!cur.next[link]) {
				cur.next[link] = {
					isFolder: true,
					size: 0,
					next: {}
				}
			}
			cur = cur.next[link]
		}
		cur.isFolder = isF;
		cur.size = p.size;
		if (!isF) {
			cur.next = {}
		}
	}

	function dfs(node) {
		node.next = Object.fromEntries(Object.entries(node.next).sort(([aName, aNode], [bName, bNode]) => {
			if (aNode.isFolder !== bNode.isFolder) {
				return aNode.isFolder ? -1 : 1
			}
			return aName.localeCompare(bName)
		}));
		let ent = Object.entries(node.next);
		if (ent.length) {
			node.size = 0
		}
		for (const [name, child] of ent) {
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
	while (unitIndex < units.length - 1 && value >= 1024 * .7) {
		value /= 1024;
		unitIndex++
	}
	return `${value.toFixed(decimals)} ${units[unitIndex]}`
}

function displayTree(message) {
	titleEle.innerText = message.name;
	mainEle.innerHTML = "";
	const tree = getTree(message.content);

	function dfs(node, father, path) {
		const ul = document.createElement("ul");
		for (const [name, child] of Object.entries(node.next)) {
			const nPath = path + name + (child.isFolder ? "/" : "");
			const li = document.createElement("li");
			const span = document.createElement("span");
			span.classList.add("downloadFa");
			const spanL = document.createElement("span");
			const aR = document.createElement("a");
			spanL.innerText = `${name} (${formatSize(child.size)})`;
			spanL.title = child.size + "B";
			aR.href = "#";
			aR.innerText = "Download";
			aR.classList.add("download");
			aR.addEventListener("click", () => {
				extractFile(nPath, child.isFolder)
			});
			span.append(spanL);
			span.append(aR);
			if (child.isFolder) {
				const det = document.createElement("details");
				const sum = document.createElement("summary");
				sum.append(span);
				det.append(sum);
				li.classList.add("lisum");
				li.append(det);
				det.addEventListener("toggle", () => {
					dfs(child, det, nPath)
				}, {
					once: true
				})
			} else {
				li.append(span)
			}
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
