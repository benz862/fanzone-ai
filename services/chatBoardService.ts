import { ChatMessage } from "../types";

const STORAGE_KEY = 'fz_chat_history';

export const chatBoardService = {
  getMessages: (teamId: string): ChatMessage[] => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const allMessages: Record<string, ChatMessage[]> = raw ? JSON.parse(raw) : {};
      return allMessages[teamId] || [];
    } catch (e) {
      console.error("Failed to load chat history", e);
      return [];
    }
  },

  addMessage: (teamId: string, username: string, text: string): ChatMessage => {
    const raw = localStorage.getItem(STORAGE_KEY);
    const allMessages: Record<string, ChatMessage[]> = raw ? JSON.parse(raw) : {};

    if (!allMessages[teamId]) {
      allMessages[teamId] = [];
    }

    const newMessage: ChatMessage = {
      id: Date.now().toString() + Math.random().toString(36).substring(7),
      teamId,
      username,
      text,
      timestamp: Date.now()
    };

    allMessages[teamId].push(newMessage);
    
    // Keep history manageable (last 100 messages per team)
    if (allMessages[teamId].length > 100) {
      allMessages[teamId] = allMessages[teamId].slice(-100);
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(allMessages));
    return newMessage;
  }
};