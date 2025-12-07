import type { VercelRequest, VercelResponse } from "@vercel/node";

const THESPORTSDB_API_KEY = process.env.THESPORTSDB_API_KEY ?? "1"; // public dev key

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const team = req.query.team as string;

  if (!team) {
    return res.status(400).json({ ok: false, error: "Missing team parameter" });
  }

  try {
    // 1) Search team
    const searchUrl = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_API_KEY}/searchteams.php?t=${encodeURIComponent(
      team
    )}`;

    const teamRes = await fetch(searchUrl);
    const teamJson = await teamRes.json();
    const teamObj = teamJson?.teams?.[0];

    if (!teamObj) {
      return res.status(404).json({ ok: false, error: "Team not found" });
    }

    const teamId = teamObj.idTeam;

    // 2) Last & next matches
    const lastUrl = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_API_KEY}/eventslast.php?id=${teamId}`;
    const nextUrl = `https://www.thesportsdb.com/api/v1/json/${THESPORTSDB_API_KEY}/eventsnext.php?id=${teamId}`;

    const [lastRes, nextRes] = await Promise.all([fetch(lastUrl), fetch(nextUrl)]);
    const lastJson = await lastRes.json();
    const nextJson = await nextRes.json();

    const lastGame = lastJson?.results?.[0] ?? null;
    const nextGame = nextJson?.events?.[0] ?? null;

    const data = {
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
      lastGame: lastGame
        ? {
            id: lastGame.idEvent,
            date: lastGame.dateEvent,
            time: lastGame.strTime,
            homeTeam: lastGame.strHomeTeam,
            awayTeam: lastGame.strAwayTeam,
            homeScore: lastGame.intHomeScore,
            awayScore: lastGame.intAwayScore,
            filename: lastGame.strFilename,
          }
        : null,
      nextGame: nextGame
        ? {
            id: nextGame.idEvent,
            date: nextGame.dateEvent,
            time: nextGame.strTime,
            homeTeam: nextGame.strHomeTeam,
            awayTeam: nextGame.strAwayTeam,
            filename: nextGame.strFilename,
            tv: nextGame.strTVStation,
          }
        : null,
    };

    return res.status(200).json({ ok: true, data });
  } catch (err) {
    console.error("sports-context error:", err);
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}