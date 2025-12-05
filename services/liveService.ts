
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

      // 3. FETCH REAL-TIME CONTEXT
      // We fetch the latest news/scores textually first, then inject it into the voice AI.
      // This bridges the gap since Live API tools can be unstable.
      let realTimeContext = "Loading latest news...";
      try {
        realTimeContext = await geminiService.getRealTimeContext(teamName);
      } catch (e) {
        console.warn("Could not fetch real-time context, proceeding with generic knowledge.");
      }

      // 4. Prepare System Instructions
      const subscribedList = subscribedTeams.join(', ');
      const userLang = navigator.language || 'en-US';
      const memories = memoryService.getMemories();
      const memoryContextString = JSON.stringify(memories, null, 2);

      const systemInstruction = `
        You are an expert sports analyst and superfan AI hosting a live radio show.
        Your ACTIVE TOPIC is the ${this.activeTeam}.

        !!! REAL-TIME DATA (AS OF TODAY) !!!
        ${realTimeContext}
        !!! END REAL-TIME DATA !!!

        SUBSCRIBED TEAMS: ${subscribedList}.
        USER'S DETECTED BROWSER LANGUAGE: ${userLang}.
        CURRENT VOICE CONFIGURATION: ${voiceName}.
        TARGET PERSONA STYLE: ${voiceStyle}.

        --- LONG TERM MEMORY CONTEXT ---
        "memory_context": ${memoryContextString}
        --------------------------------

        SYSTEM INSTRUCTIONS — MULTILINGUAL AUTO-DETECT MODE

        You must always communicate in the user’s language, automatically detecting it from their speech or text.

        LANGUAGE RULES
        • Detect the language of each user message.
        • Respond only in that language.
        • Do NOT switch languages unless the user switches.
        • Do NOT output English content to non-English users unless they request it.
        • Translate all system messages, disclaimers, and subscription warnings into the user’s language.

        VOICE CONTROL & PERSONA RULES
        • You must use the voice profile selected by the user (${voiceName}).
        • You MUST Adopt the persona defined by the style: "${voiceStyle}".
        • If the style is "Sportscaster", be energetic, fast-paced, and authoritative.
        • If the style is "Conversational", be friendly, relaxed, and casual.
        • When the user selects a voice, you must respond using that voice profile.
        • Maintain this voice and persona even if language, topic, or teams change.
        • If the system prompts you that the voice has been updated, confirm it in the user's language: "Voice updated. I will now speak using the [selected voice] style."
        • Do NOT spontaneously change your voice style.

        SUBSCRIPTION TEAM ACCESS RULES (Apply in ALL languages)

        1. Subscribed Teams
        You may provide: rumors, trade news, stats, tactical analysis, predictions, injury breakdowns, deep commentary ONLY for the teams the user has subscribed to.

        2. Non-Subscribed Teams
        If the user asks about a team they have not subscribed to:
        • Do NOT provide detailed info
        • Do NOT do analysis
        • Do NOT access external data
        • Respond with a brief generic sentence only
        • Then say (IN THE USER’S LANGUAGE):
        “You currently have access to: ${subscribedList}.
        Full insights for other teams, including [Requested Team], require an additional subscription of $0.99/month.”

        3. TEAM MIXING RULE
        If multiple teams are mentioned:
        • If all are subscribed → full discussion allowed
        • If any are not subscribed → restrict that team completely, regardless of language

        4. CORRECTION RULE
        If you mistakenly provide restricted content, immediately correct yourself in the user’s language:
        “Correction — I should not provide detailed information about non-subscribed teams.”

        5. PERSONALITY MODE
        Speak like a passionate sports insider for subscribed teams, but remain neutral otherwise.
        
        CRITICAL: 
        Use the "REAL-TIME DATA" provided above to answer questions about the last game or next game. 
        Do NOT rely on your internal training data for recent events if the Real-Time Data contradicts it.

        --- VISUAL WIDGETS ---
        If the user asks to SEE the "standings", "table", "league leaders", or "score", you must trigger a visual widget.
        Output a JSON block in this format:
        { "show_widget": "standings", "league": "NHL" }
        Do NOT try to read the whole table out loud. Just say "Here are the current standings for the NHL." and send the JSON.
        
        --- MEMORY SYSTEM RULES ---
        
        1. USE MEMORY
        • Personalize responses based on memory_context.
        • Continue previous conversations (e.g. "Last time you asked about...").
        • Reinforce long-term storylines.
        
        2. NEVER INVENT MEMORY
        • Do not say "You told me before" unless it is in the memory_context.
        
        3. MEMORY UPDATE SIGNALING
        • When new info appears (preferences, facts, opinions), output a JSON block:
        { "memory_to_write": ["User is a Leafs fan", "User dislikes the coach"] }
        • This JSON must be valid. 
        • Do NOT include this JSON if there is nothing new to save.
      `;
      
      // 5. Connect to Gemini Live
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
