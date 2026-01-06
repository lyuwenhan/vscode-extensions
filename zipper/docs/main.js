"use strict";
const titleEle = document.getElementById("title");
const mainEle = document.getElementById("main");
const relEle = document.getElementById("rel");
const dmfEle = document.getElementById("dmf");
const ddmfEle = document.getElementById("ddmf");
dmfEle.addEventListener("click", () => {
	document.body.classList.toggle("mult")
});
let loadCount = 0;
let treeNow;
let loadInter;

function stopLoading() {
	if (loadInter) {
		clearInterval(loadInter);
		loadInter = 0
	}
}

function startLoading() {
	stopLoading();
	loadInter = setInterval(() => {
		console.log("load");
		loadCount = (loadCount + 1) % 4;
		mainEle.innerText = "loading" + ".".repeat(loadCount)
	}, 850)
}
startLoading();
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
relEle.addEventListener("click", () => {
	vscode.postMessage({
		type: "reload"
	})
});
ddmfEle.addEventListener("click", () => {
	let files = [];
	const folders = [];
	const tree = JSON.parse(JSON.stringify(treeNow));
	const getcur = path => {
		let cur = tree;
		for (let pa of path.split("/").filter(Boolean)) {
			if (!cur.next[pa]) {
				return
			}
			cur = cur.next[pa]
		}
		return cur
	};
	const checks = mainEle.querySelectorAll("input[type=checkbox]:checked");
	if (!checks.length) {
		return
	}
	checks.forEach(e => {
		if (!e.dataset.isFolder) {
			return
		}
		if (e.dataset.isFolder === "true") {
			if (e.dataset.folder) {
				const cur = getcur(e.dataset.folder);
				if (cur) {
					cur.isSel = true
				}
			}
		} else {
			if (e.dataset.fileI && e.dataset.filePath && e.dataset.fileName) {
				files.push(+e.dataset.fileI);
				const cur = getcur(e.dataset.filePath);
				if (cur) {
					if (!cur.fileCnt) {
						cur.fileCnt = 0
					}
					cur.fileCnt++
				}
			}
		}
	});

	function dfs(node, forceBool = false, path = "") {
		node.next = Object.fromEntries(Object.entries(node.next).sort(([a], [b]) => a.localeCompare(b)));
		node.isSel ||= forceBool;
		if (node.isSel) {
			node.files.forEach(f => files.push(f.i))
		}
		let sonSel = node.fileCnt > 0;
		for (const [name, child] of Object.entries(node.next)) {
			sonSel = dfs(child, node.isSel, path + name + "/") || sonSel
		}
		node.sonFile = sonSel;
		return sonSel || node.isSel
	}
	dfs(tree);
	files = files.sort((a, b) => a - b).filter((v, i, a) => i === 0 || v !== a[i - 1]);
	let folderName = "root";
	let rootPath = "";
	let cur = tree;
	while (true) {
		const ent = Object.entries(cur.next).filter(e => e[1].isSel || e[1].sonFile);
		if (!cur.fileCnt && ent.length === 1) {
			folderName = ent[0][0];
			rootPath += folderName + "/";
			cur = ent[0][1]
		} else if (!ent.length && cur.fileCnt === 1) {
			folderName = "";
			break
		} else {
			break
		}
	}

	function dfs2(node, path = "") {
		if (node.isSel && !node.sonFile) {
			folders.push(path)
		}
		for (const [name, child] of Object.entries(node.next)) {
			dfs2(child, path + name + "/")
		}
	}
	dfs2(cur);
	extractFile({
		folderName,
		files,
		folders,
		rootPath
	})
});

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
			const childPath = `${path}${name}/`;
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
	treeNow = tree;

	function getSpan(name, size, faCho, needChk, path, files) {
		const span = document.createElement("span");
		span.classList.add("downloadFa");
		const spanL = document.createElement("span");
		const aR = document.createElement("a");
		const cho = document.createElement("label");
		const ckb = document.createElement("input");
		cho.classList.add("cho");
		ckb.type = "checkbox";
		ckb.checked = needChk;
		ckb.dataset.path = path;
		cho.append(ckb);
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
		span.append(cho);
		return {
			span,
			ckb
		}
	}

	function dfs(node, father, path, faCho = []) {
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
		let needChk = faCho.some(cho => cho[0].checked);
		for (const [name, child] of ent) {
			const nPath = path + name + "/";
			const li = document.createElement("li");
			const det = document.createElement("details");
			const sum = document.createElement("summary");
			const {
				span,
				ckb
			} = getSpan(name, child.size, faCho, needChk, nPath, {
				folderName: name,
				rootPath: nPath,
				...getFilesFromTree(child)
			});
			ckb.addEventListener("change", e => {
				if (e.target.checked) {
					det.querySelectorAll("input[type=checkbox]:not(:checked)").forEach(ele => {
						ele.checked = true;
						ele.indeterminate = false
					});
					faCho.forEach(([ele]) => {
						ele.checked = false;
						ele.indeterminate = true
					})
				} else {
					det.querySelectorAll("input[type=checkbox]:checked").forEach(ele => {
						ele.checked = false;
						ele.indeterminate = false
					});
					faCho.forEach(([ele, faEle]) => {
						ele.checked = false;
						ele.indeterminate = Boolean(faEle.querySelector(":scope>:not(:first-child) input[type=checkbox]:checked"))
					})
				}
			});
			ckb.dataset.isFolder = true;
			ckb.dataset.folder = nPath;
			sum.append(span);
			det.append(sum);
			li.classList.add("lisum");
			li.append(det);
			det.addEventListener("toggle", () => {
				dfs(child, det, nPath, [
					[ckb, det], ...faCho
				])
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
			const {
				span,
				ckb
			} = getSpan(name, size, faCho, needChk, path + name, {
				folderName: "",
				files: [i],
				folders: [],
				rootPath: path
			});
			ckb.addEventListener("change", e => {
				if (e.target.checked) {
					faCho.forEach(([ele]) => {
						ele.checked = false;
						ele.indeterminate = true
					})
				} else {
					faCho.forEach(([ele, faEle]) => {
						ele.checked = false;
						ele.indeterminate = Boolean(faEle.querySelector(":scope>:not(:first-child) input[type=checkbox]:checked"))
					})
				}
			});
			ckb.dataset.isFolder = false;
			ckb.dataset.fileName = name;
			ckb.dataset.filePath = path;
			ckb.dataset.fileI = i;
			li.append(span);
			ul.append(li)
		}
		father.append(ul)
	}
	dfs(tree, mainEle, "")
}
window.addEventListener("message", event => {
	const message = event.data;
	if (message.type === "setup") {
		stopLoading();
		displayTree(message)
	}
});
