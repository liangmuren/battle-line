import { useState } from 'react';

export default function Lobby({ onJoin, status, myId }) {
  const [targetId, setTargetId] = useState('');
  const [copied, setCopied] = useState(false);

  const copyId = () => {
    navigator.clipboard.writeText(myId);
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

        {!myId ? (
          <div className="text-white">正在连接全球战网...</div>
        ) : (
          <>
            <div className="bg-gray-900 p-4 rounded border border-gray-600">
              <div className="text-xs text-gray-400 mb-1">您的联机代码 (发给朋友)</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-black p-2 rounded text-yellow-500 font-mono text-lg tracking-wider overflow-hidden">
                  {myId}
                </code>
                <button
                  onClick={copyId}
                  className="bg-yellow-700 px-3 py-2 rounded text-white text-xs hover:bg-yellow-600"
                >
                  {copied ? '已复制' : '复制'}
                </button>
              </div>
            </div>

            <div className="border-t border-gray-600 my-4" />

            <div>
              <div className="text-xs text-gray-400 mb-1">输入朋友的代码</div>
              <div className="flex gap-2">
                <input
                  value={targetId}
                  onChange={e => setTargetId(e.target.value)}
                  placeholder="粘贴代码..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 text-white focus:border-yellow-500 outline-none"
                />
                <button
                  onClick={() => onJoin(targetId)}
                  disabled={!targetId}
                  className="bg-red-800 px-6 rounded text-white font-bold hover:bg-red-700 disabled:opacity-50"
                >
                  连接
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
