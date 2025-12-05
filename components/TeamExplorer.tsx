import React, { useState, useMemo } from 'react';
import { AVAILABLE_TEAMS } from '../constants';
import { Button } from './Button';
import { Team } from '../types';

interface TeamExplorerProps {
  onClose: () => void;
  onGetStarted: () => void;
  initialSport?: string;
}

export const TeamExplorer: React.FC<TeamExplorerProps> = ({ onClose, onGetStarted, initialSport = 'All' }) => {
  const [activeSport, setActiveSport] = useState(initialSport);
  const [searchQuery, setSearchQuery] = useState('');

  const sports = useMemo(() => {
    return ['All', ...Array.from(new Set(AVAILABLE_TEAMS.map(t => t.sport)))];
  }, []);

  const filteredTeams = useMemo(() => {
    return AVAILABLE_TEAMS.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            team.league.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSport = activeSport === 'All' || team.sport === activeSport;
      return matchesSearch && matchesSport;
    });
  }, [searchQuery, activeSport]);

  const teamsByLeague = useMemo(() => {
    const groups: Record<string, Team[]> = {};
    filteredTeams.forEach(team => {
      if (!groups[team.league]) groups[team.league] = [];
      groups[team.league].push(team);
    });
    return groups;
  }, [filteredTeams]);

  return (
    <div className="fixed inset-0 bg-slate-950 z-[100] flex flex-col overflow-hidden animate-fade-in">
        {/* Header - Solid background and high z-index to cover any underlying fixed elements */}
        <div className="bg-slate-900 border-b border-slate-800 p-4 md:p-6 flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl z-20 relative">
            <div className="flex items-center gap-4 w-full md:w-auto">
                <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                    <i className="fas fa-arrow-left fa-lg"></i>
                </button>
                <div>
                    <h2 className="text-xl md:text-2xl font-bold text-white">Team Explorer</h2>
                    <p className="text-xs text-slate-400">Browse available teams & leagues</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="relative flex-1 md:w-64">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"></i>
                    <input 
                        type="text" 
                        placeholder="Find your team..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:border-blue-500 focus:outline-none"
                    />
                </div>
                <Button onClick={onGetStarted} className="whitespace-nowrap hidden md:flex">
                    Start Membership
                </Button>
            </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
            {/* Sidebar (Desktop) */}
            <div className="hidden md:block w-64 bg-slate-900 border-r border-slate-800 overflow-y-auto p-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase mb-4 px-2">Sports</h3>
                <div className="space-y-1">
                    {sports.map(sport => (
                        <button
                            key={sport}
                            onClick={() => setActiveSport(sport)}
                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                activeSport === sport 
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            {sport}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-slate-950 relative">
                {/* Mobile Tabs */}
                <div className="md:hidden sticky top-0 bg-slate-900/95 backdrop-blur z-10 border-b border-slate-800 overflow-x-auto whitespace-nowrap p-2">
                     {sports.map(sport => (
                        <button
                            key={sport}
                            onClick={() => setActiveSport(sport)}
                            className={`inline-block px-4 py-2 rounded-full text-xs font-bold mr-2 transition-colors ${
                                activeSport === sport 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                        >
                            {sport}
                        </button>
                    ))}
                </div>

                <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-full">
                    {Object.keys(teamsByLeague).length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-500">
                             <i className="fas fa-search fa-3x mb-4 opacity-20"></i>
                             <p>No teams found matching "{searchQuery}"</p>
                        </div>
                    ) : (
                        <div className="space-y-12 pb-20">
                             {Object.entries(teamsByLeague).map(([league, teams]) => (
                                 <div key={league} className="animate-fade-in-up">
                                     <div className="flex items-center gap-3 mb-6 border-b border-slate-800/50 pb-2">
                                         <div className="w-1 h-6 bg-blue-500 rounded-full"></div>
                                         <h3 className="text-xl font-bold text-white tracking-tight">{league}</h3>
                                         <span className="text-xs text-slate-500 bg-slate-900 px-2 py-1 rounded-full border border-slate-800">
                                            {teams.length} Teams
                                         </span>
                                     </div>
                                     
                                     <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                         {teams.map(team => (
                                             <div key={team.id} className="group bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-xl p-4 flex flex-col items-center text-center transition-all hover:-translate-y-1 hover:shadow-xl shadow-black/50">
                                                 <div 
                                                    className="w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-lg mb-3 group-hover:scale-110 transition-transform duration-300"
                                                    style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}
                                                 >
                                                     {team.name.substring(0, 2).toUpperCase()}
                                                 </div>
                                                 <h4 className="text-sm font-bold text-slate-200 group-hover:text-white leading-tight mb-1">
                                                     {team.name}
                                                 </h4>
                                                 <span className="text-[10px] text-slate-500 uppercase tracking-wider">{team.sport}</span>
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
        
        {/* Floating CTA for Mobile */}
        <div className="md:hidden fixed bottom-6 right-6 z-30">
             <Button onClick={onGetStarted} className="rounded-full shadow-2xl shadow-blue-500/30 w-14 h-14 flex items-center justify-center p-0">
                 <i className="fas fa-arrow-right"></i>
             </Button>
        </div>
    </div>
  );
};