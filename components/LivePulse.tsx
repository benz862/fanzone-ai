import React, { useState, useEffect } from 'react';

export const LivePulse: React.FC = () => {
  const minUsers = 2153;
  const [count, setCount] = useState(minUsers + Math.floor(Math.random() * 500));

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(prev => {
        const change = Math.floor(Math.random() * 10) - 4; // -4 to +5
        const next = prev + change;
        // Ensure we never drop below the marketing minimum
        return next < minUsers ? minUsers + Math.abs(change) : next;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full px-3 py-1.5 shadow-lg">
      <div className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
      </div>
      <div className="flex flex-col leading-none">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FanZone Live</span>
        <span className="text-xs font-bold text-white tabular-nums">{count.toLocaleString()} Fans</span>
      </div>
    </div>
  );
};