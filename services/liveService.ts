
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { createPcmBlob, decodeAudioData, base64ToArrayBuffer } from "../utils/audioUtils";
import { memoryService } from "./memoryService";
import { geminiService } from "./geminiService";

interface LiveServiceCallbacks {
  onStatusChange: (isConnected: boolean) => void;
  onTranscript: (sender: 'user' | 'model', text: string, isFinal: boolean) => void;
  onAudioData: (frequencyData: Uint8Array) => void;
  onError: (error: string) => void;
  onWidget?: (type: string, data: any) => void; // New callback for widgets
}

// Fetch structured sports context for the active team from our server-side API.
// This calls a Vercel serverless function which in turn talks to TheSportsDB.
async function fetchSportsContext(teamName: string): Promise<any | null> {
  try {
    const res = await fetch(`/api/sports-context?team=${encodeURIComponent(teamName)}`);
    if (!res.ok) {
      console.warn("sports-context API returned non-OK:", res.status);
      return null;
    }
    const json = await res.json();
    if (!json || json.ok === false) return null;
    return json.data ?? null;
  } catch (err) {
    console.error("Error fetching sports context:", err);
    return null;
  }
}

// Build a strict, grounded system instruction for Gemini Live.
// This combines: active team, subscription limits, voice persona, browser language,
// long-term memory, structured sports data, and (optionally) unstructured "headline" text.
function buildSystemInstruction(params: {
  activeTeam: string;
  subscribedTeams: string[];
  voiceName: string;
  voiceStyle: string;
  userLang: string;
  memories: any;
  sportsContext: any | null;
  realTimeContext: string | null;
}): string {
  const { activeTeam, subscribedTeams, voiceName, voiceStyle, userLang, memories, sportsContext, realTimeContext } = params;

  const subscribedList = subscribedTeams.join(", ") || activeTeam;
  const memoryContextString = JSON.stringify(memories, null, 2);

  const sportsContextBlock = sportsContext
    ? `
--- STRUCTURED SPORTS DATA (PRIMARY SOURCE OF TRUTH) ---
You have structured, API-based data for the active team from TheSportsDB.
Use ONLY this JSON for specific facts about:
- current season record
- recent results
- upcoming matches
- basic player status
If this JSON is missing a detail, you MUST say "I don't know" or speak in general terms WITHOUT guessing.

<SPORTS_CONTEXT_JSON>
${JSON.stringify(sportsContext, null, 2)}
</SPORTS_CONTEXT_JSON>
---------------------------------------------------------
`
    : `
--- NO STRUCTURED SPORTS DATA AVAILABLE ---
You do NOT have verified, structured API data for this team right now.
You MUST:
- Avoid guessing exact scores, dates, trades, or injuries.
- Speak only in general terms about style, history, and fan culture.
- Explicitly say when you do not know recent or specific facts.
---------------------------------------------------------
`;

  const realtimeBlock = realTimeContext
    ? `
--- UNSTRUCTURED NARRATIVE CONTEXT (MAY INCLUDE HEADLINES / RUMOURS) ---
The following text may contain news or rumours. It is NOT guaranteed accurate.
If it conflicts with the structured JSON above, you MUST trust the JSON.
If a detail only appears here, treat it as speculative and clearly label it as "rumour" or "unconfirmed".

<REALTIME_TEXT>
${realTimeContext}
</REALTIME_TEXT>
----------------------------------------------------------------------
`
    : `
--- NO EXTRA REAL-TIME TEXT CONTEXT PROVIDED ---
You should not invent specific, up-to-the-minute events. If asked, say you do not have
full live information and stick to general analysis unless the user provides the facts.
----------------------------------------------------------------------
`;

  return `
You are the official FanZone.chat live voice assistant for passionate sports fans.

CORE CONTEXT
- Active Team: "${activeTeam}"
- Subscribed Teams: ${subscribedList}
- User Browser Language: ${userLang}
- Current Voice Profile: ${voiceName}
- Voice Persona Style: ${voiceStyle}

${sportsContextBlock}
${realtimeBlock}

--- LONG-TERM MEMORY CONTEXT ---
You may use the following memory context to personalize responses:
<memory_context>
${memoryContextString}
</memory_context>
Do NOT invent memories. Only reference what appears inside <memory_context>.
--------------------------------

LANGUAGE RULES
- Automatically detect the user's language from their speech or transcript.
- Respond in that language consistently.
- Do NOT switch languages unless the user clearly switches or requests it.
- Translate subscription warnings, disclaimers, and corrections into the user's language.

VOICE & PERSONA RULES
- Always speak using the selected voice: ${voiceName}.
- Adopt the persona style: "${voiceStyle}".
  - "Sportscaster": energetic, fast-paced, analytical.
  - "Conversational": relaxed, friendly, supportive.
- If the system tells you the voice profile changed, confirm it in the user's language, e.g.:
  "Voice updated. I'll keep talking using the new style."
- Do NOT spontaneously change your voice style or persona.

SUBSCRIPTION TEAM ACCESS RULES
1. Subscribed Teams:
   - You may give deep analysis, stats, tactical breakdowns, injury overviews, speculative commentary, and emotional support for these teams: ${subscribedList}.
2. Non-Subscribed Teams:
   - If the user asks about a non-subscribed team:
     - Give at most ONE short, generic sentence (e.g., "They're a strong team in the league.")
     - Then explain, in the user's language:
       "You currently have access to: ${subscribedList}.
        Full insights for other teams require an additional subscription of $0.99/month per team."
   - Do NOT provide detailed stats, line-by-line analysis, or deep commentary for non-subscribed teams.
3. Mixed Requests:
   - If the user mentions multiple teams and some are unsubscribed:
     - Provide full analysis ONLY for subscribed teams.
     - Clearly restrict and generalize information for unsubscribed teams.

CORRECTION & HONESTY RULES
- NEVER invent:
  - Exact final scores
  - Trade details
  - Injury timelines
  - Specific contract or transaction details
- If you realize you've given a fabricated or overly specific answer, immediately say (in the user's language):
  "Correction — I don't have verified data for that, so I shouldn't state it as fact."
- If data is missing from SPORTS_CONTEXT_JSON and REALTIME_TEXT, say you don't know instead of guessing.

DATA PRIORITY
1) SPORTS_CONTEXT_JSON (structured, API-based, highest trust)
2) User-provided facts (if the user clearly states a result or stat, you may repeat it back)
3) REALTIME_TEXT (may include rumours; always label as unconfirmed)
4) Your own general historical knowledge (style of play, era, culture, etc.)

INTERACTION STYLE
- Sound like a smart, passionate analyst on a live call-in show.
- Ask follow-up questions:
  - "How did you feel about that last game?"
  - "Who is your favourite player on ${activeTeam}?"
- Keep responses concise unless the user asks for a deep dive.
- Acknowledge emotions:
  - If the user is angry about a loss, show empathy.
  - If they're excited about a win, celebrate with them.

WIDGET TRIGGERS
- If the user asks to SEE:
  - "standings", "table", "league table", "rankings":
    Output a JSON block exactly like:
    {"show_widget":"standings","league":"NHL"}
  - "score", "last score", "recent score":
    Output a JSON block like:
    {"show_widget":"score","league":"NHL"}
- Do NOT read the entire table out loud; just summarize key points and rely on the widget for full visuals.
- Ensure the JSON is valid and appears at the END of your message text.

MEMORY SYSTEM RULES
- When you detect new, reusable information about the user (preferences, opinions, personal details they clearly want remembered), output a JSON block:
  {"memory_to_write":["short fact 1","short fact 2"]}
- This JSON must be syntactically valid and stand alone (no trailing commas).
- Only emit memory_to_write when there is genuinely new information.
- Do NOT claim to remember anything that isn't stored in memory_context or newly written.

TEAM SWITCH & SESSION BEHAVIOR
- When the active team changes (new session), fully switch your focus to the new team.
- Do not continue discussing previous teams unless the user explicitly brings them up AND they are subscribed.
- Maintain continuity across turns within the same session, but respect the limits of your data.

Above all, stay grounded, honest, and fan-focused.
If you are not sure about a detail, say so instead of hallucinating.
`;
}

export class LiveService {
  private ai: GoogleGenAI;
  private activeTeam: string = '';
  private callbacks: LiveServiceCallbacks | null = null;
  
  // Audio Contexts
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private workletNode: ScriptProcessorNode | null = null;
  
  // Playback State
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private sessionPromise: Promise<any> | null = null;
  private currentSession: any = null; // Track the active session object
  private analyser: AnalyserNode | null = null;
  private animationFrameId: number | null = null;
  
  // State Tracking
  private isConnectedInternal = false;
  
  // Memory Processing
  private responseBuffer: string = "";

  constructor() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API Key not found");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  public setCallbacks(callbacks: LiveServiceCallbacks) {
    this.callbacks = callbacks;
  }

  public async connect(teamName: string, subscribedTeams: string[], voiceName: string = 'Kore', voiceStyle: string = 'Friendly and engaging') {
    // Ensure clean state before connecting
    if (this.isConnectedInternal) {
      await this.disconnect();
    }
    this.isConnectedInternal = true;
    this.activeTeam = teamName;
    this.responseBuffer = "";
    
    try {
      // 1. Setup Audio Inputs/Outputs
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
      this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });

      // Ensure contexts are running
      if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
      }
      if (this.outputAudioContext.state === 'suspended') {
        await this.outputAudioContext.resume();
      }
      
      // Setup Analyser for Visualizer
      this.analyser = this.outputAudioContext.createAnalyser();
      this.analyser.fftSize = 64; // Low fftSize for chunkier, distinct bars
      this.analyser.smoothingTimeConstant = 0.8;
      const outputNode = this.outputAudioContext.createGain();
      outputNode.connect(this.analyser);
      this.analyser.connect(this.outputAudioContext.destination);

      this.startVisualizerLoop();

      // 2. Start Microphone
      this.mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 3. FETCH STRUCTURED SPORTS CONTEXT (TheSportsDB via our API)
      const sportsContext = await fetchSportsContext(teamName);

      // 4. FETCH OPTIONAL REAL-TIME NARRATIVE CONTEXT (existing geminiService)
      let realTimeContext: string | null = null;
      try {
        realTimeContext = await geminiService.getRealTimeContext(teamName);
      } catch (e) {
        console.warn("Could not fetch real-time narrative context, proceeding without it.");
      }

      // 5. Prepare System Instructions using strict, grounded builder
      const userLang = navigator.language || "en-US";
      const memories = memoryService.getMemories();

      const systemInstruction = buildSystemInstruction({
        activeTeam: this.activeTeam,
        subscribedTeams,
        voiceName,
        voiceStyle,
        userLang,
        memories,
        sportsContext,
        realTimeContext,
      });

      // 6. Connect to Gemini Live
      // NOTE: googleSearch tool removed to prevent 'Internal Error' in Live preview
      this.sessionPromise = this.ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: systemInstruction,
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceName } },
          },
          inputAudioTranscription: {}, 
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: this.handleOpen.bind(this),
          onmessage: this.handleMessage.bind(this),
          onclose: () => {
              // Only trigger disconnect logic if we are supposed to be connected
              // This prevents duplicate triggers during intentional disconnects
              if (this.isConnectedInternal) {
                  this.disconnect();
              }
          },
          onerror: (e) => {
            console.error("Gemini Live API Error:", e);
            this.callbacks?.onError("Connection error: The AI service is temporarily unavailable. Please try again.");
            this.disconnect();
          },
        },
      });

      // Capture the session object for cleanup
      this.sessionPromise.then((session) => {
        this.currentSession = session;
      }).catch(err => {
        console.error("Session connection failed:", err);
        this.disconnect();
      });

      this.callbacks?.onStatusChange(true);

    } catch (error: any) {
      console.error("Failed to connect:", error);
      this.callbacks?.onError(error.message || "Failed to connect to audio services.");
      this.disconnect();
    }
  }

  public async sendText(text: string) {
    if (!this.isConnectedInternal || !this.sessionPromise) return;
    try {
      const session = await this.sessionPromise;
      await session.sendRealtimeInput({ content: [{ parts: [{ text: text }] }] });
    } catch (e) {
      console.error("Error sending text input:", e);
    }
  }

  public async disconnect() {
    this.isConnectedInternal = false;

    // 1. Close WebSocket / Gemini Session
    if (this.currentSession) {
      try {
        // Explicitly close the session to release the backend connection
        this.currentSession.close();
      } catch (e) {
        console.warn("Error closing Gemini session:", e);
      }
      this.currentSession = null;
    }

    // 2. Stop Media Stream Tracks (Microphone)
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    // 3. Cleanup Audio Processor
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.onaudioprocess = null;
      this.workletNode = null;
    }

    // 4. Close Audio Contexts
    // Browsers have limits on active contexts (usually 6), so we MUST close them.
    if (this.inputAudioContext) {
      try {
        if (this.inputAudioContext.state !== 'closed') {
          await this.inputAudioContext.close();
        }
      } catch(e) { console.warn("InputCtx close error", e); }
      this.inputAudioContext = null;
    }

    if (this.outputAudioContext) {
      try {
        if (this.outputAudioContext.state !== 'closed') {
          await this.outputAudioContext.close();
        }
      } catch(e) { console.warn("OutputCtx close error", e); }
      this.outputAudioContext = null;
    }
    
    // 5. Stop Visualizer
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // 6. Stop all playing audio sources
    this.sources.forEach(s => { 
      try { s.stop(); } catch(e){} 
    });
    this.sources.clear();
    
    // 7. Update UI
    this.callbacks?.onStatusChange(false);
  }

  private handleOpen() {
    if (!this.inputAudioContext || !this.mediaStream) return;

    try {
      const source = this.inputAudioContext.createMediaStreamSource(this.mediaStream);
      this.workletNode = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
      
      this.workletNode.onaudioprocess = (e) => {
        // Gate check: stop processing if we are disconnecting
        if (!this.isConnectedInternal) return;

        const inputData = e.inputBuffer.getChannelData(0);
        const pcmBlob = createPcmBlob(inputData);
        
        this.sessionPromise?.then((session) => {
          if (this.isConnectedInternal) {
            session.sendRealtimeInput({ media: pcmBlob });
          }
        }).catch(err => console.error("Error sending input:", err));
      };

      source.connect(this.workletNode);
      this.workletNode.connect(this.inputAudioContext.destination);
    } catch (err) {
      console.error("Error setting up audio stream:", err);
      this.callbacks?.onError("Audio stream setup failed.");
    }
  }

  private async handleMessage(message: LiveServerMessage) {
    if (!this.isConnectedInternal) return;

    // Handle Audio Output
    const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
    if (audioData && this.outputAudioContext && this.analyser) {
       if (this.outputAudioContext.state === 'suspended') {
         try { await this.outputAudioContext.resume(); } catch(e) {}
       }

       this.nextStartTime = Math.max(this.nextStartTime, this.outputAudioContext.currentTime);
       
       try {
         const arrayBuffer = base64ToArrayBuffer(audioData);
         const audioBuffer = await decodeAudioData(arrayBuffer, this.outputAudioContext, 24000, 1);
         
         const source = this.outputAudioContext.createBufferSource();
         source.buffer = audioBuffer;
         source.connect(this.analyser); // Connect to analyser for visualization
         source.connect(this.outputAudioContext.destination); // Connect to output for hearing
         
         source.start(this.nextStartTime);
         this.nextStartTime += audioBuffer.duration;
         this.sources.add(source);
         
         source.onended = () => this.sources.delete(source);
       } catch (e) {
         console.error("Error decoding audio:", e);
       }
    }

    // Handle Interruptions
    if (message.serverContent?.interrupted) {
      this.sources.forEach(source => {
        try { source.stop(); } catch(e) {}
      });
      this.sources.clear();
      if (this.outputAudioContext) {
        this.nextStartTime = this.outputAudioContext.currentTime;
      }
      this.responseBuffer = "";
    }

    // Handle Transcriptions
    const inputTranscript = message.serverContent?.inputTranscription?.text;
    if (inputTranscript) {
      this.callbacks?.onTranscript('user', inputTranscript, !!message.serverContent?.turnComplete);
    }

    const outputTranscript = message.serverContent?.outputTranscription?.text;
    if (outputTranscript) {
      this.responseBuffer += outputTranscript;
      
      let displayTranscript = outputTranscript;
      
      // JSON Pattern Matching for Memory and Widgets
      const memoryPattern = /\{"memory_to_write":\s*\[(.*?)\]\}/s;
      const widgetPattern = /\{"show_widget":\s*"(.*?)",\s*"league":\s*"(.*?)"\}/s;
      
      // Check for Memory
      const memMatch = this.responseBuffer.match(memoryPattern);
      if (memMatch) {
         try {
           const parsed = JSON.parse(memMatch[0]);
           if (parsed.memory_to_write) {
             memoryService.saveMemories(parsed.memory_to_write);
             displayTranscript = displayTranscript.replace(memoryPattern, '');
             this.responseBuffer = this.responseBuffer.replace(memoryPattern, '');
           }
         } catch (e) {}
      }

      // Check for Widget
      const widgetMatch = this.responseBuffer.match(widgetPattern);
      if (widgetMatch) {
          try {
            const parsed = JSON.parse(widgetMatch[0]);
            if (parsed.show_widget && this.callbacks?.onWidget) {
                // We strip the command from text so it doesn't clutter chat
                displayTranscript = displayTranscript.replace(widgetPattern, '');
                this.responseBuffer = this.responseBuffer.replace(widgetPattern, '');
                
                // Trigger the async fetch for widget data
                if (parsed.show_widget === 'standings') {
                   // Async fetch content
                   geminiService.fetchStandingsData(parsed.league).then(data => {
                       if (data && this.callbacks?.onWidget) {
                           this.callbacks.onWidget('standings', data);
                       }
                   });
                }
            }
          } catch(e) {}
      }

      // Cleanup visible text
      const cleanText = displayTranscript
        .replace(/\{"memory_to_write.*/, '')
        .replace(/\{"show_widget.*/, '')
        .replace(/.*\}\}/, '');
      
      if (cleanText.trim()) {
        this.callbacks?.onTranscript('model', cleanText, !!message.serverContent?.turnComplete);
      }
      
      if (message.serverContent?.turnComplete) {
        this.responseBuffer = "";
      }
    }
  }

  private startVisualizerLoop() {
    if (!this.analyser) return;
    const bufferLength = this.analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      // Only loop if connected
      if (!this.isConnectedInternal) return;

      this.animationFrameId = requestAnimationFrame(draw);
      if (this.analyser) {
        this.analyser.getByteFrequencyData(dataArray);
        this.callbacks?.onAudioData(dataArray);
      }
    };
    draw();
  }
}

export const liveService = new LiveService();
