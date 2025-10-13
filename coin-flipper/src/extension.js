const vscode = require("vscode");

function getNextMidnightTimestamp () {
	const now = new Date;
	const next = new Date(now);
	next.setHours(24, 0, 0, 0);
	return next.getTime()
}
const coin = {
	set: async (context, heads, tails) => {
		const expireAt = getNextMidnightTimestamp();
		await context.globalState.update("coin_stats", {
			heads,
			tails,
			expireAt
		})
	},
	get: async context => {
		const data = context.globalState.get("coin_stats");
		if (!data) return {
			heads: 0,
			tails: 0
		};
		const {
			heads,
			tails,
			expireAt
		} = data;
		const now = Date.now();
		if (now >= expireAt) {
			const reset = {
				heads: 0,
				tails: 0,
				expireAt: getNextMidnightTimestamp()
			};
			await context.globalState.update("coin_stats", reset);
			return {
				heads: 0,
				tails: 0
			}
		}
		return {
			heads,
			tails
		}
	},
	flip: async context => {
		const stats = await coin.get(context);
		const result = Math.random() < .5;
		const heads = stats.heads + result;
		const tails = stats.tails + !result;
		await coin.set(context, heads, tails);
		return {
			result,
			current: {
				heads,
				tails
			}
		}
	}
};

function activate (context) {
	context.subscriptions.push(vscode.commands.registerCommand("minifier.flipCoin", async () => {
		try {
			const {
				result,
				current
			} = await coin.flip(context);
			if (result) {
				vscode.window.showInformationMessage(`Try #${current.heads+current.tails}: Head.`)
			} else {
				vscode.window.showWarningMessage(`Try #${current.heads+current.tails}: Tail.`)
			}
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e))
		}
	}), vscode.commands.registerCommand("minifier.flipCoin.currentState", async () => {
		try {
			const stats = await coin.get(context);
			if (!stats.heads && !stats.tails) {
				vscode.window.showWarningMessage("No coins have been flipped yet today.");
				return
			}
			vscode.window.showInformationMessage(`Today's Coin Stats: ${stats.heads} Heads and ${stats.tails} Tails. Heads rate: ${Math.round(100*stats.heads/(stats.heads+stats.tails))}%`)
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e))
		}
	}), vscode.commands.registerCommand("minifier.flipCoin.reset", async () => {
		try {
			const stats = await coin.get(context);
			if (!stats.heads && !stats.tails) {
				vscode.window.showWarningMessage("No coins have been flipped yet today.");
				return
			}
			await coin.set(context, 0, 0);
			vscode.window.showWarningMessage("Coin stats have been reset for today.")
		} catch (e) {
			vscode.window.showErrorMessage(e.message || String(e))
		}
	}))
}

function deactivate () {}
module.exports = {
	activate,
	deactivate
};
