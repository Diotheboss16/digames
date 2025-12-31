---
title: Welcome to Dio's Games!
---

<style>
  .home-screen {
    max-width: 980px;
    margin: 22px auto;
    padding: 26px;
    border-radius: 28px;
    background: radial-gradient(1200px 700px at 20% 0%, #60a5fa22, transparent 60%),
                radial-gradient(900px 600px at 85% 20%, #34d39922, transparent 55%),
                radial-gradient(900px 600px at 60% 100%, #a78bfa22, transparent 55%),
                linear-gradient(180deg, #0b1220, #111827);
    box-shadow: 0 22px 60px rgba(0,0,0,0.35);
    border: 1px solid rgba(255,255,255,0.08);
  }

  .home-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 18px;
  }

  .app-tile {
    display: grid;
    justify-items: center;
    gap: 10px;
    padding: 12px;
    text-decoration: none;
    border-radius: 18px;
    border: 1px solid transparent;
  }

  .app-tile:hover {
    border-color: rgba(255,255,255,0.18);
    background: rgba(255,255,255,0.06);
  }

  .app-icon {
    width: 92px;
    height: 92px;
    border-radius: 22px;
    box-shadow: 0 10px 22px rgba(0,0,0,0.35);
    background: rgba(255,255,255,0.06);
  }

  .app-name {
    font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
    font-size: 14px;
    line-height: 1.25;
    color: rgba(255,255,255,0.92);
    text-align: center;
    text-shadow: 0 2px 10px rgba(0,0,0,0.35);
  }

  @media (prefers-color-scheme: light) {
    .home-screen {
      background: radial-gradient(1200px 700px at 20% 0%, #2563eb18, transparent 60%),
                  radial-gradient(900px 600px at 85% 20%, #05966918, transparent 55%),
                  radial-gradient(900px 600px at 60% 100%, #6d28d918, transparent 55%),
                  linear-gradient(180deg, #f8fafc, #eef2ff);
      box-shadow: 0 22px 60px rgba(0,0,0,0.15);
      border: 1px solid rgba(0,0,0,0.08);
    }

    .app-name {
      color: rgba(15, 23, 42, 0.92);
      text-shadow: none;
    }

    .app-tile:hover {
      border-color: rgba(0,0,0,0.10);
      background: rgba(255,255,255,0.55);
    }
  }
</style>

<div class="home-screen">
  <div class="home-grid">
    <a class="app-tile" href="tic-tac-toe/tic-tac-toe.html">
      <img class="app-icon" alt="Tic-Tac-Toe" src="tic-tac-toe/Tic-Tac-Toe_icon.svg" />
      <div class="app-name">Tic-Tac-Toe</div>
    </a>

    <a class="app-tile" href="trivia-game/index.html">
      <img class="app-icon" alt="Trivia Game" src="trivia-game/Trivia%20Game_icon.svg" />
      <div class="app-name">Trivia Game</div>
    </a>

    <a class="app-tile" href="addition/index.html">
      <img class="app-icon" alt="Long Addition" src="addition/Long%20Addition_icon.svg" />
      <div class="app-name">Long Addition</div>
    </a>

    <a class="app-tile" href="subtraction/index.html">
      <img class="app-icon" alt="Long Subtraction" src="subtraction/Long%20Subtraction_icon.svg" />
      <div class="app-name">Long Subtraction</div>
    </a>

    <a class="app-tile" href="rng-game/index.html">
      <img class="app-icon" alt="Oliveira's RNG" src="rng-game/Oliveira%27s%20RNG_icon.svg" />
      <div class="app-name">Oliveira's RNG</div>
    </a>

    <a class="app-tile" href="equation-solver/index.html">
      <img class="app-icon" alt="Equation Solver" src="equation-solver/Equation%20Solver_icon.svg" />
      <div class="app-name">Equation Solver</div>
    </a>
  </div>
</div>
