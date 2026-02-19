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
if (!fs.existsSync(dataDir)) {
	fs.mkdirSync(dataDir, {
		recursive: true
	})
}
const defaultStatus = {
	needsPublish: false,
	majorUp: false,
	minorUp: false,
	useVersion: null
};
let versions = {};
const versionsPath = path.join(dataDir, "versions.json");
if (fs.existsSync(versionsPath)) {
	try {
		versions = JSON.parse(fs.readFileSync(versionsPath, "utf8"))
	} catch (e) {
		console.error(e)
	}
}
const excluded = [".git", ".github", "data", "node_modules", "scripts"];
const dirs = fs.readdirSync(root).filter(d => !excluded.includes(d) && fs.existsSync(path.join(root, d, "status.json")));
(async function() {
	let erro = false;
	for (const dir of dirs) {
		let oldPkg = {};
		console.log(`Loading files in ${dir}...`);
		const extPath = path.join(root, dir);
		const statusFile = path.join(extPath, "status.json");
		const pkgFile = path.join(extPath, "package.json");
		try {
			let status;
			try {
				const raw = fs.readFileSync(statusFile, "utf8") || "{}";
				status = JSON.parse(raw)
			} catch {
				console.warn(`${dir}: invalid or missing status.json, using default.`);
				status = {}
			}
			if (status.needsPublish) {
				console.log(`Building & publishing ${dir}...`);
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
				const extensionsDir = path.join(dataDir, "extensions");
				if (!fs.existsSync(extensionsDir)) {
					fs.mkdirSync(extensionsDir, {
						recursive: true
					});
					console.log("Created directory:", extensionsDir)
				}
				const outPath = path.join(extensionsDir, `${pkg.name}-${pkg.version}.vsix`);
				execSync(`npx vsce package --out "${outPath}"`, {
					cwd: extPath,
					stdio: "inherit"
				});
				if (vsMarketToken) {
					erro ||= await retryExec(`npx vsce publish --packagePath "${outPath}" -p ${vsMarketToken}`, {}, 5, 500)
				}
				if (openVsxToken) {
					erro ||= await retryExec(`npx ovsx publish "${outPath}" -p ${openVsxToken}`, {}, 5, 500)
				}
				const extDir = path.join(dataDir, dir);
				fs.mkdirSync(extDir, {
					recursive: true
				});
				const iconPath = path.join(extPath, "media", "icon.png");
				if (fs.existsSync(iconPath)) {
					const targetPath = path.join(extDir, "icon.png");
					fs.copyFileSync(iconPath, targetPath);
					console.log(`Icon copied: ${iconPath} -> ${targetPath}`);
					hasIcon = true
				} else {
					console.warn(`Icon.png not found for ${dir}`)
				}
				const imagesPath = path.join(extPath, "images");
				if (fs.existsSync(imagesPath)) {
					const targetImagesPath = path.join(extDir, "images");
					fs.cpSync(imagesPath, targetImagesPath, {
						recursive: true
					});
					console.log(`Images copied: ${imagesPath} -> ${targetImagesPath}`);
					hasIcon = true
				} else {
					console.warn(`images/ not found for ${dir}`)
				}
				const readmePath = path.join(extPath, "README.md");
				if (fs.existsSync(readmePath)) {
					const targetPath = path.join(extDir, "README.md");
					fs.copyFileSync(readmePath, targetPath);
					console.log(`README copied: ${readmePath} -> ${targetPath}`);
					hasIcon = true
				} else {
					console.warn(`README.md not found for ${dir}`)
				}
				if (!versions[pkg.name]) {
					versions[pkg.name] = {
						versions: [],
						displayName: "",
						description: ""
					}
				}
				versions[pkg.name].versions.push(pkg.version);
				versions[pkg.name].displayName = pkg.displayName;
				versions[pkg.name].description = pkg.description;
				console.log(`${dir} published successfully.`)
			} else {
				console.log(`Skip ${dir}: no new content`)
			}
			fs.writeFileSync(statusFile, JSON.stringify(defaultStatus, null, "\t") + "\n", "utf8")
		} catch (err) {
			erro = true;
			console.error(`Failed to publish ${dir}: ${err.message}`);
			fs.writeFileSync(pkgFile, JSON.stringify(oldPkg, null, "\t") + "\n");
			execSync(`npm install`, {
				cwd: extPath,
				stdio: "inherit"
			})
		}
	}
	fs.writeFileSync(versionsPath, JSON.stringify(versions) + "\n");
	if (erro) {
		process.exit(1)
	}
})();
