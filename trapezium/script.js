const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const aEl = document.getElementById("a");
const bEl = document.getElementById("b");
const hEl = document.getElementById("h");
const areaEl = document.getElementById("area");
const kindEl = document.getElementById("kind");
const statusEl = document.getElementById("status");

const topBase = document.getElementById("topBase");
const bottomBase = document.getElementById("bottomBase");
const height = document.getElementById("height");
const offset = document.getElementById("offset");

const topBaseVal = document.getElementById("topBaseVal");
const bottomBaseVal = document.getElementById("bottomBaseVal");
const heightVal = document.getElementById("heightVal");
const offsetVal = document.getElementById("offsetVal");

const resetBtn = document.getElementById("resetBtn");
const quizBtn = document.getElementById("quizBtn");
const presetBtns = document.querySelectorAll(".presetBtn");

const quizPanel = document.getElementById("quizPanel");
const quizProgressEl = document.getElementById("quizProgress");
const quizQuestionEl = document.getElementById("quizQuestion");
const quizAnswerEl = document.getElementById("quizAnswer");
const quizSubmitBtn = document.getElementById("quizSubmit");
const quizNextBtn = document.getElementById("quizNext");
const quizExitBtn = document.getElementById("quizExit");
const quizFeedbackEl = document.getElementById("quizFeedback");

const W = canvas.width;
const H = canvas.height;

let mode = "play"; // "play" | "quiz"

let state = {
  a: 8,
  b: 12,
  h: 5,
  dx: 0, // cm
};

let quiz = {
  total: 10,
  qNo: 0,
  correct: 0,
  checked: false,
  question: "",
  answer: 0,
  unit: "",
  // for drawing
  showA: true,
  showB: true,
  showH: true,
};

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function choice(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function fmt(x) {
  // show halves nicely (e.g. 7.5)
  const r = Math.round(x * 2) / 2;
  return Number.isInteger(r) ? String(r) : String(r);
}

function areaTrapezium(a, b, h) {
  return ((a + b) / 2) * h;
}

function approxEqual(a, b) {
  return Math.abs(a - b) <= 1e-9;
}

function classifyTrapezium(a, b, dx, h) {
  const d = (b - a) / 2;

  const isParallelogram = approxEqual(a, b);
  const isIsosceles = approxEqual(dx, 0);

  // Right trapezium when one side is vertical.
  // With our coordinate setup, that happens when top-left aligns with bottom-left OR top-right with bottom-right.
  const isRight = approxEqual(dx, d) || approxEqual(dx, -d);

  if (isParallelogram) {
    const isRectangle = approxEqual(dx, 0);
    if (isRectangle) {
      if (approxEqual(h, a)) return "Square";
      return "Rectangle";
    }

    const side2 = dx * dx + h * h;
    if (approxEqual(side2, a * a)) return "Rhombus";

    return "Parallelogram";
  }

  if (isRight) return "Right trapezium";
  if (isIsosceles) return "Isosceles trapezium";
  return "Trapezium";
}

function trapeziumVerticesPx(a, b, h, dx) {
  // build in "cm" then scale to px.
  const pxPerCm = 40;
  const pad = 50;

  const maxSpan = Math.max(a, b) + Math.abs(dx);
  const scale = clamp((W - pad * 2) / (maxSpan * pxPerCm), 0.7, 1.4);
  const s = pxPerCm * scale;

  const cx = W / 2;
  const cy = H / 2;

  const b2 = (b * s) / 2;
  const a2 = (a * s) / 2;
  const hh = (h * s) / 2;
  const dd = dx * s;

  const bl = { x: cx - b2, y: cy + hh };
  const br = { x: cx + b2, y: cy + hh };
  const tl = { x: cx - a2 + dd, y: cy - hh };
  const tr = { x: cx + a2 + dd, y: cy - hh };

  return { bl, br, tr, tl, s };
}

function drawArrowLabel(text, x, y) {
  ctx.save();
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  const a = state.a;
  const b = state.b;
  const h = state.h;
  const dx = state.dx;

  const { bl, br, tr, tl } = trapeziumVerticesPx(a, b, h, dx);

  // shape
  ctx.save();
  ctx.strokeStyle = "rgba(239,68,68,0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(bl.x, bl.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(tl.x, tl.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // fill
  ctx.save();
  ctx.fillStyle = "rgba(37,99,235,0.18)";
  ctx.beginPath();
  ctx.moveTo(bl.x, bl.y);
  ctx.lineTo(br.x, br.y);
  ctx.lineTo(tr.x, tr.y);
  ctx.lineTo(tl.x, tl.y);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // height (dashed)
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.7)";
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  const hx = tl.x;
  ctx.beginPath();
  ctx.moveTo(hx, tl.y);
  ctx.lineTo(hx, bl.y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // labels
  if (mode === "play") {
    drawArrowLabel(`a = ${a} cm`, (tl.x + tr.x) / 2, tl.y - 18);
    drawArrowLabel(`b = ${b} cm`, (bl.x + br.x) / 2, bl.y + 18);
    drawArrowLabel(`h = ${h} cm`, hx - 34, (tl.y + bl.y) / 2);
  } else {
    if (quiz.showA) drawArrowLabel(`a = ${state.a} cm`, (tl.x + tr.x) / 2, tl.y - 18);
    if (quiz.showB) drawArrowLabel(`b = ${state.b} cm`, (bl.x + br.x) / 2, bl.y + 18);
    if (quiz.showH) drawArrowLabel(`h = ${state.h} cm`, hx - 34, (tl.y + bl.y) / 2);
  }

  // little right-angle marker if right trapezium
  const d = (state.b - state.a) / 2;
  const isRight = Math.abs(state.dx - d) < 1e-9 || Math.abs(state.dx + d) < 1e-9;
  if (isRight) {
    const v = Math.abs(state.dx - d) < 1e-9 ? bl : br;
    ctx.save();
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(v.x + 0, v.y - 16);
    ctx.lineTo(v.x + 16, v.y - 16);
    ctx.lineTo(v.x + 16, v.y - 0);
    ctx.stroke();
    ctx.restore();
  }
}

function updateUI() {
  const a = state.a;
  const b = state.b;
  const h = state.h;
  const dx = state.dx;

  const A = areaTrapezium(a, b, h);
  const kind = classifyTrapezium(a, b, dx, h);

  aEl.textContent = `${a} cm`;
  bEl.textContent = `${b} cm`;
  hEl.textContent = `${h} cm`;
  areaEl.textContent = `${fmt(A)} cm²`;
  kindEl.textContent = kind;

  topBaseVal.textContent = String(a);
  bottomBaseVal.textContent = String(b);
  heightVal.textContent = String(h);
  offsetVal.textContent = String(dx);

  statusEl.textContent =
    mode === "quiz"
      ? "Quiz mode: change nothing—just answer."
      : "Try changing a, b, and h and watch how the area changes.";
}

function setMode(nextMode) {
  mode = nextMode;
  document.body.classList.toggle("quizMode", mode === "quiz");

  const inQuiz = mode === "quiz";
  quizPanel.hidden = !inQuiz;
  resetBtn.disabled = inQuiz;
  quizBtn.textContent = inQuiz ? "Quiz (running)" : "Quiz";

  quizFeedbackEl.textContent = "";
  quizAnswerEl.value = "";
  quizAnswerEl.disabled = false;
  quizSubmitBtn.disabled = false;
  quizNextBtn.disabled = false;
  quizProgressEl.textContent = "";
  quizQuestionEl.textContent = "";

  updateUI();
}

function applySlidersToState() {
  state.a = Number(topBase.value);
  state.b = Number(bottomBase.value);
  state.h = Number(height.value);

  // keep trapezium sensible: b >= a + 1
  if (state.b <= state.a) {
    state.b = state.a + 1;
    bottomBase.value = String(state.b);
  }

  // keep shift in a sensible range
  const maxDx = Math.floor((state.b - state.a) / 2) + 6;
  state.dx = clamp(Number(offset.value), -maxDx, maxDx);
  offset.value = String(state.dx);
}

function syncSlidersFromState() {
  topBase.value = String(state.a);
  bottomBase.value = String(state.b);
  height.value = String(state.h);
  offset.value = String(state.dx);
}

function setPreset(name) {
  switch (name) {
    case "trapezium":
      state = { a: 6, b: 14, h: 5, dx: 2 };
      break;
    case "isosceles":
      state = { a: 6, b: 14, h: 5, dx: 0 };
      break;
    case "right":
      // dx = (b - a)/2 makes one side vertical
      state = { a: 6, b: 14, h: 5, dx: 4 };
      break;
    case "parallelogram":
      state = { a: 10, b: 10, h: 5, dx: 3 };
      break;
    case "rectangle":
      state = { a: 9, b: 9, h: 5, dx: 0 };
      break;
    case "square":
      state = { a: 6, b: 6, h: 6, dx: 0 };
      break;
    case "rhombus":
      // all sides equal: choose a=b=10 and dx^2 + h^2 = 10^2 (6-8-10)
      state = { a: 10, b: 10, h: 6, dx: 8 };
      break;
    default:
      state = { a: 8, b: 12, h: 5, dx: 0 };
  }

  syncSlidersFromState();
  updateUI();
}

function reset() {
  setPreset("default");
}

function genAreaQuestion() {
  const a = randInt(2, 12);
  const b = randInt(a + 1, 16);
  const h = randInt(2, 10);
  const dx = choice([0, 0, 1, -1, 2, -2]);

  state = { a, b, h, dx };
  quiz.question = `Find the area. (Use A = (a + b) / 2 × h.)`;
  quiz.answer = areaTrapezium(a, b, h);
  quiz.unit = "cm²";
  quiz.showA = true;
  quiz.showB = true;
  quiz.showH = true;
}

function genMissingHeightQuestion() {
  // Pick a,b,h so the area is a nice whole number or .5
  const a = randInt(2, 12);
  const b = randInt(a + 1, 16);
  const h = randInt(2, 10);
  const dx = choice([0, 1, -1, 2, -2]);

  const A = areaTrapezium(a, b, h);

  state = { a, b, h, dx };
  quiz.question = `The area is ${fmt(A)} cm². What is the height h?`;
  quiz.answer = h;
  quiz.unit = "cm";
  quiz.showA = true;
  quiz.showB = true;
  quiz.showH = false;
}

function genMissingTopBaseQuestion() {
  // Force integer answer: choose (a+b) even (same parity)
  const b = randInt(6, 16);
  const h = randInt(2, 10);
  const a = choice([2, 4, 6, 8, 10, 12].filter((x) => x < b));
  const dx = choice([0, 1, -1, 2, -2]);

  const A = areaTrapezium(a, b, h);

  state = { a, b, h, dx };
  quiz.question = `The area is ${fmt(A)} cm². The bottom base b is ${b} cm and height h is ${h} cm. What is the top base a?`;
  quiz.answer = a;
  quiz.unit = "cm";
  quiz.showA = false;
  quiz.showB = true;
  quiz.showH = true;
}

function newQuizQuestion() {
  quiz.checked = false;

  const make = choice([genAreaQuestion, genMissingHeightQuestion, genMissingTopBaseQuestion]);
  make();

  // keep sliders consistent (even though hidden in quiz)
  syncSlidersFromState();
  updateUI();
  quizQuestionEl.textContent = quiz.question;
}

function finishQuiz() {
  quizProgressEl.textContent = `Completed (score: ${quiz.correct}/${quiz.total})`;
  quizQuestionEl.textContent = "Quiz complete! Press Exit quiz to return.";
  quizFeedbackEl.textContent = "";
  quizAnswerEl.value = "";
  quizAnswerEl.disabled = true;
  quizSubmitBtn.disabled = true;
  quizNextBtn.disabled = true;

  quiz.showA = false;
  quiz.showB = false;
  quiz.showH = false;

  updateUI();
}

function nextQuizQuestion() {
  if (quiz.qNo >= quiz.total) {
    finishQuiz();
    return;
  }

  quiz.qNo += 1;
  quizProgressEl.textContent = `Question ${quiz.qNo} / ${quiz.total}`;

  quizFeedbackEl.textContent = "";
  quizAnswerEl.value = "";

  newQuizQuestion();
  quizAnswerEl.focus();
}

function startQuiz() {
  setMode("quiz");
  quiz.qNo = 0;
  quiz.correct = 0;
  nextQuizQuestion();
}

function exitQuiz() {
  setMode("play");
  quiz.qNo = 0;
  quiz.correct = 0;
  quiz.checked = false;
  quizQuestionEl.textContent = "";
  quizProgressEl.textContent = "";
  reset();
}

function checkQuizAnswer() {
  if (quiz.checked) return;

  const user = Number(quizAnswerEl.value);
  if (!Number.isFinite(user)) {
    quizFeedbackEl.textContent = "Enter a number.";
    return;
  }

  const ok = Math.abs(user - quiz.answer) < 1e-9;
  quiz.checked = true;
  if (ok) quiz.correct += 1;

  quizFeedbackEl.textContent = ok
    ? `Correct! (${fmt(quiz.answer)} ${quiz.unit})`
    : `Not quite. Correct answer: ${fmt(quiz.answer)} ${quiz.unit}.`;
}

function onSliderInput() {
  if (mode === "quiz") return;
  applySlidersToState();
  updateUI();
}

[topBase, bottomBase, height, offset].forEach((el) => el.addEventListener("input", onSliderInput));

resetBtn.addEventListener("click", () => {
  if (mode === "quiz") return;
  reset();
});

quizBtn.addEventListener("click", () => {
  if (mode === "quiz") return;
  startQuiz();
});

quizExitBtn.addEventListener("click", exitQuiz);
quizNextBtn.addEventListener("click", nextQuizQuestion);
quizSubmitBtn.addEventListener("click", checkQuizAnswer);
quizAnswerEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") checkQuizAnswer();
});

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    if (mode === "quiz") return;
    setPreset(btn.dataset.preset);
  });
});

function loop() {
  draw();
  requestAnimationFrame(loop);
}

reset();
requestAnimationFrame(loop);
