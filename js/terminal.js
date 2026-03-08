/**
 * terminal.js — xterm.js wrapper for ZDEH
 * Enhancements:
 *  - Ctrl+C / Ctrl+Shift+C → Copy selected text (only cancel if no selection)
 *  - Ctrl+V / Ctrl+Shift+V → Paste from clipboard
 */
const TerminalManager = (function () {
  let term = null;
  let currentLine = '';
  let cursorPos = 0;

  // Approximate character dimensions for the 14px Share Tech Mono font
  const CHAR_WIDTH_PX = 8.4;
  const CHAR_HEIGHT_PX = 17;

  const PROMPT = () => CommandParser.getPrompt();

  function init() {
    term = new Terminal({
      theme: {
        background: '#0a0a0f',
        foreground: '#c8ffc8',
        cursor: '#00ff88',
        cursorAccent: '#0a0a0f',
        selectionBackground: 'rgba(0, 255, 136, 0.3)',
        black: '#1a1a2e',
        red: '#ff4444',
        green: '#44ff88',
        yellow: '#ffd700',
        blue: '#4488ff',
        magenta: '#cc44ff',
        cyan: '#00eeff',
        white: '#c8ffc8',
      },
      fontFamily: '"Share Tech Mono", "Courier New", monospace',
      fontSize: 14,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: 'block',
      scrollback: 1000,
      allowTransparency: false,
    });

    const container = document.getElementById('terminal');
    if (!container) return;
    term.open(container);
    fitTerminal();

    // ── key handler ───────────────────────────────────────────────────────
    term.onKey(({ key, domEvent }) => {
      if (GameState.inDungeon || GameState.flagOverlayVisible) return;

      const ev = domEvent;
      const ctrlKey = ev.ctrlKey;
      const shiftKey = ev.shiftKey;

      // ── Clipboard: Copy ──────────────────────────────────────────────
      // Ctrl+Shift+C always copies; Ctrl+C copies if selection exists, else cancel line
      if (ctrlKey && ev.key === 'C') {
        const selection = term.getSelection();
        if (shiftKey || selection) {
          // Copy selected text
          if (selection && navigator.clipboard) {
            navigator.clipboard.writeText(selection).catch(() => {
              // Clipboard API unavailable (e.g. non-HTTPS context) — silently ignore
            });
          }
          return;
        }
        // No selection → cancel current line (original behaviour)
        term.write('^C\r\n');
        currentLine = '';
        cursorPos = 0;
        showPrompt();
        return;
      }

      // ── Clipboard: Paste ──────────────────────────────────────────────
      // Ctrl+Shift+V or Ctrl+V
      if (ctrlKey && ev.key === 'V') {
        if (navigator.clipboard) {
          navigator.clipboard.readText().then(text => {
            if (text) insertText(text);
          }).catch(() => {
            // Clipboard read requires user permission or HTTPS context
          });
        }
        return;
      }

      // ── Ctrl+L — clear ───────────────────────────────────────────────
      if (ctrlKey && ev.key === 'l') {
        term.write('\x1b[2J\x1b[H');
        showPrompt();
        return;
      }

      // ── Ctrl+A — beginning of line ──────────────────────────────────
      if (ctrlKey && ev.key === 'a') {
        moveCursorTo(0);
        return;
      }

      // ── Ctrl+E — end of line ─────────────────────────────────────────
      if (ctrlKey && ev.key === 'e') {
        moveCursorTo(currentLine.length);
        return;
      }

      // ── Enter ─────────────────────────────────────────────────────────
      if (ev.key === 'Enter') {
        term.write('\r\n');
        processCommand(currentLine);
        currentLine = '';
        cursorPos = 0;
        return;
      }

      // ── Backspace ─────────────────────────────────────────────────────
      if (ev.key === 'Backspace') {
        if (cursorPos > 0) {
          currentLine = currentLine.slice(0, cursorPos - 1) + currentLine.slice(cursorPos);
          cursorPos--;
          rewriteLine();
        }
        return;
      }

      // ── Delete ─────────────────────────────────────────────────────────
      if (ev.key === 'Delete') {
        if (cursorPos < currentLine.length) {
          currentLine = currentLine.slice(0, cursorPos) + currentLine.slice(cursorPos + 1);
          rewriteLine();
        }
        return;
      }

      // ── Arrow keys ────────────────────────────────────────────────────
      if (ev.key === 'ArrowLeft') {
        if (cursorPos > 0) {
          cursorPos--;
          term.write('\x1b[D');
        }
        return;
      }
      if (ev.key === 'ArrowRight') {
        if (cursorPos < currentLine.length) {
          cursorPos++;
          term.write('\x1b[C');
        }
        return;
      }
      if (ev.key === 'ArrowUp') {
        navigateHistory(1);
        return;
      }
      if (ev.key === 'ArrowDown') {
        navigateHistory(-1);
        return;
      }

      // ── Tab completion ────────────────────────────────────────────────
      if (ev.key === 'Tab') {
        ev.preventDefault();
        handleTabComplete();
        return;
      }

      // ── Home / End ────────────────────────────────────────────────────
      if (ev.key === 'Home') { moveCursorTo(0); return; }
      if (ev.key === 'End') { moveCursorTo(currentLine.length); return; }

      // ── Printable characters ──────────────────────────────────────────
      if (key && key.length === 1 && !ctrlKey) {
        currentLine = currentLine.slice(0, cursorPos) + key + currentLine.slice(cursorPos);
        cursorPos++;
        rewriteLine();
      }
    });

    // ── onData for paste events (browser paste) ───────────────────────────
    term.onData(data => {
      if (GameState.inDungeon || GameState.flagOverlayVisible) return;
      // onData can fire for regular keys too; only handle multi-char pastes
      if (data.length > 1) {
        const sanitized = data.replace(/[\r\n]+/g, '').replace(/[^\x20-\x7e]/g, '');
        if (sanitized) insertText(sanitized);
      }
    });

    window.addEventListener('resize', fitTerminal);
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  function insertText(text) {
    const sanitized = text.replace(/[\r\n]+/g, '').replace(/[^\x20-\x7e]/g, '');
    if (!sanitized) return;
    currentLine = currentLine.slice(0, cursorPos) + sanitized + currentLine.slice(cursorPos);
    cursorPos += sanitized.length;
    rewriteLine();
  }

  function moveCursorTo(pos) {
    const diff = pos - cursorPos;
    if (diff === 0) return;
    if (diff > 0) term.write(`\x1b[${diff}C`);
    else term.write(`\x1b[${-diff}D`);
    cursorPos = pos;
  }

  function rewriteLine() {
    // Go to start of line (after prompt), clear to end, rewrite, reposition cursor
    const promptLen = stripAnsi(PROMPT()).length;
    term.write('\r\x1b[K');
    term.write(PROMPT() + currentLine);
    // reposition
    const newCursorCol = promptLen + cursorPos;
    term.write(`\r\x1b[${newCursorCol}C`);
  }

  function stripAnsi(str) {
    return str.replace(/\x1b\[[0-9;]*m/g, '');
  }

  function showPrompt() {
    term.write(PROMPT());
    currentLine = '';
    cursorPos = 0;
  }

  function writeLine(text) {
    term.write(text + '\r\n');
  }

  function writeRaw(text) {
    term.write(text);
  }

  function processCommand(line) {
    line = line.trim();
    if (!line) { showPrompt(); return; }
    CommandParser.execute(line, (out) => term.write(out));
    showPrompt();
  }

  function navigateHistory(dir) {
    const history = GameState.commandHistory;
    if (history.length === 0) return;
    GameState.historyIndex = Math.max(-1, Math.min(history.length - 1, GameState.historyIndex + dir));
    const entry = GameState.historyIndex >= 0 ? history[GameState.historyIndex] : '';
    currentLine = entry;
    cursorPos = currentLine.length;
    rewriteLine();
  }

  function handleTabComplete() {
    const parts = currentLine.split(/\s+/);
    const partial = parts[parts.length - 1] || '';
    const cmd = parts[0];

    if (parts.length === 1) {
      // complete command name
      const allowed = GameState.currentLevel ? GameState.currentLevel.commands : [];
      const matches = allowed.filter(c => c.startsWith(partial));
      if (matches.length === 1) {
        currentLine = matches[0] + ' ';
        cursorPos = currentLine.length;
        rewriteLine();
      } else if (matches.length > 1) {
        term.write('\r\n' + matches.join('  ') + '\r\n');
        showPrompt();
        currentLine = cmd || '';
        cursorPos = currentLine.length;
        term.write(currentLine);
      }
    } else {
      // complete file/dir name
      const res = VirtualFS.ls(null, true);
      if (res.success) {
        const matches = res.entries.filter(e => e.startsWith(partial));
        if (matches.length === 1) {
          parts[parts.length - 1] = matches[0];
          currentLine = parts.join(' ');
          cursorPos = currentLine.length;
          rewriteLine();
        } else if (matches.length > 1) {
          term.write('\r\n' + matches.join('  ') + '\r\n');
          showPrompt();
          term.write(currentLine);
          cursorPos = currentLine.length;
        }
      }
    }
  }

  function fitTerminal() {
    if (!term) return;
    try {
      const container = document.getElementById('terminal');
      if (!container) return;
      const cols = Math.floor(container.offsetWidth / CHAR_WIDTH_PX);
      const rows = Math.floor(container.offsetHeight / CHAR_HEIGHT_PX);
      term.resize(Math.max(40, cols), Math.max(10, rows));
    } catch (e) { /* ignore */ }
  }

  function focus() {
    if (term) term.focus();
  }

  function clear() {
    if (term) term.write('\x1b[2J\x1b[H');
  }

  return { init, showPrompt, writeLine, writeRaw, processCommand, focus, clear, fitTerminal };
})();
