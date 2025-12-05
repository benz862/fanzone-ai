import { Team, VoiceOption } from './types';

export const VOICE_OPTIONS: VoiceOption[] = [
  { 
    id: 'female-conversational', 
    name: 'Female - Conversational', 
    category: 'Female', 
    description: 'Friendly and engaging (Default)', 
    geminiId: 'Kore' 
  },
  { 
    id: 'male-conversational', 
    name: 'Male - Conversational', 
    category: 'Male', 
    description: 'Casual and relaxed', 
    geminiId: 'Puck' 
  },
  { 
    id: 'female-sportscaster', 
    name: 'Female - Sportscaster', 
    category: 'Female', 
    description: 'Energetic, sharp analysis', 
    geminiId: 'Zephyr' 
  },
  { 
    id: 'male-sportscaster', 
    name: 'Male - Sportscaster', 
    category: 'Male', 
    description: 'Deep, authoritative analyst', 
    geminiId: 'Fenrir' 
  },
  { 
    id: 'neutral', 
    name: 'Neutral / Androgynous', 
    category: 'Neutral', 
    description: 'Calm, balanced, steady', 
    geminiId: 'Charon' 
  },
];

export const DEFAULT_VOICE_ID = 'female-conversational';

export const INITIAL_SYSTEM_INSTRUCTION = `You are an expert sports analyst and superfan AI. 
Your goal is to have engaging, opinionated, but factual conversations about the user's selected team.
You MUST prioritize Real-Time Data provided in your instructions over your internal training data.
Always cite your sources implicitly by using the search tool, but keep the conversation natural and flowing like a sports radio host.
Be passionate. If the team is losing, share the pain. If they are winning, celebrate.`;

// --- Pricing Logic ---

export interface SubscriptionInfo {
  price: number;
  normalPrice: number;
  savings: number;
  tierName: string;
  message: string;
  nextUnlock?: string;
}

export const MEMBERSHIP_TIERS = [
  { 
    id: 'tier_1', 
    count: 1, 
    price: 4.99, 
    yearlyPrice: 47.99,
    yearlyLabel: '$47.99', 
    name: 'Starter Fan', 
    description: 'Follow 1 Team',
    stripeMonthlyProductId: 'prod_TXp85Xwf3uDrJV',
    stripeYearlyProductId: 'prod_TXp8WScDo2DaF7'
  },
  { 
    id: 'tier_3', 
    count: 3, 
    price: 5.99, 
    yearlyPrice: 56.99, 
    yearlyLabel: '$56.99', 
    name: '3-Team Bundle', 
    description: 'Follow 3 Teams', 
    savings: '$0.98',
    stripeMonthlyProductId: 'prod_TXpa9KHZHvzXwR',
    stripeYearlyProductId: 'prod_TXpb83FhaFftQU'
  },
  { 
    id: 'tier_5', 
    count: 5, 
    price: 7.49, 
    yearlyPrice: 71.99, 
    yearlyLabel: '$71.99', 
    name: '5-Team Power Pack', 
    description: 'Follow 5 Teams', 
    savings: '$1.46',
    stripeMonthlyProductId: 'prod_TXpcWilOWDfuBb',
    stripeYearlyProductId: 'prod_TXpeXlMfYVLzBo'
  },
  { 
    id: 'tier_10', 
    count: 10, 
    price: 9.99, 
    yearlyPrice: 94.99, 
    yearlyLabel: '$94.99',
    name: 'Ultimate Fan', 
    description: 'Follow 10 Teams', 
    savings: '$3.91',
    stripeMonthlyProductId: 'prod_TXpfEIq5Fegz6W',
    stripeYearlyProductId: 'prod_TXpfLr8SEqigp8'
  },
];

export const getSubscriptionInfo = (count: number): SubscriptionInfo => {
  let price = 0;
  // Calculate "Normal" price (Base $4.99 + $0.99 for each additional team)
  const normalPrice = count > 0 ? 4.99 + (Math.max(0, count - 1) * 0.99) : 0;
  
  let tierName = 'Base Plan';
  let message = '';
  let nextUnlock = '';

  if (count <= 1) {
    price = 4.99;
    tierName = 'Base Plan';
    nextUnlock = 'Add teams to unlock bundles';
  } else if (count === 2) {
    price = 5.98; // 4.99 + 0.99
    tierName = 'Base + 1';
    message = 'Add 1 more team to unlock the 3-Team Deal!';
  } else if (count === 3) {
    price = 5.99; // Tier 1 Bundle
    tierName = '3-Team Value Pack';
    message = 'Bundle Unlocked! Great Value.';
  } else if (count === 4) {
    price = 6.98; // 5.99 + 0.99
    tierName = '3-Team Pack + 1';
    message = 'Add 1 more team to unlock the 5-Team Bundle!';
  } else if (count === 5) {
    price = 7.49; // Tier 2 Bundle
    tierName = '5-Team Power Pack';
    message = '5-Team Bundle Unlocked!';
  } else if (count > 5 && count < 10) {
    // Interpolate between 5 teams ($7.49) and 10 teams ($9.99)
    // The gap is $2.50 over 5 steps, so $0.50 per additional team in this range
    // This is cheaper than the standard $0.99 add-on
    const steps = count - 5;
    price = 7.49 + (steps * 0.50);
    tierName = `5-Team Pack + ${steps}`;
    const needed = 10 - count;
    message = `Add ${needed} more team${needed > 1 ? 's' : ''} to unlock the 10-Team Super Bundle!`;
  } else {
    // 10 Teams or more
    // Tier 3 Bundle: $9.99 for 10 teams
    // Additional teams beyond 10 return to standard $0.99 add-on
    const extra = Math.max(0, count - 10);
    price = 9.99 + (extra * 0.99);
    tierName = extra > 0 ? `10-Team Super Fan + ${extra}` : '10-Team Super Fan';
    message = 'Maximum bundle savings active!';
  }
  
  const savings = Math.max(0, normalPrice - price);
  
  return { price, normalPrice, savings, tierName, message, nextUnlock };
};

// --- Data Generation Helpers ---

// Simple string hash to color function to generate consistent team colors
const stringToColor = (str: string, shift: number = 0): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const c = (hash & 0x00ffffff).toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
};

const generateId = (league: string, name: string) => {
  return `${league.toLowerCase().replace(/\s/g, '')}-${name.toLowerCase().replace(/\s/g, '-')}`;
};

// Raw Data Structure
const RAW_DATA = [
  {
    sport: "Hockey",
    leagues: [
      {
        league: "NHL",
        teams: [
          "Anaheim Ducks", "Boston Bruins", "Buffalo Sabres", "Calgary Flames", "Carolina Hurricanes", 
          "Chicago Blackhawks", "Colorado Avalanche", "Columbus Blue Jackets", "Dallas Stars", "Detroit Red Wings", 
          "Edmonton Oilers", "Florida Panthers", "Los Angeles Kings", "Minnesota Wild", "Montreal Canadiens", 
          "Nashville Predators", "New Jersey Devils", "New York Islanders", "New York Rangers", "Ottawa Senators", 
          "Philadelphia Flyers", "Pittsburgh Penguins", "San Jose Sharks", "Seattle Kraken", "St. Louis Blues", 
          "Tampa Bay Lightning", "Toronto Maple Leafs", "Utah Mammoth", "Vancouver Canucks", "Vegas Golden Knights", 
          "Washington Capitals", "Winnipeg Jets"
        ]
      },
      {
        league: "PWHL",
        teams: [
          "Boston Fleet", "Minnesota Frost", "Montreal Victoire", "New York Sirens", "Ottawa Charge", "Toronto Sceptres"
        ]
      },
      {
        league: "AHL",
        teams: [
          "Abbotsford Canucks", "Bakersfield Condors", "Belleville Senators", "Bridgeport Islanders", "Calgary Wranglers",
          "Charlotte Checkers", "Chicago Wolves", "Cleveland Monsters", "Coachella Valley Firebirds", "Colorado Eagles",
          "Grand Rapids Griffins", "Hartford Wolf Pack", "Henderson Silver Knights", "Hershey Bears", "Iowa Wild",
          "Laval Rocket", "Lehigh Valley Phantoms", "Manitoba Moose", "Milwaukee Admirals", "Ontario Reign",
          "Providence Bruins", "Rochester Americans", "Rockford IceHogs", "San Diego Gulls", "San Jose Barracuda",
          "Springfield Thunderbirds", "Syracuse Crunch", "Texas Stars", "Toronto Marlies", "Tucson Roadrunners",
          "Utica Comets", "Wilkes-Barre/Scranton Penguins"
        ]
      },
      {
        league: "WHL",
        teams: [
          "Brandon Wheat Kings", "Calgary Hitmen", "Edmonton Oil Kings", "Everett Silvertips", "Kamloops Blazers",
          "Kelowna Rockets", "Lethbridge Hurricanes", "Medicine Hat Tigers", "Moose Jaw Warriors", "Portland Winterhawks",
          "Prince Albert Raiders", "Prince George Cougars", "Red Deer Rebels", "Regina Pats", "Saskatoon Blades",
          "Seattle Thunderbirds", "Spokane Chiefs", "Swift Current Broncos", "Tri-City Americans", "Vancouver Giants",
          "Victoria Royals", "Wenatchee Wild"
        ]
      }
    ]
  },
  {
    sport: "Soccer",
    leagues: [
      {
        league: "Premier League",
        teams: [
          "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
          "Chelsea", "Crystal Palace", "Everton", "Fulham", "Liverpool",
          "Luton Town", "Manchester City", "Manchester United", "Newcastle United",
          "Nottingham Forest", "Sheffield United", "Tottenham Hotspur",
          "West Ham United", "Wolverhampton Wanderers"
        ]
      },
      {
        league: "La Liga",
        teams: [
          "Real Madrid", "Barcelona", "Atlético Madrid", "Real Betis",
          "Real Sociedad", "Sevilla", "Villarreal", "Valencia"
        ]
      },
      {
        league: "Serie A",
        teams: [
          "AC Milan", "Inter Milan", "Juventus", "Roma",
          "Napoli", "Lazio", "Fiorentina", "Atalanta"
        ]
      },
      {
        league: "Bundesliga",
        teams: [
          "Bayern Munich", "Borussia Dortmund", "RB Leipzig",
          "Bayer Leverkusen", "Eintracht Frankfurt"
        ]
      },
      {
        league: "MLS",
        teams: [
          "Atlanta United", "Austin FC", "CF Montréal", "Charlotte FC",
          "Chicago Fire", "Colorado Rapids", "Columbus Crew", "D.C. United",
          "FC Dallas", "Houston Dynamo", "Inter Miami CF", "LAFC",
          "LA Galaxy", "Minnesota United", "Nashville SC", "New England Revolution",
          "New York City FC", "New York Red Bulls", "Orlando City SC", "Philadelphia Union",
          "Portland Timbers", "Real Salt Lake", "San Jose Earthquakes",
          "Seattle Sounders", "Sporting Kansas City", "St. Louis City SC",
          "Toronto FC", "Vancouver Whitecaps"
        ]
      },
      {
        league: "Brasileirão Série A",
        teams: [
          "Athletico Paranaense", "Atlético Mineiro", "Bahia", "Botafogo", "Corinthians",
          "Cuiabá", "Flamengo", "Fluminense", "Fortaleza", "Grêmio",
          "Internacional", "Palmeiras", "Red Bull Bragantino", "São Paulo", "Vasco da Gama"
        ]
      },
      {
        league: "Argentine Primera",
        teams: [
          "Boca Juniors", "River Plate", "Racing Club", "Independiente", "San Lorenzo",
          "Estudiantes", "Rosario Central", "Talleres", "Belgrano", "Vélez Sarsfield"
        ]
      }
    ]
  },
  {
    sport: "American Football",
    leagues: [
      {
        league: "NFL",
        teams: [
          "Arizona Cardinals", "Atlanta Falcons", "Baltimore Ravens", "Buffalo Bills",
          "Carolina Panthers", "Chicago Bears", "Cincinnati Bengals", "Cleveland Browns",
          "Dallas Cowboys", "Denver Broncos", "Detroit Lions", "Green Bay Packers",
          "Houston Texans", "Indianapolis Colts", "Jacksonville Jaguars", "Kansas City Chiefs",
          "Las Vegas Raiders", "Los Angeles Chargers", "Los Angeles Rams", "Miami Dolphins",
          "Minnesota Vikings", "New England Patriots", "New Orleans Saints", "New York Giants",
          "New York Jets", "Philadelphia Eagles", "Pittsburgh Steelers", "San Francisco 49ers",
          "Seattle Seahawks", "Tampa Bay Buccaneers", "Tennessee Titans", "Washington Commanders"
        ]
      },
      {
        league: "CFL",
        teams: [
          "BC Lions", "Calgary Stampeders", "Edmonton Elks", "Hamilton Tiger-Cats",
          "Montreal Alouettes", "Ottawa Redblacks", "Saskatchewan Roughriders",
          "Toronto Argonauts", "Winnipeg Blue Bombers"
        ]
      }
    ]
  },
  {
    sport: "Basketball",
    leagues: [
      {
        league: "NBA",
        teams: [
          "Atlanta Hawks", "Boston Celtics", "Brooklyn Nets", "Charlotte Hornets",
          "Chicago Bulls", "Cleveland Cavaliers", "Dallas Mavericks", "Denver Nuggets",
          "Detroit Pistons", "Golden State Warriors", "Houston Rockets", "Indiana Pacers",
          "LA Clippers", "Los Angeles Lakers", "Memphis Grizzlies", "Miami Heat",
          "Milwaukee Bucks", "Minnesota Timberwolves", "New Orleans Pelicans",
          "New York Knicks", "Oklahoma City Thunder", "Orlando Magic",
          "Philadelphia 76ers", "Phoenix Suns", "Portland Trail Blazers",
          "Sacramento Kings", "San Antonio Spurs", "Toronto Raptors",
          "Utah Jazz", "Washington Wizards"
        ]
      },
      {
        league: "WNBA",
        teams: [
          "Atlanta Dream", "Chicago Sky", "Connecticut Sun", "Dallas Wings", "Indiana Fever", "Las Vegas Aces", 
          "Los Angeles Sparks", "Minnesota Lynx", "New York Liberty", "Phoenix Mercury", "Seattle Storm", "Washington Mystics"
        ]
      },
      {
        league: "EuroLeague",
        teams: [
          "Real Madrid", "FC Barcelona", "Fenerbahçe", "Anadolu Efes",
          "Olympiacos", "Panathinaikos", "Maccabi Tel Aviv"
        ]
      }
    ]
  },
  {
    sport: "Baseball",
    leagues: [
      {
        league: "MLB",
        teams: [
          "Arizona Diamondbacks", "Atlanta Braves", "Baltimore Orioles",
          "Boston Red Sox", "Chicago Cubs", "Chicago White Sox",
          "Cincinnati Reds", "Cleveland Guardians", "Colorado Rockies",
          "Detroit Tigers", "Houston Astros", "Kansas City Royals",
          "Los Angeles Angels", "Los Angeles Dodgers", "Miami Marlins",
          "Milwaukee Brewers", "Minnesota Twins", "New York Mets",
          "New York Yankees", "Oakland Athletics", "Philadelphia Phillies",
          "Pittsburgh Pirates", "San Diego Padres", "San Francisco Giants",
          "Seattle Mariners", "St. Louis Cardinals", "Tampa Bay Rays",
          "Texas Rangers", "Toronto Blue Jays", "Washington Nationals"
        ]
      },
      {
        league: "NPB (Japan)",
        teams: [
          "Chiba Lotte Marines", "Chunichi Dragons", "Fukuoka SoftBank Hawks", "Hanshin Tigers",
          "Hiroshima Toyo Carp", "Hokkaido Nippon-Ham Fighters", "Orix Buffaloes", "Saitama Seibu Lions",
          "Tohoku Rakuten Golden Eagles", "Tokyo Yakult Swallows", "Yokohama DeNA BayStars", "Yomiuri Giants"
        ]
      }
    ]
  },
  {
    sport: "Motorsport",
    leagues: [
      { "league": "Formula 1", "teams": ["Red Bull Racing", "Mercedes", "Ferrari", "McLaren", "Aston Martin"] },
      { "league": "NASCAR", "teams": ["Hendrick Motorsports", "Joe Gibbs Racing", "Team Penske"] }
    ]
  },
  {
    sport: "Rugby",
    leagues: [
      { 
        league: "NRL (Australasia)", 
        teams: [
          "Brisbane Broncos", "Canberra Raiders", "Canterbury-Bankstown Bulldogs", "Cronulla-Sutherland Sharks", "Dolphins",
          "Gold Coast Titans", "Manly Warringah Sea Eagles", "Melbourne Storm", "Newcastle Knights", "North Queensland Cowboys",
          "Parramatta Eels", "Penrith Panthers", "South Sydney Rabbitohs", "St. George Illawarra Dragons", "Sydney Roosters",
          "New Zealand Warriors", "Wests Tigers"
        ] 
      },
      { 
        league: "Super League (Europe)", 
        teams: [
          "Castleford Tigers", "Catalans Dragons", "Huddersfield Giants", "Hull FC", "Hull KR", "Leeds Rhinos",
          "Leigh Leopards", "London Broncos", "Salford Red Devils", "St Helens", "Warrington Wolves", "Wigan Warriors"
        ] 
      }
    ]
  },
  {
    sport: "Cricket",
    leagues: [
      {
        league: "IPL (India)",
        teams: [
          "Chennai Super Kings", "Delhi Capitals", "Gujarat Titans", "Kolkata Knight Riders", "Lucknow Super Giants",
          "Mumbai Indians", "Punjab Kings", "Rajasthan Royals", "Royal Challengers Bengaluru", "Sunrisers Hyderabad"
        ]
      },
      {
        league: "Big Bash League (Australia)",
        teams: [
          "Adelaide Strikers", "Brisbane Heat", "Hobart Hurricanes", "Melbourne Renegades", "Melbourne Stars",
          "Perth Scorchers", "Sydney Sixers", "Sydney Thunder"
        ]
      },
      {
        league: "The Hundred (UK)",
        teams: [
          "Birmingham Phoenix", "London Spirit", "Manchester Originals", "Northern Superchargers",
          "Oval Invincibles", "Southern Brave", "Trent Rockets", "Welsh Fire"
        ]
      }
    ]
  }
];

// Flatten the structure
export const AVAILABLE_TEAMS: Team[] = RAW_DATA.flatMap(sportData => 
  sportData.leagues.flatMap(leagueData => 
    leagueData.teams.map(teamName => {
      // Manual overrides for specific teams to ensure good branding if desired, 
      // otherwise use procedural generation
      let primaryColor = stringToColor(teamName);
      let secondaryColor = '#FFFFFF';

      // Small set of overrides for popular teams to ensure the demo looks good
      if (teamName === 'Toronto Maple Leafs') { primaryColor = '#00205B'; secondaryColor = '#FFFFFF'; }
      if (teamName === 'Montreal Canadiens') { primaryColor = '#AF1E2D'; secondaryColor = '#192168'; }
      if (teamName === 'Kansas City Chiefs') { primaryColor = '#E31837'; secondaryColor = '#FFB81C'; }
      if (teamName === 'Golden State Warriors') { primaryColor = '#1D428A'; secondaryColor = '#FFC72C'; }
      if (teamName === 'Liverpool') { primaryColor = '#C8102E'; secondaryColor = '#00B2A9'; }
      if (teamName === 'New York Yankees') { primaryColor = '#003087'; secondaryColor = '#E4002C'; }
      if (teamName === 'Manchester United') { primaryColor = '#DA291C'; secondaryColor = '#FBE122'; }
      if (teamName === 'Los Angeles Lakers') { primaryColor = '#552583'; secondaryColor = '#FDB927'; }
      if (teamName === 'Hanshin Tigers') { primaryColor = '#FFE100'; secondaryColor = '#000000'; }
      if (teamName === 'Yomiuri Giants') { primaryColor = '#F97709'; secondaryColor = '#000000'; }
      if (teamName === 'Hershey Bears') { primaryColor = '#573024'; secondaryColor = '#D2B48C'; }
      if (teamName === 'Flamengo') { primaryColor = '#C9082A'; secondaryColor = '#121212'; }
      if (teamName === 'Boca Juniors') { primaryColor = '#00338D'; secondaryColor = '#FFD100'; }
      if (teamName === 'Chennai Super Kings') { primaryColor = '#FFFF3C'; secondaryColor = '#0081E9'; }
      if (teamName === 'Mumbai Indians') { primaryColor = '#004BA0'; secondaryColor = '#FFFFFF'; }
      if (teamName === 'Brisbane Broncos') { primaryColor = '#6D193D'; secondaryColor = '#FFD200'; }
      if (teamName === 'Melbourne Storm') { primaryColor = '#3D155F'; secondaryColor = '#F1C40F'; }
      if (teamName === 'PWHL Toronto' || teamName === 'Toronto Sceptres') { primaryColor = '#00205B'; secondaryColor = '#FFFFFF'; }
      
      return {
        id: generateId(leagueData.league, teamName),
        name: teamName,
        league: leagueData.league,
        sport: sportData.sport,
        primaryColor,
        secondaryColor
      };
    })
  )
);