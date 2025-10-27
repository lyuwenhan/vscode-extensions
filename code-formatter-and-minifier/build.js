const fs = require("fs");
const jsonc = require("jsonc-parser");
const esbuild = require("esbuild");
const content = fs.readFileSync("package.json", "utf8");
const pkg = jsonc.parse(content);
const rid = {
	js: "resourceLangId == javascript",
	json: "resourceLangId == json || resourceLangId == jsonc",
	jsonl: "resourceLangId == jsonl",
	yes: "true"
};
const contr = [{
	command: "minifySel",
	title: "Minify current selection",
	when: [false, true, ["js", "json", "jsonl"]]
}, {
	command: "beautifySel",
	title: "Beautify current selection",
	when: [false, true, ["js", "json", "jsonl"]]
}, {
	command: "mitifySel",
	title: "Mitify current selection",
	when: [false, true, ["js"]]
}, {
	command: "sortSel",
	title: "Sort current selection",
	when: [false, true, ["json"]]
}, {
	command: "minify",
	title: "Minify current file",
	when: [true, false, ["js", "json", "jsonl"]]
}, {
	command: "beautify",
	title: "Beautify current file",
	when: [true, false, ["js", "json", "jsonl"]]
}, {
	command: "mitify",
	title: "Mitify current file",
	when: [true, false, ["js"]]
}, {
	command: "sort",
	title: "Sort current file",
	when: [true, false, ["json"]]
}];
const ret = {
	commands: [{
		command: "minifier.generateUuid",
		title: "Generate UUID",
		category: "Minifier"
	}],
	menus: {
		"editor/context": [{
			command: "minifier.generateUuid",
			group: "navigation@91",
			when: "editorTextFocus && (resourceScheme == 'file' || resourceScheme == 'untitled')"
		}],
		commandPalette: [{
			command: "minifier.generateUuid",
			when: "false"
		}],
		"explorer/context": [],
		"editor/title/context": []
	}
};
contr.forEach((e, i) => {
	const group = "navigation@" + (100 - contr.length + i);
	const command = "minifier." + e.command;
	const when = e.when[2].map(e => rid[e]).join(" || ");
	ret.commands.push({
		command,
		title: e.title,
		category: "Minifier"
	});
	ret.menus["editor/context"].push({
		command,
		group,
		when: "editorTextFocus && (resourceScheme == 'file' || resourceScheme == 'untitled') && " + (e.when[1] ? "" : "!") + "editorHasSelection && (" + when + ")"
	});
	ret.menus.commandPalette.push({
		command,
		when
	});
	if (e.when[0]) {
		ret.menus["explorer/context"].push({
			command,
			group,
			when
		});
		ret.menus["editor/title/context"].push({
			command,
			group,
			when
		})
	}
});
pkg.contributes = ret;
fs.writeFileSync("package.json", JSON.stringify(pkg, null, "\t"));
esbuild.build({
	entryPoints: ["./src/extension.js"],
	bundle: true,
	outfile: "out/extension.js",
	external: ["vscode"],
	format: "cjs",
	platform: "node",
	minify: true
});
