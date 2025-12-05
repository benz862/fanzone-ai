import React, { useState } from 'react';
import { MEMBERSHIP_TIERS } from '../constants';
import { Button } from './Button';

interface MembershipPageProps {
  onSelectPlan: (tierId: string, billingCycle: 'monthly' | 'yearly', stripeProductId: string) => void;
}

export const MembershipPage: React.FC<MembershipPageProps> = ({ onSelectPlan }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 relative">
       <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 -z-10"></div>
       
       <div className="text-center mb-6">
         <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Choose Your Access</h2>
         <p className="text-slate-400 max-w-lg mx-auto mb-8">
           Select the plan that fits your fandom. Add more teams, save more money.
         </p>

         {/* Billing Toggle */}
         <div className="inline-flex bg-slate-900 border border-slate-700 p-1 rounded-full relative">
           <button 
             onClick={() => setBillingCycle('monthly')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative z-10 ${
               billingCycle === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
             }`}
           >
             Monthly
           </button>
           <button 
             onClick={() => setBillingCycle('yearly')}
             className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative z-10 ${
               billingCycle === 'yearly' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
             }`}
           >
             Yearly
           </button>
           
           {/* Animated Background */}
           <div className={`absolute top-1 bottom-1 w-[50%] bg-blue-600 rounded-full transition-all duration-300 ${
             billingCycle === 'yearly' ? 'left-[49%]' : 'left-1'
           }`}></div>

           {/* Savings Badge */}
           <div className="absolute -right-24 top-1/2 -translate-y-1/2 bg-green-500 text-slate-900 text-[10px] font-black px-2 py-1 rounded shadow-lg animate-pulse hidden md:block">
             SAVE 20%
           </div>
         </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
         {MEMBERSHIP_TIERS.map((tier) => {
           const price = billingCycle === 'monthly' ? tier.price : tier.yearlyPrice;
           
           return (
             <div 
               key={tier.id}
               className={`relative bg-slate-900 border border-slate-700 rounded-2xl p-6 flex flex-col transition-transform hover:-translate-y-2 hover:border-blue-500 hover:shadow-2xl ${
                 tier.id === 'tier_10' ? 'ring-2 ring-blue-500 shadow-blue-900/20' : ''
               }`}
             >
               {tier.id === 'tier_10' && (
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                   Best Value
                 </div>
               )}

               <div className="flex-1">
                 <h3 className="text-xl font-bold text-white mb-2">{tier.name}</h3>
                 <p className="text-slate-400 text-sm mb-6">{tier.description}</p>
                 
                 <div className="flex items-end gap-1 mb-2">
                   <span className="text-3xl font-bold text-white">${price}</span>
                   <span className="text-slate-500 text-sm mb-1">
                     /{billingCycle === 'monthly' ? 'mo' : 'yr'}
                   </span>
                 </div>
                 
                 {billingCycle === 'yearly' ? (
                    <div className="bg-green-900/30 text-green-400 text-xs font-bold px-2 py-1 rounded inline-block mb-6">
                      20% Yearly Discount Applied
                    </div>
                 ) : (
                    tier.savings && (
                      <div className="bg-blue-900/30 text-blue-400 text-xs font-bold px-2 py-1 rounded inline-block mb-6">
                        Bundle Savings: {tier.savings}/mo
                      </div>
                    )
                 )}
               </div>

               <ul className="space-y-3 mb-8 text-sm text-slate-300">
                 <li className="flex items-center gap-2">
                   <i className="fas fa-check text-blue-500"></i>
                   <span>{tier.count} Team Subscription{tier.count > 1 ? 's' : ''}</span>
                 </li>
                 <li className="flex items-center gap-2">
                   <i className="fas fa-check text-blue-500"></i>
                   <span>Real-time AI Voice</span>
                 </li>
                 <li className="flex items-center gap-2">
                   <i className="fas fa-check text-blue-500"></i>
                   <span>Access to Fan Chat</span>
                 </li>
               </ul>

               <Button 
                 onClick={() => onSelectPlan(tier.id, billingCycle, billingCycle === 'monthly' ? tier.stripeMonthlyProductId : tier.stripeYearlyProductId)}
                 fullWidth
                 variant={tier.id === 'tier_10' ? 'primary' : 'secondary'}
               >
                 Select {billingCycle === 'monthly' ? 'Monthly' : 'Yearly'}
               </Button>
             </div>
           );
         })}
       </div>

       <p className="mt-8 text-slate-500 text-xs">
         You can adjust your team selection at any time from your dashboard.
       </p>
    </div>
  );
};