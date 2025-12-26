const esbuild = require("esbuild");
esbuild.build({
	entryPoints: ["./src/extension.js"],
	bundle: true,
	outfile: "out/extension.js",
	external: ["vscode", "@aws-sdk/client-s3"],
	format: "cjs",
	platform: "node",
	minify: true
});
