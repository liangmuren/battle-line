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
