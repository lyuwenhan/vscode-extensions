const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");

function getCommonAncestor(paths) {
	const parsed = paths.map(p => path.parse(p));
	const roots = new Set(parsed.map(p => p.root));
	if (roots.size !== 1) return null;
	const rels = parsed.map(p => p.dir);
	const segments = rels.map(r => r.split(path.sep).filter(Boolean));
	const minLen = Math.min(...segments.map(s => s.length));
	const common = [];
	for (let i = 0; i < minLen; i++) {
		const part = segments[0][i];
		if (segments.every(s => s[i] === part)) {
			common.push(part)
		} else {
			break
		}
	}
	return common.length === 0 ? parsed[0].root : path.join(parsed[0].root, ...common)
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
				const commonRoot = getCommonAncestor(inputPaths);
				if (!commonRoot) {
					throw new Error("Zipper: Selected files are on different drives")
				}
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
				for (const fullPath of inputPaths) {
					const stats = await fs.promises.lstat(fullPath);
					const zipBaseName = commonRoot ? path.relative(commonRoot, fullPath) : path.basename(fullPath);
					if (stats.isSymbolicLink()) {
						const realPath = await fs.promises.realpath(fullPath);
						archive.file(realPath, {
							name: zipBaseName
						})
					} else if (stats.isDirectory()) {
						archive.directory(fullPath, zipBaseName)
					} else if (stats.isFile()) {
						archive.file(fullPath, {
							name: zipBaseName
						})
					}
				}
				await archive.finalize();
				await completion
			});
			vscode.window.showInformationMessage(`Zipper: ZIP created ${finalName}`)
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e));
			console.error(e)
		}
	});
	context.subscriptions.push(zipDisposable)
}

function deactivate() {}
module.exports = {
	activate,
	deactivate
};
