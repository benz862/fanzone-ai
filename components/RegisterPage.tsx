import React, { useState } from 'react';
import { Button } from './Button';
import { moderationService } from '../services/moderationService';

interface RegisterPageProps {
  onRegisterSuccess: (username: string) => void;
  onBack: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Basic Validation
    if (!email || !password || !username) {
      setError("All fields are required.");
      return;
    }
    if (username.length < 3) {
       setError("Username must be at least 3 characters.");
       return;
    }

    setIsValidating(true);

    try {
        // Strict Moderation Check
        const check = await moderationService.validateContent(username, 'username');
        
        if (check.allowed) {
            // Success
            // In a real app, we would send this to the backend.
            // Here we just save locally and proceed.
            localStorage.setItem('fz_temp_user', JSON.stringify({ email, password, username }));
            onRegisterSuccess(username);
        } else {
            setError(`Username rejected: ${check.reason || "Policy Violation"}`);
        }
    } catch (err) {
        setError("Verification service unavailable. Try again.");
    } finally {
        setIsValidating(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 p-8 rounded-2xl shadow-2xl animate-fade-in">
        <button onClick={onBack} className="text-slate-500 hover:text-white mb-6">
          <i className="fas fa-arrow-left mr-2"></i> Back
        </button>

        <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
        <p className="text-slate-400 mb-6">
          Join the FanZone community.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
             <input 
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
               placeholder="••••••••"
             />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Username (Public Identity)</label>
            <input 
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="e.g. SuperFan99"
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
             Strict moderation active. No offensive usernames allowed.
          </div>

          <Button type="submit" fullWidth isLoading={isValidating}>
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
};