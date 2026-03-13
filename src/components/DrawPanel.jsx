export default function DrawPanel({ G, isMyTurn, onDrawClick, phase, mode, selIdx }) {
  // Show during normal DRAW phase, SCOUT_DRAW phase, or SCOUT_RETURN (when card selected)
  const isDrawPhase = phase === 'DRAW';
  const isScoutDraw = phase === 'SCOUT_DRAW';
  const isScoutReturn = phase === 'SCOUT_RETURN' && mode === 'SCOUT_RETURN' && selIdx !== null;

  if (!isMyTurn || (!isDrawPhase && !isScoutDraw && !isScoutReturn)) return null;

  const troopEmpty = G.troops.length === 0;
  const tacticEmpty = G.tactics.length === 0;

  // During normal DRAW, if both decks are empty, this shouldn't show (handled by advanceToDraw)
  // But just in case:
  if (isDrawPhase && troopEmpty && tacticEmpty) return null;

  return (
    <div className="absolute top-1/2 right-2 transform -translate-y-1/2 flex flex-col gap-2 z-20">
      <button
        onClick={() => onDrawClick('TROOP')}
        disabled={troopEmpty}
        className={`border-2 border-yellow-500 w-16 h-20 rounded text-xs text-white shadow-lg transition ${
          troopEmpty
            ? 'bg-gray-700 opacity-50 cursor-not-allowed'
            : 'bg-red-900 hover:scale-110 animate-bounce'
        }`}
      >
        {isScoutReturn ? '还到\n部队' : '部队'}<br />({G.troops.length})
      </button>
      <button
        onClick={() => onDrawClick('TACTIC')}
        disabled={tacticEmpty}
        className={`border-2 border-slate-400 w-16 h-20 rounded text-xs text-white shadow-lg transition ${
          tacticEmpty
            ? 'bg-gray-700 opacity-50 cursor-not-allowed'
            : 'bg-slate-700 hover:scale-110'
        }`}
      >
        {isScoutReturn ? '还到\n战术' : '战术'}<br />({G.tactics.length})
      </button>
    </div>
  );
}
