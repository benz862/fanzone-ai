
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import { GroundingSource } from "../types";

// Helper to sanitize sources from response
const extractSources = (response: GenerateContentResponse): GroundingSource[] => {
  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (!chunks) return [];

  const sources: GroundingSource[] = [];
  chunks.forEach((chunk) => {
    if (chunk.web?.uri && chunk.web?.title) {
      sources.push({
        title: chunk.web.title,
        uri: chunk.web.uri,
      });
    }
  });
  return sources;
};

export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private currentModel: string = 'gemini-2.5-flash';

  constructor() {
    // API Key is assumed to be available in process.env.API_KEY
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("API Key not found. Please set process.env.API_KEY");
    }
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  public startChat(teamName: string, systemInstruction: string) {
    // We use gemini-2.5-flash for speed and cost efficiency in this consumer app
    // We enable googleSearch for real-time news scraping
    this.chatSession = this.ai.chats.create({
      model: this.currentModel,
      config: {
        systemInstruction: `${systemInstruction} The current focused team is: ${teamName}. Focus solely on this team unless asked otherwise.`,
        tools: [{ googleSearch: {} }],
      },
    });
  }

  public async sendMessageStream(
    message: string, 
    onChunk: (text: string) => void,
    onComplete: (fullText: string, sources: GroundingSource[]) => void,
    onError: (error: any) => void
  ) {
    if (!this.chatSession) {
      onError(new Error("Chat session not initialized."));
      return;
    }

    try {
      const resultStream = await this.chatSession.sendMessageStream({ message });
      
      let fullText = "";
      let sources: GroundingSource[] = [];

      for await (const chunk of resultStream) {
        const contentResponse = chunk as GenerateContentResponse;
        const text = contentResponse.text;
        
        if (text) {
          fullText += text;
          onChunk(text);
        }
        
        // Accumulate sources from chunks if available (usually in the final chunk)
        const newSources = extractSources(contentResponse);
        if (newSources.length > 0) {
            sources = [...sources, ...newSources];
        }
      }

      onComplete(fullText, sources);

    } catch (error) {
      console.error("Gemini API Error:", error);
      onError(error);
    }
  }

  public async generateBotPost(teamName: string): Promise<string> {
    const prompt = `
      You are "FanZone Bot", the official AI assistant of FanZone.chat.
      Generate a short, engaging chat message to start a conversation in the ${teamName} fan chat room.
      
      Topic Ideas:
      - Ask a prediction question about the next game.
      - Mention a recent rumor or news item (use googleSearch).
      - Ask a "hot take" question.

      Rules:
      - Do NOT use hashtags.
      - Keep it under 2 sentences.
      - Be neutral but inviting.
      - Do NOT prefix with "FanZone Bot:", just provide the message text.
    `;

    try {
      const result = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
      
      let text = result.text || "";
      // Clean up text
      text = text.replace(/^FanZone Bot:\s*/i, '').replace(/^"|"$|^\*|\*$/g, '').trim();
      return text || `Who's everyone watching in the ${teamName} game next?`;
    } catch (error) {
      console.error("Bot generation failed", error);
      return `Who's everyone watching in the ${teamName} game next?`; 
    }
  }

  /**
   * Fetches the absolute latest context (scores, news, injuries) for a team
   * to inject into the Voice AI system instructions.
   */
  public async getRealTimeContext(teamName: string): Promise<string> {
    const today = new Date().toLocaleDateString();
    const prompt = `
      Find the absolute latest information for the ${teamName} as of today, ${today}.
      
      I need a briefing summary containing:
      1. The result of their last game (with score).
      2. Who they play next (date and opponent).
      3. Key injuries or roster changes (current status).
      4. Top 1 or 2 trending rumors or storylines right now.
      5. Current League Leaders and Reigning Champions.

      Format as a concise text block that can be read by an AI to understand the current state of the team and league.
      Do not use markdown formatting like bolding, just plain text.
    `;

    try {
      const result = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });
      
      return result.text || "No current news available.";
    } catch (error) {
      console.error("Failed to fetch real-time context", error);
      return "Unable to fetch real-time news at this moment.";
    }
  }

  /**
   * Fetches structured standings data for a league
   */
  public async fetchStandingsData(league: string): Promise<any> {
    const prompt = `
      Find the current standings for ${league} for the current season.
      Return a JSON object with the following structure:
      {
        "league": "${league}",
        "teams": [
          { "rank": 1, "name": "Team A", "wins": 10, "losses": 2, "points": 20 }
        ]
      }
      If exact points aren't relevant (like Baseball uses games back, or Football uses diff), map strictly to 'points' or 'diff' if needed, but prefer points for sorting.
      Return ONLY JSON. Limit to top 15 teams.
    `;

    try {
       const result = await this.ai.models.generateContent({
        model: this.currentModel,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json"
        }
      });
      
      const jsonStr = result.text;
      if (jsonStr) {
        return JSON.parse(jsonStr);
      }
      return null;
    } catch (e) {
      console.error("Fetch standings failed", e);
      return null;
    }
  }
}

export const geminiService = new GeminiService();
