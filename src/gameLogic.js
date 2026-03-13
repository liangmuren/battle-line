import { COLORS, RANKS } from './constants';

/** Fisher-Yates shuffle (in-place) */
export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/** 6 colors × 10 values = 60 troop cards */
export function createTroopDeck() {
  const deck = [];
  COLORS.forEach(color => {
    for (let value = 1; value <= 10; value++) {
      deck.push({ id: `${color}-${value}`, type: 'TROOP', color, value });
    }
  });
  return shuffle(deck);
}

/** 10 unique tactic cards (1 each) per official rules */
export function createTacticsDeck() {
  const deck = [
    { id: 'alexander',  type: 'TACTIC', code: 'LEADER',   name: 'Alexander', desc: '万能（任意颜色任意值）' },
    { id: 'darius',     type: 'TACTIC', code: 'LEADER',   name: 'Darius',    desc: '万能（任意颜色任意值）' },
    { id: 'cavalry',    type: 'TACTIC', code: 'CAVALRY',  name: '骑兵侍从',  desc: '任意颜色，值为8' },
    { id: 'shield',     type: 'TACTIC', code: 'SHIELD',   name: '盾兵卫队',  desc: '任意颜色，值为1/2/3' },
    { id: 'fog',        type: 'TACTIC', code: 'FOG',      name: '迷雾',      desc: '取消阵型，只比总和' },
    { id: 'mud',        type: 'TACTIC', code: 'MUD',      name: '泥泞',      desc: '需要4张卡才能完成' },
    { id: 'scout',      type: 'TACTIC', code: 'SCOUT',    name: '侦察兵',    desc: '抽3张，还2张' },
    { id: 'redeploy',   type: 'TACTIC', code: 'REDEPLOY', name: '调遣',      desc: '移动己方卡牌或弃掉' },
    { id: 'deserter',   type: 'TACTIC', code: 'DESERTER', name: '逃兵',      desc: '移除对方一张卡' },
    { id: 'traitor',    type: 'TACTIC', code: 'TRAITOR',  name: '叛变',      desc: '偷取对方一张部队卡' },
  ];
  return shuffle(deck);
}

/** Build the full 60-card troop deck (unshuffled, for claim checking) */
export function fullTroopSet() {
  const set = [];
  COLORS.forEach(color => {
    for (let value = 1; value <= 10; value++) {
      set.push({ id: `${color}-${value}`, type: 'TROOP', color, value });
    }
  });
  return set;
}

/**
 * Check if a card is a wild card (placed on flag, acts as a troop)
 */
export function isWild(card) {
  return card.type === 'TACTIC' && (card.code === 'LEADER' || card.code === 'CAVALRY' || card.code === 'SHIELD');
}

/**
 * Get possible (color, value) assignments for a wild card.
 * - LEADER: any color, any value 1-10
 * - CAVALRY: any color, value = 8
 * - SHIELD: any color, value = 1, 2, or 3
 */
function getWildOptions(card) {
  const options = [];
  if (card.code === 'LEADER') {
    for (const color of COLORS) {
      for (let v = 1; v <= 10; v++) {
        options.push({ color, value: v });
      }
    }
  } else if (card.code === 'CAVALRY') {
    for (const color of COLORS) {
      options.push({ color, value: 8 });
    }
  } else if (card.code === 'SHIELD') {
    for (const color of COLORS) {
      for (let v = 1; v <= 3; v++) {
        options.push({ color, value: v });
      }
    }
  }
  return options;
}

/**
 * Evaluate formation rank for a set of resolved (non-wild) cards.
 * All cards must have .color and .value.
 */
function evaluateFormation(cards) {
  if (cards.length < 3) return { r: 0, s: 0 };

  const vals = cards.map(c => c.value).sort((a, b) => a - b);
  const cols = cards.map(c => c.color);
  const sum = vals.reduce((a, b) => a + b, 0);

  // For 4 cards (Mud), no formation — just sum
  if (cards.length === 4) {
    return { r: RANKS.HOST, s: sum };
  }

  const flush = cols.every(c => c === cols[0]);
  const consecutive = vals[1] === vals[0] + 1 && vals[2] === vals[1] + 1;
  const threeOfAKind = vals[0] === vals[1] && vals[1] === vals[2];

  if (flush && consecutive) return { r: RANKS.WEDGE, s: sum };
  if (threeOfAKind)         return { r: RANKS.PHALANX, s: sum };
  if (flush)                return { r: RANKS.BATTALION, s: sum };
  if (consecutive)          return { r: RANKS.SKIRMISH, s: sum };
  return { r: RANKS.HOST, s: sum };
}

/**
 * Evaluate the formation rank of cards at a flag.
 * Handles wild cards (Leader, Cavalry, Shield) by enumerating all possible
 * (color, value) assignments and returning the best formation.
 *
 * @param {Array} cards - cards on one side of a flag
 * @param {boolean} fog - whether Fog is active on this flag
 * @param {boolean} mud - whether Mud is active on this flag
 * @returns {{ r: number, s: number }} - rank and sum
 */
export function getRank(cards, fog, mud) {
  const requiredCount = mud ? 4 : 3;

  if (cards.length === 0) return { r: 0, s: 0 };

  // Fog: all formations disabled, just compare sums. Wild cards use their max value.
  if (fog) {
    const sum = cards.reduce((acc, c) => {
      if (c.code === 'LEADER') return acc + 10;
      if (c.code === 'CAVALRY') return acc + 8;
      if (c.code === 'SHIELD') return acc + 3;
      return acc + c.value;
    }, 0);
    return { r: 0, s: sum };
  }

  if (cards.length < requiredCount) return { r: 0, s: 0 };

  // Separate troops and wilds
  const troops = [];
  const wilds = [];
  for (const c of cards) {
    if (isWild(c)) wilds.push(c);
    else troops.push(c);
  }

  // No wilds — standard evaluation
  if (wilds.length === 0) {
    return evaluateFormation(troops);
  }

  // Enumerate wild card assignments and find the best formation
  let best = { r: 0, s: 0 };

  function enumerate(wildIdx, resolved) {
    if (wildIdx === wilds.length) {
      const all = [...troops, ...resolved];
      const rank = evaluateFormation(all);
      if (rank.r > best.r || (rank.r === best.r && rank.s > best.s)) {
        best = rank;
      }
      return;
    }
    const options = getWildOptions(wilds[wildIdx]);
    for (const opt of options) {
      resolved.push(opt);
      enumerate(wildIdx + 1, resolved);
      resolved.pop();
    }
  }

  enumerate(0, []);
  return best;
}

/** Compare two formations: returns 1 if f1 wins, -1 if f2 wins, 0 for tie */
export function compare(f1, f2) {
  if (f1.r > f2.r) return 1;
  if (f2.r > f1.r) return -1;
  return f1.s > f2.s ? 1 : (f2.s > f1.s ? -1 : 0);
}

/**
 * Determine if a flag can be claimed by `claimingPlayer`.
 * Returns true if the opponent cannot possibly beat or tie the claimant's formation,
 * no matter what cards they add from the remaining available pool.
 *
 * @param {object} slot - the flag slot
 * @param {string} claimingPlayer - 'p1' or 'p2'
 * @param {Array} board - full board array
 * @param {Array} discardPile - discarded cards
 * @returns {boolean}
 */
export function canClaim(slot, claimingPlayer, board, discardPile) {
  const opponent = claimingPlayer === 'p1' ? 'p2' : 'p1';
  const myCards = slot[claimingPlayer];
  const oppCards = slot[opponent];
  const fog = slot.fog;
  const mud = slot.mud;
  const requiredCount = mud ? 4 : 3;

  // Claimant must have a full formation
  if (myCards.length < requiredCount) return false;

  const myRank = getRank(myCards, fog, mud);

  // If opponent already has full cards, just compare
  if (oppCards.length >= requiredCount) {
    const oppRank = getRank(oppCards, fog, mud);
    return compare(myRank, oppRank) === 1;
  }

  // Collect all used card IDs (on all flags + discard pile)
  const usedIds = new Set();
  for (const s of board) {
    for (const c of s.p1) usedIds.add(c.id);
    for (const c of s.p2) usedIds.add(c.id);
  }
  for (const c of discardPile) usedIds.add(c.id);

  // Remaining troop cards
  const remaining = fullTroopSet().filter(c => !usedIds.has(c.id));

  const needed = requiredCount - oppCards.length;

  // For the claim check, we enumerate all possible combinations of `needed` cards
  // from the remaining pool, and check if any can beat or tie the claimant.
  // We also need to consider wild cards the opponent might have on this flag.
  return !canOpponentWin(oppCards, remaining, needed, myRank, fog, mud);
}

/**
 * Check if opponent can achieve a formation >= myRank by adding `needed` cards
 * from the `remaining` pool to their existing `oppCards`.
 */
function canOpponentWin(oppCards, remaining, needed, myRank, fog, mud) {
  if (needed === 0) {
    const oppRank = getRank(oppCards, fog, mud);
    return compare(oppRank, myRank) >= 0;
  }

  // Enumerate combinations
  function checkCombinations(startIdx, chosen) {
    if (chosen.length === needed) {
      const testCards = [...oppCards, ...chosen];
      const oppRank = getRank(testCards, fog, mud);
      return compare(oppRank, myRank) >= 0;
    }

    for (let i = startIdx; i < remaining.length; i++) {
      chosen.push(remaining[i]);
      if (checkCombinations(i + 1, chosen)) return true;
      chosen.pop();
    }
    return false;
  }

  return checkCombinations(0, []);
}
