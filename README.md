# RPG Game Companion

A SillyTavern extension that lets your character **actually sit down and play games with you** — real, working games (chess, cards, dice and more) played move-by-move, in character, with a personality all their own. They might play fair, secretly go easy on you, or cheekily cheat — and comment on the match the whole way through.

**Version 1.2.0** 

---

## ✨ Features

- 🎮 **Eight real games**, each with a genuine engine (not just flavor text):
  - ♟️ **Chess** (via chess.js) · ⭕ **Tic-Tac-Toe** (minimax) · 🚢 **Battleship (6×6)**
  - 🃏 **21 / Blackjack** · 🂡 **Poker (5-card draw)** · 🎲 **Dice "Pig"** · ✊ **Rock-Paper-Scissors** · 🂠 **Whist**
- 🎭 **Hidden disposition** — before each match the model reads your character's persona and the recent scene and secretly decides how they'll play: **fair**, **throw** (let you win), or **cheat** — plus a skill level (1–5). You're never told which; you just feel it in how the game goes.
- 💬 **In-character commentary** — your opponent taunts, sulks, cheers and banters as they play, in their own voice (throttled so it stays tasteful, not spammy).
- 🧠 **Personality-aware** — reads a configurable number of recent messages to match the opponent to who they are in the story.
- 🕹️ **One-tap launcher** — a floating gamepad button opens the "What shall we play?" menu.
- 🌍 **Bilingual (RU / EN)**.

## 📦 Install

Copy the `RPG Game Companion` folder into your third-party extensions folder (e.g. `SillyTavern/data/<user>/extensions/`), reload, and enable it in **Extensions → RPG Game Companion**.

## ⚙️ Setup

1. Tick **Enable** and pick a **Language**.
2. Fill in an OpenAI-compatible **URL / API Key / Model** (default `google/gemma-4-31b-it`) — used for the hidden disposition and the live commentary.
3. Set **Messages to analyze personality** (how much recent scene to read when deciding how your opponent plays).

Tap the floating gamepad button, pick a game, and play. Board/card games are fully interactive; the model plays the opponent's side and narrates as your character would.

## 🎭 How the opponent "thinks"

When a match starts, the model quietly picks a **disposition** and **skill** from your character's personality and the current mood — a proud knight might play sharp and fair, a smitten companion might *let* you win, a trickster might palm a card. This only colors the play and the banter; the game logic underneath stays honest so matches still resolve correctly.

## 🔌 Part of the RPG suite

Standalone by design, but sits happily alongside the other RPG modules (Map, Vitals, Equipment, Inventory, Status Bar) as the "downtime / minigame" corner of the set.

## 🩺 Troubleshooting

- **No disposition or commentary.** Those need a working URL / key / model; without them the games still play, just quietly.
- **Chess won't load.** It pulls chess.js on first use — allow it a moment and a connection.