
import React from 'react';
import { Team } from '../types';

export interface StandingsData {
  league: string;
  teams: {
    rank: number;
    name: string;
    wins: number;
    losses: number;
    points?: number; // Hockey/Soccer
    diff?: string; // Goal/Run diff
  }[];
}

interface VisualWidgetProps {
  type: 'standings' | 'score';
  data: StandingsData; // Union type in future if needed
}

export const VisualWidget: React.FC<VisualWidgetProps> = ({ type, data }) => {
  if (type === 'standings') {
    return (
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl overflow-hidden shadow-2xl my-4 animate-fade-in-up">
        {/* Header */}
        <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center">
           <div className="flex items-center gap-2">
             <i className="fas fa-list-ol text-blue-500"></i>
             <span className="font-bold text-white uppercase tracking-wider text-xs">{data.league} Standings</span>
           </div>
           <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-1 rounded">Live Data</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 text-slate-500 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3 w-8 text-center">#</th>
                <th className="p-3">Team</th>
                <th className="p-3 text-center">W</th>
                <th className="p-3 text-center">L</th>
                <th className="p-3 text-center">{data.league === 'NFL' || data.league === 'MLB' ? 'Diff' : 'Pts'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.teams.slice(0, 10).map((team, idx) => (
                <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                  <td className="p-3 text-center font-mono text-slate-400">{team.rank}</td>
                  <td className="p-3 font-bold text-white truncate max-w-[120px]">
                    {team.name}
                  </td>
                  <td className="p-3 text-center text-slate-300">{team.wins}</td>
                  <td className="p-3 text-center text-slate-300">{team.losses}</td>
                  <td className="p-3 text-center font-bold text-blue-400">
                    {team.points ?? team.diff}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {data.teams.length > 10 && (
             <div className="p-2 text-center text-[10px] text-slate-500 bg-slate-900">
               Showing Top 10
             </div>
          )}
        </div>
      </div>
    );
  }
  
  return null;
};
