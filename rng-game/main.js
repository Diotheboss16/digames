// --- Aura Definitions ---
const auras = [
    { name: "common", prob: 2 },
    { name: "uncommon", prob: 4 },
    { name: "nice", prob: 5 },
    { name: "good", prob: 7 },
    { name: "yellow", prob: 10 },
    { name: "blue", prob: 16 },
    { name: "pink", prob: 27 },
    { name: "rare", prob: 35 },
    { name: "amazing", prob: 50 },
    { name: "bronze", prob: 99 },
    { name: "creative", prob: 100 },
    { name: "THE GREATEST (mutated)great", prob: 170 },
    { name: "even", prob: 200 },
    { name: "well", prob: 450 },
    { name: "invisible", prob: 600 },
    { name: "devil", prob: 666 },
    { name: "nonexistent", prob: 700 },
    { name: "jackpot", prob: 777 },
    { name: "extra", prob: 800 },
    { name: "ODD (mutated)even", prob: 801 },
    { name: "pixel", prob: 998 },
    { name: "green", prob: 999 },
    { name: "perfect", prob: 999 },
    { name: "failure", prob: 999 },
    { name: "Super Rare (Mutated) Rare", prob: 1000, cutscene: "cutscenes/super-rare-mutated.gif" },
    { name: "Ketchup", prob: 1000, cutscene: "cutscenes/ketchup.gif" }
];

// --- Game State ---
const gameState = {
    coins: 0,
    rolls: 0,
    best: null,
    luck: 0,
    dirty: 0,
    gauntlet: 0,
    message: "",
    table: Object.fromEntries(auras.map(a => [a.name, 0]))
};

// --- DOM Elements ---
const coinsEl = document.getElementById("coins");
const rollsEl = document.getElementById("rolls");
const bestEl = document.getElementById("best");
const messageEl = document.getElementById("message");
const tableEl = document.getElementById("table");
const shopEl = document.getElementById("shop");
const rollBtn = document.getElementById("rollBtn");
const auraDisplayEl = document.getElementById("auraDisplay");
const auraImgEl = document.getElementById("auraImg");
const auraNameEl = document.getElementById("auraName");

const ROLL_BTN_TEXT = rollBtn ? rollBtn.textContent : "Roll";
let rollCountdownInterval = null;
let auraShuffleInterval = null;
let audioCtx = null;

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#39;");
}

function hashString(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return h >>> 0;
}

function getAuraColor(name) {
    const fixed = {
        yellow: "#ffd54f",
        blue: "#64b5f6",
        pink: "#f48fb1",
        bronze: "#cd7f32",
        green: "#81c784",
        rare: "#b39ddb",
        devil: "#ef5350",
        invisible: "#b0bec5",
        jackpot: "#ffca28",
        pixel: "#90caf9",
        perfect: "#a5d6a7",
        failure: "#e57373",
        common: "#90a4ae",
        uncommon: "#4db6ac"
    };
    if (fixed[name]) return fixed[name];
    if (name === "Super Rare (Mutated) Rare") return "#ff80ff";

    const h = hashString(name) % 360;
    return `hsl(${h} 75% 62%)`;
}

function slugifyAuraName(name) {
    return String(name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

function makeAuraIconDataUri(color, name) {
    const label = (name || "?").trim().slice(0, 1).toUpperCase();
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${color}" stop-opacity="0.95" />
      <stop offset="1" stop-color="#ffffff" stop-opacity="0.10" />
    </linearGradient>
  </defs>
  <rect x="6" y="6" width="52" height="52" rx="14" fill="url(#g)" />
  <rect x="6" y="6" width="52" height="52" rx="14" fill="none" stroke="#ffffff" stroke-opacity="0.25" />
  <text x="32" y="39" font-family="Segoe UI, sans-serif" font-size="26" font-weight="800" text-anchor="middle" fill="#ffffff" fill-opacity="0.92">${label}</text>
</svg>`;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const auraAssets = Object.fromEntries(
    auras.map(aura => {
        const color = getAuraColor(aura.name);
        const slug = slugifyAuraName(aura.name);
        return [aura.name, { color, icon: `auras/${slug}.svg`, fallback: makeAuraIconDataUri(color, aura.name) }];
    })
);

function setAuraDisplay(aura) {
    if (!auraDisplayEl) return;

    if (!aura || !aura.name || aura.name === "—") {
        auraDisplayEl.style.setProperty("--aura-color", "#4f8cff");
        if (auraNameEl) auraNameEl.textContent = "—";
        else auraDisplayEl.textContent = "—";
        if (auraImgEl) auraImgEl.removeAttribute("src");
        return;
    }

    const asset = auraAssets[aura.name] || { color: getAuraColor(aura.name), icon: null, fallback: makeAuraIconDataUri(getAuraColor(aura.name), aura.name) };
    auraDisplayEl.style.setProperty("--aura-color", asset.color);
    if (auraImgEl) auraImgEl.src = asset.icon || asset.fallback;
    if (auraNameEl) auraNameEl.textContent = aura.name;
    else auraDisplayEl.textContent = aura.name;
}

setAuraDisplay(null);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function playRollSound() {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;

    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === "suspended") audioCtx.resume();

    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = "triangle";
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    osc.frequency.exponentialRampToValueAtTime(330, now + 0.30);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.36);
}

// --- Roll Modifiers ---
function getLuckBonus() {
    return (gameState.luck * 0.35) + (gameState.dirty * 0.45);
}

function getRollDelayMs() {
    const base = 2000;
    const speedBonus = (gameState.gauntlet * 0.20) + (gameState.dirty * 0.15);
    return Math.max(300, Math.round(base * (1 - Math.min(speedBonus, 0.9))));
}

function pickAura() {
    const luckBonus = Math.min(getLuckBonus(), 0.9);
    const exp = 1 - (luckBonus * 0.5);
    const weights = auras.map(aura => (1000 / Math.pow(aura.prob, exp)));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    let rand = Math.random() * totalWeight;
    for (let i = 0; i < auras.length; i++) {
        rand -= weights[i];
        if (rand <= 0) return auras[i];
    }

    return auras[auras.length - 1];
}

function startRollAnimation(durationMs) {
    if (!rollBtn) return;

    const start = Date.now();
    rollBtn.disabled = true;

    const updateCountdown = () => {
        const remaining = Math.max(0, durationMs - (Date.now() - start));
        const s = (remaining / 1000).toFixed(1);
        rollBtn.textContent = `Rolling (${s}s)`;
        if (messageEl) messageEl.textContent = `Rolling... ${s}s`;
    };

    updateCountdown();
    rollCountdownInterval = setInterval(updateCountdown, 50);

    setAuraDisplay(auras[Math.floor(Math.random() * auras.length)]);
    auraShuffleInterval = setInterval(() => {
        const aura = auras[Math.floor(Math.random() * auras.length)];
        setAuraDisplay(aura);
    }, 200);
}

function stopRollAnimation() {
    if (rollCountdownInterval) {
        clearInterval(rollCountdownInterval);
        rollCountdownInterval = null;
    }
    if (auraShuffleInterval) {
        clearInterval(auraShuffleInterval);
        auraShuffleInterval = null;
    }
}

// --- Roll Function ---
async function roll() {
    if (rollBtn?.disabled) return;

    playRollSound();

    const duration = getRollDelayMs();
    startRollAnimation(duration);
    await sleep(duration);
    stopRollAnimation();

    const prevBestProb = gameState.best?.prob ?? -Infinity;
    const aura = pickAura();

    gameState.coins += aura.prob;
    gameState.rolls += 1;
    gameState.table[aura.name]++;
    gameState.message = `You found: ${aura.name} (1 in ${aura.prob})`;

    const isNewBest = aura.prob > prevBestProb;
    if (isNewBest) {
        gameState.best = { name: aura.name, prob: aura.prob };
    }

    setAuraDisplay(aura);
    updateStats();

    // 🎬 Full-screen cutscene only when you set a new best aura
    if (isNewBest && aura.cutscene) {
        await playCutscene(aura.cutscene);
    }

    if (rollBtn) {
        rollBtn.textContent = ROLL_BTN_TEXT;
        rollBtn.disabled = false;
    }
}

// --- Cutscene Handler ---
function playCutscene(gifPath) {
    return new Promise(resolve => {
        const existing = document.getElementById("cutscene");
        if (existing) document.body.removeChild(existing);

        const container = document.createElement("div");
        container.id = "cutscene";
        container.style.position = "fixed";
        container.style.top = "0";
        container.style.left = "0";
        container.style.width = "100%";
        container.style.height = "100%";
        container.style.backgroundColor = "black";
        container.style.zIndex = "9999";
        container.style.overflow = "hidden";

        const gif = document.createElement("img");
        gif.src = gifPath;
        gif.alt = "Cutscene";
        gif.style.width = "100%";
        gif.style.height = "100%";
        gif.style.objectFit = "cover";

        container.appendChild(gif);
        document.body.appendChild(container);

        const cleanup = () => {
            if (container.parentNode) document.body.removeChild(container);
            resolve();
        };

        container.addEventListener("click", cleanup, { once: true });
        setTimeout(cleanup, 3000);
    });
}

// --- Update Stats Display ---
function updateStats() {
    coinsEl.textContent = gameState.coins;
    rollsEl.textContent = gameState.rolls;
    bestEl.textContent = gameState.best ? `${gameState.best.name} (1 in ${gameState.best.prob})` : "none";
    messageEl.textContent = gameState.message;
}

// --- Table Toggle ---
function toggleTable() {
    if (tableEl.classList.contains("hidden")) {
        let html = "<h2>Aura Table</h2>";
        html += "<table class=\"aura-table\"><thead><tr><th>Aura</th><th>Odds</th><th>Rolls</th></tr></thead><tbody>";

        for (let aura of auras) {
            const rolls = gameState.table[aura.name] ?? 0;
            if (rolls <= 0) continue;

            const asset = auraAssets[aura.name] || { color: getAuraColor(aura.name), icon: null, fallback: makeAuraIconDataUri(getAuraColor(aura.name), aura.name) };
            const iconSrc = asset.icon || asset.fallback;

            html += "<tr>";
            html += `<td><div class=\"table-aura\"><img src=\"${iconSrc}\" alt=\"\" /><span style=\"color:${asset.color}\" title=\"${escapeHtml(aura.name)}\">${escapeHtml(aura.name)}</span></div></td>`;
            html += `<td>1 in ${aura.prob}</td>`;
            html += `<td>${rolls}</td>`;
            html += "</tr>";
        }

        html += "</tbody></table>";
        tableEl.innerHTML = html;
        tableEl.classList.remove("hidden");
        shopEl.classList.add("hidden");
    } else {
        tableEl.classList.add("hidden");
    }
}

// --- Shop ---
function renderShop() {
    shopEl.innerHTML = `
        <h2>Shop</h2>
        <table class="aura-table">
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Effect</th>
                    <th>Cost</th>
                    <th>Owned</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Luck Glove</td>
                    <td>+35% luck</td>
                    <td>500</td>
                    <td>${gameState.luck}</td>
                    <td><button onclick="buyItem('luck')">Buy</button></td>
                </tr>
                <tr>
                    <td>Fast Gauntlet</td>
                    <td>-20% roll time</td>
                    <td>1000</td>
                    <td>${gameState.gauntlet}</td>
                    <td><button onclick="buyItem('gauntlet')">Buy</button></td>
                </tr>
                <tr>
                    <td>Dirty Backpack</td>
                    <td>+45% luck, -15% roll time</td>
                    <td>3500</td>
                    <td>${gameState.dirty}</td>
                    <td><button onclick="buyItem('dirty')">Buy</button></td>
                </tr>
            </tbody>
        </table>
        <div style="margin-top: 12px; display:flex; gap:10px; flex-wrap:wrap; align-items:center;">
            <button onclick="toggleShop()">Return</button>
            <span style="opacity:0.85;">Tip: buy items to improve luck and roll speed.</span>
        </div>
    `;
}

function toggleShop() {
    if (shopEl.classList.contains("hidden")) {
        renderShop();
        shopEl.classList.remove("hidden");
        tableEl.classList.add("hidden");
    } else {
        shopEl.classList.add("hidden");
    }
}

// --- Purchase Logic ---
function buyItem(type) {
    const costs = { luck: 500, gauntlet: 1000, dirty: 3500 };
    const messages = {
        luck: "Extra 35% luck, enjoy!",
        gauntlet: "Minus 20% roll time, enjoy!",
        dirty: "Dirty backpack activated! +45% luck, -15% roll time!"
    };
    if (gameState.coins >= costs[type]) {
        gameState.coins -= costs[type];
        gameState[type]++;
        gameState.message = messages[type];
    } else {
        gameState.message = "Insufficient funds!";
    }
    updateStats();
    if (!shopEl.classList.contains("hidden")) renderShop();
}
