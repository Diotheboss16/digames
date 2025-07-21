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
    {
        name: "Super Rare (Mutated) Rare",
        prob: 1000,
        cutscene: "cutscenes/super-rare-mutated.gif" // 🎬 Path to your gif file
    }
];

// --- RNG Roll Function ---
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

            // 🎥 Play cutscene if aura has one
            if (aura.cutscene) {
                playCutscene(aura.cutscene);
            }

            return;
        }
    }
}

// --- Cutscene Handler ---
function playCutscene(gifPath) {
    const cutsceneContainer = document.createElement("div");
    cutsceneContainer.id = "cutscene";
    cutsceneContainer.style.position = "fixed";
    cutsceneContainer.style.top = "0";
    cutsceneContainer.style.left = "0";
    cutsceneContainer.style.width = "100%";
    cutsceneContainer.style.height = "100%";
    cutsceneContainer.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
    cutsceneContainer.style.display = "flex";
    cutsceneContainer.style.justifyContent = "center";
    cutsceneContainer.style.alignItems = "center";
    cutsceneContainer.style.zIndex = "9999";

    const gif = document.createElement("img");
    gif.src = gifPath;
    gif.alt = "Aura Cutscene";
    gif.style.maxWidth = "90%";
    gif.style.maxHeight = "90%";
    cutsceneContainer.appendChild(gif);

    document.body.appendChild(cutsceneContainer);

    // Remove cutscene after 3 seconds
    setTimeout(() => {
        document.body.removeChild(cutsceneContainer);
    }, 3000);
}

