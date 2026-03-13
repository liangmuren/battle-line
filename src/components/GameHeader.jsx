export default function GameHeader({ isMyTurn, winner, myPlayerId, log }) {
  return (
    <div className="h-12 bg-black/80 flex items-center justify-between px-4 text-yellow-500 border-b border-yellow-800">
      <div className="font-bold">BATTLE LINE</div>
      <div className="text-sm animate-pulse">
        {winner ? 'GAME OVER' : isMyTurn ? '👉 你的回合' : '⏳ 等待对手...'}
      </div>
      <div className="text-xs font-mono">{myPlayerId.toUpperCase()}</div>
    </div>
  );
}
