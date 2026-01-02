const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const a1El = document.getElementById("a1");
const a2El = document.getElementById("a2");
const a3El = document.getElementById("a3");
const sumEl = document.getElementById("sum");
const s1El = document.getElementById("s1");
const s2El = document.getElementById("s2");
const s3El = document.getElementById("s3");
const baseEl = document.getElementById("base");
const heightEl = document.getElementById("height");
const perimEl = document.getElementById("perim");
const areaEl = document.getElementById("area");
const sideClassEl = document.getElementById("sideClass");
const angleClassEl = document.getElementById("angleClass");
const statusEl = document.getElementById("status");
const resetBtn = document.getElementById("resetBtn");
const presetBtns = document.querySelectorAll(".presetBtn");

const W = canvas.width;
const H = canvas.height;

const VERT_R = 7;
const PICK_R = 14;
const PAD = 14;
const GRID = 10;

function snap(v) {
  return Math.round(v / GRID) * GRID;
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function dist(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.hypot(dx, dy);
}

function dist2(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return dx * dx + dy * dy;
}

function triArea2(a, b, c) {
  // 2x signed area
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function safeAcos(x) {
  return Math.acos(clamp(x, -1, 1));
}

function angleDeg(a, b, c) {
  // angle at b (a-b-c)
  const ab = dist(a, b);
  const bc = dist(b, c);
  const ca = dist(c, a);
  const denom = 2 * ab * bc;
  if (denom < 1e-9) return NaN;
  const cos = (ab * ab + bc * bc - ca * ca) / denom;
  return (safeAcos(cos) * 180) / Math.PI;
}

function approxEqual(a, b) {
  const eps = Math.max(1, 0.005 * Math.max(a, b));
  return Math.abs(a - b) <= eps;
}

function classifyBySidesSquared(a2, b2, c2) {
  const ab = approxEqual(a2, b2);
  const bc = approxEqual(b2, c2);
  const ca = approxEqual(c2, a2);

  if (ab && bc) return "Equilateral";
  if (ab || bc || ca) return "Isosceles";
  return "Scalene";
}

function classifyByAngles(anglesInt) {
  if (anglesInt.some((x) => !Number.isFinite(x))) return "Degenerate";
  if (anglesInt.some((x) => x === 90)) return "Right";
  if (anglesInt.some((x) => x > 90)) return "Obtuse";
  return "Acute";
}

let vertices;
let selected = null;

function resetTriangle() {
  const side = Math.min(W, H) * 0.55;
  const h = (Math.sqrt(3) / 2) * side;
  const cx = W / 2;
  const cy = H / 2;

  vertices = [
    { x: cx, y: cy - h / 2 },
    { x: cx - side / 2, y: cy + h / 2 },
    { x: cx + side / 2, y: cy + h / 2 },
  ];
  selected = null;
  updateUI();
}

function canvasPointFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  const sx = canvas.width / r.width;
  const sy = canvas.height / r.height;
  return {
    x: (e.clientX - r.left) * sx,
    y: (e.clientY - r.top) * sy,
  };
}

function pickVertex(p) {
  for (let i = 0; i < vertices.length; i++) {
    if (dist(vertices[i], p) <= PICK_R) return i;
  }
  return null;
}

canvas.addEventListener("pointerdown", (e) => {
  const p = canvasPointFromEvent(e);
  const idx = pickVertex(p);
  if (idx === null) return;
  canvas.setPointerCapture(e.pointerId);
  selected = idx;
  e.preventDefault();
});

canvas.addEventListener("pointerup", (e) => {
  if (selected !== null) {
    selected = null;
    e.preventDefault();
  }
});

canvas.addEventListener("pointercancel", () => {
  selected = null;
});

canvas.addEventListener("pointermove", (e) => {
  if (selected === null) return;
  const p = canvasPointFromEvent(e);
  vertices[selected] = {
    x: snap(clamp(p.x, PAD, W - PAD)),
    y: snap(clamp(p.y, PAD, H - PAD)),
  };
  updateUI();
  e.preventDefault();
});

function formatDegInt(x) {
  if (!Number.isFinite(x)) return "—";
  return `${x}°`;
}

function formatLenInt(x) {
  if (!Number.isFinite(x)) return "—";
  return String(Math.round(x));
}

function updateUI() {
  const angles = [
    angleDeg(vertices[1], vertices[0], vertices[2]),
    angleDeg(vertices[0], vertices[1], vertices[2]),
    angleDeg(vertices[0], vertices[2], vertices[1]),
  ];

  const a2 = dist2(vertices[0], vertices[1]);
  const b2 = dist2(vertices[1], vertices[2]);
  const c2 = dist2(vertices[2], vertices[0]);

  const degenerate =
    a2 < 1 || b2 < 1 || c2 < 1 || Math.abs(triArea2(vertices[0], vertices[1], vertices[2])) < 3;

  let anglesInt = angles.map((x) => (Number.isFinite(x) ? Math.round(x) : NaN));

  if (!degenerate && angles.every(Number.isFinite)) {
    const residuals = angles.map((a, i) => a - anglesInt[i]);
    let diff = 180 - (anglesInt[0] + anglesInt[1] + anglesInt[2]);

    if (diff > 0) {
      const order = [0, 1, 2].sort((i, j) => residuals[j] - residuals[i]);
      for (let k = 0; k < diff; k++) anglesInt[order[k % 3]] += 1;
    } else if (diff < 0) {
      const order = [0, 1, 2].sort((i, j) => residuals[i] - residuals[j]);
      for (let k = 0; k < -diff; k++) anglesInt[order[k % 3]] -= 1;
    }
  }

  a1El.textContent = formatDegInt(anglesInt[0]);
  a2El.textContent = formatDegInt(anglesInt[1]);
  a3El.textContent = formatDegInt(anglesInt[2]);
  sumEl.textContent = !degenerate ? "180°" : "—";

  const s12 = dist(vertices[0], vertices[1]);
  const s23 = dist(vertices[1], vertices[2]);
  const s31 = dist(vertices[2], vertices[0]);
  s1El.textContent = formatLenInt(s12);
  s2El.textContent = formatLenInt(s23);
  s3El.textContent = formatLenInt(s31);

  const perim = s12 + s23 + s31;
  const area = Math.abs(triArea2(vertices[0], vertices[1], vertices[2])) / 2;
  const base = Math.max(s12, s23, s31);
  const height = base > 1e-9 ? (2 * area) / base : NaN;

  baseEl.textContent = !degenerate ? formatLenInt(base) : "—";
  heightEl.textContent = !degenerate ? formatLenInt(height) : "—";
  perimEl.textContent = !degenerate ? formatLenInt(perim) : "—";
  areaEl.textContent = !degenerate ? formatLenInt(area) : "—";

  sideClassEl.textContent = degenerate ? "Degenerate" : classifyBySidesSquared(a2, b2, c2);
  angleClassEl.textContent = degenerate ? "Degenerate" : classifyByAngles(anglesInt);

  statusEl.textContent = degenerate
    ? "Degenerate triangle (points overlap / nearly collinear)."
    : `Drag vertices to reshape the triangle. (Snaps to ${GRID}px grid)`;
}

function draw() {
  ctx.clearRect(0, 0, W, H);

  // triangle
  ctx.save();
  ctx.strokeStyle = "rgba(239,68,68,0.95)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(vertices[0].x, vertices[0].y);
  ctx.lineTo(vertices[1].x, vertices[1].y);
  ctx.lineTo(vertices[2].x, vertices[2].y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // vertices + labels
  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];

    ctx.beginPath();
    ctx.arc(v.x, v.y, VERT_R, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(v.x, v.y, VERT_R + 2, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(0,0,0,0.45)";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = "14px system-ui, -apple-system, Segoe UI, Roboto, Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), v.x + 10, v.y - 14);
    ctx.restore();
  }
}

function loop() {
  draw();
  requestAnimationFrame(loop);
}

function setPreset(name) {
  const side = Math.min(W, H) * 0.6;
  const cx = W / 2;
  const cy = H / 2;

  const clampSnap = (p) => ({
    x: snap(clamp(p.x, PAD, W - PAD)),
    y: snap(clamp(p.y, PAD, H - PAD)),
  });

  let vs;
  switch (name) {
    case "equilateral": {
      const h = (Math.sqrt(3) / 2) * side;
      vs = [
        { x: cx, y: cy - h / 2 },
        { x: cx - side / 2, y: cy + h / 2 },
        { x: cx + side / 2, y: cy + h / 2 },
      ];
      break;
    }
    case "isosceles": {
      const h = side * 0.55;
      vs = [
        { x: cx, y: cy - h / 2 },
        { x: cx - side / 2, y: cy + h / 2 },
        { x: cx + side / 2, y: cy + h / 2 },
      ];
      break;
    }
    case "scalene": {
      vs = [
        { x: cx - side * 0.45, y: cy + side * 0.25 },
        { x: cx + side * 0.35, y: cy + side * 0.3 },
        { x: cx + side * 0.05, y: cy - side * 0.4 },
      ];
      break;
    }
    case "right": {
      const o = { x: cx - side * 0.25, y: cy + side * 0.25 };
      vs = [
        { x: o.x, y: o.y - side * 0.55 },
        o,
        { x: o.x + side * 0.7, y: o.y },
      ];
      break;
    }
    case "acute": {
      vs = [
        { x: cx - side * 0.45, y: cy + side * 0.25 },
        { x: cx + side * 0.45, y: cy + side * 0.25 },
        { x: cx + side * 0.1, y: cy - side * 0.4 },
      ];
      break;
    }
    case "obtuse": {
      vs = [
        { x: cx - side * 0.45, y: cy + side * 0.25 },
        { x: cx + side * 0.55, y: cy + side * 0.25 },
        { x: cx - side * 0.25, y: cy - side * 0.05 },
      ];
      break;
    }
    default:
      resetTriangle();
      return;
  }

  vertices = vs.map(clampSnap);
  selected = null;
  updateUI();
}

presetBtns.forEach((btn) => {
  btn.addEventListener("click", () => setPreset(btn.dataset.preset));
});

resetBtn.addEventListener("click", resetTriangle);
resetTriangle();
requestAnimationFrame(loop);
