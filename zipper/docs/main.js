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
let treeLa = {};
let loadInter;

function stopLoading() {
	if (loadInter) {
		clearInterval(loadInter);
		loadInter = 0
	}
}

function startLoading() {
	stopLoading();
	mainEle.innerText = "loading" + ".".repeat(loadCount);
	loadInter = setInterval(() => {
		loadCount = (loadCount + 1) % 4;
		mainEle.innerText = "loading" + ".".repeat(loadCount)
	}, 850)
}
startLoading();
const vscode = acquireVsCodeApi();
let reqId = 0;
const pending = new Map;

function sendMsg(message) {
	return new Promise(resolve => {
		const id = ++reqId;
		pending.set(id, resolve);
		vscode.postMessage({
			...message,
			requestId: id
		})
	})
}
vscode.postMessage({
	type: "get"
});

function extractFile(files) {
	vscode.postMessage({
		type: "download",
		files
	})
}

function repackFile(files, i) {
	vscode.postMessage({
		type: "repack",
		files,
		i
	})
}

function comp(a, b) {
	const a2 = a.toLowerCase(),
		b2 = b.toLowerCase();
	return a2 < b2 ? -1 : a2 > b2 ? 1 : a < b ? -1 : a > b ? 1 : 0
}
relEle.addEventListener("click", () => {
	mainEle.innerHTML = "";
	startLoading();
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
			if (e.dataset.fileI && e.dataset.fileName) {
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
		node.next = Object.fromEntries(Object.entries(node.next).sort(([a], [b]) => comp(a, b)));
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
		node.files = node.files.sort((a, b) => comp(a.name, b.name) || a.size - b.size || a.i - b.i);
		node.next = Object.fromEntries(Object.entries(node.next).sort(([a], [b]) => comp(a, b)));
		node.size = node.files.reduce((a, b) => a + b.size, 0);
		for (const child of Object.values(node.next)) {
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
		const nextEnt = Object.entries(node.next);
		if (node.files.length === 0 && nextEnt.length === 0) {
			if (path !== "") {
				folders.push(path)
			}
			return
		}
		for (const [name, child] of nextEnt) {
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
let zipName = "";

function displayTree(tree) {
	titleEle.innerText = zipName;
	mainEle.innerHTML = "";
	treeLa = treeNow;
	treeNow = tree;

	function getSpan(name, size, needChk, path, files) {
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
	let dfsListRes = () => {};
	let dfsList = new Promise(res => dfsListRes = res);

	function dfs(node, nodeForLa, father, path, faCho = []) {
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
			const childLa = nodeForLa?.next && nodeForLa.next[name];
			const nPath = path + name + "/";
			const li = document.createElement("li");
			const det = document.createElement("details");
			const sum = document.createElement("summary");
			const {
				span,
				ckb
			} = getSpan(name, child.size, needChk, nPath, {
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
			let opened = false;
			const onOpen = () => {
				if (!opened) {
					opened = true;
					dfs(child, childLa, det, nPath, [
						[ckb, det], ...faCho
					])
				}
			};
			det.addEventListener("toggle", onOpen, {
				once: true
			});
			det.addEventListener("toggle", () => {
				child.isOpen = det.open
			});
			if (childLa?.isOpen) {
				dfsList = dfsList.then(() => new Promise(r => setTimeout(r, 0))).then(onOpen).then(() => {
					det.open = true
				}).catch(console.error)
			}
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
			} = getSpan(name, size, needChk, path + name, {
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
	dfs(tree, treeLa, mainEle, "");
	dfsListRes()
}
const editEle = document.getElementById("edit");
const editAreaEle = document.getElementById("editArea");
let editing = false;

function showEdit() {
	let editLinks = "/";
	let stack = [];
	let root = JSON.parse(JSON.stringify(treeNow));
	let curr = root;

	function getFilesFromTreeV2(root) {
		const files = [];
		const folders = [];

		function dfs(node, path) {
			for (const f of node.files) {
				files.push({
					i: f.i,
					path: path + f.name,
					byUpload: f.byUpload || false
				})
			}
			const nextEnt = Object.entries(node.next);
			if (node.files.length === 0 && nextEnt.length === 0) {
				if (path !== "") {
					folders.push(path)
				}
				return
			}
			for (const [name, child] of nextEnt) {
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

	function getSpan(name, size) {
		const span = document.createElement("span");
		span.classList.add("downloadFa");
		const spanL = document.createElement("span");
		if (typeof size === "number") {
			spanL.innerText = `${name} (${formatSize(size)})`;
			spanL.title = size + "B"
		} else {
			spanL.innerText = name
		}
		span.append(spanL);
		return span
	}

	function getIs(cur) {
		const i = [];

		function dfs(node) {
			node.files.forEach(fi => {
				if (fi.byUpload) {
					i.push(fi.i)
				}
			});
			Object.values(node.next).forEach(dfs)
		}
		dfs(cur);
		return i
	}
	let canceling = false;
	let exited = false;
	let edited = false;

	function render() {
		let leaved = false;
		let cur = curr;
		editAreaEle.innerHTML = "";
		const buttons1 = document.createElement("div");
		buttons1.classList.add("buttons");
		const cancelBt = document.createElement("button");
		cancelBt.innerText = "Cancel";
		cancelBt.addEventListener("click", async () => {
			if (canceling || exited || leaved) {
				return
			}
			if (edited) {
				canceling = true;
				const canc = await sendMsg({
					type: "yesno",
					title: "Are you sure to cancel?"
				});
				canceling = false;
				if (!canc.result || exited) {
					return
				}
			}
			exited = true;
			leaved = true;
			editing = false;
			document.body.classList.toggle("editing", editing);
			editAreaEle.innerHTML = ""
		});
		const saveBt = document.createElement("button");
		saveBt.innerText = "Save";
		saveBt.addEventListener("click", () => {
			if (exited) {
				return
			}
			exited = true;
			leaved = true;
			repackFile(getFilesFromTreeV2(root), getIs(root))
		});
		buttons1.append(cancelBt);
		buttons1.append(saveBt);
		editAreaEle.append(buttons1);
		const curLink = document.createElement("h3");
		curLink.innerText = "Current folder: " + editLinks;
		editAreaEle.append(curLink);
		const buttons2 = document.createElement("div");
		buttons2.classList.add("buttons");
		const back = document.createElement("button");
		back.innerText = "Back to parent";
		if (editLinks !== "/") {
			back.addEventListener("click", () => {
				if (!leaved && stack.length) {
					const {
						link,
						node
					} = stack.pop();
					editLinks = link;
					curr = node;
					leaved = true;
					render()
				}
			})
		} else {
			back.classList.add("disable")
		}
		const newFolder = document.createElement("button");
		newFolder.innerText = "New folder";
		let newing = false;
		newFolder.addEventListener("click", async () => {
			if (newing || leaved) {
				return
			}
			newing = true;
			const {
				result
			} = await sendMsg({
				type: "input",
				title: "Create New Folder",
				prompt: "Enter the folder name"
			});
			newing = false;
			if (leaved) {
				return
			}
			const res = result.split(/[/\\]/).filter(Boolean);
			if (!res?.length) {
				vscode.postMessage({
					type: "showMsg",
					level: "warn",
					message: "Operation canceled."
				});
				return
			}
			let cur2 = cur;
			edited = true;
			res.forEach(e => {
				if (!cur2.next[e]) {
					cur2.next[e] = {
						size: 0,
						next: {},
						files: []
					}
				}
				cur2 = cur2.next[e]
			});
			leaved = true;
			render()
		});
		const uploadFile = document.createElement("button");
		uploadFile.innerText = "Upload";
		let uploading = false;
		uploadFile.addEventListener("click", async () => {
			if (uploading || leaved) {
				return
			}
			uploading = true;
			const {
				result
			} = await sendMsg({
				type: "uploadFile",
				title: "Upload"
			});
			const oStack = [...stack];
			const cur2 = cur;
			uploading = false;
			if (!result || !result.files.length && !result.folder.length) {
				vscode.postMessage({
					type: "showMsg",
					level: "warn",
					message: "Operation canceled."
				});
				return
			}
			const needUpdFolder = new Set;
			const needUpdFile = new Set;
			edited = true;
			result.folder.forEach(fo => {
				let here = cur2;
				fo.split("/").filter(Boolean).forEach(part => {
					if (!here.next[part]) {
						here.next[part] = {
							size: 0,
							next: {},
							files: []
						};
						needUpdFolder.add(here)
					}
					here = here.next[part]
				})
			});
			let sizeAdd = 0;
			result.files.forEach(fi => {
				let here = cur2;
				const pa = fi.name.split("/").filter(Boolean);
				const name = pa.pop();
				pa.forEach(part => {
					if (!here.next[part]) {
						here.next[part] = {
							size: 0,
							next: {},
							files: []
						};
						needUpdFolder.add(here)
					}
					here = here.next[part];
					here.size += fi.size
				});
				sizeAdd += fi.size;
				here.files.push({
					name,
					size: fi.size,
					i: fi.i,
					byUpload: true
				});
				needUpdFile.add(here)
			});
			needUpdFile.forEach(e => {
				e.files = e.files.sort((a, b) => comp(a.name, b.name) || a.size - b.size || (a.byUpload ? 1 : 0) - (b.byUpload ? 1 : 0) || a.i - b.i)
			});
			needUpdFolder.forEach(e => {
				e.next = Object.fromEntries(Object.entries(e.next).sort(([a], [b]) => comp(a, b)))
			});
			oStack.forEach(e => {
				e.node.size += sizeAdd
			});
			cur2.size += sizeAdd;
			leaved = true;
			render()
		});
		buttons2.append(back);
		buttons2.append(newFolder);
		buttons2.append(uploadFile);
		editAreaEle.append(buttons2);
		const ul = document.createElement("ul");
		const ent = Object.entries(cur.next);
		if (!cur.files.length && !ent.length) {
			const li = document.createElement("li");
			li.classList.add("editFolder");
			const span = getSpan("This directory is empty");
			span.classList.add("emptyDir");
			li.append(span);
			ul.append(li)
		}
		for (const [name, child] of ent) {
			const li = document.createElement("li");
			li.classList.add("editFolder");
			const span = getSpan(name, child.size);
			const buttons = document.createElement("div");
			buttons.classList.add("buttons");
			const enterBt = document.createElement("button");
			enterBt.innerText = "Enter folder";
			enterBt.addEventListener("click", () => {
				if (leaved) {
					return
				}
				stack.push({
					link: editLinks,
					node: cur
				});
				editLinks = editLinks + name + "/";
				curr = child;
				leaved = true;
				render()
			});
			const renameBt = document.createElement("button");
			renameBt.innerText = "Rename";
			let renaming = false;
			renameBt.addEventListener("click", async () => {
				if (leaved || renaming) {
					return
				}
				renaming = true;
				let newName = await sendMsg({
					type: "input",
					title: "Rename File",
					prompt: "Enter the new file name"
				});
				renaming = false;
				if (!newName.result || leaved) {
					return
				}
				edited = true;
				delete cur.next[name];
				const links = newName.result.split(/[/\/]/).filter(Boolean);
				const finalLink = links.pop();
				let cur2 = cur;
				const nStack = [];
				const needUpdFolder = [];
				links.forEach(e => {
					if (!cur2.next[e]) {
						cur2.next[e] = {
							size: 0,
							next: {},
							files: []
						};
						needUpdFolder.push(cur2)
					}
					cur2 = cur2.next[e];
					nStack.push(cur2)
				});
				if (cur2.next[finalLink]) {
					cur.next[name] = child;
					vscode.postMessage({
						type: "showMsg",
						level: "warn",
						message: "Target already exist"
					});
					return
				}
				nStack.forEach(e => {
					e.size += child.size
				});
				edited = true;
				cur2.next[finalLink] = child;
				needUpdFolder.forEach(e => {
					e.next = Object.fromEntries(Object.entries(e.next).sort(([a], [b]) => comp(a, b)))
				});
				leaved = true;
				render()
			});
			const deleteBt = document.createElement("button");
			deleteBt.innerText = "Delete";
			deleteBt.addEventListener("click", () => {
				if (leaved) {
					return
				}
				edited = true;
				delete cur.next[name];
				vscode.postMessage({
					type: "deleteFile",
					i: getIs(child)
				});
				leaved = true;
				render()
			});
			buttons.append(enterBt);
			buttons.append(renameBt);
			buttons.append(deleteBt);
			span.append(buttons);
			li.append(span);
			ul.append(li)
		}
		for (let i = 0; i < cur.files.length; i++) {
			const file = cur.files[i];
			const li = document.createElement("li");
			const span = getSpan(file.name, file.size);
			const buttons = document.createElement("div");
			buttons.classList.add("buttons");
			const renameBt = document.createElement("button");
			renameBt.innerText = "Rename";
			let renaming = false;
			renameBt.addEventListener("click", async () => {
				if (leaved || renaming) {
					return
				}
				renaming = true;
				let newName = await sendMsg({
					type: "input",
					title: "Rename File",
					prompt: "Enter the new folder name"
				});
				renaming = false;
				if (!newName.result || leaved) {
					return
				}
				const links = newName.result.split(/[/\/]/).filter(Boolean);
				const finalLink = links.pop();
				let cur2 = cur;
				edited = true;
				const nStack = [];
				const needUpdFolder = [];
				links.forEach(e => {
					if (!cur2.next[e]) {
						cur2.next[e] = {
							size: 0,
							next: {},
							files: []
						};
						needUpdFolder.push(cur2)
					}
					cur2 = cur2.next[e];
					nStack.push(cur2)
				});
				nStack.forEach(e => {
					e.size += file.size
				});
				edited = true;
				cur.files.splice(i, 1);
				cur2.files.push({
					...file,
					name: finalLink
				});
				cur2.files = cur2.files.sort((a, b) => comp(a.name, b.name) || a.size - b.size || a.i - b.i);
				needUpdFolder.forEach(e => {
					e.next = Object.fromEntries(Object.entries(e.next).sort(([a], [b]) => comp(a, b)))
				});
				leaved = true;
				render()
			});
			const deleteBt = document.createElement("button");
			deleteBt.innerText = "Delete";
			deleteBt.addEventListener("click", () => {
				if (leaved) {
					return
				}
				edited = true;
				if (file.byUpload) {
					vscode.postMessage({
						type: "deleteFile",
						i: [file.i]
					})
				}
				cur.files.splice(i, 1);
				leaved = true;
				render()
			});
			buttons.append(renameBt);
			buttons.append(deleteBt);
			span.append(buttons);
			li.append(span);
			ul.append(li)
		}
		editAreaEle.append(ul)
	}
	render()
}
editEle.addEventListener("click", () => {
	if (!document.body.classList.contains("mult")) {
		editing = true;
		document.body.classList.toggle("editing", editing);
		if (editing) {
			showEdit()
		}
	}
});
window.addEventListener("message", event => {
	const message = event.data;
	if (message.type === "respond" && message.requestId && pending.has(message.requestId)) {
		pending.get(message.requestId)(message);
		pending.delete(message.requestId);
		return
	}
	if (message.type === "setup") {
		stopLoading();
		zipName = message.name;
		displayTree(getTree(message.content))
	} else if (message.type === "setName") {
		titleEle.innerText = zipName = message.name
	}
});
