export default function GameOverlay({ winner, myPlayerId, board }) {
  if (!winner) return null;

  // Determine win type
  let winType = '';
  if (board) {
    const winnerFlags = board.filter(b => b.owner === winner).length;
    if (winnerFlags >= 5) {
      winType = '（五旗胜利）';
    } else {
      // Find the 3 adjacent
      for (let i = 0; i <= 6; i++) {
        if (board[i].owner === winner && board[i + 1].owner === winner && board[i + 2].owner === winner) {
          winType = `（三旗相邻：${i + 1}-${i + 2}-${i + 3}）`;
          break;
        }
      }
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center text-center">
      <h1 className="text-6xl mb-4">{winner === myPlayerId ? '🏆' : '💀'}</h1>
      <div className="text-4xl text-white font-bold mb-2">
        {winner === myPlayerId ? 'VICTORY' : 'DEFEAT'}
      </div>
      {winType && (
        <div className="text-lg text-yellow-400 mb-8">{winType}</div>
      )}
      <button
        onClick={() => window.location.reload()}
        className="bg-yellow-600 px-6 py-2 rounded text-white"
      >
        Back to Lobby
      </button>
    </div>
  );
}
