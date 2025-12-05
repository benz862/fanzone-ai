import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { TeamChatBoard } from './components/TeamChatBoard';
import { SubscriptionManager } from './components/SubscriptionManager';
import { VoiceSelector } from './components/VoiceSelector';
import { AccountSettings } from './components/AccountSettings';
import { HomePage } from './components/HomePage';
import { MembershipPage } from './components/MembershipPage';
import { RegisterPage } from './components/RegisterPage';
import { LoginPage } from './components/LoginPage';
import { AVAILABLE_TEAMS, VOICE_OPTIONS, DEFAULT_VOICE_ID } from './constants';
import { Team, VoiceOption } from './types';
import { liveService } from './services/liveService';

// App State Types
type AppView = 'HOME' | 'MEMBERSHIP' | 'REGISTER' | 'LOGIN' | 'DASHBOARD';

const App: React.FC = () => {
  // Navigation State
  const [currentAppView, setCurrentAppView] = useState<AppView>('HOME');
  const [registrationData, setRegistrationData] = useState<{
    planId: string | null;
    billingCycle: 'monthly' | 'yearly';
    stripeProductId: string | null;
  }>({ planId: null, billingCycle: 'monthly', stripeProductId: null });

  // User State
  const [username, setUsername] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [subscribedTeams, setSubscribedTeams] = useState<Team[]>([]);
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [activeVoice, setActiveVoice] = useState<VoiceOption>(
    VOICE_OPTIONS.find(v => v.id === DEFAULT_VOICE_ID) || VOICE_OPTIONS[0]
  );
  
  // Dashboard UI State
  const [dashboardView, setDashboardView] = useState<'ai' | 'chat'>('ai');
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isAccountSettingsOpen, setIsAccountSettingsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    // Check for existing session
    const savedUser = localStorage.getItem('fz_username');
    
    // Auto-Demo provisioning for "Bomber"
    // If no user is logged in, and we want to demo quickly:
    if (!savedUser && !localStorage.getItem('fz_demo_provisioned')) {
         localStorage.setItem('fz_demo_provisioned', 'true');
         // We don't auto-login, but we prep the demo account so Login works with "Bomber"
         const demoProfile = {
            email: 'info@epoxydogs.com',
            billingCycle: 'yearly',
            planId: 'tier_10'
         };
         localStorage.setItem('fz_profile', JSON.stringify(demoProfile));
         
         // Setup 10 diverse teams for the demo
         const demoTeamNames = [
             "Toronto Maple Leafs", "Kansas City Chiefs", "Liverpool", "Los Angeles Lakers", 
             "New York Yankees", "Ferrari", "Mumbai Indians", "Brisbane Broncos", "PWHL Toronto", "Chicago Blackhawks"
         ];
         const demoTeams = AVAILABLE_TEAMS.filter(t => demoTeamNames.includes(t.name));
         if (demoTeams.length > 0) {
            localStorage.setItem('fz_subscriptions', JSON.stringify(demoTeams.map(t => t.id)));
         }
    }
  }, []);

  // --- Initialization Logic ---
  const initDashboard = () => {
    // Load Voice
    const savedVoiceId = localStorage.getItem('fz_voice');
    if (savedVoiceId) {
      const voice = VOICE_OPTIONS.find(v => v.id === savedVoiceId);
      if (voice) setActiveVoice(voice);
    }

    // Load Teams
    const savedSubs = localStorage.getItem('fz_subscriptions');
    let initialTeams: Team[] = [];
    if (savedSubs) {
      try {
        const parsedIds = JSON.parse(savedSubs);
        if (Array.isArray(parsedIds)) {
          initialTeams = AVAILABLE_TEAMS.filter(t => parsedIds.includes(t.id));
        }
      } catch (e) {
        console.error("Failed to parse subscriptions", e);
      }
    }

    // Default if no teams
    if (initialTeams.length === 0) {
      const defaultTeam = AVAILABLE_TEAMS.find(t => t.name === 'Toronto Maple Leafs') || AVAILABLE_TEAMS[0];
      if (defaultTeam) {
        initialTeams = [defaultTeam];
      }
    }

    setSubscribedTeams(initialTeams);
    if (initialTeams.length > 0) {
      setActiveTeam(initialTeams[0]);
    }

    // Load Profile
    const savedProfile = localStorage.getItem('fz_profile');
    if (savedProfile) {
      try {
        const profile = JSON.parse(savedProfile);
        setEmail(profile.email || '');
        if (profile.billingCycle) {
            setRegistrationData(prev => ({ ...prev, billingCycle: profile.billingCycle }));
        }
      } catch (e) {}
    }
  };


  // --- Event Handlers ---

  const handleGetStarted = () => {
    setCurrentAppView('MEMBERSHIP');
  };

  const handleSelectPlan = (planId: string, billingCycle: 'monthly' | 'yearly', stripeProductId: string) => {
    setRegistrationData({ planId, billingCycle, stripeProductId });
    setCurrentAppView('REGISTER');
  };

  const handleRegisterSuccess = (newUsername: string) => {
    setUsername(newUsername);
    localStorage.setItem('fz_username', newUsername);
    
    // Retrieve email from temp storage to persist in profile
    const tempUserRaw = localStorage.getItem('fz_temp_user');
    let userEmail = '';
    if (tempUserRaw) {
        try {
            const tempUser = JSON.parse(tempUserRaw);
            userEmail = tempUser.email;
            setEmail(userEmail);
        } catch(e) {}
    }

    // Create persistent profile
    const profile = {
        email: userEmail,
        billingCycle: registrationData.billingCycle,
        planId: registrationData.planId
    };
    localStorage.setItem('fz_profile', JSON.stringify(profile));

    setCurrentAppView('LOGIN');
  };

  const handleLogin = () => {
    const storedUsername = localStorage.getItem('fz_username');
    // If demo user "Bomber" logs in (even if localStorage was cleared, we can simulate existing user for demo)
    // Actually, relying on localStorage from register step or prev session.
    // For demo purposes, let's allow "Bomber" to work even if not registered in this session
    // if the user types "Bomber" in login screen (handled in LoginPage, but we get callback here).
    
    // We just trust that LoginPage validated or we check localstorage
    if (storedUsername) {
        setUsername(storedUsername);
    } else {
        // Fallback for direct login flow if localStorage is empty but we want to allow 'Bomber' demo
        // This part would ideally be real auth.
        // If we are here, it means we logged in successfully.
        const demoUser = localStorage.getItem('fz_temp_user');
        if (demoUser) {
            const u = JSON.parse(demoUser);
            setUsername(u.username);
        } else {
             // Just in case
             setUsername("Bomber"); 
        }
    }
    
    initDashboard();
    setCurrentAppView('DASHBOARD');
  };

  const handleLogout = () => {
    // Stop any active AI session
    liveService.disconnect();
    
    // Clear Session Data
    // Note: In a real app we might keep 'fz_username' if we want "Remember Me"
    // For this demo, we wipe to show the flow again or just reset state.
    // Let's just reset App State and send to Home.
    setUsername('');
    setEmail('');
    setSubscribedTeams([]);
    setActiveTeam(null);
    setDashboardView('ai');
    setIsAccountSettingsOpen(false);
    setIsSidebarOpen(false);
    
    setCurrentAppView('HOME');
  };

  // --- Dashboard Logic ---

  const handleUpdateSubscriptions = (teams: Team[]) => {
    setSubscribedTeams(teams);
    localStorage.setItem('fz_subscriptions', JSON.stringify(teams.map(t => t.id)));
    
    if (activeTeam && !teams.find(t => t.id === activeTeam.id)) {
      setActiveTeam(teams[0] || null);
    } else if (!activeTeam && teams.length > 0) {
       setActiveTeam(teams[0]);
    }
  };

  const handleSelectTeam = (teamId: string) => {
    const team = subscribedTeams.find(t => t.id === teamId);
    if (team) {
      setActiveTeam(team);
    }
  };

  const handleSelectVoice = (voice: VoiceOption) => {
    setActiveVoice(voice);
    localStorage.setItem('fz_voice', voice.id);
    setIsVoiceModalOpen(false);
  };

  // --- Render Router ---

  switch (currentAppView) {
    case 'HOME':
      return <HomePage onGetStarted={handleGetStarted} onLogin={() => setCurrentAppView('LOGIN')} />;
    
    case 'MEMBERSHIP':
      return <MembershipPage onSelectPlan={handleSelectPlan} />;
    
    case 'REGISTER':
      return (
        <RegisterPage 
          onRegisterSuccess={handleRegisterSuccess} 
          onBack={() => setCurrentAppView('MEMBERSHIP')}
        />
      );
    
    case 'LOGIN':
      return <LoginPage onLogin={handleLogin} />;
    
    case 'DASHBOARD':
      if (!activeTeam) {
         return (
           <div className="flex h-screen bg-slate-950 items-center justify-center flex-col text-slate-400 gap-4">
             <i className="fas fa-spinner fa-spin fa-2x"></i>
             <p>Loading FanZone...</p>
           </div>
         );
      }

      return (
        <div className="flex h-screen bg-slate-950 text-slate-200 overflow-hidden font-sans">
          <Sidebar 
            subscribedTeams={subscribedTeams}
            activeTeamId={activeTeam.id}
            onSelectTeam={handleSelectTeam}
            onManageSubscription={() => setIsSubscriptionModalOpen(true)}
            onOpenVoiceSettings={() => setIsVoiceModalOpen(true)}
            onOpenAccountSettings={() => setIsAccountSettingsOpen(true)}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
            currentView={dashboardView}
            onViewChange={setDashboardView}
            username={username}
          />

          <div className="flex-1 flex flex-col relative w-full">
            <div className="lg:hidden p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                <button onClick={() => setIsSidebarOpen(true)} className="text-white">
                  <i className="fas fa-bars fa-lg"></i>
                </button>
                <span className="font-bold text-white">FANZONE</span>
                <div className="w-6"></div>
            </div>

            {dashboardView === 'ai' ? (
              <ChatInterface 
                  activeTeam={activeTeam} 
                  subscribedTeams={subscribedTeams} 
                  activeVoice={activeVoice}
              />
            ) : (
              <TeamChatBoard 
                  activeTeam={activeTeam}
                  username={username}
              />
            )}
          </div>

          {isSubscriptionModalOpen && (
            <SubscriptionManager 
              subscribedTeams={subscribedTeams}
              onUpdateSubscriptions={handleUpdateSubscriptions}
              onClose={() => setIsSubscriptionModalOpen(false)}
            />
          )}

          {isVoiceModalOpen && (
            <VoiceSelector
              activeVoiceId={activeVoice.id}
              onSelectVoice={handleSelectVoice}
              onClose={() => setIsVoiceModalOpen(false)}
            />
          )}

          {isAccountSettingsOpen && (
            <AccountSettings 
                username={username}
                email={email}
                subscribedTeams={subscribedTeams}
                billingCycle={registrationData.billingCycle}
                onLogout={handleLogout}
                onManageTeams={() => { setIsAccountSettingsOpen(false); setIsSubscriptionModalOpen(true); }}
                onClose={() => setIsAccountSettingsOpen(false)}
            />
          )}
        </div>
      );
    
    default:
      return <div>Error: Unknown State</div>;
  }
};

export default App;