# Battle Line UI/UX Overhaul Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Overhaul the Battle Line game UI to fix identity confusion (blue=me, red=opponent), cramped layout, unclear interaction flow, and weak visual feedback.

**Architecture:** Pure frontend changes across 7 existing files. No new files needed. Each task rewrites one component following the approved design spec. Constants and CSS are updated first since other components depend on them.

**Tech Stack:** React 18, Tailwind CSS v4, Vite dev server. No test framework — verify each task visually with `npm run dev` and `npm run build`.

**Spec:** `docs/superpowers/specs/2026-03-14-ui-ux-overhaul-design.md`

---

## Chunk 1: Foundation + Header + Opponent Hand

### Task 1: Update constants.js — Add COMPACT_COLOR_MAP

**Files:**
- Modify: `src/constants.js`

- [ ] **Step 1: Add COMPACT_COLOR_MAP to constants.js**

Add after the existing `COLOR_MAP` export (around line 11). This maps card suit colors to compact row bar styles used inside flag slots.

```js
export const COMPACT_COLOR_MAP = {
  red:    { bg: '#991b1b', text: '#fecaca', label: '红' },
  orange: { bg: '#9a3412', text: '#fed7aa', label: '橙' },
  yellow: { bg: '#854d0e', text: '#fef3c7', label: '黄' },
  green:  { bg: '#166534', text: '#bbf7d0', label: '绿' },
  blue:   { bg: '#1e3a8a', text: '#bfdbfe', label: '蓝' },
  purple: { bg: '#581c87', text: '#e9d5ff', label: '紫' },
};
```

- [ ] **Step 2: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds with no errors.

- [ ] **Step 3: Commit**

```bash
git add src/constants.js
git commit -m "feat: add COMPACT_COLOR_MAP for flag card row colors"
```

---

### Task 2: Update styles.css — Larger cards, new utility classes

**Files:**
- Modify: `src/styles.css`

- [ ] **Step 1: Replace styles.css with updated version**

Key changes:
- Card sizes: 3.5rem×5rem mobile → 4.5rem×6.5rem desktop (hand cards)
- Flag slot width: increase from w-12/w-16 to w-[72px]/w-[84px]
- Add `.card-hand` class for hand-sized cards (56px × 78px desktop)
- Add `.card-compact` class for compact card row bars in flags
- Add `.flag-glow-target` for targetable flag yellow glow
- Add `.card-selected-glow` for selected card blue glow
- Add `.step-bar` for the step guide bar

```css
@import "tailwindcss";

body {
  font-family: 'Crimson Text', serif;
  background-color: #2c2520;
  background-image: url('https://www.transparenttextures.com/patterns/aged-paper.png');
  overflow: hidden;
  touch-action: manipulation;
}

.font-roman {
  font-family: 'Cinzel', serif;
}

.font-chinese {
  font-family: 'Ma Shan Zheng', cursive;
}

.card-shadow {
  box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.5);
}

.wood-texture {
  background-color: #5d4037;
  background-image: url('https://www.transparenttextures.com/patterns/wood-pattern.png');
}

/* Hand card sizes */
.card-hand {
  width: 3.5rem;
  height: 5rem;
}

@media (min-width: 640px) {
  .card-hand {
    width: 56px;
    height: 78px;
  }
}

/* Legacy card-responsive (used in opponent back cards) */
.card-responsive {
  width: 2.5rem;
  height: 3.5rem;
}

@media (min-width: 640px) {
  .card-responsive {
    width: 3rem;
    height: 4.5rem;
  }
}

/* Compact card row bars inside flags */
.card-compact {
  height: 22px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: bold;
  cursor: default;
  transition: transform 0.15s, box-shadow 0.15s;
}

.card-compact:hover {
  transform: scale(1.05);
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.3);
  z-index: 30;
}

/* Flag glow for targetable slots */
.flag-glow-target {
  border-color: #fbbf24 !important;
  box-shadow: 0 0 15px rgba(251, 191, 36, 0.3);
}

/* Selected card blue glow */
.card-selected-glow {
  transform: translateY(-8px);
  box-shadow: 0 4px 16px rgba(59, 130, 246, 0.55);
  border-color: #60a5fa !important;
  z-index: 10;
}

/* Step guide bar */
.step-bar {
  background: rgba(30, 58, 95, 0.4);
  border: 1px solid rgba(29, 78, 216, 0.2);
  border-radius: 8px;
  padding: 6px 16px;
  text-align: center;
  font-size: 13px;
}

/* Glow border for targetable cards */
.glow-border {
  box-shadow: 0 0 15px #facc15;
  border-color: #facc15 !important;
  transform: scale(1.05);
  z-index: 20;
}

/* Claim button pulse */
@keyframes pulse-yellow {
  0% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0.7); }
  70% { box-shadow: 0 0 0 10px rgba(250, 204, 21, 0); }
  100% { box-shadow: 0 0 0 0 rgba(250, 204, 21, 0); }
}

.animate-pulse-yellow {
  animation: pulse-yellow 2s infinite;
}

/* Hover popover for compact cards */
.card-popover {
  position: absolute;
  z-index: 100;
  pointer-events: none;
  animation: popover-in 0.15s ease-out;
}

@keyframes popover-in {
  from { opacity: 0; transform: scale(0.85); }
  to { opacity: 1; transform: scale(1); }
}

::-webkit-scrollbar { width: 4px; }
::-webkit-scrollbar-track { background: #1a1a1a; }
::-webkit-scrollbar-thumb { background: #555; border-radius: 2px; }
```

- [ ] **Step 2: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/styles.css
git commit -m "feat: update CSS with larger card sizes, compact rows, glow effects"
```

---

### Task 3: Rewrite GameHeader.jsx — Identity badge + phase info

**Files:**
- Modify: `src/components/GameHeader.jsx`

- [ ] **Step 1: Rewrite GameHeader with identity, phase, and opponent info**

The component now receives additional props: `phase`, `oppHandCount`, `selIdx`, `mode`.

```jsx
export default function GameHeader({ isMyTurn, winner, myPlayerId, phase, oppHandCount, selIdx, mode }) {
  let phaseText = '';
  if (winner) {
    phaseText = 'GAME OVER';
  } else if (!isMyTurn) {
    phaseText = '⏳ 等待对手行动...';
  } else if (phase === 'PLAY') {
    phaseText = '👉 你的回合 — 出牌阶段';
  } else if (phase === 'DRAW') {
    phaseText = '👉 你的回合 — 抽牌阶段';
  } else if (phase === 'SCOUT_DRAW') {
    phaseText = '👉 侦察兵 — 抽牌';
  } else if (phase === 'SCOUT_RETURN') {
    phaseText = '👉 侦察兵 — 还牌';
  } else if (phase === 'REDEPLOY_SRC' || mode === 'REDEPLOY_SRC') {
    phaseText = '👉 调遣 — 选择卡牌';
  } else if (phase === 'REDEPLOY_DEST' || mode === 'REDEPLOY_DEST') {
    phaseText = '👉 调遣 — 选择目标';
  } else if (mode === 'TARGET_OPP') {
    phaseText = '👉 选择对方卡牌';
  } else if (mode === 'TARGET_SLOT') {
    phaseText = '👉 选择目标旗帜';
  } else {
    phaseText = '👉 你的回合';
  }

  return (
    <div className="h-12 bg-black/80 flex items-center justify-between px-4 border-b-2 border-blue-600">
      <div className="text-yellow-500 font-bold font-roman">⚔ BATTLE LINE</div>
      <div className="flex items-center gap-3">
        <span className="bg-blue-900/80 text-blue-300 text-xs px-3 py-1 rounded-full border border-blue-600">
          🔵 你是蓝方
        </span>
        <span className={`text-sm ${isMyTurn ? 'text-yellow-400' : 'text-gray-400'}`}>
          {phaseText}
        </span>
      </div>
      <div className="text-red-400 text-xs">
        🔴 对手{oppHandCount != null ? `: ${oppHandCount}张手牌` : ''}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Update Game.jsx to pass new props to GameHeader**

In `src/components/Game.jsx`, update the GameHeader call (around line 51):

Change:
```jsx
<GameHeader isMyTurn={isMyTurn} winner={G.winner} myPlayerId={myPlayerId} />
```

To:
```jsx
<GameHeader
  isMyTurn={isMyTurn}
  winner={G.winner}
  myPlayerId={myPlayerId}
  phase={G.phase}
  oppHandCount={oppHandCount}
  selIdx={selIdx}
  mode={mode}
/>
```

- [ ] **Step 3: Run build to verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameHeader.jsx src/components/Game.jsx
git commit -m "feat: redesign GameHeader with identity badge and phase info"
```

---

### Task 4: Update opponent hand display in Game.jsx

**Files:**
- Modify: `src/components/Game.jsx`

- [ ] **Step 1: Update opponent hand section**

Replace the opponent hand section (around lines 62-67) from:

```jsx
{/* Opponent Hand (Hidden) */}
<div className="h-16 flex justify-center -space-x-2 mt-2 opacity-80">
  {Array(oppHandCount).fill(0).map((_, i) => (
    <Card key={i} />
  ))}
</div>
```

To:

```jsx
{/* Opponent Hand (Hidden) */}
<div className="flex items-center justify-center gap-1 mt-2 opacity-80">
  <span className="text-red-400/60 text-xs mr-2">🔴 对手手牌</span>
  <div className="flex -space-x-2">
    {Array(oppHandCount).fill(0).map((_, i) => (
      <Card key={i} />
    ))}
  </div>
</div>
```

- [ ] **Step 2: Run build to verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/Game.jsx
git commit -m "feat: improve opponent hand display with label"
```

---

## Chunk 2: GameBoard Rewrite

### Task 5: Rewrite GameBoard.jsx — Compact card rows, flag redesign, hover popover

This is the largest task. The entire GameBoard component is rewritten.

**Files:**
- Modify: `src/components/GameBoard.jsx`

- [ ] **Step 1: Rewrite GameBoard.jsx**

Complete replacement of the component. Key changes:
- Wider flag slots (w-[72px] sm:w-[84px])
- Compact card row bars with original suit colors (using COMPACT_COLOR_MAP)
- "对手"/"我方" labels at top/bottom of each flag
- Flag indicator redesign: blue pill for my claims, red pill for opponent claims
- Hover popover: shows full Card component when hovering compact rows
- Environment indicators (fog/mud) as small icons in top-right
- Mud shows ×4 hint

```jsx
import { useState } from 'react';
import Card from './Card';
import { getRank, canClaim, isWild } from '../gameLogic';
import { COMPACT_COLOR_MAP } from '../constants';

/** Compact card row bar for display inside a flag */
function CompactCard({ card, onHover, onLeave, onClick, target }) {
  let bg, text, label;
  if (card.type === 'TACTIC') {
    bg = '#334155';
    text = '#fbbf24';
    label = card.name;
  } else {
    const cm = COMPACT_COLOR_MAP[card.color] || { bg: '#333', text: '#ccc', label: '?' };
    bg = cm.bg;
    text = cm.text;
    label = `${cm.label} ${card.value}`;
  }

  return (
    <div
      className={`card-compact w-full ${target ? 'glow-border cursor-crosshair' : ''}`}
      style={{ backgroundColor: bg, color: text }}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
    >
      {label}
    </div>
  );
}

export default function GameBoard({
  board,
  myPlayerId,
  selIdx,
  isMyTurn,
  mode,
  phase,
  onSlotClick,
  onOppCardClick,
  onMyCardOnFlagClick,
  onClaimClick,
  discardPile,
}) {
  const oppSide = myPlayerId === 'p1' ? 'p2' : 'p1';
  const mySide = myPlayerId;
  const [hoverCard, setHoverCard] = useState(null); // { slotIdx, side, cardIdx, card }

  return (
    <div className="flex-1 flex items-center justify-center overflow-x-auto px-2 relative">
      <div className="flex gap-1 sm:gap-1.5">
        {board.map((slot, i) => {
          const isTargetable =
            selIdx !== null && !slot.owner && isMyTurn && mode === 'NORMAL' && phase === 'PLAY';
          const isTraitorDest = mode === 'TARGET_SLOT' && !slot.owner && isMyTurn;
          const isRedeployDest = (mode === 'REDEPLOY_DEST' || phase === 'REDEPLOY_DEST') && !slot.owner && isMyTurn;
          const isRedeploySrc = (mode === 'REDEPLOY_SRC' || phase === 'REDEPLOY_SRC') && !slot.owner && isMyTurn;
          const flagReq = slot.mud ? 4 : 3;

          const myCards = slot[mySide];
          const canClaimFlag = isMyTurn && phase === 'PLAY' && !slot.owner
            && myCards.length >= flagReq
            && canClaim(slot, mySide, board, discardPile || []);

          // Flag border and background
          let borderCls = 'border-amber-900';
          let bgStyle = {};
          if (slot.owner === mySide) {
            borderCls = 'border-blue-600';
            bgStyle = { background: 'linear-gradient(180deg, rgba(26,21,16,0.5), rgba(23,37,84,0.65))' };
          } else if (slot.owner === oppSide) {
            borderCls = 'border-red-600';
            bgStyle = { background: 'linear-gradient(180deg, rgba(69,10,10,0.5), rgba(26,21,16,0.5))' };
          }

          const glowCls = (isTargetable || isTraitorDest || isRedeployDest)
            ? 'flag-glow-target cursor-pointer' : '';

          return (
            <div
              key={i}
              onClick={() => onSlotClick(i)}
              className={`w-[72px] sm:w-[84px] wood-texture rounded-lg border-2 relative flex flex-col justify-between py-1.5 px-1 transition-all ${
                slot.mud ? 'min-h-[310px] sm:min-h-[380px]' : 'min-h-[260px] sm:min-h-[320px]'
              } ${borderCls} ${glowCls}`}
              style={bgStyle}
            >
              {/* Environment indicators */}
              {(slot.fog || slot.mud) && (
                <div className="absolute top-1 right-1 z-10 flex gap-0.5">
                  {slot.fog && <span className="text-[10px]" title="迷雾">🌫</span>}
                  {slot.mud && <span className="text-[10px]" title="泥泞">💧</span>}
                </div>
              )}

              {/* Opponent label */}
              <div className="text-[8px] text-gray-500 text-center tracking-widest select-none">对 手</div>

              {/* Opponent's cards (top) */}
              <div className="flex flex-col gap-0.5 flex-1">
                {slot[oppSide].map((c, idx) => {
                  const canTarget = mode === 'TARGET_OPP' && !slot.owner;
                  return (
                    <CompactCard
                      key={idx}
                      card={c}
                      target={canTarget}
                      onHover={() => setHoverCard({ slotIdx: i, side: 'opp', cardIdx: idx, card: c })}
                      onLeave={() => setHoverCard(null)}
                      onClick={(e) => {
                        if (canTarget) {
                          e.stopPropagation();
                          onOppCardClick(i, idx);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {/* Flag number / owner indicator */}
              <div className="z-10 flex flex-col items-center gap-0.5 my-1">
                {slot.owner === mySide ? (
                  <div className="bg-blue-700 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    🔵 {i + 1}
                  </div>
                ) : slot.owner === oppSide ? (
                  <div className="bg-red-700 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold">
                    🔴 {i + 1}
                  </div>
                ) : (
                  <div className="bg-black/70 text-yellow-500 text-[10px] px-2.5 py-0.5 rounded-full border border-amber-800 font-bold">
                    {i + 1}
                  </div>
                )}
                {canClaimFlag && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClaimClick(i);
                    }}
                    className="text-[9px] bg-yellow-600 text-black px-2 py-0.5 rounded font-bold hover:bg-yellow-500 animate-pulse-yellow"
                  >
                    宣称
                  </button>
                )}
              </div>

              {/* My cards (bottom) */}
              <div className="flex flex-col gap-0.5 flex-1 justify-end">
                {slot[mySide].map((c, idx) => {
                  const canPickForRedeploy = isRedeploySrc && !slot.owner;
                  return (
                    <CompactCard
                      key={idx}
                      card={c}
                      target={canPickForRedeploy}
                      onHover={() => setHoverCard({ slotIdx: i, side: 'my', cardIdx: idx, card: c })}
                      onLeave={() => setHoverCard(null)}
                      onClick={(e) => {
                        if (canPickForRedeploy) {
                          e.stopPropagation();
                          onMyCardOnFlagClick(i, idx);
                        }
                      }}
                    />
                  );
                })}
              </div>

              {/* My side label */}
              <div className="text-[8px] text-gray-500 text-center tracking-widest select-none">
                我 方{slot.mud ? <span className="text-yellow-500 ml-0.5">×4</span> : ''}
              </div>
            </div>
          );
        })}
      </div>

      {/* Hover popover — shows full card when hovering compact row */}
      {hoverCard && (
        <div
          className="card-popover"
          style={{
            left: `${hoverCard.slotIdx * 86 + 90}px`,
            top: hoverCard.side === 'opp' ? '20px' : 'auto',
            bottom: hoverCard.side === 'my' ? '20px' : 'auto',
          }}
        >
          <Card c={hoverCard.card} />
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Run build to verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Visual verification**

Run: `npm run dev`
Open browser, connect two tabs. Verify:
- Flags show compact card row bars with original suit colors
- "对手"/"我方" labels visible
- Hovering a compact card shows full card popover
- Claimed flags show blue/red pill + colored border
- Fog/mud indicators in top-right corner
- Targetable flags have yellow glow

- [ ] **Step 4: Commit**

```bash
git add src/components/GameBoard.jsx
git commit -m "feat: rewrite GameBoard with compact card rows, identity colors, hover popover"
```

---

## Chunk 3: Step Guide Bar + Hand Cards + DrawPanel

### Task 6: Rewrite Game.jsx — Step guide bar, larger hand cards, remove old mode indicator

**Files:**
- Modify: `src/components/Game.jsx`

- [ ] **Step 1: Rewrite Game.jsx**

Key changes:
- Remove the old mode indicator (absolute positioned pulse text at top)
- Add StepGuideBar component inline (above hand cards)
- Increase hand card sizes using .card-hand class
- Selected card uses .card-selected-glow
- Pass new props to GameHeader

```jsx
import Card from './Card';
import GameHeader from './GameHeader';
import GameOverlay from './GameOverlay';
import GameBoard from './GameBoard';
import DrawPanel from './DrawPanel';

function StepGuideBar({ phase, mode, selIdx, isMyTurn, scoutDrawsLeft, scoutReturnsLeft }) {
  if (!isMyTurn) {
    return (
      <div className="step-bar text-gray-400">
        ⏳ 等待对手行动...
      </div>
    );
  }

  let content;

  if (phase === 'SCOUT_DRAW') {
    content = (
      <span className="text-amber-300">
        🔭 侦察兵：选择牌堆抽牌（还需抽 <strong>{scoutDrawsLeft}</strong> 张）
      </span>
    );
  } else if (phase === 'SCOUT_RETURN') {
    content = selIdx !== null ? (
      <span className="text-amber-300">
        🔭 侦察兵：<span className="text-green-400">✓ 已选手牌</span> → 选择放回哪个牌堆（还需还 <strong>{scoutReturnsLeft}</strong> 张）
      </span>
    ) : (
      <span className="text-amber-300">
        🔭 侦察兵：选择手牌放回（还需还 <strong>{scoutReturnsLeft}</strong> 张）
      </span>
    );
  } else if (phase === 'REDEPLOY_SRC' || mode === 'REDEPLOY_SRC') {
    content = <span className="text-cyan-300">🔄 调遣：选择己方旗帜上的一张卡</span>;
  } else if (phase === 'REDEPLOY_DEST' || mode === 'REDEPLOY_DEST') {
    content = <span className="text-cyan-300">🔄 调遣：选择目标旗帜放置，或点击弃牌</span>;
  } else if (mode === 'TARGET_OPP') {
    content = <span className="text-red-300">🗡 选择对方旗帜上的一张卡</span>;
  } else if (mode === 'TARGET_SLOT') {
    content = <span className="text-blue-300">🗡 选择己方旗帜放置偷取的卡</span>;
  } else if (phase === 'DRAW') {
    content = (
      <>
        <span className="text-green-400">✓ 出牌完毕</span>
        <span className="text-gray-500 mx-2">→</span>
        <span className="text-white font-bold">选择牌堆抽牌</span>
      </>
    );
  } else if (phase === 'PLAY') {
    content = selIdx !== null ? (
      <>
        <span className="text-green-400">✓ 已选择手牌</span>
        <span className="text-gray-500 mx-2">→</span>
        <span className="text-white font-bold">第2步 点击旗帜放置</span>
      </>
    ) : (
      <>
        <span className="text-yellow-400 font-bold">第1步</span>
        <span className="text-white ml-1">选择手牌</span>
        <span className="text-gray-500 mx-2">→</span>
        <span className="text-gray-500">第2步 点击旗帜放置</span>
      </>
    );
  }

  return <div className="step-bar">{content}</div>;
}

export default function Game({
  G,
  myPlayerId,
  isMyTurn,
  selIdx,
  mode,
  canIPlayTactic,
  onCardClick,
  onSlotClick,
  onOppCardClick,
  onMyCardOnFlagClick,
  onDrawClick,
  onClaimClick,
  onRedeployDiscard,
}) {
  const myHand = myPlayerId === 'p1' ? G.p1Hand : G.p2Hand;
  const oppHandCount = myPlayerId === 'p1' ? G.p2Hand.length : G.p1Hand.length;

  return (
    <div className="min-h-screen flex flex-col parchment select-none relative">
      <GameHeader
        isMyTurn={isMyTurn}
        winner={G.winner}
        myPlayerId={myPlayerId}
        phase={G.phase}
        oppHandCount={oppHandCount}
        selIdx={selIdx}
        mode={mode}
      />

      <GameOverlay winner={G.winner} myPlayerId={myPlayerId} board={G.board} />

      {/* Opponent Hand (Hidden) */}
      <div className="flex items-center justify-center gap-1 mt-2 opacity-80">
        <span className="text-red-400/60 text-xs mr-2">🔴 对手手牌</span>
        <div className="flex -space-x-2">
          {Array(oppHandCount).fill(0).map((_, i) => (
            <Card key={i} />
          ))}
        </div>
      </div>

      {/* Board */}
      <GameBoard
        board={G.board}
        myPlayerId={myPlayerId}
        selIdx={selIdx}
        isMyTurn={isMyTurn}
        mode={mode}
        phase={G.phase}
        onSlotClick={onSlotClick}
        onOppCardClick={onOppCardClick}
        onMyCardOnFlagClick={onMyCardOnFlagClick}
        onClaimClick={onClaimClick}
        discardPile={G.discardPile}
      />

      {/* Draw Panel */}
      <DrawPanel
        G={G}
        isMyTurn={isMyTurn}
        onDrawClick={onDrawClick}
        phase={G.phase}
        mode={mode}
        selIdx={selIdx}
      />

      {/* Redeploy discard button */}
      {isMyTurn && (G.phase === 'REDEPLOY_DEST' || mode === 'REDEPLOY_DEST') && (
        <div className="absolute top-1/2 left-2 transform -translate-y-1/2 z-20">
          <button
            onClick={onRedeployDiscard}
            className="bg-red-800 border-2 border-red-500 px-3 py-2 rounded text-xs text-white shadow-lg hover:scale-110 transition"
          >
            弃掉此卡
          </button>
        </div>
      )}

      {/* Step Guide Bar */}
      <div className="px-4 sm:px-8 mt-1">
        <StepGuideBar
          phase={G.phase}
          mode={mode}
          selIdx={selIdx}
          isMyTurn={isMyTurn}
          scoutDrawsLeft={G.scoutDrawsLeft}
          scoutReturnsLeft={G.scoutReturnsLeft}
        />
      </div>

      {/* My Hand */}
      <div className="flex justify-center items-end gap-1 sm:gap-1.5 mb-3 mt-1 px-4 overflow-x-auto">
        {myHand.map((c, i) => {
          const isDimmed = c.type === 'TACTIC' && !canIPlayTactic && G.phase === 'PLAY';
          const isScoutReturn = G.phase === 'SCOUT_RETURN' && isMyTurn;
          const isSelected = selIdx === i;

          return (
            <div
              key={c.id || i}
              className={`transition-all duration-200 flex-shrink-0 ${
                isMyTurn && (G.phase === 'PLAY' || isScoutReturn)
                  ? isDimmed
                    ? 'opacity-30 grayscale'
                    : isSelected
                      ? 'card-selected-glow'
                      : 'hover:-translate-y-1 cursor-pointer'
                  : 'opacity-80'
              }`}
            >
              <Card
                c={c}
                onClick={() => onCardClick(i)}
                sel={isSelected}
                dim={isDimmed}
                variant="hand"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run build to verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/Game.jsx
git commit -m "feat: add step guide bar, larger hand cards, remove old mode indicator"
```

---

### Task 7: Update Card.jsx — Add hand variant with larger size

**Files:**
- Modify: `src/components/Card.jsx`

- [ ] **Step 1: Update Card to support `variant` prop**

Add a `variant` prop (`"hand"` | default). When variant is `"hand"`, use `.card-hand` CSS class instead of `.card-responsive`.

```jsx
import { COLOR_MAP } from '../constants';

const TACTIC_ICONS = {
  LEADER:   '♔',
  CAVALRY:  '🐎',
  SHIELD:   '🛡',
  FOG:      '🌫',
  MUD:      '💧',
  SCOUT:    '🔭',
  REDEPLOY: '🔄',
  DESERTER: '💨',
  TRAITOR:  '🗡',
};

const TACTIC_COLORS = {
  LEADER:   'text-yellow-400',
  CAVALRY:  'text-amber-400',
  SHIELD:   'text-sky-400',
  FOG:      'text-gray-400',
  MUD:      'text-amber-600',
  SCOUT:    'text-green-400',
  REDEPLOY: 'text-cyan-400',
  DESERTER: 'text-red-400',
  TRAITOR:  'text-purple-400',
};

export default function Card({ c, onClick, sel, target, dim, variant }) {
  const sizeClass = variant === 'hand' ? 'card-hand' : 'card-responsive';

  // Empty slot placeholder
  if (!c) {
    return (
      <div className={`${sizeClass} border-2 border-dashed border-gray-600 rounded bg-black/20`} />
    );
  }

  // Card back (no value and no code)
  if (!c.value && !c.code) {
    return (
      <div className={`${sizeClass} rounded border-2 bg-slate-800 border-slate-600 flex items-center justify-center card-shadow`}>
        <div className="text-[8px] text-white opacity-30 text-center">BATTLE<br />LINE</div>
      </div>
    );
  }

  // Interaction style
  let cls = '';
  if (target) cls = 'glow-border cursor-crosshair z-50 animate-pulse';
  else if (dim) cls = 'opacity-30 grayscale pointer-events-none';
  else if (sel) cls = 'ring-2 ring-blue-400 z-10';
  else cls = '';

  // Tactic card
  if (c.type === 'TACTIC') {
    const icon = TACTIC_ICONS[c.code] || '⚔';
    const nameColor = TACTIC_COLORS[c.code] || 'text-yellow-500';

    return (
      <div
        onClick={() => onClick && onClick(c)}
        className={`${sizeClass} rounded border-2 bg-slate-700 border-slate-400 text-slate-100 flex flex-col items-center justify-center relative transition-all duration-200 card-shadow cursor-pointer ${cls}`}
      >
        <div className={`text-[7px] font-bold uppercase ${nameColor} mb-0.5 leading-tight text-center px-0.5`}>{c.name}</div>
        <div className="text-base leading-none">{icon}</div>
        <div className="text-[6px] text-slate-400 mt-0.5 text-center px-0.5 leading-tight">{c.desc}</div>
      </div>
    );
  }

  // Troop card
  const st = COLOR_MAP[c.color];
  return (
    <div
      onClick={() => onClick && onClick(c)}
      className={`${sizeClass} rounded border-2 flex flex-col items-center justify-center relative transition-all duration-200 card-shadow cursor-pointer ${st.bg} ${st.border} ${cls}`}
    >
      <div className="absolute top-0.5 left-1 text-[9px] text-white/80">{c.value}</div>
      <div className={`text-2xl font-bold font-roman ${st.text} drop-shadow`}>{c.value}</div>
      <div className="absolute bottom-0.5 right-1 text-[9px] text-white/80">{c.value}</div>
    </div>
  );
}
```

- [ ] **Step 2: Run build to verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/Card.jsx
git commit -m "feat: add hand variant to Card with larger size"
```

---

### Task 8: Update DrawPanel.jsx — Larger buttons, visual improvements

**Files:**
- Modify: `src/components/DrawPanel.jsx`

- [ ] **Step 1: Rewrite DrawPanel with larger buttons**

```jsx
export default function DrawPanel({ G, isMyTurn, onDrawClick, phase, mode, selIdx }) {
  const isDrawPhase = phase === 'DRAW';
  const isScoutDraw = phase === 'SCOUT_DRAW';
  const isScoutReturn = phase === 'SCOUT_RETURN' && mode === 'SCOUT_RETURN' && selIdx !== null;

  if (!isMyTurn || (!isDrawPhase && !isScoutDraw && !isScoutReturn)) return null;

  const troopEmpty = G.troops.length === 0;
  const tacticEmpty = G.tactics.length === 0;

  if (isDrawPhase && troopEmpty && tacticEmpty) return null;

  return (
    <div className="absolute top-1/2 right-3 transform -translate-y-1/2 flex flex-col gap-3 z-20">
      <button
        onClick={() => onDrawClick('TROOP')}
        disabled={troopEmpty}
        className={`w-16 h-[88px] sm:w-[72px] sm:h-24 rounded-lg text-xs text-white shadow-lg transition flex flex-col items-center justify-center gap-1 ${
          troopEmpty
            ? 'bg-gray-700 opacity-50 cursor-not-allowed border-2 border-gray-600'
            : 'bg-red-900 border-2 border-yellow-500 hover:scale-105 hover:brightness-110'
        }`}
      >
        <span className="font-bold">{isScoutReturn ? '还到' : '部队'}</span>
        <span className="text-lg">🂠</span>
        <span className="opacity-70">({G.troops.length})</span>
      </button>
      <button
        onClick={() => onDrawClick('TACTIC')}
        disabled={tacticEmpty}
        className={`w-16 h-[88px] sm:w-[72px] sm:h-24 rounded-lg text-xs text-white shadow-lg transition flex flex-col items-center justify-center gap-1 ${
          tacticEmpty
            ? 'bg-gray-700 opacity-50 cursor-not-allowed border-2 border-gray-600'
            : 'bg-slate-700 border-2 border-slate-400 hover:scale-105 hover:brightness-110'
        }`}
      >
        <span className="font-bold">{isScoutReturn ? '还到' : '战术'}</span>
        <span className="text-lg">⚔</span>
        <span className="opacity-70">({G.tactics.length})</span>
      </button>
    </div>
  );
}
```

- [ ] **Step 2: Run build to verify**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/DrawPanel.jsx
git commit -m "feat: redesign DrawPanel with larger buttons"
```

---

## Chunk 4: Final Verification

### Task 9: Full build + visual verification

**Files:** None (verification only)

- [ ] **Step 1: Run production build**

Run: `npm run build`
Expected: Build succeeds with no errors or warnings.

- [ ] **Step 2: Visual verification with dev server**

Run: `npm run dev`
Open two browser tabs, connect via PeerJS.

Verify checklist:
- [ ] Header shows "🔵 你是蓝方" identity badge
- [ ] Header shows current phase text
- [ ] Header shows opponent hand count
- [ ] Opponent hand has "🔴 对手手牌" label
- [ ] Flag slots are wider and less cramped
- [ ] Flag cards show original suit colors (green=green, red=red, etc.)
- [ ] "对手"/"我方" labels visible on each flag
- [ ] Hovering compact card shows full card popover
- [ ] Claimed flags show blue border (mine) or red border (opponent)
- [ ] Unclaimed targetable flags have yellow glow
- [ ] Step guide bar shows "第1步 选择手牌 → 第2步 点击旗帜放置"
- [ ] Selecting a card updates step bar to "✓ 已选择手牌 → 第2步 点击旗帜放置"
- [ ] Draw phase shows "✓ 出牌完毕 → 选择牌堆抽牌"
- [ ] Hand cards are larger (56px × 78px on desktop)
- [ ] Selected card has blue glow + upward shift
- [ ] Dimmed tactic cards appear grayed out
- [ ] Draw panel buttons are larger with card back visuals

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete UI/UX overhaul — identity system, compact flags, step guide"
```
