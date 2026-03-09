# ZDEH inside the shell

A browser-based educational game that gamifies learning Linux commands.
You play as an **Apprentice Archivist** navigating the magical Root Library,
typing real Linux commands to solve puzzles and capture Flags.

## 🚀 How to Launch

> **No backend, no npm install, no build step** — runs 100% in the browser.

**Step 1 — Clone the repo**

```bash
git clone https://github.com/Mahdio0/zdeh.git
cd zdeh
```

**Step 2 — Start a local server** (pick any one)

```bash
# Python 3  (pre-installed on macOS & most Linux distros)
python3 -m http.server 8000

# Python 2  (older systems)
python -m SimpleHTTPServer 8000

# Node.js
npx serve .

# VS Code — install the "Live Server" extension, then click "Go Live"
```

**Step 3 — Open in your browser**

```
http://localhost:8000
```

Click **▶ ENTER THE LIBRARY** on the splash screen to begin.

---

## 🎮 How to Play

1. **Read the intro** messages that appear in the terminal at the start of each level.
2. **Type Linux commands** to complete the level's task (use `help` to see what's available).
3. Once all tasks are done the **flag is revealed** in the terminal — copy it carefully.
4. **Submit the flag** in the overlay that pops up to advance to the next level.
5. Repeat for all 10 levels to earn the title of **Master Archivist**.

### Punishment system

| Offence | Consequence |
|---------|-------------|
| Wrong/forbidden command | Strike added |
| 2 strikes | Dictionary thrown at you (−1 HP) |
| 3rd strike | Sent to the **Dungeon of Man Pages** — answer a Linux quiz to escape |
| HP reaches 0 | Expelled — game over |

> Destructive commands (`rm -rf /`, etc.) are always blocked by the Library Protection Spell.

## ⌨️ Controls

| Key | Action |
|-----|--------|
| `Enter` | Execute command |
| `↑ / ↓` | Navigate command history |
| `Tab` | Autocomplete file/command names |
| `Ctrl+L` | Clear terminal |
| `Ctrl+C` | Cancel current line (copies selection if text is selected) |
| `Ctrl+Shift+C` | Copy selected text |
| `Ctrl+V` / `Ctrl+Shift+V` | Paste from clipboard |

## 📚 Levels

Complete each level's task in the terminal to reveal the flag, then submit it to advance.

| # | Name | Main Commands | Task |
|---|------|---------------|------|
| 1 | The Lobby | `pwd`, `ls`, `cat` | Read the note left for you |
| 2 | Main Hall | `ls -a`, `cat` | Discover files hidden behind a dot |
| 3 | Aisle Maze | `cd`, `ls`, `cat` | Navigate to the restricted archive |
| 4 | Restoration Room | `mkdir`, `touch` | Create the required directory structure |
| 5 | Duplication Desk | `cp`, `mv` | Copy and file a manuscript into the vault |
| 6 | Restricted Section | `chmod`, `cat` | Unlock and read a locked tome |
| 7 | Endless Shelf | `grep` | Filter the signal from the noise |
| 8 | Disposal Chute | `rm`, `rmdir`, `cat` | Clear the debris to uncover the archive |
| 9 | Shadow Library | `find`, `ln -s`, `cat` | Locate and link the hidden tome |
| 10 | Root Cellar | `sudo cat` | Prove your mastery to Madam Sudo |

## ✨ Features

- **Flag submission gate** — Flags are never shown in files. Complete the task, read the revealed flag in the terminal, then type it into the submission overlay to advance.
- **Enhanced Player Character** — Wizard robes, glowing staff with particle effects, pointed hat, animated breathing, flowing scarf
- **Enhanced Madam Sudo** — Imposing dark robes, orbiting magical book, glowing red eyes, ornate crown, magical aura particles
- **Flag Discovery Animation** — Book opens on the bookshelf with fanning pages before the submission overlay appears
- **Clipboard Support** — Ctrl+Shift+C to copy, Ctrl+V / Ctrl+Shift+V to paste
- **Directional Walking** — Player walks RIGHT into directories, LEFT on `cd ..`
- Pure HTML / CSS / JS — zero dependencies, zero backend
