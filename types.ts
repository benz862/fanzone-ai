export interface Team {
  id: string;
  name: string;
  league: string;
  sport: string;
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
}

export interface UserSubscription {
  basePlanId: string; // 'core-fan'
  subscribedTeamIds: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
  sources?: GroundingSource[];
  isThinking?: boolean;
}

export interface ChatMessage {
  id: string;
  teamId: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface PricingTier {
  basePrice: number;
  additionalTeamPrice: number;
}

export interface VoiceOption {
  id: string;
  name: string;
  category: 'Female' | 'Male' | 'Neutral';
  description: string;
  geminiId: string; // 'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
}