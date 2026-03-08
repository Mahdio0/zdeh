/**
 * main.js — Wires everything together for ZDEH inside the shell
 */
(function () {
  // ── DOM refs ──────────────────────────────────────────────────────────────
  const splashScreen   = document.getElementById('splash-screen');
  const gameScreen     = document.getElementById('game-screen');
  const startBtn       = document.getElementById('start-btn');
  const nextLevelBtn   = document.getElementById('next-level-btn');
  const flagOverlay    = document.getElementById('flag-overlay');
  const flagNextBtn    = document.getElementById('flag-next-btn');
  const gameoverOverlay = document.getElementById('gameover-overlay');
  const restartBtn     = document.getElementById('restart-btn');
  const victoryOverlay = document.getElementById('victory-overlay');
  const victoryFlags   = document.getElementById('victory-flags');
  const dungeonOverlay = document.getElementById('dungeon-overlay');

  // ── level init ────────────────────────────────────────────────────────────
  function initLevel(levelId) {
    const level = Levels.find(l => l.id === levelId);
    if (!level) { showVictory(); return; }

    // reset per-level check state
    if (level._checkState) {
      Object.keys(level._checkState).forEach(k => {
        level._checkState[k] = false;
      });
    }

    GameState.currentLevel = level;
    GameState.flagOverlayVisible = false;
    GameState.inDungeon = false;

    VirtualFS.load(level.fs);
    Punishment.updateHUD();

    // Update scene
    document.getElementById('game-screen').style.background = level.sceneBg;

    // Show intro
    showIntro(level.introMessages, () => {
      TerminalManager.focus();
    });
  }

  // ── intro typing effect ───────────────────────────────────────────────────
  function showIntro(messages, onDone) {
    let i = 0;
    function next() {
      if (i >= messages.length) { if (onDone) onDone(); return; }
      TerminalManager.writeLine(messages[i]);
      i++;
      setTimeout(next, 600);
    }
    setTimeout(next, 200);
  }

  // ── victory screen ────────────────────────────────────────────────────────
  function showVictory() {
    if (!victoryOverlay) return;
    if (victoryFlags) {
      victoryFlags.innerHTML = GameState.flagsFound
        .map(f => `<div class="victory-flag">${f}</div>`)
        .join('');
    }
    victoryOverlay.classList.remove('hidden');
  }

  // ── start button ──────────────────────────────────────────────────────────
  if (startBtn) {
    startBtn.addEventListener('click', () => {
      splashScreen.classList.add('hidden');
      gameScreen.classList.remove('hidden');
      GameState.reset();
      setTimeout(() => {
        SceneRenderer.start();
        TerminalManager.init();
        initLevel(1);
        TerminalManager.showPrompt();
      }, 100);
    });
  }

  // ── next level button ─────────────────────────────────────────────────────
  if (nextLevelBtn) {
    nextLevelBtn.addEventListener('click', () => {
      const nextId = GameState.currentLevel ? GameState.currentLevel.id + 1 : 1;
      flagOverlay.classList.add('hidden');
      GameState.flagOverlayVisible = false;
      initLevel(nextId);
      TerminalManager.showPrompt();
      TerminalManager.focus();
    });
  }

  // ── flag overlay next button ──────────────────────────────────────────────
  if (flagNextBtn) {
    flagNextBtn.addEventListener('click', () => {
      const nextId = GameState.currentLevel ? GameState.currentLevel.id + 1 : 1;
      flagOverlay.classList.add('hidden');
      GameState.flagOverlayVisible = false;
      initLevel(nextId);
      TerminalManager.showPrompt();
      TerminalManager.focus();
    });
  }

  // ── restart button ────────────────────────────────────────────────────────
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      gameoverOverlay.classList.add('hidden');
      GameState.reset();
      initLevel(1);
      TerminalManager.clear();
      TerminalManager.showPrompt();
      TerminalManager.focus();
    });
  }

  // ── window resize ─────────────────────────────────────────────────────────
  window.addEventListener('resize', () => {
    SceneRenderer.resize();
    TerminalManager.fitTerminal();
  });
})();
