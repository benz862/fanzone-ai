import fetch from "node-fetch";

/**
 * Fetches real-time sports news, rumors, and Reddit discussions
 * Combines NewsAPI and Reddit API for comprehensive coverage
 */
export default async function handler(req, res) {
  console.log("DEBUG: sports-news handler START");
  console.log("DEBUG: Request query:", req.query);
  
  const { team, league, limit = 5 } = req.query;

  if (!team && !league) {
    return res.status(400).json({ 
      ok: false, 
      error: "Missing team or league parameter" 
    });
  }

  try {
    const results = {
      news: [],
      reddit: [],
      sources: []
    };

    // 1. Fetch from NewsAPI (if API key is set)
    const NEWS_API_KEY = process.env.NEWS_API_KEY;
    if (NEWS_API_KEY) {
      try {
        // Search for team-specific news
        const newsQuery = team || league;
        const newsUrl = `https://newsapi.org/v2/everything?q=${encodeURIComponent(newsQuery)}&language=en&sortBy=publishedAt&pageSize=${limit}&apiKey=${NEWS_API_KEY}`;
        
        console.log("DEBUG: Fetching news from NewsAPI");
        const newsRes = await fetch(newsUrl);
        
        if (newsRes.ok) {
          const newsData = await newsRes.json();
          if (newsData.articles && newsData.articles.length > 0) {
            results.news = newsData.articles.slice(0, limit).map(article => ({
              title: article.title,
              description: article.description,
              url: article.url,
              source: article.source?.name,
              publishedAt: article.publishedAt,
              image: article.urlToImage
            }));
            console.log("DEBUG: Fetched", results.news.length, "news articles");
          }
        } else {
          console.warn("DEBUG: NewsAPI request failed:", newsRes.status);
        }
      } catch (newsError) {
        console.warn("DEBUG: NewsAPI error:", newsError.message);
      }
    } else {
      console.log("DEBUG: NEWS_API_KEY not set, skipping NewsAPI");
    }

    // 2. Fetch from Reddit (free, no API key needed)
    try {
      // Map team/league to Reddit subreddits
      const subreddits = getSubreddits(team, league);
      
      for (const subreddit of subreddits) {
        try {
          const redditUrl = `https://www.reddit.com/r/${subreddit}/hot.json?limit=${limit}`;
          console.log("DEBUG: Fetching Reddit discussions from:", subreddit);
          
          const redditRes = await fetch(redditUrl, {
            headers: {
              'User-Agent': 'FanZone-Chat/1.0 (Sports News Aggregator)'
            }
          });
          
          if (redditRes.ok) {
            const redditData = await redditRes.json();
            if (redditData.data?.children) {
              const posts = redditData.data.children
                .filter(post => !post.data.stickied) // Exclude stickied posts
                .slice(0, limit)
                .map(post => ({
                  title: post.data.title,
                  selftext: post.data.selftext?.substring(0, 500),
                  url: `https://reddit.com${post.data.permalink}`,
                  score: post.data.score,
                  comments: post.data.num_comments,
                  created: post.data.created_utc,
                  subreddit: post.data.subreddit
                }));
              
              results.reddit.push(...posts);
              console.log("DEBUG: Fetched", posts.length, "Reddit posts from", subreddit);
            }
          } else {
            console.warn("DEBUG: Reddit request failed for", subreddit, ":", redditRes.status);
          }
        } catch (redditError) {
          console.warn("DEBUG: Reddit error for", subreddit, ":", redditError.message);
        }
      }
      
      // Limit total Reddit posts
      results.reddit = results.reddit.slice(0, limit * 2);
    } catch (redditError) {
      console.warn("DEBUG: Reddit fetch error:", redditError.message);
    }

    // 3. Add source information
    if (results.news.length > 0) {
      results.sources.push("NewsAPI");
    }
    if (results.reddit.length > 0) {
      results.sources.push("Reddit");
    }

    return res.status(200).json({
      ok: true,
      data: results,
      count: {
        news: results.news.length,
        reddit: results.reddit.length
      }
    });

  } catch (err) {
    console.error("sports-news error:", err);
    
    if (res.headersSent) {
      return;
    }

    try {
      return res.status(500).json({
        ok: false,
        error: err?.message || String(err),
        name: err?.name,
        stack: err?.stack
      });
    } catch (responseError) {
      console.error("ERROR: Failed to send error response:", responseError);
      if (!res.headersSent) {
        res.status(500).send(`Internal error: ${err?.message || String(err)}`);
      }
    }
  }
}

/**
 * Maps team/league names to relevant Reddit subreddits
 */
function getSubreddits(team, league) {
  const subreddits = [];
  
  if (team) {
    // Team-specific subreddits (common patterns)
    const teamLower = team.toLowerCase().replace(/\s+/g, '');
    
    // NHL teams
    if (teamLower.includes('mapleleafs') || teamLower.includes('toronto')) {
      subreddits.push('leafs', 'torontomapleleafs');
    }
    if (teamLower.includes('canadiens') || teamLower.includes('montreal')) {
      subreddits.push('habs');
    }
    // Add more team mappings as needed
    
    // General sport subreddits based on team
    if (teamLower.includes('leafs') || teamLower.includes('canadiens') || teamLower.includes('bruins')) {
      subreddits.push('hockey', 'nhl');
    }
  }
  
  if (league) {
    const leagueLower = league.toLowerCase();
    
    // Map leagues to subreddits
    const leagueMap = {
      'nhl': ['hockey', 'nhl'],
      'nfl': ['nfl'],
      'nba': ['nba'],
      'mlb': ['baseball', 'mlb'],
      'premier league': ['soccer', 'premierleague'],
      'mls': ['mls', 'soccer']
    };
    
    for (const [key, subs] of Object.entries(leagueMap)) {
      if (leagueLower.includes(key)) {
        subreddits.push(...subs);
      }
    }
  }
  
  // Default fallbacks
  if (subreddits.length === 0) {
    subreddits.push('sports', 'hockey');
  }
  
  // Remove duplicates and return
  return [...new Set(subreddits)];
}

