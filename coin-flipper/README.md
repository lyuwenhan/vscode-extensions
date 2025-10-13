# Coin Flipper

A simple, fun, and lightweight **VS Code extension** that lets you flip a virtual coin — complete with **daily statistics** and **automatic reset at midnight**.

This tool is perfect for making quick random decisions right inside your editor. 

---

## Features

### 1. Flip a Coin
- Instantly simulate a coin flip with one click or command.
- Randomly returns either:
  - **Head**
  - **Tail**
- Displays the result in a VS Code popup message with the current attempt number.

Example:
> `Try #5: Head.`  
> or  
> `Try #8: Tail.`

---

### 2. Daily Statistics
- Keeps track of **how many times you flipped heads or tails** for the current day.
- Counter automatically resets **at midnight**.
- You can check today’s stats at any time using the command:
  - `Coin: Show current coin stats`

Example:

> `Today's Coin Stats: 7 Heads and 5 Tails. Heads rate: 58%.`

---

### 3. Reset Stats
- You can manually reset your daily statistics with:
  - `Coin: Reset coin stats`
- Useful if you want to start a fresh round before midnight.
- After reset, the counts for both heads and tails return to zero.

---

## Commands Overview

| Command | Description |
|----------|-------------|
| **Coin: Flip a coin** | Flip a virtual coin and display the result. |
| **Coin: Show current coin stats** | Show today’s number of heads/tails and win rate. |
| **Coin: Reset coin stats** | Manually clear today’s statistics. |

You can access all commands from the **Command Palette** (`Ctrl+Shift+P` / `Cmd+Shift+P`) or through the **Editor Title menu**.

---

## Daily Auto Reset
- All statistics reset automatically at **midnight (00:00)** local time (“Midnight is based on your local system time.”).
- No manual clearing required.
- The extension calculates the next reset time each time you flip or check the stats.

---

## Installation

1. Open **VS Code**.
2. Go to **Extensions** (`Ctrl+Shift+X` / `Cmd+Shift+X`).
3. Search for **"Coin Flipper"** by `lyuwenhan`.
4. Click **Install**.
5. Run commands from the palette or title menu.

---

## Use Cases

- Making random yes/no decisions.  
- Deciding who starts coding or reviewing.  
- Running quick “luck” draws during team discussions.  
- Stress relief while working.

---

## Technical Notes

- Built with **Node.js + VS Code API**.
- Uses `globalState` to persist per-day coin stats.
- Automatically reinitializes stats every day.
- No external dependencies or network access — completely local and lightweight.

---

## License

MIT License © 2025 **lyuwenhan**
