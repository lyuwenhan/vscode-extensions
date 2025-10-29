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
	when: [false, false, ["js", "json", "jsonl"]]
}, {
	command: "beautifySel",
	title: "Beautify current selection",
	when: [false, false, ["js", "json", "jsonl"]]
}, {
	command: "mitifySel",
	title: "Mitify current selection",
	when: [false, false, ["js"]]
}, {
	command: "sortSel",
	title: "Sort current selection",
	when: [false, false, ["json"]]
}, {
	command: "sortListSel",
	title: "Sort lists (selection)",
	when: [false, false, ["json", "jsonl"]]
}, {
	command: "sortListByKeySel",
	title: "Sort lists by keys (selection)",
	when: [false, false, ["json", "jsonl"]]
}, {
	command: "minify",
	title: "Minify current file",
	when: [true, true, ["js", "json", "jsonl"]]
}, {
	command: "beautify",
	title: "Beautify current file",
	when: [true, true, ["js", "json", "jsonl"]]
}, {
	command: "mitify",
	title: "Mitify current file",
	when: [true, true, ["js"]]
}, {
	command: "sort",
	title: "Sort current file",
	when: [true, true, ["json"]]
}, {
	command: "sortList",
	title: "Sort lists",
	when: [false, true, ["json", "jsonl"]]
}, {
	command: "sortListByKey",
	title: "Sort lists by keys",
	when: [false, true, ["json", "jsonl"]]
}];
const ret = {
	commands: [{
		command: "minifier.generateUuid",
		title: "Generate UUID"
	}],
	menus: {
		"editor/context": [{
			command: "minifier.generateUuid",
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
	const command = "minifier." + e.command;
	const when = e.when[2].map(e => rid[e]).join(" || ");
	ret.commands.push({
		command,
		title: e.title
	});
	ret.menus["editor/context"].push({
		command,
		when: "editorTextFocus && (resourceScheme == 'file' || resourceScheme == 'untitled') && " + (e.when[1] ? "!" : "") + "editorHasSelection && (" + when + ")"
	});
	ret.menus.commandPalette.push({
		command,
		when
	});
	if (e.when[0]) {
		ret.menus["explorer/context"].push({
			command,
			when
		});
		ret.menus["editor/title/context"].push({
			command,
			when
		})
	}
});
ret.commands = ret.commands.map(e => ({
	category: "Minifier",
	...e
}));

function addGroup (e, i, arr) {
	return {
		group: "navigation@" + (100 - arr.length + i),
		...e
	}
} ["editor/context", "explorer/context", "editor/title/context"].forEach(e => {
	ret.menus[e] = ret.menus[e].map(addGroup)
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
