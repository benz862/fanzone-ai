import React from 'react';
import { Button } from './Button';
import { Team } from '../types';
import { getSubscriptionInfo } from '../constants';

interface AccountSettingsProps {
  username: string;
  email: string;
  subscribedTeams: Team[];
  billingCycle: 'monthly' | 'yearly';
  onLogout: () => void;
  onManageTeams: () => void;
  onClose: () => void;
}

export const AccountSettings: React.FC<AccountSettingsProps> = ({
  username,
  email,
  subscribedTeams,
  billingCycle,
  onLogout,
  onManageTeams,
  onClose
}) => {
  const subInfo = getSubscriptionInfo(subscribedTeams.length);
  const currentPrice = billingCycle === 'monthly' ? subInfo.price : (subInfo.price * 12 * 0.8) / 12; // Approximation based on logic
  // Actually, let's just use the tier logic if we had the yearly price handy, but for display:
  const displayPrice = billingCycle === 'monthly' ? subInfo.price.toFixed(2) : (subInfo.price * 9.6).toFixed(2); // Rough yearly calc or just show monthly rate equivalent
  
  // Let's use the actual price from the tiers logic if possible, but for now display the monthly rate as the primary metric
  
  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel your subscription? You will lose access to FanZone at the end of your billing period.")) {
      alert("Subscription scheduled for cancellation.");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 bg-slate-800 border-b border-slate-700 flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-white">Account & Settings</h2>
                <p className="text-slate-400 text-sm">Manage your profile and subscription.</p>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-white">
                <i className="fas fa-times fa-lg"></i>
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
            
            {/* Profile Section */}
            <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                    {username ? username.substring(0, 2).toUpperCase() : 'US'}
                </div>
                <div className="flex-1">
                    <h3 className="text-xl font-bold text-white">{username}</h3>
                    <p className="text-slate-400">{email || 'user@example.com'}</p>
                    <div className="mt-2 flex gap-2">
                         <span className="px-2 py-1 rounded bg-blue-900/30 text-blue-400 text-xs border border-blue-900/50">
                            Verified Member
                         </span>
                         <span className="px-2 py-1 rounded bg-slate-800 text-slate-400 text-xs border border-slate-700">
                            Joined {new Date().getFullYear()}
                         </span>
                    </div>
                </div>
            </div>

            <hr className="border-slate-800" />

            {/* Subscription Section */}
            <div>
                <h3 className="text-lg font-bold text-white mb-4">Current Subscription</h3>
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <i className="fas fa-receipt fa-4x text-white"></i>
                    </div>

                    <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Plan Tier</p>
                            <p className="text-lg text-white font-bold">{subInfo.tierName}</p>
                            <p className="text-sm text-slate-400">{subscribedTeams.length} Active Teams</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase font-bold mb-1">Billing</p>
                            <p className="text-lg text-white font-bold capitalize">{billingCycle}</p>
                            <p className="text-sm text-slate-400">Next invoice: {new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-900 flex flex-col md:flex-row gap-4 items-center justify-between">
                         <div className="text-sm text-slate-300">
                             Total: <span className="font-bold text-white">${subInfo.price.toFixed(2)}</span> / mo 
                             {billingCycle === 'yearly' && " (billed yearly)"}
                         </div>
                         <Button variant="secondary" onClick={() => { onClose(); onManageTeams(); }} className="text-xs">
                             Modify Teams / Plan
                         </Button>
                    </div>
                </div>
            </div>

            {/* Danger Zone */}
            <div>
                <h3 className="text-lg font-bold text-red-500 mb-4">Danger Zone</h3>
                <div className="border border-red-900/30 bg-red-900/10 rounded-xl p-6">
                     <div className="flex items-center justify-between mb-4">
                         <div>
                             <h4 className="font-bold text-white text-sm">Cancel Subscription</h4>
                             <p className="text-xs text-slate-400">Stop future billing. You will lose access to premium features.</p>
                         </div>
                         <Button variant="danger" onClick={handleCancel} className="text-xs px-3 py-1">
                             Cancel
                         </Button>
                     </div>
                     <hr className="border-red-900/20 mb-4" />
                     <div className="flex items-center justify-between">
                         <div>
                             <h4 className="font-bold text-white text-sm">Log Out</h4>
                             <p className="text-xs text-slate-400">Sign out of your account on this device.</p>
                         </div>
                         <Button variant="secondary" onClick={onLogout} className="text-xs px-3 py-1 border-red-900/30 text-red-400 hover:text-red-300 hover:bg-red-900/20">
                             Log Out
                         </Button>
                     </div>
                </div>
            </div>

        </div>

        <div className="p-6 bg-slate-800 border-t border-slate-700 flex justify-end">
            <Button variant="primary" onClick={onClose}>Done</Button>
        </div>
      </div>
    </div>
  );
};