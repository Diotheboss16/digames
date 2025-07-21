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
    { name: "amazing", prob: 50 , cutscene: "cutscenes/super-rare-mutated.gif"},
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
    { name: "Super Rare (Mutated) Rare", prob: 1000, cutscene: "cutscenes/super-rare-mutated.gif" }
];

// --- Game State ---
const gameState = {
    coins: 0,
    tries: 0,
    best: null,
    luck: 0,
    dirty: 0,
    gauntlet: 0,
    message: "",
    table: Object.fromEntries(auras.map(a => [a.name, 0]))
};

// --- DOM Elements ---
const coinsEl = document.getElementById("coins");
const triesEl = document.getElementById("tries");
const bestEl = document.getElementById("best");
const messageEl = document.getElementById("message");
const tableEl = document.getElementById("table");
const shopEl = document.getElementById("shop");

// --- Roll Function ---
function roll() {
    const totalWeight = auras.reduce((sum, aura) => sum + (1000 / aura.prob), 0);
    let rand = Math.random() * totalWeight;
    for (let aura of auras) {
        rand -= 1000 / aura.prob;
        if (rand <= 0) {
            gameState.coins += aura.prob;
            gameState.tries += 1;
            gameState.table[aura.name]++;
            gameState.message = `You found: ${aura.name} (1 in ${aura.prob})`;

            if (!gameState.best || aura.prob > gameState.best.prob) {
                gameState.best = { name: aura.name, prob: aura.prob };
            }

            updateStats();

            // 🎬 Play cutscene if it exists
            if (aura.cutscene) {
                playCutscene(aura.cutscene);
            }

            return;
        }
    }
}

// --- Cutscene Handler ---
function playCutscene(gifPath) {
    const existing = document.getElementById("cutscene");
    if (existing) document.body.removeChild(existing);

    const container = document.createElement("div");
    container.id = "cutscene";
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "0";
    container.style.width = "100%";
    container.style.height = "100%";
    gif.style.objectFit = "cover"; 
    container.style.backgroundColor = "rgba(0,0,0,0.85)";
    container.style.display = "flex";
    container.style.justifyContent = "center";
    container.style.alignItems = "center";
    container.style.zIndex = "9999";

    const gif = document.createElement("img");
    gif.src = gifPath;
    gif.alt = "Cutscene";
    gif.style.maxWidth = "80%";
    gif.style.maxHeight = "80%";

    container.appendChild(gif);
    document.body.appendChild(container);

    setTimeout(() => {
        document.body.removeChild(container);
    }, 3000);
}

// --- Update Stats Display ---
function updateStats() {
    coinsEl.textContent = gameState.coins;
    triesEl.textContent = gameState.tries;
    bestEl.textContent = gameState.best ? `${gameState.best.name} (1 in ${gameState.best.prob})` : "none";
    messageEl.textContent = gameState.message;
}

// --- Table Toggle ---
function toggleTable() {
    if (tableEl.classList.contains("hidden")) {
        tableEl.innerHTML = "<h2>Aura Table</h2>";
        tableEl.innerHTML += "<p><strong>Aura</strong> | <strong>Probability</strong> | <strong>Rolls</strong></p>";
        for (let aura of auras) {
            const rolls = gameState.table[aura.name];
            if (rolls > 0) {
                tableEl.innerHTML += `<p>${aura.name} | 1 in ${aura.prob} | ${rolls}</p>`;
            }
        }
        tableEl.classList.remove("hidden");
        shopEl.classList.add("hidden");
    } else {
        tableEl.classList.add("hidden");
    }
}

// --- Shop ---
function toggleShop() {
    if (shopEl.classList.contains("hidden")) {
        shopEl.innerHTML = `
            <h2>Shop</h2>
            <p><button onclick="buyItem('luck')">Luck Glove (+35% luck) - 500 coins</button></p>
            <p><button onclick="buyItem('gauntlet')">Fast Gauntlet (-20% roll time) - 1000 coins</button></p>
            <p><button onclick="buyItem('dirty')">Dirty Backpack (+45% luck, -15% roll time) - 3500 coins</button></p>
            <p><button onclick="toggleShop()">Return</button></p>
            <p>Your Items: Luck Gloves (${gameState.luck}), Gauntlets (${gameState.gauntlet}), Backpacks (${gameState.dirty})</p>
        `;
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
    toggleShop(); toggleShop();  // Refresh shop display
}
