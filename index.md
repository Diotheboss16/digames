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

{% assign icons = site.static_files | sort: "path" %}

<div class="home-screen">
  <div class="home-grid">
    {% for icon in icons %}
      {% if icon.extname == ".svg" and icon.name contains "_icon.svg" %}
        {% assign relpath = icon.path | remove_first: "/" %}
        {% assign parts = relpath | split: "/" %}
        {% assign folder = parts[0] %}
        {% assign app_name = icon.basename | replace: "_icon", "" %}

        {% assign entry = folder | append: "/index.html" %}

        <a class="app-tile" href="{{ entry | relative_url }}">
          <img class="app-icon" alt="{{ app_name }}" src="{{ icon.path | relative_url | replace: ' ', '%20' }}" />
          <div class="app-name">{{ app_name }}</div>
        </a>
      {% endif %}
    {% endfor %}
  </div>
</div>
