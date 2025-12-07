import fetch from "node-fetch";

export default async function handler(req, res) {
  const team = req.query.team;

  if (!team) {
    return res.status(400).json({ ok: false, error: "Missing team parameter" });
  }

  try {
    const API_KEY = process.env.THESPORTSDB_API_KEY ?? "1";

    const searchUrl = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/searchteams.php?t=${encodeURIComponent(team)}`;
    const teamRes = await fetch(searchUrl);
    const teamJson = await teamRes.json();
    const teamObj = teamJson?.teams?.[0];

    if (!teamObj) {
      return res.status(404).json({ ok: false, error: "Team not found" });
    }

    const teamId = teamObj.idTeam;

    const lastUrl = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventslast.php?id=${teamId}`;
    const nextUrl = `https://www.thesportsdb.com/api/v1/json/${API_KEY}/eventsnext.php?id=${teamId}`;

    const [lastRes, nextRes] = await Promise.all([fetch(lastUrl), fetch(nextUrl)]);

    const lastJson = await lastRes.json();
    const nextJson = await nextRes.json();

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
    return res.status(500).json({ ok: false, error: "Internal error" });
  }
}