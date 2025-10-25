const fs = require("fs");
const jsonc = require("jsonc-parser");
const content = fs.readFileSync("package.json", "utf8");
const pkg = jsonc.parse(content);
const category = "Minifier";
const cmd = "minifier.";
const groupName = "navigation@";
const rid = {
	js: "resourceLangId == javascript",
	json: "resourceLangId == json || resourceLangId == jsonc",
	jsonl: "resourceLangId == jsonl",
	no: "false"
};
const a = {"true":"!editorHasSelection", "false":"editorHasSelection"}
const contr = [{
	command: "generateUuid",
	title: "Generate UUID",
	group: "91",
	menus: {
		"editor/context": "",
		commandPalette: ["no"]
	}
}, {
	command: "minifySel",
	title: "Minify current selection",
	group: "92",
	menus: {
		"editor/context": [true, ["js", "json", "jsonl"]],
		commandPalette: ["js", "json", "jsonl"]
	}
}, {
	command: "beautifySel",
	title: "Beautify current selection",
	group: "93",
	menus: {
		"editor/context": [true, ["js", "json", "jsonl"]],
		commandPalette: ["js", "json", "jsonl"]
	}
}, {
	command: "mitifySel",
	title: "Mitify current selection",
	group: "94",
	menus: {
		"editor/context": [true, ["js"]],
		commandPalette: ["js"]
	}
}, {
	command: "sortSel",
	title: "Sort current selection",
	group: "95",
	menus: {
		"editor/context": [true, ["json"]],
		commandPalette: ["json"]
	}
}, {
	command: "minify",
	title: "Minify current file",
	group: "96",
	menus: {
		"editor/context": [false, ["js", "json", "jsonl"]],
		commandPalette: ["js", "json", "jsonl"],
		"explorer/context": ["js", "json", "jsonl"],
		"editor/title/context": ["js", "json", "jsonl"]
	}
}, {
	command: "beautify",
	title: "Beautify current file",
	group: "97",
	menus: {
		"editor/context": [false, ["js", "json", "jsonl"]],
		commandPalette: ["js", "json", "jsonl"],
		"explorer/context": ["js", "json", "jsonl"],
		"editor/title/context": ["js", "json", "jsonl"]
	}
}, {
	command: "mitify",
	title: "Mitify current file",
	group: "98",
	menus: {
		"editor/context": [false, ["js"]],
		commandPalette: ["js"],
		"explorer/context": ["js"],
		"editor/title/context": ["js"]
	}
}, {
	command: "sort",
	title: "Sort current file",
	group: "99",
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
contr.forEach(e => {
	ret.commands.push({
		command: cmd + e.command,
		title: e.title,
		category: "Minifier"
	});
	if (e.menus["editor/context"] || e.menus["editor/context"] === "") {
		ret.menus["editor/context"].push({
			command: cmd + e.command,
			group: groupName + e.group,
			when: "editorTextFocus && (resourceScheme == 'file' || resourceScheme == 'untitled')" + (e.menus["editor/context"] ? " && " + (e.menus["editor/context"][0] ? "" : "!") + "editorHasSelection && (" + e.menus["editor/context"][1].map(e => rid[e]).join(" || ") + ")" : "")
		})
	}
	if (e.menus.commandPalette) {
		ret.menus.commandPalette.push({
			command: cmd + e.command,
			when: e.menus.commandPalette.map(e => rid[e]).join(" || ")
		})
	}
	if (e.menus["explorer/context"]) {
		ret.menus["explorer/context"].push({
			command: cmd + e.command,
			group: groupName + e.group,
			when: e.menus["explorer/context"].map(e => rid[e]).join(" || ")
		})
	}
	if (e.menus["editor/title/context"]) {
		ret.menus["editor/title/context"].push({
			command: cmd + e.command,
			group: groupName + e.group,
			when: e.menus["editor/title/context"].map(e => rid[e]).join(" || ")
		})
	}
});
pkg.contributes = ret;
fs.writeFileSync("package.json", JSON.stringify(pkg, null, "\t"));
