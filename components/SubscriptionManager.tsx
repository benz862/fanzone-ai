import React, { useState, useMemo } from 'react';
import { AVAILABLE_TEAMS, getSubscriptionInfo } from '../constants';
import { Team } from '../types';
import { Button } from './Button';

interface SubscriptionManagerProps {
  subscribedTeams: Team[];
  onUpdateSubscriptions: (teams: Team[]) => void;
  onClose: () => void;
}

export const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ 
  subscribedTeams, 
  onUpdateSubscriptions,
  onClose
}) => {
  const [selectedTeams, setSelectedTeams] = useState<Team[]>(subscribedTeams);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSport, setActiveSport] = useState<string>('All');

  const isSubscribed = (teamId: string) => selectedTeams.some(t => t.id === teamId);

  const toggleTeam = (team: Team) => {
    if (isSubscribed(team.id)) {
      if (selectedTeams.length === 1) {
        alert("You must have at least one team in your base subscription.");
        return;
      }
      setSelectedTeams(prev => prev.filter(t => t.id !== team.id));
    } else {
      setSelectedTeams(prev => [...prev, team]);
    }
  };

  const sports = useMemo(() => {
    const allSports = Array.from(new Set(AVAILABLE_TEAMS.map(t => t.sport)));
    return ['All', ...allSports];
  }, []);

  const filteredTeams = useMemo(() => {
    return AVAILABLE_TEAMS.filter(team => {
      const matchesSearch = team.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            team.league.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesSport = activeSport === 'All' || team.sport === activeSport;
      return matchesSearch && matchesSport;
    });
  }, [searchQuery, activeSport]);

  // Group filtered teams by League
  const teamsByLeague = useMemo(() => {
    const groups: Record<string, Team[]> = {};
    filteredTeams.forEach(team => {
      if (!groups[team.league]) groups[team.league] = [];
      groups[team.league].push(team);
    });
    return groups;
  }, [filteredTeams]);

  // Calculate Tier Info
  const subInfo = getSubscriptionInfo(selectedTeams.length);

  const handleSave = () => {
    setIsProcessing(true);
    setTimeout(() => {
        onUpdateSubscriptions(selectedTeams);
        setIsProcessing(false);
        onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/95 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-800 border-b border-slate-700 flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
            <div>
                <h2 className="text-2xl font-bold text-white">Manage Subscription</h2>
                <p className="text-slate-400 text-sm mt-1">
                   Unlock huge savings with Tier Bundles. Base Plan: $4.99.
                </p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white absolute top-4 right-4 md:static">
                <i className="fas fa-times fa-lg"></i>
            </button>
        </div>

        {/* Controls */}
        <div className="bg-slate-800/50 border-b border-slate-700 p-4 space-y-4">
           {/* Search */}
           <div className="relative">
             <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"></i>
             <input 
               type="text"
               placeholder="Search teams (e.g., 'Leafs', 'Arsenal', 'Lakers')..."
               value={searchQuery}
               onChange={(e) => setSearchQuery(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
             />
           </div>

           {/* Sport Filters */}
           <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
             {sports.map(sport => (
               <button
                 key={sport}
                 onClick={() => setActiveSport(sport)}
                 className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                   activeSport === sport 
                   ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                   : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                 }`}
               >
                 {sport}
               </button>
             ))}
           </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950">
            {Object.keys(teamsByLeague).length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-500">
                    <i className="fas fa-search fa-3x mb-4 opacity-20"></i>
                    <p>No teams found matching your criteria.</p>
                </div>
            ) : (
                <div className="space-y-8">
                  {Object.entries(teamsByLeague).map(([league, teams]) => (
                    <div key={league}>
                      <h3 className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-3 flex items-center gap-2">
                        <span className="w-1 h-4 bg-blue-500 rounded-full"></span>
                        {league}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {(teams as Team[]).map(team => (
                            <div 
                                key={team.id}
                                onClick={() => toggleTeam(team)}
                                className={`cursor-pointer rounded-lg p-3 border transition-all duration-200 flex items-center gap-3 relative overflow-hidden group ${
                                    isSubscribed(team.id)
                                    ? 'bg-slate-800 border-blue-500 shadow-md'
                                    : 'bg-slate-900 border-slate-800 hover:border-slate-600'
                                }`}
                            >
                                <div 
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm shrink-0"
                                    style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}
                                >
                                    {team.name.substring(0,2).toUpperCase()}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className={`font-medium truncate ${isSubscribed(team.id) ? 'text-white' : 'text-slate-300'}`}>
                                      {team.name}
                                    </h4>
                                    <span className="text-[10px] text-slate-500">{team.league}</span>
                                </div>
                                {isSubscribed(team.id) && (
                                    <div className="text-blue-500 animate-fade-in">
                                        <i className="fas fa-check-circle"></i>
                                    </div>
                                )}
                            </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
            )}
        </div>

        {/* Footer / Summary */}
        <div className="p-4 md:p-6 bg-slate-800 border-t border-slate-700">
            <div className="flex flex-col gap-4 mb-4">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div className="flex-1 overflow-x-auto max-w-full pb-2 md:pb-0">
                         <div className="flex gap-2">
                            {selectedTeams.map(t => (
                                <span key={t.id} className="inline-flex items-center gap-1 bg-slate-900 text-slate-300 px-2 py-1 rounded text-xs border border-slate-700 whitespace-nowrap">
                                <span className="w-2 h-2 rounded-full" style={{backgroundColor: t.primaryColor}}></span>
                                {t.name}
                                </span>
                            ))}
                         </div>
                    </div>
                    
                    <div className="text-right shrink-0">
                        <div className="flex flex-col items-end">
                            <span className="text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
                                {subInfo.tierName}
                            </span>
                            <div className="flex items-end gap-2">
                                {subInfo.savings > 0 && (
                                    <span className="text-slate-500 line-through text-lg font-semibold mb-1">
                                        ${subInfo.normalPrice.toFixed(2)}
                                    </span>
                                )}
                                <span className="text-3xl font-bold text-white leading-none">
                                    ${subInfo.price.toFixed(2)}
                                </span>
                            </div>
                            {subInfo.savings > 0 && (
                                <span className="mt-1 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                                    You Save ${subInfo.savings.toFixed(2)}
                                </span>
                            )}
                            <span className="text-slate-500 text-[10px] mt-1">per month</span>
                        </div>
                    </div>
                </div>

                {/* Savings / Tier Progress Bar */}
                <div className="w-full bg-slate-900 rounded-lg p-3 flex items-center justify-between border border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${subInfo.savings > 0 ? 'bg-green-600' : 'bg-slate-700'}`}>
                            <i className={`fas ${subInfo.savings > 0 ? 'fa-gift' : 'fa-layer-group'}`}></i>
                        </div>
                        <div>
                            <p className="text-sm text-slate-200 font-medium">
                                {subInfo.message || subInfo.nextUnlock || "Select more teams to see bundles"}
                            </p>
                        </div>
                    </div>
                    {/* Visual Dots for Tier levels (3, 5, 10) */}
                    <div className="hidden md:flex gap-1">
                       {[1,2,3,4,5,6,7,8,9,10].map(n => (
                           <div key={n} className={`w-1.5 h-6 rounded-sm ${n <= selectedTeams.length ? 'bg-blue-500' : 'bg-slate-800'} ${[3,5,10].includes(n) ? 'w-3 bg-blue-400' : ''}`} />
                       ))}
                    </div>
                </div>
            </div>
            
            <div className="flex gap-3 mt-4">
                <Button variant="ghost" onClick={onClose} fullWidth>Cancel</Button>
                <Button variant="primary" onClick={handleSave} isLoading={isProcessing} fullWidth>
                    Confirm & Update Plan ({selectedTeams.length} Teams)
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
};