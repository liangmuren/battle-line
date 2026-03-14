# Battle Line UI/UX Overhaul Design

**Date:** 2026-03-14
**Status:** Approved

## Problem Statement

Players report these issues with the current UI:
1. **Layout is cramped** — card sizes too small (3rem×4.5rem mobile, 4rem×6rem desktop), 9 flags squeezed into a row at w-12/w-16, cards within flags scaled to 75%
2. **Interaction flow unclear** — no guidance on what to click and when; mode indicator is a small pulsing text easily missed
3. **Visual feedback weak** — selected card only has subtle translate + ring; unclear which flags are targetable
4. **Identity confusion** — flags show 🔵/🔴 on capture but player doesn't know which color they are

## Design Decisions

- **Target device:** Desktop-first
- **Identity system:** Fixed blue/red — "you are blue (🔵)", opponent is red (🔴), blue accent throughout UI
- **Flag card display:** Cards retain original suit colors (red/orange/yellow/green/blue/purple); position (above/below midline) indicates ownership — no blue/red tinting
- **Card hover:** Small card rows in flags, hover to see enlarged full card
- **Operation guidance:** Bottom step-bar showing current operation phase dynamically

## Detailed Design

### 1. GameHeader Redesign

**Current:** `BATTLE LINE | 👉 你的回合 | P1`

**New layout:**
- Left: `⚔ BATTLE LINE` title
- Center: Identity badge `🔵 你是蓝方` (blue pill) + turn/phase text `👉 你的回合 — 出牌阶段`
- Right: Opponent info `🔴 对手: N张手牌`
- Bottom border: blue (2px solid #2563eb) to reinforce "my side" feeling

### 2. GameBoard Flag Redesign

Each flag slot structure (top to bottom):
- "对手" label (small, muted)
- Opponent's cards (original suit colors, compact rows)
- Flag indicator (center):
  - Unclaimed: dark circle with gold number + brown border
  - Claimed by me: blue pill `🔵 N`
  - Claimed by opponent: red pill `🔴 N`
  - Claimable: gold "宣称" button below number
- My cards (original suit colors, compact rows)
- "我方" label (small, muted)

**Flag border colors:**
- Unclaimed: `border-amber-900` (dark wood tone)
- Claimed by me: `border-blue-600` with subtle blue gradient background
- Claimed by opponent: `border-red-600` with subtle red gradient background
- Targetable (can place card): `border-yellow-400` with yellow glow shadow

**Card rows in flags:**
- Compact row bars showing `{suit_name} {value}` (e.g., "绿 4", "红 8")
- Background color matches card's actual suit color
- Text color: light version of suit color for contrast
- On hover: show enlarged full Card component as a tooltip/popover

**Environment indicators:**
- Fog (🌫) and Mud (💧) as small icons in top-right corner of flag
- Mud flag shows `×4` hint at bottom to indicate 4-card requirement

**Card color mapping for compact rows:**
| Suit   | Background   | Text Color   |
|--------|-------------|-------------|
| red    | #991b1b     | #fecaca     |
| orange | #9a3412     | #fed7aa     |
| yellow | #854d0e     | #fef3c7     |
| green  | #166534     | #bbf7d0     |
| blue   | #1e3a8a     | #bfdbfe     |
| purple | #581c87     | #e9d5ff     |
| tactic | #334155     | #fbbf24     |

### 3. Hand Area + Step Guide Bar

**Step guide bar** (above hand cards):
- Shows current operation phase as a breadcrumb: `第1步 选择手牌 → 第2步 点击旗帜放置`
- Current step: highlighted (gold label + white text)
- Future steps: muted (gray)
- Completed steps: checkmark
- Background: semi-transparent blue panel
- Dynamic text per phase:
  - PLAY (no selection): `第1步 选择手牌 → 第2步 点击旗帜放置`
  - PLAY (card selected): `✓ 已选择手牌 → 第2步 点击旗帜放置`
  - DRAW: `✓ 出牌完毕 → 选择牌堆抽牌`
  - SCOUT_DRAW: `侦察兵：选择牌堆抽牌（还需抽N张）`
  - SCOUT_RETURN (no selection): `侦察兵：选择手牌放回（还需还N张）`
  - SCOUT_RETURN (card selected): `侦察兵：选择放回哪个牌堆（还需还N张）`
  - REDEPLOY_SRC: `调遣：选择己方旗帜上的一张卡`
  - REDEPLOY_DEST: `调遣：选择目标旗帜放置，或弃掉此卡`
  - TARGET_OPP: `选择对方旗帜上的一张卡`
  - TARGET_SLOT: `选择己方旗帜放置偷取的卡`
  - Opponent's turn: `⏳ 等待对手行动...`

**Hand cards:**
- Larger size: 56px × 78px desktop (up from 4rem × 6rem)
- Selected card: translate-y-[-8px] + blue glow shadow (`box-shadow: 0 4px 16px #3b82f688`) + brighter border
- Dimmed tactic cards: opacity 30% + grayscale (when tactic limit reached)
- Hover effect: translate-y-[-4px] + slight scale

### 4. DrawPanel Redesign

- Larger deck buttons (64px × 88px)
- Card back visual with deck type label and count
- Troop deck: red-900 background, gold border when active
- Tactic deck: slate-700 background, slate border
- During Scout return: text changes to "还到 部队" / "还到 战术"

### 5. Opponent Hand Display

- Show card backs in a row above the board
- Include count indicator text: `对手手牌: N张`

### 6. Card Hover Popover (Flag Cards)

When hovering a compact card row within a flag:
- Show the full Card component as an absolutely-positioned popover
- Position: to the side of the flag (avoid covering other flags)
- z-index high enough to overlay everything
- Slight scale-up animation on appear

## Files to Modify

1. **src/styles.css** — new CSS variables for colors, larger card sizes, flag widths, glow effects, step bar styles
2. **src/constants.js** — add COMPACT_COLOR_MAP for flag card row colors
3. **src/components/GameHeader.jsx** — complete rewrite with identity badge, phase text, opponent info
4. **src/components/GameBoard.jsx** — complete rewrite: wider flags, compact card rows with hover popover, ownership labels, improved flag indicators
5. **src/components/Card.jsx** — add compact variant prop for flag display; add hover popover logic
6. **src/components/Game.jsx** — replace mode indicator with step guide bar above hand; adjust spacing; pass additional props
7. **src/components/DrawPanel.jsx** — larger buttons, visual improvements

## Non-Goals

- Mobile-first responsive redesign (desktop-first, mobile just needs to not break)
- Game logic changes (no rule changes)
- Network/multiplayer changes
