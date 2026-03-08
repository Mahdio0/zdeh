/**
 * scene.js — Canvas 2D scene renderer for ZDEH
 * Features:
 *  - Enhanced "main character" player with wizard robes, glowing staff, hat, animated idle & walk
 *  - Enhanced Madam Sudo with imposing robes, orbiting book, glowing eyes, magical aura
 *  - Flag discovery book-opening animation on bookshelf
 *  - Floating dust particles, bookshelves, background gradient
 */
const SceneRenderer = (function () {
  let canvas, ctx;
  let animFrame = null;
  let tick = 0;

  // ── walk state ──────────────────────────────────────────────────────────
  let playerX = 160;
  const playerBaseY = 0; // relative to floor
  let walkTarget = 160;
  let walking = false;
  let walkDir = 'right';

  // ── flag-book animation state ───────────────────────────────────────────
  let bookAnim = null; // { x, y, phase, tick }

  // ── particles ──────────────────────────────────────────────────────────
  const particles = [];
  function initParticles() {
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * 800,
        y: Math.random() * 200,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -Math.random() * 0.2 - 0.1,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }
  }

  // ── sudo orbit particles ────────────────────────────────────────────────
  const sudoAura = [];
  function initSudoAura() {
    for (let i = 0; i < 12; i++) {
      sudoAura.push({
        angle: (i / 12) * Math.PI * 2,
        r: 48 + Math.random() * 12,
        speed: 0.02 + Math.random() * 0.01,
        size: Math.random() * 3 + 1,
        alpha: Math.random() * 0.7 + 0.3,
        color: Math.random() > 0.5 ? '#cc44ff' : '#ff2266',
      });
    }
  }

  // ── theme colours ───────────────────────────────────────────────────────
  const themes = {
    lobby:       { sky1: '#1a0d2e', sky2: '#2e1a4e', floor: '#3a2a1a', shelf: '#4a3222' },
    hall:        { sky1: '#0d1a2e', sky2: '#1a2e4e', floor: '#2a3a2a', shelf: '#3a4a3a' },
    maze:        { sky1: '#1a1a0d', sky2: '#2e2e1a', floor: '#3a3a1a', shelf: '#4a4a2a' },
    restoration: { sky1: '#2e1a0d', sky2: '#4e2e1a', floor: '#3a2a1a', shelf: '#5a3a1a' },
    desk:        { sky1: '#0d2e1a', sky2: '#1a4e2e', floor: '#1a3a1a', shelf: '#2a4a2a' },
    restricted:  { sky1: '#2e0d0d', sky2: '#4e1a1a', floor: '#3a1a1a', shelf: '#5a2a2a' },
    endless:     { sky1: '#0d0d2e', sky2: '#1a1a4e', floor: '#1a1a3a', shelf: '#2a2a5a' },
    chute:       { sky1: '#1a0d0d', sky2: '#2e1a1a', floor: '#2a1a1a', shelf: '#3a2222' },
    shadow:      { sky1: '#0d001a', sky2: '#1a0033', floor: '#110011', shelf: '#220022' },
    root:        { sky1: '#000d1a', sky2: '#001a33', floor: '#001122', shelf: '#002233' },
  };

  // ── helpers ─────────────────────────────────────────────────────────────
  function getTheme() {
    if (!GameState.currentLevel) return themes.lobby;
    return themes[GameState.currentLevel.sceneTheme] || themes.lobby;
  }

  function floorY() {
    return canvas ? canvas.height - 70 : 200;
  }

  // ── draw background ──────────────────────────────────────────────────────
  function drawBackground(t) {
    const theme = getTheme();
    const W = canvas.width, H = canvas.height;
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, theme.sky1);
    grad.addColorStop(1, theme.sky2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // floor tiles
    const fy = floorY();
    const floorGrad = ctx.createLinearGradient(0, fy, 0, H);
    floorGrad.addColorStop(0, theme.floor);
    floorGrad.addColorStop(1, '#000000');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, fy, W, H - fy);

    // tile lines
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, fy); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = fy; y < H; y += 20) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  // ── draw dust particles ──────────────────────────────────────────────────
  function drawParticles() {
    for (const p of particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = '#fffbe0';
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      p.x += p.vx;
      p.y += p.vy;
      if (p.y < -5) { p.y = floorY() - 10; p.x = Math.random() * canvas.width; }
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
    }
  }

  // ── draw bookshelves ─────────────────────────────────────────────────────
  const bookColors = ['#c0392b','#e67e22','#f1c40f','#2ecc71','#3498db','#9b59b6','#1abc9c','#e74c3c','#d4ac0d','#5dade2'];
  let _flagBookIdx = -1; // which book is "opening"

  function drawBookshelf(x, y, w, h) {
    const theme = getTheme();
    // shelf back
    ctx.fillStyle = theme.shelf;
    ctx.fillRect(x, y, w, h);
    // shelf border
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);

    // books
    const bookW = 14;
    const bookH = h - 12;
    const startX = x + 4;
    let bx = startX;
    let bookIdx = 0;
    while (bx + bookW <= x + w - 4) {
      const color = bookColors[bookIdx % bookColors.length];
      const isFlag = (_flagBookIdx >= 0 && bookIdx === _flagBookIdx % bookColors.length);
      drawBook(bx, y + 6, bookW - 1, bookH, color, isFlag);
      bx += bookW;
      bookIdx++;
    }
  }

  function drawBook(x, y, w, h, color, opening) {
    if (opening && bookAnim) {
      const phase = bookAnim.phase;
      const scale = 1 + Math.sin(phase * Math.PI) * 0.5;
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(scale, scale);
      ctx.translate(-w / 2, -h / 2);
      // glow
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 12 + Math.sin(phase * Math.PI * 3) * 6;
      ctx.fillStyle = '#ffd700';
      ctx.fillRect(0, 0, w, h);
      ctx.shadowBlur = 0;
      // pages fan
      for (let i = 0; i < 5; i++) {
        const angle = (i - 2) * 0.15 * phase * Math.PI;
        ctx.save();
        ctx.translate(w / 2, h);
        ctx.rotate(angle);
        ctx.fillStyle = `rgba(255,255,220,${0.6 + i * 0.05})`;
        ctx.fillRect(-w / 2, -h, w, h);
        ctx.restore();
      }
      ctx.restore();
    } else {
      ctx.fillStyle = color;
      ctx.fillRect(x, y, w, h);
      // spine line
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x, y, 2, h);
      // top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(x, y, w, 3);
    }
  }

  function drawShelves() {
    const W = canvas.width;
    const fy = floorY();
    // background shelves (decorative)
    drawBookshelf(0, fy - 120, W, 55);
    drawBookshelf(0, fy - 60, W, 55);
  }

  // ── draw enhanced player character ───────────────────────────────────────
  function drawPlayer(t) {
    const fy = floorY();
    const px = playerX;
    const breathe = Math.sin(t * 0.05) * 2; // idle breathing
    const py = fy - breathe;

    const dir = walkDir === 'left' ? -1 : 1;

    ctx.save();
    ctx.translate(px, py);
    if (dir === -1) { ctx.scale(-1, 1); }

    const legSwing = walking ? Math.sin(t * 0.18) * 8 : 0;

    // ── cloak/robe (dark blue, gold trim) ────────────────────────────────
    const cloakFlap = walking ? Math.sin(t * 0.18 + 0.5) * 4 : Math.sin(t * 0.04) * 2;
    ctx.fillStyle = '#1a2a6e';
    ctx.beginPath();
    ctx.moveTo(-14, -38);
    ctx.lineTo(-18 + cloakFlap, 0);
    ctx.lineTo(18 - cloakFlap, 0);
    ctx.lineTo(14, -38);
    ctx.closePath();
    ctx.fill();

    // gold trim on cloak
    ctx.strokeStyle = '#d4a017';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-14, -38);
    ctx.lineTo(-18 + cloakFlap, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(14, -38);
    ctx.lineTo(18 - cloakFlap, 0);
    ctx.stroke();
    // hem gold
    ctx.beginPath();
    ctx.moveTo(-18 + cloakFlap, 0);
    ctx.lineTo(18 - cloakFlap, 0);
    ctx.stroke();

    // ── inner body/tunic ────────────────────────────────────────────────
    ctx.fillStyle = '#2a3a8e';
    ctx.fillRect(-9, -38, 18, 30);

    // ── legs ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#1a1a3e';
    ctx.save();
    ctx.translate(-5, -8);
    ctx.rotate((legSwing * Math.PI) / 180);
    ctx.fillRect(-4, 0, 8, 20);
    ctx.restore();
    ctx.save();
    ctx.translate(5, -8);
    ctx.rotate((-legSwing * Math.PI) / 180);
    ctx.fillRect(-4, 0, 8, 20);
    ctx.restore();

    // ── boots ────────────────────────────────────────────────────────────
    ctx.fillStyle = '#3a1a00';
    ctx.save(); ctx.translate(-5, -8); ctx.rotate((legSwing * Math.PI) / 180);
    ctx.fillRect(-5, 16, 10, 6);
    ctx.restore();
    ctx.save(); ctx.translate(5, -8); ctx.rotate((-legSwing * Math.PI) / 180);
    ctx.fillRect(-5, 16, 10, 6);
    ctx.restore();

    // ── arms ────────────────────────────────────────────────────────────
    const armSwing = walking ? Math.sin(t * 0.18 + Math.PI) * 8 : Math.sin(t * 0.04) * 2;
    // left arm (holds staff)
    ctx.fillStyle = '#c8a882';
    ctx.save();
    ctx.translate(-11, -33);
    ctx.rotate((armSwing * Math.PI) / 180);
    ctx.fillRect(-3, 0, 6, 18);
    ctx.restore();
    // right arm
    ctx.save();
    ctx.translate(11, -33);
    ctx.rotate((-armSwing * Math.PI) / 180);
    ctx.fillRect(-3, 0, 6, 18);
    ctx.restore();

    // ── glowing staff ────────────────────────────────────────────────────
    const staffX = -14;
    const staffY = -15;
    ctx.save();
    ctx.translate(staffX, staffY);
    ctx.rotate((armSwing * Math.PI) / 180 * 0.5);
    // staff rod
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -26);
    ctx.stroke();
    // orb glow
    const glowPulse = Math.abs(Math.sin(t * 0.08));
    ctx.shadowColor = '#00eeff';
    ctx.shadowBlur = 8 + glowPulse * 8;
    ctx.fillStyle = '#00eeff';
    ctx.beginPath();
    ctx.arc(0, -28, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    // sparkle particles on staff orb
    for (let i = 0; i < 3; i++) {
      const angle = t * 0.1 + (i * Math.PI * 2) / 3;
      const sr = 7 + Math.sin(t * 0.07 + i) * 2;
      ctx.globalAlpha = 0.6;
      ctx.fillStyle = '#aaffff';
      ctx.beginPath();
      ctx.arc(Math.cos(angle) * sr, -28 + Math.sin(angle) * sr, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // ── neck + head ──────────────────────────────────────────────────────
    ctx.fillStyle = '#c8a882';
    ctx.fillRect(-3, -46, 6, 8);
    ctx.beginPath();
    ctx.arc(0, -52, 9, 0, Math.PI * 2);
    ctx.fillStyle = '#c8a882';
    ctx.fill();

    // face features
    ctx.fillStyle = '#3a2800';
    ctx.fillRect(-4, -54, 2, 2); // left eye
    ctx.fillRect(2, -54, 2, 2);  // right eye

    // glowing cyan eyes
    ctx.shadowColor = '#00eeff';
    ctx.shadowBlur = 5;
    ctx.fillStyle = '#00eeff';
    ctx.fillRect(-4, -54, 2, 2);
    ctx.fillRect(2, -54, 2, 2);
    ctx.shadowBlur = 0;

    // small smile
    ctx.strokeStyle = '#3a2800';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -50, 3, 0.1 * Math.PI, 0.9 * Math.PI);
    ctx.stroke();

    // ── wizard hat ───────────────────────────────────────────────────────
    ctx.fillStyle = '#1a2a6e';
    // brim
    ctx.fillRect(-12, -61, 24, 4);
    // cone
    ctx.beginPath();
    ctx.moveTo(-10, -61);
    ctx.lineTo(0, -84);
    ctx.lineTo(10, -61);
    ctx.closePath();
    ctx.fill();
    // gold band
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(-10, -65, 20, 3);
    // star on hat
    ctx.fillStyle = '#ffd700';
    ctx.font = '7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('★', 0, -70);

    // ── scarf/cape ────────────────────────────────────────────────────────
    const scarfFlap = walking ? Math.sin(t * 0.18 + 1) * 6 : Math.sin(t * 0.04 + 0.5) * 3;
    ctx.strokeStyle = '#cc2200';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(8, -44);
    ctx.quadraticCurveTo(20 + scarfFlap, -38, 18 + scarfFlap * 1.5, -24);
    ctx.stroke();

    ctx.restore();
  }

  // ── draw enhanced Madam Sudo ─────────────────────────────────────────────
  function drawSudo(t) {
    if (!GameState.sudoVisible && GameState.sudoAnimation === 'idle' && tick < 10) return;
    const fy = floorY();
    const sx = canvas.width - 110;
    const sy = fy;

    ctx.save();
    ctx.translate(sx, sy);

    // ── magical aura particles ─────────────────────────────────────────
    for (const p of sudoAura) {
      p.angle += p.speed;
      const ax = Math.cos(p.angle) * p.r;
      const ay = Math.sin(p.angle) * p.r * 0.5 - 50;
      ctx.globalAlpha = p.alpha * (0.5 + 0.5 * Math.sin(t * 0.1 + p.angle));
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(ax, ay, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // ── dark robes ────────────────────────────────────────────────────
    const robeFlap = Math.sin(t * 0.04) * 3;
    // main robe body (tall and imposing)
    ctx.fillStyle = '#1a0033';
    ctx.beginPath();
    ctx.moveTo(-18, -78);
    ctx.lineTo(-24 + robeFlap, 0);
    ctx.lineTo(24 - robeFlap, 0);
    ctx.lineTo(18, -78);
    ctx.closePath();
    ctx.fill();

    // purple/red energy trim
    const energyAlpha = 0.5 + 0.5 * Math.sin(t * 0.1);
    ctx.strokeStyle = `rgba(160, 0, 255, ${energyAlpha})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-18, -78);
    ctx.lineTo(-24 + robeFlap, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18, -78);
    ctx.lineTo(24 - robeFlap, 0);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-24 + robeFlap, 0);
    ctx.lineTo(24 - robeFlap, 0);
    ctx.stroke();

    // ── inner gown ────────────────────────────────────────────────────
    ctx.fillStyle = '#2a003a';
    ctx.fillRect(-12, -78, 24, 60);

    // ── arms (menacing, slightly raised) ─────────────────────────────
    const banishWave = GameState.sudoAnimation === 'banish' ? Math.sin(t * 0.2) * 15 : 0;
    ctx.fillStyle = '#1a0033';
    // left arm
    ctx.save();
    ctx.translate(-16, -65);
    ctx.rotate((-0.3 + banishWave * 0.01) * Math.PI);
    ctx.fillRect(-4, 0, 8, 22);
    ctx.restore();
    // right arm
    ctx.save();
    ctx.translate(16, -65);
    ctx.rotate((0.3 - banishWave * 0.01) * Math.PI);
    ctx.fillRect(-4, 0, 8, 22);
    ctx.restore();

    // ── head (neck) ──────────────────────────────────────────────────
    ctx.fillStyle = '#c0a070';
    ctx.fillRect(-4, -88, 8, 10);
    ctx.beginPath();
    ctx.arc(0, -94, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#c0a070';
    ctx.fill();

    // stern expression
    // eyebrows (furrowed)
    ctx.strokeStyle = '#3a1a00';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, -97); ctx.lineTo(-2, -95);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7, -97); ctx.lineTo(2, -95);
    ctx.stroke();

    // glowing red/purple eyes
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 8 + Math.sin(t * 0.08) * 4;
    ctx.fillStyle = '#ff0066';
    ctx.fillRect(-6, -97, 3, 3);
    ctx.fillRect(3, -97, 3, 3);
    ctx.shadowBlur = 0;

    // stern frown
    ctx.strokeStyle = '#3a1a00';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(0, -89, 4, 1.2 * Math.PI, 1.8 * Math.PI);
    ctx.stroke();

    // glasses
    ctx.strokeStyle = '#888800';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(-4, -96, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(4, -96, 3.5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.5, -96); ctx.lineTo(0.5, -96);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-10.5, -95); ctx.lineTo(-7.5, -95);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(7.5, -95); ctx.lineTo(10.5, -95);
    ctx.stroke();

    // ── ornate crown/headpiece ─────────────────────────────────────────
    ctx.fillStyle = '#4a0066';
    ctx.fillRect(-13, -108, 26, 10);
    // crown spikes
    ctx.fillStyle = '#6600aa';
    for (let i = 0; i < 5; i++) {
      const cx = -10 + i * 5;
      ctx.beginPath();
      ctx.moveTo(cx, -108);
      ctx.lineTo(cx + 2.5, -118);
      ctx.lineTo(cx + 5, -108);
      ctx.closePath();
      ctx.fill();
    }
    // crown gems
    ctx.fillStyle = '#ff2266';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(-10 + i * 5 + 2.5, -110, 2, 0, Math.PI * 2);
      ctx.fill();
    }
    // hairbun replaced by crown wings
    ctx.fillStyle = '#2a0044';
    ctx.beginPath();
    ctx.arc(-14, -105, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath();
    ctx.arc(14, -105, 6, 0, Math.PI * 2); ctx.fill();

    // ── orbiting floating book ────────────────────────────────────────
    const bookAngle = t * 0.04;
    const bookOX = Math.cos(bookAngle) * 38;
    const bookOY = Math.sin(bookAngle) * 18 - 50;
    ctx.save();
    ctx.translate(bookOX, bookOY);
    ctx.rotate(bookAngle * 0.5);
    // book glow
    ctx.shadowColor = '#cc44ff';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#220044';
    ctx.fillRect(-8, -6, 16, 12);
    ctx.strokeStyle = '#aa00ff';
    ctx.lineWidth = 1;
    ctx.strokeRect(-8, -6, 16, 12);
    ctx.fillStyle = '#cc66ff';
    ctx.fillRect(-8, -6, 2, 12);
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── book_drop animation ───────────────────────────────────────────
    if (GameState.sudoAnimation === 'book_drop') {
      const dropY = Math.min(0, -80 + (tick % 30) * 5);
      ctx.save();
      ctx.translate(0, dropY);
      ctx.fillStyle = '#440022';
      ctx.fillRect(-12, -30, 24, 20);
      ctx.strokeStyle = '#ff2266';
      ctx.lineWidth = 2;
      ctx.strokeRect(-12, -30, 24, 20);
      ctx.fillStyle = '#cc00ff';
      ctx.fillRect(-12, -30, 3, 20);
      ctx.restore();
    }

    ctx.restore();
  }

  // ── draw HUD overlay ─────────────────────────────────────────────────────
  function drawOverlay() {
    if (!GameState.currentLevel) return;
    const W = canvas.width;
    // level name bottom-left
    ctx.save();
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.textAlign = 'left';
    ctx.fillText(GameState.currentLevel.name, 10, canvas.height - 8);
    // cwd bottom-right
    ctx.textAlign = 'right';
    ctx.font = '9px "Share Tech Mono", monospace';
    ctx.fillStyle = 'rgba(100,255,200,0.7)';
    ctx.fillText(VirtualFS.getCwd(), W - 10, canvas.height - 8);
    ctx.restore();
  }

  // ── flag book-open animation ──────────────────────────────────────────────
  function drawFlagBookAnim(t) {
    if (!bookAnim) return;
    bookAnim.tick++;
    bookAnim.phase = Math.min(1, bookAnim.tick / 60);

    const fy = floorY();
    const { x, y, flag } = bookAnim;
    const phase = bookAnim.phase;

    // big animated open book
    const bw = 60 + phase * 40;
    const bh = 80 + phase * 20;
    const bx = x - bw / 2;
    const by = y - bh;

    ctx.save();
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20 + Math.sin(t * 0.15) * 10;

    // book cover
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(bx, by, bw, bh);
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 2;
    ctx.strokeRect(bx, by, bw, bh);

    // pages fanning
    for (let i = 0; i < 6; i++) {
      const pageAngle = (i - 3) * 0.1 * phase * Math.PI;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(pageAngle);
      ctx.fillStyle = `rgba(255, 252, 220, ${0.4 + i * 0.08})`;
      ctx.fillRect(-bw / 2 + 4, -bh, bw - 8, bh - 4);
      ctx.restore();
    }

    // flag text inside book
    if (phase > 0.5) {
      const textAlpha = (phase - 0.5) / 0.5;
      ctx.globalAlpha = textAlpha;
      ctx.font = 'bold 8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd700';
      ctx.shadowColor = '#ffd700';
      ctx.shadowBlur = 5;
      ctx.fillText('FLAG FOUND!', x, y - bh / 2 - 10);
      ctx.font = '7px "Share Tech Mono", monospace';
      ctx.fillStyle = '#ffffff';
      ctx.fillText(flag || '', x, y - bh / 2 + 5);
      ctx.globalAlpha = 1;
    }

    ctx.shadowBlur = 0;
    ctx.restore();

    // end animation after ~2 seconds
    if (bookAnim.tick > 120) {
      bookAnim = null;
      _flagBookIdx = -1;
    }
  }

  // ── main render loop ──────────────────────────────────────────────────────
  function render() {
    if (!canvas) return;
    tick++;
    const t = tick;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground(t);
    drawParticles();
    drawShelves();
    drawSudo(t);
    drawPlayer(t);
    drawFlagBookAnim(t);
    drawOverlay();

    // walk interpolation
    if (Math.abs(playerX - walkTarget) > 1) {
      const speed = 2.5;
      if (playerX < walkTarget) { playerX += speed; }
      else { playerX -= speed; }
    } else {
      playerX = walkTarget;
      walking = false;
      GameState.playerWalking = false;
    }

    animFrame = requestAnimationFrame(render);
  }

  // ── public API ────────────────────────────────────────────────────────────
  function start() {
    canvas = document.getElementById('scene-canvas');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    initParticles();
    initSudoAura();
    resize();
    render();
  }

  function stop() {
    if (animFrame) cancelAnimationFrame(animFrame);
    animFrame = null;
  }

  function resize() {
    if (!canvas) return;
    const container = canvas.parentElement;
    canvas.width = container ? container.offsetWidth : 800;
    canvas.height = container ? container.offsetHeight : 260;
  }

  function triggerWalk(direction) {
    walkDir = direction || 'right';
    GameState.playerDirection = walkDir;
    walking = true;
    GameState.playerWalking = true;
    const step = walkDir === 'left' ? -50 : 50;
    walkTarget = Math.max(40, Math.min((canvas ? canvas.width - 120 : 660), playerX + step));
  }

  /**
   * triggerFlagBookAnimation — animates a book opening on the shelf
   * then after ~2s the flag overlay is shown
   */
  function triggerFlagBookAnimation(flag, afterCallback) {
    const fy = floorY();
    // Named constants for shelf layout
    const SHELF_START_X = 80;        // left edge of the shelf books area
    const MAX_BOOK_SLOTS = 6;        // how many book slots to randomise across
    const BOOK_WIDTH = 14;           // width of each book (matches drawBookshelf)
    const BOOK_CENTER_OFFSET = 7;    // half book width for centering
    const TOP_SHELF_OFFSET = 92;     // px above floor to reach top shelf center

    const shelfY = fy - TOP_SHELF_OFFSET;
    const shelfX = SHELF_START_X + Math.floor(Math.random() * MAX_BOOK_SLOTS) * BOOK_WIDTH + BOOK_CENTER_OFFSET;
    _flagBookIdx = Math.floor(Math.random() * 10);
    bookAnim = {
      x: shelfX,
      y: shelfY,
      flag,
      tick: 0,
      phase: 0,
    };
    // show flag overlay after 2s
    setTimeout(() => {
      bookAnim = null;
      _flagBookIdx = -1;
      if (afterCallback) afterCallback();
    }, 2000);
  }

  return { start, stop, resize, triggerWalk, triggerFlagBookAnimation };
})();
