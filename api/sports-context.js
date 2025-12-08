import fetch from "node-fetch";

export default async function handler(req, res) {
  console.log("DEBUG: sports-context handler START");
  console.log("DEBUG: Request query:", req.query);
  console.log("DEBUG: Request method:", req.method);
  
  // TEMPORARY TEST: Uncomment to test if handler is reachable
  // return res.status(200).json({ ok: true, test: "handler reached" });
  
  const team = req.query.team;

  if (!team) {
    return res.status(400).json({ ok: false, error: "Missing team parameter" });
  }

  try {
    // Default to free demo API key "123" if not set
    const API_KEY = process.env.THESPORTSDB_API_KEY ?? "123";
    console.log("DEBUG: API_KEY is set:", API_KEY ? `${API_KEY.substring(0, 3)}...` : "NOT SET");

    const searchUrl = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/searchteams.php?t=${encodeURIComponent(team)}`;
    console.log("DEBUG: Fetching team search URL:", searchUrl);
    const teamRes = await fetch(searchUrl);
    console.log("DEBUG: Team search response status:", teamRes.status, teamRes.statusText);
    console.log("DEBUG: Team search response content-type:", teamRes.headers.get("content-type"));
    
    if (!teamRes.ok) {
      const errorText = await teamRes.text();
      const isHtml = errorText.trim().toLowerCase().startsWith('<!doctype') || errorText.trim().toLowerCase().startsWith('<html');
      
      if (isHtml) {
        // TheSportsDB returned HTML instead of JSON - likely invalid API key or endpoint issue
        const apiKeyStatus = API_KEY === "1" ? "using default demo key '1'" : "API key is set";
        throw new Error(`TheSportsDB API returned HTML error page (404). This could mean: 1) The API key is invalid, 2) TheSportsDB API endpoints have changed or are down, 3) The endpoint structure is incorrect. Current status: ${apiKeyStatus}. Check TheSportsDB status at https://www.thesportsdb.com/api.php or verify your API key is correct in Vercel environment variables.`);
      }
      
      throw new Error(`Team search failed: ${teamRes.status} ${teamRes.statusText}. Response: ${errorText.substring(0, 200)}`);
    }
    
    const contentType = teamRes.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      const responseText = await teamRes.text();
      throw new Error(`Expected JSON but got ${contentType}. Response: ${responseText.substring(0, 200)}`);
    }
    
    const teamJson = await teamRes.json();
    console.log("DEBUG: Team search JSON keys:", Object.keys(teamJson || {}));
    const teamObj = teamJson?.teams?.[0];

    if (!teamObj) {
      return res.status(404).json({ ok: false, error: "Team not found" });
    }

    const teamId = teamObj.idTeam;

    const lastUrl = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventslast.php?id=${teamId}`;
    const nextUrl = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsnext.php?id=${teamId}`;

    console.log("DEBUG: Fetching last game URL:", lastUrl);
    console.log("DEBUG: Fetching next game URL:", nextUrl);
    const [lastRes, nextRes] = await Promise.all([fetch(lastUrl), fetch(nextUrl)]);

    console.log("DEBUG: Last game response status:", lastRes.status);
    console.log("DEBUG: Next game response status:", nextRes.status);
    
    if (!lastRes.ok) {
      const errorText = await lastRes.text();
      throw new Error(`Last game fetch failed: ${lastRes.status} ${lastRes.statusText}. Response: ${errorText.substring(0, 200)}`);
    }
    
    if (!nextRes.ok) {
      const errorText = await nextRes.text();
      throw new Error(`Next game fetch failed: ${nextRes.status} ${nextRes.statusText}. Response: ${errorText.substring(0, 200)}`);
    }

    const lastJson = await lastRes.json();
    const nextJson = await nextRes.json();
    console.log("DEBUG: Last game JSON keys:", Object.keys(lastJson || {}));
    console.log("DEBUG: Next game JSON keys:", Object.keys(nextJson || {}));

    const lastGame = lastJson?.results?.[0] ?? null;
    const nextGame = nextJson?.events?.[0] ?? null;

    return res.status(200).json({
      ok: true,
      data: {
        team: {
          id: teamId,
          name: teamObj.strTeam,
          shortName: teamObj.strTeamShort,
          league: teamObj.strLeague,
          sport: teamObj.strSport,
          country: teamObj.strCountry,
          badge: teamObj.strTeamBadge,
          stadium: teamObj.strStadium,
        },
        lastGame,
        nextGame,
      },
    });
  } catch (err) {
    console.error("sports-context error:", err);
    console.error("sports-context error type:", typeof err);
    console.error("sports-context error message:", err?.message);
    console.error("sports-context error stack:", err?.stack);

    // Check if response headers have already been sent
    if (res.headersSent) {
      console.error("ERROR: Response headers already sent, cannot send error response");
      return;
    }

    try {
      return res.status(500).json({
        ok: false,
        error: err && err.message ? err.message : String(err),
        name: err && err.name ? err.name : undefined,
        stack: err && err.stack ? err.stack : undefined,
        type: typeof err
      });
    } catch (responseError) {
      console.error("ERROR: Failed to send error response:", responseError);
      // If we can't send JSON, try to send plain text
      if (!res.headersSent) {
        res.status(500).send(`Internal error: ${err?.message || String(err)}`);
      }
    }
  }
}