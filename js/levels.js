/**
 * levels.js — Level definitions for ZDEH inside the shell
 */
const Levels = [
  // ── Level 1 — Lobby ──────────────────────────────────────────────────────
  {
    id: 1,
    name: 'The Lobby',
    description: 'The grand entrance of the Root Library. Dust motes float in beams of light.',
    hint: 'Try: pwd, ls, cat note.txt',
    commands: ['pwd', 'ls', 'cat', 'help', 'clear'],
    flag: 'ZDEH{r34d_th3_n0t3}',
    sceneBg: '#1a0d2e',
    sceneTheme: 'lobby',
    introMessages: [
      'Welcome, Apprentice Archivist...',
      'You stand in the Lobby of the Root Library.',
      'Madam Sudo watches from the shadows.',
      'Type \x1b[33mhelp\x1b[0m to see available commands.',
    ],
    fs: {
      type: 'dir', name: '/', permissions: 'rwxr-xr-x',
      children: {
        'note.txt': { type: 'file', name: 'note.txt', permissions: 'rw-r--r--', content: 'Welcome, Apprentice.\nThe Lobby of the Root Library is your starting point.\nLearn your way around — use pwd, ls, and cat to explore.\nMadam Sudo is watching from the shadows.' },
        'welcome.scroll': { type: 'file', name: 'welcome.scroll', permissions: 'rw-r--r--', content: 'The Root Library holds infinite knowledge.\nNavigate wisely. Madam Sudo is watching.' },
      },
    },
    _checkState: { catDone: false },
    checkComplete(cmdName, args, output) {
      if (cmdName === 'cat' && args[0] === 'note.txt' && output) this._checkState.catDone = true;
      return this._checkState.catDone;
    },
  },

  // ── Level 2 — Main Hall ───────────────────────────────────────────────────
  {
    id: 2,
    name: 'Main Hall',
    description: 'The sweeping main hall with towering shelves. Hidden things lurk here.',
    hint: 'Try: ls -a',
    commands: ['pwd', 'ls', 'cat', 'help', 'clear'],
    flag: 'ZDEH{h1dd3n_d0ts}',
    sceneBg: '#0d1a2e',
    sceneTheme: 'hall',
    introMessages: [
      'You advance to the Main Hall.',
      'Not everything is as visible as it seems...',
      'Hint: some files hide behind a dot.',
    ],
    fs: {
      type: 'dir', name: '/', permissions: 'rwxr-xr-x',
      children: {
        'catalog.txt': { type: 'file', name: 'catalog.txt', permissions: 'rw-r--r--', content: 'Public catalog. Nothing special here.' },
        '.hidden_codex': { type: 'file', name: '.hidden_codex', permissions: 'rw-r--r--', content: 'Shhh... this file is hidden — only visible with ls -a.\nYou have uncovered the secret of hidden files, Apprentice.' },
        '.secret_passage': { type: 'file', name: '.secret_passage', permissions: 'rw-r--r--', content: 'Passage leads deeper...' },
      },
    },
    _checkState: { catDone: false },
    checkComplete(cmdName, args, output) {
      if (cmdName === 'cat' && args[0] === '.hidden_codex' && output) this._checkState.catDone = true;
      return this._checkState.catDone;
    },
  },

  // ── Level 3 — Aisle Maze ──────────────────────────────────────────────────
  {
    id: 3,
    name: 'Aisle Maze',
    description: 'A labyrinth of shelves. You must navigate the directories.',
    hint: 'Try: cd east_wing, then cd restricted, cat flag.txt',
    commands: ['pwd', 'ls', 'cat', 'cd', 'help', 'clear'],
    flag: 'ZDEH{m4st3r_0f_p4ths}',
    sceneBg: '#1a1a0d',
    sceneTheme: 'maze',
    introMessages: [
      'The Aisle Maze stretches before you.',
      'Use \x1b[33mcd\x1b[0m to navigate directories.',
      'Use \x1b[33mcd ..\x1b[0m to go back.',
    ],
    fs: {
      type: 'dir', name: '/', permissions: 'rwxr-xr-x',
      children: {
        'map.txt': { type: 'file', name: 'map.txt', permissions: 'rw-r--r--', content: 'Aisles: east_wing, west_wing\nThe flag is deep within east_wing.' },
        'east_wing': {
          type: 'dir', name: 'east_wing', permissions: 'rwxr-xr-x',
          children: {
            'restricted': {
              type: 'dir', name: 'restricted', permissions: 'rwxr-xr-x',
              children: {
                'flag.txt': { type: 'file', name: 'flag.txt', permissions: 'rw-r--r--', content: '[RESTRICTED ARCHIVE — CLEARANCE GRANTED]\nYou have successfully navigated the maze.\nPath taken: / → east_wing → restricted' },
              },
            },
            'shelf_a.txt': { type: 'file', name: 'shelf_a.txt', permissions: 'rw-r--r--', content: 'Row A — linguistics section.' },
          },
        },
        'west_wing': {
          type: 'dir', name: 'west_wing', permissions: 'rwxr-xr-x',
          children: {
            'dead_end.txt': { type: 'file', name: 'dead_end.txt', permissions: 'rw-r--r--', content: 'Nothing here but dust.' },
          },
        },
      },
    },
    _checkState: { catDone: false },
    checkComplete(cmdName, args, output) {
      if (cmdName === 'cat' && args[0] === 'flag.txt' && output) this._checkState.catDone = true;
      return this._checkState.catDone;
    },
  },

  // ── Level 4 — Restoration Room ────────────────────────────────────────────
  {
    id: 4,
    name: 'Restoration Room',
    description: 'Old tomes need reorganising. Build the required structure.',
    hint: 'mkdir archives, touch archives/flag.txt — but the flag appears after you create both!',
    commands: ['pwd', 'ls', 'cat', 'cd', 'mkdir', 'touch', 'help', 'clear'],
    flag: 'ZDEH{bu1ld3r_0f_f1l3s}',
    sceneBg: '#2e1a0d',
    sceneTheme: 'restoration',
    introMessages: [
      'The Restoration Room awaits your craftsmanship.',
      'Create directories and files to organise the archives.',
      'Hint: \x1b[33mmkdir archives\x1b[0m then \x1b[33mtouch archives/manuscript.txt\x1b[0m',
    ],
    fs: {
      type: 'dir', name: '/', permissions: 'rwxr-xr-x',
      children: {
        'instructions.txt': { type: 'file', name: 'instructions.txt', permissions: 'rw-r--r--', content: 'Task:\n1. Create a directory called "archives"\n2. Create a file called "manuscript.txt" inside it\nComplete both tasks to receive the flag.' },
      },
    },
    _checkState: { dirCreated: false, fileCreated: false },
    checkComplete(cmdName, args, output) {
      if (cmdName === 'mkdir' && args[0] === 'archives') this._checkState.dirCreated = true;
      if (cmdName === 'touch' && args[0] === 'archives/manuscript.txt') this._checkState.fileCreated = true;
      return this._checkState.dirCreated && this._checkState.fileCreated;
    },
  },

  // ── Level 5 — Duplication Desk ────────────────────────────────────────────
  {
    id: 5,
    name: 'Duplication Desk',
    description: 'The scribes copy and move manuscripts all day.',
    hint: 'cp original.txt copy.txt, then mv copy.txt vault/saved.txt',
    commands: ['pwd', 'ls', 'cat', 'cd', 'cp', 'mv', 'help', 'clear'],
    flag: 'ZDEH{c0py_m4st3r}',
    sceneBg: '#0d2e1a',
    sceneTheme: 'desk',
    introMessages: [
      'The Duplication Desk hums with activity.',
      'Use \x1b[33mcp\x1b[0m to copy and \x1b[33mmv\x1b[0m to move files.',
      'Complete the filing task to earn your flag.',
    ],
    fs: {
      type: 'dir', name: '/', permissions: 'rwxr-xr-x',
      children: {
        'original.txt': { type: 'file', name: 'original.txt', permissions: 'rw-r--r--', content: 'This is the original manuscript. Handle with care.' },
        'task.txt': { type: 'file', name: 'task.txt', permissions: 'rw-r--r--', content: 'Task: cp original.txt copy.txt\nThen: mv copy.txt vault/saved.txt' },
        'vault': { type: 'dir', name: 'vault', permissions: 'rwxr-xr-x', children: {} },
      },
    },
    _checkState: { copied: false, moved: false },
    checkComplete(cmdName, args, output) {
      if (cmdName === 'cp') this._checkState.copied = true;
      if (cmdName === 'mv' && (args[1] === 'vault/saved.txt' || args[1] === 'vault')) this._checkState.moved = true;
      return this._checkState.copied && this._checkState.moved;
    },
  },

  // ── Level 6 — Restricted Section ─────────────────────────────────────────
  {
    id: 6,
    name: 'Restricted Section',
    description: 'Access is controlled here. Permissions matter.',
    hint: 'chmod 755 locked_tome.txt then cat locked_tome.txt',
    commands: ['pwd', 'ls', 'cat', 'cd', 'chmod', 'help', 'clear'],
    flag: 'ZDEH{p3rm1ss10n_gr4nt3d}',
    sceneBg: '#2e0d0d',
    sceneTheme: 'restricted',
    introMessages: [
      'The Restricted Section. Access is earned, not given.',
      'Some files are locked. Use \x1b[33mchmod\x1b[0m to unlock them.',
      'Hint: \x1b[33mchmod 755 locked_tome.txt\x1b[0m',
    ],
    fs: {
      type: 'dir', name: '/', permissions: 'rwxr-xr-x',
      children: {
        'locked_tome.txt': { type: 'file', name: 'locked_tome.txt', permissions: '--- --- ---', content: 'FORBIDDEN KNOWLEDGE UNLOCKED\nYou have mastered file permissions, Apprentice.\nThe Restricted Section yields its secrets to you.' },
        'notice.txt': { type: 'file', name: 'notice.txt', permissions: 'rw-r--r--', content: 'Access to locked_tome.txt requires chmod 755.' },
      },
    },
    _checkState: { chmodDone: false, catDone: false },
    checkComplete(cmdName, args, output) {
      if (cmdName === 'chmod') this._checkState.chmodDone = true;
      if (cmdName === 'cat' && args[0] === 'locked_tome.txt' && output) this._checkState.catDone = true;
      return this._checkState.chmodDone && this._checkState.catDone;
    },
  },

  // ── Level 7 — Endless Shelf ───────────────────────────────────────────────
  {
    id: 7,
    name: 'Endless Shelf',
    description: 'Row after row of text. Only grep can find the needle.',
    hint: 'grep ZDEH haystack.txt',
    commands: ['pwd', 'ls', 'cat', 'cd', 'grep', 'help', 'clear'],
    flag: 'ZDEH{f1lt3r_th3_n01s3}',
    sceneBg: '#0d0d2e',
    sceneTheme: 'endless',
    introMessages: [
      'The Endless Shelf stretches to infinity.',
      'Use \x1b[33mgrep\x1b[0m to search for patterns within files.',
      'Find the CLASSIFIED entry hidden in haystack.txt.',
    ],
    fs: {
      type: 'dir', name: '/', permissions: 'rwxr-xr-x',
      children: {
        'haystack.txt': {
          type: 'file', name: 'haystack.txt', permissions: 'rw-r--r--',
          content: Array.from({ length: 30 }, (_, i) =>
            i === 15 ? '[CLASSIFIED: ARCHIVE_ENTRY_LOCATED]' : `noise line ${i + 1} — nothing to see here, move along, apprentice`
          ).join('\n'),
        },
        'hint.txt': { type: 'file', name: 'hint.txt', permissions: 'rw-r--r--', content: 'Use: grep CLASSIFIED haystack.txt' },
      },
    },
    _checkState: { grepDone: false },
    checkComplete(cmdName, args, output) {
      // Complete when grep is run with haystack.txt as the file argument and finds a match
      if (cmdName === 'grep' && args[args.length - 1] === 'haystack.txt' && output) this._checkState.grepDone = true;
      return this._checkState.grepDone;
    },
  },

  // ── Level 8 — Disposal Chute ──────────────────────────────────────────────
  {
    id: 8,
    name: 'Disposal Chute',
    description: 'Old entries must be removed to reveal what lies beneath.',
    hint: 'rm junk1.txt junk2.txt, then rmdir empty_dir, then cat flag.txt',
    commands: ['pwd', 'ls', 'cat', 'cd', 'rm', 'rmdir', 'help', 'clear'],
    flag: 'ZDEH{c0up_d3_gr4c3}',
    sceneBg: '#1a0d0d',
    sceneTheme: 'chute',
    introMessages: [
      'The Disposal Chute.',
      'Clear away the debris to find the flag.',
      'Use \x1b[33mrm\x1b[0m for files and \x1b[33mrmdir\x1b[0m for empty directories.',
    ],
    fs: {
      type: 'dir', name: '/', permissions: 'rwxr-xr-x',
      children: {
        'junk1.txt': { type: 'file', name: 'junk1.txt', permissions: 'rw-r--r--', content: 'DISCARD' },
        'junk2.txt': { type: 'file', name: 'junk2.txt', permissions: 'rw-r--r--', content: 'DISCARD' },
        'empty_dir': { type: 'dir', name: 'empty_dir', permissions: 'rwxr-xr-x', children: {} },
        'flag.txt': { type: 'file', name: 'flag.txt', permissions: 'rw-r--r--', content: '[ARCHIVE RECOVERED]\nThe disposal chute has been cleared. Clean work, Apprentice.' },
      },
    },
    _checkState: { rmDone: false, rmdirDone: false, catDone: false },
    checkComplete(cmdName, args, output) {
      if (cmdName === 'rm') this._checkState.rmDone = true;
      if (cmdName === 'rmdir') this._checkState.rmdirDone = true;
      if (cmdName === 'cat' && args[0] === 'flag.txt' && output) this._checkState.catDone = true;
      return this._checkState.rmDone && this._checkState.rmdirDone && this._checkState.catDone;
    },
  },

  // ── Level 9 — Shadow Library ──────────────────────────────────────────────
  {
    id: 9,
    name: 'Shadow Library',
    description: 'Deep links connect scattered tomes. Find and link them.',
    hint: 'find / -name secret.tome, then ln -s /shadow/secret.tome link.txt, cat link.txt',
    commands: ['pwd', 'ls', 'cat', 'cd', 'find', 'ln', 'help', 'clear'],
    flag: 'ZDEH{l1nk3d_l0c4t0r}',
    sceneBg: '#0d001a',
    sceneTheme: 'shadow',
    introMessages: [
      'The Shadow Library — where lost books drift.',
      'Use \x1b[33mfind\x1b[0m to locate hidden files.',
      'Use \x1b[33mln -s\x1b[0m to create symbolic links.',
    ],
    fs: {
      type: 'dir', name: '/', permissions: 'rwxr-xr-x',
      children: {
        'shadow': {
          type: 'dir', name: 'shadow', permissions: 'rwxr-xr-x',
          children: {
            'secret.tome': { type: 'file', name: 'secret.tome', permissions: 'rw-r--r--', content: '[SHADOW TOME ACCESSED]\nYou found the hidden tome and linked it through the Shadow Library.\nThe symbolic link bridges the void.' },
            'decoy.txt': { type: 'file', name: 'decoy.txt', permissions: 'rw-r--r--', content: 'Not the flag. Keep searching.' },
          },
        },
        'mist': {
          type: 'dir', name: 'mist', permissions: 'rwxr-xr-x',
          children: {
            'fog.txt': { type: 'file', name: 'fog.txt', permissions: 'rw-r--r--', content: 'You can barely see...' },
          },
        },
      },
    },
    _checkState: { found: false, linked: false, catDone: false },
    checkComplete(cmdName, args, output) {
      if (cmdName === 'find') this._checkState.found = true;
      if (cmdName === 'ln') this._checkState.linked = true;
      // Complete when the linked file (link.txt) or the tome itself is read after linking
      if (cmdName === 'cat' && this._checkState.linked && output) this._checkState.catDone = true;
      return this._checkState.found && this._checkState.linked && this._checkState.catDone;
    },
  },

  // ── Level 10 — Root Cellar ────────────────────────────────────────────────
  {
    id: 10,
    name: 'Root Cellar',
    description: 'The deepest vault. Only root can open it.',
    hint: 'sudo cat root_tome.txt',
    commands: ['pwd', 'ls', 'cat', 'cd', 'sudo', 'help', 'clear'],
    flag: 'ZDEH{r00t_4rch1v1st}',
    sceneBg: '#000d1a',
    sceneTheme: 'root',
    introMessages: [
      'The Root Cellar. The final challenge.',
      'Madam Sudo guards the last secret.',
      'Only \x1b[33msudo\x1b[0m can unlock the root tome.',
      'Prove your mastery to earn the title of Master Archivist.',
    ],
    fs: {
      type: 'dir', name: '/', permissions: 'rwxr-xr-x',
      children: {
        'root_tome.txt': { type: 'file', name: 'root_tome.txt', permissions: 'rw-------', content: '[ROOT TOME — CLASSIFIED]\nROOT ACCESS GRANTED.\nCongratulations, Master Archivist.\nYou have proven mastery of all library commands.\nThe Root Cellar yields its final secret.' },
        'warning.txt': { type: 'file', name: 'warning.txt', permissions: 'rw-r--r--', content: 'WARNING: root_tome.txt requires root access.\nUse: sudo cat root_tome.txt' },
      },
    },
    _checkState: { sudoCatDone: false },
    checkComplete(cmdName, args, output) {
      // args[0]='cat', args[1]='root_tome.txt' when called from sudo handler
      if (cmdName === 'sudo' && args[0] === 'cat' && args[1] === 'root_tome.txt' && output) {
        this._checkState.sudoCatDone = true;
      }
      return this._checkState.sudoCatDone;
    },
  },
];
