import React, { useState } from 'react';
import { Button } from './Button';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate Login Check
    if (email && password) {
       onLogin();
    } else {
       setError("Please enter valid credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>

      <div className="w-full max-w-md bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl relative z-10 animate-fade-in">
        <div className="text-center mb-8">
           <h1 className="text-4xl font-black italic tracking-tighter text-white mb-2">
              FAN<span className="text-blue-500">ZONE</span>
            </h1>
            <p className="text-slate-400">
              Welcome back, superfan.
            </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password</label>
             <input 
               type="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
               className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:border-blue-500 focus:outline-none"
               placeholder="••••••••"
             />
          </div>

           {error && (
            <div className="text-red-400 text-xs font-medium text-center">
               {error}
            </div>
          )}

          <Button type="submit" fullWidth>
            Sign In
          </Button>
          
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-slate-800 text-slate-500">Or continue with</span>
            </div>
          </div>

          <Button type="button" variant="secondary" onClick={onLogin} fullWidth>
            <i className="fab fa-google mr-2"></i> Google
          </Button>
        </form>
      </div>
    </div>
  );
};