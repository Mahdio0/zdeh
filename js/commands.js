/**
 * commands.js — Command parser for ZDEH
 * Enhancements:
 *  - cd .. triggers SceneRenderer.triggerWalk('left')
 *  - cd <dir> triggers SceneRenderer.triggerWalk('right')
 *  - showFlagOverlay uses SceneRenderer.triggerFlagBookAnimation for book animation
 */
const CommandParser = (function () {

  function getPrompt() {
    const cwd = VirtualFS.getCwd();
    const cwdName = cwd === '/' ? '~' : cwd.split('/').pop();
    return `\x1b[32m[apprentice@root_library \x1b[36m${cwdName}\x1b[32m]$\x1b[0m `;
  }

  // ── flag overlay ──────────────────────────────────────────────────────────
  function showFlagOverlay(flag) {
    GameState.captureFlag(flag);
    // Mark overlay as visible immediately to block duplicate triggers
    GameState.flagOverlayVisible = true;
    // Step 1: trigger book animation on canvas
    SceneRenderer.triggerFlagBookAnimation(flag, () => {
      // Step 2: after book animation (~2s), write flag to terminal and open submission overlay
      TerminalManager.writeLine('\x1b[33m' + '═'.repeat(40) + '\x1b[0m');
      TerminalManager.writeLine('\x1b[33m🚩 MISSION COMPLETE — FLAG REVEALED:\x1b[0m');
      TerminalManager.writeLine('\x1b[32m' + flag + '\x1b[0m');
      TerminalManager.writeLine('\x1b[33m' + '═'.repeat(40) + '\x1b[0m');
      TerminalManager.writeLine('\x1b[90mSubmit the flag in the overlay to advance.\x1b[0m');

      const overlay = document.getElementById('flag-overlay');
      const flagText = document.getElementById('flag-text');
      const flagInput = document.getElementById('flag-input');
      const flagError = document.getElementById('flag-error');
      const flagNextBtn = document.getElementById('flag-next-btn');
      const flagSubmitArea = document.getElementById('flag-submit-area');
      if (overlay && flagText) {
        flagText.textContent = flag;
        if (flagInput) flagInput.value = '';
        if (flagError) flagError.classList.add('hidden');
        if (flagNextBtn) flagNextBtn.classList.add('hidden');
        if (flagSubmitArea) flagSubmitArea.classList.remove('hidden');
        overlay.classList.remove('hidden');
        if (flagInput) setTimeout(() => flagInput.focus(), 50);
      }
    });
    Punishment.updateHUD();
  }

  // ── help text ─────────────────────────────────────────────────────────────
  function getHelpText() {
    if (!GameState.currentLevel) return 'No level loaded.';
    const cmds = GameState.currentLevel.commands;
    return [
      '\x1b[33mAvailable commands:\x1b[0m',
      cmds.map(c => '  \x1b[36m' + c + '\x1b[0m').join('\n'),
      '\x1b[90mTip: Use Tab for autocompletion, ↑↓ for history\x1b[0m',
    ].join('\n');
  }

  // ── pipe handling ─────────────────────────────────────────────────────────
  function handlePipe(parts, writeCallback) {
    // "cmd args | grep pattern"
    const pipeIdx = parts.indexOf('|');
    if (pipeIdx === -1) return null;
    const leftParts = parts.slice(0, pipeIdx);
    const rightParts = parts.slice(pipeIdx + 1);
    if (rightParts[0] !== 'grep') return null;
    const pattern = rightParts[1];
    if (!pattern) { writeCallback('\x1b[31mgrep: missing pattern\x1b[0m\r\n'); return true; }

    // execute left side to capture output
    let captured = '';
    const fakeWrite = (line) => { captured += line; };
    const cmd = leftParts[0];
    const args = leftParts.slice(1);
    if (cmd === 'cat') {
      const res = VirtualFS.cat(args[0]);
      if (res.success) captured = res.content;
    } else if (cmd === 'ls') {
      const showHidden = args.includes('-a');
      const res = VirtualFS.ls(null, showHidden);
      if (res.success) captured = res.entries.join('\n');
    }

    // grep on captured
    try {
      // Use 'i' only (no 'g') for filter to avoid lastIndex state issues
      const reFilter = new RegExp(pattern, 'i');
      const lines = captured.split('\n').filter(l => reFilter.test(l));
      if (lines.length === 0) {
        writeCallback('\x1b[90m(no match)\x1b[0m\r\n');
      } else {
        // Use 'g' only inside replace (fresh regex per line via arrow function)
        lines.forEach(l => writeCallback(l.replace(new RegExp(pattern, 'gi'), m => `\x1b[31m${m}\x1b[0m`) + '\r\n'));
      }
    } catch (e) {
      writeCallback(`\x1b[31mgrep: invalid pattern: ${pattern}\x1b[0m\r\n`);
    }
    return true;
  }

  // ── sudo handler ──────────────────────────────────────────────────────────
  function handleSudo(args, writeCallback) {
    if (!GameState.currentLevel || GameState.currentLevel.id !== 10) {
      writeCallback('\x1b[31msudo: permission denied — you have not earned root access yet.\x1b[0m\r\n');
      return;
    }
    // Run master quiz before granting sudo
    const overlay = document.getElementById('dungeon-overlay');
    const quizContainer = document.getElementById('quiz-container');
    const dungeonTitle = document.getElementById('dungeon-title');
    if (!overlay || !quizContainer) return;

    if (dungeonTitle) dungeonTitle.textContent = '⚡ ROOT ACCESS QUIZ ⚡';
    overlay.classList.remove('hidden');
    GameState.inDungeon = true;

    QuizSystem.renderMasterQuiz(quizContainer, (passed) => {
      overlay.classList.add('hidden');
      GameState.inDungeon = false;
      if (dungeonTitle) dungeonTitle.textContent = '🔮 Dungeon of Man Pages 🔮';

      if (!passed) {
        writeCallback('\x1b[31msudo: root quiz failed. Access denied.\x1b[0m\r\n');
        return;
      }
      // execute the sub-command with "root" privileges
      const subCmd = args[0];
      const subArgs = args.slice(1);
      if (subCmd === 'cat') {
        const res = VirtualFS.cat(subArgs[0]);
        if (res.success) {
          writeCallback(res.content.replace(/\n/g, '\r\n') + '\r\n');
          const lvl = GameState.currentLevel;
          if (lvl && lvl.checkComplete('sudo', args, res.content)) {
            showFlagOverlay(lvl.flag);
          }
        } else {
          writeCallback(`\x1b[31m${res.error}\x1b[0m\r\n`);
        }
      } else {
        writeCallback('\x1b[33msudo: only "sudo cat <file>" is supported here.\x1b[0m\r\n');
      }
    });
  }

  // ── main execute ─────────────────────────────────────────────────────────
  function execute(input, writeCallback) {
    input = input.trim();
    if (!input) return { output: '', command: '', args: [] };

    // record history
    GameState.commandHistory.unshift(input);
    if (GameState.commandHistory.length > 50) GameState.commandHistory.pop();
    GameState.historyIndex = -1;

    // destructive command check
    if (Punishment.isDestructiveCommand(input)) {
      Punishment.handleStrike('rm', writeCallback);
      writeCallback('\x1b[31mError: Destructive command blocked by the Library Protection Spell!\x1b[0m\r\n');
      return { output: '', command: input, args: [] };
    }

    const parts = input.split(/\s+/);

    // pipe check
    if (parts.includes('|')) {
      const handled = handlePipe(parts, writeCallback);
      if (handled) return { output: '', command: parts[0], args: parts.slice(1) };
    }

    const cmd = parts[0];
    const args = parts.slice(1);

    // sudo special case
    if (cmd === 'sudo') {
      handleSudo(args, writeCallback);
      return { output: '', command: cmd, args };
    }

    // check allowed commands
    if (GameState.currentLevel && !GameState.currentLevel.commands.includes(cmd)) {
      Punishment.handleStrike(cmd, writeCallback);
      return { output: '', command: cmd, args };
    }

    let outputText = '';
    const w = (text) => { writeCallback(text); outputText += text; };

    switch (cmd) {
      case 'pwd': {
        const cwd = VirtualFS.getCwd();
        w(cwd + '\r\n');
        break;
      }

      case 'ls': {
        const showHidden = args.includes('-a');
        const pathArg = args.find(a => !a.startsWith('-'));
        const res = VirtualFS.ls(pathArg || null, showHidden);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        const entries = res.entries;
        if (entries.length === 0) { w('\x1b[90m(empty)\x1b[0m\r\n'); break; }
        entries.forEach(name => {
          const node = VirtualFS.getNode(name);
          if (node && node.type === 'dir') {
            w(`\x1b[36m${name}/\x1b[0m  `);
          } else if (node && node.type === 'symlink') {
            w(`\x1b[35m${name}@\x1b[0m  `);
          } else {
            w(`\x1b[37m${name}\x1b[0m  `);
          }
        });
        w('\r\n');
        break;
      }

      case 'cat': {
        if (!args[0]) { w('\x1b[31mcat: missing file operand\x1b[0m\r\n'); break; }
        const res = VirtualFS.cat(args[0]);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        w(res.content.replace(/\n/g, '\r\n') + '\r\n');
        outputText = res.content;
        break;
      }

      case 'cd': {
        const target = args[0] || '/';
        // Detect going "back" — any path component is '..'
        const isGoingBack = target.split('/').some(part => part === '..');
        const res = VirtualFS.cd(target);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        // Enhancement 1: walk left when going back (cd ..), right otherwise
        if (isGoingBack) {
          SceneRenderer.triggerWalk('left');
        } else {
          SceneRenderer.triggerWalk('right');
        }
        Punishment.updateHUD();
        break;
      }

      case 'mkdir': {
        if (!args[0]) { w('\x1b[31mmkdir: missing operand\x1b[0m\r\n'); break; }
        const res = VirtualFS.mkdir(args[0]);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        break;
      }

      case 'touch': {
        if (!args[0]) { w('\x1b[31mtouch: missing file operand\x1b[0m\r\n'); break; }
        const res = VirtualFS.touch(args[0]);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        break;
      }

      case 'cp': {
        if (args.length < 2) { w('\x1b[31mcp: missing destination\x1b[0m\r\n'); break; }
        const res = VirtualFS.cp(args[0], args[1]);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        break;
      }

      case 'mv': {
        if (args.length < 2) { w('\x1b[31mmv: missing destination\x1b[0m\r\n'); break; }
        const res = VirtualFS.mv(args[0], args[1]);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        break;
      }

      case 'rm': {
        if (!args[0]) { w('\x1b[31mrm: missing operand\x1b[0m\r\n'); break; }
        const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-fr');
        const files = args.filter(a => !a.startsWith('-'));
        for (const f of files) {
          const res = VirtualFS.rm(f, recursive);
          if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); }
        }
        break;
      }

      case 'rmdir': {
        if (!args[0]) { w('\x1b[31mrmdir: missing operand\x1b[0m\r\n'); break; }
        const res = VirtualFS.rmdir(args[0]);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        break;
      }

      case 'chmod': {
        if (args.length < 2) { w('\x1b[31mchmod: missing operand\x1b[0m\r\n'); break; }
        const res = VirtualFS.chmod(args[0], args[1]);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        w(`\x1b[32mPermissions updated: ${args[1]} → ${args[0]}\x1b[0m\r\n`);
        break;
      }

      case 'grep': {
        if (args.length === 0) { w('\x1b[31mgrep: missing pattern\x1b[0m\r\n'); break; }
        const pattern = args[0];
        const file = args[1];
        if (!file) { w('\x1b[31mgrep: no file specified\x1b[0m\r\n'); break; }
        const res = VirtualFS.grep(pattern, file);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        if (res.matches.length === 0) { w('\x1b[90m(no match)\x1b[0m\r\n'); break; }
        try {
          // Create a fresh regex per line to avoid 'g' flag lastIndex issues
          res.matches.forEach(line => {
            w(line.replace(new RegExp(pattern, 'gi'), m => `\x1b[31m${m}\x1b[0m`) + '\r\n');
          });
          outputText = res.matches.join('\n');
        } catch (e) {
          res.matches.forEach(line => w(line + '\r\n'));
        }
        break;
      }

      case 'find': {
        const nameFlag = args.indexOf('-name');
        const nameVal = nameFlag !== -1 ? args[nameFlag + 1] : null;
        const startPath = args.find(a => !a.startsWith('-') && a !== nameVal) || '.';
        const res = VirtualFS.find(startPath, nameVal);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        if (res.results.length === 0) { w('\x1b[90m(no results)\x1b[0m\r\n'); break; }
        res.results.forEach(r => w(r + '\r\n'));
        outputText = res.results.join('\n');
        break;
      }

      case 'ln': {
        const sFlag = args.includes('-s');
        const linkArgs = args.filter(a => !a.startsWith('-'));
        if (linkArgs.length < 2) { w('\x1b[31mln: missing operand\x1b[0m\r\n'); break; }
        const res = VirtualFS.ln(linkArgs[0], linkArgs[1]);
        if (!res.success) { w(`\x1b[31m${res.error}\x1b[0m\r\n`); break; }
        w(`\x1b[32mSymlink created: ${linkArgs[1]} → ${linkArgs[0]}\x1b[0m\r\n`);
        break;
      }

      case 'help': {
        w(getHelpText() + '\r\n');
        break;
      }

      case 'clear': {
        writeCallback('\x1b[2J\x1b[H');
        break;
      }

      default:
        Punishment.handleStrike(cmd, writeCallback);
        break;
    }

    // check level completion
    if (GameState.currentLevel && !GameState.flagOverlayVisible) {
      const lvl = GameState.currentLevel;
      if (lvl.checkComplete(cmd, args, outputText)) {
        setTimeout(() => showFlagOverlay(lvl.flag), 300);
      }
    }

    return { output: outputText, command: cmd, args };
  }

  return { getPrompt, execute, showFlagOverlay };
})();
