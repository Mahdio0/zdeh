# ZDEH inside the shell

A browser-based educational game that gamifies learning Linux commands.
You play as an **Apprentice Archivist** navigating the magical Root Library,
typing real Linux commands to solve puzzles and find flags.

## Installation & Running

**Step 1 — Clone the repo**

```bash
git clone https://github.com/Mahdio0/zdeh.git
cd zdeh
```

**Step 2 — Start a local server** (any one of these works)

```bash
# Python 3 (recommended — comes pre-installed on macOS & Linux)
python3 -m http.server 8000

# Python 2 (fallback)
python -m SimpleHTTPServer 8000

# Node.js (if you have it)
npx serve .
```

**Step 3 — Open in your browser**

```
http://localhost:8000
```

> No backend, no npm install, no build step — runs 100% in the browser straight after cloning.

## Game Mechanics

- Type **Linux commands** in the terminal to progress through each level
- Each level teaches a set of commands and requires finding a **flag**
- **Madam Sudo** punishes mistakes:
  - Strike 1: Shush animation + warning
  - Strike 2: Dictionary dropped on you (-1 HP)
  - Strike 3: Sent to the **Dungeon of Man Pages** — answer a quiz to escape
- Destructive commands (`rm -rf /`, etc.) are blocked

## Controls

| Key | Action |
|-----|--------|
| `Enter` | Execute command |
| `↑ / ↓` | Navigate command history |
| `Tab` | Autocomplete |
| `Ctrl+L` | Clear terminal |
| `Ctrl+C` | Cancel line (or copy selection) |
| `Ctrl+Shift+C` | Copy selected text |
| `Ctrl+V` / `Ctrl+Shift+V` | Paste from clipboard |

## Levels

| # | Name | Commands Taught | Flag |
|---|------|-----------------|------|
| 1 | The Lobby | `pwd`, `ls`, `cat` | `ZDEH{r34d_th3_n0t3}` |
| 2 | Main Hall | `ls -a` (hidden files) | `ZDEH{h1dd3n_d0ts}` |
| 3 | Aisle Maze | `cd`, `cd ..` | `ZDEH{m4st3r_0f_p4ths}` |
| 4 | Restoration Room | `mkdir`, `touch` | `ZDEH{bu1ld3r_0f_f1l3s}` |
| 5 | Duplication Desk | `cp`, `mv` | `ZDEH{c0py_m4st3r}` |
| 6 | Restricted Section | `chmod` | `ZDEH{p3rm1ss10n_gr4nt3d}` |
| 7 | Endless Shelf | `grep` | `ZDEH{f1lt3r_th3_n01s3}` |
| 8 | Disposal Chute | `rm`, `rmdir` | `ZDEH{c0up_d3_gr4c3}` |
| 9 | Shadow Library | `find`, `ln -s` | `ZDEH{l1nk3d_l0c4t0r}` |
| 10 | Root Cellar | `sudo` | `ZDEH{r00t_4rch1v1st}` |

## Features

- **Enhanced Player Character** — Wizard robes, glowing staff with particle effects, pointed hat, animated breathing, flowing scarf
- **Enhanced Madam Sudo** — Imposing dark robes, orbiting magical book, glowing red eyes, ornate crown, magical aura particles
- **Flag Discovery Animation** — Book opens on the bookshelf with fanning pages before the capture overlay appears
- **Clipboard Support** — Ctrl+Shift+C to copy, Ctrl+V/Ctrl+Shift+V to paste
- **Directional Walking** — Player walks RIGHT when moving into directories, LEFT when `cd ..`
- Pure HTML/CSS/JS, zero backend