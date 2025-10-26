const fs = require("fs");
const jsonc = require("jsonc-parser");
const content = fs.readFileSync("package.json", "utf8");
const pkg = jsonc.parse(content);
const rid = {
	js: "resourceLangId == javascript",
	json: "resourceLangId == json || resourceLangId == jsonc",
	jsonl: "resourceLangId == jsonl",
	no: "false"
};
const contr = [{
	command: "generateUuid",
	title: "Generate UUID",
	menus: {
		"editor/context": "",
		commandPalette: ["no"]
	}
}, {
	command: "minifySel",
	title: "Minify current selection",
	menus: {
		"editor/context": [true, ["js", "json", "jsonl"]],
		commandPalette: ["js", "json", "jsonl"]
	}
}, {
	command: "beautifySel",
	title: "Beautify current selection",
	menus: {
		"editor/context": [true, ["js", "json", "jsonl"]],
		commandPalette: ["js", "json", "jsonl"]
	}
}, {
	command: "mitifySel",
	title: "Mitify current selection",
	menus: {
		"editor/context": [true, ["js"]],
		commandPalette: ["js"]
	}
}, {
	command: "sortSel",
	title: "Sort current selection",
	menus: {
		"editor/context": [true, ["json"]],
		commandPalette: ["json"]
	}
}, {
	command: "minify",
	title: "Minify current file",
	menus: {
		"editor/context": [false, ["js", "json", "jsonl"]],
		commandPalette: ["js", "json", "jsonl"],
		"explorer/context": ["js", "json", "jsonl"],
		"editor/title/context": ["js", "json", "jsonl"]
	}
}, {
	command: "beautify",
	title: "Beautify current file",
	menus: {
		"editor/context": [false, ["js", "json", "jsonl"]],
		commandPalette: ["js", "json", "jsonl"],
		"explorer/context": ["js", "json", "jsonl"],
		"editor/title/context": ["js", "json", "jsonl"]
	}
}, {
	command: "mitify",
	title: "Mitify current file",
	menus: {
		"editor/context": [false, ["js"]],
		commandPalette: ["js"],
		"explorer/context": ["js"],
		"editor/title/context": ["js"]
	}
}, {
	command: "sort",
	title: "Sort current file",
	menus: {
		"editor/context": [false, ["json"]],
		commandPalette: ["json"],
		"explorer/context": ["json"],
		"editor/title/context": ["json"]
	}
}];
const ret = {
	commands: [],
	menus: {
		"editor/context": [],
		commandPalette: [],
		"explorer/context": [],
		"editor/title/context": []
	}
};
contr.forEach((e, i) => {
	const group = "navigation@" + (100 - contr.length + i);
	const command = "minifier." + e.command;
	ret.commands.push({
		command,
		title: e.title,
		category: "Minifier"
	});
	if (e.menus["editor/context"] || e.menus["editor/context"] === "") {
		ret.menus["editor/context"].push({
			command,
			group,
			when: "editorTextFocus && (resourceScheme == 'file' || resourceScheme == 'untitled')" + (e.menus["editor/context"] ? " && " + (e.menus["editor/context"][0] ? "" : "!") + "editorHasSelection && (" + e.menus["editor/context"][1].map(e => rid[e]).join(" || ") + ")" : "")
		})
	}
	if (e.menus.commandPalette) {
		ret.menus.commandPalette.push({
			command,
			when: e.menus.commandPalette.map(e => rid[e]).join(" || ")
		})
	}
	if (e.menus["explorer/context"]) {
		ret.menus["explorer/context"].push({
			command,
			group,
			when: e.menus["explorer/context"].map(e => rid[e]).join(" || ")
		})
	}
	if (e.menus["editor/title/context"]) {
		ret.menus["editor/title/context"].push({
			command,
			group,
			when: e.menus["editor/title/context"].map(e => rid[e]).join(" || ")
		})
	}
});
pkg.contributes = ret;
fs.writeFileSync("package.json", JSON.stringify(pkg, null, "\t"));
