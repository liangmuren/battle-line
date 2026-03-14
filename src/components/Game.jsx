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
