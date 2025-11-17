const fs = require("fs");
const jsonc = require("jsonc-parser");
const esbuild = require("esbuild");
const content = fs.readFileSync("package.json", "utf8");
const pkg = jsonc.parse(content);
const rid = {
	js: "resourceLangId == javascript",
	json: "resourceLangId == json || resourceLangId == jsonc",
	jsonl: "resourceLangId == jsonl",
	html: "resourceLangId == html",
	css: "resourceLangId == css",
	yes: "true"
};
const contr = [{
	command: "minify",
	title: "Minify",
	when: [true, true, ["js", "json", "jsonl", "html", "css"]]
}, {
	command: "beautify",
	title: "Beautify",
	when: [true, true, ["js", "json", "jsonl", "html", "css"]]
}, {
	command: "mitify",
	title: "Mitify",
	when: [true, true, ["js", "html", "css"]]
}, {
	command: "sort",
	title: "Sort",
	when: [true, true, ["json", "jsonl"]]
}, {
	command: "sortList",
	title: "Sort lists from",
	when: [false, true, ["json", "jsonl"]]
}, {
	command: "sortListByKey",
	title: "Sort lists by keys from",
	when: [false, true, ["json", "jsonl"]]
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
	}
};
[true, false].forEach(sel => {
	contr.forEach(e => {
		const command = "minifier." + e.command + (sel ? "Sel" : "");
		const when = e.when[2].map(e => rid[e]).join(" || ");
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
				when
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
