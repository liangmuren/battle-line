export const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

export const COLOR_MAP = {
  red:    { bg: 'bg-red-800',    text: 'text-red-100',    border: 'border-red-900' },
  orange: { bg: 'bg-orange-700',  text: 'text-orange-100',  border: 'border-orange-900' },
  yellow: { bg: 'bg-yellow-600',  text: 'text-yellow-100',  border: 'border-yellow-800' },
  green:  { bg: 'bg-green-800',   text: 'text-green-100',   border: 'border-green-900' },
  blue:   { bg: 'bg-blue-900',    text: 'text-blue-100',    border: 'border-blue-950' },
  purple: { bg: 'bg-purple-800',  text: 'text-purple-100',  border: 'border-purple-900' },
  tactic: { bg: 'bg-slate-700',   text: 'text-slate-100',   border: 'border-slate-500' },
};

export const COMPACT_COLOR_MAP = {
  red:    { bg: '#991b1b', text: '#fecaca', label: '红' },
  orange: { bg: '#9a3412', text: '#fed7aa', label: '橙' },
  yellow: { bg: '#854d0e', text: '#fef3c7', label: '黄' },
  green:  { bg: '#166534', text: '#bbf7d0', label: '绿' },
  blue:   { bg: '#1e3a8a', text: '#bfdbfe', label: '蓝' },
  purple: { bg: '#581c87', text: '#e9d5ff', label: '紫' },
};

export const RANKS = {
  WEDGE: 5,     // 楔形 (straight flush)
  PHALANX: 4,   // 方阵 (three of a kind)
  BATTALION: 3,  // 雁行 (flush)
  SKIRMISH: 2,   // 散兵 (straight)
  HOST: 1,       // 乌合 (sum)
};

// Tactic card codes
export const TACTIC_CODES = {
  LEADER: 'LEADER',       // Alexander & Darius — wild, any color any value 1-10
  CAVALRY: 'CAVALRY',     // Companion Cavalry — wild, any color, value fixed 8
  SHIELD: 'SHIELD',       // Shield Bearers — wild, any color, value 1/2/3
  FOG: 'FOG',             // Fog — disable formation, compare sums only
  MUD: 'MUD',             // Mud — flag requires 4 cards instead of 3
  SCOUT: 'SCOUT',         // Scout — draw 3, return 2
  REDEPLOY: 'REDEPLOY',   // Redeploy — move own card to another flag or discard
  DESERTER: 'DESERTER',   // Deserter — remove one opponent card
  TRAITOR: 'TRAITOR',     // Traitor — steal one opponent troop card
};

// Cards that are placed on flags (occupy card slots)
export const FLAG_TACTICS = new Set(['LEADER', 'CAVALRY', 'SHIELD']);
// Cards that modify flag rules (don't occupy card slots)
export const ENV_TACTICS = new Set(['FOG', 'MUD']);
// Cards that are played and immediately discarded
export const MORALE_TACTICS = new Set(['SCOUT', 'REDEPLOY', 'DESERTER', 'TRAITOR']);
