const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
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
	console.log(common);

	function dfs(node, pa) {
		if (node.is) {
			console.log(path.join(...pa), node.realPa, node.isFolder ? "folder" : "file");
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
						throw new Error(`Cannot access to: ${p}`)
					}
				}));
				const {
					paths,
					commonRoot
				} = await getPaths(inputPaths);
				const zipName = inputPaths.length === 1 ? `${path.parse(inputPaths[0]).name}` : "archive";
				finalName = zipName + ".zip";
				let outputZip = path.join(commonRoot, finalName);
				let addition = 0;
				while (fs.existsSync(outputZip)) {
					addition++;
					finalName = zipName + " (" + addition + ").zip";
					outputZip = path.join(commonRoot, finalName)
				}
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
			vscode.window.showInformationMessage(`Zipper: ZIP created ${finalName}`)
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e));
			console.error(e);
			console.error(e.stack)
		}
	});
	context.subscriptions.push(zipDisposable)
}

function deactivate() {}
module.exports = {
	activate,
	deactivate
};
