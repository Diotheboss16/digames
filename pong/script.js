const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const leftScoreEl = document.getElementById("leftScore");
const rightScoreEl = document.getElementById("rightScore");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("resetBtn");
const speedEl = document.getElementById("speed");
const speedValEl = document.getElementById("speedVal");

const leftTypeEl = document.getElementById("leftType");
const rightTypeEl = document.getElementById("rightType");
const leftAiEl = document.getElementById("leftAi");
const rightAiEl = document.getElementById("rightAi");

function updatePlayerControlsUI() {
  if (leftTypeEl && leftAiEl) leftAiEl.classList.toggle("hidden", leftTypeEl.value !== "ai");
  if (rightTypeEl && rightAiEl) rightAiEl.classList.toggle("hidden", rightTypeEl.value !== "ai");
}
if (leftTypeEl) leftTypeEl.addEventListener("change", updatePlayerControlsUI);
if (rightTypeEl) rightTypeEl.addEventListener("change", updatePlayerControlsUI);
updatePlayerControlsUI();

const WIN_SCORE = 7;
let baseSpeed = speedEl ? parseInt(speedEl.value, 10) : 430;
if (speedEl && speedValEl) {
  speedValEl.textContent = String(baseSpeed);
  speedEl.addEventListener("input", () => {
    baseSpeed = parseInt(speedEl.value, 10);
    speedValEl.textContent = String(baseSpeed);
  });
}

let audioCtx;
function ensureAudio() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (audioCtx.state === "suspended") audioCtx.resume();
}

function playTone(freq, durationMs, type = "sine", gain = 0.08) {
  try {
    ensureAudio();
    const t0 = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + durationMs / 1000);

    osc.connect(g);
    g.connect(audioCtx.destination);

    osc.start(t0);
    osc.stop(t0 + durationMs / 1000 + 0.02);
  } catch {
    // ignore audio errors
  }
}

function playPaddleSound() {
  playTone(420, 55, "square", 0.06);
}

function playWallSound() {
  playTone(240, 45, "triangle", 0.06);
}

function playWinSound() {
  playTone(440, 90, "sine", 0.08);
  setTimeout(() => playTone(660, 120, "sine", 0.08), 90);
}

function playLoseSound() {
  playTone(330, 120, "sine", 0.08);
  setTimeout(() => playTone(220, 160, "sine", 0.08), 120);
}

const keys = new Set();
window.addEventListener("keydown", (e) => {
  if (["ArrowUp", "ArrowDown", "Space", "KeyW", "KeyS"].includes(e.code)) e.preventDefault();
  keys.add(e.code);
  if (e.code === "Space" && !state.inPlay) serve();
});
window.addEventListener("keyup", (e) => keys.delete(e.code));

const W = canvas.width;
const H = canvas.height;

const PADDLE_W = 12;
const PADDLE_H = 84;
const BALL_R = 7;

const state = {
  left: { x: 24, y: (H - PADDLE_H) / 2, vy: 0 },
  right: { x: W - 24 - PADDLE_W, y: (H - PADDLE_H) / 2, vy: 0 },
  ball: { x: W / 2, y: H / 2, vx: 0, vy: 0 },
  leftScore: 0,
  rightScore: 0,
  inPlay: false,
  serveDir: 1,
  ai: {
    left: { t: 0, targetY: (H - PADDLE_H) / 2 },
    right: { t: 0, targetY: (H - PADDLE_H) / 2 },
  },
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function aiEnabled(side) {
  const el = side === "left" ? leftTypeEl : rightTypeEl;
  return el ? el.value === "ai" : false;
}

function aiDifficulty(side) {
  const el = side === "left" ? leftAiEl : rightAiEl;
  return el ? el.value : "medium";
}

function aiParams(diff) {
  switch (diff) {
    case "easy":
      return { reaction: 0.18, maxSpeed: 380, aimError: 55, k: 6 };
    case "hard":
      return { reaction: 0.04, maxSpeed: 660, aimError: 6, k: 9 };
    default:
      return { reaction: 0.10, maxSpeed: 520, aimError: 22, k: 8 };
  }
}

function mod(n, m) {
  return ((n % m) + m) % m;
}

function reflectY(y, top, bottom) {
  const span = bottom - top;
  const period = span * 2;
  const ym = mod(y - top, period);
  return ym <= span ? top + ym : bottom - (ym - span);
}

function predictBallYAtX(targetX) {
  if (!state.inPlay || state.ball.vx === 0) return state.ball.y;
  const t = (targetX - state.ball.x) / state.ball.vx;
  if (!Number.isFinite(t) || t < 0) return state.ball.y;

  const top = 10 + BALL_R;
  const bottom = H - 10 - BALL_R;
  const y = state.ball.y + state.ball.vy * t;
  return reflectY(y, top, bottom);
}

function updateAi(side, dt) {
  const paddle = side === "left" ? state.left : state.right;
  const ai = state.ai[side];
  const cfg = aiParams(aiDifficulty(side));

  ai.t += dt;
  if (ai.t >= cfg.reaction) {
    ai.t = 0;

    let target = (H - PADDLE_H) / 2;
    if (state.inPlay) {
      const towards = side === "left" ? state.ball.vx < 0 : state.ball.vx > 0;
      if (towards) {
        const targetX = side === "left" ? paddle.x + PADDLE_W : paddle.x;
        target = predictBallYAtX(targetX) - PADDLE_H / 2;
      }
    }

    target += (Math.random() * 2 - 1) * cfg.aimError;
    ai.targetY = clamp(target, 12, H - 12 - PADDLE_H);
  }

  const dy = ai.targetY - paddle.y;
  paddle.vy = clamp(dy * cfg.k, -cfg.maxSpeed, cfg.maxSpeed);
}

function resetPositions() {
  state.left.y = (H - PADDLE_H) / 2;
  state.right.y = (H - PADDLE_H) / 2;
  state.ai.left.t = 0;
  state.ai.right.t = 0;
  state.ai.left.targetY = state.left.y;
  state.ai.right.targetY = state.right.y;

  state.ball.x = W / 2;
  state.ball.y = H / 2;
  state.ball.vx = 0;
  state.ball.vy = 0;
  state.inPlay = false;
  statusEl.textContent = "Press Space to serve.";
}

function resetGame() {
  state.leftScore = 0;
  state.rightScore = 0;
  leftScoreEl.textContent = "0";
  rightScoreEl.textContent = "0";
  state.serveDir = 1;
  resetPositions();
}

function serve() {
  const angle = (Math.random() * 0.6 - 0.3);
  const speed = baseSpeed;

  state.ball.x = W / 2;
  state.ball.y = H / 2;
  state.ball.vx = Math.cos(angle) * speed * state.serveDir;
  state.ball.vy = Math.sin(angle) * speed;
  state.inPlay = true;
  statusEl.textContent = "";
}

function paddleRect(p) {
  return { x: p.x, y: p.y, w: PADDLE_W, h: PADDLE_H };
}

function circleRectCollide(cx, cy, r, rect) {
  const closestX = clamp(cx, rect.x, rect.x + rect.w);
  const closestY = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= r * r;
}

function bounceOffPaddle(paddle) {
  const rel = ((state.ball.y - paddle.y) / PADDLE_H) - 0.5; // [-0.5,0.5]
  const maxBounce = 0.85;
  const speed = Math.min(720, Math.hypot(state.ball.vx, state.ball.vy) * 1.05);
  const dir = state.ball.vx < 0 ? 1 : -1;
  const angle = rel * maxBounce;

  state.ball.vx = dir * Math.cos(angle) * speed;
  state.ball.vy = Math.sin(angle) * speed;
}

function update(dt) {
  const humanPaddleSpeed = 520;

  state.left.vy = 0;
  if (aiEnabled("left")) {
    updateAi("left", dt);
  } else {
    if (keys.has("KeyW")) state.left.vy = -humanPaddleSpeed;
    if (keys.has("KeyS")) state.left.vy = humanPaddleSpeed;
  }

  state.right.vy = 0;
  if (aiEnabled("right")) {
    updateAi("right", dt);
  } else {
    if (keys.has("ArrowUp")) state.right.vy = -humanPaddleSpeed;
    if (keys.has("ArrowDown")) state.right.vy = humanPaddleSpeed;
  }

  state.left.y = clamp(state.left.y + state.left.vy * dt, 12, H - 12 - PADDLE_H);
  state.right.y = clamp(state.right.y + state.right.vy * dt, 12, H - 12 - PADDLE_H);

  if (!state.inPlay) return;

  state.ball.x += state.ball.vx * dt;
  state.ball.y += state.ball.vy * dt;

  if (state.ball.y - BALL_R <= 10) {
    state.ball.y = 10 + BALL_R;
    state.ball.vy *= -1;
    playWallSound();
  }
  if (state.ball.y + BALL_R >= H - 10) {
    state.ball.y = H - 10 - BALL_R;
    state.ball.vy *= -1;
    playWallSound();
  }

  const leftR = paddleRect(state.left);
  const rightR = paddleRect(state.right);

  if (state.ball.vx < 0 && circleRectCollide(state.ball.x, state.ball.y, BALL_R, leftR)) {
    state.ball.x = leftR.x + leftR.w + BALL_R;
    bounceOffPaddle(state.left);
    playPaddleSound();
  }

  if (state.ball.vx > 0 && circleRectCollide(state.ball.x, state.ball.y, BALL_R, rightR)) {
    state.ball.x = rightR.x - BALL_R;
    bounceOffPaddle(state.right);
    playPaddleSound();
  }

  if (state.ball.x < -40) {
    state.rightScore++;
    rightScoreEl.textContent = String(state.rightScore);
    playLoseSound();
    if (state.rightScore >= WIN_SCORE) {
      statusEl.textContent = `Right player wins! Press Reset.`;
      state.inPlay = false;
      return;
    }
    state.serveDir = -1;
    resetPositions();
  }

  if (state.ball.x > W + 40) {
    state.leftScore++;
    leftScoreEl.textContent = String(state.leftScore);
    playWinSound();
    if (state.leftScore >= WIN_SCORE) {
      statusEl.textContent = `Left player wins! Press Reset.`;
      state.inPlay = false;
      return;
    }
    state.serveDir = 1;
    resetPositions();
  }
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.30)";
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 10]);
  ctx.beginPath();
  ctx.moveTo(W / 2, 18);
  ctx.lineTo(W / 2, H - 18);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillRect(state.left.x, state.left.y, PADDLE_W, PADDLE_H);
  ctx.fillRect(state.right.x, state.right.y, PADDLE_W, PADDLE_H);

  ctx.beginPath();
  ctx.arc(state.ball.x, state.ball.y, BALL_R, 0, Math.PI * 2);
  ctx.fill();

  if (!state.inPlay) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.75)";
    ctx.font = "16px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textAlign = "center";
    ctx.fillText("Press Space to serve", W / 2, H / 2 + 90);
    ctx.restore();
  }
}

let last = performance.now();
function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;

  update(dt);
  draw();

  requestAnimationFrame(loop);
}

resetBtn.addEventListener("click", resetGame);
resetGame();
requestAnimationFrame(loop);
