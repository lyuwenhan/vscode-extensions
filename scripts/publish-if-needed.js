const fs = require("fs");
const path = require("path");
const {
	execSync
} = require("child_process");
async function retryExec(command, options = {}, maxRetries = 5, initialDelay = 1e3) {
	let delay = initialDelay;
	for (let attempt = 1; attempt <= maxRetries; attempt++) {
		console.log(`  Attempt ${attempt}/${maxRetries}: ${command}`);
		try {
			execSync(command, {
				stdio: "inherit",
				...options
			});
			console.log("  Success.");
			return false
		} catch (err) {
			console.error(`  Failed: ${err.message}`);
			if (attempt === maxRetries) {
				console.error("  Max retries reached. Giving up.");
				return true
			}
			console.log(`  Waiting ${delay}ms before retry...`);
			await new Promise(r => setTimeout(r, delay));
			delay *= 2
		}
	}
	return true
}
const openVsxToken = process.env.OPEN_VSX_TOKEN;
const vsMarketToken = process.env.VS_MARKETPLACE_TOKEN;
const root = process.cwd();
const dataDir = path.join(root, "data");
const distDir = path.join(dataDir, "dist");
const assetsDir = path.join(dataDir, "assets");
fs.mkdirSync(distDir, {
	recursive: true
});
fs.mkdirSync(assetsDir, {
	recursive: true
});
const versionsPath = path.join(dataDir, "versions.json");
let versions = {};
if (fs.existsSync(versionsPath)) {
	try {
		versions = JSON.parse(fs.readFileSync(versionsPath, "utf8"))
	} catch (e) {
		console.error("Invalid versions.json, resetting.")
	}
}
const defaultStatus = {
	needsPublish: false,
	majorUp: false,
	minorUp: false,
	useVersion: null
};
const excluded = [".git", ".github", "data", "node_modules", "scripts"];
const dirs = fs.readdirSync(root).filter(d => !excluded.includes(d) && fs.existsSync(path.join(root, d, "status.json")));
(async function() {
	let hasError = false;
	for (const dir of dirs) {
		let oldPkg = {};
		console.log(`Loading files in ${dir}...`);
		const extensionsDir = path.join(assetsDir, dir);
		fs.mkdirSync(extensionsDir, {
			recursive: true
		});
		const extPath = path.join(root, dir);
		const statusPath = path.join(extPath, "status.json");
		let status = {};
		try {
			try {
				status = JSON.parse(fs.readFileSync(statusPath, "utf8"))
			} catch {
				console.warn(`${dir}: invalid or missing status.json, using default.`)
			}
			if (status.needsPublish) {
				console.log(`Building & publishing ${dir}...`);
				const pkgFile = path.join(extPath, "package.json");
				const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
				oldPkg = JSON.parse(JSON.stringify(pkg));
				const [major, minor, patch] = pkg.version.split(".").map(Number);
				if (status.useVersion && typeof status.useVersion === "string") {
					pkg.version = status.useVersion;
					console.log(`Version set manually to ${pkg.version}`)
				} else if (status.majorUp) {
					pkg.version = `${major+1}.0.0`;
					console.log(`Major version bumped to ${pkg.version}`)
				} else if (status.minorUp) {
					pkg.version = `${major}.${minor+1}.0`;
					console.log(`Minor version bumped to ${pkg.version}`)
				} else {
					pkg.version = `${major}.${minor}.${patch+1}`;
					console.log(`Patch version bumped to ${pkg.version}`)
				}
				fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, "\t") + "\n");
				execSync(`npm install`, {
					cwd: extPath,
					stdio: "inherit"
				});
				const outPath = path.join(distDir, `${dir}-${pkg.version}.vsix`);
				execSync(`npx vsce package --out "${outPath}"`, {
					cwd: extPath,
					stdio: "inherit"
				});
				if (vsMarketToken) {
					hasError ||= await retryExec(`npx vsce publish --packagePath "${outPath}" -p ${vsMarketToken}`, {}, 5, 500)
				}
				if (openVsxToken) {
					hasError ||= await retryExec(`npx ovsx publish "${outPath}" -p ${openVsxToken}`, {}, 5, 500)
				}
				const iconPath = path.join(extPath, "media", "icon.png");
				if (fs.existsSync(iconPath)) {
					const targetPath = path.join(extensionsDir, "icon.png");
					fs.copyFileSync(iconPath, targetPath);
					console.log(`Icon copied: ${iconPath} -> ${targetPath}`);
					hasIcon = true
				} else {
					console.warn(`Icon not found for ${dir}`)
				}
				const imagesPath = path.join(extPath, "images");
				if (fs.existsSync(imagesPath)) {
					const targetImagesPath = path.join(extensionsDir, "images");
					fs.rmSync(targetImagesPath, {
						recursive: true,
						force: true
					});
					fs.cpSync(imagesPath, targetImagesPath, {
						recursive: true
					});
					console.log(`Images copied: ${imagesPath} -> ${targetImagesPath}`)
				} else {
					console.warn(`images/ not found for ${dir}`)
				}
				const readmePath = path.join(extPath, "README.md");
				if (fs.existsSync(readmePath)) {
					const targetPath = path.join(extensionsDir, "README.md");
					fs.copyFileSync(readmePath, targetPath);
					console.log(`README copied: ${readmePath} -> ${targetPath}`)
				} else {
					console.warn(`README.md not found for ${dir}`)
				}
				const displayName = pkg.displayName || "";
				const description = pkg.description || "";
				const version = pkg.version || "";
				const isNew = !versions[dir];
				if (!versions[dir]) {
					console.log(`New extension detected: ${dir}`);
					versions[dir] = {
						versions: [version],
						hasIcon,
						displayName,
						description
					}
				} else {
					const v = versions[dir].versions ?? [];
					versions[dir] = {
						versions: v.at(-1) === version ? v : [...v, version],
						hasIcon: hasIcon ?? versions[dir].hasIcon,
						displayName: displayName ?? versions[dir].displayName,
						description: description ?? versions[dir].description
					}
				}
				console.log(`${dir} published successfully.`)
			} else {
				console.log(`Skip ${dir}: no new content`)
			}
			fs.writeFileSync(statusPath, JSON.stringify(defaultStatus, null, "\t") + "\n", "utf8")
		} catch (err) {
			hasError = true;
			console.error(`Failed to publish ${dir}: ${err.message}`);
			console.error(err.stack);
			fs.writeFileSync(pkgFile, JSON.stringify(oldPkg, null, "\t") + "\n");
			execSync(`npm install`, {
				cwd: extPath,
				stdio: "inherit"
			})
		}
	}
	fs.writeFileSync(versionsPath, JSON.stringify(versions) + "\n");
	if (hasError) {
		process.exit(1)
	}
})();
