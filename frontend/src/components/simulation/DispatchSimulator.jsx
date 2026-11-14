import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Zap, Server, CheckCircle } from 'lucide-react';

export default function DispatchSimulator({ totalEmails = 300000, batchSize = 1000 }) {
  const [running, setRunning] = useState(false);
  const [sent, setSent] = useState(0);
  const [batches, setBatches] = useState([]);
  const intervalRef = useRef(null);
  const totalBatches = totalEmails / batchSize;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSent(prev => {
          const next = Math.min(prev + batchSize * 3, totalEmails);
          setBatches(b => {
            const batchNum = Math.floor(next / batchSize);
            const newBatches = Array.from({ length: Math.min(batchNum, 12) }, (_, i) => ({
              id: batchNum - i,
              status: i === 0 ? 'sending' : 'done',
            }));
            return newBatches;
          });
          if (next >= totalEmails) { setRunning(false); clearInterval(intervalRef.current); }
          return next;
        });
      }, 150);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running]);

  const reset = () => { setRunning(false); setSent(0); setBatches([]); };
  const pct = Math.min((sent / totalEmails) * 100, 100);
  const batchNum = Math.floor(sent / batchSize);

  return (
    <div className="bg-gray-950 rounded-lg p-5 text-white font-mono">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={16} className="text-yellow-400" />
          <span className="text-sm font-bold text-white">Live Dispatch Simulator</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-green-400 flex items-center gap-1">
            <Server size={11} /> AWS SES · us-east-1
          </span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3 mb-4">
        {[
          { label: 'Total', value: totalEmails.toLocaleString(), color: 'text-white' },
          { label: 'Sent', value: sent.toLocaleString(), color: 'text-green-400' },
          { label: 'Batches Done', value: `${batchNum} / ${totalBatches}`, color: 'text-blue-400' },
          { label: 'Rate', value: running ? '25 emails/sec' : '—', color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-white/5 rounded p-2.5">
            <div className="text-[10px] text-gray-500 uppercase mb-0.5">{s.label}</div>
            <div className={`text-sm font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-[11px] text-gray-400 mb-1.5">
          <span>Dispatch Progress</span>
          <span>{pct.toFixed(1)}% Complete</span>
        </div>
        <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1366D9, #0F9D58)' }}
          />
        </div>
      </div>

      {/* Batch Visualizer */}
      {batches.length > 0 && (
        <div className="mb-4">
          <div className="text-[10px] text-gray-500 uppercase mb-2">Celery Worker Queue (Last 12 Batches)</div>
          <div className="flex flex-wrap gap-1.5">
            {batches.map(b => (
              <div key={b.id} className={`px-2 py-0.5 rounded text-[10px] font-mono ${b.status === 'sending' ? 'bg-blue-500 animate-pulse text-white' : 'bg-green-900 text-green-400'}`}>
                {b.status === 'sending' ? '⟳' : '✓'} Batch #{b.id}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sent === 100% */}
      {sent === totalEmails && (
        <div className="flex items-center gap-2 bg-green-900/40 border border-green-500/30 rounded px-3 py-2 mb-3">
          <CheckCircle size={14} className="text-green-400" />
          <span className="text-xs text-green-400 font-medium">All 300,000 emails dispatched successfully via AWS SES!</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setRunning(!running)}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded text-xs font-medium transition-colors ${running ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
        >
          {running ? <><Pause size={12} /> Pause</> : <><Play size={12} /> {sent === 0 ? 'Start Dispatch' : 'Resume'}</>}
        </button>
        <button onClick={reset} className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium bg-gray-800 hover:bg-gray-700 text-gray-300">
          <RotateCcw size={12} /> Reset
        </button>
      </div>
    </div>
  );
}
