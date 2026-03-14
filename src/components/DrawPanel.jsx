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
