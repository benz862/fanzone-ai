
import React, { useState, useEffect, useRef } from 'react';
import { Team, VoiceOption } from '../types';
import { liveService } from '../services/liveService';
import { AudioVisualizer } from './AudioVisualizer';
import { Button } from './Button';
import { VisualWidget, StandingsData } from './VisualWidgets';

interface ChatInterfaceProps {
  activeTeam: Team;
  subscribedTeams: Team[];
  activeVoice: VoiceOption;
}

interface TranscriptItem {
  id: string;
  role: 'user' | 'model';
  text: string;
  widgetType?: 'standings' | 'score';
  widgetData?: any;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeTeam, subscribedTeams, activeVoice }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isToggling, setIsToggling] = useState(false); // Prevents rapid clicking
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [audioData, setAudioData] = useState<Uint8Array | null>(null);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevVoiceRef = useRef<string>(activeVoice.id);

  // Handle Team Change: Disconnect previous session
  useEffect(() => {
    if (isConnected) {
      liveService.disconnect();
      setIsConnected(false);
    }
    setTranscripts([]);
    setError(null);
  }, [activeTeam.id]);

  // Handle Voice Change: Reconnect if active
  useEffect(() => {
    if (prevVoiceRef.current !== activeVoice.id) {
        prevVoiceRef.current = activeVoice.id;
        
        if (isConnected) {
            const reconnect = async () => {
                await liveService.disconnect();
                // Wait a moment for cleanup
                await new Promise(r => setTimeout(r, 500));
                // Pass description to enforce persona
                await liveService.connect(activeTeam.name, subscribedTeams.map(t => t.name), activeVoice.geminiId, activeVoice.description);
                // Trigger the voice update confirmation prompt
                await liveService.sendText(`System: The user has explicitly selected a new voice profile: "${activeVoice.name}". Confirm this change to the user in their detected language.`);
            };
            reconnect();
        }
    }
  }, [activeVoice, isConnected, activeTeam.name, subscribedTeams]);

  useEffect(() => {
    // Setup Service Callbacks
    liveService.setCallbacks({
      onStatusChange: (connected) => setIsConnected(connected),
      onTranscript: (sender, text, isFinal) => {
        setTranscripts((prev) => {
           const last = prev[prev.length - 1];
           // If the last message is from the same sender AND DOES NOT HAVE A WIDGET, append the chunk
           if (last && last.role === sender && !last.widgetType) {
             return [
               ...prev.slice(0, -1),
               { ...last, text: last.text + text }
             ];
           }
           // Otherwise, create a new message bubble
           return [...prev, { id: Date.now().toString(), role: sender, text }];
        });
      },
      onAudioData: (data) => setAudioData(data),
      onError: (msg) => setError(msg),
      onWidget: (type, data) => {
          setTranscripts(prev => [
              ...prev,
              { 
                  id: Date.now().toString(), 
                  role: 'model', 
                  text: '', 
                  widgetType: type as any, 
                  widgetData: data 
              }
          ]);
      }
    });

    return () => {
      liveService.disconnect();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcripts]);

  const toggleConnection = async () => {
    if (isToggling) return; // Ignore clicks while processing
    setIsToggling(true);
    
    try {
      if (isConnected) {
        await liveService.disconnect();
      } else {
        setError(null);
        await liveService.connect(activeTeam.name, subscribedTeams.map(t => t.name), activeVoice.geminiId, activeVoice.description);
      }
    } finally {
      // Small delay to ensure state settles before allowing another click
      setTimeout(() => setIsToggling(false), 500);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 relative overflow-hidden">
       {/* Ambient Background based on Team Color */}
       <div 
         className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-10 blur-[100px] pointer-events-none"
         style={{ backgroundColor: activeTeam.primaryColor }}
       />

       {/* Header */}
      <div className="z-10 px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-4">
           <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-lg ring-2 ring-slate-700"
            style={{ backgroundColor: activeTeam.primaryColor, color: activeTeam.secondaryColor }}
           >
             {activeTeam.name.substring(0,2).toUpperCase()}
           </div>
           <div>
             <h2 className="text-lg font-bold text-white">{activeTeam.name} Air</h2>
             <p className="text-xs text-slate-400">Voice-First Sports Talk</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
            <span className="text-xs font-mono text-slate-500">{isConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>
      </div>

      {/* Main Voice UI Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 z-10 relative">
        
        {/* Visualizer Container */}
        <div className="w-full max-w-lg mb-12 relative flex items-center justify-center h-32">
           <AudioVisualizer dataArray={audioData} isActive={isConnected} />
        </div>

        {/* Central Action Button */}
        <div className="relative group">
            {isConnected && (
                <div className="absolute inset-0 bg-blue-500 rounded-full blur-xl opacity-20 group-hover:opacity-40 animate-pulse transition-opacity"></div>
            )}
            <button
                onClick={toggleConnection}
                disabled={isToggling}
                className={`relative w-32 h-32 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl border-4 ${
                    isToggling
                    ? 'bg-slate-700 border-slate-600 opacity-80 cursor-wait'
                    : isConnected 
                      ? 'bg-red-600 border-red-800 hover:bg-red-500 scale-105' 
                      : 'bg-slate-800 border-slate-700 hover:bg-slate-700 hover:border-blue-500'
                }`}
            >
                {isToggling ? (
                  <i className="fas fa-spinner fa-spin text-4xl text-slate-400"></i>
                ) : (
                  <>
                    <i className={`fas fa-microphone${isConnected ? '-slash' : ''} text-4xl mb-2 ${isConnected ? 'text-white' : 'text-slate-400 group-hover:text-blue-400'}`}></i>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {isConnected ? 'End Chat' : 'Start Talk'}
                    </span>
                  </>
                )}
            </button>
        </div>

        {error && (
            <div className="mt-6 p-3 bg-red-900/50 border border-red-800 text-red-200 rounded-lg text-sm max-w-sm text-center">
                <i className="fas fa-exclamation-triangle mr-2"></i>
                {error}
            </div>
        )}

        {!isConnected && !error && !isToggling && (
            <p className="mt-8 text-slate-500 text-center max-w-sm animate-fade-in">
                Tap the microphone to start a live voice conversation about the <span className="text-slate-300 font-semibold">{activeTeam.name}</span>.
            </p>
        )}
      </div>

      {/* Transcript / Subtitles Area */}
      <div className="h-1/3 border-t border-slate-800 bg-slate-900/90 backdrop-blur z-10 flex flex-col">
         <div className="px-4 py-2 border-b border-slate-800/50 bg-slate-900 flex justify-between items-center">
             <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Live Transcript</span>
             <span className="text-[10px] text-slate-600 uppercase tracking-wider bg-slate-800 px-2 py-1 rounded">
               <i className="fas fa-volume-up mr-1"></i> {activeVoice.name}
             </span>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
            {transcripts.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-600 italic text-sm">
                    Transcript will appear here...
                </div>
            ) : (
                transcripts.map((t, i) => (
                    <div key={`${t.id}-${i}`} className={`flex flex-col w-full ${t.role === 'user' ? 'items-end' : 'items-start'}`}>
                        {/* Render Text Bubble if there is text */}
                        {t.text && (
                          <div className={`max-w-[85%] p-3 rounded-xl text-sm mb-2 ${
                              t.role === 'user' 
                              ? 'bg-slate-800 text-slate-300 rounded-tr-none' 
                              : 'bg-blue-900/20 border border-blue-900/50 text-blue-100 rounded-tl-none'
                          }`}>
                              <span className="block text-[10px] font-bold opacity-50 mb-1 uppercase">
                                  {t.role === 'user' ? 'You' : 'FanZone AI'}
                              </span>
                              {t.text}
                          </div>
                        )}
                        
                        {/* Render Widget if Present */}
                        {t.widgetType && t.widgetData && (
                           <VisualWidget type={t.widgetType} data={t.widgetData} />
                        )}
                    </div>
                ))
            )}
         </div>
      </div>
    </div>
  );
};
