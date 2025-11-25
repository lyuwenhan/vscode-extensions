const fs = require("fs");
const jsonc = require("jsonc-parser");
const esbuild = require("esbuild");
const content = fs.readFileSync("package.json", "utf8");
const pkg = jsonc.parse(content);
const rid = {
	jsBeautify: "resourceLangId == javascript || resourceLangId == html || resourceLangId == css",
	jsons: "resourceLangId == json || resourceLangId == jsonc || resourceLangId == jsonl"
};
const contr = [{
	command: "minify",
	title: "Minify",
	when: [true, true, ["jsBeautify", "jsons"]]
}, {
	command: "beautify",
	title: "Beautify",
	when: [true, true, ["jsBeautify", "jsons"]]
}, {
	command: "mitify",
	title: "Mitify",
	when: [true, true, ["jsBeautify"], "config.minifier.enableMitify"]
}, {
	command: "sort",
	title: "Sort",
	when: [true, true, ["jsons"]]
}, {
	command: "sortList",
	title: "Sort lists from",
	when: [false, true, ["jsons"]]
}, {
	command: "sortListByKey",
	title: "Sort lists by keys from",
	when: [false, true, ["jsons"]]
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
			"minifier.codeSetting": {
				type: "object",
				default: {
					javascript: {
						minify: {
							compress: false,
							mangle: false,
							format: {
								beautify: false,
								semicolons: true,
								shorthand: true
							}
						},
						beautify: {
							indent_size: 4,
							indent_char: "\t",
							indent_level: 0,
							brace_style: "collapse",
							eol: "\n",
							end_with_newline: true,
							preserve_newlines: false,
							indent_with_tabs: true,
							max_preserve_newlines: 1,
							jslint_happy: false,
							space_after_named_function: false,
							space_after_anon_function: false,
							keep_array_indentation: false,
							keep_function_indentation: false,
							space_before_conditional: true,
							break_chained_methods: false,
							eval_code: false,
							unescape_strings: false,
							wrap_line_length: 0,
							indent_empty_lines: false,
							templating: ["auto"]
						}
					},
					html: {
						minify: {
							collapseWhitespace: true,
							removeComments: true,
							removeEmptyAttributes: true,
							removeTagWhitespace: true,
							removeAttributeQuotes: false,
							removeEmptyElements: false,
							removeRedundantAttributes: false,
							removeOptionalTags: false,
							sortAttributes: false,
							sortClassName: false,
							keepClosingSlash: true,
							processConditionalComments: false,
							ignoreCustomComments: [],
							ignoreCustomFragments: [],
							caseSensitive: false,
							html5: true
						},
						beautify: {
							indent_size: 4,
							indent_char: "\t",
							indent_with_tabs: true,
							eol: "\n",
							end_with_newline: true,
							preserve_newlines: false,
							max_preserve_newlines: 1,
							wrap_line_length: 0,
							indent_inner_html: true,
							indent_empty_lines: false
						}
					},
					css: {
						minify: {
							level: 0
						},
						beautify: {
							indent_size: 4,
							indent_char: "\t",
							indent_with_tabs: true,
							eol: "\n",
							end_with_newline: true,
							newline_between_rules: false,
							selector_separator_newline: false,
							preserve_newlines: false,
							max_preserve_newlines: 1,
							wrap_line_length: 0,
							space_around_combinator: true,
							space_around_selector_separator: true,
							indent_empty_lines: false
						}
					}
				},
				description: "Formatter and Minifier Settings."
			}
		}
	}
};
[true, false].forEach(sel => {
	contr.forEach(e => {
		const command = "minifier." + e.command + (sel ? "Sel" : "");
		let when = e.when[2].map(e => rid[e]).join(" || ");
		if (e.when[3]) {
			when = e.when[3] + " && (" + when + ")"
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
