import React from 'react';
import { VOICE_OPTIONS } from '../constants';
import { VoiceOption } from '../types';
import { Button } from './Button';

interface VoiceSelectorProps {
  activeVoiceId: string;
  onSelectVoice: (voice: VoiceOption) => void;
  onClose: () => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({ activeVoiceId, onSelectVoice, onClose }) => {
  return (
    <div className="fixed inset-0 bg-slate-900/90 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="p-6 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-white">Voice Settings</h2>
                <p className="text-slate-400">Choose your AI sports commentator.</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <i className="fas fa-times fa-lg"></i>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {VOICE_OPTIONS.map(voice => {
            const isActive = voice.id === activeVoiceId;
            return (
              <button
                key={voice.id}
                onClick={() => onSelectVoice(voice)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                  isActive
                    ? 'bg-blue-900/20 border-blue-500 shadow-lg shadow-blue-900/20'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500 hover:bg-slate-700'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-slate-900 text-slate-500'
                }`}>
                  <i className={`fas ${voice.category === 'Female' ? 'fa-venus' : voice.category === 'Male' ? 'fa-mars' : 'fa-genderless'}`}></i>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                     <h4 className={`font-bold ${isActive ? 'text-white' : 'text-slate-200'}`}>{voice.name}</h4>
                     {isActive && <span className="text-[10px] font-bold bg-blue-500 text-white px-2 py-0.5 rounded-full uppercase">Active</span>}
                  </div>
                  <p className="text-sm text-slate-400">{voice.description}</p>
                </div>

                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                   isActive ? 'border-blue-500' : 'border-slate-600'
                }`}>
                   {isActive && <div className="w-2 h-2 rounded-full bg-blue-500"></div>}
                </div>
              </button>
            );
          })}
        </div>

        <div className="p-6 bg-slate-800 border-t border-slate-700">
           <Button variant="ghost" onClick={onClose} fullWidth>Close</Button>
        </div>
      </div>
    </div>
  );
};