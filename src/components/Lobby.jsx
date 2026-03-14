import { useState } from 'react';

export default function Lobby({ onJoin, onCreateRoom, status, roomCode }) {
  const [targetCode, setTargetCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showJoin, setShowJoin] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center parchment p-4">
      <div className="text-center max-w-md w-full space-y-6 bg-black/60 p-8 rounded-xl border border-yellow-600 backdrop-blur-sm">
        <div>
          <h1 className="text-5xl font-roman text-red-500 drop-shadow-lg mb-2">BATTLE LINE</h1>
          <p className="text-yellow-100/70 text-sm">Internet Warfare Edition</p>
        </div>

        {status && <div className="text-green-400 animate-pulse font-bold">{status}</div>}

        {roomCode ? (
          /* Host: show room code and wait */
          <div className="bg-gray-900 p-4 rounded border border-gray-600">
            <div className="text-xs text-gray-400 mb-1">房间代码 (发给朋友)</div>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-black p-3 rounded text-yellow-500 font-mono text-3xl tracking-[0.3em] text-center">
                {roomCode}
              </code>
              <button
                onClick={copyCode}
                className="bg-yellow-700 px-3 py-2 rounded text-white text-xs hover:bg-yellow-600"
              >
                {copied ? '已复制' : '复制'}
              </button>
            </div>
          </div>
        ) : showJoin ? (
          /* Join: input room code */
          <div>
            <div className="text-xs text-gray-400 mb-2">输入房间代码</div>
            <div className="flex gap-2">
              <input
                value={targetCode}
                onChange={e => setTargetCode(e.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4))}
                placeholder="4 位代码"
                maxLength={4}
                className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-2 text-white text-center font-mono text-2xl tracking-[0.2em] focus:border-yellow-500 outline-none uppercase"
              />
              <button
                onClick={() => onJoin(targetCode)}
                disabled={targetCode.length !== 4}
                className="bg-red-800 px-6 rounded text-white font-bold hover:bg-red-700 disabled:opacity-50"
              >
                加入
              </button>
            </div>
            <button
              onClick={() => setShowJoin(false)}
              className="mt-3 text-gray-500 text-xs hover:text-gray-300"
            >
              返回
            </button>
          </div>
        ) : (
          /* Initial: two buttons */
          <div className="space-y-3">
            <button
              onClick={onCreateRoom}
              className="w-full bg-red-800 py-3 rounded text-white font-bold text-lg hover:bg-red-700 transition-colors"
            >
              创建房间
            </button>
            <button
              onClick={() => setShowJoin(true)}
              className="w-full bg-gray-700 py-3 rounded text-white font-bold text-lg hover:bg-gray-600 transition-colors"
            >
              加入房间
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
