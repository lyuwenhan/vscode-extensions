const esbuild = require("esbuild");
const fs = require("fs");
if (process.argv.slice(2).includes("--noMin")) {
	fs.promises.mkdir("out", {
		recursive: true
	}).then(() => {
		fs.promises.copyFile("./src/extension.js", "out/extension.js")
	})
} else {
	esbuild.build({
		entryPoints: ["./src/extension.js"],
		bundle: true,
		outfile: "out/extension.js",
		external: ["vscode", "@aws-sdk/client-s3"],
		format: "cjs",
		platform: "node",
		minify: true
	})
}
