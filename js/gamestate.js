/**
 * gamestate.js — Global game state for ZDEH inside the shell
 */
const GameState = (function () {
  const state = {
    currentLevel: null,
    hp: 5,
    maxHp: 5,
    strikes: 0,
    maxStrikes: 3,
    flagsFound: [],
    playerX: 150,
    playerY: 0,
    playerDirection: 'right',
    playerWalking: false,
    sudoVisible: false,
    sudoAnimation: 'idle',
    commandHistory: [],
    historyIndex: -1,
    inDungeon: false,
    flagOverlayVisible: false,
    lastFlag: null,
  };

  function reset() {
    state.currentLevel = null;
    state.hp = 5;
    state.strikes = 0;
    state.flagsFound = [];
    state.playerX = 150;
    state.playerY = 0;
    state.playerDirection = 'right';
    state.playerWalking = false;
    state.sudoVisible = false;
    state.sudoAnimation = 'idle';
    state.commandHistory = [];
    state.historyIndex = -1;
    state.inDungeon = false;
    state.flagOverlayVisible = false;
    state.lastFlag = null;
  }

  function addStrike() {
    state.strikes = Math.min(state.strikes + 1, state.maxStrikes);
    return state.strikes;
  }

  function resetStrikes() {
    state.strikes = 0;
  }

  function loseHP(amount) {
    state.hp = Math.max(0, state.hp - (amount || 1));
    return state.hp;
  }

  function captureFlag(flag) {
    if (!state.flagsFound.includes(flag)) {
      state.flagsFound.push(flag);
      state.lastFlag = flag;
    }
  }

  function isGameOver() {
    return state.hp <= 0;
  }

  return Object.assign(state, { reset, addStrike, resetStrikes, loseHP, captureFlag, isGameOver });
})();
