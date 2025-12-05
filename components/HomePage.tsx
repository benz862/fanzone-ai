import React, { useMemo, useState } from 'react';
import { Button } from './Button';
import { AVAILABLE_TEAMS } from '../constants';
import { TeamExplorer } from './TeamExplorer';
import { LivePulse } from './LivePulse';

interface HomePageProps {
  onGetStarted: () => void;
  onLogin: () => void;
}

// Custom SVG Motifs for background aesthetics
const SportMotif: React.FC<{ sport: string }> = ({ sport }) => {
  const commonClasses = "w-full h-full text-slate-400 fill-current";
  
  switch (sport) {
    case 'Hockey':
      return (
        <svg viewBox="0 0 100 100" className={commonClasses}>
          {/* Crossed Sticks */}
          <path d="M20,20 L80,80 M80,20 L20,80" stroke="currentColor" strokeWidth="8" strokeLinecap="round" opacity="0.5" />
          <circle cx="50" cy="85" r="8" opacity="0.8" />
        </svg>
      );
    case 'Soccer':
      return (
        <svg viewBox="0 0 100 100" className={commonClasses}>
          {/* Hexagon Pattern / Ball Abstract */}
          <path d="M50,10 L85,30 L85,70 L50,90 L15,70 L15,30 Z" fill="none" stroke="currentColor" strokeWidth="6" />
          <path d="M50,50 L50,10 M50,50 L85,70 M50,50 L15,70" stroke="currentColor" strokeWidth="4" />
        </svg>
      );
    case 'American Football':
      return (
        <svg viewBox="0 0 100 100" className={commonClasses}>
          {/* Gridiron Lines */}
          <rect x="10" y="10" width="80" height="80" rx="5" fill="none" stroke="currentColor" strokeWidth="4" />
          <line x1="10" y1="30" x2="90" y2="30" stroke="currentColor" strokeWidth="4" />
          <line x1="10" y1="50" x2="90" y2="50" stroke="currentColor" strokeWidth="4" />
          <line x1="10" y1="70" x2="90" y2="70" stroke="currentColor" strokeWidth="4" />
          {/* Hash marks */}
          <line x1="40" y1="40" x2="60" y2="40" stroke="currentColor" strokeWidth="4" />
          <line x1="40" y1="60" x2="60" y2="60" stroke="currentColor" strokeWidth="4" />
        </svg>
      );
    case 'Basketball':
      return (
        <svg viewBox="0 0 100 100" className={commonClasses}>
          {/* Court Key & Hoop */}
          <rect x="25" y="50" width="50" height="40" fill="none" stroke="currentColor" strokeWidth="4" />
          <path d="M25,50 A25,25 0 0,1 75,50" fill="none" stroke="currentColor" strokeWidth="4" />
          <circle cx="50" cy="20" r="15" fill="none" stroke="currentColor" strokeWidth="4" />
        </svg>
      );
    case 'Baseball':
      return (
        <svg viewBox="0 0 100 100" className={commonClasses}>
          {/* Diamond */}
          <path d="M50,10 L90,50 L50,90 L10,50 Z" fill="none" stroke="currentColor" strokeWidth="6" />
          {/* Bases */}
          <rect x="46" y="8" width="8" height="8" fill="currentColor" />
          <rect x="84" y="46" width="8" height="8" fill="currentColor" />
          <rect x="46" y="84" width="8" height="8" fill="currentColor" />
          <rect x="8" y="46" width="8" height="8" fill="currentColor" />
        </svg>
      );
    case 'Motorsport':
      return (
        <svg viewBox="0 0 100 100" className={commonClasses}>
           {/* Chevrons / Flag Pattern */}
           <path d="M10,20 L40,20 L30,40 L0,40 Z" fill="currentColor" opacity="0.6"/>
           <path d="M40,20 L70,20 L60,40 L30,40 Z" fill="currentColor" opacity="0.4"/>
           <path d="M20,50 L50,50 L40,70 L10,70 Z" fill="currentColor" opacity="0.6"/>
           <path d="M50,50 L80,50 L70,70 L40,70 Z" fill="currentColor" opacity="0.4"/>
        </svg>
      );
    case 'Rugby':
       return (
         <svg viewBox="0 0 100 100" className={commonClasses}>
            {/* Goal Posts H */}
            <path d="M25,100 L25,30 M25,60 L75,60 M75,100 L75,30" stroke="currentColor" strokeWidth="8" fill="none" />
         </svg>
       );
    case 'Cricket':
        return (
          <svg viewBox="0 0 100 100" className={commonClasses}>
             {/* Wickets */}
             <rect x="35" y="30" width="5" height="60" fill="currentColor" />
             <rect x="47" y="30" width="5" height="60" fill="currentColor" />
             <rect x="59" y="30" width="5" height="60" fill="currentColor" />
             {/* Bails */}
             <rect x="35" y="25" width="29" height="4" fill="currentColor" />
          </svg>
        );
    default:
      return (
        <svg viewBox="0 0 100 100" className={commonClasses}>
           <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="4" fill="none" />
           <path d="M50,10 L50,90 M10,50 L90,50" stroke="currentColor" strokeWidth="4" />
        </svg>
      );
  }
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted, onLogin }) => {
  const [isExplorerOpen, setIsExplorerOpen] = useState(false);
  const [explorerInitialSport, setExplorerInitialSport] = useState('All');

  // Group leagues by sport for display
  const sportsData = useMemo(() => {
    const data: Record<string, string[]> = {};
    AVAILABLE_TEAMS.forEach(team => {
      if (!data[team.sport]) {
        data[team.sport] = [];
      }
      if (!data[team.sport].includes(team.league)) {
        data[team.sport].push(team.league);
      }
    });
    return data;
  }, []);

  // Helper for icons
  const getSportIcon = (sport: string) => {
    switch(sport) {
      case 'Hockey': return 'fa-hockey-puck';
      case 'Soccer': return 'fa-futbol';
      case 'American Football': return 'fa-football';
      case 'Basketball': return 'fa-basketball';
      case 'Baseball': return 'fa-baseball-bat-ball';
      case 'Motorsport': return 'fa-flag-checkered';
      case 'Rugby': return 'fa-rugby-ball';
      case 'Cricket': return 'fa-cricket-bat-ball';
      default: return 'fa-trophy';
    }
  };

  const handleOpenExplorer = (sport: string = 'All') => {
    setExplorerInitialSport(sport);
    setIsExplorerOpen(true);
  };

  // Color mappings for splash effect
  const sportThemes: Record<string, string> = {
    'Hockey': 'from-cyan-900 to-slate-900 border-cyan-800',
    'Soccer': 'from-emerald-900 to-slate-900 border-emerald-800',
    'American Football': 'from-blue-900 to-slate-900 border-blue-800',
    'Basketball': 'from-orange-900 to-slate-900 border-orange-800',
    'Baseball': 'from-red-900 to-slate-900 border-red-800',
    'Motorsport': 'from-yellow-900 to-slate-900 border-yellow-800',
    'Rugby': 'from-teal-900 to-slate-900 border-teal-800',
    'Cricket': 'from-indigo-900 to-slate-900 border-indigo-800'
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative overflow-hidden font-sans text-white">
      {/* Explorer Modal */}
      {isExplorerOpen && (
        <TeamExplorer 
          onClose={() => setIsExplorerOpen(false)} 
          onGetStarted={() => {
            setIsExplorerOpen(false);
            onGetStarted();
          }}
          initialSport={explorerInitialSport}
        />
      )}

      {/* Navbar with backdrop blur to prevent overlap issues */}
      <nav className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-between items-center bg-slate-950/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
             <div className="text-xl font-black italic tracking-tighter text-white">
                FAN<span className="text-blue-500">ZONE</span>
             </div>
        </div>
        <div className="flex items-center gap-6">
            <div className="hidden md:block">
               <LivePulse />
            </div>
            <button 
                onClick={onLogin} 
                className="text-slate-300 hover:text-white font-bold text-sm transition-colors border border-slate-700 hover:border-blue-500 bg-slate-900/50 px-4 py-2 rounded-full"
            >
                Log In
            </button>
        </div>
      </nav>

      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-blue-900/20 to-slate-950 pointer-events-none"></div>
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-40 -left-20 w-72 h-72 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Hero Section */}
      <div className="relative z-10 flex flex-col items-center justify-center pt-40 pb-12 text-center px-6">
        <div className="md:hidden mb-8 mt-4">
             <LivePulse />
        </div>

        <div className="mb-6">
           <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white drop-shadow-lg">
             FAN<span className="text-blue-500">ZONE</span>
           </h1>
        </div>

        <h2 className="text-2xl md:text-4xl font-bold mb-6 text-slate-200">
          Talk Sports. Anytime. Anywhere.
        </h2>

        <p className="max-w-xl text-lg text-slate-400 mb-12">
          The ultimate AI-powered sports companion. Real-time news, deep analysis, and live voice conversations about the teams you love.
        </p>

        <Button 
          onClick={onGetStarted}
          className="text-lg px-12 py-4 bg-blue-600 hover:bg-blue-500 rounded-full shadow-[0_0_30px_rgba(37,99,235,0.4)] transition-all hover:scale-105"
        >
          Get Started <i className="fas fa-arrow-right ml-3"></i>
        </Button>

        {/* Feature Icons */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-slate-400 mb-16">
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <i className="fas fa-microphone-lines text-blue-400 text-xl"></i>
            </div>
            <p className="font-semibold">Voice-First AI</p>
          </div>
          <div className="flex flex-col items-center">
             <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <i className="fas fa-newspaper text-green-400 text-xl"></i>
            </div>
            <p className="font-semibold">Live Real-time News</p>
          </div>
          <div className="flex flex-col items-center">
             <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center mb-3">
              <i className="fas fa-users text-purple-400 text-xl"></i>
            </div>
            <p className="font-semibold">Fan Communities</p>
          </div>
        </div>
      </div>

      {/* LEAGUE SHOWCASE & MIX MATCH */}
      <div className="relative z-10 bg-slate-900 border-y border-slate-800 py-20 px-6">
         <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
               <span className="text-blue-500 font-bold tracking-widest uppercase text-xs mb-2 block">Unlimited Freedom</span>
               <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">Build Your Dream Dashboard</h3>
               <p className="text-slate-400 max-w-2xl mx-auto text-lg">
                 Why limit yourself to one league? <span className="text-white font-semibold">Mix and match</span> teams from across the globe. 
                 Combine the Maple Leafs, Liverpool FC, and the Kansas City Chiefs in one subscription.
               </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
               {Object.entries(sportsData).map(([sport, leagues]) => {
                  const themeClass = sportThemes[sport] || 'from-slate-800 to-slate-900 border-slate-700';
                  
                  return (
                   <div 
                    key={sport} 
                    onClick={() => handleOpenExplorer(sport)}
                    className={`relative overflow-hidden bg-gradient-to-br ${themeClass} p-6 rounded-2xl border hover:border-white/20 transition-all hover:-translate-y-1 shadow-lg group h-48 flex flex-col cursor-pointer`}
                   >
                      {/* Background Sport Motif Graphic */}
                      <div className="absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.15] group-hover:opacity-25 transition-opacity duration-500 pointer-events-none transform rotate-12 text-black mix-blend-overlay">
                         <SportMotif sport={sport} />
                      </div>
                      
                      {/* Gradient Overlay for Depth */}
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40 pointer-events-none"></div>
  
                      {/* Card Content */}
                      <div className="relative z-10 flex flex-col h-full">
                        <div className="w-10 h-10 rounded-lg bg-black/20 flex items-center justify-center mb-4 group-hover:bg-white/20 transition-colors shadow-inner border border-white/10">
                          <i className={`fas ${getSportIcon(sport)} text-lg text-white/70 group-hover:text-white`}></i>
                        </div>
                        <h4 className="text-lg font-bold text-white mb-auto tracking-tight shadow-black drop-shadow-md">{sport}</h4>
                        
                        {/* Leagues List */}
                        <div className="mt-3 flex flex-wrap gap-2">
                          {leagues.slice(0, 3).map(league => (
                            <span key={league} className="text-[9px] font-bold uppercase tracking-wide bg-black/30 text-white/80 px-2 py-1 rounded border border-white/10">
                              {league.split(' ')[0]}
                            </span>
                          ))}
                          {leagues.length > 3 && (
                            <span className="text-[9px] font-bold text-white/60 px-1 py-1">+More</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Hover Hint */}
                      <div className="absolute bottom-4 right-4 text-white opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 text-xs font-bold">
                         Explore <i className="fas fa-arrow-right ml-1"></i>
                      </div>
                   </div>
                 );
               })}
            </div>
            
            <div className="mt-16 text-center">
                <Button onClick={() => handleOpenExplorer('All')} variant="secondary" className="px-8">
                   Explore All Teams <i className="fas fa-search ml-2"></i>
                </Button>
            </div>
         </div>
      </div>

      {/* Footer */}
      <div className="p-8 text-center bg-slate-950 text-slate-600 text-xs">
        &copy; 2025 FanZone.chat. All rights reserved.
      </div>
    </div>
  );
};