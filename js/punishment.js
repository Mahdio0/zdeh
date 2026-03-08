/**
 * punishment.js — Madam Sudo strike/punishment system for ZDEH
 */
const Punishment = (function () {
  const shushMessages = [
    'SILENCE! This is a library!',
    'Shhhhh! You disturb the tomes!',
    'One more mistake, Apprentice...',
    'The books weep at your incompetence.',
    'Quiet! Or face the consequences!',
  ];

  const bookDropMessages = [
    'A dictionary falls on your head! -1 HP',
    'Madam Sudo drops an encyclopedia on you! -1 HP',
    'The Complete Works of Chaos lands on your skull! -1 HP',
  ];

  function showSudoBubble(message, duration) {
    const bubble = document.getElementById('sudo-bubble');
    if (!bubble) return;
    bubble.textContent = message;
    bubble.classList.add('visible');
    GameState.sudoVisible = true;
    GameState.sudoAnimation = 'shush';
    setTimeout(() => {
      bubble.classList.remove('visible');
      GameState.sudoVisible = false;
      GameState.sudoAnimation = 'idle';
    }, duration || 3000);
  }

  function shakeTerminal() {
    const term = document.getElementById('terminal');
    if (!term) return;
    term.classList.add('shake');
    setTimeout(() => term.classList.remove('shake'), 600);
  }

  function flashBorder() {
    const panel = document.getElementById('terminal-panel');
    if (!panel) return;
    panel.classList.add('flash-red');
    setTimeout(() => panel.classList.remove('flash-red'), 800);
  }

  function updateHUD() {
    // HP bar
    const hpFill = document.getElementById('hp-fill');
    if (hpFill) {
      const pct = (GameState.hp / GameState.maxHp) * 100;
      hpFill.style.width = pct + '%';
      hpFill.style.background = pct > 60 ? '#4cff91' : pct > 30 ? '#ffd700' : '#ff4444';
    }
    // Strikes dots
    for (let i = 1; i <= 3; i++) {
      const dot = document.getElementById('strike-dot-' + i);
      if (dot) {
        dot.classList.toggle('active', i <= GameState.strikes);
      }
    }
    // Flags count
    const flagCount = document.getElementById('flag-count');
    if (flagCount) flagCount.textContent = GameState.flagsFound.length;
    // Level name
    const levelName = document.getElementById('hud-level-name');
    if (levelName && GameState.currentLevel) levelName.textContent = GameState.currentLevel.name;
  }

  function enterDungeon(failedCommand, writeCallback) {
    GameState.inDungeon = true;
    const overlay = document.getElementById('dungeon-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    const quizContainer = document.getElementById('quiz-container');
    if (!quizContainer) return;

    const quiz = QuizSystem.getQuiz(failedCommand);
    QuizSystem.renderQuiz(quiz, quizContainer, (correct) => {
      overlay.classList.add('hidden');
      GameState.inDungeon = false;
      if (correct) {
        GameState.resetStrikes();
        writeCallback('\r\n\x1b[32mCorrect! Madam Sudo releases you from the dungeon.\x1b[0m\r\n');
      } else {
        GameState.loseHP();
        writeCallback('\r\n\x1b[31mWrong! You lose 1 HP for failing the quiz.\x1b[0m\r\n');
      }
      updateHUD();
      if (GameState.isGameOver()) {
        showGameOver();
      }
    });
  }

  function showGameOver() {
    const overlay = document.getElementById('gameover-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  function handleStrike(failedCommand, writeCallback) {
    const strikes = GameState.addStrike();
    updateHUD();

    if (strikes === 1) {
      const msg = shushMessages[Math.floor(Math.random() * shushMessages.length)];
      showSudoBubble(msg, 3000);
      shakeTerminal();
      writeCallback('\r\n\x1b[33m⚠ Madam Sudo: "' + msg + '" (Strike 1/3)\x1b[0m\r\n');
    } else if (strikes === 2) {
      GameState.sudoAnimation = 'book_drop';
      const msg = bookDropMessages[Math.floor(Math.random() * bookDropMessages.length)];
      showSudoBubble(msg, 3000);
      flashBorder();
      GameState.loseHP();
      updateHUD();
      writeCallback('\r\n\x1b[31m💥 ' + msg + ' (Strike 2/3)\x1b[0m\r\n');
      if (GameState.isGameOver()) { showGameOver(); return; }
    } else if (strikes >= 3) {
      GameState.sudoAnimation = 'banish';
      showSudoBubble('TO THE DUNGEON WITH YOU!', 2000);
      writeCallback('\r\n\x1b[35m🔮 Madam Sudo banishes you to the Dungeon of Man Pages! (Strike 3/3)\x1b[0m\r\n');
      setTimeout(() => enterDungeon(failedCommand, writeCallback), 1500);
    }
  }

  function isDestructiveCommand(input) {
    const dangerous = [
      /rm\s+.*-[a-z]*r[a-z]*f?[a-z]*\s+\//,   // rm -rf / or rm -fr / etc.
      /rm\s+.*-[a-z]*f[a-z]*r[a-z]*\s+\//,     // rm -fr / variants
      /rm\s+-rf?\s+[~*]/,                        // rm -rf ~ or rm -rf *
      /rm\s+--no-preserve-root/,
      /:\(\)\{.*fork.*\}/,                       // fork bomb
      /dd\s+if=\/dev\/zero/,
      /mkfs/,
      /format\s+c:/,
      />\s*\/dev\/[sh]d[a-z]/,                  // overwriting block devices
    ];
    return dangerous.some(re => re.test(input));
  }

  return { showSudoBubble, shakeTerminal, flashBorder, handleStrike, enterDungeon, updateHUD, isDestructiveCommand };
})();
