import fs from "fs";
import path from "path";
import {
	execSync
} from "child_process";
const openVsxToken = process.env.OPEN_VSX_TOKEN;
const vsMarketToken = process.env.VS_MARKETPLACE_TOKEN;
const root = ".";
const excluded = ["scripts", ".git", "node_modules"];
const dirs = fs.readdirSync(root).filter(d => !excluded.includes(d) && fs.existsSync(path.join(root, d, "status.json")));
const defaultStatus = {
	needsPublish: false,
	majorUp: false,
	minorUp: false,
	useVersion: null
};
for (const dir of dirs) {
	try {
		console.log(`Loading files in ${dir}...`);
		const extPath = path.join(root, dir);
		const statusFile = path.join(extPath, "status.json");
		const pkgFile = path.join(extPath, "package.json");
		let status;
		try {
			const raw = fs.readFileSync(statusFile, "utf8") || "{}";
			status = JSON.parse(raw)
		} catch {
			console.warn(`${dir}: invalid or missing status.json, using default.`);
			status = {}
		}
		if (!status.needsPublish) {
			console.log(`Skip ${dir}: no new content`);
			fs.writeFileSync(statusFile, JSON.stringify(defaultStatus, null, "\t"), "utf8");
			continue
		}
		console.log(`Building & publishing ${dir}...`);
		const pkg = JSON.parse(fs.readFileSync(pkgFile, "utf8"));
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
		fs.writeFileSync(pkgFile, JSON.stringify(pkg, null, 2));
		execSync(`npx vsce package`, {
			cwd: extPath,
			stdio: "inherit"
		});
		if (vsMarketToken) execSync(`npx vsce publish -p ${vsMarketToken}`, {
			cwd: extPath,
			stdio: "inherit"
		});
		if (openVsxToken) execSync(`npx ovsx publish -p ${openVsxToken}`, {
			cwd: extPath,
			stdio: "inherit"
		});
		fs.writeFileSync(statusFile, JSON.stringify(defaultStatus, null, "\t"), "utf8");
		console.log(`${dir} published successfully.`)
	} catch (err) {
		console.error(`Failed to publish ${dir}: ${err.message}`)
	}
}
