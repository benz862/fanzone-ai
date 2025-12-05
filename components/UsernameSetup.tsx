import React, { useState } from 'react';
import { Button } from './Button';
import { moderationService } from '../services/moderationService';

interface UsernameSetupProps {
  onUsernameSet: (username: string) => void;
}

export const UsernameSetup: React.FC<UsernameSetupProps> = ({ onUsernameSet }) => {
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || username.length < 3) {
      setError("Username must be at least 3 characters.");
      return;
    }

    setIsValidating(true);
    setError(null);

    const check = await moderationService.validateContent(username, 'username');

    if (check.allowed) {
      onUsernameSet(username.trim());
    } else {
      setError(`Username rejected: ${check.reason || "Policy Violation"}`);
    }
    setIsValidating(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 z-[60] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl">
        <div className="text-center mb-6">
           <h2 className="text-2xl font-black italic text-white mb-2">CREATE IDENTITY</h2>
           <p className="text-slate-400 text-sm">
             Choose a unique username to join the FanZone chat boards.
           </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="e.g. LeafsFan99"
              maxLength={20}
            />
          </div>

          {error && (
            <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg text-red-400 text-xs font-medium flex items-center gap-2">
              <i className="fas fa-ban"></i> {error}
            </div>
          )}

          <div className="bg-slate-800/50 p-3 rounded-lg text-[10px] text-slate-500">
             <i className="fas fa-shield-alt mr-1"></i>
             Strict moderation active. No offensive, sexual, or violent usernames.
          </div>

          <Button type="submit" fullWidth isLoading={isValidating} disabled={!username}>
            Enter FanZone
          </Button>
        </form>
      </div>
    </div>
  );
};