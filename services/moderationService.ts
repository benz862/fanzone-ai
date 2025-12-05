import { GoogleGenAI } from "@google/genai";

export class ModerationService {
  private ai: GoogleGenAI;
  private model: string = 'gemini-2.5-flash';

  constructor() {
    const apiKey = process.env.API_KEY;
    this.ai = new GoogleGenAI({ apiKey: apiKey || '' });
  }

  /**
   * Validates text against strict community guidelines.
   * Returns { allowed: true } if safe, or { allowed: false, reason: string } if violated.
   */
  public async validateContent(text: string, type: 'username' | 'message'): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const prompt = `
        You are the Content Moderation Engine for FanZone.chat.
        Your job is to STRICTLY enforce community guidelines.
        
        TASK: Analyze the following ${type}: "${text}"

        RULES:
        1. REJECT Sexual Content (slang, innuendo, explicit).
        2. REJECT Hate Speech, Slurs, Racism, Sexism, Homophobia.
        3. REJECT Violence, Threats, Self-Harm, Bullying.
        4. REJECT Illegal content or Drugs.
        5. REJECT PII (Personally Identifiable Information).
        6. ${type === 'username' ? 'REJECT offensive or confusing usernames.' : ''}

        If the content is borderline, REJECT it.
        
        RESPONSE FORMAT (JSON ONLY):
        {
          "allowed": boolean,
          "reason": "Safe" | "Sexual Content" | "Hate Speech" | "Violence" | "Illegal Content" | "Other Violation"
        }
      `;

      const response = await this.ai.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const jsonStr = response.text;
      if (!jsonStr) return { allowed: false, reason: "Moderation Error" };

      const result = JSON.parse(jsonStr);
      return result;

    } catch (error) {
      console.error("Moderation failed:", error);
      // Fail safe: block content if moderation is down
      return { allowed: false, reason: "Moderation Service Unavailable" };
    }
  }
}

export const moderationService = new ModerationService();