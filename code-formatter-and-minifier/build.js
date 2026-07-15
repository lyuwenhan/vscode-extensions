const fs = require("fs");
const jsonc = require("jsonc-parser");
const esbuild = require("esbuild");
const content = fs.readFileSync("package.json", "utf8");
const pkg = jsonc.parse(content);
const rid = {
	jsBeautify: "resourceLangId == javascript || resourceLangId == html || resourceLangId == css || resourceLangId == typescript",
	jsons: "resourceLangId == json || resourceLangId == jsonc || resourceLangId == jsonl",
	java: "resourceLangId == java"
};
const contr = [{
	command: "minify",
	title: "Minify",
	when: [true, ["jsBeautify", "jsons"]]
}, {
	command: "beautify",
	title: "Beautify",
	when: [true, ["jsBeautify", "jsons", "java"]]
}, {
	command: "mitify",
	title: "Mitify",
	when: [true, ["jsBeautify"], "config.minifier.enableMitify"]
}];
const ret = {
	commands: [{
		command: "minifier.generateUuid",
		title: "Generate UUID"
	}, {
		command: "minifier.runAs",
		title: "Run [action] as [language] from current file"
	}, {
		command: "minifier.runAsSel",
		title: "Run [action] as [language] from current selection"
	}],
	menus: {
		"editor/context": [{
			command: "minifier.generateUuid",
			when: "editorTextFocus && (resourceScheme == 'file' || resourceScheme == 'untitled')"
		}],
		commandPalette: [],
		"explorer/context": [],
		"editor/title/context": []
	},
	configuration: {
		title: "Code Formatter & Minifier Settings",
		properties: {
			"minifier.enableMitify": {
				type: "boolean",
				default: true,
				description: "Enable or disable mitify."
			},
			"minifier.enableSortList": {
				type: "boolean",
				default: true,
				description: "Enable or disable sort list."
			},
			"minifier.codeSetting": {
				type: "object",
				default: require("./src/lib/default-setting.json"),
				description: "Formatter and Minifier Settings.",
				required: ["javascript", "typescript", "html", "css"],
				additionalProperties: false,
				properties: {
					javascript: {
						type: "object",
						description: "Options for JavaScript beautify(js-beautify) and minification(terser).",
						properties: {
							minify: {
								type: "object",
								description: "Options for JavaScript minification(terser)"
							},
							beautify: {
								type: "object",
								description: "Options for JavaScript beautify(js-beautify)"
							}
						},
						required: ["minify", "beautify"],
						additionalProperties: false
					},
					typescript: {
						type: "object",
						description: "Options for TypeScript beautify (babel pretty-print + typescript formatter) and minification (@babel/parser + @babel/generator).",
						properties: {
							minify: {
								type: "object",
								description: "Options for TypeScript minification(@babel/generator)"
							},
							beautify: {
								type: "object",
								description: "Options for TypeScript beautify (babel pretty-print, then typescript FormatCodeSettings)"
							}
						},
						required: ["minify", "beautify"],
						additionalProperties: false
					},
					html: {
						type: "object",
						description: "Options for HTML beautify(js-beautify) and minification(html-minifier-terser).",
						properties: {
							minify: {
								type: "object",
								description: "Options for HTML minification(HTML-minifier-terser)"
							},
							beautify: {
								type: "object",
								description: "Options for HTML beautify(js-beautify)"
							}
						},
						required: ["minify", "beautify"],
						additionalProperties: false
					},
					css: {
						type: "object",
						description: "Options for CSS beautify(js-beautify) and minification(terser).",
						properties: {
							minify: {
								type: "object",
								description: "Options for CSS minification(clean-css)"
							},
							beautify: {
								type: "object",
								description: "Options for CSS beautify(js-beautify)"
							}
						},
						required: ["minify", "beautify"],
						additionalProperties: false
					},
					json: {
						type: "object",
						description: "Options for json and jsonL beautify and minification.",
						properties: {
							minify: {
								type: "object",
								description: "Options for JSON minification",
								properties: {
									singleLineSpacing: {
										type: "boolean"
									}
								},
								required: ["singleLineSpacing"],
								additionalProperties: false
							},
							jsonLMinify: {
								type: "object",
								description: "Options for JSON Lines minification",
								properties: {
									singleLineSpacing: {
										type: "boolean"
									}
								},
								required: ["singleLineSpacing"],
								additionalProperties: false
							},
							beautify: {
								type: "object",
								description: "Options for JSON beautify",
								properties: {
									indent: {
										description: "String or number of spaces to use as white space for indenting.",
										oneOf: [{
											type: "string"
										}, {
											type: "number"
										}]
									}
								},
								required: ["indent"],
								additionalProperties: false
							}
						},
						required: ["minify", "jsonLMinify", "beautify"],
						additionalProperties: false
					},
					java: {
						type: "object",
						description: "Options for java beautify.",
						properties: {
							beautify: {
								type: "object",
								description: "Options for Google Java Format.",
								properties: {
									overrideJarPath: {
										type: "string",
										default: "",
										description: "Path to google-java-format all-deps jar."
									},
									javaPath: {
										type: "string",
										default: "java",
										description: "Path to java executable."
									},
									skipRemovingUnusedImports: {
										type: "boolean",
										default: true,
										description: "Do not remove unused imports."
									},
									skipSortingImports: {
										type: "boolean",
										default: false,
										description: "Do not sort imports."
									},
									aosp: {
										type: "boolean",
										default: false,
										description: "Use AOSP style."
									}
								},
								required: ["overrideJarPath", "javaPath", "skipRemovingUnusedImports", "skipSortingImports", "aosp"],
								additionalProperties: false
							}
						},
						required: ["beautify"],
						additionalProperties: false
					},
					excludedDirs: {
						type: "array",
						description: "List of directories to exclude from minification and beautification.",
						items: {
							type: "string"
						}
					}
				}
			}
		}
	}
};
[true, false].forEach(sel => {
	contr.forEach(e => {
		const command = "minifier." + e.command + (sel ? "Sel" : "");
		let when = e.when[1].map(e => rid[e]).join(" || ");
		let when2 = "explorerResourceIsFolder || " + when;
		if (e.when[2]) {
			when = e.when[2] + " && (" + when + ")";
			when2 = e.when[2] + " && (" + when2 + ")"
		}
		ret.commands.push({
			command,
			title: e.title + " current " + (sel ? "selection" : "file")
		});
		ret.menus["editor/context"].push({
			command,
			when: "editorTextFocus && (resourceScheme == 'file' || resourceScheme == 'untitled') && " + (sel ? "" : "!") + "editorHasSelection && (" + when + ")"
		});
		ret.menus.commandPalette.push({
			command,
			when
		});
		if (!sel && e.when[0]) {
			ret.menus["explorer/context"].push({
				command,
				when: when2
			});
			ret.menus["editor/title/context"].push({
				command,
				when
			})
		}
	})
});
ret.commands = ret.commands.map(e => ({
	category: "Minifier",
	...e
}));

function addGroup(e, i, arr) {
	return {
		group: "navigation@" + (100 - arr.length + i),
		...e
	}
} ["editor/context", "explorer/context", "editor/title/context"].forEach(e => {
	ret.menus[e] = ret.menus[e].map(addGroup)
});
pkg.contributes = ret;
fs.writeFileSync("package.json", JSON.stringify(pkg, null, "\t") + "\n");
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
