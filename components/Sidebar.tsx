import React from 'react';
import { Team } from '../types';

interface SidebarProps {
  subscribedTeams: Team[];
  activeTeamId: string;
  onSelectTeam: (teamId: string) => void;
  onManageSubscription: () => void;
  onOpenVoiceSettings: () => void;
  onOpenAccountSettings: () => void;
  isOpen: boolean;
  onClose: () => void;
  currentView: 'ai' | 'chat';
  onViewChange: (view: 'ai' | 'chat') => void;
  username: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  subscribedTeams,
  activeTeamId,
  onSelectTeam,
  onManageSubscription,
  onOpenVoiceSettings,
  onOpenAccountSettings,
  isOpen,
  onClose,
  currentView,
  onViewChange,
  username
}) => {
  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 z-20 lg:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Content */}
      <div className={`fixed lg:static inset-y-0 left-0 w-64 bg-slate-900 border-r border-slate-800 transform transition-transform duration-300 z-30 flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h1 className="text-2xl font-black italic tracking-tighter text-white">
            FAN<span className="text-blue-500">ZONE</span>
          </h1>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
            <i className="fas fa-times"></i>
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="p-4 border-b border-slate-800">
           <div className="bg-slate-950 p-1 rounded-lg flex">
             <button 
               onClick={() => onViewChange('ai')}
               className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-colors ${currentView === 'ai' ? 'bg-slate-800 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
             >
               AI Voice
             </button>
             <button 
               onClick={() => onViewChange('chat')}
               className={`flex-1 py-2 rounded-md text-xs font-bold uppercase transition-colors ${currentView === 'chat' ? 'bg-blue-900 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
             >
               Fan Chat
             </button>
           </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          <div className="px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Your Teams
          </div>
          <div className="space-y-1 px-2">
            {subscribedTeams.map((team) => (
              <button
                key={team.id}
                onClick={() => {
                  onSelectTeam(team.id);
                  if (window.innerWidth < 1024) onClose();
                }}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  activeTeamId === team.id 
                    ? 'bg-slate-800 text-white shadow-md border-l-4' 
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                }`}
                style={{ borderColor: activeTeamId === team.id ? team.primaryColor : 'transparent' }}
              >
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ backgroundColor: team.primaryColor, color: team.secondaryColor }}
                >
                  {team.name.substring(0, 2).toUpperCase()}
                </div>
                <span className="font-medium truncate">{team.name}</span>
              </button>
            ))}
          </div>

          <div className="mt-6 px-4 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
             Settings
          </div>
          <div className="px-2 space-y-1">
             <button
              onClick={() => {
                onOpenVoiceSettings();
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
             >
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                   <i className="fas fa-microphone-lines"></i>
                </div>
                <span className="font-medium">Voice Settings</span>
             </button>

             <button
              onClick={() => {
                onManageSubscription();
                if (window.innerWidth < 1024) onClose();
              }}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-white transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                  <i className="fas fa-plus"></i>
              </div>
              <span className="font-medium">Add Team</span>
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button 
             onClick={onOpenAccountSettings}
             className="w-full flex items-center gap-3 p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors text-left"
          >
             <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-inner">
               {username ? username.substring(0,2).toUpperCase() : 'JS'}
             </div>
             <div className="flex-1 overflow-hidden">
               <p className="text-sm font-medium text-white truncate">{username || 'John Superfan'}</p>
               <p className="text-xs text-slate-400 flex items-center gap-1">
                 <i className="fas fa-cog text-[10px]"></i> Account
               </p>
             </div>
          </button>
        </div>
      </div>
    </>
  );
};