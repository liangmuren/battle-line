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
