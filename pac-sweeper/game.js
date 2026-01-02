(() => {
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');

  const rowsEl = document.getElementById('rows');
  const colsEl = document.getElementById('cols');
  const bombsEl = document.getElementById('bombs');
  const newGameEl = document.getElementById('newGame');

  /** @type {number} */ let rows;
  /** @type {number} */ let cols;
  /** @type {number} */ let bombCount;

  /** @type {boolean[][]} */ let bombs;
  /** @type {number[][]} */ let counts;
  /** @type {boolean[][]} */ let revealed;
  /** @type {boolean[][]} */ let flagged;
  /** @type {(string|null)[][]} */ let items;

  /** @type {{r:number,c:number}|null} */ let pac = null;
  let alive = true;
  let started = false; // bombs placed after first click (like Minesweeper)
  let revealedSafe = 0;
  let totalSafe = 0;
  let bombsRemaining = 0;

  let defuseCharges = 0;

  /** @type {AudioContext|null} */
  let audioCtx = null;

  function playSound(name) {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});

      const now = audioCtx.currentTime;
      const tone = (freq, dur, offset = 0, type = 'sine', gain = 0.05) => {
        const osc = audioCtx.createOscillator();
        const g = audioCtx.createGain();
        osc.type = type;
        osc.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, now + offset);
        g.gain.exponentialRampToValueAtTime(gain, now + offset + 0.01);
        g.gain.exponentialRampToValueAtTime(0.0001, now + offset + dur);
        osc.connect(g);
        g.connect(audioCtx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + dur + 0.02);
      };

      if (name === 'flag') {
        tone(880, 0.08, 0, 'square', 0.04);
      } else if (name === 'flood') {
        tone(330, 0.10, 0, 'sine', 0.03);
        tone(440, 0.10, 0.10, 'sine', 0.03);
      } else if (name === 'win') {
        tone(523.25, 0.14, 0, 'triangle', 0.05);
        tone(659.25, 0.14, 0.14, 'triangle', 0.05);
        tone(783.99, 0.18, 0.28, 'triangle', 0.05);
      } else if (name === 'die') {
        tone(392.0, 0.14, 0, 'sawtooth', 0.06);
        tone(196.0, 0.16, 0.14, 'sawtooth', 0.06);
        tone(130.81, 0.20, 0.30, 'sawtooth', 0.06);
      } else if (name === 'item') {
        tone(660, 0.09, 0, 'triangle', 0.05);
        tone(880, 0.10, 0.09, 'triangle', 0.05);
      } else if (name === 'defuse') {
        tone(220, 0.10, 0, 'square', 0.05);
        tone(440, 0.14, 0.10, 'square', 0.05);
      }
    } catch {
      // ignore audio errors
    }
  }

  function clampInt(v, min, max, fallback) {
    const n = Number.parseInt(v, 10);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
  }

  function setStatus(msg, kind = '') {
    statusEl.textContent = msg;
    statusEl.className = `status${kind ? ' ' + kind : ''}`;
  }

  function inBounds(r, c) {
    return r >= 0 && r < rows && c >= 0 && c < cols;
  }

  function neighbors8(r, c) {
    const out = [];
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr, nc = c + dc;
        if (inBounds(nr, nc)) out.push([nr, nc]);
      }
    }
    return out;
  }

  let resizeRaf = 0;
  function scheduleResize() {
    if (resizeRaf) cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(() => {
      resizeRaf = 0;
      updateCellSize();
    });
  }

  function updateCellSize() {
    const wrap = boardEl.parentElement;
    if (!wrap) return;

    const wrapStyle = getComputedStyle(wrap);
    const boardStyle = getComputedStyle(boardEl);

    const wrapPadX = parseFloat(wrapStyle.paddingLeft) + parseFloat(wrapStyle.paddingRight);
    const wrapPadY = parseFloat(wrapStyle.paddingTop) + parseFloat(wrapStyle.paddingBottom);
    const boardPadX = parseFloat(boardStyle.paddingLeft) + parseFloat(boardStyle.paddingRight);
    const boardPadY = parseFloat(boardStyle.paddingTop) + parseFloat(boardStyle.paddingBottom);
    const gap = parseFloat(boardStyle.gap) || 6;

    const availW = wrap.clientWidth - wrapPadX - boardPadX;
    const availH = wrap.clientHeight - wrapPadY - boardPadY;
    if (availW <= 0 || availH <= 0) return;

    const sizeW = (availW - gap * (cols - 1)) / cols;
    const sizeH = (availH - gap * (rows - 1)) / rows;

    const size = Math.floor(Math.max(18, Math.min(56, Math.min(sizeW, sizeH))));
    document.documentElement.style.setProperty('--cell-size', `${size}px`);
  }

  function newGame() {
    rows = clampInt(rowsEl.value, 5, 30, 12);
    cols = clampInt(colsEl.value, 5, 40, 18);
    bombCount = clampInt(bombsEl.value, 1, rows * cols - 1, 35);
    bombsEl.value = String(Math.min(bombCount, rows * cols - 1));

    bombs = Array.from({ length: rows }, () => Array(cols).fill(false));
    counts = Array.from({ length: rows }, () => Array(cols).fill(0));
    revealed = Array.from({ length: rows }, () => Array(cols).fill(false));
    flagged = Array.from({ length: rows }, () => Array(cols).fill(false));
    items = Array.from({ length: rows }, () => Array(cols).fill(null));

    pac = null;
    alive = true;
    started = false;
    revealedSafe = 0;
    totalSafe = rows * cols - bombCount;
    bombsRemaining = bombCount;
    defuseCharges = 0;

    renderBoard();
    scheduleResize();
    setStatus('Click any tile to place Pac (bombs are placed after you choose a start).');
  }

  function placeBombs(excludeR, excludeC) {
    const total = rows * cols;
    const excludeIndex = excludeR * cols + excludeC;
    const available = total - 1;
    const need = Math.min(bombCount, available);

    bombsRemaining = need;
    totalSafe = rows * cols - bombsRemaining;

    // Fisher–Yates shuffle of indices (excluding start), then pick first N.
    const idxs = [];
    for (let i = 0; i < total; i++) {
      if (i !== excludeIndex) idxs.push(i);
    }
    for (let i = idxs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [idxs[i], idxs[j]] = [idxs[j], idxs[i]];
    }

    for (let k = 0; k < need; k++) {
      const idx = idxs[k];
      const r = Math.floor(idx / cols);
      const c = idx % cols;
      bombs[r][c] = true;
    }

    recomputeCounts();
    placeItems(excludeR, excludeC);

    started = true;
  }

  function recomputeCounts() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        let n = 0;
        for (const [nr, nc] of neighbors8(r, c)) {
          if (bombs[nr][nc]) n++;
        }
        counts[r][c] = n;
      }
    }
  }

  function itemIcon(type) {
    if (type === 'reveal1') return '🔎';
    if (type === 'reveal2') return '🔍';
    if (type === 'reveal5') return '🗺️';
    if (type === 'defuse') return '🛡️';
    if (type === 'teleport') return '🌀';
    return '✦';
  }

  function placeItems(excludeR, excludeC) {
    const types = ['reveal1','reveal1','reveal1','reveal2','reveal2','reveal5','defuse','teleport'];
    const cells = [];

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (r === excludeR && c === excludeC) continue;
        if (bombs[r][c]) continue;
        cells.push([r, c]);
      }
    }

    for (let i = cells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cells[i], cells[j]] = [cells[j], cells[i]];
    }

    for (let i = 0; i < types.length && i < cells.length; i++) {
      const [r, c] = cells[i];
      items[r][c] = types[i];
    }
  }

  function cellEl(r, c) {
    return boardEl.querySelector(`.cell[data-r="${r}"][data-c="${c}"]`);
  }

  function updateCellDisplay(r, c) {
    const el = cellEl(r, c);
    if (!el) return;

    el.classList.toggle('revealed', revealed[r][c]);
    el.classList.toggle('bomb', revealed[r][c] && bombs[r][c]);
    el.classList.toggle('flagged', flagged[r][c]);

    if (!revealed[r][c]) {
      el.textContent = flagged[r][c] ? '⚑' : '';
      return;
    }

    if (bombs[r][c]) {
      el.textContent = '';
      return;
    }

    if (items[r][c]) {
      el.textContent = itemIcon(items[r][c]);
      return;
    }

    const n = counts[r][c];
    el.textContent = n === 0 ? '' : String(n);
  }

  function revealCell(r, c) {
    if (revealed[r][c] || flagged[r][c]) return false;
    revealed[r][c] = true;
    if (!bombs[r][c]) revealedSafe++;
    updateCellDisplay(r, c);
    return true;
  }

  function updateFlagDisplay(r, c) {
    updateCellDisplay(r, c);
  }

  function toggleFlag(r, c) {
    if (!alive) return;
    if (revealed[r][c]) return;
    if (pac && pac.r === r && pac.c === c) return;

    flagged[r][c] = !flagged[r][c];
    updateFlagDisplay(r, c);
    setStatus(flagged[r][c] ? 'Flag placed.' : 'Flag removed.');
    playSound('flag');
  }

  // Minesweeper-style flood reveal: revealing a 0 (or an item tile) reveals connected empties and border numbers.
  function reveal(r, c) {
    if (revealed[r][c] || flagged[r][c]) return 0;

    if (bombs[r][c]) {
      return revealCell(r, c) ? 1 : 0;
    }

    let revealedNow = 0;
    const stack = [[r, c]];
    while (stack.length) {
      const [cr, cc] = stack.pop();
      if (!inBounds(cr, cc)) continue;
      if (revealed[cr][cc]) continue;
      if (flagged[cr][cc]) continue;
      if (bombs[cr][cc]) continue;

      if (revealCell(cr, cc)) revealedNow++;

      if (counts[cr][cc] === 0 || items[cr][cc]) {
        for (const [nr, nc] of neighbors8(cr, cc)) {
          if (!revealed[nr][nc] && !flagged[nr][nc] && !bombs[nr][nc]) stack.push([nr, nc]);
        }
      }
    }

    return revealedNow;
  }

  function revealAllBombs() {
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (bombs[r][c]) {
          revealed[r][c] = true;
          flagged[r][c] = false;
          updateCellDisplay(r, c);
        }
      }
    }
  }

  function setPac(r, c, dead = false) {
    if (pac) {
      const prev = cellEl(pac.r, pac.c);
      if (prev) prev.classList.remove('pac', 'dead');
    }
    pac = { r, c };
    const el = cellEl(r, c);
    if (el) el.classList.add('pac');
    if (dead && el) el.classList.add('dead');
  }

  function tryMove(dr, dc) {
    if (!alive || !pac) return;

    const nr = pac.r + dr;
    const nc = pac.c + dc;
    if (!inBounds(nr, nc)) return;
    if (flagged[nr][nc]) { setStatus('That tile is flagged. Unflag it to move there.'); return; }

    setPac(nr, nc);

    if (bombs[nr][nc]) {
      if (defuseCharges > 0) {
        defuseCharges--;
        bombs[nr][nc] = false;
        bombsRemaining = Math.max(0, bombsRemaining - 1);
        totalSafe = rows * cols - bombsRemaining;
        flagged[nr][nc] = false;
        recomputeCounts();

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            if (revealed[r][c] && !bombs[r][c]) updateCellDisplay(r, c);
          }
        }

        playSound('defuse');
        const n = reveal(nr, nc);
        if (n > 1) playSound('flood');
        setStatus(`Defused a bomb! Defuses left: ${defuseCharges}.`);
      } else {
        alive = false;
        reveal(nr, nc);
        setPac(nr, nc, true);
        revealAllBombs();
        playSound('die');
        setStatus('Boom! You hit a bomb. Press New Game to try again.', 'bad');
      }
      return;
    }

    const n = reveal(nr, nc);
    if (n > 1) playSound('flood');
    const usedItem = activateItemAt(nr, nc);

    if (revealedSafe >= totalSafe) {
      alive = false;
      playSound('win');
      setStatus('You win! You visited every safe tile.', 'good');
      return;
    }

    if (!usedItem) {
      setStatus(`Safe. Adjacent bombs here: ${counts[nr][nc]}. Safe tiles visited: ${revealedSafe}/${totalSafe}. Shield: ${defuseCharges}.`);
    }
  }

  function activateItemAt(r, c) {
    const type = items[r][c];
    if (!type) return false;

    items[r][c] = null;
    updateCellDisplay(r, c);
    playSound('item');

    if (type === 'reveal1') {
      const got = revealRandomSafeTiles(1);
      setStatus(`Power-up: revealed ${got} safe tile.`);
    } else if (type === 'reveal2') {
      const got = revealRandomSafeTiles(2);
      setStatus(`Power-up: revealed ${got} safe tiles.`);
    } else if (type === 'reveal5') {
      const got = revealRandomSafeTiles(5);
      setStatus(`Power-up: revealed ${got} safe tiles.`);
    } else if (type === 'defuse') {
      defuseCharges++;
      setStatus(`Power-up: gained a shield/defuse (now ${defuseCharges}). Step on a bomb to consume it.`);
    } else if (type === 'teleport') {
      const ok = teleportPac();
      setStatus(ok ? 'Power-up: teleported!' : 'Power-up: teleport failed.');
    }

    if (revealedSafe >= totalSafe) {
      alive = false;
      playSound('win');
      setStatus('You win! You visited every safe tile.', 'good');
    }

    return true;
  }

  function revealRandomSafeTiles(count) {
    const candidates = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (bombs[r][c]) continue;
        if (revealed[r][c]) continue;
        if (flagged[r][c]) continue;
        if (pac && pac.r === r && pac.c === c) continue;
        candidates.push([r, c]);
      }
    }

    for (let i = candidates.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    let revealedTotal = 0;
    for (let i = 0; i < count && i < candidates.length; i++) {
      const [r, c] = candidates[i];
      const n = reveal(r, c);
      revealedTotal += n;
      if (n > 1) playSound('flood');
    }

    return Math.min(count, candidates.length);
  }

  function teleportPac() {
    if (!pac) return false;

    const candidates = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (bombs[r][c]) continue;
        if (flagged[r][c]) continue;
        if (revealed[r][c]) continue;
        if (counts[r][c] !== 0) continue;
        if (pac.r === r && pac.c === c) continue;
        candidates.push([r, c]);
      }
    }
    if (!candidates.length) return false;

    const [tr, tc] = candidates[Math.floor(Math.random() * candidates.length)];
    setPac(tr, tc);
    const n = reveal(tr, tc);
    if (n > 1) playSound('flood');
    activateItemAt(tr, tc);
    return true;
  }

  function renderBoard() {
    boardEl.style.gridTemplateColumns = `repeat(${cols}, var(--cell-size))`;
    boardEl.innerHTML = '';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.role = 'gridcell';
        cell.tabIndex = -1;
        cell.dataset.r = String(r);
        cell.dataset.c = String(c);
        boardEl.appendChild(cell);
      }
    }
  }

  boardEl.addEventListener('click', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const cell = target.closest('.cell');
    if (!(cell instanceof HTMLElement)) return;

    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    if (!Number.isFinite(r) || !Number.isFinite(c)) return;

    if (e.shiftKey) {
      toggleFlag(r, c);
      return;
    }

    if (!pac) {
      if (flagged[r][c]) { setStatus('That tile is flagged. Unflag it to place Pac there.'); return; }
      if (!started) placeBombs(r, c);
      setPac(r, c);
      const n = reveal(r, c);
      if (n > 1) playSound('flood');
      const usedItem = activateItemAt(r, c);
      if (!usedItem) setStatus(`Placed. Adjacent bombs here: ${counts[r][c]}. Shield: ${defuseCharges}.`);
      return;
    }
  });

  boardEl.addEventListener('contextmenu', (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const cell = target.closest('.cell');
    if (!(cell instanceof HTMLElement)) return;

    const r = Number(cell.dataset.r);
    const c = Number(cell.dataset.c);
    if (!Number.isFinite(r) || !Number.isFinite(c)) return;

    e.preventDefault();
    toggleFlag(r, c);
  });

  window.addEventListener('resize', scheduleResize);

  window.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') { e.preventDefault(); tryMove(-1, 0); }
    else if (key === 'arrowdown' || key === 's') { e.preventDefault(); tryMove(1, 0); }
    else if (key === 'arrowleft' || key === 'a') { e.preventDefault(); tryMove(0, -1); }
    else if (key === 'arrowright' || key === 'd') { e.preventDefault(); tryMove(0, 1); }
  }, { passive: false });

  newGameEl.addEventListener('click', newGame);

  newGame();
})();
