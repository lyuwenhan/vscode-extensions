const esbuild = require("esbuild");
const fs = require("fs");
fs.promises.mkdir("out", {
	recursive: true
}).then(() => {
	if (process.argv.slice(2).includes("--noMin")) {
		fs.writeFileSync("out/extension.js", 'module.exports=require("../src/extension.js")', "utf8")
	} else {
		esbuild.build({
			entryPoints: ["./src/extension.js"],
			bundle: true,
			outfile: "out/extension.js",
			external: ["vscode"],
			format: "cjs",
			platform: "node",
			minify: true
		})
	}
});
