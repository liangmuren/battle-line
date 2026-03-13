# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Battle Line is a two-player online card game built with Vite + React. Players compete over 9 flags using troop and tactic cards in a peer-to-peer WebRTC multiplayer setup. Implements the full Reiner Knizia Battle Line official rules.

## Tech Stack

- **Vite** — build tool and dev server
- **React 18** — UI framework
- **Tailwind CSS v4** — utility-first CSS (via `@tailwindcss/vite` plugin)
- **PeerJS** — WebRTC peer-to-peer networking for multiplayer
- UI language is **Chinese (zh-CN)**

## Project Structure

```
battle-line/
├── index.html                  # Entry HTML (Google Fonts link)
├── package.json
├── vite.config.js
├── battle-line-online.html     # Legacy single-file version (archived)
├── src/
│   ├── main.jsx                # ReactDOM.createRoot entry
│   ├── App.jsx                 # Top-level: Lobby vs Game routing
│   ├── constants.js            # COLORS, COLOR_MAP, RANKS, TACTIC_CODES, card type sets
│   ├── gameLogic.js            # Deck creation, getRank (with wild card enumeration), compare, canClaim
│   ├── styles.css              # Custom CSS + Tailwind import
│   ├── hooks/
│   │   ├── useNetwork.js       # PeerJS connection management
│   │   └── useGameState.js     # Game state, processAction (all action types), interaction handlers
│   └── components/
│       ├── Card.jsx            # Card rendering (troop/tactic/back/empty) with icons for all 10 tactic types
│       ├── Lobby.jsx           # Connection lobby UI
│       ├── Game.jsx            # Main game view (composes sub-components, mode indicators)
│       ├── GameBoard.jsx       # 9 flag slots with Claim buttons, Mud/Fog indicators, Redeploy targeting
│       ├── GameHeader.jsx      # Top status bar
│       ├── DrawPanel.jsx       # Troop/tactic draw buttons (handles Scout draw/return, deck exhaustion)
│       └── GameOverlay.jsx     # Victory/defeat overlay (shows win type: 5-flag or 3-adjacent)
```

## Architecture

### Hooks

- **`useNetwork`** — Manages PeerJS peer, connection, host/guest roles. Exposes `onConnectedRef` and `onDataRef` callback refs for wiring to game state.
- **`useGameState`** — All game state (`G`), action processing (`processAction`), and user interaction handlers. Uses `useRef` for latest state to avoid stale closures. Tracks tactic card usage counts per player.

### Game Flow

- **Host** creates a PeerJS peer, shares ID → Guest connects with that ID
- Host initializes the game (`initGame`): shuffles decks, deals 7 cards each
- Turn phases: `PLAY` (select card + slot) → `DRAW` (pick from troop or tactics deck) → next player
- Special phases: `SCOUT_DRAW` / `SCOUT_RETURN` (Scout card), `REDEPLOY_SRC` / `REDEPLOY_DEST` (Redeploy card)
- Board has 9 slots ("flags"); first to claim 5 flags **or 3 adjacent flags** wins
- Formation ranks: Wedge (straight flush) > Phalanx (three of a kind) > Battalion (flush) > Skirmish (straight) > Host (sum)
- Players can **actively Claim** flags before opponent fills slots, if provably unbeatable

### Tactic Cards (10 unique, 1 each)

**Flag tactics (placed on flags as wild cards):**
- **Alexander / Darius** (Leaders): wild — any color, any value 1-10
- **Companion Cavalry**: wild — any color, value fixed at 8
- **Shield Bearers**: wild — any color, value 1/2/3

**Environment tactics (modify flag rules, don't occupy card slots):**
- **Fog**: disables formation ranking (sum comparison only)
- **Mud**: flag requires 4 cards instead of 3 (sum comparison only at 4 cards)

**Morale tactics (immediate effect, discarded after use):**
- **Scout**: draw 3 cards from any deck combination, return 2 to deck tops
- **Redeploy**: move own card from one flag to another, or discard it
- **Deserter**: remove any card from opponent's unclaimed flag
- **Traitor**: steal a troop card from opponent's flag to your own

**Tactic limit**: You cannot play more tactic cards than opponent + 1.

### Networking

Host/guest model over PeerJS. Host runs all game state mutations via `processAction`; guest sends `ACTION` messages. State is broadcast after each mutation via `updateState`.

## Development

```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server
npm run build        # Production build
```

PeerJS needs internet connectivity for the signaling server.
