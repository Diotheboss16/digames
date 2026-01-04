import { firebaseConfig } from "./firebase-config.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
  runTransaction,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const $ = (id) => document.getElementById(id);

const banner = $("banner");
const balancePoints = $("balancePoints");

const views = {
  earn: $("view-earn"),
  redeem: $("view-redeem"),
  history: $("view-history"),
  tasks: $("view-tasks"),
  awards: $("view-awards"),
  settings: $("view-settings"),
};

function showBanner(msg, kind = "info") {
  banner.hidden = false;
  banner.textContent = msg;
  banner.style.borderColor = kind === "error" ? "rgba(251,113,133,.45)" : "rgba(96,165,250,.35)";
}

function clearBanner() {
  banner.hidden = true;
  banner.textContent = "";
}

function isConfigReady() {
  return firebaseConfig && typeof firebaseConfig.apiKey === "string" && !firebaseConfig.apiKey.includes("YOUR_");
}

function fmtDate(d) {
  return d.toLocaleString(undefined, { year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function setActiveTab(view) {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("is-active", b.dataset.view === view));
  Object.entries(views).forEach(([k, el]) => (el.hidden = k !== view));
}

let db;
let historyCursor = null;
let historyExhausted = false;

const metaRef = () => doc(db, "meta", "balance");
const tasksCol = () => collection(db, "tasks");
const awardsCol = () => collection(db, "awards");
const txCol = () => collection(db, "transactions");

async function ensureMeta() {
  const snap = await getDoc(metaRef());
  if (!snap.exists()) {
    await setDoc(metaRef(), { points: 0, updatedAt: serverTimestamp() });
  }
}

async function refreshBalance() {
  const snap = await getDoc(metaRef());
  const pts = snap.exists() ? snap.data().points : 0;
  balancePoints.textContent = String(pts ?? 0);
}

async function listTasks() {
  const snap = await getDocs(query(tasksCol(), orderBy("name")));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const sel = $("earnTask");
  sel.innerHTML = items.length ? "" : `<option value="">(Add tasks first)</option>`;
  for (const t of items) {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = `${t.name} (+${t.points} pts)`;
    opt.dataset.points = String(t.points ?? 0);
    sel.appendChild(opt);
  }

  const list = $("taskList");
  list.innerHTML = items.length ? "" : `<div class="small">No tasks yet. Add one above.</div>`;
  for (const t of items) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div>
        <div class="item-title">${escapeHtml(t.name)}</div>
        <div class="item-sub">${Number(t.points ?? 0)} points</div>
      </div>
      <button class="icon-btn" data-del-task="${t.id}">Delete</button>
    `;
    list.appendChild(row);
  }
}

async function listAwards() {
  const snap = await getDocs(query(awardsCol(), orderBy("name")));
  const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  const sel = $("redeemAward");
  sel.innerHTML = items.length ? "" : `<option value="">(Add awards first)</option>`;
  for (const a of items) {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = `${a.name} (−${a.cost} pts)`;
    opt.dataset.cost = String(a.cost ?? 0);
    sel.appendChild(opt);
  }

  const list = $("awardList");
  list.innerHTML = items.length ? "" : `<div class="small">No awards yet. Add one above.</div>`;
  for (const a of items) {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div>
        <div class="item-title">${escapeHtml(a.name)}</div>
        <div class="item-sub">${Number(a.cost ?? 0)} points</div>
      </div>
      <button class="icon-btn" data-del-award="${a.id}">Delete</button>
    `;
    list.appendChild(row);
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function addMovement({ delta, title, note }) {
  await runTransaction(db, async (tx) => {
    const mref = metaRef();
    const msnap = await tx.get(mref);
    const current = msnap.exists() ? Number(msnap.data().points ?? 0) : 0;
    const next = current + delta;
    if (next < 0) throw new Error("Not enough points.");

    const txRef = doc(txCol());
    tx.set(txRef, {
      delta,
      title,
      note: note || "",
      createdAt: serverTimestamp(),
    });
    tx.set(mref, { points: next, updatedAt: serverTimestamp() }, { merge: true });
  });
}

function historyBaseQuery() {
  const last30 = $("historyLast30").checked;
  const parts = [];

  if (last30) {
    const ms = Date.now() - 30 * 24 * 60 * 60 * 1000;
    parts.push(where("createdAt", ">=", new Date(ms)));
  }

  parts.push(orderBy("createdAt", "desc"));
  return parts;
}

async function resetHistory() {
  historyCursor = null;
  historyExhausted = false;
  $("historyList").innerHTML = "";
  await loadMoreHistory();
}

async function loadMoreHistory() {
  if (historyExhausted) return;

  const qParts = [...historyBaseQuery(), limit(12)];
  const qFinal = historyCursor ? query(txCol(), ...historyBaseQuery(), startAfter(historyCursor), limit(12)) : query(txCol(), ...qParts);
  const snap = await getDocs(qFinal);

  if (snap.docs.length === 0) {
    historyExhausted = true;
    if (!$("historyList").children.length) {
      $("historyList").innerHTML = `<div class="small">No transactions yet.</div>`;
    }
    return;
  }

  historyCursor = snap.docs[snap.docs.length - 1];

  for (const d of snap.docs) {
    const v = d.data();
    const delta = Number(v.delta ?? 0);
    const dt = v.createdAt?.toDate ? v.createdAt.toDate() : null;

    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div>
        <div class="item-title">${escapeHtml(v.title || "Movement")}</div>
        <div class="item-sub">${dt ? fmtDate(dt) : "…"}${v.note ? " · " + escapeHtml(v.note) : ""}</div>
      </div>
      <div class="item-amt ${delta >= 0 ? "amt-plus" : "amt-minus"}">${delta >= 0 ? "+" : ""}${delta} pts</div>
    `;
    $("historyList").appendChild(row);
  }
}

function wireTabs() {
  document.querySelectorAll(".tab").forEach((b) => {
    b.addEventListener("click", async () => {
      const v = b.dataset.view;
      setActiveTab(v);
      if (v === "history") await resetHistory();
    });
  });
}

function wireForms() {
  $("earnTask").addEventListener("change", () => {
    const opt = $("earnTask").selectedOptions[0];
    if (!opt) return;
    $("earnPoints").value = opt.dataset.points ?? "0";
  });

  $("redeemAward").addEventListener("change", () => {
    const opt = $("redeemAward").selectedOptions[0];
    if (!opt) return;
    $("redeemCost").value = opt.dataset.cost ?? "0";
  });

  $("earnForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearBanner();

    const taskOpt = $("earnTask").selectedOptions[0];
    const title = taskOpt?.textContent ? taskOpt.textContent.replace(/\s*\(.*\)\s*$/, "") : "Earn";
    const points = Math.max(0, Number($("earnPoints").value || 0));
    const note = $("earnNote").value.trim();

    try {
      await addMovement({ delta: points, title, note });
      $("earnNote").value = "";
      await refreshBalance();
      await resetHistory();
    } catch (err) {
      showBanner(err.message || String(err), "error");
    }
  });

  $("redeemForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearBanner();

    const awardOpt = $("redeemAward").selectedOptions[0];
    const title = awardOpt?.textContent ? awardOpt.textContent.replace(/\s*\(.*\)\s*$/, "") : "Redeem";
    const cost = Math.max(0, Number($("redeemCost").value || 0));
    const note = $("redeemNote").value.trim();

    try {
      await addMovement({ delta: -cost, title, note });
      $("redeemNote").value = "";
      await refreshBalance();
      await resetHistory();
    } catch (err) {
      showBanner(err.message || String(err), "error");
    }
  });

  $("taskForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearBanner();
    const name = $("taskName").value.trim();
    const points = Math.max(0, Number($("taskPoints").value || 0));
    if (!name) return;

    try {
      await setDoc(doc(tasksCol()), { name, points });
      $("taskName").value = "";
      await listTasks();
    } catch (err) {
      showBanner(err.message || String(err), "error");
    }
  });

  $("awardForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    clearBanner();
    const name = $("awardName").value.trim();
    const cost = Math.max(0, Number($("awardCost").value || 0));
    if (!name) return;

    try {
      await setDoc(doc(awardsCol()), { name, cost });
      $("awardName").value = "";
      await listAwards();
    } catch (err) {
      showBanner(err.message || String(err), "error");
    }
  });

  $("historyLast30").addEventListener("change", resetHistory);
  $("historyLoadMore").addEventListener("click", loadMoreHistory);

  document.addEventListener("click", async (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;

    const taskId = t.dataset.delTask;
    const awardId = t.dataset.delAward;

    try {
      if (taskId) {
        await deleteDoc(doc(db, "tasks", taskId));
        await listTasks();
      }
      if (awardId) {
        await deleteDoc(doc(db, "awards", awardId));
        await listAwards();
      }
    } catch (err) {
      showBanner(err.message || String(err), "error");
    }
  });
}

async function bootstrap() {
  wireTabs();
  wireForms();

  if (!isConfigReady()) {
    showBanner("Firebase is not configured yet. Open the Setup tab and edit firebase-config.js.", "error");
    setActiveTab("settings");
    return;
  }

  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);

  try {
    await ensureMeta();
    await refreshBalance();
    await listTasks();
    await listAwards();
    await resetHistory();

    // Seed points inputs from first options.
    $("earnTask").dispatchEvent(new Event("change"));
    $("redeemAward").dispatchEvent(new Event("change"));
  } catch (err) {
    showBanner(err.message || String(err), "error");
    setActiveTab("settings");
  }
}

bootstrap();
