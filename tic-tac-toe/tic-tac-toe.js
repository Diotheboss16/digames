document.addEventListener("DOMContentLoaded", () => {
    const boardEl = document.getElementById("board");
    const statusEl = document.getElementById("status");
    const sizeEl = document.getElementById("size");
    const restartEl = document.getElementById("restart");
    const soundToggleEl = document.getElementById("soundToggle");
    const boardWrapEl = document.querySelector(".board-wrap");

    let size = Number(sizeEl.value) || 3;
    let state = Array(size * size).fill("");
    let currentPlayer = "X";
    let gameOver = false;

    let soundEnabled = true;
    let audioCtx = null;

    function ensureAudio() {
        if (!soundEnabled) return null;
        if (!audioCtx) {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return null;
            audioCtx = new Ctx();
        }
        if (audioCtx.state === "suspended") audioCtx.resume();
        return audioCtx;
    }

    function playTone(freq, ms, type = "sine", volume = 0.06, delayMs = 0) {
        const ctx = ensureAudio();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.value = freq;

        const start = ctx.currentTime + delayMs / 1000;
        const end = start + ms / 1000;

        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.0001, end);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(end);
    }

    function sfxMove() {
        playTone(currentPlayer === "X" ? 520 : 420, 60, "triangle", 0.05);
    }

    function sfxWin() {
        playTone(392, 90, "sine", 0.07, 0);
        playTone(523, 90, "sine", 0.07, 90);
        playTone(659, 140, "sine", 0.08, 180);
    }

    function sfxDraw() {
        playTone(330, 120, "sine", 0.06, 0);
        playTone(247, 160, "sine", 0.07, 120);
    }

    function setStatus(text) {
        statusEl.textContent = text;
    }

    function updateLayout() {
        // Fill available space with a square board (account for board-wrap padding).
        const w = boardWrapEl.clientWidth;
        const h = boardWrapEl.clientHeight;
        const cs = getComputedStyle(boardWrapEl);
        const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
        const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
        const innerW = Math.max(0, w - padX);
        const innerH = Math.max(0, h - padY);
        const boardPx = Math.max(220, Math.floor(Math.min(innerW, innerH)));
        boardEl.style.width = `${boardPx}px`;
        boardEl.style.height = `${boardPx}px`;
        boardEl.style.setProperty("--cell-size", `${boardPx / size}px`);
    }

    function buildBoard() {
        boardEl.innerHTML = "";
        boardEl.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement("button");
            cell.type = "button";
            cell.className = "cell";
            cell.dataset.index = String(i);
            cell.setAttribute("role", "gridcell");
            cell.setAttribute("aria-label", `Cell ${i + 1}`);
            boardEl.appendChild(cell);
        }

        requestAnimationFrame(updateLayout);
    }

    function indicesForRow(r) {
        const out = [];
        for (let c = 0; c < size; c++) out.push(r * size + c);
        return out;
    }

    function indicesForCol(c) {
        const out = [];
        for (let r = 0; r < size; r++) out.push(r * size + c);
        return out;
    }

    function indicesForDiag() {
        const out = [];
        for (let i = 0; i < size; i++) out.push(i * size + i);
        return out;
    }

    function indicesForAntiDiag() {
        const out = [];
        for (let i = 0; i < size; i++) out.push(i * size + (size - 1 - i));
        return out;
    }

    function isLineWin(line) {
        return line.every(i => state[i] === currentPlayer);
    }

    function getWinningLine(lastIndex) {
        const r = Math.floor(lastIndex / size);
        const c = lastIndex % size;

        const row = indicesForRow(r);
        if (isLineWin(row)) return row;

        const col = indicesForCol(c);
        if (isLineWin(col)) return col;

        if (r === c) {
            const diag = indicesForDiag();
            if (isLineWin(diag)) return diag;
        }

        if (r + c === size - 1) {
            const anti = indicesForAntiDiag();
            if (isLineWin(anti)) return anti;
        }

        return null;
    }

    function markWinningCells(line) {
        if (!line) return;
        for (const i of line) {
            const el = boardEl.querySelector(`[data-index="${i}"]`);
            if (el) el.classList.add("win");
        }
    }

    function resetGame() {
        state = Array(size * size).fill("");
        currentPlayer = "X";
        gameOver = false;
        setStatus(`Player ${currentPlayer}’s turn`);
        buildBoard();
    }

    function onBoardClick(e) {
        const cell = e.target.closest(".cell");
        if (!cell || gameOver) return;

        const index = Number(cell.dataset.index);
        if (!Number.isFinite(index) || state[index]) return;

        state[index] = currentPlayer;
        cell.textContent = currentPlayer;
        cell.classList.add("filled");
        cell.setAttribute("aria-label", `Cell ${index + 1}: ${currentPlayer}`);

        sfxMove();

        const winLine = getWinningLine(index);
        if (winLine) {
            gameOver = true;
            markWinningCells(winLine);
            setStatus(`Player ${currentPlayer} wins!`);
            sfxWin();
            return;
        }

        if (state.every(v => v)) {
            gameOver = true;
            setStatus("It’s a draw.");
            sfxDraw();
            return;
        }

        currentPlayer = currentPlayer === "X" ? "O" : "X";
        setStatus(`Player ${currentPlayer}’s turn`);
    }

    sizeEl.addEventListener("change", () => {
        size = Number(sizeEl.value) || 3;
        resetGame();
    });

    restartEl.addEventListener("click", resetGame);

    soundToggleEl.addEventListener("click", () => {
        soundEnabled = !soundEnabled;
        soundToggleEl.setAttribute("aria-pressed", String(soundEnabled));
        soundToggleEl.textContent = soundEnabled ? "Sound: On" : "Sound: Off";
        if (soundEnabled) ensureAudio();
    });

    boardEl.addEventListener("click", onBoardClick);
    window.addEventListener("resize", () => requestAnimationFrame(updateLayout));

    resetGame();
});
