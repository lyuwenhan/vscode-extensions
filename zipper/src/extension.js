const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const {
	pipeline
} = require("stream/promises");
const unzipper = require("unzipper");

function tryName(faDir, name, ext = "") {
	let filename = name + ext;
	let dir = path.join(faDir, filename);
	let addition = 0;
	while (fs.existsSync(dir)) {
		addition++;
		filename = name + " (" + addition + ")" + ext;
		dir = path.join(faDir, filename)
	}
	return [dir, filename]
}
async function getPaths(paths) {
	let pa = paths[0][0];
	if (pa != "/") {
		pa = ""
	}
	const tree = {
		is: false,
		realPa: "",
		isFolder: false,
		next: {}
	};
	for (const p of paths) {
		let isF;
		const stats = await fs.promises.lstat(p);
		if (stats.isDirectory()) {
			isF = true
		} else if (stats.isFile()) {
			isF = false
		} else {
			continue
		}
		const arr = p.split(path.sep).filter(Boolean);
		let cur = tree;
		for (const link of arr) {
			if (cur.is) break;
			if (!cur.next[link]) {
				cur.next[link] = {
					is: false,
					isFolder: true,
					next: {}
				}
			}
			cur = cur.next[link]
		}
		if (!cur.is) {
			cur.is = true;
			cur.realPa = p;
			cur.isFolder = isF;
			cur.next = {}
		}
	}
	let common = [];
	let cur = tree;
	let ne = Object.keys(cur.next);
	while (ne.length === 1) {
		const curNe = cur.next[ne[0]];
		const neNe = Object.keys(curNe.next);
		if (neNe.length === 0) {
			break
		}
		common.push(ne[0]);
		cur = curNe;
		ne = neNe
	}
	const result = [];

	function dfs(node, pa) {
		if (node.is) {
			result.push({
				pa: path.join(...pa),
				realPa: node.realPa,
				isFolder: node.isFolder
			})
		}
		for (const [name, child] of Object.entries(node.next)) {
			pa.push(name);
			dfs(child, pa);
			pa.pop()
		}
	}
	dfs(cur, []);
	return {
		paths: result,
		commonRoot: pa + path.join(...common)
	}
}

function testPath(root, nPath) {
	const resolvedPath = path.resolve(root, nPath);
	console.log(resolvedPath.replaceAll(path.sep, "/"), root.replaceAll(path.sep, "/") + "/");
	return resolvedPath.replaceAll(path.sep, "/").startsWith(root.replaceAll(path.sep, "/") + "/") ? {
		ok: true,
		resolvedPath
	} : {
		ok: false
	}
}
class ZipDocument {
	constructor(uri) {
		this.uri = uri;
		this.filePath = uri.fsPath;
		this.fileName = path.basename(this.filePath);
		this.structure = null;
		this.exportDir = null;
		this.exportName = null
	}
	async readZipStructure() {
		const directory = await unzipper.Open.file(this.filePath);
		return directory.files.map(f => ({
			path: f.path,
			type: f.type,
			size: f.uncompressedSize
		}))
	}
	async extractFiles(targetFiles) {
		try {
			await this.getExport();
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: `Zipper: Extracting "${this.exportName}/${targetFiles.folderName}"`,
				cancellable: false
			}, async () => {
				const directory = await unzipper.Open.file(this.filePath);
				const files = directory.files;
				const rootPath = targetFiles.rootPath;
				let outRoot = this.exportDir;
				if (targetFiles.folderName) {
					if (!testPath(outRoot, targetFiles.folderName).ok) {
						throw new Error(`Zip Slip detected: "${targetFiles.folderName}"`)
					}
					outRoot = tryName(outRoot, targetFiles.folderName)[0]
				}
				await fs.promises.mkdir(outRoot, {
					recursive: true
				});
				let slip = false;
				await Promise.all([Promise.all(targetFiles.folders.map(async pa => {
					if (!pa) {
						return
					}
					const {
						resolvedPath,
						ok
					} = testPath(outRoot, pa);
					if (!ok) {
						console.log("slip", outRoot, pa);
						slip = true;
						return
					}
					await fs.promises.mkdir(resolvedPath, {
						recursive: true
					})
				})), Promise.all(targetFiles.files.map(i => files[i]).filter(Boolean).map(async file => {
					if (file.type !== "File" || file.path.length <= rootPath.length || !file.path.startsWith(rootPath)) {
						return
					}
					const unsafePath = file.path.slice(rootPath.length);
					if (!testPath(outRoot, unsafePath).ok) {
						console.log("slip", outRoot, unsafePath);
						slip = true;
						return
					}
					const {
						dir,
						name,
						ext
					} = path.parse(unsafePath);
					const outDir = path.join(outRoot, dir);
					await fs.promises.mkdir(outDir, {
						recursive: true
					});
					const [outputFile] = tryName(outDir, name, ext);
					await pipeline(file.stream(), fs.createWriteStream(outputFile))
				}))]);
				if (slip) {
					throw new Error(`Zip Slip detected`)
				}
			});
			vscode.window.showInformationMessage(`Zipper: Extracted "${this.exportName}/${targetFiles.rootPath}"`)
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e));
			console.error(e);
			console.error(e.stack)
		}
	}
	async getStructure() {
		return this.structure ??= await this.readZipStructure()
	}
	async getExport() {
		if (!this.exportDir) {
			const baseDir = path.dirname(this.filePath);
			const [targetDir, finalDir] = tryName(baseDir, "exports");
			await fs.promises.mkdir(targetDir, {
				recursive: true
			});
			this.exportName = finalDir;
			this.exportDir = targetDir
		}
		return {
			exportDir: this.exportDir,
			exportName: this.exportName
		}
	}
	dispose() {}
}
class ZipPreviewEditor {
	constructor(context) {
		this.context = context;
		this.zipPath = null
	}
	async openCustomDocument(uri, openContext, token) {
		return new ZipDocument(uri)
	}
	async resolveCustomEditor(document, webviewPanel, token) {
		this.zipPath = document.uri.fsPath;
		webviewPanel.webview.options = {
			enableScripts: true,
			localResourceRoots: [vscode.Uri.file(path.join(this.context.extensionPath, "docs"))]
		};
		webviewPanel.webview.html = this.getHtml(webviewPanel.webview);
		this.activateMessageListener(webviewPanel.webview, document)
	}
	getHtml(webview) {
		const maincss = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "docs", "main.css")));
		const mainjs = webview.asWebviewUri(vscode.Uri.file(path.join(this.context.extensionPath, "docs", "main.js")));
		return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="${maincss}"></head><body><h2 id="title">ZIP preview</h2><button id="dmf">Download multiple files</button>&nbsp;<button id="ddmf">Download</button><div id="main">loading</div><script src="${mainjs}"><\/script></body></html>`
	}
	activateMessageListener(webview, document) {
		webview.onDidReceiveMessage(async message => {
			switch (message.type) {
				case "get": {
					webview.postMessage({
						type: "setup",
						name: document.fileName,
						content: await document.getStructure()
					});
					break
				}
				case "download": {
					await document.extractFiles(message.files);
					break
				}
			}
		})
	}
}
async function walkDir(dir, onData, baseDir = dir) {
	const entries = await fs.promises.readdir(dir, {
		withFileTypes: true
	});
	var hasDir = false;
	for (const entry of entries) {
		const full = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			hasDir = true;
			await walkDir(full, onData, baseDir)
		}
	}
	if (!hasDir) {
		await onData(path.relative(baseDir, dir))
	}
}

function activate(context) {
	const zipDisposable = vscode.commands.registerCommand("zipper.compress", async (uri, selectedUris) => {
		try {
			const targets = Array.isArray(selectedUris) && selectedUris.length > 0 ? selectedUris : uri ? [uri] : [];
			if (targets.length === 0) {
				vscode.window.showWarningMessage("Zipper: No files selected");
				return
			}
			let finalName;
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Creating ZIP...",
				cancellable: false
			}, async () => {
				const inputPaths = [...new Set(targets.map(u => u.fsPath).map(p => path.resolve(p)))];
				await Promise.all(inputPaths.map(async p => {
					try {
						await fs.promises.access(p, fs.constants.R_OK)
					} catch (e) {
						throw new Error(`Cannot access to: "${p}"`)
					}
				}));
				const {
					paths,
					commonRoot
				} = await getPaths(inputPaths);
				const zipName = inputPaths.length === 1 ? `${path.parse(inputPaths[0]).name}` : "archive";
				let outputZip;
				[outputZip, finalName] = tryName(commonRoot, zipName, ".zip");
				const output = fs.createWriteStream(outputZip);
				const archive = archiver("zip", {
					zlib: {
						level: 9
					},
					forceLocalTime: true
				});
				const completion = new Promise((resolve, reject) => {
					output.once("close", resolve);
					output.once("error", reject);
					archive.once("error", reject)
				});
				archive.pipe(output);
				for (const {
						pa,
						realPa,
						isFolder
					}
					of paths) {
					if (isFolder) {
						await walkDir(realPa, dir => {
							archive.append("", {
								name: path.join(pa, dir) + "/"
							})
						});
						archive.directory(realPa, pa)
					} else {
						archive.file(realPa, {
							name: pa
						})
					}
				}
				await archive.finalize();
				await completion
			});
			vscode.window.showInformationMessage(`Zipper: ZIP created "${finalName}"`)
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e));
			console.error(e);
			console.error(e.stack)
		}
	});
	const unzipDisposable = vscode.commands.registerCommand("zipper.extract", async uri => {
		try {
			if (!uri || path.extname(uri.fsPath).toLowerCase() !== ".zip") {
				vscode.window.showWarningMessage("Zipper: Please select a ZIP file");
				return
			}
			let finalDir;
			await vscode.window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: "Extracting ZIP...",
				cancellable: false
			}, async () => {
				const zipPath = uri.fsPath;
				const baseDir = path.resolve(path.dirname(zipPath));
				const targetName = path.parse(zipPath).name;
				let targetDir;
				[targetDir, finalDir] = tryName(baseDir, targetName);
				await fs.promises.mkdir(targetDir, {
					recursive: true
				});
				const parser = unzipper.Parse();
				await new Promise((resolve, reject) => {
					fs.createReadStream(zipPath).pipe(parser).on("entry", async entry => {
						try {
							const {
								ok,
								resolvedPath
							} = testPath(targetDir, entry.path);
							if (!ok) {
								reject(new Error(`Zip Slip detected: "${entry.path}"`))
							}
							if (entry.type === "Directory") {
								await fs.promises.mkdir(resolvedPath, {
									recursive: true
								});
								entry.autodrain()
							} else if (entry.type === "File") {
								await fs.promises.mkdir(path.dirname(resolvedPath), {
									recursive: true
								});
								await pipeline(entry, fs.createWriteStream(resolvedPath))
							} else {
								entry.autodrain()
							}
						} catch (err) {
							reject(err)
						}
					}).once("close", resolve).once("error", reject)
				})
			});
			vscode.window.showInformationMessage(`Zipper: Extracted to "${finalDir}"`)
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e));
			console.error(e);
			console.error(e.stack)
		}
	});
	context.subscriptions.push(vscode.window.registerCustomEditorProvider("zipPreview.editor", new ZipPreviewEditor(context)));
	context.subscriptions.push(zipDisposable, unzipDisposable)
}

function deactivate() {}
module.exports = {
	activate,
	deactivate
};
