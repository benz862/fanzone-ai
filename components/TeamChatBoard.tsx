import React, { useState, useEffect, useRef } from 'react';
import { Team, ChatMessage } from '../types';
import { chatBoardService } from '../services/chatBoardService';
import { moderationService } from '../services/moderationService';
import { geminiService } from '../services/geminiService';

interface TeamChatBoardProps {
  activeTeam: Team;
  username: string;
}

export const TeamChatBoard: React.FC<TeamChatBoardProps> = ({ activeTeam, username }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isBotGenerating, setIsBotGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  
  // Poll for messages (simulation of realtime backend)
  useEffect(() => {
    const loadMessages = () => {
      const msgs = chatBoardService.getMessages(activeTeam.id);
      setMessages(msgs);
      return msgs;
    };

    const msgs = loadMessages();
    
    // Auto-summon bot if room is empty
    if (msgs.length === 0) {
        handleSummonBot(true);
    }

    const interval = setInterval(loadMessages, 3000); // Poll every 3s
    return () => clearInterval(interval);
  }, [activeTeam.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    // 1. Moderate
    const check = await moderationService.validateContent(inputText, 'message');

    if (!check.allowed) {
      setError(`Message blocked: ${check.reason || "Community Guidelines Violation"}`);
      setIsSending(false);
      return;
    }

    const userMessage = inputText.trim();
    
    // 2. Post user message
    chatBoardService.addMessage(activeTeam.id, username, userMessage);
    setInputText('');
    setMessages(chatBoardService.getMessages(activeTeam.id));
    
    // 3. Check if message is a question for AI (starts with ? or contains question words)
    const isQuestion = userMessage.startsWith('?') || 
                       /^(what|when|where|who|why|how|tell me|explain|describe)/i.test(userMessage) ||
                       userMessage.includes('?');
    
    if (isQuestion) {
      // Get AI response using our new fanzone-chat API
      try {
        setIsBotGenerating(true);
        const response = await fetch('/api/fanzone-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.replace(/^\?/, '').trim(), // Remove leading ?
            team: activeTeam.name
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data.reply) {
            chatBoardService.addMessage(activeTeam.id, "FanZone AI", data.reply);
            setMessages(chatBoardService.getMessages(activeTeam.id));
          } else {
            throw new Error(data.error || 'No reply from AI');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'AI service unavailable');
        }
      } catch (aiError: any) {
        console.error("AI chat error:", aiError);
        chatBoardService.addMessage(
          activeTeam.id, 
          "FanZone AI", 
          `Sorry, I'm having trouble right now. ${aiError.message || 'Please try again later.'}`
        );
        setMessages(chatBoardService.getMessages(activeTeam.id));
      } finally {
        setIsBotGenerating(false);
      }
    }
    
    setIsSending(false);
  };

  const handleSummonBot = async (isAuto: boolean = false) => {
      if (isBotGenerating) return;
      setIsBotGenerating(true);
      
      try {
          const botMsg = await geminiService.generateBotPost(activeTeam.name);
          chatBoardService.addMessage(activeTeam.id, "FanZone Bot", botMsg);
          setMessages(chatBoardService.getMessages(activeTeam.id));
      } catch (e) {
          console.error("Bot failed", e);
      } finally {
          setIsBotGenerating(false);
      }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 relative">
      {/* Ambient Background */}
      <div 
         className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full opacity-5 blur-[100px] pointer-events-none"
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
             <h2 className="text-lg font-bold text-white">{activeTeam.name} Community</h2>
             <p className="text-xs text-slate-400 flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-green-500"></span> Live Fan Board
             </p>
           </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
              onClick={() => {
                setInputText('? What\'s the latest news about the team?');
              }}
              className="text-xs bg-blue-900/50 hover:bg-blue-900/80 text-blue-200 border border-blue-800 rounded-full px-3 py-1 flex items-center gap-2 transition-colors"
              title="Ask AI a question"
          >
              <i className="fas fa-robot"></i>
              Ask AI
          </button>
          <button 
              onClick={() => handleSummonBot(false)}
              disabled={isBotGenerating}
              className="text-xs bg-purple-900/50 hover:bg-purple-900/80 text-purple-200 border border-purple-800 rounded-full px-3 py-1 flex items-center gap-2 transition-colors"
          >
              {isBotGenerating ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sparkles"></i>}
              Spark Convo
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 z-10">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 opacity-60">
            <i className="fas fa-comments fa-3x mb-4"></i>
            <p>No messages yet. The Bot is thinking...</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.username === username;
            const isBot = msg.username === 'FanZone Bot';
            const isAI = msg.username === 'FanZone AI';
            
            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div className="flex items-end gap-2 max-w-[80%]">
                  {!isMe && (
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold border border-slate-700 ${
                      isBot ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg' : 
                      isAI ? 'bg-gradient-to-br from-blue-600 to-cyan-600 text-white shadow-lg' :
                      'bg-slate-800 text-slate-400'
                    }`}>
                      {isBot || isAI ? <i className="fas fa-robot"></i> : msg.username.substring(0, 2).toUpperCase()}
                    </div>
                  )}
                  
                  <div className={`p-3 rounded-2xl text-sm break-words relative ${
                    isMe 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : isBot
                        ? 'bg-slate-800 text-slate-200 border border-purple-500/50 shadow-purple-900/20 shadow-lg rounded-bl-none'
                        : isAI
                        ? 'bg-slate-800 text-slate-200 border border-blue-500/50 shadow-blue-900/20 shadow-lg rounded-bl-none'
                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                  }`}>
                    {!isMe && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`block text-[10px] font-bold ${
                          isBot ? 'text-purple-400' : 
                          isAI ? 'text-blue-400' : 
                          'text-slate-500'
                        }`}>
                            {msg.username}
                        </span>
                        {isBot && <span className="text-[8px] bg-purple-900 text-white px-1 rounded uppercase tracking-wide">AI System</span>}
                        {isAI && <span className="text-[8px] bg-blue-900 text-white px-1 rounded uppercase tracking-wide">Real-Time AI</span>}
                      </div>
                    )}
                    {msg.text}
                  </div>
                </div>
                <span className="text-[10px] text-slate-600 mt-1 px-1">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 z-10">
        {error && (
            <div className="mb-3 px-3 py-2 bg-red-900/20 border border-red-800/50 rounded text-xs text-red-300 flex items-center justify-between">
                <span><i className="fas fa-ban mr-2"></i>{error}</span>
                <button onClick={() => setError(null)}><i className="fas fa-times"></i></button>
            </div>
        )}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${activeTeam.name} fans... (Start with ? or ask a question for AI)`}
            className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-4 py-2 text-white focus:outline-none focus:border-blue-500 placeholder-slate-600"
            maxLength={200}
            disabled={isSending || isBotGenerating}
          />
          <button 
            type="submit" 
            disabled={isSending || !inputText.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              isSending || !inputText.trim() 
                ? 'bg-slate-800 text-slate-600' 
                : 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg'
            }`}
          >
            {isSending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
          </button>
        </form>
      </div>
    </div>
  );
};