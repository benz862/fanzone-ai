import OpenAI from "openai";
import fetch from "node-fetch";

export default async function handler(req, res) {
  console.log("DEBUG: fanzone-chat handler START");
  console.log("DEBUG: Request method:", req.method);
  
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, team } = req.body;
    console.log("DEBUG: Request body - message:", message?.substring(0, 50), "team:", team);

    if (!message) {
      return res.status(400).json({ error: "Missing user message" });
    }

    if (!team) {
      return res.status(400).json({ error: "Missing team parameter" });
    }

    // Construct URL - use request host for production, localhost for local dev
    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    // Fetch current sports context from TheSportsDB API
    let sportsContext = null;
    try {
      const sportsContextUrl = `${baseUrl}/api/sports-context?team=${encodeURIComponent(team)}`;
      console.log("DEBUG: Fetching sports context from:", sportsContextUrl);
      
      const sportsRes = await fetch(sportsContextUrl);
      if (sportsRes.ok) {
        const sportsData = await sportsRes.json();
        if (sportsData.ok && sportsData.data) {
          sportsContext = sportsData.data;
          console.log("DEBUG: Sports context fetched successfully");
          console.log("DEBUG: Team:", sportsContext.team?.name);
          console.log("DEBUG: Last game:", sportsContext.lastGame?.strEvent);
          console.log("DEBUG: Next game:", sportsContext.nextGame?.strEvent);
        } else {
          console.warn("DEBUG: Sports context API returned non-OK:", sportsData.error);
        }
      } else {
        console.warn("DEBUG: Sports context API request failed:", sportsRes.status);
      }
    } catch (sportsError) {
      console.warn("DEBUG: Failed to fetch sports context:", sportsError.message);
      // Continue without sports context - don't fail the entire request
    }

    // Fetch real-time news and Reddit discussions
    let sportsNews = null;
    try {
      const league = sportsContext?.team?.league || null;
      const newsUrl = `${baseUrl}/api/sports-news?team=${encodeURIComponent(team)}${league ? `&league=${encodeURIComponent(league)}` : ''}&limit=5`;
      console.log("DEBUG: Fetching sports news from:", newsUrl);
      
      const newsRes = await fetch(newsUrl);
      if (newsRes.ok) {
        const newsData = await newsRes.json();
        if (newsData.ok && newsData.data) {
          sportsNews = newsData.data;
          console.log("DEBUG: Sports news fetched successfully");
          console.log("DEBUG: News articles:", sportsNews.news?.length || 0);
          console.log("DEBUG: Reddit posts:", sportsNews.reddit?.length || 0);
        } else {
          console.warn("DEBUG: Sports news API returned non-OK:", newsData.error);
        }
      } else {
        console.warn("DEBUG: Sports news API request failed:", newsRes.status);
      }
    } catch (newsError) {
      console.warn("DEBUG: Failed to fetch sports news:", newsError.message);
      // Continue without news - don't fail the entire request
    }

    const API_KEY = process.env.OPENAI_API_KEY;
    console.log("DEBUG: OPENAI_API_KEY is set:", API_KEY ? `${API_KEY.substring(0, 7)}...` : "NOT SET");
    
    if (!API_KEY) {
      throw new Error("OPENAI_API_KEY environment variable is not set. Add it in Vercel project settings (Settings > Environment Variables).");
    }

    const client = new OpenAI({
      apiKey: API_KEY,
    });

    // Use a valid OpenAI model - gpt-4.1 doesn't exist, using gpt-4-turbo-preview or gpt-4
    const model = process.env.OPENAI_MODEL || "gpt-4-turbo-preview";
    console.log("DEBUG: Using OpenAI model:", model);

    // Build system prompt with current sports context
    let systemPrompt = `You are the FanZone.chat AI assistant. You provide real-time, accurate information about sports teams. Speak only about the user's selected team: ${team}. If the user asks about another team, politely remind them about their subscription.`;

    if (sportsContext) {
      const teamInfo = sportsContext.team;
      const lastGame = sportsContext.lastGame;
      const nextGame = sportsContext.nextGame;
      
      systemPrompt += `\n\n--- CURRENT TEAM INFORMATION (REAL-TIME DATA) ---
Team: ${teamInfo?.name || team}
League: ${teamInfo?.league || 'Unknown'}
Sport: ${teamInfo?.sport || 'Unknown'}
Stadium: ${teamInfo?.stadium || 'Unknown'}`;

      if (lastGame) {
        systemPrompt += `\n\nLAST GAME:
- Event: ${lastGame.strEvent || 'N/A'}
- Date: ${lastGame.dateEvent || 'N/A'}
- Home Team: ${lastGame.strHomeTeam || 'N/A'} (Score: ${lastGame.intHomeScore || 'N/A'})
- Away Team: ${lastGame.strAwayTeam || 'N/A'} (Score: ${lastGame.intAwayScore || 'N/A'})
- Status: ${lastGame.strStatus || 'N/A'}`;
      }

      if (nextGame) {
        systemPrompt += `\n\nNEXT GAME:
- Event: ${nextGame.strEvent || 'N/A'}
- Date: ${nextGame.dateEvent || 'N/A'} at ${nextGame.strTimeLocal || nextGame.strTime || 'TBD'}
- Home Team: ${nextGame.strHomeTeam || 'N/A'}
- Away Team: ${nextGame.strAwayTeam || 'N/A'}
- Status: ${nextGame.strStatus || 'Not Started'}`;
      }

      systemPrompt += `\n\nUse this real-time data to answer questions about recent games, upcoming games, and current team status. This data is current and accurate.`;
    } else {
      systemPrompt += `\n\nNote: Real-time sports data is currently unavailable. Answer questions in general terms and mention that specific current information may not be available.`;
    }

    // Add news and Reddit discussions to the prompt
    if (sportsNews) {
      systemPrompt += `\n\n--- LATEST NEWS AND DISCUSSIONS (REAL-TIME) ---`;
      
      if (sportsNews.news && sportsNews.news.length > 0) {
        systemPrompt += `\n\nRECENT NEWS ARTICLES:`;
        sportsNews.news.forEach((article, index) => {
          systemPrompt += `\n${index + 1}. ${article.title}${article.description ? ` - ${article.description.substring(0, 200)}` : ''} (Published: ${new Date(article.publishedAt).toLocaleDateString()})`;
        });
      }
      
      if (sportsNews.reddit && sportsNews.reddit.length > 0) {
        systemPrompt += `\n\nREDDIT DISCUSSIONS (Fan Community):`;
        sportsNews.reddit.slice(0, 5).forEach((post, index) => {
          systemPrompt += `\n${index + 1}. ${post.title} (Score: ${post.score}, Comments: ${post.comments})${post.selftext ? ` - ${post.selftext.substring(0, 200)}` : ''}`;
        });
        systemPrompt += `\n\nUse these discussions to understand current fan sentiment, rumors, and trending topics.`;
      }
      
      systemPrompt += `\n\nWhen answering questions, reference this news and discussion data to provide the most current information available.`;
    }

    const response = await client.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.4,
    });

    const reply = response.choices[0].message.content;
    console.log("DEBUG: OpenAI response received, length:", reply?.length);

    return res.status(200).json({ reply });

  } catch (error) {
    console.error("OpenAI error:", error);
    console.error("OpenAI error type:", typeof error);
    console.error("OpenAI error message:", error?.message);
    console.error("OpenAI error code:", error?.code);
    console.error("OpenAI error status:", error?.status);

    // Check if response headers have already been sent
    if (res.headersSent) {
      console.error("ERROR: Response headers already sent, cannot send error response");
      return;
    }

    try {
      // Provide more detailed error information
      const errorMessage = error?.message || String(error);
      const isApiKeyError = errorMessage.includes("API key") || error?.status === 401;
      const isModelError = errorMessage.includes("model") || error?.code === "model_not_found";
      
      return res.status(500).json({ 
        error: errorMessage,
        details: isApiKeyError 
          ? "Check that OPENAI_API_KEY is set correctly in Vercel environment variables."
          : isModelError
          ? "The OpenAI model may not be available. Try setting OPENAI_MODEL to 'gpt-4' or 'gpt-3.5-turbo' in Vercel environment variables."
          : "Check Vercel function logs for more details.",
        code: error?.code,
        status: error?.status
      });
    } catch (responseError) {
      console.error("ERROR: Failed to send error response:", responseError);
      if (!res.headersSent) {
        res.status(500).send(`Internal error: ${error?.message || String(error)}`);
      }
    }
  }
}