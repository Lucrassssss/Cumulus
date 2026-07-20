// ── Events ───────────────────────────────
// Cumulus runs on REAL data only — no demo/seed events. EVENTS starts empty
// and is populated at boot from the Supabase `events` table via
// loadRealEvents(). If the backend is unreachable or has no rows, the app
// renders clean empty states rather than inventing listings.
const EVENTS = [];

// Category palette — distinct, harmonious, no purple/indigo/violet.
// Used only as scannability accents (dots, badges, markers, borders);
// all interactive chrome (buttons/nav/CTAs) stays yellow.
const CATS = {
  Creative: { color: "#FFCF33", textColor: "#765E1F" }, // gold
  Gaming: { color: "#35C98A", textColor: "#1D6C4A" }, // emerald
  "Movie Nights": { color: "#F0913E", textColor: "#984D0C" }, // orange
  "Board Games": { color: "#2FB6C4", textColor: "#1B6A72" }, // teal
  Meetups: { color: "#E85BA0", textColor: "#B41965" }, // pink
  "Food & Drink": { color: "#E85641", textColor: "#B22916" }, // red
  "Live Music": { color: "#F0687E", textColor: "#B7122D" }, // rose
  "Wellness & Outdoors": { color: "#8FC63D", textColor: "#4C6A1F" }, // lime
  "Tech & Talks": { color: "#4F9BE8", textColor: "#1660AB" }, // blue
};

// Category → representative photo (Unsplash, free license). Presentation only.
const CAT_IMG = {
  Creative: "1513364776144-60967b0f800f",
  Gaming: "1511512578047-dfb367046420",
  "Movie Nights": "1489599849927-2ee91cede3ba",
  "Board Games": "1610890716171-6b1bb98ffd09",
  Meetups: "1523580494863-6f3031224c94",
  "Food & Drink": "1414235077428-338989a2e8c0",
  "Live Music": "1470229722913-7c0e2dbbafd3",
  "Wellness & Outdoors": "1544367567-0f2fcb009e0b",
  "Tech & Talks": "1475721027785-f74eccf877e2",
};
function catImg(cat) {
  const id = CAT_IMG[cat] || "1517457373958-b7bdd4587205";
  return `https://images.unsplash.com/photo-${id}?w=900&q=72&auto=format&fit=crop`;
}

function eventStatus(ev) {
  const now = Date.now();
  if (now >= ev.startsAt && now <= ev.endsAt) return "live";
  if (now < ev.startsAt) return "upcoming";
  return "past";
}
function isHotEvent(ev) {
  const st = eventStatus(ev);
  if (st === "past") return false;
  if (st === "live") return true;
  return attendeesFor(ev.id).length >= 2;
}
function generateUniqueId() {
  return Math.floor(Math.random() * 1000000)
    .toString()
    .padStart(6, "0");
}
function codeFor(name, id) {
  const c = name
    .toUpperCase()
    .replace(/s+/g, "-")
    .replace(/[^A-Z0-9-]/g, "");
  return `CUMULUS-FRIEND::${c}-${id}`;
}

const DEMO_PEOPLE = [
  {
    name: "Alex Rivera",
    id: "849201",
    events: [3, 11, 61, 70, 96],
    blurb: "Watercolours and board games. Always brings snacks.",
  },
  {
    name: "Priya Shah",
    id: "102934",
    events: [9, 29, 45, 84],
    blurb: "New to London, up for almost anything social.",
  },
  {
    name: "Tom Becker",
    id: "582910",
    events: [4, 26, 32, 97],
    blurb: "Retro gaming obsessive, pinball wizard.",
  },
  {
    name: "Mei Lin",
    id: "392105",
    events: [17, 20, 31, 80],
    blurb: "Ceramics, sketching and very strong tea.",
  },
  {
    name: "Jordan Cole",
    id: "994021",
    events: [15, 28, 60, 73, 86],
    blurb: "Film buff and certified A24 superfan.",
  },
  {
    name: "Sam Okafor",
    id: "223019",
    events: [22, 48, 78, 96, 99],
    blurb: "Strategy games strategist. Will teach you.",
  },
  {
    name: "Nadia Hassan",
    id: "774812",
    events: [14, 21, 40, 100],
    blurb: "Here to meet people and try new things.",
  },
  {
    name: "Owen Wright",
    id: "110293",
    events: [40, 49, 74, 87],
    blurb: "Arcades, indie films and good company.",
  },
  {
    name: "Chloe Davies",
    id: "450912",
    events: [10, 26, 76, 89, 92],
    blurb: "Running, sketching, and exploring new boroughs.",
  },
  {
    name: "Marcus King",
    id: "660192",
    events: [14, 39, 90, 99],
    blurb: "Hardstuck in ranked, here to watch the pros instead.",
  },
];
DEMO_PEOPLE.forEach((p) => (p.code = codeFor(p.name, p.id)));
function personByName(n) {
  return DEMO_PEOPLE.find((p) => p.name === n);
}

// ─── Background Styles (50+) — the gradient/texture of the card ─────────────
const CARD_BG_STYLES = [
  // ── Dark Tones ──
  {
    id: "midnight",
    name: "Midnight",
    bg: "linear-gradient(145deg,#090b14 0%,#0f1729 55%,#1a2744 100%)",
    dark: true,
  },
  {
    id: "obsidian",
    name: "Obsidian",
    bg: "linear-gradient(145deg,#0a0a0a 0%,#1a1a1a 55%,#2d2d2d 100%)",
    dark: true,
  },
  {
    id: "charcoal",
    name: "Charcoal",
    bg: "linear-gradient(145deg,#1c1c1e 0%,#2c2c2e 55%,#3a3a3c 100%)",
    dark: true,
  },
  {
    id: "slate",
    name: "Slate",
    bg: "linear-gradient(145deg,#0f172a 0%,#1e293b 55%,#334155 100%)",
    dark: true,
  },
  {
    id: "ink",
    name: "Ink",
    bg: "linear-gradient(145deg,#13111c 0%,#211d30 55%,#2d2840 100%)",
    dark: true,
  },
  {
    id: "abyss",
    name: "Abyss",
    bg: "linear-gradient(145deg,#030712 0%,#0a0f1e 55%,#111827 100%)",
    dark: true,
  },
  {
    id: "noir",
    name: "Noir",
    bg: "linear-gradient(145deg,#0a0a0c 0%,#15151a 55%,#1f1f27 100%)",
    dark: true,
  },
  {
    id: "volcanic",
    name: "Volcanic",
    bg: "linear-gradient(145deg,#1a0505 0%,#2d0a0a 55%,#3d1212 100%)",
    dark: true,
  },
  {
    id: "cosmos",
    name: "Cosmos",
    bg: "linear-gradient(145deg,#050212 0%,#0d0625 55%,#130a38 100%)",
    dark: true,
  },
  {
    id: "carbon",
    name: "Carbon",
    bg: "linear-gradient(145deg,#111 0%,#1e1e1e 40%,#252525 60%,#1a1a1a 100%)",
    dark: true,
  },
  {
    id: "graphite",
    name: "Graphite",
    bg: "linear-gradient(145deg,#1f2023 0%,#2a2b2f 55%,#36373d 100%)",
    dark: true,
  },
  {
    id: "pitch",
    name: "Pitch",
    bg: "linear-gradient(145deg,#06060a 0%,#0e0e14 55%,#18181e 100%)",
    dark: true,
  },
  {
    id: "nightfall",
    name: "Nightfall",
    bg: "linear-gradient(145deg,#0d0e1a 0%,#161730 55%,#1f2044 100%)",
    dark: true,
  },
  {
    id: "anthracite",
    name: "Anthracite",
    bg: "linear-gradient(145deg,#181a1d 0%,#24272c 55%,#303540 100%)",
    dark: true,
  },
  {
    id: "void",
    name: "Void",
    bg: "linear-gradient(145deg,#020204 0%,#060608 55%,#0a0a0e 100%)",
    dark: true,
  },
  // ── Light Tones ──
  {
    id: "cloud",
    name: "Cloud",
    bg: "linear-gradient(145deg,#f8fafc 0%,#e8f0fe 55%,#dbeafe 100%)",
    dark: false,
  },
  {
    id: "pearl",
    name: "Pearl",
    bg: "linear-gradient(145deg,#fefefe 0%,#f5f5f5 55%,#ebebeb 100%)",
    dark: false,
  },
  {
    id: "cream",
    name: "Cream",
    bg: "linear-gradient(145deg,#fffef7 0%,#faf8ef 55%,#f5f2e3 100%)",
    dark: false,
  },
  {
    id: "cotton",
    name: "Cotton",
    bg: "linear-gradient(145deg,#fdfcff 0%,#f3efff 55%,#ede8ff 100%)",
    dark: false,
  },
  {
    id: "frost",
    name: "Frost",
    bg: "linear-gradient(145deg,#f0f9ff 0%,#e0f2fe 55%,#bae6fd 100%)",
    dark: false,
  },
  {
    id: "linen-bg",
    name: "Linen",
    bg: "linear-gradient(145deg,#faf9f7 0%,#f2efea 55%,#e8e2d8 100%)",
    dark: false,
  },
  {
    id: "chalk",
    name: "Chalk",
    bg: "linear-gradient(145deg,#f8f8f6 0%,#eeede8 55%,#e2e0d8 100%)",
    dark: false,
  },
  {
    id: "mist",
    name: "Mist",
    bg: "linear-gradient(145deg,#e2e8f0 0%,#cbd5e1 50%,#e0e7ff 100%)",
    dark: false,
  },
  {
    id: "blush",
    name: "Blush",
    bg: "linear-gradient(145deg,#fff0f3 0%,#ffe4e9 55%,#ffd6de 100%)",
    dark: false,
  },
  {
    id: "sage-light",
    name: "Sage",
    bg: "linear-gradient(145deg,#f0fdf4 0%,#dcfce7 55%,#bbf7d0 100%)",
    dark: false,
  },
  {
    id: "snow",
    name: "Snow",
    bg: "linear-gradient(145deg,#ffffff 0%,#f9fafb 55%,#f1f3f6 100%)",
    dark: false,
  },
  {
    id: "ivory",
    name: "Ivory",
    bg: "linear-gradient(145deg,#fffff4 0%,#fdfde6 55%,#fafad0 100%)",
    dark: false,
  },
  {
    id: "eggshell",
    name: "Eggshell",
    bg: "linear-gradient(145deg,#f5f0e8 0%,#ede4d2 55%,#e4d8c2 100%)",
    dark: false,
  },
  {
    id: "lilac-mist",
    name: "Lilac Mist",
    bg: "linear-gradient(145deg,#f8f0ff 0%,#f0e0ff 55%,#e8ccff 100%)",
    dark: false,
  },
  {
    id: "peach-mist",
    name: "Peach Mist",
    bg: "linear-gradient(145deg,#fff5f0 0%,#feecd6 55%,#fde0c0 100%)",
    dark: false,
  },
  // ── Rich & Deep ──
  {
    id: "ocean",
    name: "Ocean",
    bg: "linear-gradient(145deg,#0c1f3f 0%,#0e3460 55%,#124a80 100%)",
    dark: true,
  },
  {
    id: "forest",
    name: "Forest",
    bg: "linear-gradient(145deg,#052e16 0%,#14532d 55%,#166534 100%)",
    dark: true,
  },
  {
    id: "cherry",
    name: "Cherry",
    bg: "linear-gradient(145deg,#3b0012 0%,#5c0020 55%,#7f0030 100%)",
    dark: true,
  },
  {
    id: "cobalt",
    name: "Cobalt",
    bg: "linear-gradient(145deg,#0a1628 0%,#172554 55%,#1e3a8a 100%)",
    dark: true,
  },
  {
    id: "jade",
    name: "Jade",
    bg: "linear-gradient(145deg,#042f2e 0%,#134e4a 55%,#115e59 100%)",
    dark: true,
  },
  {
    id: "amber-dark",
    name: "Amber",
    bg: "linear-gradient(145deg,#1c1200 0%,#2d1d00 55%,#3d2800 100%)",
    dark: true,
  },
  {
    id: "plum",
    name: "Plum",
    bg: "linear-gradient(145deg,#2e1065 0%,#4a1d96 55%,#5b21b6 100%)",
    dark: true,
  },
  {
    id: "crimson",
    name: "Crimson",
    bg: "linear-gradient(145deg,#450a0a 0%,#7f1d1d 55%,#991b1b 100%)",
    dark: true,
  },
  {
    id: "denim",
    name: "Denim",
    bg: "linear-gradient(145deg,#1d2438 0%,#2d3655 55%,#374469 100%)",
    dark: true,
  },
  {
    id: "copper-bg",
    name: "Copper",
    bg: "linear-gradient(145deg,#1c0f08 0%,#2d1a0e 55%,#40251a 100%)",
    dark: true,
  },
  {
    id: "burgundy",
    name: "Burgundy",
    bg: "linear-gradient(145deg,#2d0a1f 0%,#4a1030 55%,#6b1840 100%)",
    dark: true,
  },
  {
    id: "pine",
    name: "Pine",
    bg: "linear-gradient(145deg,#0c2b16 0%,#1a4a2a 55%,#1e5c34 100%)",
    dark: true,
  },
  {
    id: "aubergine",
    name: "Aubergine",
    bg: "linear-gradient(145deg,#1e0a2a 0%,#32104a 55%,#4a1870 100%)",
    dark: true,
  },
  {
    id: "mahogany",
    name: "Mahogany",
    bg: "linear-gradient(145deg,#2a0e08 0%,#401812 55%,#5a2820 100%)",
    dark: true,
  },
  {
    id: "steel-dark",
    name: "Steel",
    bg: "linear-gradient(145deg,#0c1f38 0%,#162d50 55%,#203e6a 100%)",
    dark: true,
  },
  // ── Gradient Moods ──
  {
    id: "aurora",
    name: "Aurora",
    bg: "linear-gradient(145deg,#022c22 0%,#064e3b 35%,#065f46 65%,#0a4a5e 100%)",
    dark: true,
  },
  {
    id: "sunset",
    name: "Sunset",
    bg: "linear-gradient(145deg,#3b1a2c 0%,#7f1d41 35%,#c2410c 70%,#d97706 100%)",
    dark: true,
  },
  {
    id: "twilight",
    name: "Twilight",
    bg: "linear-gradient(145deg,#1e1b4b 0%,#3730a3 40%,#6d28d9 70%,#be185d 100%)",
    dark: true,
  },
  {
    id: "deepspace",
    name: "Deep Space",
    bg: "linear-gradient(145deg,#010409 0%,#030d1a 35%,#0a1628 65%,#0c0f2e 100%)",
    dark: true,
  },
  {
    id: "summer",
    name: "Summer",
    bg: "linear-gradient(145deg,#fffde0 0%,#fef9c3 40%,#fde68a 70%,#fbbf24 100%)",
    dark: false,
  },
  {
    id: "arctic",
    name: "Arctic",
    bg: "linear-gradient(145deg,#ecfeff 0%,#cffafe 40%,#a5f3fc 70%,#67e8f9 100%)",
    dark: false,
  },
  {
    id: "jungle",
    name: "Jungle",
    bg: "linear-gradient(145deg,#052e16 0%,#064e3b 40%,#065f46 70%,#047857 100%)",
    dark: true,
  },
  {
    id: "lagoon",
    name: "Lagoon",
    bg: "linear-gradient(145deg,#0c4a6e 0%,#0369a1 40%,#0284c7 70%,#38bdf8 100%)",
    dark: true,
  },
  {
    id: "fire",
    name: "Fire",
    bg: "linear-gradient(145deg,#450a0a 0%,#7f1d1d 30%,#b91c1c 60%,#ef4444 90%,#fbbf24 100%)",
    dark: true,
  },
  {
    id: "violet-storm",
    name: "V. Storm",
    bg: "linear-gradient(145deg,#1e1b4b 0%,#312e81 40%,#4338ca 70%,#6366f1 100%)",
    dark: true,
  },
  {
    id: "ember",
    name: "Ember",
    bg: "linear-gradient(145deg,#1c0800 0%,#43100a 40%,#7c2d12 70%,#c2410c 100%)",
    dark: true,
  },
  {
    id: "northern-lights",
    name: "N. Lights",
    bg: "linear-gradient(145deg,#0a1f0a 0%,#063a2c 35%,#0a4a5e 65%,#1e1b4b 100%)",
    dark: true,
  },
  {
    id: "galaxy",
    name: "Galaxy",
    bg: "linear-gradient(145deg,#03001e 0%,#1a0533 35%,#0d0533 65%,#030014 100%)",
    dark: true,
  },
  {
    id: "bloom",
    name: "Bloom",
    bg: "linear-gradient(145deg,#fdf2f8 0%,#fce7f3 40%,#fbcfe8 70%,#f9a8d4 100%)",
    dark: false,
  },
  {
    id: "citrus",
    name: "Citrus",
    bg: "linear-gradient(145deg,#fefce8 0%,#fef9c3 40%,#fef08a 70%,#fdba74 100%)",
    dark: false,
  },
  {
    id: "rose-gold",
    name: "Rose Gold",
    bg: "linear-gradient(145deg,#fff1f1 0%,#ffe0e6 40%,#ffd0db 70%,#ffc0cc 100%)",
    dark: false,
  },
  {
    id: "forest-floor",
    name: "Forest Floor",
    bg: "linear-gradient(145deg,#1c2518 0%,#243320 55%,#2d4028 100%)",
    dark: true,
  },
  {
    id: "prism",
    name: "Prism",
    bg: "linear-gradient(145deg,#0f0030 0%,#220058 30%,#3c0070 65%,#180050 100%)",
    dark: true,
  },
  {
    id: "vapor",
    name: "Vapor",
    bg: "linear-gradient(145deg,#18002c 0%,#2a0055 35%,#4a0888 65%,#1a0840 100%)",
    dark: true,
  },
  {
    id: "mango-glow",
    name: "Mango",
    bg: "linear-gradient(145deg,#fffbe8 0%,#fff3c4 40%,#ffd870 70%,#ffb020 100%)",
    dark: false,
  },
  {
    id: "midnight-ocean",
    name: "M. Ocean",
    bg: "linear-gradient(145deg,#000528 0%,#001a55 35%,#004e92 70%,#000428 100%)",
    dark: true,
  },
  {
    id: "magma",
    name: "Magma",
    bg: "linear-gradient(145deg,#1a0000 0%,#3d0000 35%,#7a1500 65%,#c45000 100%)",
    dark: true,
  },
  {
    id: "royal-purple",
    name: "Royal",
    bg: "linear-gradient(145deg,#0a0030 0%,#160055 40%,#2200a0 70%,#3000c8 100%)",
    dark: true,
  },
  {
    id: "deep-teal",
    name: "Deep Teal",
    bg: "linear-gradient(145deg,#002028 0%,#004050 35%,#006070 65%,#008090 100%)",
    dark: true,
  },
  {
    id: "spring",
    name: "Spring",
    bg: "linear-gradient(145deg,#f0ffe8 0%,#d4f7b8 40%,#a8ef80 70%,#7be048 100%)",
    dark: false,
  },
  {
    id: "arctic-dawn",
    name: "Arctic Dawn",
    bg: "linear-gradient(145deg,#c8f0ff 0%,#92d8f8 40%,#58b8e8 70%,#2898d8 100%)",
    dark: false,
  },
  {
    id: "amethyst",
    name: "Amethyst",
    bg: "linear-gradient(145deg,#160030 0%,#2c0055 35%,#3e0070 65%,#4a0088 100%)",
    dark: true,
  },
  {
    id: "deep-rose",
    name: "Deep Rose",
    bg: "linear-gradient(145deg,#1e0016 0%,#3a0030 35%,#5a0050 65%,#780060 100%)",
    dark: true,
  },
  {
    id: "peach-glow",
    name: "Peach Glow",
    bg: "linear-gradient(145deg,#fff0e8 0%,#ffe0c8 40%,#ffc8a0 70%,#ffb080 100%)",
    dark: false,
  },
  {
    id: "forest-night",
    name: "Forest Night",
    bg: "linear-gradient(145deg,#051a10 0%,#0a2e1c 40%,#0f3c26 70%,#134c30 100%)",
    dark: true,
  },
  // ── Cloud Classics ──
  {
    id: "storm",
    name: "Storm",
    bg: "linear-gradient(145deg,#0f1729 0%,#1a3356 55%,#243b55 100%)",
    dark: true,
  },
  {
    id: "nimbus",
    name: "Nimbus",
    bg: "linear-gradient(145deg,#0c1445 0%,#1a237e 55%,#283593 100%)",
    dark: true,
  },
  {
    id: "electric",
    name: "Electric",
    bg: "linear-gradient(145deg,#fffbeb 0%,#fef3c7 50%,#fefce8 100%)",
    dark: false,
  },
  {
    id: "thunder",
    name: "Thunder",
    bg: "linear-gradient(145deg,#18181b 0%,#27272a 55%,#3f3f46 100%)",
    dark: true,
  },
  {
    id: "cirrus",
    name: "Cirrus",
    bg: "linear-gradient(145deg,#e0f2fe 0%,#bae6fd 50%,#e0f2fe 100%)",
    dark: false,
  },
  {
    id: "dusk",
    name: "Dusk",
    bg: "linear-gradient(145deg,#1a1a2e 0%,#16213e 55%,#0f3460 100%)",
    dark: true,
  },
  {
    id: "overcast",
    name: "Overcast",
    bg: "linear-gradient(145deg,#9ca3af 0%,#d1d5db 55%,#e5e7eb 100%)",
    dark: false,
  },
  {
    id: "haze",
    name: "Haze",
    bg: "linear-gradient(145deg,#c0c9d8 0%,#d8e0ea 55%,#eaeef4 100%)",
    dark: false,
  },
  {
    id: "squall",
    name: "Squall",
    bg: "linear-gradient(145deg,#1c2440 0%,#2a3458 55%,#3a4670 100%)",
    dark: true,
  },
  {
    id: "altitude",
    name: "Altitude",
    bg: "linear-gradient(145deg,#f0f6ff 0%,#e0eeff 55%,#cce0ff 100%)",
    dark: false,
  },
  // ── Vintage & Warm ──
  {
    id: "sepia",
    name: "Sepia",
    bg: "linear-gradient(145deg,#2a1e0a 0%,#3d2c14 55%,#4e3920 100%)",
    dark: true,
  },
  {
    id: "warm-stone",
    name: "Warm Stone",
    bg: "linear-gradient(145deg,#f5ede0 0%,#ecdbc4 55%,#e0c9a8 100%)",
    dark: false,
  },
  {
    id: "terracotta-bg",
    name: "Terracotta",
    bg: "linear-gradient(145deg,#1c0e08 0%,#341610 55%,#4a1e16 100%)",
    dark: true,
  },
  {
    id: "parchment",
    name: "Parchment",
    bg: "linear-gradient(145deg,#faf5e4 0%,#f5edd0 55%,#eee3bc 100%)",
    dark: false,
  },
  {
    id: "antique",
    name: "Antique",
    bg: "linear-gradient(145deg,#f0e8d0 0%,#e8dac0 55%,#dccaaa 100%)",
    dark: false,
  },
  {
    id: "washed-denim",
    name: "Washed Denim",
    bg: "linear-gradient(145deg,#c8d8e8 0%,#b8c8d8 55%,#a8b8c8 100%)",
    dark: false,
  },
  {
    id: "dusty-rose",
    name: "Dusty Rose",
    bg: "linear-gradient(145deg,#f0dcd8 0%,#e8cac6 55%,#ddb8b4 100%)",
    dark: false,
  },
  {
    id: "harvest",
    name: "Harvest",
    bg: "linear-gradient(145deg,#1e1000 0%,#342000 55%,#4a3000 100%)",
    dark: true,
  },
  {
    id: "cedar",
    name: "Cedar",
    bg: "linear-gradient(145deg,#1a0e08 0%,#2e1a10 55%,#3e2618 100%)",
    dark: true,
  },
  {
    id: "tobacco",
    name: "Tobacco",
    bg: "linear-gradient(145deg,#241408 0%,#382210 55%,#4a3018 100%)",
    dark: true,
  },
  {
    id: "wheat",
    name: "Wheat",
    bg: "linear-gradient(145deg,#fef8ec 0%,#faf0d4 55%,#f5e6bc 100%)",
    dark: false,
  },
  {
    id: "clay",
    name: "Clay",
    bg: "linear-gradient(145deg,#1e1208 0%,#32200e 55%,#442e14 100%)",
    dark: true,
  },
  {
    id: "bourbon",
    name: "Bourbon",
    bg: "linear-gradient(145deg,#1c0e00 0%,#301800 55%,#402400 100%)",
    dark: true,
  },
  {
    id: "sand-dune",
    name: "Sand Dune",
    bg: "linear-gradient(145deg,#f0e8d0 0%,#e8d8b8 55%,#dcc89e 100%)",
    dark: false,
  },
  {
    id: "amber-cream",
    name: "Amber Cream",
    bg: "linear-gradient(145deg,#fffaee 0%,#fef5d8 55%,#fce8b8 100%)",
    dark: false,
  },
];

// ─── Accent Colors (50+) — the highlight color on the card ──────────────────
const CARD_ACCENT_COLORS = [
  // Blues
  { id: "sky", name: "Sky", hex: "#38BDF8" },
  { id: "blue", name: "Blue", hex: "#3B82F6" },
  { id: "cobalt-ac", name: "Cobalt", hex: "#2563EB" },
  { id: "sapphire", name: "Sapphire", hex: "#1D4ED8" },
  { id: "navy", name: "Navy", hex: "#1E40AF" },
  { id: "ice", name: "Ice", hex: "#BAE6FD" },
  { id: "periwinkle", name: "Periwinkle", hex: "#818CF8" },
  { id: "cerulean", name: "Cerulean", hex: "#06B6D4" },
  { id: "steel", name: "Steel", hex: "#7B9FD4" },
  { id: "powder", name: "Powder", hex: "#93C5FD" },
  { id: "azure", name: "Azure", hex: "#0EA5E9" },
  { id: "denim-ac", name: "Denim", hex: "#3B5E9E" },
  { id: "ocean-ac", name: "Ocean", hex: "#0369A1" },
  { id: "cobalt-light", name: "Cobalt Lt", hex: "#60A5FA" },
  { id: "powder-deep", name: "Powder Deep", hex: "#7DD3FC" },
  // Purples
  { id: "violet", name: "Violet", hex: "#7C3AED" },
  { id: "purple", name: "Purple", hex: "#9333EA" },
  { id: "lavender", name: "Lavender", hex: "#A78BFA" },
  { id: "indigo", name: "Indigo", hex: "#6366F1" },
  { id: "grape", name: "Grape", hex: "#6D28D9" },
  { id: "mauve", name: "Mauve", hex: "#C084FC" },
  { id: "lilac", name: "Lilac", hex: "#DDD6FE" },
  { id: "heather", name: "Heather", hex: "#8B5CF6" },
  { id: "amethyst-ac", name: "Amethyst", hex: "#7C2D92" },
  { id: "byzantium", name: "Byzantium", hex: "#5C2D91" },
  { id: "wisteria", name: "Wisteria", hex: "#BFA2DB" },
  { id: "aubergine-ac", name: "Aubergine", hex: "#4B0082" },
  { id: "orchid-ac", name: "Orchid", hex: "#DA70D6" },
  // Pinks & Reds
  { id: "hot-pink", name: "Hot Pink", hex: "#EC4899" },
  { id: "rose-ac", name: "Rose", hex: "#F43F5E" },
  { id: "crimson-ac", name: "Crimson", hex: "#DC2626" },
  { id: "coral", name: "Coral", hex: "#FB7185" },
  { id: "blush-ac", name: "Blush", hex: "#FDA4AF" },
  { id: "magenta", name: "Magenta", hex: "#D946EF" },
  { id: "scarlet", name: "Scarlet", hex: "#EF4444" },
  { id: "flamingo", name: "Flamingo", hex: "#FF6B9D" },
  { id: "salmon", name: "Salmon", hex: "#FA8072" },
  { id: "ruby", name: "Ruby", hex: "#BE123C" },
  { id: "candy", name: "Candy", hex: "#FF69B4" },
  { id: "cherry-ac", name: "Cherry", hex: "#C0392B" },
  { id: "bubblegum", name: "Bubblegum", hex: "#FF85C0" },
  { id: "cerise", name: "Cerise", hex: "#DE3163" },
  { id: "carnation", name: "Carnation", hex: "#FFA0B4" },
  // Oranges & Yellows
  { id: "amber", name: "Amber", hex: "#FBBF24" },
  { id: "gold", name: "Gold", hex: "#F59E0B" },
  { id: "tangerine", name: "Tangerine", hex: "#F97316" },
  { id: "peach", name: "Peach", hex: "#FED7AA" },
  { id: "copper-ac", name: "Copper", hex: "#B45309" },
  { id: "honey", name: "Honey", hex: "#FDE68A" },
  { id: "sunshine", name: "Sunshine", hex: "#EAB308" },
  { id: "butter", name: "Butter", hex: "#FEF08A" },
  { id: "saffron", name: "Saffron", hex: "#CA8A04" },
  { id: "apricot", name: "Apricot", hex: "#FFAD60" },
  { id: "mustard", name: "Mustard", hex: "#D4A017" },
  { id: "burnt-orange", name: "Burnt Org", hex: "#CC5500" },
  { id: "lemon", name: "Lemon", hex: "#FFF44F" },
  { id: "goldenrod", name: "Goldenrod", hex: "#DAA520" },
  // Greens
  { id: "emerald", name: "Emerald", hex: "#10B981" },
  { id: "mint", name: "Mint", hex: "#6EE7B7" },
  { id: "jade-ac", name: "Jade", hex: "#059669" },
  { id: "sage-ac", name: "Sage", hex: "#84CC16" },
  { id: "lime", name: "Lime", hex: "#A3E635" },
  { id: "teal", name: "Teal", hex: "#14B8A6" },
  { id: "seafoam", name: "Seafoam", hex: "#5EEAD4" },
  { id: "moss", name: "Moss", hex: "#4D7C0F" },
  { id: "forest-ac", name: "Forest", hex: "#166534" },
  { id: "olive", name: "Olive", hex: "#65A30D" },
  { id: "lime-green", name: "Lime Grn", hex: "#32CD32" },
  { id: "pine-green", name: "Pine", hex: "#01796F" },
  { id: "viridian", name: "Viridian", hex: "#40826D" },
  { id: "sage-green", name: "Sage Grn", hex: "#8FBC8F" },
  { id: "hunter", name: "Hunter", hex: "#355E3B" },
  // Warm Tones
  { id: "terracotta", name: "Terracotta", hex: "#CC4E2A" },
  { id: "brick", name: "Brick", hex: "#B5451B" },
  { id: "rust", name: "Rust", hex: "#B7410E" },
  { id: "bronze", name: "Bronze", hex: "#CD7F32" },
  { id: "hazel", name: "Hazel", hex: "#8E7455" },
  { id: "maple", name: "Maple", hex: "#D4723A" },
  { id: "cinnamon", name: "Cinnamon", hex: "#D2691E" },
  // Cool Tones
  { id: "slate-blue-ac", name: "Slate Blue", hex: "#6A7FDB" },
  { id: "arctic-ac", name: "Arctic", hex: "#B2E0F0" },
  { id: "powder-blue", name: "Powder Blue", hex: "#B0D8E8" },
  { id: "muted-teal", name: "Muted Teal", hex: "#5F9EA0" },
  { id: "seafoam-deep", name: "Seafoam Dp", hex: "#3CB371" },
  { id: "mint-fresh", name: "Mint Fresh", hex: "#98FF98" },
  { id: "glacier", name: "Glacier", hex: "#72A0C1" },
  // Neutrals & Metallics
  { id: "white", name: "White", hex: "#FFFFFF" },
  { id: "silver", name: "Silver", hex: "#CBD5E1" },
  { id: "platinum", name: "Platinum", hex: "#E2E8F0" },
  { id: "champagne", name: "Champagne", hex: "#FAF0E6" },
  { id: "sand", name: "Sand", hex: "#D4B896" },
  { id: "slate-ac", name: "Slate", hex: "#94A3B8" },
  { id: "warm-white", name: "Warm White", hex: "#FFF8F0" },
  { id: "oyster", name: "Oyster", hex: "#EDE0D4" },
  { id: "stone", name: "Stone", hex: "#C2B280" },
  { id: "pewter", name: "Pewter", hex: "#96A0A8" },
  { id: "graphite-ac", name: "Graphite", hex: "#707880" },
  // Metallics
  { id: "gold-foil", name: "Gold Foil", hex: "#FFD700" },
  { id: "rose-gold-ac", name: "Rose Gold", hex: "#E8A09A" },
  { id: "neon-cyan", name: "Neon Cyan", hex: "#00FFFF" },
];

// ─── Legacy CARD_THEMES (kept for backward compat) ──────────────────────────
const CARD_THEMES = CARD_BG_STYLES.map((s) => {
  const isDark = s.dark;
  return {
    id: s.id,
    name: s.name,
    bg: s.bg,
    accent: "#FFCF33",
    text: isDark ? "#fff" : "#1e293b",
    textSoft: isDark ? "rgba(255,255,255,0.6)" : "rgba(30,41,59,0.58)",
    border: isDark ? "rgba(232,184,75,0.25)" : "rgba(205,154,22,0.20)",
    pattern: "lightning",
    color: isDark ? "#FFCF33" : "#E0A800",
  };
});

const CARD_PATTERNS = {
  none: ``,
  lines: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.75">${Array.from(
    { length: 76 },
    (_, i) => {
      const o = i * 8 - 220;
      return `<line x1="${o}" y1="0" x2="${o + 310}" y2="250"/>`;
    },
  ).join("")}</g></svg>`,
  mesh: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.5">${Array.from(
    { length: 76 },
    (_, i) => {
      const o = i * 8 - 220;
      return `<line x1="${o}" y1="0" x2="${o + 310}" y2="250"/>`;
    },
  ).join("")}${Array.from({ length: 76 }, (_, i) => {
    const o = i * 8 - 220;
    return `<line x1="${400 - o}" y1="0" x2="${90 - o}" y2="250"/>`;
  }).join("")}</g></svg>`,
  halftone: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor">${Array.from(
    { length: 352 },
    (_, i) => {
      const col = i % 22,
        row = Math.floor(i / 22),
        x = col * 19 + (row % 2 ? 9.5 : 0) + 4,
        y = row * 14 + 7;
      return `<circle cx="${x}" cy="${y}" r="2.2"/>`;
    },
  ).join("")}</g></svg>`,
  hexgrid: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.1" fill="none">${(() => {
    const R = 22,
      rows = 9,
      cols = 13,
      out = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cx = c * R * 1.732 + (r % 2 ? R * 0.866 : 0),
          cy = r * R * 1.5 + R;
        out.push(
          `<polygon points="${[0, 1, 2, 3, 4, 5]
            .map((k) => {
              const a = ((k * 60 + 30) * Math.PI) / 180;
              return `${(cx + R * Math.cos(a)).toFixed(1)},${(cy + R * Math.sin(a)).toFixed(1)}`;
            })
            .join(" ")}"/>`,
        );
      }
    }
    return out.join("");
  })()}</g></svg>`,
  topo: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="1.1"><path d="M-20,28 C52,6 118,54 198,26 C278,2 348,48 430,20"/><path d="M-20,56 C48,33 115,82 195,54 C275,26 345,74 430,48"/><path d="M-20,86 C58,62 122,112 202,82 C282,54 352,102 430,77"/><path d="M-20,116 C55,90 128,140 208,110 C288,80 355,130 430,106"/><path d="M-20,146 C62,120 130,170 210,140 C290,110 358,160 430,135"/><path d="M-20,176 C66,150 135,200 215,170 C295,140 362,188 430,164"/><path d="M-20,206 C60,180 132,228 212,198 C292,168 360,216 430,192"/><path d="M-20,236 C58,210 130,256 210,228 C290,198 358,244 430,220"/></g></svg>`,
  constellation: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg">${(() => {
    const p = [
        { x: 25, y: 28 },
        { x: 88, y: 15 },
        { x: 154, y: 44 },
        { x: 210, y: 20 },
        { x: 272, y: 38 },
        { x: 332, y: 14 },
        { x: 386, y: 52 },
        { x: 50, y: 92 },
        { x: 118, y: 116 },
        { x: 182, y: 80 },
        { x: 244, y: 106 },
        { x: 305, y: 72 },
        { x: 368, y: 98 },
        { x: 28, y: 162 },
        { x: 84, y: 188 },
        { x: 148, y: 153 },
        { x: 216, y: 180 },
        { x: 276, y: 146 },
        { x: 344, y: 172 },
        { x: 396, y: 145 },
        { x: 60, y: 226 },
        { x: 128, y: 238 },
        { x: 198, y: 216 },
        { x: 268, y: 233 },
        { x: 338, y: 218 },
      ],
      e = [
        [0, 1],
        [1, 2],
        [2, 3],
        [3, 4],
        [4, 5],
        [5, 6],
        [0, 7],
        [1, 8],
        [2, 9],
        [3, 9],
        [4, 10],
        [5, 11],
        [6, 12],
        [7, 8],
        [8, 9],
        [9, 10],
        [10, 11],
        [11, 12],
        [7, 13],
        [8, 14],
        [9, 15],
        [10, 16],
        [11, 17],
        [12, 18],
        [13, 14],
        [14, 15],
        [15, 16],
        [16, 17],
        [17, 18],
        [13, 20],
        [14, 21],
        [15, 22],
        [16, 22],
        [17, 23],
        [18, 24],
        [20, 21],
        [21, 22],
        [22, 23],
        [23, 24],
      ];
    return `<g stroke="currentColor" stroke-width="0.6" opacity="0.5">${e.map(([a, b]) => `<line x1="${p[a].x}" y1="${p[a].y}" x2="${p[b].x}" y2="${p[b].y}"/>`).join("")}</g><g fill="currentColor">${p.map((pt, i) => `<circle cx="${pt.x}" cy="${pt.y}" r="${1.6 + Math.sin(i * 1.7) * 0.6}"/>`).join("")}</g>`;
  })()}</svg>`,
  blueprint: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" fill="none">${Array.from({ length: 21 }, (_, i) => `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="250" stroke-width="${i % 5 === 0 ? 1.1 : 0.28}"/>`).join("")}${Array.from({ length: 13 }, (_, i) => `<line x1="0" y1="${i * 20}" x2="400" y2="${i * 20}" stroke-width="${i % 5 === 0 ? 1.1 : 0.28}"/>`).join("")}</g></svg>`,
  waves: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-width="1.3">${Array.from(
    { length: 16 },
    (_, i) => {
      const y = i * 18 - 12;
      return `<path d="M-30,${y} C70,${y - 19} 170,${y + 19} 270,${y} C370,${y - 19} 430,${y + 19} 500,${y}"/>`;
    },
  ).join("")}</g></svg>`,
  marble: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="none" stroke="currentColor" stroke-linecap="round"><path d="M-15,42 C56,16 112,90 196,46 C280,6 326,84 430,36" stroke-width="2.8"/><path d="M-15,42 C56,16 112,90 196,46 C280,6 326,84 430,36" stroke-width="0.7" opacity="0.38" transform="translate(3,5)"/><path d="M-15,148 C64,118 126,190 212,150 C298,110 346,178 430,140" stroke-width="2.3"/><path d="M-15,148 C64,118 126,190 212,150 C298,110 346,178 430,140" stroke-width="0.6" opacity="0.32" transform="translate(-2,5)"/><path d="M62,-15 C96,52 46,118 132,170 C218,222 228,106 298,180 C368,254 352,136 430,190" stroke-width="1.9"/><path d="M272,-15 C300,40 336,90 358,152 C380,214 370,112 430,166" stroke-width="1.5" opacity="0.72"/><path d="M-15,215 C78,192 148,240 228,212 C308,184 372,228 430,208" stroke-width="1.4" opacity="0.6"/></g></svg>`,
  sparkle: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor">${(() => {
    const s = [
      [26, 22, 3.4],
      [86, 14, 2.7],
      [156, 40, 4],
      [212, 18, 3.1],
      [274, 34, 4.4],
      [336, 12, 3],
      [388, 50, 2.4],
      [16, 78, 2.1],
      [70, 104, 3.7],
      [136, 70, 2.7],
      [196, 90, 4.1],
      [256, 74, 2.9],
      [326, 94, 2.4],
      [374, 120, 3.4],
      [44, 140, 3.9],
      [110, 160, 2.7],
      [172, 134, 3.4],
      [238, 154, 4.4],
      [306, 140, 2.7],
      [360, 164, 3.1],
      [390, 140, 2],
      [16, 197, 2.9],
      [76, 214, 3.9],
      [146, 190, 3.1],
      [216, 210, 2.7],
      [280, 196, 3.9],
      [346, 218, 3.4],
      [393, 202, 2.4],
    ];
    return s
      .map(
        ([x, y, r]) =>
          `<path d="M${x},${y - r * 2.1} L${x + r * 0.44},${y - r * 0.44} L${x + r * 2.1},${y} L${x + r * 0.44},${y + r * 0.44} L${x},${y + r * 2.1} L${x - r * 0.44},${y + r * 0.44} L${x - r * 2.1},${y} L${x - r * 0.44},${y - r * 0.44}Z"/>`,
      )
      .join("");
  })()}</g></svg>`,
  circuits: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.2" stroke-linecap="round" fill="currentColor"><line x1="0" y1="40" x2="76" y2="40"/><line x1="76" y1="40" x2="76" y2="16"/><line x1="76" y1="16" x2="156" y2="16"/><circle cx="76" cy="40" r="3.5" fill="none" stroke-width="1.7"/><circle cx="156" cy="16" r="3.5"/><line x1="156" y1="16" x2="216" y2="16"/><line x1="216" y1="16" x2="216" y2="76"/><line x1="216" y1="76" x2="306" y2="76"/><circle cx="216" cy="76" r="3.5" fill="none" stroke-width="1.7"/><line x1="306" y1="76" x2="306" y2="36"/><line x1="306" y1="36" x2="400" y2="36"/><circle cx="306" cy="36" r="3.5"/><line x1="0" y1="130" x2="46" y2="130"/><line x1="46" y1="130" x2="46" y2="96"/><circle cx="46" cy="96" r="3.5" fill="none" stroke-width="1.7"/><line x1="46" y1="96" x2="126" y2="96"/><line x1="126" y1="96" x2="126" y2="156"/><line x1="126" y1="156" x2="196" y2="156"/><circle cx="126" cy="156" r="3.5"/><line x1="196" y1="156" x2="196" y2="116"/><line x1="196" y1="116" x2="276" y2="116"/><circle cx="196" cy="116" r="3.5" fill="none" stroke-width="1.7"/><line x1="276" y1="116" x2="276" y2="166"/><line x1="276" y1="166" x2="366" y2="166"/><circle cx="276" cy="166" r="3.5"/><line x1="366" y1="166" x2="366" y2="126"/><line x1="366" y1="126" x2="400" y2="126"/><line x1="0" y1="216" x2="56" y2="216"/><line x1="56" y1="216" x2="56" y2="190"/><circle cx="56" cy="190" r="3.5" fill="none" stroke-width="1.7"/><line x1="56" y1="190" x2="146" y2="190"/><line x1="146" y1="190" x2="146" y2="230"/><line x1="146" y1="230" x2="236" y2="230"/><circle cx="146" cy="230" r="3.5"/><line x1="236" y1="230" x2="236" y2="196"/><line x1="236" y1="196" x2="316" y2="196"/><circle cx="236" cy="196" r="3.5" fill="none" stroke-width="1.7"/><line x1="316" y1="196" x2="316" y2="238"/><line x1="316" y1="238" x2="400" y2="238"/></g></svg>`,
  plus: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.5" stroke-linecap="round">${Array.from(
    { length: 176 },
    (_, i) => {
      const col = i % 16,
        row = Math.floor(i / 16),
        x = col * 26 + 13,
        y = row * 26 + 13;
      return `<line x1="${x - 7}" y1="${y}" x2="${x + 7}" y2="${y}"/><line x1="${x}" y1="${y - 7}" x2="${x}" y2="${y + 7}"/>`;
    },
  ).join("")}</g></svg>`,
  rings: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1" fill="none">${Array.from({ length: 13 }, (_, i) => `<ellipse cx="200" cy="125" rx="${(i + 1) * 30}" ry="${(i + 1) * 19}"/>`).join("")}</g></svg>`,
  sunburst: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.9" fill="none">${Array.from(
    { length: 44 },
    (_, i) => {
      const a = (i / 44) * Math.PI * 0.92 - Math.PI * 0.02;
      return `<line x1="0" y1="250" x2="${(Math.cos(a) * 620).toFixed(1)}" y2="${(250 + Math.sin(a) * 620).toFixed(1)}"/>`;
    },
  ).join("")}</g></svg>`,
  linen: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" fill="none">${Array.from({ length: 51 }, (_, i) => `<line x1="${i * 8}" y1="0" x2="${i * 8}" y2="250" stroke-width="${i % 2 === 0 ? 0.9 : 0.32}"/>`).join("")}${Array.from({ length: 32 }, (_, i) => `<line x1="0" y1="${i * 8}" x2="400" y2="${i * 8}" stroke-width="${i % 2 === 0 ? 0.32 : 0.9}"/>`).join("")}</g></svg>`,
  dots: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g fill="currentColor">${Array.from(
    { length: 260 },
    (_, i) => {
      const col = i % 20,
        row = Math.floor(i / 20),
        x = col * 21 + 10,
        y = row * 21 + 10;
      return `<circle cx="${x}" cy="${y}" r="1.6"/>`;
    },
  ).join("")}</g></svg>`,
  diagonal: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.75">${Array.from(
    { length: 76 },
    (_, i) => {
      const o = i * 8 - 220;
      return `<line x1="${400 - o}" y1="0" x2="${90 - o}" y2="250"/>`;
    },
  ).join("")}</g></svg>`,
  zigzag: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.2" fill="none">${Array.from(
    { length: 14 },
    (_, i) => {
      const y = i * 20;
      const pts = Array.from(
        { length: 28 },
        (_, j) => `${j * 16},${y + (j % 2 === 0 ? 0 : 10)}`,
      ).join(" ");
      return `<polyline points="${pts}"/>`;
    },
  ).join("")}</g></svg>`,
  grid: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.5" fill="none">${Array.from({ length: 21 }, (_, i) => `<line x1="${i * 20}" y1="0" x2="${i * 20}" y2="250"/>`).join("")}${Array.from({ length: 13 }, (_, i) => `<line x1="0" y1="${i * 21}" x2="400" y2="${i * 21}"/>`).join("")}</g></svg>`,
  triangles: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.8" fill="none">${(() => {
    const W = 32,
      H = 28,
      out = [];
    for (let r = 0; r < 12; r++) {
      for (let c = 0; c < 16; c++) {
        const x = c * W + (r % 2 ? W / 2 : 0),
          y = r * H;
        out.push(
          `<polygon points="${x},${y + H} ${x + W / 2},${y} ${x + W},${y + H}"/>`,
        );
      }
    }
    return out.join("");
  })()}</g></svg>`,
  dashes: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="1.1" stroke-linecap="round">${Array.from(
    { length: 200 },
    (_, i) => {
      const col = i % 20,
        row = Math.floor(i / 20),
        x = col * 22 + (row % 2 ? 11 : 0),
        y = row * 14 + 7;
      return `<line x1="${x}" y1="${y}" x2="${x + 10}" y2="${y}"/>`;
    },
  ).join("")}</g></svg>`,
  petals: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.9" fill="none">${(() => {
    const out = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 14; c++) {
        const x = c * 30 + (r % 2 ? 15 : 0),
          y = r * 32;
        out.push(
          `<ellipse cx="${x}" cy="${y}" rx="8" ry="14" transform="rotate(0 ${x} ${y})"/>`,
        );
        out.push(
          `<ellipse cx="${x}" cy="${y}" rx="8" ry="14" transform="rotate(60 ${x} ${y})"/>`,
        );
        out.push(
          `<ellipse cx="${x}" cy="${y}" rx="8" ry="14" transform="rotate(120 ${x} ${y})"/>`,
        );
      }
    }
    return out.join("");
  })()}</g></svg>`,
  cobweb: `<svg class="card-pattern-svg" viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><g stroke="currentColor" stroke-width="0.7" fill="none">${Array.from(
    { length: 12 },
    (_, i) => {
      const a = i * ((Math.PI * 2) / 12),
        x2 = (200 + Math.cos(a) * 280).toFixed(1),
        y2 = (125 + Math.sin(a) * 200).toFixed(1);
      return `<line x1="200" y1="125" x2="${x2}" y2="${y2}"/>`;
    },
  ).join(
    "",
  )}${[40, 80, 120, 160].map((r) => `<ellipse cx="200" cy="125" rx="${r * 1.4}" ry="${r}"/>`).join("")}</g></svg>`,
};

const LONDON_AREAS = [
  "Shoreditch",
  "Dalston",
  "Hackney",
  "Peckham",
  "Brixton",
  "Clapham",
  "Soho",
  "Fitzrovia",
  "Islington",
  "Bethnal Green",
  "Bermondsey",
  "Borough",
  "Vauxhall",
  "Battersea",
  "Chelsea",
  "Fulham",
  "Hammersmith",
  "Notting Hill",
  "Kensington",
  "Camden",
  "Kentish Town",
  "Holloway",
  "Crouch End",
  "Stoke Newington",
  "Wood Green",
  "Tottenham",
  "Stratford",
  "Bow",
  "Canary Wharf",
  "Greenwich",
  "Lewisham",
  "New Cross",
  "Crystal Palace",
  "Dulwich",
  "Herne Hill",
  "Tooting",
  "Wimbledon",
  "Richmond",
  "Kingston",
  "Putney",
  "Wandsworth",
  "Balham",
  "Elephant & Castle",
  "Southwark",
  "Wapping",
  "Mayfair",
  "Marylebone",
  "King's Cross",
  "Angel",
  "Farringdon",
  "Barbican",
  "Clerkenwell",
  "Whitechapel",
  "Bethnal Green",
  "Stepney",
  "Mile End",
  "Walthamstow",
  "Leyton",
];
const CATEGORY_KEYWORDS = {
  Gaming: ["gaming", "video game", "games", "esports", "arcade", "retro"],
  Creative: [
    "art",
    "painting",
    "drawing",
    "sketch",
    "pottery",
    "crafts",
    "ceramics",
  ],
  "Movie Nights": ["movies", "film", "cinema", "screening"],
  "Board Games": ["board games", "tabletop", "strategy", "puzzles", "catan"],
  Meetups: ["meetups", "social", "networking", "making friends"],
  "Food & Drink": [
    "food",
    "drink",
    "wine",
    "cocktails",
    "beer",
    "cooking",
    "tasting",
  ],
  "Live Music": [
    "live music",
    "gig",
    "concert",
    "open mic",
    "jazz",
    "acoustic",
  ],
  "Wellness & Outdoors": [
    "wellness",
    "yoga",
    "meditation",
    "outdoors",
    "fitness",
    "running",
    "mindfulness",
  ],
  "Tech & Talks": [
    "tech",
    "startup",
    "coding",
    "ai",
    "talks",
    "hackathon",
    "product",
  ],
};
const MILESTONE_BADGES = [
  {
    id: "m1",
    name: "First Step",
    glyph: "I",
    need: 1,
    desc: "RSVP to your first event",
    metal: "#C97B4A",
    tier: "Bronze",
  },
  {
    id: "m3",
    name: "Getting Around",
    glyph: "III",
    need: 3,
    desc: "RSVP to 3 events",
    metal: "#B7C2CC",
    tier: "Silver",
  },
  {
    id: "m5",
    name: "Local Regular",
    glyph: "V",
    need: 5,
    desc: "RSVP to 5 events",
    metal: "#F4C430",
    tier: "Gold",
  },
  {
    id: "m10",
    name: "Cloud Chaser",
    glyph: "X",
    need: 10,
    desc: "RSVP to 10 events",
    metal: "#9FE3F0",
    tier: "Platinum",
  },
];
const CATEGORY_BADGES = [
  {
    id: "cat-Creative",
    name: "Creative Soul",
    cat: "Creative",
    glyph: "✎",
    desc: "Attend a creative event",
  },
  {
    id: "cat-Gaming",
    name: "Player One",
    cat: "Gaming",
    glyph: "◉",
    desc: "Attend a gaming event",
  },
  {
    id: "cat-Movie Nights",
    name: "Cinephile",
    cat: "Movie Nights",
    glyph: "▷",
    desc: "Attend a movie night",
  },
  {
    id: "cat-Board Games",
    name: "Tactician",
    cat: "Board Games",
    glyph: "♟",
    desc: "Attend a board game night",
  },
  {
    id: "cat-Meetups",
    name: "Social Butterfly",
    cat: "Meetups",
    glyph: "❋",
    desc: "Attend a meetup",
  },
  {
    id: "cat-Food & Drink",
    name: "Taste Maker",
    cat: "Food & Drink",
    glyph: "❖",
    desc: "Attend a food & drink event",
  },
  {
    id: "cat-Live Music",
    name: "Music Lover",
    cat: "Live Music",
    glyph: "♪",
    desc: "Attend a live music event",
  },
  {
    id: "cat-Wellness & Outdoors",
    name: "Grounded",
    cat: "Wellness & Outdoors",
    glyph: "❀",
    desc: "Attend a wellness or outdoors event",
  },
  {
    id: "cat-Tech & Talks",
    name: "Builder",
    cat: "Tech & Talks",
    glyph: "⚙",
    desc: "Attend a tech & talks event",
  },
];
const ALLROUNDER_BADGE = {
  id: "allrounder",
  name: "All-Rounder",
  glyph: "✺",
  desc: "Attend one of every category",
  metal: "linear-gradient(135deg,#F4C430 0%, #9FE3F0 55%, #8C7FB0 100%)",
  glow: "#F4C430",
  tier: "Legendary",
};
const TOTAL_CATEGORIES = Object.keys(CATS).length;
const SPECIAL_BADGES = [
  {
    id: "sp-launch",
    name: "Launch Night",
    glyph: "★",
    code: "LAUNCH",
    desc: "Here from the very start",
  },
  {
    id: "sp-summer",
    name: "Summer Sessions",
    glyph: "★",
    code: "SUMMER26",
    desc: "Special community event",
  },
];

const LEVELS = [
  {
    min: 0,
    title: "Newcomer",
    color: "#476EB9",
    glow: "rgba(139,149,168,0.25)",
    ring: "1px solid #8B95A8",
  },
  {
    min: 1,
    title: "Explorer",
    color: "#9C6126",
    glow: "rgba(205,127,50,0.35)",
    ring: "1.5px solid #CD7F32",
  },
  {
    min: 3,
    title: "Regular",
    color: "#6E6E6E",
    glow: "rgba(192,192,192,0.35)",
    ring: "1.5px solid #C0C0C0",
  },
  {
    min: 6,
    title: "Enthusiast",
    color: "#7F6B00",
    glow: "rgba(255,215,0,0.4)",
    ring: "2px solid #FFD700",
  },
  {
    min: 10,
    title: "Community Pillar",
    color: "#16778A",
    glow: "rgba(159,227,240,0.45)",
    ring: "2px solid #9FE3F0",
  },
  {
    min: 15,
    title: "Legend",
    color: "#8E6703",
    glow: "rgba(251,191,36,0.55)",
    ring: "2.5px solid #FBBF24",
  },
];
function getLevel(n) {
  let lv = LEVELS[0];
  for (const l of LEVELS) {
    if (n >= l.min) lv = l;
    else break;
  }
  return lv;
}

const INTEREST_PRESETS = [
  "Live Music",
  "Food & Drink",
  "Board Games",
  "Gaming",
  "Film & Cinema",
  "Wellness",
  "Outdoors",
  "Tech",
  "Art & Creative",
  "Comedy",
  "Networking",
  "Sports",
  "Dance",
  "Cocktails",
  "Coffee",
  "Photography",
  "Books",
  "Theatre",
];

const nowObj = new Date();
let CALENDAR_YEAR = nowObj.getFullYear();
let CALENDAR_MONTH = nowObj.getMonth();
function changeCalendarMonth(delta) {
  let m = CALENDAR_MONTH + delta;
  let y = CALENDAR_YEAR;
  while (m < 0) {
    m += 12;
    y--;
  }
  while (m > 11) {
    m -= 12;
    y++;
  }
  CALENDAR_MONTH = m;
  CALENDAR_YEAR = y;
  renderView();
}
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const BLOT_SVG = `<svg class="blot-icon" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fill="var(--gold)" d="M10 1c2 1 4 2 5 4.5 1 2.3 1 4.6-0.3 6.6-1.3 2-3.6 3.3-5.7 4.8-1-1.3-2.7-2-4.2-3.2C2.8 12 1.3 9.8 1.8 7.3 2.3 4.7 4.7 3 7 1.8 8 1.3 9 0.7 10 1Z"/></svg>`;
// Consistent stroke-icon replacements for the 🔒/✓ emoji used as structural
// state indicators (locked/complete) throughout the app — matches the
// Phosphor-style icon set introduced on the landing page/nav.
function lockIconSvg(size = 16) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.15em;"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>`;
}
function checkIconSvg(size = 16) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:inline-block;vertical-align:-0.15em;"><path d="M4 12.5l5.5 5.5L20 6.5"/></svg>`;
}
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

let state = {
  view: "browse",
  selectedEventId: null,
  selectedCategory: "all",
  calendarDay: null,
  userId: null,
  profileName: "",
  profileEmail: "",
  profileId: null,
  specialBadges: [],
  theme: "light",
  editingProfile: false,
  myCard: null,
  rsvps: {},
  attendeeCards: {},
  friends: [],
  goingOpen: {},
  liveOnly: false,
  hotOnly: false,
  isAdmin: false, // set to true after admin OTP verification — bypasses all gates
  bgLoading: false,
};
let cardDraft = {
  theme: "obsidian",
  bgStyle: "obsidian",
  accentColor: "#FFCF33",
  pattern: "constellation",
  patternOpacity: 0.35,
  bio: "",
  interests: "",
  fact: "",
  motto: "",
  photo: "",
  areas: [],
};
let cardEditorEventId = null;
// True while the card editor is showing as the first-run welcome step
// (new member building their pass while the map initialises behind it).
let cardEditorWelcome = false;
let lmap = null,
  lmapFitted = false;
let hostMap = null,
  hostMarker = null;
let newEventLat = 51.5072,
  newEventLon = -0.1276;

// ── Storage helpers ──────────────────────────────────────────────────────
// localStorage kept only for geocode cache (perf optimisation, not user data)
async function localGet(key) {
  try {
    return localStorage.getItem(key);
  } catch (e) {
    return null;
  }
}
async function localSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (e) {}
}
// Legacy aliases so any remaining calls still work during transition
async function storageGet(key) {
  return localGet(key);
}
async function storageSet(key, value) {
  return localSet(key, value);
}

function initials(name) {
  if (!name || !name.trim()) return "?";
  const p = name.trim().split(/s+/);
  return (p[0][0] + (p.length > 1 ? p[1][0] : "")).toUpperCase();
}
function hexToRgba(hex, a) {
  const r = parseInt(hex.slice(1, 3), 16),
    g = parseInt(hex.slice(3, 5), 16),
    b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}
function escapeHtml(s) {
  return String(s != null ? s : "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
}

function showToast(msg, type = "info") {
  let wrap = document.getElementById("cu-toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.id = "cu-toast-wrap";
    wrap.className = "cu-toast-wrap";
    document.body.appendChild(wrap);
  }
  const t = document.createElement("div");
  t.className =
    "cu-toast" +
    (type === "error" ? " error" : type === "success" ? " success" : "");
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => {
    t.classList.add("hiding");
    t.addEventListener("animationend", () => t.remove(), { once: true });
  }, 3200);
}
function showConfirm(title, body, confirmLabel, dangerFnName) {
  const ov = document.createElement("div");
  ov.className = "cu-confirm-overlay";
  ov.setAttribute("id", "cu-confirm-overlay");
  ov.innerHTML = `<div class="cu-confirm-sheet" role="dialog" aria-modal="true"><div class="cu-confirm-title">${escapeHtml(title)}</div><div class="cu-confirm-body">${escapeHtml(body)}</div><div class="cu-confirm-actions"><button class="btn btn-cancel" onclick="document.getElementById('cu-confirm-overlay')?.remove()">Cancel</button><button class="btn" onclick="document.getElementById('cu-confirm-overlay')?.remove();window['${dangerFnName}'](true)">${escapeHtml(confirmLabel)}</button></div></div>`;
  document.body.appendChild(ov);
}
function getTheme(id) {
  return CARD_THEMES.find((t) => t.id === id) || CARD_THEMES[0];
}
function getBgStyle(id) {
  return CARD_BG_STYLES.find((s) => s.id === id) || CARD_BG_STYLES[0];
}
function resolveCardColors(bgStyleId, accentHex) {
  const style = getBgStyle(bgStyleId);
  const acc = accentHex || "#FFCF33";
  const isDark = style.dark;
  return {
    bg: style.bg,
    accent: acc,
    text: isDark ? "#fff" : "#1e293b",
    textSoft: isDark ? "rgba(255,255,255,0.6)" : "rgba(30,41,59,0.58)",
    border: `${acc}40`,
    dark: isDark,
  };
}
function applyTheme() {
  document.documentElement.setAttribute("data-theme", state.theme);
}

// ── Day/night cycle ───────────────────────────────────────────────────────
// The whole app — landing diorama + explore/host maps — is lit by London's
// ACTUAL time of day, not the device's OS dark-mode setting: light 06:00–17:59,
// dark otherwise. One source of truth, re-checked every minute so the scene
// transitions live as the hour rolls over (and any open map re-lights with it).
function themeForNow() {
  try {
    const h = parseInt(
      new Intl.DateTimeFormat("en-GB", {
        timeZone: "Europe/London",
        hour: "numeric",
        hourCycle: "h23",
      }).format(new Date()),
      10,
    );
    return h >= 6 && h < 18 ? "light" : "dark";
  } catch (e) {
    const h = new Date().getHours();
    return h >= 6 && h < 18 ? "light" : "dark";
  }
}
// Re-check the clock; if the day/night phase flipped, apply it everywhere.
function applyDayNight() {
  const t = themeForNow();
  if (t === state.theme) return;
  state.theme = t;
  applyTheme();
  if (lmap) applyMapChrome(lmap, true);
  if (hostMap) applyMapChrome(hostMap, false);
}
let _dayNightTimer = null;
function startDayNightCycle() {
  state.theme = themeForNow();
  applyTheme();
  if (lmap) applyMapChrome(lmap, true);
  if (hostMap) applyMapChrome(hostMap, false);
  if (_dayNightTimer) clearInterval(_dayNightTimer);
  _dayNightTimer = setInterval(applyDayNight, 60000);
}

// ---- MAPBOX TOKEN ----
const DEFAULT_MAPBOX_TOKEN =
  (window.CUMULUS_CONFIG && window.CUMULUS_CONFIG.MAPBOX_TOKEN) ||
  "pk.eyJ1IjoibHVjcmFzc3Nzc3MiLCJhIjoiY21xam1pcTJ4MGt0dTJzcXhobnQyZ3owMiJ9.RpRNYuS-zJnNdZ3wOGl61g";
let MAPBOX_TOKEN = DEFAULT_MAPBOX_TOKEN;
function mapboxConfigured() {
  return !!(MAPBOX_TOKEN && MAPBOX_TOKEN.trim());
}
// Switched to Mapbox Standard Style to seamlessly support toggle properties without map reload.
function mapboxStyleUrl() {
  return "mapbox://styles/mapbox/standard?optimize=true";
}
// Secret-club map chrome: theme-linked lighting, and on the explore map a
// decluttered "underground" feel — hide commercial POI + transit labels so
// the only pins that matter are our events. Safe no-op if the style isn't
// ready or a property is unsupported.
function applyMapChrome(map, declutter) {
  if (!map) return;
  try {
    map.setConfigProperty(
      "basemap",
      "lightPreset",
      state.theme === "dark" ? "night" : "day",
    );
    map.setConfigProperty("basemap", "show3dTrees", false); // Universally disable trees for performance
    if (declutter) {
      map.setConfigProperty("basemap", "showPointOfInterestLabels", false);
      map.setConfigProperty("basemap", "showTransitLabels", false);
    }
  } catch (e) {}
}

// ---- GEOCODING ----
let geocodeCache = {},
  geocodingInProgress = false,
  geocodeProgress = { done: 0, total: 0 };
async function loadGeocodeCache() {
  try {
    const r = await storageGet("geocode_cache");
    geocodeCache = r ? JSON.parse(r) : {};
  } catch (e) {
    geocodeCache = {};
  }
}
async function persistGeocodeCache() {
  try {
    const keys = Object.keys(geocodeCache);
    if (keys.length > 300) {
      keys.slice(0, keys.length - 300).forEach((k) => delete geocodeCache[k]);
    }
    await storageSet("geocode_cache", JSON.stringify(geocodeCache));
  } catch (e) {}
}
function needsGeocode(ev) {
  return (ev.lat == null || ev.lon == null) && ev.address;
}
async function geocodeAddress(address) {
  if (geocodeCache[address]) return geocodeCache[address];
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=gb&limit=1&proximity=-0.1276,51.5072`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`geocode ${res.status}`);
  const data = await res.json();
  const f = data.features && data.features[0];
  if (!f) throw new Error(`no match: ${address}`);
  const coords = { lat: f.center[1], lon: f.center[0] };
  geocodeCache[address] = coords;
  return coords;
}
function geocodeBannerHtml() {
  if (!geocodingInProgress) return "";
  return `<div class="map-caption" style="bottom:auto;top:calc(var(--top-h) + 10px);right:12px;left:auto;transform:none;font-size:10.5px;">${geocodeProgress.done}/${geocodeProgress.total} placed</div>`;
}
function updateGeocodeBanner() {
  const el = document.getElementById("geocode-banner");
  if (el) el.innerHTML = geocodeBannerHtml();
}
const AREA_FALLBACK_CENTER = { lat: 51.5072, lon: -0.1276 };
async function resolveEventLocations() {
  if (geocodingInProgress || !mapboxConfigured()) return;
  const pending = EVENTS.filter(needsGeocode);
  if (!pending.length) return;
  geocodingInProgress = true;
  geocodeProgress = { done: 0, total: pending.length };
  updateGeocodeBanner();
  const concurrency = 6;
  let idx = 0;
  async function worker() {
    while (idx < pending.length) {
      const ev = pending[idx++];
      try {
        const c = await geocodeAddress(ev.address);
        ev.lat = c.lat;
        ev.lon = c.lon;
      } catch (e) {
        const f = AREA_FALLBACK_CENTER;
        ev.lat = f.lat + (Math.random() - 0.5) * 0.06;
        ev.lon = f.lon + (Math.random() - 0.5) * 0.1;
      }
      geocodeProgress.done++;
      updateGeocodeBanner();
      if (state.view === "browse") refreshMarkers();
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));
  await persistGeocodeCache();
  geocodingInProgress = false;
  updateGeocodeBanner();
}

function attendeesFor(id) {
  const out = DEMO_PEOPLE.filter((p) => p.events.includes(id)).map(
    (p) => p.name,
  );
  (state.rsvps[id] || []).forEach((n) => {
    if (!out.includes(n)) out.push(n);
  });
  return out;
}
function isFriend(name) {
  return state.friends.includes(name);
}

/* toggleTheme removed */
async function persistProfile() {
  if (!state.profileId) state.profileId = generateUniqueId();
  const payload = {
    name: state.profileName,
    email: state.profileEmail,
    profile_id: state.profileId,
    special_badges: state.specialBadges,
    theme: state.theme,
    card_theme: state.myCard?.theme || "crimson",
    card_bio: state.myCard?.bio || "",
    card_interests: state.myCard?.interests || "",
    card_fact: state.myCard?.fact || "",
  };
  if (state.userId) payload.id = state.userId;
  const { data, error } = await sb
    .from("users")
    .upsert(payload, { onConflict: "email" })
    .select()
    .single();
  if (data && data.id) state.userId = data.id;
}
function computeEventDates(ev) {
  const st = new Date(ev.startTime),
    et = new Date(ev.endTime);
  ev.startsAt = st.getTime();
  ev.endsAt = et.getTime();
  const df = new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const tf = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  ev.date = df.format(st);
  ev.time = `${tf.format(st)} - ${tf.format(et)}`;
}

async function start() {
  // Theme follows London's day/night cycle — not the OS setting or a saved
  // preference. startDayNightCycle() sets it now and keeps it in sync.
  startDayNightCycle();
  MAPBOX_TOKEN = DEFAULT_MAPBOX_TOKEN;

  // ── Session-first boot ──────────────────────────────────────────────────
  // Check for an existing Supabase Auth session BEFORE rendering the gate.
  // If the user is already logged in (reload / return visit), go straight
  // to the app — never show the gate at all. Only show the gate if there
  // is genuinely no active session. This prevents the "reload logs you out
  // then back in" loop where the gate would flash and accept inputs while
  // enterApp() was already booting in the background.
  let authUser = null;
  try {
    authUser = await authCurrentUser();
  } catch (e) {}

  if (authUser) {
    let profile = await loadUserProfile(authUser.id).catch(() => null);
    if (!profile) {
      // Authenticated but profile fetch failed (offline). Restore from cache.
      try {
        const raw = await localGet("cumulus_session");
        if (raw) {
          const s = JSON.parse(raw);
          if (s && s.userId === authUser.id && s.name) {
            profile = {
              id: s.userId,
              name: s.name,
              email: s.email,
              profile_id: s.profileId,
              special_badges: s.specialBadges,
            };
          }
        }
      } catch (e) {}
    }

    if (profile && profile.name) {
      // ── Returning user: skip the gate entirely ──
      _restoreUserFromRow(profile);
      state.profileEmail = profile.email || authUser.email || "";
      await localSet("cumulus_email", state.profileEmail);
      _cacheSession();

      // Show a minimal loading screen while the app boots (no gate flash)
      const gateRoot = document.getElementById("gate-root");
      if (gateRoot) {
        gateRoot.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;height:100vh;
          background:var(--bg,#0d0e1a);flex-direction:column;gap:16px">
          <div style="width:36px;height:36px;border:3px solid rgba(255,207,51,0.25);
            border-top-color:#FFCF33;border-radius:50%;animation:spin 0.8s linear infinite"></div>
          <span style="color:rgba(255,255,255,0.5);font-size:13px;font-family:sans-serif">Resuming session…</span>
        </div>`;
      }

      enterApp();
      return; // Done — no gate needed
    }
  }

  // No active session (or profile incomplete) → show the landing gate
  renderGate();
}

/* ── Landing diorama — layered paper-cut London, theme-lit ──────────────
 * Two inline SVGs (back haze + front landmarks) so CSS [data-theme] drives
 * the lighting: bright flat facades by day, silhouettes with lit windows,
 * clock face and aviation beacons at night. preserveAspectRatio slice keeps
 * the scene edge-to-edge at any viewport width. Window grids are SVG
 * patterns (cheap); .dio-wins groups fade in staggered like dusk. */
const DIORAMA_BACK_SVG = `
<svg viewBox="0 0 2400 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <g fill="var(--dio-back)">
    <circle cx="130" cy="252" r="46" fill="none" stroke="var(--dio-back)" stroke-width="4" opacity="0.55"/>
    <circle cx="130" cy="252" r="46" fill="var(--dio-back)" opacity="0.25"/>
    <rect x="0" y="228" width="58" height="72"/>
    <rect x="196" y="212" width="44" height="88"/>
    <rect x="252" y="238" width="60" height="62"/>
    <rect x="360" y="220" width="38" height="80"/>
    <rect x="430" y="196" width="52" height="104"/>
    <rect x="540" y="228" width="64" height="72"/>
    <rect x="648" y="204" width="34" height="96"/>
    <polygon points="700,300 700,196 716,178 732,196 732,300"/>
    <rect x="788" y="222" width="56" height="78"/>
    <rect x="876" y="188" width="40" height="112"/>
    <rect x="948" y="234" width="66" height="66"/>
    <rect x="1046" y="206" width="44" height="94"/>
    <rect x="1120" y="230" width="58" height="70"/>
    <rect x="1236" y="52" width="18" height="248"/>
    <rect x="1228" y="88" width="8" height="12"/>
    <rect x="1254" y="102" width="8" height="12"/>
    <rect x="1228" y="122" width="8" height="10"/>
    <rect x="1243" y="22" width="4" height="30"/>
    <rect x="1310" y="214" width="48" height="86"/>
    <rect x="1394" y="192" width="36" height="108"/>
    <rect x="1470" y="226" width="62" height="74"/>
    <rect x="1580" y="204" width="42" height="96"/>
    <rect x="1662" y="232" width="58" height="68"/>
    <rect x="1758" y="198" width="38" height="102"/>
    <rect x="1840" y="224" width="54" height="76"/>
    <rect x="1936" y="206" width="40" height="94"/>
    <rect x="2010" y="238" width="60" height="62"/>
    <rect x="2150" y="120" width="64" height="180"/>
    <polygon points="2150,120 2182,86 2214,120"/>
    <circle cx="2182" cy="82" r="2.5" class="dio-beacon"/>
    <rect x="2226" y="152" width="54" height="148"/>
    <rect x="2292" y="136" width="58" height="164"/>
    <polygon points="2292,136 2321,108 2350,136"/>
    <rect x="2360" y="180" width="40" height="120"/>
  </g>
</svg>`;
const DIORAMA_FRONT_SVG = `
<svg viewBox="0 0 2400 340" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
  <defs>
    <pattern id="dioWinA" width="14" height="18" patternUnits="userSpaceOnUse">
      <rect x="3" y="4" width="5" height="7" rx="0.8" fill="var(--dio-win)"/>
    </pattern>
    <pattern id="dioWinB" width="12" height="15" patternUnits="userSpaceOnUse">
      <rect x="2.5" y="3.5" width="4" height="5.5" rx="0.7" fill="var(--dio-win)"/>
    </pattern>
    <pattern id="dioWinC" width="18" height="15" patternUnits="userSpaceOnUse">
      <rect x="2" y="4" width="12" height="3.4" rx="1" fill="var(--dio-win)"/>
    </pattern>
    <linearGradient id="dioGlow" x1="0" y1="1" x2="0" y2="0">
      <stop offset="0" stop-color="#C89B3C" stop-opacity="0.28"/>
      <stop offset="0.6" stop-color="#C89B3C" stop-opacity="0.08"/>
      <stop offset="1" stop-color="#C89B3C" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <rect x="0" y="170" width="2400" height="170" fill="url(#dioGlow)" class="dio-glow"/>

  <!-- Battersea Power Station -->
  <g>
    <polygon points="58,236 74,236 71,152 61,152" fill="var(--dio-chimney)"/>
    <polygon points="98,236 114,236 111,152 101,152" fill="var(--dio-chimney)"/>
    <polygon points="206,236 222,236 219,152 209,152" fill="var(--dio-chimney)"/>
    <polygon points="246,236 262,236 259,152 249,152" fill="var(--dio-chimney)"/>
    <rect x="44" y="232" width="44" height="108" fill="var(--dio-front)"/>
    <rect x="232" y="232" width="44" height="108" fill="var(--dio-front)"/>
    <rect x="80" y="252" width="160" height="88" fill="var(--dio-front-2)"/>
    <rect x="92" y="266" width="136" height="58" fill="url(#dioWinC)" class="dio-wins dw1"/>
  </g>

  <!-- Terrace row -->
  <g>
    <polygon points="297,286 321,266 345,286" fill="var(--dio-front)"/>
    <rect x="300" y="284" width="42" height="56" fill="var(--dio-front-2)"/>
    <polygon points="343,286 367,266 391,286" fill="var(--dio-front)"/>
    <rect x="346" y="284" width="42" height="56" fill="var(--dio-front)"/>
    <polygon points="389,286 413,266 437,286" fill="var(--dio-front)"/>
    <rect x="392" y="284" width="42" height="56" fill="var(--dio-front-2)"/>
    <rect x="330" y="270" width="7" height="12" fill="var(--dio-front)"/>
    <rect x="422" y="270" width="7" height="12" fill="var(--dio-front)"/>
    <rect x="306" y="292" width="122" height="42" fill="url(#dioWinB)" class="dio-wins dw2"/>
  </g>

  <!-- Palace of Westminster + Elizabeth Tower -->
  <g>
    <rect x="452" y="246" width="20" height="94" fill="var(--dio-front)"/>
    <polygon points="452,246 462,230 472,246" fill="var(--dio-front)"/>
    <rect x="452" y="266" width="144" height="74" fill="var(--dio-front-2)"/>
    <rect x="576" y="246" width="20" height="94" fill="var(--dio-front)"/>
    <polygon points="576,246 586,230 596,246" fill="var(--dio-front)"/>
    <rect x="460" y="274" width="128" height="58" fill="url(#dioWinB)" class="dio-wins dw1"/>
    <rect x="604" y="152" width="32" height="188" fill="var(--dio-front)"/>
    <rect x="609" y="176" width="22" height="148" fill="url(#dioWinB)" class="dio-wins dw3"/>
    <rect x="599" y="134" width="42" height="30" fill="var(--dio-front)"/>
    <circle cx="620" cy="149" r="11" class="dio-clock"/>
    <polygon points="599,134 641,134 628,102 620,84 612,102" fill="var(--dio-front)"/>
    <rect x="618" y="72" width="4" height="14" fill="var(--dio-front)"/>
  </g>

  <!-- London Eye -->
  <g>
    <polygon points="770,196 724,340 740,340 770,214 800,340 816,340" fill="var(--dio-front)"/>
    <g stroke="var(--dio-front)" stroke-width="2" opacity="0.75">
      <line x1="770" y1="190" x2="864" y2="190"/><line x1="770" y1="190" x2="851" y2="237"/>
      <line x1="770" y1="190" x2="817" y2="271"/><line x1="770" y1="190" x2="770" y2="284"/>
      <line x1="770" y1="190" x2="723" y2="271"/><line x1="770" y1="190" x2="689" y2="237"/>
      <line x1="770" y1="190" x2="676" y2="190"/><line x1="770" y1="190" x2="689" y2="143"/>
      <line x1="770" y1="190" x2="723" y2="109"/><line x1="770" y1="190" x2="770" y2="96"/>
      <line x1="770" y1="190" x2="817" y2="109"/><line x1="770" y1="190" x2="851" y2="143"/>
    </g>
    <circle cx="770" cy="190" r="96" fill="none" stroke="var(--dio-front)" stroke-width="5"/>
    <circle cx="770" cy="190" r="87" fill="none" stroke="var(--dio-front)" stroke-width="1.6" opacity="0.5"/>
    <circle cx="770" cy="190" r="8" fill="var(--dio-front)"/>
    <g class="dio-pods">
      <circle cx="866" cy="190" r="5.5"/><circle cx="853" cy="238" r="5.5"/><circle cx="818" cy="273" r="5.5"/>
      <circle cx="770" cy="286" r="5.5"/><circle cx="722" cy="273" r="5.5"/><circle cx="687" cy="238" r="5.5"/>
      <circle cx="674" cy="190" r="5.5"/><circle cx="687" cy="142" r="5.5"/><circle cx="722" cy="107" r="5.5"/>
      <circle cx="770" cy="94" r="5.5"/><circle cx="818" cy="107" r="5.5"/><circle cx="853" cy="142" r="5.5"/>
    </g>
  </g>

  <!-- Southbank blocks -->
  <rect x="880" y="262" width="52" height="78" fill="var(--dio-front-2)"/>
  <rect x="886" y="270" width="40" height="62" fill="url(#dioWinA)" class="dio-wins dw2"/>
  <rect x="938" y="238" width="66" height="102" fill="var(--dio-front)"/>
  <rect x="946" y="248" width="50" height="84" fill="url(#dioWinA)" class="dio-wins dw4"/>

  <!-- St Paul's Cathedral -->
  <g>
    <rect x="1038" y="246" width="20" height="66" fill="var(--dio-front)"/>
    <circle cx="1048" cy="242" r="8" fill="var(--dio-front)"/>
    <rect x="1148" y="246" width="20" height="66" fill="var(--dio-front)"/>
    <circle cx="1158" cy="242" r="8" fill="var(--dio-front)"/>
    <rect x="1028" y="274" width="150" height="66" fill="var(--dio-front-2)"/>
    <rect x="1040" y="284" width="126" height="48" fill="url(#dioWinB)" class="dio-wins dw3"/>
    <rect x="1072" y="236" width="62" height="40" fill="var(--dio-front)"/>
    <path d="M1064,238 Q1103,162 1142,238 Z" fill="var(--dio-front)"/>
    <rect x="1098" y="184" width="10" height="20" fill="var(--dio-front)"/>
    <circle cx="1103" cy="181" r="7" fill="var(--dio-front)"/>
    <rect x="1101" y="158" width="4" height="18" fill="var(--dio-front)"/>
  </g>

  <!-- City cluster -->
  <rect x="1200" y="206" width="44" height="134" fill="var(--dio-front)"/>
  <rect x="1206" y="214" width="32" height="118" fill="url(#dioWinA)" class="dio-wins dw1"/>
  <rect x="1252" y="178" width="56" height="162" fill="var(--dio-front-2)"/>
  <rect x="1259" y="188" width="42" height="144" fill="url(#dioWinA)" class="dio-wins dw3"/>
  <rect x="1314" y="224" width="34" height="116" fill="var(--dio-front)"/>
  <rect x="1319" y="232" width="24" height="100" fill="url(#dioWinB)" class="dio-wins dw2"/>

  <!-- The Gherkin -->
  <g>
    <path d="M1366,340 C1362,258 1372,186 1399,152 C1426,186 1436,258 1432,340 Z" fill="var(--dio-front)"/>
    <path d="M1372,300 Q1399,282 1426,300" fill="none" class="dio-lattice" stroke-width="2"/>
    <path d="M1370,252 Q1399,234 1428,252" fill="none" class="dio-lattice" stroke-width="2"/>
    <path d="M1376,206 Q1399,192 1422,206" fill="none" class="dio-lattice" stroke-width="2"/>
    <g class="dio-wins dw4">
      <rect x="1386" y="216" width="5" height="6" rx="0.8" fill="var(--dio-win)"/>
      <rect x="1406" y="238" width="5" height="6" rx="0.8" fill="var(--dio-win)"/>
      <rect x="1390" y="266" width="5" height="6" rx="0.8" fill="var(--dio-win)"/>
      <rect x="1412" y="288" width="5" height="6" rx="0.8" fill="var(--dio-win)"/>
      <rect x="1396" y="310" width="5" height="6" rx="0.8" fill="var(--dio-win)"/>
    </g>
  </g>

  <!-- The Cheesegrater -->
  <g>
    <polygon points="1456,340 1456,168 1552,340" fill="var(--dio-front-2)"/>
    <g stroke="var(--dio-face)" stroke-width="1.5" class="dio-face-lines">
      <line x1="1456" y1="200" x2="1474" y2="200"/><line x1="1456" y1="240" x2="1496" y2="240"/>
      <line x1="1456" y1="280" x2="1518" y2="280"/><line x1="1456" y1="318" x2="1540" y2="318"/>
    </g>
  </g>

  <!-- The Walkie-Talkie -->
  <g>
    <path d="M1596,340 L1586,226 C1582,182 1682,182 1680,226 L1670,340 Z" fill="var(--dio-front)"/>
    <rect x="1600" y="200" width="64" height="126" fill="url(#dioWinC)" class="dio-wins dw2"/>
  </g>

  <!-- The Shard -->
  <g>
    <polygon points="1726,340 1772,58 1772,340" fill="var(--dio-front-2)"/>
    <polygon points="1772,340 1772,58 1818,340" fill="var(--dio-front)"/>
    <circle cx="1772" cy="52" r="3" class="dio-beacon"/>
    <g class="dio-wins dw3">
      <rect x="1762" y="130" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
      <rect x="1776" y="168" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
      <rect x="1756" y="212" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
      <rect x="1782" y="248" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
      <rect x="1764" y="286" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
      <rect x="1790" y="300" width="4" height="6" rx="0.7" fill="var(--dio-win)"/>
    </g>
  </g>

  <!-- Tower Bridge -->
  <g>
    <path d="M1856,304 Q1876,240 1892,222" fill="none" stroke="var(--dio-front)" stroke-width="3"/>
    <path d="M2088,222 Q2104,240 2124,304" fill="none" stroke="var(--dio-front)" stroke-width="3"/>
    <rect x="1936" y="206" width="108" height="8" fill="var(--dio-front)"/>
    <rect x="1936" y="224" width="108" height="8" fill="var(--dio-front)"/>
    <path d="M1936,340 Q1990,298 2044,340 Z" fill="var(--dio-front)"/>
    <rect x="1888" y="178" width="8" height="18" fill="var(--dio-front)"/>
    <rect x="1932" y="178" width="8" height="18" fill="var(--dio-front)"/>
    <rect x="2040" y="178" width="8" height="18" fill="var(--dio-front)"/>
    <rect x="2084" y="178" width="8" height="18" fill="var(--dio-front)"/>
    <rect x="1892" y="186" width="44" height="154" fill="var(--dio-front-2)"/>
    <rect x="2044" y="186" width="44" height="154" fill="var(--dio-front-2)"/>
    <polygon points="1888,186 1914,140 1940,186" fill="var(--dio-front)"/>
    <polygon points="2040,186 2066,140 2092,186" fill="var(--dio-front)"/>
    <rect x="1856" y="298" width="268" height="10" fill="var(--dio-front)"/>
    <rect x="1898" y="196" width="32" height="134" fill="url(#dioWinB)" class="dio-wins dw1"/>
    <rect x="2050" y="196" width="32" height="134" fill="url(#dioWinB)" class="dio-wins dw4"/>
  </g>

  <!-- East wharf -->
  <rect x="2140" y="232" width="52" height="108" fill="var(--dio-front)"/>
  <rect x="2146" y="240" width="40" height="92" fill="url(#dioWinA)" class="dio-wins dw2"/>
  <rect x="2200" y="208" width="62" height="132" fill="var(--dio-front-2)"/>
  <rect x="2208" y="218" width="46" height="114" fill="url(#dioWinA)" class="dio-wins dw3"/>
  <rect x="2270" y="244" width="48" height="96" fill="var(--dio-front)"/>
  <rect x="2276" y="252" width="36" height="80" fill="url(#dioWinB)" class="dio-wins dw1"/>
  <rect x="2326" y="190" width="74" height="150" fill="var(--dio-front-2)"/>
  <rect x="2334" y="200" width="58" height="132" fill="url(#dioWinA)" class="dio-wins dw4"/>

  <rect x="0" y="330" width="2400" height="10" fill="var(--dio-front)"/>
</svg>`;

function renderGate(prefillName, prefillEmail) {
  const loader = document.getElementById("cumulus-loader");
  if (loader) {
    loader.style.opacity = "0";
    setTimeout(() => loader.remove(), 500);
  }
  document.getElementById("gate-root").innerHTML = `
  <div class="lp-root">

    <!-- ── STICKY NAV ── -->
    <nav class="lp-nav">
      <div class="lp-nav-inner">
        <div class="lp-nav-logo">${BLOT_SVG}<span>Cumulus</span></div>
        <div class="lp-nav-links hide-mobile">
          <a href="#" onclick="document.getElementById('lp-features-anchor').scrollIntoView({behavior:'smooth'});return false;">Features</a>
          <a href="#" onclick="document.getElementById('lp-venues-anchor').scrollIntoView({behavior:'smooth'});return false;">For Venues</a>
        </div>
        <div class="lp-nav-auth">
          <button class="lp-nav-login" onclick="showLpLogin()">Log in</button>
          <button class="btn lp-nav-btn" onclick="showLpSignup()">Request Access</button>
        </div>
      </div>
    </nav>

    <!-- ── HERO ── -->
    <section class="lp-hero">
      <div class="lp-hero-sky" aria-hidden="true"></div>
      <div class="lp-dio-back" aria-hidden="true">${DIORAMA_BACK_SVG}</div>
      <div class="lp-cloud-layer" aria-hidden="true">
        <!-- Cumulus bank on the horizon: low band, tops free, bottoms dissolved
             by a CSS mask and tucked behind the front skyline. Very slow drift. -->
        <div class="lp-cld" style="top:38%;width:44vw;--dur:210s;--dly:-30s; --ar:2019/447; background-image:url('assets/clouds/cloud2.webp')"></div>
        <div class="lp-cld" style="top:45%;width:34vw;--dur:252s;--dly:-140s;--ar:1951/583; background-image:url('assets/clouds/cloud1.webp')"></div>
        <div class="lp-cld" style="top:41%;width:56vw;--dur:184s;--dly:-90s; --ar:2049/815; background-image:url('assets/clouds/cloud5.webp')"></div>
        <div class="lp-cld" style="top:51%;width:48vw;--dur:232s;--dly:-55s; --ar:2049/701; background-image:url('assets/clouds/cloud4.webp')"></div>
        <div class="lp-cld" style="top:56%;width:52vw;--dur:268s;--dly:-170s;--ar:2049/1152;background-image:url('assets/clouds/cloud3.webp')"></div>
      </div>
      <div class="lp-hero-scrim" aria-hidden="true"></div>
      <div class="lp-dio-front" aria-hidden="true">${DIORAMA_FRONT_SVG}</div>
      <div class="lp-hero-content">
        <div class="lp-hero-kicker">
          <span class="lp-live-dot"></span>
          London · Community events club
        </div>
        <h1 class="lp-hero-title">Find what's on.<br><span class="lp-hero-gradient">Zero fees for hosts.</span></h1>
        <p class="lp-hero-sub">Cumulus is a live map of grassroots events across London. Every event is public — no invite, no curator code. Hosts keep 100% of their ticket price.</p>
        <div class="lp-hero-actions">
          <button class="btn lp-hero-btn-primary" onclick="showLpSignup()">Explore the Map →</button>
          <button class="btn btn-outline lp-hero-btn-secondary" onclick="document.getElementById('lp-features-anchor').scrollIntoView({behavior:'smooth'})">How it works ↓</button>
        </div>
        <p class="lp-hero-trust-note">${checkIconSvg(12)} Every public host is reviewed before their event goes live</p>
        <div class="lp-hero-pins" aria-hidden="true">
          <div class="lp-hero-pin" style="--c:#8FC63D;">
            <span class="lp-hero-pin-live"><span class="d"></span>Live</span>
            <span class="lp-hero-pin-title">Sunset Yoga</span>
            <span class="lp-hero-pin-meta">Victoria Park · 18 going</span>
          </div>
          <div class="lp-hero-pin" style="--c:#F0687E;">
            <span class="lp-hero-pin-title">Vinyl &amp; Wine</span>
            <span class="lp-hero-pin-meta">Peckham · 32 going</span>
          </div>
          <div class="lp-hero-pin" style="--c:#FFCF33;">
            <span class="lp-hero-pin-title">Life Drawing</span>
            <span class="lp-hero-pin-meta">Hackney · 22 going</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FEATURES ── -->
    <section class="lp-features" id="lp-features-anchor">
      <div style="text-align:center;margin-bottom:52px;">
        <h2 class="lp-section-title">One pass. Your whole city.</h2>
      </div>
      <div class="lp-features-grid">
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/discover.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg></div>
          <div class="lp-feat-card-title">Discover locally</div>
          <div class="lp-feat-card-desc">Browse events happening in your neighbourhood — from jazz nights and gallery openings to supper clubs and community walks.</div>
        </div>
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/pass.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="8.5" cy="11.5" r="1.8"/><path d="M5.8 16c.5-1.6 1.8-2.4 2.7-2.4s2.2.8 2.7 2.4"/><path d="M14 10h4M14 13h4"/></svg></div>
          <div class="lp-feat-card-title">Your digital pass</div>
          <div class="lp-feat-card-desc">A personalised card you carry to every event. Share your QR code to connect instantly with people you meet in person.</div>
        </div>
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/connect.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3"/><path d="M3.5 20c.6-3.2 3-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="17" cy="9" r="2.3"/><path d="M15.8 13.2c2 .2 3.6 1.7 4.1 4.3"/></svg></div>
          <div class="lp-feat-card-title">Real connections</div>
          <div class="lp-feat-card-desc">See who's going before you arrive. Meet people who share your interests. Build friendships that last beyond the event.</div>
        </div>
      </div>
    </section>

    <!-- ── VENUE PITCH ── -->
    <section class="lp-venues-section" id="lp-venues-anchor">
      <div class="lp-venues-inner">
        <div class="lp-venues-text">
          <div class="lp-section-kicker" style="color:var(--gold);">For Venues &amp; Promoters</div>
          <h2 class="lp-section-title" style="color:#fff;">Your event.<br>Our audience.</h2>
          <p style="color:rgba(255,255,255,0.72);font-size:15px;line-height:1.75;max-width:480px;">List your venue on Cumulus and reach thousands of active Londoners who are already looking for their next night out. We handle discovery, ticketing, pre-event buzz, and real-time attendee connection — you focus on the event.</p>
          <div class="lp-venue-features">
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s7-6.5 7-12a7 7 0 0 0-14 0c0 5.5 7 12 7 12Z"/><circle cx="12" cy="9" r="2.5"/></svg></div><div><div class="lp-feat-title">Map-first discovery</div><div class="lp-feat-desc">Your venue pinned and filterable across London's live event map.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/></svg></div><div><div class="lp-feat-title">Zero-fee ticketing</div><div class="lp-feat-desc">Hosts keep 100% of their price. Cumulus adds only a flat platform fee to the buyer — no percentage cuts, ever.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v10H9l-4 4V5Z"/><path d="M8 9h8M8 12h5"/></svg></div><div><div class="lp-feat-title">Pre-event community</div><div class="lp-feat-desc">Attendees connect before they arrive — higher show rates, better energy.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linejoin="round"><path d="M12 3.5l2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7L12 3.5Z"/></svg></div><div><div class="lp-feat-title">Featured placement</div><div class="lp-feat-desc">Major events get priority placement across the Cumulus platform.</div></div></div>
          </div>
          <button class="btn lp-venues-cta" onclick="showLpSignup()">Get started — it's free →</button>
        </div>
        <div class="lp-venues-stats">
          <div class="lp-vstat"><div class="lp-vstat-num">0%</div><div class="lp-vstat-label">Host fees</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">9</div><div class="lp-vstat-label">Categories</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">32</div><div class="lp-vstat-label">London boroughs</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">100%</div><div class="lp-vstat-label">Community-led</div></div>
        </div>
      </div>
    </section>

    <!-- ── COMMUNITY PROOF ── -->
    <section style="padding:80px 24px;background:var(--bg);position:relative;overflow:hidden;">
      <div style="max-width:860px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:52px;align-items:center;">
        <div>
          <h2 class="lp-join-headline">This isn't about events.<br>It's about <em>your people.</em></h2>
          <p class="lp-join-body">Cumulus was built on one belief — the best things happen when people who live near each other actually meet. Not online. In the same room, at the same table, under the same open sky.</p>
          <div class="lp-join-proof" style="margin-top:24px;">
            <span class="lp-join-live"><span class="d"></span>Live</span>
            <span class="lp-proof-text">34 events this week · 1,200+ Londoners RSVP'd</span>
          </div>
          <button class="btn lp-hero-btn-primary" style="margin-top:28px;" onclick="showLpSignup()">Join them →</button>
        </div>
        <div class="lp-community-stack">
          <div class="lp-comm-card lp-comm-c1">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av">AR</div>
              <div class="lp-comm-av">PS</div>
              <div class="lp-comm-av">TB</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Jazz in the Park</div>
              <div class="lp-comm-sub">Herne Hill · 40 going</div>
            </div>
            <div class="lp-comm-dot"></div>
          </div>
          <div class="lp-comm-card lp-comm-c2">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av">ML</div>
              <div class="lp-comm-av">JC</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Ceramics &amp; Chill</div>
              <div class="lp-comm-sub">Bermondsey · 25 going</div>
            </div>
            <div class="lp-comm-dot"></div>
          </div>
          <div class="lp-comm-card lp-comm-c3">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av">SO</div>
              <div class="lp-comm-av">OW</div>
              <div class="lp-comm-av">CD</div>
              <div class="lp-comm-av lp-comm-av-more">+12</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Supper Club — Fulham</div>
              <div class="lp-comm-sub">Fulham · 26 going</div>
            </div>
            <div class="lp-comm-dot"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ── -->
    <footer class="lp-footer">
      <div class="lp-nav-logo" style="margin-bottom:10px;">${BLOT_SVG}<span style="font-size:16px;font-weight:800;color:var(--text-muted);">Cumulus</span></div>
      <p style="font-size:12px;color:var(--text-muted);margin:0 0 10px;">London Community Events · ${new Date().getFullYear()}</p>
      <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;">
        <a href="privacy.html" style="font-size:11px;color:var(--text-muted);text-decoration:none;opacity:0.65;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'">Privacy</a>
        <a href="terms.html" style="font-size:11px;color:var(--text-muted);text-decoration:none;opacity:0.65;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'">Terms</a>
        <a href="mailto:hello@cumulusapp.co" style="font-size:11px;color:var(--text-muted);text-decoration:none;opacity:0.65;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'">Contact</a>
      </div>
    </footer>

    <!-- ── SIGN-UP MODAL ── -->
    <div class="lp-signup-overlay" id="lp-signup-overlay" onclick="if(event.target===this)closeLpSignup()">
      <div class="lp-signup-modal">
        <button class="lp-signup-close" onclick="closeLpSignup()" aria-label="Close">✕</button>

        <!-- Auth mode: Sign up vs Log in -->
        <div class="auth-mode-sel">
          <button class="auth-mode-btn active" id="am-signup" onclick="switchAuthMode('signup')">Request Access</button>
          <button class="auth-mode-btn" id="am-login" onclick="switchAuthMode('login')">Log in</button>
        </div>

        <!-- Type selector: Attendee vs Host (sign up only) -->
        <div class="gate-type-sel" id="gate-type-sel">
          <button class="gate-type-btn active" id="gt-attendee" onclick="switchSignupType('attendee')">
            Join as attendee
          </button>
          <button class="gate-type-btn" id="gt-host" onclick="switchSignupType('host')">
            Become a host
          </button>
        </div>

        <!-- Attendee pass preview -->
        <div id="gate-attendee-preview" class="lp-pass-preview" style="margin-bottom:20px;">
          <div class="lp-pass-card" id="lp-pass-preview-card" style="background:linear-gradient(rgba(0,0,0,0.14),rgba(0,0,0,0.14)),linear-gradient(140deg,var(--accent),var(--accent-deep));">
            <div class="lp-pass-shine"></div>
            <div class="lp-pass-label">// Cumulus Pass</div>
            <div class="lp-pass-name" id="lp-pass-name-preview">Your name here</div>
            <div class="lp-pass-detail">London Community Member</div>
            <div class="lp-pass-tags">
              <span class="lp-pass-tag">Live Music</span>
              <span class="lp-pass-tag">Food &amp; Drink</span>
              <span class="lp-pass-tag">Meetups</span>
            </div>
            <div class="lp-pass-watermark">CU</div>
          </div>
          <div class="lp-pass-caption">This is what you'll carry to every event.</div>
        </div>

        <!-- Host teaser (shown when host tab selected) -->
        <div id="gate-host-preview" style="display:none;margin-bottom:20px;padding:16px;background:color-mix(in srgb,var(--accent) 6%,transparent);border:1px solid color-mix(in srgb,var(--accent) 20%,transparent);border-radius:14px;">
          <div style="font-size:22px;margin-bottom:8px;">🎪</div>
          <div style="font-weight:800;font-size:14px;color:var(--text);margin-bottom:4px;">Host verified events on Cumulus</div>
          <div style="font-size:12px;color:var(--text-muted);line-height:1.6;">Tell us about your venue or events. Applications are reviewed by our team — approved hosts can post public events, sell tickets, and access host analytics.</div>
        </div>

        <div class="lp-form-eyebrow" id="gate-form-eyebrow">Free to join · Takes 20 seconds</div>
        <h3 class="lp-form-title" id="gate-form-title">Request your access</h3>
        <p class="lp-form-sub" id="gate-form-sub">Every event on Cumulus is public — join in seconds, no invite needed.</p>

        <div class="gate-field" id="gate-name-field">
          <label class="gate-label" for="gate-name">Full name</label>
          <input id="gate-name" class="gate-input" placeholder="e.g. Alex Rivera" value="${escapeHtml(prefillName || "")}" autocomplete="name" oninput="lpUpdatePassName(this.value)"/>
        </div>
        <div class="gate-field">
          <label class="gate-label" for="gate-email">Email address</label>
          <input id="gate-email" class="gate-input" type="email" placeholder="you@email.com" value="${escapeHtml(prefillEmail || "")}" autocomplete="email"/>
        </div>

        <!-- Host-only extra fields -->
        <div id="gate-host-fields" style="display:none;" class="gate-host-extra">
          <div class="gate-field">
            <label class="gate-label" for="gate-biz-name">Venue or business name</label>
            <input id="gate-biz-name" class="gate-input" placeholder="e.g. The Sketch House" autocomplete="organization"/>
          </div>
          <div class="gate-field-group-label">Event types you'd host</div>
          <div class="host-cat-grid" id="host-cat-grid">
            ${["Creative", "Gaming", "Movie Nights", "Board Games", "Meetups", "Food &amp; Drink", "Live Music", "Wellness &amp; Outdoors", "Tech &amp; Talks"].map((c) => `<button class="host-cat-chip" data-hostcat="${escapeHtml(c.replace(/&amp;/g, "&"))}" onclick="toggleHostCat('${escapeHtml(c.replace(/&amp;/g, "&"))}')">${c}</button>`).join("")}
          </div>
          <div class="gate-field" style="margin-top:15px;">
            <label class="gate-label" for="gate-host-desc">About your events</label>
            <textarea id="gate-host-desc" class="gate-input" placeholder="What kind of events do you run? Describe the vibe, size, and frequency…" rows="3" maxlength="400"></textarea>
          </div>
          <div class="gate-field">
            <label class="gate-label" for="gate-why-host">Why host on Cumulus?</label>
            <textarea id="gate-why-host" class="gate-input" placeholder="Tell us what you're hoping to achieve…" rows="2" maxlength="300"></textarea>
          </div>
        </div>

        <p id="gate-field-error" class="gate-field-error"></p>
        <button class="lp-claim-btn" onclick="submitGate()">
          <span class="lp-claim-btn-text" id="gate-claim-label">Unlock the map →</span>
          <div class="lp-claim-shimmer"></div>
        </button>

        <div class="lp-form-trust" id="gate-trust-strip">
          <span>Discreet, always</span>
          <span>·</span>
          <span>Members keep 100%</span>
          <span>·</span>
          <span>Leave anytime</span>
        </div>
      </div>
    </div>

  </div>`;

  // Auto-open modal if prefill data was provided (returning user flow)
  if (prefillName || prefillEmail) showLpSignup();

  document.getElementById("gate-name").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("gate-email").focus();
  });
  document.getElementById("gate-email").addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitGate();
  });

  requestAnimationFrame(() => {
    document.querySelectorAll(".lp-venue-feat").forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateX(-12px)";
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.style.transition = `opacity 0.4s ease ${i * 0.09}s, transform 0.4s ease ${i * 0.09}s`;
              e.target.style.opacity = "1";
              e.target.style.transform = "translateX(0)";
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.2 },
      );
      obs.observe(el);
    });
    document.querySelectorAll(".lp-feat-card").forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(20px)";
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              e.target.style.transition = `opacity 0.45s ease ${i * 0.1}s, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${i * 0.1}s`;
              e.target.style.opacity = "1";
              e.target.style.transform = "translateY(0)";
              obs.unobserve(e.target);
            }
          });
        },
        { threshold: 0.15 },
      );
      obs.observe(el);
    });
  });
}

let _signupType = "attendee";
let _hostCats = [];
let _authMode = "signup"; // 'signup' | 'login'

function switchAuthMode(mode) {
  _authMode = mode;
  const isLogin = mode === "login";
  document.getElementById("am-signup")?.classList.toggle("active", !isLogin);
  document.getElementById("am-login")?.classList.toggle("active", isLogin);
  // Sign-up-only sections (class beats CSS !important display via source order)
  const hide = (id, cond) => {
    const el = document.getElementById(id);
    if (el) el.classList.toggle("auth-hidden", cond);
  };
  hide("gate-type-sel", isLogin);
  hide("gate-name-field", isLogin);
  hide("gate-attendee-preview", isLogin || _signupType === "host");
  hide("gate-host-preview", isLogin || _signupType !== "host");
  hide("gate-host-fields", isLogin || _signupType !== "host");
  const eyebrow = document.getElementById("gate-form-eyebrow");
  const title = document.getElementById("gate-form-title");
  const sub = document.getElementById("gate-form-sub");
  const label = document.getElementById("gate-claim-label");
  const trust = document.getElementById("gate-trust-strip");
  if (isLogin) {
    if (eyebrow) eyebrow.textContent = "Welcome back";
    if (title) title.textContent = "Log in";
    if (sub)
      sub.textContent = "Enter your email to pick up right where you left off.";
    if (label) label.textContent = "Log in →";
    if (trust)
      trust.innerHTML =
        "<span>No password needed</span><span>·</span><span>Just your email</span>";
  } else {
    // Restore sign-up copy for the current attendee/host type
    switchSignupType(_signupType);
  }
}

function switchSignupType(type) {
  _signupType = type;
  _hostCats = [];
  document
    .getElementById("gt-attendee")
    .classList.toggle("active", type === "attendee");
  document
    .getElementById("gt-host")
    .classList.toggle("active", type === "host");
  document.getElementById("gate-attendee-preview").style.display =
    type === "attendee" ? "" : "none";
  document.getElementById("gate-host-preview").style.display =
    type === "host" ? "" : "none";
  document.getElementById("gate-host-fields").style.display =
    type === "host" ? "" : "none";
  const eyebrow = document.getElementById("gate-form-eyebrow");
  const title = document.getElementById("gate-form-title");
  const sub = document.getElementById("gate-form-sub");
  const label = document.getElementById("gate-claim-label");
  const trust = document.getElementById("gate-trust-strip");
  if (type === "host") {
    if (eyebrow) eyebrow.textContent = "Subject to review · Free to apply";
    if (title) title.textContent = "Apply to host";
    if (sub)
      sub.textContent =
        "Tell us about your events. Our team reviews every application to keep quality high on Cumulus.";
    if (label) label.textContent = "Submit application →";
    if (trust)
      trust.innerHTML =
        "<span>Free to apply</span><span>·</span><span>Reviewed within 48 hrs</span><span>·</span><span>No lock-in</span>";
  } else {
    if (eyebrow) eyebrow.textContent = "Free to join · Takes 20 seconds";
    if (title) title.textContent = "Request your access";
    if (sub)
      sub.textContent =
        "Every event on Cumulus is public — join in seconds, no invite needed.";
    if (label) label.textContent = "Join Cumulus →";
    if (trust)
      trust.innerHTML =
        "<span>Everyone welcome</span><span>·</span><span>Zero host fees</span><span>·</span><span>Leave anytime</span>";
  }
  // Reset chip selections
  document
    .querySelectorAll(".host-cat-chip")
    .forEach((c) => c.classList.remove("active"));
}

function toggleHostCat(cat) {
  const btn = document.querySelector(`[data-hostcat="${CSS.escape(cat)}"]`);
  if (_hostCats.includes(cat)) {
    _hostCats = _hostCats.filter((c) => c !== cat);
    if (btn) btn.classList.remove("active");
  } else {
    _hostCats.push(cat);
    if (btn) btn.classList.add("active");
  }
}

function showLpSignup(mode) {
  const ov = document.getElementById("lp-signup-overlay");
  if (ov) {
    ov.classList.add("open");
    document.body.style.overflow = "hidden";
  }
  switchAuthMode(mode === "login" ? "login" : "signup");
}
function showLpLogin() {
  showLpSignup("login");
}
function closeLpSignup() {
  const ov = document.getElementById("lp-signup-overlay");
  if (ov) {
    ov.classList.remove("open");
    document.body.style.overflow = "";
  }
}
function lpUpdatePassName(val) {
  const el = document.getElementById("lp-pass-name-preview");
  if (el) el.textContent = val.trim() || "Your name here";
}
function gateErr(msg) {
  const el = document.getElementById("gate-field-error");
  if (el) {
    el.textContent = msg;
    el.classList.add("show");
  }
}
// Turn a raw auth error into human copy — never leak a non-message value
// (e.g. an empty "{}" body some mail providers return on a misconfigured
// SMTP send) to the sign-in screen or a toast.
function authErrMsg(err) {
  const s = typeof err === "string" ? err.trim() : "";
  if (/rate limit/i.test(s))
    return "Too many code requests just now — wait a minute, then try again.";
  if (!s || s === "unavailable" || s.charAt(0) === "{" || s.charAt(0) === "[")
    return "We couldn't send your code. Check your email address, or try again shortly.";
  return s;
}
// Persist a lightweight session snapshot so a reload can restore instantly and
// still boot the app if Supabase is momentarily unreachable.
function _cacheSession() {
  try {
    localStorage.setItem(
      "cumulus_session",
      JSON.stringify({
        userId: state.userId,
        profileId: state.profileId,
        name: state.profileName,
        email: state.profileEmail,
        specialBadges: state.specialBadges || [],
        theme: state.theme,
      }),
    );
  } catch (e) {}
}
function _restoreUserFromRow(existing) {
  state.userId = existing.id;
  state.profileId = existing.profile_id || generateUniqueId();
  state.profileName = existing.name;
  state.profileEmail = existing.email;
  state.specialBadges = existing.special_badges || [];
  // Theme is driven by the day/night cycle, not the saved profile value.
  if (existing.card_bio || existing.card_theme) {
    state.myCard = {
      name: existing.name,
      theme: existing.card_theme || "crimson",
      bio: existing.card_bio || "",
      interests: existing.card_interests || "",
      fact: existing.card_fact || "",
    };
  }
}

async function submitGate() {
  const isLogin = _authMode === "login";
  const email = (document.getElementById("gate-email").value || "").trim();
  const name = isLogin
    ? ""
    : (document.getElementById("gate-name").value || "").trim();
  const errEl = document.getElementById("gate-field-error");
  if (errEl) errEl.classList.remove("show");
  if (!isLogin && !name) {
    gateErr("Please add your name.");
    return;
  }
  if (!EMAIL_PATTERN.test(email)) {
    gateErr("Please enter a valid email address.");
    return;
  }

  // Host-specific validation (sign up only)
  let bizName = "",
    hostDesc = "",
    whyHost = "";
  if (!isLogin && _signupType === "host") {
    bizName = (document.getElementById("gate-biz-name")?.value || "").trim();
    hostDesc = (document.getElementById("gate-host-desc")?.value || "").trim();
    whyHost = (document.getElementById("gate-why-host")?.value || "").trim();
    if (!bizName) {
      gateErr("Please enter your venue or business name.");
      return;
    }
    if (_hostCats.length === 0) {
      gateErr("Please select at least one event type.");
      return;
    }
    if (!hostDesc) {
      gateErr("Please add a brief description of your events.");
      return;
    }
  }

  // ── Real auth, step 1: email the one-time code ──────────────────────────
  // We don't create/validate anything yet — name and host application both
  // happen in verifyGateCode() once we hold a real session (auth.uid()), so
  // RLS is satisfied and nothing can be forged client-side.
  const btn = document.querySelector(".lp-claim-btn");
  const label = () => btn && btn.querySelector("#gate-claim-label");
  const origLabel = label() ? label().textContent : "Continue →";
  if (btn) {
    btn.disabled = true;
    if (label()) label().textContent = "Sending code…";
  }

  const res = await authSendCode(email, isLogin ? {} : { name });
  if (btn) {
    btn.disabled = false;
    if (label()) label().textContent = origLabel;
  }
  if (!res.ok) {
    gateErr(authErrMsg(res.error));
    return;
  }

  // Stash everything the verify step needs, then swap to the code entry panel.
  _pendingAuth = {
    isLogin,
    name,
    email,
    signupType: _signupType,
    bizName,
    hostDesc,
    whyHost,
    hostCats: [..._hostCats],
  };
  showOtpStep(email);
}

// Pending onboarding context between "send code" and "verify code".
let _pendingAuth = null;
// Set when a brand-new member finishes OTP verification: enterApp() opens
// the card builder as a welcome step instead of dead loader time.
let _welcomeCardPending = false;

// ── Real auth, step 2: verify the code, then finalise onboarding ──────────
async function verifyGateCode() {
  const p = _pendingAuth;
  if (!p) return;
  const code = (document.getElementById("gate-otp-input")?.value || "").trim();
  if (!/^\d{6}$/.test(code)) {
    otpErr("Enter the 6-digit code from your email.");
    return;
  }

  const vbtn = document.getElementById("gate-otp-verify");
  const vlabel = vbtn && vbtn.querySelector(".lp-claim-btn-text");
  if (vbtn) {
    vbtn.disabled = true;
    if (vlabel) vlabel.textContent = "Verifying…";
  }
  const reEnable = () => {
    if (vbtn) {
      vbtn.disabled = false;
      if (vlabel) vlabel.textContent = "Verify & continue";
    }
  };

  const res = await authVerifyCode(p.email, code);
  if (!res.ok || !res.userId) {
    reEnable();
    otpErr(
      res.error === "unavailable"
        ? "Verification is temporarily unavailable — try again shortly."
        : "That code didn’t match. Check it and try again.",
    );
    return;
  }

  // We now hold a real session. The DB trigger has created the profile row.
  state.userId = res.userId;
  let profile = await loadUserProfile(res.userId);

  if (p.isLogin) {
    if (profile && profile.name) {
      _restoreUserFromRow(profile);
      state.profileEmail = profile.email || p.email;
    } else {
      state.profileName = (profile && profile.name) || p.email.split("@")[0];
      state.profileEmail = p.email;
      state.profileId = generateUniqueId();
    }
  } else {
    state.profileName =
      p.name || (profile && profile.name) || p.email.split("@")[0];
    state.profileEmail = p.email;
    state.profileId = (profile && profile.profile_id) || generateUniqueId();
    state.specialBadges = (profile && profile.special_badges) || [];
    // Persist the display name + public profile id (RLS: id = auth.uid()).
    try {
      await sb
        .from("users")
        .update({ name: state.profileName, profile_id: state.profileId })
        .eq("id", res.userId);
    } catch (e) {}
  }

  await localSet("cumulus_email", p.email);
  await localSet("prefs", JSON.stringify({ theme: state.theme }));
  _cacheSession();

  // Host application (sign up as host)
  if (!p.isLogin && p.signupType === "host") {
    _hostCats = p.hostCats || [];
    await _submitHostApplication({
      name: state.profileName,
      email: p.email,
      bizName: p.bizName,
      hostDesc: p.hostDesc,
      whyHost: p.whyHost,
    });
    _pendingAuth = null;
    return;
  }

  _welcomeCardPending = !p.isLogin;
  _pendingAuth = null;
  document.body.style.overflow = "";
  document.getElementById("gate-root").innerHTML = "";
  enterApp();
}

// Swap the gate form for the 6-digit code entry step (same modal).
function showOtpStep(email) {
  const modal = document.querySelector(".lp-signup-modal");
  if (!modal) return;
  let panel = document.getElementById("gate-otp-panel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "gate-otp-panel";
    modal.appendChild(panel);
  }
  panel.innerHTML = `
    <button class="gate-otp-back" onclick="backToGateForm()" aria-label="Back to sign-in form">←</button>
    <div class="lp-form-eyebrow">Check your inbox</div>
    <h3 class="lp-form-title">Enter your code</h3>
    <p class="lp-form-sub">We emailed a 6-digit code to <strong>${escapeHtml(email)}</strong>. It expires in a few minutes.</p>
    <div class="gate-field">
      <label class="gate-label" for="gate-otp-input">6-digit code</label>
      <input id="gate-otp-input" class="gate-input gate-otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" aria-describedby="gate-otp-error" oninput="this.value=this.value.replace(/\D/g,'')"/>
    </div>
    <p id="gate-otp-error" class="gate-field-error" role="alert"></p>
    <button id="gate-otp-verify" class="lp-claim-btn" onclick="verifyGateCode()">
      <span class="lp-claim-btn-text">Verify &amp; continue</span>
    </button>
    <button class="gate-otp-resend" onclick="resendGateCode()">Didn’t get it? Resend code</button>`;
  modal.classList.add("otp-active");
  const inp = document.getElementById("gate-otp-input");
  if (inp) {
    setTimeout(() => inp.focus(), 50);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") verifyGateCode();
    });
  }
}
function backToGateForm() {
  const m = document.querySelector(".lp-signup-modal");
  if (m) m.classList.remove("otp-active");
  const e = document.getElementById("gate-field-error");
  if (e) e.classList.remove("show");
}
function otpErr(msg) {
  const e = document.getElementById("gate-otp-error");
  if (e) {
    e.textContent = msg;
    e.classList.add("show");
  }
}
async function resendGateCode() {
  if (!_pendingAuth) return;
  const b = document.querySelector(".gate-otp-resend");
  if (b) {
    b.disabled = true;
    b.textContent = "Sending…";
  }
  const res = await authSendCode(
    _pendingAuth.email,
    _pendingAuth.isLogin ? {} : { name: _pendingAuth.name },
  );
  if (b) {
    b.disabled = false;
    b.textContent = res.ok ? "Code re-sent ✓" : "Resend failed — try again";
  }
}

async function _submitHostApplication({
  name,
  email,
  bizName,
  hostDesc,
  whyHost,
}) {
  const appPayload = {
    name,
    email,
    user_id: state.userId || null,
    business_name: bizName,
    event_types: _hostCats.join(","),
    description: hostDesc,
    why_host: whyHost,
    status: "pending",
    created_at: new Date().toISOString(),
  };

  // Try Supabase first; fall back to localStorage
  let savedToDb = false;
  try {
    const { error } = await sb.from("host_applications").insert(appPayload);
    if (!error) savedToDb = true;
  } catch (e) {}

  if (!savedToDb) {
    try {
      const apps = JSON.parse(
        localStorage.getItem("host_applications_local") || "[]",
      );
      apps.push({ ...appPayload, id: "local_" + Date.now() });
      localStorage.setItem("host_applications_local", JSON.stringify(apps));
    } catch (e) {}
  }

  // Show success screen inside modal
  const modal = document.querySelector(".lp-signup-modal");
  if (modal) {
    modal.innerHTML = `
      <div class="gate-host-success">
        <div class="gate-host-success-icon">🎉</div>
        <div class="gate-host-success-title">Application submitted!</div>
        <div class="gate-host-success-sub">Thanks ${escapeHtml(name)} — we'll review your application and get back to you within 48 hours. In the meantime, you can explore Cumulus as an attendee.</div>
        <button class="btn" style="width:100%;margin-top:24px;" onclick="document.body.style.overflow='';document.getElementById('gate-root').innerHTML='';enterApp();">Explore Cumulus →</button>
      </div>`;
  }
}
// Cloud loading transition removed — enter the app directly.

function enterApp() {
  document.getElementById("gate-root").innerHTML = "";
  document.body.style.overflow = "";
  const app = document.getElementById("app");
  app.style.display = "";
  // The 5 ambient .bg-blot decorations + grain overlay are landing-page-only
  // texture: position:fixed, 96px blur filter, continuously transform-
  // animating (42s loops) for the life of the tab. They were never scoped to
  // the gate/landing screen, so they kept compositing (blur recompute) behind
  // the ENTIRE app for the whole session — a steady background tax on every
  // view, not just the map. Hide them for good once real app UI is showing.
  document.body.classList.add("app-active");
  // Always boot to the map — never restore a stale tab from memory
  state.view = "browse";
  EVENTS.forEach((ev) => computeEventDates(ev));
  renderNav();
  renderView();
  // Load real data in the background without blocking
  initApp();

  // First-run: a brand-new member builds their pass while the map
  // initialises behind the overlay — the dead loader wait becomes the
  // account/card setup step. Returning logins go straight to the map.
  if (_welcomeCardPending) {
    _welcomeCardPending = false;
    const loader = document.getElementById("cumulus-loader");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 500);
    }
    openCardEditor(null, true);
  }

  // Safety net: the #cumulus-loader overlay is normally hidden by lmap's
  // "idle" event inside initLeaflet(), but that path never fires if Mapbox
  // GL JS's <script defer> hasn't finished loading yet when initLeaflet()
  // runs (it bails out silently with no retry), or if WebGL/the map fails
  // to initialize for any other reason (unsupported device, network error,
  // missing token). With no retry, the loader — which fully covers the
  // viewport at z-index 99999 — would otherwise stay stuck forever even
  // though the app underneath is fully interactive (it's pointer-events:
  // none). Force it gone after a generous timeout so a map failure never
  // blocks the rest of the app from being seen.
  setTimeout(() => {
    const loader = document.getElementById("cumulus-loader");
    if (loader) {
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 500);
    }
  }, 8000);
}

function openCardEditor(eventId, welcome) {
  cardEditorEventId = eventId ?? null;
  cardEditorWelcome = !!welcome;
  const ex = state.myCard;
  // Load extended fields from localStorage
  let ext = {};
  try {
    const r = localStorage.getItem("card_ext:" + state.profileName);
    if (r) ext = JSON.parse(r);
  } catch (e) {}
  let savedPhoto = "";
  try {
    savedPhoto = localStorage.getItem("card_photo:" + state.profileName) || "";
  } catch (e) {}
  const savedBg = ext.bgStyle || ex?.theme || "obsidian";
  const savedAccent = ext.accentColor || ex?.accentColor || "#FFCF33";
  const savedOpacity = ext.patternOpacity != null ? ext.patternOpacity : 0.35;
  cardDraft = ex
    ? {
        theme: savedBg,
        bgStyle: savedBg,
        accentColor: savedAccent,
        pattern: ext.pattern || "lightning",
        patternOpacity: savedOpacity,
        bio: ex.bio || "",
        interests: ex.interests || "",
        fact: ex.fact || "",
        motto: ext.motto || "",
        photo: savedPhoto,
        areas: ext.areas || [],
      }
    : {
        theme: "obsidian",
        bgStyle: "obsidian",
        accentColor: "#FFCF33",
        pattern: "constellation",
        patternOpacity: 0.35,
        bio: "",
        interests: "",
        fact: "",
        motto: "",
        photo: savedPhoto,
        areas: ext.areas || [],
      };
  renderCardEditor();
}
function captureDraftFields() {
  const b = document.getElementById("card-bio");
  if (b) cardDraft.bio = b.value;
  const i = document.getElementById("card-interests");
  if (i) cardDraft.interests = i.value;
  const f = document.getElementById("card-fact");
  if (f) cardDraft.fact = f.value;
  const m = document.getElementById("card-motto");
  if (m) cardDraft.motto = m.value;
}
function handleCardPhoto(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    // Resize to max 480px to keep localStorage size manageable
    const img = new Image();
    img.onload = function () {
      const MAX = 480;
      let w = img.width,
        h = img.height;
      if (w > h) {
        if (w > MAX) {
          h = Math.round((h * MAX) / w);
          w = MAX;
        }
      } else {
        if (h > MAX) {
          w = Math.round((w * MAX) / h);
          h = MAX;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      cardDraft.photo = canvas.toDataURL("image/jpeg", 0.78);
      // Update zone UI without full re-render
      const zone = document.getElementById("ce-photo-zone");
      if (zone)
        zone.innerHTML = `<input type="file" id="ce-photo-input" accept="image/*" onchange="handleCardPhoto(this)"/>
        <img src="${cardDraft.photo}" class="ce-photo-about-img" id="ce-photo-img" alt=""/>
        <div class="ce-photo-about-lbl">Tap to change<span>Shows in your card corner</span></div>
        <button class="ce-photo-remove" style="margin-left:auto;font-size:10px;" onclick="event.stopPropagation();removeCardPhoto()">Remove</button>`;
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}
function removeCardPhoto() {
  cardDraft.photo = "";
  try {
    localStorage.removeItem("card_photo:" + state.profileName);
  } catch (e) {}
  const zone = document.getElementById("ce-photo-zone");
  if (zone)
    zone.innerHTML = `<input type="file" id="ce-photo-input" accept="image/*" onchange="handleCardPhoto(this)"/>
    <div style="width:48px;height:48px;border-radius:50%;background:var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="opacity:0.45;"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
    </div>
    <div class="ce-photo-about-lbl">Add photo<span>Shows in your card corner</span></div>`;
}
function selectCardTheme(id) {
  captureDraftFields();
  cardDraft.theme = id;
  cardDraft.bgStyle = id;
  updateCardPreview();
  document
    .querySelectorAll(".cc-style-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.id === id));
}
function selectCardAccentColor(hex, id) {
  captureDraftFields();
  cardDraft.accentColor = hex;
  updateCardPreview();
  document
    .querySelectorAll(".cc-swatch")
    .forEach((b) => b.classList.toggle("active", b.dataset.id === id));
}
function selectCardPattern(pat) {
  captureDraftFields();
  cardDraft.pattern = pat;
  updateCardPreview();
  document
    .querySelectorAll(".cc-pattern-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.pat === pat));
}
function setPatternOpacity(val) {
  cardDraft.patternOpacity = parseFloat(val);
  const pat = document.getElementById("ce-pattern");
  if (pat) pat.style.opacity = cardDraft.patternOpacity;
  const lbl = document.getElementById("ce-opacity-val");
  if (lbl) lbl.textContent = Math.round(cardDraft.patternOpacity * 100) + "%";
}
function toggleCardArea(area) {
  const idx = cardDraft.areas.indexOf(area);
  if (idx !== -1) {
    cardDraft.areas.splice(idx, 1);
  } else if (cardDraft.areas.length < 3) {
    cardDraft.areas.push(area);
  }
  // Patch pills without re-render
  document.querySelectorAll(".ce-area-pill").forEach((btn) => {
    const a = btn.dataset.area;
    const sel = cardDraft.areas.includes(a);
    btn.classList.toggle("active", sel);
    btn.disabled = !sel && cardDraft.areas.length >= 3;
  });
  const hint = document.getElementById("ce-area-hint");
  if (hint)
    hint.textContent = `${cardDraft.areas.length}/3 selected${cardDraft.areas.length === 3 ? " · tap to deselect" : ""}`;
  const det = document.getElementById("ce-preview-detail");
  if (det)
    det.textContent = cardDraft.areas.length
      ? cardDraft.areas.join(" · ")
      : "London Community Member";
}
function updateCardPreview() {
  const t = resolveCardColors(
    cardDraft.bgStyle || cardDraft.theme,
    cardDraft.accentColor,
  );
  const el = document.getElementById("ce-live-card");
  if (!el) return;
  el.style.background = t.bg;
  el.style.color = t.text;
  el.style.borderColor = t.border;
  const pat = document.getElementById("ce-pattern");
  if (pat) {
    pat.style.color = t.accent;
    pat.style.opacity = cardDraft.patternOpacity || 0.18;
    pat.innerHTML = CARD_PATTERNS[cardDraft.pattern] || "";
  }
  const nm = document.getElementById("ce-preview-name");
  if (nm) nm.style.color = t.text;
  const ac = document.getElementById("ce-preview-accent");
  if (ac) ac.style.background = t.accent;
  const bio = document.getElementById("card-bio");
  const pbio = document.getElementById("ce-preview-bio");
  if (pbio && bio) {
    pbio.textContent = bio.value || "Tell your story…";
    pbio.style.color = t.textSoft;
  }
  const motto = document.getElementById("card-motto");
  const pmotto = document.getElementById("ce-preview-motto");
  if (pmotto && motto) {
    pmotto.textContent = motto.value ? `"${motto.value}"` : "";
    pmotto.style.color = t.accent;
  }
  const tags = document.getElementById("ce-preview-tags");
  const int = document.getElementById("card-interests");
  if (tags && int) {
    const items = (int.value || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 5);
    tags.innerHTML = items
      .map(
        (s) =>
          `<span class="ce-preview-tag" style="border-color:${t.accent};color:${t.text};">${escapeHtml(s)}</span>`,
      )
      .join("");
  }
  const lbl = document.getElementById("ce-preview-label");
  if (lbl) lbl.style.color = t.textSoft;
  const det = document.getElementById("ce-preview-detail");
  if (det) {
    det.style.color = t.textSoft;
    det.textContent = cardDraft.areas.length
      ? cardDraft.areas.join(" · ")
      : "London Community Member";
  }
  const wm = document.getElementById("ce-preview-wm");
  if (wm) wm.style.color = t.accent;
  const ph = document.getElementById("ce-preview-photo");
  if (ph && ph.tagName === "IMG") {
    ph.style.borderColor = t.accent;
  }
}
function renderCardEditor() {
  const allowSkip = true;
  const t = resolveCardColors(
    cardDraft.bgStyle || cardDraft.theme,
    cardDraft.accentColor,
  );

  // Build color swatch grid by color family
  const colorFamilies = [
    {
      label: "Blues",
      ids: [
        "sky",
        "blue",
        "cobalt-ac",
        "sapphire",
        "navy",
        "ice",
        "periwinkle",
        "cerulean",
        "steel",
        "powder",
        "azure",
        "denim-ac",
        "ocean-ac",
        "cobalt-light",
        "powder-deep",
      ],
    },
    {
      label: "Purples",
      ids: [
        "violet",
        "purple",
        "lavender",
        "indigo",
        "grape",
        "mauve",
        "lilac",
        "heather",
        "amethyst-ac",
        "byzantium",
        "wisteria",
        "aubergine-ac",
        "orchid-ac",
      ],
    },
    {
      label: "Pinks & Reds",
      ids: [
        "hot-pink",
        "rose-ac",
        "crimson-ac",
        "coral",
        "blush-ac",
        "magenta",
        "scarlet",
        "flamingo",
        "salmon",
        "ruby",
        "candy",
        "cherry-ac",
        "bubblegum",
        "cerise",
        "carnation",
      ],
    },
    {
      label: "Oranges & Yellows",
      ids: [
        "amber",
        "gold",
        "tangerine",
        "peach",
        "copper-ac",
        "honey",
        "sunshine",
        "butter",
        "saffron",
        "apricot",
        "mustard",
        "burnt-orange",
        "lemon",
        "goldenrod",
      ],
    },
    {
      label: "Greens",
      ids: [
        "emerald",
        "mint",
        "jade-ac",
        "sage-ac",
        "lime",
        "teal",
        "seafoam",
        "moss",
        "forest-ac",
        "olive",
        "lime-green",
        "pine-green",
        "viridian",
        "sage-green",
        "hunter",
      ],
    },
    {
      label: "Warm Tones",
      ids: [
        "terracotta",
        "brick",
        "rust",
        "bronze",
        "hazel",
        "maple",
        "cinnamon",
      ],
    },
    {
      label: "Cool Tones",
      ids: [
        "slate-blue-ac",
        "arctic-ac",
        "powder-blue",
        "muted-teal",
        "seafoam-deep",
        "mint-fresh",
        "glacier",
      ],
    },
    {
      label: "Neutrals",
      ids: [
        "white",
        "silver",
        "platinum",
        "champagne",
        "sand",
        "slate-ac",
        "warm-white",
        "oyster",
        "stone",
        "pewter",
        "graphite-ac",
      ],
    },
    { label: "Metallics", ids: ["gold-foil", "rose-gold-ac", "neon-cyan"] },
  ];
  const colorSwatchesHtml = colorFamilies
    .map(
      (fam) => `
    <div class="cc-family-label">${fam.label}</div>
    <div class="cc-color-grid">
      ${fam.ids
        .map((cid) => {
          const c = CARD_ACCENT_COLORS.find((x) => x.id === cid);
          if (!c) return "";
          const isActive = cardDraft.accentColor === c.hex;
          return `<button class="cc-swatch${isActive ? " active" : ""}" data-id="${c.id}" title="${c.name}"
          style="background:${c.hex};"
          onclick="selectCardAccentColor('${c.hex}','${c.id}')">
          <span class="cc-swatch-label">${c.name}</span>
        </button>`;
        })
        .join("")}
    </div>`,
    )
    .join("");

  // Build background style grid
  const styleFamilies = [
    {
      label: "Dark Tones",
      ids: [
        "midnight",
        "obsidian",
        "charcoal",
        "slate",
        "ink",
        "abyss",
        "noir",
        "volcanic",
        "cosmos",
        "carbon",
        "graphite",
        "pitch",
        "nightfall",
        "anthracite",
        "void",
      ],
    },
    {
      label: "Light Tones",
      ids: [
        "cloud",
        "pearl",
        "cream",
        "cotton",
        "frost",
        "linen-bg",
        "chalk",
        "mist",
        "blush",
        "sage-light",
        "snow",
        "ivory",
        "eggshell",
        "lilac-mist",
        "peach-mist",
      ],
    },
    {
      label: "Rich & Deep",
      ids: [
        "ocean",
        "forest",
        "cherry",
        "cobalt",
        "jade",
        "amber-dark",
        "plum",
        "crimson",
        "denim",
        "copper-bg",
        "burgundy",
        "pine",
        "aubergine",
        "mahogany",
        "steel-dark",
      ],
    },
    {
      label: "Gradient Moods",
      ids: [
        "aurora",
        "sunset",
        "twilight",
        "deepspace",
        "summer",
        "arctic",
        "jungle",
        "lagoon",
        "fire",
        "violet-storm",
        "ember",
        "northern-lights",
        "galaxy",
        "bloom",
        "citrus",
        "rose-gold",
        "forest-floor",
        "prism",
        "vapor",
        "mango-glow",
        "midnight-ocean",
        "magma",
        "royal-purple",
        "deep-teal",
        "spring",
        "arctic-dawn",
        "amethyst",
        "deep-rose",
        "peach-glow",
        "forest-night",
      ],
    },
    {
      label: "Cloud Classics",
      ids: [
        "storm",
        "nimbus",
        "electric",
        "thunder",
        "cirrus",
        "dusk",
        "overcast",
        "haze",
        "squall",
        "altitude",
      ],
    },
    {
      label: "Vintage & Warm",
      ids: [
        "sepia",
        "warm-stone",
        "terracotta-bg",
        "parchment",
        "antique",
        "washed-denim",
        "dusty-rose",
        "harvest",
        "cedar",
        "tobacco",
        "wheat",
        "clay",
        "bourbon",
        "sand-dune",
        "amber-cream",
      ],
    },
  ];
  const styleGridHtml = styleFamilies
    .map(
      (fam) => `
    <div class="cc-family-label">${fam.label}</div>
    <div class="cc-style-grid">
      ${fam.ids
        .map((sid) => {
          const s = CARD_BG_STYLES.find((x) => x.id === sid);
          if (!s) return "";
          const isActive = (cardDraft.bgStyle || cardDraft.theme) === s.id;
          const nameColor = s.dark
            ? "rgba(255,255,255,0.85)"
            : "rgba(0,0,0,0.72)";
          return `<button class="cc-style-btn${isActive ? " active" : ""}" data-id="${s.id}"
          onclick="selectCardTheme('${s.id}')" title="${s.name}">
          <div class="cc-style-preview" style="background:${s.bg};">
            <span class="cc-style-name" style="color:${nameColor};">${s.name}</span>
          </div>
        </button>`;
        })
        .join("")}
    </div>`,
    )
    .join("");

  // Pattern grid — vibrant (opacity controlled by slider)
  const patternOptions = [
    { id: "none", label: "✕  None" },
    { id: "lines", label: "// Lines" },
    { id: "mesh", label: "⊞ Mesh" },
    { id: "dots", label: "· Dots" },
    { id: "grid", label: "⊟ Grid" },
    { id: "diagonal", label: "⟋ Diagonal" },
    { id: "zigzag", label: "⟨⟩ Zigzag" },
    { id: "dashes", label: "— Dashes" },
    { id: "halftone", label: "⠿ Halftone" },
    { id: "hexgrid", label: "⬡ Hex" },
    { id: "topo", label: "⌇ Topo" },
    { id: "triangles", label: "△ Triangles" },
    { id: "constellation", label: "✦ Stars" },
    { id: "blueprint", label: "⊕ Blueprint" },
    { id: "waves", label: "∿ Waves" },
    { id: "marble", label: "⌁ Marble" },
    { id: "sparkle", label: "✴ Sparkle" },
    { id: "circuits", label: "⊛ Circuit" },
    { id: "plus", label: "+ Plus" },
    { id: "rings", label: "◎ Rings" },
    { id: "sunburst", label: "☀ Rays" },
    { id: "petals", label: "❀ Petals" },
    { id: "cobweb", label: "⊙ Cobweb" },
    { id: "linen", label: "▦ Weave" },
  ];
  const patternTabHtml = `<div class="cc-pattern-grid">
    ${patternOptions.map((p) => `<button class="cc-pattern-btn${cardDraft.pattern === p.id ? " active" : ""}" data-pat="${p.id}" onclick="selectCardPattern('${p.id}')">${p.label}</button>`).join("")}
  </div>`;

  const areaPillsHtml = LONDON_AREAS.map((a) => {
    const sel = cardDraft.areas.includes(a);
    const disabled = !sel && cardDraft.areas.length >= 3;
    return `<button class="ce-area-pill${sel ? " active" : ""}" data-area="${escapeHtml(a)}" onclick="toggleCardArea('${escapeHtml(a)}')" ${disabled ? "disabled" : ""}>${escapeHtml(a)}</button>`;
  }).join("");

  const liveCardHtml = `<div class="ce-live-card" id="ce-live-card" style="background:${t.bg};border-color:${t.border};">
    <div class="ce-pattern" id="ce-pattern" style="color:${t.accent};opacity:${cardDraft.patternOpacity || 0.35};">${CARD_PATTERNS[cardDraft.pattern] || ""}</div>
    ${
      cardDraft.photo
        ? `<img src="${cardDraft.photo}" id="ce-preview-photo" style="position:absolute;top:0;right:0;width:56px;height:56px;object-fit:cover;border-radius:0 6px 0 10px;border-left:1.5px solid ${t.accent};border-bottom:1.5px solid ${t.accent};z-index:3;" alt=""/>`
        : `<div id="ce-preview-photo"></div>`
    }
    <div class="ce-card-shine"></div>
    <div class="ce-card-body">
      <div class="ce-card-top-row">
        <div>
          <div class="ce-preview-label" id="ce-preview-label" style="color:${t.textSoft};">// Cumulus Pass</div>
          <div class="ce-preview-accent" id="ce-preview-accent" style="background:${t.accent};"></div>
        </div>
      </div>
      <div class="ce-preview-name" id="ce-preview-name" style="color:${t.text};">${escapeHtml(state.profileName || "Your Name")}</div>
      <div class="ce-preview-motto" id="ce-preview-motto" style="color:${t.accent};">${cardDraft.motto ? `"${escapeHtml(cardDraft.motto)}"` : ""}</div>
      <div class="ce-preview-bio" id="ce-preview-bio" style="color:${t.textSoft};">${cardDraft.bio || "Tell your story…"}</div>
      <div class="ce-preview-tags" id="ce-preview-tags">
        ${(cardDraft.interests || "")
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
          .slice(0, 5)
          .map(
            (s) =>
              `<span class="ce-preview-tag" style="border-color:${t.accent};color:${t.text};">${escapeHtml(s)}</span>`,
          )
          .join("")}
      </div>
      <div class="ce-preview-detail" id="ce-preview-detail" style="color:${t.textSoft};">${cardDraft.areas.length ? cardDraft.areas.join(" · ") : "London Community Member"}</div>
    </div>
    <div class="ce-preview-wm" id="ce-preview-wm" style="color:${t.accent};">CU</div>
  </div>`;

  document.getElementById("card-editor-root").innerHTML = `
  <div class="ce-overlay">

    <!-- Top bar -->
    <div class="ce-topbar">
      <button class="ce-topbar-back" onclick="closeCardEditor()">←</button>
      <div class="ce-topbar-title">${cardEditorWelcome ? "Welcome — build your pass" : "Card builder"}</div>
      <div style="display:flex;gap:6px;align-items:center;">
        ${allowSkip ? `<button class="ce-topbar-skip" onclick="skipCard()">Skip</button>` : cardEditorWelcome ? `<button class="ce-topbar-skip" onclick="closeCardEditor()">Skip for now</button>` : ""}
        <button class="ce-topbar-save" onclick="saveCard()">Save</button>
      </div>
    </div>
    ${cardEditorWelcome ? `<div class="ce-welcome-note">This is the pass you'll carry to every event — make it yours while the map warms up behind. You can change it any time from your Pass.</div>` : ""}

    <!-- Split: preview | controls -->
    <div class="ce-shell">

      <!-- LEFT — live card preview only -->
      <div class="ce-left">
        <div class="ce-card-wrap">
          ${liveCardHtml}
        </div>
        <div class="ce-spin-hint">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"/></svg>
          Drag to spin
        </div>
        <div class="ce-left-actions">
          <button class="btn" style="flex:1;" onclick="saveCard()">Save card</button>
          ${
            allowSkip
              ? `<button class="btn btn-outline" onclick="skipCard()">Skip</button>`
              : `<button class="btn btn-outline" onclick="closeCardEditor()">${cardEditorWelcome ? "Skip for now" : "Cancel"}</button>`
          }
        </div>
      </div>

      <!-- RIGHT — tabbed controls -->
      <div class="ce-right">

        <!-- Tab bar: Card Base | Pattern | Accent | About You -->
        <div class="ce-tabs-bar">
          <button class="ce-tab-btn active" data-tab="base"    onclick="switchCeTab('base')">Card Base</button>
          <button class="ce-tab-btn"        data-tab="pattern" onclick="switchCeTab('pattern')">Pattern</button>
          <button class="ce-tab-btn"        data-tab="accent"  onclick="switchCeTab('accent')">Accent</button>
          <button class="ce-tab-btn"        data-tab="about"   onclick="switchCeTab('about')">About You</button>
        </div>

        <!-- ─ CARD BASE TAB ─ -->
        <div class="ce-tab-panel active" data-tab="base">
          <div class="ce-section">
            <div class="ce-section-label">Card background</div>
            ${styleGridHtml}
          </div>
        </div>

        <!-- ─ PATTERN TAB ─ -->
        <div class="ce-tab-panel" data-tab="pattern">
          <div class="ce-section">
            <div class="ce-section-label">Pattern overlay</div>
            ${patternTabHtml}
          </div>
          <div class="ce-section">
            <div class="ce-section-label">Pattern intensity</div>
            <div class="ce-intensity-bar">
              <input type="range" id="ce-opacity-global" min="0.02" max="0.85" step="0.01"
                value="${cardDraft.patternOpacity || 0.35}"
                style="flex:1;accent-color:var(--accent);cursor:pointer;"
                oninput="setPatternOpacity(this.value)"/>
              <span class="ce-intensity-pct" id="ce-opacity-val">${Math.round((cardDraft.patternOpacity || 0.35) * 100)}%</span>
            </div>
          </div>
        </div>

        <!-- ─ ACCENT TAB ─ -->
        <div class="ce-tab-panel" data-tab="accent">
          <div class="ce-section">
            <div class="ce-section-label">Highlight colour</div>
            ${colorSwatchesHtml}
          </div>
        </div>

        <!-- ─ ABOUT YOU TAB ─ -->
        <div class="ce-tab-panel" data-tab="about">

          <div class="ce-section">
            <div class="ce-section-label">Your photo <span class="ce-optional">optional</span></div>
            <div class="ce-photo-about" id="ce-photo-zone">
              <input type="file" id="ce-photo-input" accept="image/*" onchange="handleCardPhoto(this)"/>
              ${
                cardDraft.photo
                  ? `<img src="${cardDraft.photo}" class="ce-photo-about-img" id="ce-photo-img" alt=""/>
                  <div class="ce-photo-about-lbl">Tap to change<span>Shows in your card corner</span></div>
                  <button class="ce-photo-remove" style="margin-left:auto;font-size:10px;" onclick="event.stopPropagation();removeCardPhoto()">Remove</button>`
                  : `<div style="width:48px;height:48px;border-radius:50%;background:var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="opacity:0.45;"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
                  </div>
                  <div class="ce-photo-about-lbl">Add photo<span>Shows in your card corner</span></div>`
              }
            </div>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Your motto <span class="ce-optional">optional · 60 chars</span></div>
            <input id="card-motto" class="ce-input" placeholder="e.g. Always up for something new" value="${escapeHtml(cardDraft.motto)}" oninput="updateCardPreview()" autocomplete="off" maxlength="60"/>
            <div class="ce-char-hint">Shown in italic under your name</div>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">About you <span class="ce-optional">optional</span></div>
            <textarea id="card-bio" class="ce-input ce-textarea" rows="3" placeholder="What brings you to events like these?" oninput="updateCardPreview()">${escapeHtml(cardDraft.bio)}</textarea>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Interests <span class="ce-optional">comma separated</span></div>
            <input id="card-interests" class="ce-input" placeholder="e.g. live music, board games, hiking" value="${escapeHtml(cardDraft.interests)}" oninput="updateCardPreview()" autocomplete="off"/>
            <div class="ce-char-hint">Shown as tags on your card</div>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Fun fact <span class="ce-optional">optional</span></div>
            <input id="card-fact" class="ce-input" placeholder="e.g. once got lost in IKEA for 3 hours" value="${escapeHtml(cardDraft.fact)}" oninput="updateCardPreview()" autocomplete="off"/>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Your local spots <span class="ce-optional">pick up to 3</span></div>
            <div class="ce-char-hint" id="ce-area-hint" style="margin-bottom:14px;">${cardDraft.areas.length}/3 selected${cardDraft.areas.length === 3 ? " — tap any to deselect" : ""}</div>
            <div class="ce-area-grid" id="ce-area-grid">${areaPillsHtml}</div>
          </div>

          <div class="ce-save-row">
            <button class="btn" style="flex:1;" onclick="saveCard()">Save card</button>
            ${allowSkip ? `<button class="btn btn-outline" onclick="skipCard()">Skip</button>` : `<button class="btn btn-outline" onclick="closeCardEditor()">Cancel</button>`}
          </div>

        </div>

      </div><!-- /ce-right -->
    </div><!-- /ce-shell -->
  </div>`;
  // 3D drag-to-spin with spring return
  const liveCard = document.getElementById("ce-live-card");
  liveCard.style.cursor = "grab";
  let _ceSpin = false,
    _ceStartX = 0,
    _ceStartY = 0,
    _cePrevX = 0,
    _cePrevY = 0;
  let _ceRotY = 0,
    _ceRotX = 0,
    _ceVelY = 0,
    _ceVelX = 0,
    _ceRaf = 0;
  function _ceSetT(ry, rx) {
    liveCard.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
  }
  function _ceSpring() {
    _ceVelY = _ceVelY * 0.82 - _ceRotY * 0.12;
    _ceVelX = _ceVelX * 0.82 - _ceRotX * 0.12;
    _ceRotY += _ceVelY;
    _ceRotX += _ceVelX;
    _ceSetT(_ceRotY, _ceRotX);
    if (
      Math.abs(_ceRotY) < 0.1 &&
      Math.abs(_ceRotX) < 0.1 &&
      Math.abs(_ceVelY) < 0.1 &&
      Math.abs(_ceVelX) < 0.1
    ) {
      _ceRotY = 0;
      _ceRotX = 0;
      _ceVelY = 0;
      _ceVelX = 0;
      _ceSetT(0, 0);
    } else {
      _ceRaf = requestAnimationFrame(_ceSpring);
    }
  }
  liveCard.addEventListener("pointerdown", (e) => {
    _ceSpin = true;
    _ceStartX = _cePrevX = e.clientX;
    _ceStartY = _cePrevY = e.clientY;
    _ceRotY = 0;
    _ceRotX = 0;
    _ceVelY = 0;
    _ceVelX = 0;
    cancelAnimationFrame(_ceRaf);
    liveCard.setPointerCapture(e.pointerId);
    liveCard.style.cursor = "grabbing";
    e.preventDefault();
  });
  liveCard.addEventListener("pointermove", (e) => {
    if (!_ceSpin) return;
    const dx = e.clientX - _ceStartX,
      dy = e.clientY - _ceStartY;
    _ceVelY = (e.clientX - _cePrevX) * 0.18;
    _ceVelX = -(e.clientY - _cePrevY) * 0.12;
    _cePrevX = e.clientX;
    _cePrevY = e.clientY;
    _ceRotY = dx * 0.18;
    _ceRotX = -dy * 0.12;
    _ceSetT(_ceRotY, _ceRotX);
  });
  const _ceEnd = () => {
    if (!_ceSpin) return;
    _ceSpin = false;
    liveCard.style.cursor = "grab";
    _ceRaf = requestAnimationFrame(_ceSpring);
  };
  liveCard.addEventListener("pointerup", _ceEnd);
  liveCard.addEventListener("pointercancel", _ceEnd);
}
function switchCeTab(tab) {
  captureDraftFields();
  document
    .querySelectorAll(".ce-tab-btn")
    .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  document
    .querySelectorAll(".ce-tab-panel")
    .forEach((p) => p.classList.toggle("active", p.dataset.tab === tab));
}
async function saveCard() {
  captureDraftFields();
  const card = {
    name: state.profileName,
    theme: cardDraft.bgStyle || cardDraft.theme,
    bgStyle: cardDraft.bgStyle || cardDraft.theme,
    accentColor: cardDraft.accentColor || "#FFCF33",
    bio: cardDraft.bio.trim(),
    interests: cardDraft.interests.trim(),
    fact: cardDraft.fact.trim(),
  };
  state.myCard = card;
  // Save extended fields to localStorage
  try {
    localStorage.setItem(
      "card_ext:" + state.profileName,
      JSON.stringify({
        pattern: cardDraft.pattern,
        patternOpacity: cardDraft.patternOpacity,
        motto: cardDraft.motto,
        areas: cardDraft.areas,
        accentColor: cardDraft.accentColor,
        bgStyle: cardDraft.bgStyle,
      }),
    );
  } catch (e) {}
  // Save photo separately (can be large)
  try {
    if (cardDraft.photo)
      localStorage.setItem("card_photo:" + state.profileName, cardDraft.photo);
    else localStorage.removeItem("card_photo:" + state.profileName);
  } catch (e) {}
  if (state.userId) {
    await sb
      .from("users")
      .update({
        card_theme: card.theme,
        card_bio: card.bio,
        card_interests: card.interests,
        card_fact: card.fact,
      })
      .eq("id", state.userId);
  }
  document.getElementById("card-editor-root").innerHTML = "";
  renderNav();
  renderView();
}
function skipCard() {
  document.getElementById("card-editor-root").innerHTML = "";
}
function closeCardEditor() {
  document.getElementById("card-editor-root").innerHTML = "";
}

async function initApp() {
  // Background data load — enterApp() rendered the shell already; this fills it
  // with real events from Supabase without blocking the cloud animation. With no
  // seed data, the map/list show empty states until this resolves (or stay empty
  // if there genuinely are no events yet).
  await loadRealEvents();

  await loadGeocodeCache();
  EVENTS.forEach((ev) => {
    if (needsGeocode(ev) && geocodeCache[ev.address]) {
      ev.lat = geocodeCache[ev.address].lat;
      ev.lon = geocodeCache[ev.address].lon;
    }
  });
  if (mapboxConfigured()) resolveEventLocations();

  await loadMyTickets();
  await loadAllRsvps();
  await checkSquadClaim();

  if (!state.myCard) {
    const cardRaw = await localGet(`card:${state.profileName}`);
    if (cardRaw) {
      try {
        state.myCard = JSON.parse(cardRaw);
      } catch (e) {}
    }
  }

  // Refresh view quietly once real data is in (still on map = update markers)
  if (state.view === "browse") renderView();
}

// ── Supabase data loaders ─────────────────────────────────────────────────

async function loadRealEvents() {
  const { data } = await sb
    .from("events")
    .select("*")
    .order("start_time", { ascending: true });
  if (!data) return;
  data.forEach((ev) => {
    // Idempotent: skip any event already loaded (e.g. one just created locally)
    if (EVENTS.find((e) => e.id === ev.id)) return;
    const mapped = {
      id: ev.id,
      title: ev.title,
      category: ev.category,
      host: ev.host_name,
      hostId: ev.host_id,
      venue: ev.venue,
      area: ev.area,
      address: ev.address,
      lat: ev.lat,
      lon: ev.lon,
      startTime: ev.start_time,
      endTime: ev.end_time,
      desc: ev.description,
      capacity: ev.capacity,
      price: ev.price || 0,
      nightShotUrl: ev.night_shot_url || null,
    };
    computeEventDates(mapped);
    EVENTS.push(mapped);
  });
  // DEV-ONLY VISUAL FIXTURE — never runs outside localhost, and never runs if
  // the real backend actually returned rows. Lets the design-pass work see
  // pins/cards/detail views without needing a live Supabase seed. Safe to
  // delete this call + loadDevFixtureEvents() below any time; it is not
  // wired to any production path (GH Pages / cumulusapp.co never match the
  // hostname check).
  if (
    EVENTS.length === 0 &&
    /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ) {
    loadDevFixtureEvents();
  }
}

// DEV-ONLY: synthetic events for local visual QA. See comment above the call
// site in loadRealEvents(). Not loaded from any file shipped differently to
// prod — this function simply never executes off localhost.
function loadDevFixtureEvents() {
  const now = Date.now();
  const hrs = (n) => new Date(now + n * 3600000).toISOString();
  const fixtures = [
    {
      id: "dev-1",
      title: "Rooftop Jazz & Wine",
      category: "Live Music",
      host: "Nightjar Sessions",
      venue: "The Curtain Rooftop",
      area: "Shoreditch",
      address: "45 Curtain Rd, London EC2A 3PT",
      lat: 51.5259,
      lon: -0.0813,
      startTime: hrs(3),
      endTime: hrs(6),
      desc: "An intimate rooftop set as the sun goes down over Shoreditch — small-batch wine, low light, a five-piece band.",
      capacity: 60,
      price: 12,
    },
    {
      id: "dev-2",
      title: "Community Board Game Night",
      category: "Board Games",
      host: "Dice & Slice",
      venue: "Draughts Café",
      area: "Hackney",
      address: "337 Acton Mews, London E8 4EA",
      lat: 51.5361,
      lon: -0.0731,
      startTime: hrs(20),
      endTime: hrs(23),
      desc: "Drop-in board games with a huge library on hand — bring a friend or come solo, tables are shared.",
      capacity: 40,
      price: 0,
    },
    {
      id: "dev-3",
      title: "Sunrise Run Club",
      category: "Wellness & Outdoors",
      host: "Thames Path Runners",
      venue: "South Bank",
      area: "Southbank",
      address: "Queen's Walk, London SE1 9PP",
      lat: 51.5054,
      lon: -0.1173,
      startTime: hrs(-1),
      endTime: hrs(2),
      desc: "A 5k along the river, all paces welcome, coffee after at the usual spot.",
      capacity: 25,
      price: 0,
    },
    {
      id: "dev-4",
      title: "Life Drawing: Open Studio",
      category: "Creative",
      host: "Studio Ochre",
      venue: "Ochre Studio",
      area: "Peckham",
      address: "133 Copeland Rd, London SE15 3SN",
      lat: 51.4729,
      lon: -0.0663,
      startTime: hrs(28),
      endTime: hrs(31),
      desc: "Untutored life drawing, all levels, materials provided. Bring your own board if you have one.",
      capacity: 18,
      price: 8,
    },
    {
      id: "dev-5",
      title: "Neighbourhood Supper Club",
      category: "Food & Drink",
      host: "Table for Twelve",
      venue: "The Ivy House Kitchen",
      area: "Nunhead",
      address: "40 Stuart Rd, London SE15 3BE",
      lat: 51.4593,
      lon: -0.0568,
      startTime: hrs(50),
      endTime: hrs(53),
      desc: "A long-table supper cooked by a rotating neighbourhood host — this week, a seasonal British menu.",
      capacity: 12,
      price: 28,
    },
  ];
  fixtures.forEach((ev) => {
    computeEventDates(ev);
    EVENTS.push(ev);
  });
}

async function loadAllRsvps() {
  const { data } = await sb.from("rsvps").select("event_id,user_name");
  if (!data) return;
  data.forEach((r) => {
    if (!state.rsvps[r.event_id]) state.rsvps[r.event_id] = [];
    if (!state.rsvps[r.event_id].includes(r.user_name))
      state.rsvps[r.event_id].push(r.user_name);
  });
}


function renderNav() {
  const activeTab = [
    "tickets",
    "my-tickets",
    "book",
    "checkout",
    "confirmed",
    "owner-dash",
    "review",
    "achievements",
  ].includes(state.view)
    ? "profile"
    : ["calendar", "calendar-day"].includes(state.view)
      ? "calendar"
      : state.view;
  const navContainer = document.getElementById("nav-container");

  // First render: build the full DOM once
  if (!navContainer.querySelector(".bottom-nav")) {
    const icons = {
      browse: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z"/></svg>`,
      tickets: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4V8Z"/><path d="M14 6v12" stroke-dasharray="2 2.5"/></svg>`,
      calendar: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/></svg>`,
      host: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><circle cx="12" cy="12" r="9"/><path d="M12 8v8M8 12h8"/></svg>`,
      profile: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6"/></svg>`,
      review: `<svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" style="fill:none"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 3.5h6v2H9z"/><path d="M8.5 13l2 2 4-4.5"/></svg>`,
    };
    const NAV_TABS = [
      { label: "Explore", v: "browse", action: "goBrowse()" },
      { label: "Host", v: "host", action: "navStack=[];openHost()" },
      {
        label: "Calendar",
        v: "calendar",
        action: "navStack=[];openCalendar()",
      },
      { label: "Profile", v: "profile", action: "navStack=[];openProfile()" },
    ];
    navContainer.innerHTML = `
      <div class="top-bar">
        <div class="logo-wrap" onclick="goBrowse()" role="button" tabindex="0" aria-label="Cumulus home">${BLOT_SVG}<span class="logo hide-mobile">Cumulus</span></div>
        <input id="search-input" class="search-input" placeholder="Search events..." oninput="onSearchInput()" autocomplete="off"/>

      </div>
      <div class="bottom-nav">
        ${NAV_TABS.map(
          ({ label, v, action }) => `
          <button class="nav-link" data-nav="${v}" onclick="${action}" style="position:relative;">
            ${icons[v] || ""}
            <span>${label}</span>
          </button>`,
        ).join("")}
      </div>`;
  }

  // Every call: patch active state and theme toggle — no DOM destruction
  navContainer.querySelectorAll(".nav-link").forEach((btn) => {
    btn.classList.toggle("active-cloud-tab", btn.dataset.nav === activeTab);
  });

}

function onSearchInput() {
  if (state.view !== "browse") {
    state.view = "browse";
    state.selectedEventId = null;
  }
  renderView();
}
function destroyMainMap() {
  if (lmap) {
    try {
      removeActiveHtmlMarker();
      Object.values(htmlMarkerRefs).forEach((ref) => {
        if (ref.added) {
          ref.marker.remove();
          if (ref.bubbleMarker) ref.bubbleMarker.remove();
        }
      });
      htmlMarkerRefs = {};
      lmap.remove();
    } catch (e) {}
    lmap = null;
    lmapFitted = false;
  }
}
function destroyHostMap() {
  if (hostMap) {
    try {
      hostMap.remove();
    } catch (e) {}
    hostMap = null;
    hostMarker = null;
  }
}

// Dedicated sign-out — tears the session down cleanly and returns to the gate.
// Confirms first unless called with confirmed=true (e.g. from clearAllUsers).
async function signOut(confirmed) {
  if (!confirmed) {
    showConfirm(
      "Sign out?",
      "You'll return to the welcome screen. Your data is saved.",
      "Sign out",
      "signOut",
    );
    return;
  }
  // Clear any Supabase auth session (defensive — harmless if none is active,
  // and future-proofs a move to real sb.auth without leaving a token behind).
  try {
    await sb.auth.signOut();
  } catch (e) {}
  // Clear local session cache
  try {
    localStorage.removeItem("cumulus_email");
  } catch (e) {}
  try {
    localStorage.removeItem("cumulus_session");
  } catch (e) {}
  try {
    localStorage.removeItem("prefs");
  } catch (e) {}
  // Reset in-memory state
  state.userId = null;
  state.profileName = "";
  state.profileEmail = "";
  state.profileId = null;
  state.specialBadges = [];
  state.myCard = null;
  state.friends = [];
  state.editingProfile = false;
  state.view = "browse";
  state.rsvps = {};
  myTickets = [];
  state.hostPayouts = undefined; // re-fetch fresh for whoever signs in next
  // Admin flags must NOT survive a sign-out — otherwise the next account
  // signed into this tab inherits the previous admin's bypass.
  state.isAdmin = false;
  state._verifiedAdmin = false;
  destroyMainMap();
  destroyHostMap();
  document.getElementById("app").style.display = "none";
  document.getElementById("nav-container").innerHTML = "";
  document.getElementById("view-container").innerHTML = "";
  document.body.classList.remove("app-active"); // bring landing decor back
  renderGate();
}
// Back-compat alias — older call sites referenced resetProfile by name.
function resetProfile(confirmed) {
  return signOut(confirmed);
}

let navStack = [];
function pushNav() {
  navStack.push({ view: state.view, selectedEventId: state.selectedEventId });
}
function goBack() {
  if (navStack.length > 0) {
    const p = navStack.pop();
    state.view = p.view;
    state.selectedEventId = p.selectedEventId;
    renderNav();
    renderView();
    if (state.view !== "browse")
      window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    goBrowse();
  }
}

function goBrowse() {
  navStack = [];
  state.view = "browse";
  state.selectedEventId = null;
  renderNav();
  renderView();
}
function setCategory(cat) {
  state.selectedCategory = cat;
  renderView();
}
function openEvent(id) {
  pushNav();
  state.view = "detail";
  state.selectedEventId = id;
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function openProfile() {
  pushNav();
  state.editingProfile = false;
  state.view = "profile";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function openCalendar() {
  pushNav();
  state.editingProfile = false;
  state.view = "calendar";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function openHost() {
  state.view = "host";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
// No-op if the overlay was never created (peekAttendee, its only creator,
// was removed with the per-event Connect/chat feature) — kept only because
// the global Escape-key handler calls every close* function defensively.
function closeAttendeePeek() {
  const ov = document.getElementById("attendee-peek-overlay");
  if (ov) ov.classList.remove("open");
}

function getMyEvents() {
  return EVENTS.filter((ev) =>
    (state.rsvps[ev.id] || []).includes(state.profileName),
  );
}
function getMyCategories() {
  const s = new Set();
  getMyEvents().forEach((ev) => s.add(ev.category));
  return s;
}
async function redeemBadge() {
  const input = document.getElementById("redeem-input");
  const code = (input?.value || "").trim().toUpperCase();
  if (!code) return;
  const match = SPECIAL_BADGES.find((b) => b.code === code);
  if (!match) {
    showToast("Code not recognised. Check and try again.", "error");
    return;
  }
  if (state.specialBadges.includes(match.id)) {
    showToast(`You already have the "${match.name}" badge.`);
    return;
  }
  state.specialBadges.push(match.id);
  if (state.userId) {
    await sb
      .from("users")
      .update({ special_badges: state.specialBadges })
      .eq("id", state.userId);
  }
  input.value = "";
  renderView();
  showToast(`Unlocked: ${match.name}`, "success");
}
function getEventDay(ev, year, monthIdx) {
  if (ev.startsAt == null) return null;
  const d = new Date(ev.startsAt);
  if (year != null && d.getFullYear() !== year) return null;
  if (monthIdx != null && d.getMonth() !== monthIdx) return null;
  return d.getDate();
}
function buildCalendarWeeks(year, monthIdx) {
  const firstDay = new Date(year, monthIdx, 1);
  const daysInMonth = new Date(year, monthIdx + 1, 0).getDate();
  const startOffset = (firstDay.getDay() + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

// ---- MAPBOX GL MAP & HTML Markers ----

function buildEventsGeoJSON() {
  return {
    type: "FeatureCollection",
    features: getFilteredEvents()
      .filter(
        (ev) =>
          typeof ev.lon === "number" &&
          typeof ev.lat === "number" &&
          isFinite(ev.lon) &&
          isFinite(ev.lat),
      )
      .map((ev) => ({
        type: "Feature",
        id: ev.id, // top-level id required for setFeatureState() (pin-scale animation)
        geometry: { type: "Point", coordinates: [ev.lon, ev.lat] },
        properties: {
          id: ev.id,
          color: CATS[ev.category].color,
          status: eventStatus(ev),
          friend: attendeesFor(ev.id).some(isFriend) ? 1 : 0,
          category: ev.category,
        },
      })),
  };
}

// ── WebGL Lightning Beacon ────────────────────────────────────────────────
// Pure WebGL effect — zero DOM thrashing. Uses fill-extrusion (vertical
// beam) + circle (ground shockwave) driven by a requestAnimationFrame loop.
// Replaces mapboxgl.Marker() for the "selected event" highlight entirely.

/**
 * createGeoJSONCircle — builds a GeoJSON Polygon approximating a circle.
 * Mapbox fill-extrusion requires a polygon; it cannot extrude a Point.
 *
 * @param {[number,number]} center  [lng, lat]
 * @param {number}          radiusM Radius in metres
 * @param {number}          pts     Polygon vertex count (default 32)
 * @returns {object}  GeoJSON Feature<Polygon>
 */
function createGeoJSONCircle(center, radiusM, pts = 32) {
  const [lng, lat] = center;
  const coords = [];
  // Convert metres → rough degrees (equirectangular approximation fine at city scale)
  const dLat = radiusM / 111320; // metres per degree latitude
  const dLng = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  for (let i = 0; i <= pts; i++) {
    const angle = (i / pts) * 2 * Math.PI;
    coords.push([lng + dLng * Math.cos(angle), lat + dLat * Math.sin(angle)]);
  }
  return {
    type: "Feature",
    geometry: { type: "Polygon", coordinates: [coords] },
    properties: {},
  };
}

/**
 * spawnLightningBeacon — adds a WebGL energy beacon at lngLat on mapInstance.
 *
 * Sources / layers added (all namespaced by eventId to allow coexistence):
 *   beacon-beam-src-{id}   GeoJSON polygon  → fill-extrusion (vertical beam)
 *   beacon-wave-src-{id}   GeoJSON point    → circle (ground shockwave)
 *
 * The rAF loop strobe-flickers the beam opacity (chaotic lightning feel) and
 * pulses the shockwave radius outward while fading opacity to zero.
 *
 * Usage (replaces new mapboxgl.Marker(el).setLngLat([lon,lat]).addTo(lmap)):
 *   const beacon = spawnLightningBeacon(lmap, [ev.lon, ev.lat], ev.id, color);
 *   // later: beacon.destroy();
 *
 * @param {mapboxgl.Map}     mapInstance
 * @param {[number,number]}  lngLat   [longitude, latitude]
 * @param {string|number}    eventId  Unique event identifier
 * @param {string}           color    CSS hex or rgb colour for the beam
 * @returns {{ destroy: Function }}  Call .destroy() to tear down cleanly
 */
function spawnLightningBeacon(mapInstance, lngLat, eventId, color = "#0ea5e9") {
  const id = String(eventId).replace(/[^a-zA-Z0-9]/g, "_");
  const beamSrcId = `beacon-beam-src-${id}`;
  const waveSrcId = `beacon-wave-src-${id}`;
  const beamLyrId = `beacon-beam-${id}`;
  const waveLyrId = `beacon-wave-${id}`;

  let rafId = null;
  let destroyed = false;

  // ── Add GeoJSON sources ──────────────────────────────────────────────────
  // Beam source: small polygon so fill-extrusion has geometry to extrude
  mapInstance.addSource(beamSrcId, {
    type: "geojson",
    data: createGeoJSONCircle(lngLat, 8, 32), // 8-metre footprint
  });

  // Shockwave source: simple Point for the flat circle
  mapInstance.addSource(waveSrcId, {
    type: "geojson",
    data: {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          geometry: { type: "Point", coordinates: lngLat },
          properties: {},
        },
      ],
    },
  });

  // ── Add Layers ───────────────────────────────────────────────────────────
  // Beam: fill-extrusion shoots 2500 m into the sky with vertical gradient
  mapInstance.addLayer({
    id: beamLyrId,
    type: "fill-extrusion",
    source: beamSrcId,
    paint: {
      "fill-extrusion-color": color,
      "fill-extrusion-height": 2500,
      "fill-extrusion-base": 0,
      "fill-extrusion-opacity": 0.85,
      "fill-extrusion-vertical-gradient": true,
    },
  });

  // Shockwave: flat circle on the ground plane, pitch-aligned to the terrain
  mapInstance.addLayer({
    id: waveLyrId,
    type: "circle",
    source: waveSrcId,
    paint: {
      "circle-color": color,
      "circle-radius": 0,
      "circle-opacity": 0.8,
      "circle-pitch-alignment": "map", // lies flat on 3D terrain
      "circle-pitch-scale": "map",
    },
  });

  // ── Animation Loop ───────────────────────────────────────────────────────
  // Beam: chaotic lightning strobe — random flickers at ~60fps
  // Shockwave: radius expands 0→120px, opacity 0.8→0 over WAVE_PERIOD ms
  const WAVE_PERIOD = 2000; // ms for one full shockwave pulse
  const WAVE_MAX_R = 120; // px at 1:1 zoom — Mapbox scales automatically
  let waveStart = null;

  // Lightning uses a 3-frame strobe sequence seeded by noise for chaos
  let noiseT = Math.random() * 1000;

  function tick(ts) {
    if (destroyed) return;

    // Graceful exit: if either layer was removed externally, shut down
    if (!mapInstance.getLayer(beamLyrId) || !mapInstance.getLayer(waveLyrId)) {
      destroyed = true;
      return;
    }

    // ── Beam: chaotic lightning strobe ──
    // Mix two sine waves at irrational frequencies to avoid periodicity,
    // then clamp into a range that always keeps a minimum visible base.
    noiseT += 0.08;
    const n1 = Math.sin(noiseT * 1.7);
    const n2 = Math.sin(noiseT * 3.1 + 0.9);
    const n3 = Math.sin(noiseT * 7.3 + 2.1);
    // Occasional hard-flash on peaks for the spark/surge effect
    const flash = (n1 + n2 * 0.5 + n3 * 0.25 + 1.75) / 3.5; // 0–1
    const beamOpacity = 0.2 + flash * 0.75; // range: 0.2–0.95
    mapInstance.setPaintProperty(
      beamLyrId,
      "fill-extrusion-opacity",
      beamOpacity,
    );

    // ── Shockwave: expanding ring that resets every WAVE_PERIOD ms ──
    if (!waveStart) waveStart = ts;
    const elapsed = (ts - waveStart) % WAVE_PERIOD;
    const progress = elapsed / WAVE_PERIOD; // 0 → 1
    const waveR = WAVE_MAX_R * progress;
    const waveA = 0.8 * (1 - progress); // opacity fades out
    mapInstance.setPaintProperty(waveLyrId, "circle-radius", waveR);
    mapInstance.setPaintProperty(waveLyrId, "circle-opacity", waveA);

    rafId = requestAnimationFrame(tick);
  }

  rafId = requestAnimationFrame(tick);

  // ── Public API ───────────────────────────────────────────────────────────
  return {
    destroy() {
      destroyed = true;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      try {
        mapInstance.removeLayer(beamLyrId);
      } catch (e) {}
      try {
        mapInstance.removeLayer(waveLyrId);
      } catch (e) {}
      try {
        mapInstance.removeSource(beamSrcId);
      } catch (e) {}
      try {
        mapInstance.removeSource(waveSrcId);
      } catch (e) {}
    },
  };
}

let activePopup = null,
  activePopupEventId = null;
let activeHtmlMarker = null;
let activeBeacon = null; // current lightning beacon (WebGL, replaces DOM marker)
let hoverPopup = null,
  hoverPopupEventId = null; // pointer-hover preview, separate from the click/selected popup above

function removeHoverPopup() {
  if (hoverPopup) {
    try {
      hoverPopup.remove();
    } catch (e) {}
    hoverPopup = null;
    hoverPopupEventId = null;
  }
}

// ── Pin bounce animation ────────────────────────────────────────────────
// Mapbox GL only allows feature-state expressions on PAINT properties, not
// layout properties — icon-size is layout, so per-pin animated scale isn't
// possible on the WebGL symbol layer itself (confirmed: attempting it throws
// "feature-state data expressions are not supported with layout
// properties"). Two different techniques cover the two cases instead:
//   1. Entrance: a single synchronized rAF loop scales the WHOLE layer's
//      icon-size 0→1 with overshoot — a "the map pops in" moment, played
//      once on first load rather than per-pin.
//   2. Hover/click: a single reusable DOM element, styled with the exact
//      same pre-rendered pin image (captured as a data URL alongside the
//      WebGL icon in loadWebGLIcons), positioned over the hovered pin via
//      map.project() and CSS-transitioned with a bounce easing — real
//      per-pin scale, just done in the DOM instead of WebGL.
function easeOutBack(t) {
  const c1 = 1.70158,
    c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
let _pinLayerAnim = null;
function tweenPinLayerSize(from, to, duration, easing) {
  if (!lmap) return;
  if (_pinLayerAnim) cancelAnimationFrame(_pinLayerAnim);
  const start = performance.now();
  function frame(now) {
    const t = Math.max(0, Math.min(1, (now - start) / duration));
    const size = Math.max(0, from + (to - from) * easing(t));
    try {
      lmap.setLayoutProperty("unclustered-events", "icon-size", size);
    } catch (e) {}
    if (t < 1) _pinLayerAnim = requestAnimationFrame(frame);
    else _pinLayerAnim = null;
  }
  _pinLayerAnim = requestAnimationFrame(frame);
}
let _pinsEverLoaded = false;
// Plays the whole-layer pop-in once, the first time any pins ever appear
// (real initial load, or the first data arriving after a slow network) —
// not replayed on every incidental refresh/filter change.
function bounceInPinLayer(features) {
  if (_pinsEverLoaded || !features.length) return;
  _pinsEverLoaded = true;
  tweenPinLayerSize(0, 1, 550, easeOutBack);
}

// Data-URL cache of each category's pin image, captured in loadWebGLIcons —
// reused by the DOM hover-overlay so it's pixel-identical to the WebGL pin.
const pinImageDataUrls = {};

let _pinOverlayEl = null;
function ensurePinOverlay() {
  if (_pinOverlayEl) return _pinOverlayEl;
  const host = document.getElementById("main-map");
  if (!host) return null;
  const el = document.createElement("div");
  el.className = "pin-hover-overlay";
  el.innerHTML = `<img alt="" />`;
  host.appendChild(el);
  _pinOverlayEl = el;
  return el;
}
let _pinOverlayEvId = null;
function positionPinOverlay(lngLat) {
  if (!_pinOverlayEl || !lmap) return;
  const p = lmap.project(lngLat);
  _pinOverlayEl.style.transform = `translate(${p.x - 20}px, ${p.y - 50}px)`;
}
function showPinOverlay(ev) {
  const el = ensurePinOverlay();
  if (!el) return;
  _pinOverlayEvId = ev.id;
  const img = el.querySelector("img");
  img.src = pinImageDataUrls[ev.category] || "";
  positionPinOverlay([ev.lon, ev.lat]);
  el.style.display = "block";
  // Force layout before adding the class so the scale transition plays
  void el.offsetWidth;
  el.classList.add("grown");
}
function hidePinOverlay() {
  if (!_pinOverlayEl) return;
  _pinOverlayEl.classList.remove("grown");
  const el = _pinOverlayEl;
  setTimeout(() => {
    if (_pinOverlayEvId == null) el.style.display = "none";
  }, 220);
  _pinOverlayEvId = null;
}

function removeActiveHtmlMarker() {
  // Destroy WebGL beacon if one is live
  if (activeBeacon) {
    try {
      activeBeacon.destroy();
    } catch (e) {}
    activeBeacon = null;
  }
  if (activeHtmlMarker) {
    try {
      activeHtmlMarker.remove();
    } catch (e) {}
    activeHtmlMarker = null;
  }
  closeActivePopup();
}

function closeActivePopup() {
  if (activePopup) {
    try {
      activePopup.remove();
    } catch (e) {}
    activePopup = null;
    activePopupEventId = null;
  }
  if (activeHtmlMarker) {
    try {
      activeHtmlMarker.remove();
    } catch (e) {}
    activeHtmlMarker = null;
  }
  document
    .querySelectorAll(".evpin.open")
    .forEach((el) => el.classList.remove("open"));
}

let htmlMarkerRefs = {};

// Small bold glyph per category, drawn in the category colour inside the
// pin's white head-hole — filled geometric shapes (not thin strokes), since
// strokes disappear at this scale. cx/cy is the hole centre, r ~ hole radius.
// Small inline-SVG versions of the same category glyph concepts drawn onto
// the map pins (drawCategoryGlyph below) — used on filter chips so pins and
// chips read as the same icon language. Kept as separate small SVGs (rather
// than reusing the pins' rendered PNGs) so chips don't depend on the map's
// canvas/WebGL icons having finished generating first.
const CATEGORY_CHIP_ICON_PATHS = {
  Creative:
    '<path d="M8 1c.7 2.3 1.7 3.3 4 4-2.3.7-3.3 1.7-4 4-.7-2.3-1.7-3.3-4-4 2.3-.7 3.3-1.7 4-4Z"/>',
  Gaming:
    '<path d="M6.3 1h3.4v3.3H13v3.4H9.7V11H6.3V7.7H3V4.3h3.3V1Z"/>',
  "Movie Nights": '<path d="M4.2 2v12l8.6-6-8.6-6Z"/>',
  "Board Games": '<path d="M8 1.5 13 8 8 14.5 3 8 8 1.5Z"/>',
  Meetups: '<circle cx="5.3" cy="8" r="2.4"/><circle cx="10.7" cy="8" r="2.4"/>',
  "Food & Drink":
    '<path d="M4 2.5h8L8.7 7.4v3.1h1.5v1.3H5.8v-1.3h1.5V7.4L4 2.5Z"/>',
  "Live Music":
    '<ellipse cx="5.6" cy="10.6" rx="2.2" ry="1.6" transform="rotate(-25 5.6 10.6)"/><rect x="7.5" y="1.8" width="1.3" height="8.8" rx="0.4"/>',
  "Wellness & Outdoors":
    '<circle cx="8" cy="8" r="2.3"/><g stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><path d="M8 2v1.7M8 12.3V14M2 8h1.7M12.3 8H14M3.5 3.5l1.2 1.2M11.3 11.3l1.2 1.2M12.5 3.5l-1.2 1.2M4.7 11.3l-1.2 1.2"/></g>',
  "Tech & Talks": '<path d="M8.8 1 3.6 8.8h3l-.4 6.2 5.6-8.6h-3.2L8.8 1Z"/>',
};
function categoryChipIconSvg(name) {
  const inner = CATEGORY_CHIP_ICON_PATHS[name] || "";
  return `<svg viewBox="0 0 16 16" width="13" height="13" fill="currentColor" style="display:inline-block;vertical-align:-2px;">${inner}</svg>`;
}

function drawCategoryGlyph(ctx, name, cx, cy, r) {
  ctx.beginPath();
  if (name === "Creative") {
    // 4-point sparkle
    ctx.moveTo(cx, cy - r);
    ctx.quadraticCurveTo(cx + r * 0.25, cy - r * 0.25, cx + r, cy);
    ctx.quadraticCurveTo(cx + r * 0.25, cy + r * 0.25, cx, cy + r);
    ctx.quadraticCurveTo(cx - r * 0.25, cy + r * 0.25, cx - r, cy);
    ctx.quadraticCurveTo(cx - r * 0.25, cy - r * 0.25, cx, cy - r);
    ctx.closePath();
    ctx.fill();
  } else if (name === "Gaming") {
    // D-pad cross
    const t = r * 0.5;
    ctx.rect(cx - t, cy - r, t * 2, r * 2);
    ctx.rect(cx - r, cy - t, r * 2, t * 2);
    ctx.fill();
  } else if (name === "Movie Nights") {
    // play triangle
    ctx.moveTo(cx - r * 0.55, cy - r * 0.8);
    ctx.lineTo(cx - r * 0.55, cy + r * 0.8);
    ctx.lineTo(cx + r * 0.85, cy);
    ctx.closePath();
    ctx.fill();
  } else if (name === "Board Games") {
    // bold diamond — reads clearly at small scale where dice pips just blur
    ctx.moveTo(cx, cy - r * 0.9);
    ctx.lineTo(cx + r * 0.9, cy);
    ctx.lineTo(cx, cy + r * 0.9);
    ctx.lineTo(cx - r * 0.9, cy);
    ctx.closePath();
    ctx.fill();
  } else if (name === "Meetups") {
    // two clearly-separated dots (not touching, so they don't blur into one blob)
    ctx.arc(cx - r * 0.52, cy, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + r * 0.52, cy, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
  } else if (name === "Food & Drink") {
    // coupe glass: triangle bowl + stem + base
    ctx.moveTo(cx - r * 0.75, cy - r * 0.65);
    ctx.lineTo(cx + r * 0.75, cy - r * 0.65);
    ctx.lineTo(cx, cy + r * 0.15);
    ctx.closePath();
    ctx.fill();
    ctx.fillRect(cx - r * 0.09, cy + r * 0.15, r * 0.18, r * 0.45);
    ctx.fillRect(cx - r * 0.42, cy + r * 0.55, r * 0.84, r * 0.14);
  } else if (name === "Live Music") {
    // eighth note: notehead + stem
    ctx.ellipse(
      cx - r * 0.32,
      cy + r * 0.42,
      r * 0.42,
      r * 0.32,
      -0.35,
      0,
      Math.PI * 2,
    );
    ctx.fill();
    ctx.fillRect(cx + r * 0.05, cy - r * 0.75, r * 0.16, r * 1.2);
  } else if (name === "Wellness & Outdoors") {
    // sun — bold circle + 4 short thick rays; more small-scale contrast
    // than a smooth leaf curve, which just blurred into a plain blob
    ctx.arc(cx, cy, r * 0.42, 0, Math.PI * 2);
    ctx.fill();
    const rayW = r * 0.26,
      rayLen = r * 0.38,
      gap = r * 0.5;
    [0, 90, 180, 270].forEach((deg) => {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((deg * Math.PI) / 180);
      ctx.beginPath();
      ctx.moveTo(-rayW / 2, -gap);
      ctx.lineTo(rayW / 2, -gap);
      ctx.lineTo(0, -gap - rayLen);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    });
  } else if (name === "Tech & Talks") {
    // lightning bolt
    ctx.moveTo(cx + r * 0.12, cy - r * 0.85);
    ctx.lineTo(cx - r * 0.5, cy + r * 0.05);
    ctx.lineTo(cx - r * 0.08, cy + r * 0.05);
    ctx.lineTo(cx - r * 0.12, cy + r * 0.85);
    ctx.lineTo(cx + r * 0.5, cy - r * 0.12);
    ctx.lineTo(cx + r * 0.08, cy - r * 0.12);
    ctx.closePath();
    ctx.fill();
  }
}

// Classic teardrop map-pin silhouette: white outer pin (border/shadow edge),
// category-colour inner pin, white circle "head-hole" near the top with a
// small category glyph inside it. The tip sits near the bottom of the canvas
// so icon-anchor:'bottom' on the symbol layer plants the tip — not the
// visual centre — on the event's coordinate.
function loadWebGLIcons() {
  if (!lmap) return;
  const outerPin = new Path2D(
    "M20 3C11.72 3 5 9.72 5 18c0 11.6 15 31 15 31s15-19.4 15-31C35 9.72 28.28 3 20 3Z",
  );
  const innerPin = new Path2D(
    "M20 6C13.4 6 8 11.4 8 18c0 9.6 12 27 12 27s12-17.4 12-27C32 11.4 26.6 6 20 6Z",
  );
  Object.entries(CATS).forEach(([name, cat]) => {
    const w = 40,
      h = 50;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.35)";
    ctx.shadowBlur = 3;
    ctx.shadowOffsetY = 2;
    ctx.fillStyle = "#ffffff";
    ctx.fill(outerPin);
    ctx.restore();
    ctx.fillStyle = cat.color;
    ctx.fill(innerPin);
    ctx.beginPath();
    ctx.arc(20, 18, 7.2, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.fillStyle = cat.color;
    drawCategoryGlyph(ctx, name, 20, 18, 5.6);
    // ctx.getImageData() reads the actual pixel buffer back from the canvas
    // as a flat Uint8ClampedArray — the format Mapbox addImage() requires.
    const imageData = ctx.getImageData(0, 0, w, h);
    try {
      lmap.addImage("pin-" + name, {
        width: w,
        height: h,
        data: imageData.data,
      });
    } catch (e) {}
    pinImageDataUrls[name] = canvas.toDataURL();
  });
}

function openActiveEventMarker(evId) {
  removeActiveHtmlMarker(); // tears down prior beacon + popup
  const ev = EVENTS.find((e) => String(e.id) === String(evId));
  if (!ev || ev.lat == null || ev.lon == null) return;

  const catData = CATS[ev.category] || {};
  const color = catData.color || "#FFCF33";
  const status = eventStatus(ev);

  // ── WebGL Lightning Beacon (replaces DOM evpin marker entirely) ──────────
  // spawnLightningBeacon returns a { destroy() } handle stored in activeBeacon.
  // removeActiveHtmlMarker() calls .destroy() next time a new pin is selected
  // or the map canvas is tapped empty.
  if (lmap && ev.lon != null && ev.lat != null) {
    activeBeacon = spawnLightningBeacon(lmap, [ev.lon, ev.lat], ev.id, color);
  }

  // ── Mapbox Popup (unchanged — still a lightweight overlay, not DOM-heavy) ─
  const popup = new mapboxgl.Popup({
    offset: { top: [0, 8], bottom: [0, -14], left: [14, 0], right: [-14, 0] },
    closeButton: false,
    closeOnClick: false,
    className: "evtip-popup",
    anchor: "bottom",
    maxWidth: "240px",
  })
    .setLngLat([ev.lon, ev.lat])
    .setHTML(pinTooltipHtml(ev))
    .addTo(lmap);
  activePopup = popup;
  activePopupEventId = ev.id;

  const popupEl = popup.getElement();
  if (popupEl) {
    popupEl.addEventListener("click", (e) => {
      e.stopPropagation();
      removeActiveHtmlMarker();
      openEvent(ev.id);
    });
    popupEl.addEventListener(
      "touchend",
      (e) => {
        e.preventDefault();
        e.stopPropagation();
        removeActiveHtmlMarker();
        openEvent(ev.id);
      },
      { passive: false },
    );
  }
  lmap.easeTo({ center: [ev.lon, ev.lat] });
}

function updateClusterPaint() {
  if (!lmap || !lmap.getLayer("clusters")) return;
  const dk = state.theme === "dark";
  const c0 = dk ? "#FFCF33" : "#E0A800";
  const c1 = dk ? "#E0A800" : "#966A0A";
  const c2 = dk ? "#966A0A" : "#8A5C0A";
  lmap.setPaintProperty("clusters", "circle-color", [
    "step",
    ["get", "point_count"],
    c0,
    10,
    c1,
    30,
    c2,
  ]);
  lmap.setPaintProperty(
    "clusters",
    "circle-stroke-color",
    dk ? "rgba(232,184,75,0.55)" : "rgba(255,255,255,0.85)",
  );
}

function attachMapLayers() {
  if (!lmap || lmap.getSource("events-source")) return;

  // Load WebGL custom pin icons
  loadWebGLIcons();

  lmap.addSource("events-source", {
    type: "geojson",
    data: { type: "FeatureCollection", features: [] },
    cluster: true,
    clusterMaxZoom: 14,
    clusterRadius: 50,
  });

  // Native Mapbox GL cluster layers — palette matches light/dark via updateClusterPaint()
  lmap.addLayer({
    id: "clusters",
    type: "circle",
    source: "events-source",
    filter: ["has", "point_count"],
    paint: {
      "circle-color": [
        "step",
        ["get", "point_count"],
        "#FFCF33",
        10,
        "#E0A800",
        30,
        "#966A0A",
      ],
      "circle-radius": ["step", ["get", "point_count"], 20, 10, 24, 30, 28],
      "circle-stroke-width": 2,
      "circle-stroke-color": "rgba(255,255,255,0.85)",
      "circle-opacity": 0.95,
    },
  });

  lmap.addLayer({
    id: "cluster-count",
    type: "symbol",
    source: "events-source",
    filter: ["has", "point_count"],
    layout: {
      "text-field": ["get", "point_count_abbreviated"],
      "text-font": ["DIN Offc Pro Bold", "Arial Unicode MS Bold"],
      "text-size": 12,
      "text-allow-overlap": true,
    },
    paint: {
      "text-color": "#ffffff",
      "text-halo-color": "rgba(0,0,0,0.15)",
      "text-halo-width": 1,
    },
  });
  updateClusterPaint();

  // Live-pulse ring: a WebGL circle rendered BEHIND the pin symbols, shown
  // ONLY for events whose status is "live" (happening right now). Non-live
  // pins get no ring. Radius/opacity are animated by the rAF loop in
  // updateLivePulse(); static event pins stay completely still.
  lmap.addLayer({
    id: "live-pulse",
    type: "circle",
    source: "events-source",
    filter: [
      "all",
      ["!", ["has", "point_count"]],
      ["==", ["get", "status"], "live"],
    ],
    paint: {
      "circle-color": ["get", "color"],
      "circle-opacity": 0,
      "circle-radius": 8,
      "circle-stroke-color": ["get", "color"],
      "circle-stroke-width": 2,
      "circle-stroke-opacity": 0.5,
    },
  });

  // Native WebGL symbol layer to render all individual event pins directly in WebGL
  lmap.addLayer({
    id: "unclustered-events",
    type: "symbol",
    source: "events-source",
    filter: ["!", ["has", "point_count"]],
    layout: {
      "icon-image": ["concat", "pin-", ["get", "category"]],
      "icon-size": 1.0,
      "icon-anchor": "bottom",
      "icon-allow-overlap": true,
      "icon-ignore-placement": true,
    },
  });

  // Click handler to open the single active HTML marker and details
  lmap.on("click", "unclustered-events", (e) => {
    const features = lmap.queryRenderedFeatures(e.point, {
      layers: ["unclustered-events"],
    });
    if (!features.length) return;
    const evId = features[0].properties.id;
    removeHoverPopup();
    hidePinOverlay();
    openActiveEventMarker(evId);
  });
  lmap.on("mouseenter", "unclustered-events", () => {
    lmap.getCanvas().style.cursor = "pointer";
  });
  lmap.on("mouseleave", "unclustered-events", () => {
    lmap.getCanvas().style.cursor = "";
    removeHoverPopup();
    hidePinOverlay();
  });

  // Hover preview (pointer/mouse devices only — touch never fires mousemove
  // here) — shows the same info as the click popup, without the click's
  // lightning-beacon "selected" effect. Click still behaves exactly as
  // before; this is purely additive. The DOM overlay pin (same image as the
  // WebGL icon, see showPinOverlay) gives a real per-pin hover-grow bounce
  // that a WebGL layout property can't do on its own.
  lmap.on("mousemove", "unclustered-events", (e) => {
    const features = lmap.queryRenderedFeatures(e.point, {
      layers: ["unclustered-events"],
    });
    if (!features.length) return;
    const evId = features[0].properties.id;
    if (evId === hoverPopupEventId || evId === activePopupEventId) return;
    removeHoverPopup();
    const ev = EVENTS.find((e2) => String(e2.id) === String(evId));
    if (!ev || ev.lon == null || ev.lat == null) return;
    showPinOverlay(ev);
    hoverPopup = new mapboxgl.Popup({
      offset: { top: [0, 8], bottom: [0, -14], left: [14, 0], right: [-14, 0] },
      closeButton: false,
      closeOnClick: false,
      className: "evtip-popup",
      anchor: "bottom",
      maxWidth: "240px",
    })
      .setLngLat([ev.lon, ev.lat])
      .setHTML(pinTooltipHtml(ev))
      .addTo(lmap);
    hoverPopupEventId = ev.id;
  });
  lmap.on("move", () => {
    if (_pinOverlayEvId != null) {
      const ev = EVENTS.find((e2) => String(e2.id) === String(_pinOverlayEvId));
      if (ev) positionPinOverlay([ev.lon, ev.lat]);
    }
  });

  // Cluster click → zoom in
  lmap.on("click", "clusters", (e) => {
    const features = lmap.queryRenderedFeatures(e.point, {
      layers: ["clusters"],
    });
    if (!features.length) return;
    lmap
      .getSource("events-source")
      .getClusterExpansionZoom(
        features[0].properties.cluster_id,
        (err, zoom) => {
          if (!err)
            lmap.easeTo({
              center: features[0].geometry.coordinates,
              zoom: zoom + 0.8,
            });
        },
      );
  });
  lmap.on("mouseenter", "clusters", () => {
    lmap.getCanvas().style.cursor = "pointer";
  });
  lmap.on("mouseleave", "clusters", () => {
    lmap.getCanvas().style.cursor = "";
  });

  lmap.on("click", (e) => {
    const hits = lmap.queryRenderedFeatures(e.point, {
      layers: ["clusters", "unclustered-events"],
    });
    if (!hits.length) removeActiveHtmlMarker();
  });

  // After each camera settle, fetch only the events within the new viewport.
  // The 300ms debounce means rapid pans generate exactly ONE RPC call when
  // the user stops, preventing Supabase spam and keeping bandwidth minimal.
  lmap.on("moveend", () => _debouncedFetchVisible());

  if (state.view === "browse") setTimeout(refreshMarkers, 0);
}

// ── Live-pulse animation ──────────────────────────────────────────────────
// Drives the "live-pulse" circle layer so pins for events happening RIGHT NOW
// breathe an outward ring. Only runs while at least one live event is on the
// map; stops entirely otherwise (no idle rAF burn). Honours reduced-motion by
// painting a single static ring instead of animating.
let _livePulseRAF = null;
function stopLivePulse() {
  if (_livePulseRAF) {
    cancelAnimationFrame(_livePulseRAF);
    _livePulseRAF = null;
  }
}
function updateLivePulse() {
  if (!lmap || !lmap.getLayer("live-pulse")) return;
  const hasLive = getFilteredEvents().some((ev) => eventStatus(ev) === "live");
  if (!hasLive) {
    stopLivePulse();
    return;
  }
  const reduce =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    stopLivePulse();
    try {
      lmap.setPaintProperty("live-pulse", "circle-radius", 15);
      lmap.setPaintProperty("live-pulse", "circle-stroke-opacity", 0.45);
    } catch (e) {}
    return;
  }
  if (_livePulseRAF) return; // already animating
  const PERIOD = 2200; // ms per breath
  function tick(ts) {
    if (!lmap || !lmap.getLayer("live-pulse")) {
      _livePulseRAF = null;
      return;
    }
    const t = (ts % PERIOD) / PERIOD; // 0 → 1
    const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic expansion
    try {
      lmap.setPaintProperty("live-pulse", "circle-radius", 9 + eased * 15);
      lmap.setPaintProperty("live-pulse", "circle-stroke-opacity", 0.55 * (1 - t));
    } catch (e) {}
    _livePulseRAF = requestAnimationFrame(tick);
  }
  _livePulseRAF = requestAnimationFrame(tick);
}

function refreshMarkers() {
  if (!lmap || typeof mapboxgl === "undefined") return;
  const src = lmap.getSource("events-source");
  if (!src) {
    lmap.once("load", refreshMarkers);
    return;
  }

  removeActiveHtmlMarker();

  const geo = buildEventsGeoJSON();
  src.setData(geo);
  bounceInPinLayer(geo.features);

  const visibleEvents = getFilteredEvents();
  updateMapEmptyState(visibleEvents.length);
  updateLivePulse();

  if (!lmapFitted && geo.features.length > 0) {
    const coords = geo.features.map((f) => f.geometry.coordinates);
    const bounds = coords.reduce(
      (b, c) => b.extend(c),
      new mapboxgl.LngLatBounds(coords[0], coords[0]),
    );
    lmap.fitBounds(bounds, {
      padding: { top: 120, bottom: 140, left: 40, right: 40 },
      maxZoom: 12,
    });
    lmapFitted = true;
  }
}

// ── Bounding-box event refresh via PostGIS RPC ────────────────────────────
// fetchVisibleEvents() queries only the events within the current map
// viewport using the get_events_geojson Postgres RPC. The RPC is a
// micro-payload (id/category/start_time + geometry only — see the Phase A
// migration) so it stays cheap on every pan; loadRealEvents() already
// hydrates the full EVENTS array once at boot, so almost every id here is
// already known locally. The rare exception (an event someone else created
// mid-session) gets its full row fetched individually via
// fetchEventDetails() — never a whole-table refetch.
//
// The debounced moveend listener (300ms) batches rapid pans so we never
// fire more than one RPC per camera settle. Falls back to the local
// buildEventsGeoJSON() if the RPC is unavailable (offline / not deployed).

let _bboxFetchTimer = null;

async function fetchVisibleEvents() {
  if (!lmap || typeof mapboxgl === "undefined") return;
  const src = lmap.getSource("events-source");
  if (!src) return;

  // Extract SW / NE corners of the current viewport
  const bounds = lmap.getBounds();
  const sw = bounds.getSouthWest();
  const ne = bounds.getNorthEast();

  // Pad bbox slightly (10%) so pins near the edge don't pop in/out abruptly
  const lngSpan = (ne.lng - sw.lng) * 0.1;
  const latSpan = (ne.lat - sw.lat) * 0.1;

  const bbox = {
    min_lng: sw.lng - lngSpan,
    min_lat: sw.lat - latSpan,
    max_lng: ne.lng + lngSpan,
    max_lat: ne.lat + latSpan,
  };

  // Call the PostGIS RPC (defined in services.js) — a micro-payload
  // FeatureCollection, id/category/start_time only
  const geojson = await fetchEventsGeoJSON(bbox);

  if (!geojson || !Array.isArray(geojson.features)) {
    // RPC unavailable (offline / not deployed yet) — fall back gracefully
    src.setData(buildEventsGeoJSON());
    return;
  }

  // Fetch full details only for ids we've genuinely never seen this session
  const unseenIds = geojson.features
    .map((f) => f.properties && f.properties.id)
    .filter((id) => id && !EVENTS.find((e) => e.id === id));

  if (unseenIds.length) {
    const rows = await Promise.all(unseenIds.map((id) => fetchEventDetails(id)));
    rows.forEach((ev) => {
      if (!ev || EVENTS.find((e) => e.id === ev.id)) return;
      const mapped = {
        id: ev.id,
        title: ev.title,
        category: ev.category,
        host: ev.host_name,
        hostId: ev.host_id,
        venue: ev.venue,
        area: ev.area,
        address: ev.address,
        lat: ev.lat,
        lon: ev.lon,
        startTime: ev.start_time,
        endTime: ev.end_time,
        desc: ev.description,
        capacity: ev.capacity,
        price: ev.price || 0,
        nightShotUrl: ev.night_shot_url || null,
      };
      computeEventDates(mapped);
      EVENTS.push(mapped);
    });
  }

  // Apply client-side filters (category, live/hot toggles, search) and push
  // the resulting GeoJSON directly to the WebGL source
  const filteredGeo = buildEventsGeoJSON();
  src.setData(filteredGeo);
  updateMapEmptyState(filteredGeo.features.length);
  updateLivePulse();
}

// Debounce helper — executes fn at most once every `wait` ms after last call
function debounce(fn, wait) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
}

// Register the debounced bbox fetch on map moveend (registered once in
// attachMapLayers so it survives style reloads cleanly)
const _debouncedFetchVisible = debounce(fetchVisibleEvents, 300);

// Empty-state overlay on the map when no events are visible — distinguishes
// "no events exist yet" from "your filters/search matched nothing".
function updateMapEmptyState(count) {
  const host = document.getElementById("main-map");
  if (!host) return;
  let el = document.getElementById("map-empty");
  if (count > 0) {
    if (el) el.remove();
    return;
  }
  if (!el) {
    el = document.createElement("div");
    el.id = "map-empty";
    el.className = "map-empty";
    host.appendChild(el);
  }
  const filtered =
    state.selectedCategory !== "all" ||
    state.liveOnly ||
    state.hotOnly ||
    !!(document.getElementById("search-input")?.value || "").trim();
  el.innerHTML = filtered
    ? `<div class="map-empty-card" role="status">
         <div class="me-emoji" aria-hidden="true">🔍</div>
         <div class="me-title">No events match</div>
         <div class="me-sub">Nothing fits those filters right now. Try clearing them.</div>
         <button class="btn" onclick="clearMapFilters()">Clear filters</button>
       </div>`
    : `<div class="map-empty-card" role="status">
         <div class="me-emoji" aria-hidden="true">🗺️</div>
         <div class="me-title">No events on the map yet</div>
         <div class="me-sub">Cumulus is just getting started in London. Be the first to put something on.</div>
         <button class="btn" onclick="openHost()">Host an event</button>
       </div>`;
}

function clearMapFilters() {
  state.selectedCategory = "all";
  state.liveOnly = false;
  state.hotOnly = false;
  const si = document.getElementById("search-input");
  if (si) si.value = "";
  refreshFilters();
  refreshMarkers();
}

window.CUMULUS_WEATHER_MODE = "live";

class WeatherControl {
  onAdd(map) {
    this._map = map;
    this._container = document.createElement("div");
    this._container.className = "mapboxgl-ctrl mapboxgl-ctrl-group";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.title = "Weather: Live (London)";
    btn.innerHTML = "🌍";
    btn.style.fontSize = "16px";

    this._states = ["live", "clear", "dawn", "dusk", "rain", "snow", "fog"];
    this._currentState = 0;

    btn.onclick = () => {
      this._currentState = (this._currentState + 1) % this._states.length;
      window.CUMULUS_WEATHER_MODE = this._states[this._currentState];
      this.applyState(window.CUMULUS_WEATHER_MODE, btn);
    };

    this._container.appendChild(btn);
    return this._container;
  }

  applyState(stateName, btn) {
    if (!this._map.setRain) return;

    if (stateName === "live") {
      btn.innerHTML = "🌍";
      btn.title = "Weather: Live (London)";
      applyRealWeather(this._map, true);
      return;
    }

    // For simulated states, first clear everything
    this._map.setRain(null);
    this._map.setSnow(null);
    this._map.setFog(null);
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    const light = isDark ? "night" : "day";
    this._map.setConfigProperty("basemap", "lightPreset", light);
    this._map.setConfigProperty("basemap", "show3dTrees", false);

    if (stateName === "clear") {
      btn.innerHTML = "☀️";
      btn.title = "Weather: Simulated Clear";
    } else if (stateName === "dawn") {
      btn.innerHTML = "🌅";
      btn.title = "Weather: Simulated Dawn";
      this._map.setConfigProperty("basemap", "lightPreset", "dawn");
    } else if (stateName === "dusk") {
      btn.innerHTML = "🌇";
      btn.title = "Weather: Simulated Dusk";
      this._map.setConfigProperty("basemap", "lightPreset", "dusk");
    } else if (stateName === "rain") {
      btn.innerHTML = "🌧️";
      btn.title = "Weather: Simulated Rain";
      this._map.setConfigProperty("basemap", "lightPreset", "dusk");
      this._map.setRain({ density: 1, intensity: 1, color: "#a0b0c0" });
      this._map.setFog({
        range: [1, 5],
        color: "#111",
        "high-color": "#222",
        "space-color": "#000",
        "star-intensity": 0.5,
      });
    } else if (stateName === "snow") {
      btn.innerHTML = "❄️";
      btn.title = "Weather: Simulated Snow";
      this._map.setConfigProperty("basemap", "lightPreset", light);
      this._map.setSnow({ density: 1, intensity: 1, color: "#ffffff" });
      this._map.setFog({
        range: [1, 4],
        color: isDark ? "#223" : "#eef2f5",
        "high-color": isDark ? "#112" : "#d9e2e8",
        "space-color": "#000",
        "star-intensity": isDark ? 1.0 : 0,
      });
    } else if (stateName === "fog") {
      btn.innerHTML = "🌫️";
      btn.title = "Weather: Simulated Fog";
      this._map.setConfigProperty("basemap", "lightPreset", light);
      this._map.setFog({
        range: [0.5, 3],
        color: isDark ? "#111" : "#e0e5eb",
        "high-color": isDark ? "#222" : "#b0c4de",
        "space-color": "#000",
        "star-intensity": isDark ? 0.8 : 0,
      });
    }
  }

  onRemove() {
    this._container.parentNode.removeChild(this._container);
    this._map = undefined;
  }
}

let _weatherPollInterval = null;

async function applyRealWeather(map, force = false) {
  if (window.CUMULUS_WEATHER_MODE !== "live" && !force) return;

  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=51.5072&longitude=-0.1276&current_weather=true&daily=sunrise,sunset&timezone=Europe%2FLondon",
    );
    const data = await res.json();
    const w = data.current_weather;
    if (!w) return;

    if (!map.setRain) return;
    map.setRain(null);
    map.setSnow(null);
    map.setFog(null);

    // Calculate precision day/dawn/dusk/night based on real local time
    const now = new Date();
    const sunrise = new Date(data.daily.sunrise[0]);
    const sunset = new Date(data.daily.sunset[0]);

    let light = "day";
    const msIn45Mins = 45 * 60 * 1000;

    if (now < new Date(sunrise.getTime() - msIn45Mins)) {
      light = "night";
    } else if (now < sunrise) {
      light = "dawn";
    } else if (now < sunset) {
      light = "day";
    } else if (now < new Date(sunset.getTime() + msIn45Mins)) {
      light = "dusk";
    } else {
      light = "night";
    }

    map.setConfigProperty("basemap", "lightPreset", light);
    map.setConfigProperty("basemap", "show3dTrees", false);

    // Weather codes (WMO)
    const code = w.weathercode;

    // Fog (45, 48)
    if (code === 45 || code === 48) {
      map.setFog({
        range: [0.5, 3],
        color: light === "day" ? "#e0e5eb" : "#111",
        "high-color": light === "day" ? "#b0c4de" : "#222",
        "space-color": "#000",
        "star-intensity":
          light === "night" || light === "dusk" || light === "dawn" ? 0.8 : 0,
      });
    }
    // Drizzle / Rain (51-67, 80-82)
    else if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) {
      map.setRain({
        density: 1,
        intensity: code >= 63 ? 1 : 0.5,
        color: light === "day" ? "#8a9ba8" : "#a0b0c0",
      });
      map.setFog({
        range: [1, 5],
        color: light === "day" ? "#c8d2d9" : "#111",
        "high-color": light === "day" ? "#9fb1be" : "#222",
        "space-color": "#000",
        "star-intensity":
          light === "night" || light === "dusk" || light === "dawn" ? 0.5 : 0,
      });
    }
    // Snow (71-77, 85-86)
    else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) {
      map.setSnow({
        density: 1,
        intensity: code >= 73 ? 1 : 0.5,
        color: "#ffffff",
      });
      map.setFog({
        range: [1, 4],
        color: light === "day" ? "#eef2f5" : "#223",
        "high-color": light === "day" ? "#d9e2e8" : "#112",
        "space-color": "#000",
        "star-intensity":
          light === "night" || light === "dusk" || light === "dawn" ? 1.0 : 0,
      });
    }
    // Thunderstorm (95, 96, 99)
    else if (code >= 95) {
      map.setRain({ density: 1, intensity: 1, color: "#556677" });
      if (light === "day")
        map.setConfigProperty("basemap", "lightPreset", "dusk"); // Darken for storm
    }

    // Schedule next poll in 15 minutes to keep it continuously synced
    if (!_weatherPollInterval) {
      _weatherPollInterval = setInterval(
        () => {
          applyRealWeather(map);
        },
        15 * 60 * 1000,
      );
    }
  } catch (e) {
  }
}

// ====== DEVICE TIER PROFILER ======
function getDeviceTier() {
  const hardwareConcurrency = navigator.hardwareConcurrency || 2;
  const devicePixelRatio = window.devicePixelRatio || 1;
  let renderer = "";
  try {
    const gl = document.createElement("canvas").getContext("webgl");
    if (gl) {
      const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
      if (debugInfo) {
        renderer = gl
          .getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          .toLowerCase();
      }
    }
  } catch (e) {}

  const isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    );

  // All desktop and laptop web browsers are strictly 2D for maximum performance
  if (!isMobile) {
    return "low";
  }

  // Phone devices get 3D optimized
  const isAppleGPU = /apple/i.test(renderer);
  const isHighEndMaliOrAdreno = /mali-g7|adreno (6|7)/i.test(renderer);

  if (hardwareConcurrency <= 4 && !isAppleGPU && !isHighEndMaliOrAdreno) {
    return "low"; // Extremely budget phones get 2D
  } else if (hardwareConcurrency >= 8 || isAppleGPU || isHighEndMaliOrAdreno) {
    return "high"; // Powerful phones get full 3D (Antialiasing + Trees)
  }

  return "mid"; // Standard phones get 3D optimized (No Antialiasing, No Trees)
}

// Retry state for initLeaflet() — see the comment inside for why this exists.
let _initLeafletRetried = false;

function initLeaflet() {
  if (lmap) return;
  // mapbox-gl.js loads via <script defer>, so it can still be mid-download
  // the first time renderView() reaches "browse" (e.g. a fast session
  // restore). Previously this just bailed with no retry, permanently
  // orphaning the #cumulus-loader overlay since its removal is solely
  // gated on this map's "idle" event. Retry once, shortly after, instead
  // of giving up outright — renderView("browse") only calls this once per
  // render, so without a retry a mistimed first call meant the map (and
  // the loader hiding it) never had a second chance this session.
  if (typeof mapboxgl === "undefined") {
    if (!_initLeafletRetried) {
      _initLeafletRetried = true;
      setTimeout(initLeaflet, 300);
    }
    return;
  }
  if (!mapboxConfigured()) return;
  const host = document.getElementById("main-map");
  if (!host) return;
  mapboxgl.accessToken = MAPBOX_TOKEN;

  const tier = getDeviceTier();
  const mapConfig = {
    container: host,
    style: mapboxStyleUrl(), // Standard style is required to support live weather colours
    center: [-0.1276, 51.5072],
    zoom: 12,
    fadeDuration: 300,
    attributionControl: false,
    crossSourceCollisions: false,
    localIdeographFontFamily:
      "'Noto Sans', 'Helvetica Neue', Arial, sans-serif",
    prefetchZoomDelta: 2,
  };

  if (tier === "low") {
    mapConfig.pitch = 45;
    mapConfig.maxPitch = 60;
    mapConfig.dragPitch = true;
    mapConfig.touchPitch = true;
    mapConfig.pitchWithRotate = true;
    mapConfig.antialias = false;
  } else if (tier === "mid") {
    mapConfig.pitch = 45;
    mapConfig.maxPitch = 60;
    mapConfig.dragPitch = true;
    mapConfig.touchPitch = true;
    mapConfig.pitchWithRotate = true;
    mapConfig.antialias = false;
  } else {
    mapConfig.pitch = 45;
    mapConfig.maxPitch = 85;
    mapConfig.dragPitch = true;
    mapConfig.touchPitch = true;
    mapConfig.pitchWithRotate = true;
    mapConfig.antialias = true;
  }

  lmap = new mapboxgl.Map(mapConfig);
  lmap.addControl(
    new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }),
    "top-right",
  );
  // Dev-only: manual weather-state cycling button for testing. Real users
  // always get applyRealWeather()'s live London weather; never show the
  // test control off localhost (same gate as loadDevFixtureEvents() above).
  if (/^(localhost|127\.0\.0\.1)$/.test(location.hostname)) {
    lmap.addControl(new WeatherControl(), "top-right");
  }

  // Prevent DOM thrashing (throttled via requestAnimationFrame)
  let movestartScheduled = false;
  lmap.on("movestart", () => {
    if (movestartScheduled) return;
    movestartScheduled = true;
    requestAnimationFrame(() => {
      document.body.classList.add("map-moving");
      movestartScheduled = false;
    });
  });

  let moveendScheduled = false;
  lmap.on("moveend", () => {
    if (moveendScheduled) return;
    moveendScheduled = true;
    requestAnimationFrame(() => {
      document.body.classList.remove("map-moving");
      moveendScheduled = false;
    });
  });

  lmap.on("style.load", () => {
    applyMapChrome(lmap, true);
    attachMapLayers();

    // Default to time-based theme for safety, overridden by real weather shortly
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    lmap.setConfigProperty("basemap", "lightPreset", isDark ? "night" : "day");

    // Performance optimizations
    lmap.setConfigProperty("basemap", "show3dTrees", tier === "high");
    lmap.setConfigProperty("basemap", "show3dObjects", tier !== "low"); // Flat buildings on low tier to save FPS
    lmap.setConfigProperty("basemap", "showPointOfInterestLabels", false);
    lmap.setConfigProperty("basemap", "showTransitLabels", false);

    // Fog Occlusion Culling for Low/Mid tiers
    if (tier === "low" || tier === "mid") {
      const bgColor =
        getComputedStyle(document.documentElement)
          .getPropertyValue("--bg")
          .trim() || "#0F0E0C";
      lmap.setFog({
        range: [0.5, 2],
        color: bgColor,
        "horizon-blend": 0.1,
      });
    }

    // Fetch and apply real London weather!
    applyRealWeather(lmap);
  });

  // Hide the immersive loader once Mapbox has fully compiled shaders and loaded tiles
  // We add a 2.5 second buffer after 'idle' to ensure HTML markers are fully painted and JIT is settled
  lmap.once("idle", () => {
    setTimeout(() => {
      const loader = document.getElementById("cumulus-loader");
      if (loader) {
        loader.style.opacity = "0";
        setTimeout(() => loader.remove(), 500);
      }
      // If we were background loading, transition into the app now!
      if (typeof window.resolveBgLoad === "function") {
        window.resolveBgLoad();
      }
    }, 2500);
  });
}

function initHostMap() {
  if (hostMap) {
    hostMap.remove();
    hostMap = null;
    hostMarker = null;
  }
  const el = document.getElementById("host-map-picker");
  if (!el || typeof mapboxgl === "undefined" || !mapboxConfigured()) return;
  mapboxgl.accessToken = MAPBOX_TOKEN;
  hostMap = new mapboxgl.Map({
    container: el,
    style: mapboxStyleUrl(),
    center: [newEventLon, newEventLat],
    zoom: 13,
    fadeDuration: 300,
    attributionControl: false,
    maxPitch: 0,
    pitch: 0,
    dragPitch: false,
    touchPitch: false,
    pitchWithRotate: false,
    crossSourceCollisions: false,
    localIdeographFontFamily:
      "'Noto Sans', 'Helvetica Neue', Arial, sans-serif",
    prefetchZoomDelta: 2,
  });
  hostMap.addControl(
    new mapboxgl.NavigationControl({ showCompass: true }),
    "top-right",
  );
  hostMap.on("style.load", () => {
    const isDark =
      document.documentElement.getAttribute("data-theme") === "dark";
    hostMap.setConfigProperty(
      "basemap",
      "lightPreset",
      isDark ? "night" : "day",
    );
    hostMap.setConfigProperty("basemap", "show3dTrees", false);
    hostMap.setConfigProperty("basemap", "showPointOfInterestLabels", false);
    hostMap.setConfigProperty("basemap", "showTransitLabels", false);
    hostMap.setFog(null);
    hostMap.setRain(null);
    hostMap.setSnow(null);
  });
  hostMap.on("style.load", () => {
    applyMapChrome(hostMap, false);
  });
  const hostEl = document.createElement("div");
  hostEl.className = "evpin-wrap";
  hostEl.innerHTML = `<div style="width:22px;height:22px;border-radius:50%;background:var(--accent);border:2.5px solid #fff;box-shadow:0 0 0 1.5px rgba(0,0,0,0.5),0 2px 8px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;"><span style="width:6px;height:6px;border-radius:50%;background:#fff;display:block;"></span></div>`;
  hostMarker = new mapboxgl.Marker({ element: hostEl })
    .setLngLat([newEventLon, newEventLat])
    .addTo(hostMap);
  hostMap.on("click", function (e) {
    newEventLat = e.lngLat.lat;
    newEventLon = e.lngLat.lng;
    hostMarker.setLngLat([newEventLon, newEventLat]);
    const el = document.getElementById("host-lat-lon-text");
    if (el)
      el.innerText = `Location Pinned: (${newEventLat.toFixed(4)}, ${newEventLon.toFixed(4)})`;
  });
  setTimeout(() => hostMap.resize(), 50);
}

// ---- ADDRESS SEARCH ----
function generateSessionToken() {
  if (window.crypto && window.crypto.randomUUID)
    return window.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
let searchSessionToken = generateSessionToken();
let autocompleteTimeout = null;
function handleAddressAutocomplete() {
  const query = (
    document.getElementById("host-address-search")?.value || ""
  ).trim();
  const resultsDiv = document.getElementById("autocomplete-results");
  clearTimeout(autocompleteTimeout);
  if (query.length < 3) {
    resultsDiv.innerHTML = "";
    resultsDiv.style.display = "none";
    return;
  }
  if (!mapboxConfigured()) {
    resultsDiv.innerHTML = `<div style="padding:10px 16px;font-size:13.5px;color:#E23B3B;">A Mapbox token is required.</div>`;
    resultsDiv.style.display = "block";
    return;
  }
  autocompleteTimeout = setTimeout(async () => {
    resultsDiv.innerHTML =
      '<div style="padding:10px 16px;font-size:13.5px;color:var(--text-muted);">Searching…</div>';
    resultsDiv.style.display = "block";
    try {
      const url = `https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${MAPBOX_TOKEN}&session_token=${searchSessionToken}&country=gb&language=en&limit=6&types=address,poi,place,locality,neighborhood,postcode`;
      const res = await fetch(url);
      if (!res.ok) {
        let r = `Error (${res.status}).`;
        if (res.status === 401 || res.status === 403) r = "Token rejected.";
        else if (res.status === 429) r = "Rate limit hit.";
        resultsDiv.innerHTML = `<div style="padding:10px 16px;font-size:13.5px;color:#E23B3B;">${r}</div>`;
        return;
      }
      const data = await res.json();
      if (data && data.suggestions && data.suggestions.length > 0) {
        resultsDiv.innerHTML = data.suggestions
          .map((s) => {
            const fullAddress = s.full_address || s.place_formatted || s.name;
            const placeText = s.name || fullAddress;
            const mapboxId = (s.mapbox_id || "").replace(/'/g, "'");
            return `<div style="padding:10px 14px;cursor:pointer;font-size:13.5px;border-bottom:1px solid var(--line-soft);color:var(--text);" onclick="selectSearchSuggestion('${mapboxId}','${escapeHtml(fullAddress).replace(/'/g, "'")}','${escapeHtml(placeText).replace(/'/g, "'")}')" role="button" tabindex="0">
            <div style="font-weight:600;">${escapeHtml(placeText)}</div>
            ${s.place_formatted ? `<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${escapeHtml(s.place_formatted)}</div>` : ""}
          </div>`;
          })
          .join("");
      } else {
        resultsDiv.innerHTML =
          '<div style="padding:10px 14px;font-size:13.5px;color:var(--text-muted);">No matches found</div>';
      }
    } catch (e) {
      resultsDiv.innerHTML = `<div style="padding:10px 14px;font-size:13.5px;color:#E23B3B;">Network error. <button onclick="handleAddressAutocomplete()" style="border:1px solid #E23B3B;background:transparent;color:#E23B3B;border-radius:8px;padding:2px 8px;font-size:11px;cursor:pointer;">Retry</button></div>`;
    }
  }, 350);
}
async function selectSearchSuggestion(mapboxId, fullAddress, placeText) {
  const resultsDiv = document.getElementById("autocomplete-results");
  document.getElementById("host-address-search").value = fullAddress;
  resultsDiv.innerHTML =
    '<div style="padding:10px 14px;font-size:13.5px;color:var(--text-muted);">Pinpointing…</div>';
  try {
    const res = await fetch(
      `https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?access_token=${MAPBOX_TOKEN}&session_token=${searchSessionToken}`,
    );
    if (!res.ok) throw new Error(`retrieve ${res.status}`);
    const data = await res.json();
    const f = data && data.features && data.features[0];
    if (!f) throw new Error("no feature");
    const [lon, lat] = f.geometry.coordinates;
    selectAutocompleteAddress(lat, lon, fullAddress, placeText);
    resultsDiv.style.display = "none";
  } catch (e) {
    resultsDiv.innerHTML = `<div style="padding:10px 14px;font-size:13.5px;color:#E23B3B;">Couldn't pinpoint. <button onclick="handleAddressAutocomplete()" style="border:1px solid #E23B3B;background:transparent;color:#E23B3B;border-radius:8px;padding:2px 8px;cursor:pointer;font-size:11px;">Retry</button></div>`;
  } finally {
    searchSessionToken = generateSessionToken();
  }
}
function selectAutocompleteAddress(lat, lon, fullAddress, name) {
  newEventLat = lat;
  newEventLon = lon;
  document.getElementById("host-address-search").value = fullAddress;
  document.getElementById("autocomplete-results").style.display = "none";
  if (hostMap && hostMarker) {
    hostMarker.setLngLat([lon, lat]);
    hostMap.flyTo({ center: [lon, lat], zoom: 15 });
  }
  const el = document.getElementById("host-lat-lon-text");
  if (el)
    el.innerText = `Location Pinned: (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  const venueInput = document.getElementById("host-venue");
  if (name && venueInput && !venueInput.value && isNaN(name))
    venueInput.value = name.trim();
}

async function submitHostEvent() {
  const title = (document.getElementById("host-title")?.value || "").trim();
  const cat = document.getElementById("host-cat")?.value;
  const startDate = document.getElementById("host-start-date")?.value;
  const startTime = document.getElementById("host-start-time")?.value;
  const endDate = document.getElementById("host-end-date")?.value;
  const endTime = document.getElementById("host-end-time")?.value;
  const startVal = startDate && startTime ? `${startDate}T${startTime}` : "";
  const endVal = endDate && endTime ? `${endDate}T${endTime}` : "";
  const areaName = (document.getElementById("host-area")?.value || "").trim();
  const venue = (document.getElementById("host-venue")?.value || "").trim();
  const capStr = document.getElementById("host-capacity")?.value;
  const priceStr = document.getElementById("host-price")?.value;
  const priceVal = priceStr ? parseFloat(priceStr) : 0;
  const desc = (document.getElementById("host-desc")?.value || "").trim();
  if (!title || !startVal || !endVal || !venue || !capStr) {
    showToast(
      "Please fill in title, date & time, venue, and capacity.",
      "error",
    );
    return;
  }
  const stDate = new Date(startVal),
    enDate = new Date(endVal);
  if (stDate >= enDate) {
    showToast("End time must be after start time.", "error");
    return;
  }

  // Every event is public. Admin submissions publish immediately; everyone
  // else goes via pending_events for a quick review (see the notify-admin
  // edge function, which emails on every new pending row).
  if (state.isAdmin) {
    const pubAddress =
      document.getElementById("host-address-search")?.value || "";
    const abtn = document.getElementById("host-submit-btn");
    if (abtn) {
      abtn.disabled = true;
      abtn.textContent = "Publishing…";
    }
    const { data: aData, error: aErr } = await sb
      .from("events")
      .insert({
        title,
        category: cat,
        host_id: state.userId,
        host_name: state.profileName,
        venue,
        area: areaName || "London",
        address: pubAddress,
        lat: newEventLat,
        lon: newEventLon,
        start_time: stDate.toISOString(),
        end_time: enDate.toISOString(),
        description: desc,
        capacity: parseInt(capStr, 10),
        price: priceVal,
      })
      .select()
      .single();
    if (abtn) {
      abtn.disabled = false;
      abtn.textContent = "Publish event →";
    }
    if (aErr) {
      showToast("Failed to publish event — " + aErr.message, "error");
      return;
    }
    // Inject into local EVENTS array so map updates immediately
    const aEv = {
      id: aData.id,
      title: aData.title,
      category: aData.category,
      host: aData.host_name,
      hostId: aData.host_id,
      venue: aData.venue,
      area: aData.area,
      address: aData.address,
      lat: aData.lat,
      lon: aData.lon,
      startTime: aData.start_time,
      endTime: aData.end_time,
      desc: aData.description,
      capacity: aData.capacity,
      price: priceVal,
    };
    computeEventDates(aEv);
    EVENTS.push(aEv);
    await sb
      .from("rsvps")
      .insert({
        event_id: aData.id,
        user_id: state.userId,
        user_name: state.profileName,
      })
      .catch(() => {});
    state.rsvps[aData.id] = [state.profileName];
    showToast("Event published live to the map!", "success");
    openEvent(aData.id);
    return;
  }

  // Non-admin: queue in pending_events for owner approval
  const pubAddress =
    document.getElementById("host-address-search")?.value || "";
  const pending = {
    title,
    category: cat,
    host_id: state.userId || null,
    host_name: state.profileName || "",
    host_email: state.profileEmail || "",
    venue,
    area: areaName || "London",
    address: pubAddress,
    lat: newEventLat,
    lon: newEventLon,
    start_time: stDate.toISOString(),
    end_time: enDate.toISOString(),
    description: desc,
    capacity: parseInt(capStr, 10),
    price: priceVal,
    status: "pending",
    created_at: new Date().toISOString(),
  };
  const pbtn = document.getElementById("host-submit-btn");
  if (pbtn) {
    pbtn.disabled = true;
    pbtn.textContent = "Submitting…";
  }
  let saved = false;
  try {
    const { error } = await sb.from("pending_events").insert(pending);
    if (!error) saved = true;
  } catch (e) {}
  if (!saved) {
    try {
      const arr = JSON.parse(
        localStorage.getItem("pending_events_local") || "[]",
      );
      arr.push({ ...pending, id: "local_" + Date.now() });
      localStorage.setItem("pending_events_local", JSON.stringify(arr));
      saved = true;
    } catch (e) {}
  }
  if (pbtn) {
    pbtn.disabled = false;
    pbtn.textContent = "Submit for review →";
  }
  showToast(
    saved
      ? "Submitted for review — we'll approve it shortly."
      : "Could not submit — please try again.",
    saved ? "success" : "error",
  );
  if (saved) {
    state.view = "browse";
    renderNav();
    renderView();
  }
}

function showMapLayer(visible) {
  ["main-map", "map-filters", "map-caption-bar"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = visible ? "" : "none";
  });
  const fab = document.getElementById("owner-fin-fab");
  if (fab)
    fab.style.display =
      visible && state.profileEmail === "gondoxml@gmail.com" ? "block" : "none";
}

// ═══════════════════════════════════════════════════════
// OWNER FINANCIAL DASHBOARD
// ═══════════════════════════════════════════════════════

const OD_PRESETS = {
  Launch: {
    ev: 15,
    tx: 25,
    pr: 12,
    fep: 20,
    frp: 6,
    fev: 5,
    frv: 20,
    cb: 0.3,
    drop: 3,
    ctx: "<strong>Launch:</strong> Solo founder. Tier 1 events (£12 avg). Pre-VAT. Connect Standard — zero per-host fees. 48hr escrow hold is the fraud buffer.",
    cs: { cost: 0, l: "Not yet needed" },
    eng: { cost: 0, l: "You are the engineer" },
  },
  Traction: {
    ev: 80,
    tx: 35,
    pr: 14,
    fep: 120,
    frp: 7,
    fev: 20,
    frv: 35,
    cb: 0.5,
    drop: 3,
    ctx: "<strong>Traction:</strong> ~80 paid events/mo. £14 avg = Tier 1 (£1.50 fee). Monitor VAT threshold. In-app refund UX deflects chargebacks. Private + vetted free events.",
    cs: { cost: 1050, l: "Part-time CS (50%)" },
    eng: { cost: 350, l: "Engineer retainer 8 hrs/mo" },
  },
  Scaling: {
    ev: 350,
    tx: 50,
    pr: 18,
    fep: 500,
    frp: 7,
    fev: 80,
    frv: 40,
    cb: 0.5,
    drop: 3,
    ctx: "<strong>Scaling:</strong> £18 avg = Tier 2 threshold area. Approaching VAT at this volume. Connect Standard saves ~£2/mo per host vs Express.",
    cs: { cost: 2100, l: "Full-time CS rep" },
    eng: { cost: 4500, l: "Engineer pt contract 3d/wk" },
  },
  Dominance: {
    ev: 1500,
    tx: 75,
    pr: 22,
    fep: 2000,
    frp: 7,
    fev: 350,
    frv: 45,
    cb: 0.5,
    drop: 3,
    ctx: "<strong>Dominance:</strong> £22 avg = Tier 2 (£2.50 fee). VAT registered. Post-VAT net ~£1.67/ticket. Stripe revenue share negotiations should begin.",
    cs: { cost: 4200, l: "CS team × 2" },
    eng: { cost: 9000, l: "Senior engineer 5d/wk" },
  },
  CityLeader: {
    ev: 5000,
    tx: 90,
    pr: 22,
    fep: 6000,
    frp: 8,
    fev: 1000,
    frv: 50,
    cb: 0.4,
    drop: 3,
    ctx: "<strong>City Leader:</strong> 450k paid tickets/mo. VAT registered. Enterprise infra deals. Stripe Connect revenue share active.",
    cs: { cost: 18000, l: "Head of CS + 4 reps" },
    eng: { cost: 18000, l: "2 full-time engineers" },
  },
  London1: {
    ev: 12000,
    tx: 100,
    pr: 25,
    fep: 14000,
    frp: 8,
    fev: 2500,
    frv: 55,
    cb: 0.3,
    drop: 3,
    ctx: "<strong>London #1:</strong> 1.2M paid tickets/mo. Tier 2 fee (£2.50). VAT registered. Enterprise agreements across stack. Stripe Connect revenue share at maximum leverage.",
    cs: { cost: 45000, l: "CS team of 10 + manager" },
    eng: { cost: 50000, l: "Engineering team of 5" },
  },
  Custom: {
    ev: 80,
    tx: 35,
    pr: 14,
    fep: 120,
    frp: 7,
    fev: 20,
    frv: 35,
    cb: 0.5,
    drop: 3,
    ctx: "<strong>Custom:</strong> Adjust all inputs manually.",
    cs: { cost: 0, l: "Set manually" },
    eng: { cost: 0, l: "Set manually" },
  },
};
let _odCur = "Traction";

const _odGbp = (v) =>
  new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(v) || 0);
const _odFmt = (v) =>
  v >= 1e6
    ? (v / 1e6).toFixed(1) + "M"
    : v >= 1e3
      ? (v / 1e3).toFixed(1) + "k"
      : Math.round(v).toString();

async function clearAllTestData(confirmed) {
  if (state.profileEmail !== "gondoxml@gmail.com") {
    showToast("Owner only", "error");
    return;
  }
  if (!confirmed) {
    showConfirm(
      "Wipe all test data?",
      "This deletes every row in users, events, rsvps, tickets, chat_messages, and friends in Supabase. Seed events in the app are unaffected (they're hardcoded). Cannot be undone.",
      "Wipe everything",
      "clearAllTestData",
    );
    return;
  }
  showToast("Wiping…", "info");
  try {
    await Promise.all([
      sb.from("chat_messages").delete().not("id", "is", null),
      sb.from("rsvps").delete().not("id", "is", null),
      sb.from("tickets").delete().not("id", "is", null),
      sb.from("friends").delete().not("id", "is", null),
    ]);
    await sb.from("events").delete().not("id", "is", null);
    await sb.from("users").delete().not("id", "is", null);
    showToast("All test data wiped. Signing out…", "success");
    setTimeout(() => resetProfile(true), 1200);
  } catch (err) {
    showToast("Wipe failed — check console", "error");
  }
}

// Admin: clear ONLY the users table (all accounts / emails). Events & other
// test data are left intact. Owner-only, test-environment convenience.
async function clearAllUsers(confirmed) {
  if (state.profileEmail !== "gondoxml@gmail.com") {
    showToast("Owner only", "error");
    return;
  }
  if (!confirmed) {
    if (
      !confirm(
        "Delete ALL user accounts (every email) from the users table? Events and other data are kept. This cannot be undone.",
      )
    )
      return;
  }
  showToast("Clearing user accounts…", "info");
  try {
    const { error } = await sb.from("users").delete().not("id", "is", null);
    if (error) throw error;
    showToast("All user accounts cleared. Signing out…", "success");
    setTimeout(() => resetProfile(true), 1200);
  } catch (err) {
    showToast("Clear failed — check console", "error");
  }
}

function od_tog(id) {
  const wrap = document.getElementById("od-wrap");
  if (!wrap) return;
  const h = wrap.querySelector("#od-sh-" + id),
    b = wrap.querySelector("#od-sb-" + id);
  if (!h || !b) return;
  const o = b.classList.contains("open");
  b.classList.toggle("open", !o);
  h.classList.toggle("open", !o);
  h.setAttribute("aria-expanded", String(!o));
}

function _odPlatformFee(pr) {
  if (pr <= 15)
    return { fee: 1.5, tier: 1, label: "Tier 1", badge: "badge-t1" };
  if (pr <= 40)
    return { fee: 2.5, tier: 2, label: "Tier 2", badge: "badge-t2" };
  if (pr <= 71)
    return { fee: 3.5, tier: 3, label: "Tier 3", badge: "badge-t3" };
  return { fee: 4.5, tier: 4, label: "Tier 4", badge: "badge-t4" };
}
function _odVatOnFee(fee, vatReg) {
  return vatReg ? fee / 6 : 0;
}
function _odStripeCost(total) {
  return total * 0.015 + 0.2;
}
function _odBarCol(p) {
  return p < 60 ? "#22C55E" : p < 85 ? "#E0B23C" : "#E24B4A";
}
function _odTierCls(p) {
  return p < 60 ? "tbadge tok" : p < 85 ? "tbadge twarn" : "tbadge tdanger";
}
function _odSetBar(g, id, p) {
  const el = g(id);
  if (el) {
    el.style.width = Math.min(p, 100) + "%";
    el.style.background = _odBarCol(Math.min(p, 100));
  }
}
function _odSetTier(g, id, l, p) {
  const el = g(id);
  if (el) {
    el.className = _odTierCls(Math.min(p, 100));
    el.textContent = l;
  }
}
function _odCalcSupa(r, m) {
  const o = r > 500000 || m > 50000;
  return {
    cost: o ? 20 : 0,
    rp: Math.min((r / 500000) * 100, 100),
    mp: Math.min((m / 50000) * 100, 100),
    over: o,
  };
}
function _odCalcMb(l) {
  if (l <= 50000) return { cost: 0, p: (l / 50000) * 100, t: "Free" };
  return {
    cost: Math.round(((l - 50000) / 1000) * 0.4 * 100) / 100,
    p: 100,
    t: "Paid",
  };
}
function _odCalcEm(e) {
  if (e <= 3000) return { cost: 0, p: (e / 3000) * 100, t: "Free" };
  if (e <= 50000) return { cost: 15, p: (e / 50000) * 100, t: "Starter" };
  return { cost: 35, p: (e / 100000) * 100, t: "Pro" };
}
function _odCalcVc(i) {
  if (i <= 1e6) return { cost: 0, p: (i / 1e6) * 100, t: "Free" };
  return { cost: 18, p: 100, t: "Pro" };
}

function od_renderStaff() {
  const wrap = document.getElementById("od-wrap");
  if (!wrap) return;
  const g = (id) => wrap.querySelector("#" + id);
  const st = (id, v) => {
    const el = g(id);
    if (el) el.textContent = v;
  };
  const p = OD_PRESETS[_odCur];
  const list = g("od-staff-list");
  if (!list) return;
  list.innerHTML = "";
  [
    { name: "CS team", data: p.cs },
    { name: "Engineering", data: p.eng },
  ].forEach((r) => {
    const el = document.createElement("div");
    el.style.cssText =
      "display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#1E1F24;border-radius:10px;margin-bottom:6px;";
    const z = r.data.cost === 0;
    el.innerHTML =
      '<div><div style="font-size:12px;font-weight:500;color:#C5C6CB">' +
      r.name +
      '</div><div style="font-size:10px;color:#5F5E5A;margin-top:2px">' +
      r.data.l +
      '</div></div><div><div style="font-family:&quot;SF Mono&quot;,monospace;font-size:13px;font-weight:600;color:' +
      (z ? "#5F5E5A" : "#E24B4A") +
      '">' +
      _odGbp(r.data.cost) +
      "/mo</div></div>";
    list.appendChild(el);
  });
  const tot = p.cs.cost + p.eng.cost;
  st("od-staff-total", _odGbp(tot));
  st("od-shv-staff", _odGbp(tot) + "/mo");
}

function od_recalc() {
  const wrap = document.getElementById("od-wrap");
  if (!wrap) return;
  const g = (id) => wrap.querySelector("#" + id);
  const gv = (id) => {
    const el = g(id);
    return el ? Number(el.value) : 0;
  };
  const st = (id, v) => {
    const el = g(id);
    if (el) el.textContent = v;
  };

  const ev = gv("od-sl-ev"),
    tx = gv("od-sl-tx"),
    pr = gv("od-sl-pr");
  const fep = gv("od-sl-fe-p"),
    frp = gv("od-sl-fr-p"),
    fev = gv("od-sl-fe-v"),
    frv = gv("od-sl-fr-v");
  const cbRate = gv("od-sl-cb") / 100,
    dropRate = gv("od-sl-drop") / 100;

  st("od-lev", ev.toLocaleString());
  st("od-ltx", tx.toLocaleString());
  st("od-lpr", "£" + pr);
  st("od-lfe-p", fep.toLocaleString());
  st("od-lfr-p", Math.min(frp, 10));
  st("od-lfe-v", fev.toLocaleString());
  st("od-lfr-v", frv);
  st("od-lcb", gv("od-sl-cb").toFixed(1) + "%");
  st("od-ldrop", gv("od-sl-drop") + "%");
  st("od-shv-paid", ev.toLocaleString() + " events · £" + pr);

  const { fee, tier, label } = _odPlatformFee(pr);
  const checkoutPrice = pr + fee;
  const stripePerTx = _odStripeCost(checkoutPrice);
  const grossTix = ev * tx;
  const annFeeRev = grossTix * fee * 12;
  const vatReg = annFeeRev >= 90000;
  const vatPerTix = _odVatOnFee(fee, vatReg);
  const netFeePerTix = fee - vatPerTix - stripePerTx;
  const dropTix = Math.round(grossTix * dropRate);
  const paidTix = Math.max(0, grossTix - dropTix);

  // Tier box
  ["t1", "t2", "t3", "t4"].forEach((t, i) => {
    const el = g("od-tbr-" + t);
    if (el) el.className = "tb-row" + (tier === i + 1 ? " active" : "");
  });
  st("od-tb-tiern", tier);
  st("od-tb-host", "£" + pr.toFixed(2));
  const elFee = g("od-tb-fee");
  if (elFee) elFee.textContent = "£" + fee.toFixed(2);
  const elStr = g("od-tb-stripe");
  if (elStr) elStr.textContent = "-£" + stripePerTx.toFixed(2);
  const elVat = g("od-tb-vat");
  if (elVat)
    elVat.textContent = vatReg
      ? "-£" + vatPerTix.toFixed(2)
      : "£0.00 (pre-threshold)";
  st("od-tb-checkout", "£" + checkoutPrice.toFixed(2));
  const elNet = g("od-tb-net");
  if (elNet) {
    elNet.textContent =
      (netFeePerTix < 0 ? "-" : "") + "£" + Math.abs(netFeePerTix).toFixed(2);
    elNet.style.color =
      netFeePerTix < 0.2
        ? "#E24B4A"
        : netFeePerTix < 0.5
          ? "#E0B23C"
          : "#22C55E";
  }

  st("od-st-ptx", _odFmt(paidTix));
  st("od-st-fee", "£" + fee.toFixed(2));
  st("od-st-checkout", "£" + checkoutPrice.toFixed(2));

  // Revenue
  const grossFeeRev = paidTix * fee;
  const totalVat = paidTix * vatPerTix;
  const netFeeRev = grossFeeRev - totalVat;
  const totalStripe = paidTix * stripePerTx;
  const cbCount = Math.round(paidTix * cbRate);
  const cbCost = cbCount * 15;
  const gp = netFeeRev - totalStripe - cbCost;

  st("od-pl-pf", _odGbp(grossFeeRev));
  const pfNote = g("od-pf-note");
  if (pfNote)
    pfNote.textContent =
      _odFmt(paidTix) + " tickets × £" + fee.toFixed(2) + " (" + label + ")";
  const plVat = g("od-pl-vat");
  if (plVat) {
    plVat.textContent = vatReg ? "-" + _odGbp(totalVat) : "£0";
    plVat.className = "plv " + (vatReg ? "rd" : "dim");
  }
  const vatNote = g("od-vat-note");
  if (vatNote)
    vatNote.textContent = vatReg
      ? "Registered · annualised £" +
        Math.round(annFeeRev / 1000) +
        "k > £90k threshold"
      : "Pre-threshold · annualised £" +
        Math.round(annFeeRev / 1000) +
        "k / £90k";
  st("od-pl-netrev", _odGbp(netFeeRev));
  const plStr = g("od-pl-str");
  if (plStr) {
    plStr.textContent = "-" + _odGbp(totalStripe);
    plStr.className = "plv str";
  }
  const strNote = g("od-str-note");
  if (strNote)
    strNote.textContent =
      "1.5%+20p on £" +
      checkoutPrice.toFixed(2) +
      " × " +
      _odFmt(paidTix) +
      " txns";
  const plCb = g("od-pl-cb");
  if (plCb) {
    plCb.textContent = cbCount > 0 ? "-" + _odGbp(cbCost) : "£0";
    plCb.className = "plv " + (cbCount > 0 ? "rd" : "dim");
  }
  const cbNote = g("od-cb-note");
  if (cbNote)
    cbNote.textContent =
      cbCount > 0 ? cbCount + " disputes × £15" : "No disputes modelled";
  st("od-pl-gp", _odGbp(gp));

  // Infra
  const privRsvp = fep * Math.min(frp, 10),
    vetRsvp = fev * frv,
    totalFree = privRsvp + vetRsvp;
  const totalLoad = paidTix + totalFree;
  const freeRatio = totalLoad > 0 ? totalFree / totalLoad : 0;
  st("od-total-free", _odFmt(totalFree));
  st("od-load-ratio", Math.round(freeRatio * 100) + "% free");
  const lb = g("od-load-bar");
  if (lb) {
    lb.style.width = Math.min(freeRatio * 100, 100) + "%";
    lb.style.background = _odBarCol(Math.min((freeRatio / 0.6) * 100, 100));
  }
  st("od-shv-free", _odFmt(totalFree) + " free RSVPs/mo");

  const dbRows = totalLoad * 5,
    maus = Math.round(totalLoad * 0.6),
    mapLoads = paidTix * 2,
    emails = totalLoad * 1.5,
    inv = totalLoad * 8;
  const sb = _odCalcSupa(dbRows, maus),
    mb = _odCalcMb(mapLoads),
    em = _odCalcEm(emails),
    vc = _odCalcVc(inv);
  _odSetBar(g, "od-sb-b", sb.rp);
  _odSetTier(
    g,
    "od-sb-t",
    sb.over ? "Over free" : sb.rp > 60 ? "Near limit" : "Free",
    sb.rp,
  );
  st("od-sb-n", _odFmt(dbRows));
  const sbC = g("od-sb-c");
  if (sbC) {
    sbC.textContent = "£" + sb.cost;
    sbC.className = "uc " + (sb.cost > 0 ? "bad" : "ok");
  }
  _odSetBar(g, "od-mau-b", sb.mp);
  _odSetTier(
    g,
    "od-mau-t",
    sb.over ? "Over free" : sb.mp > 60 ? "Near limit" : "Free",
    sb.mp,
  );
  st("od-mau-n", _odFmt(maus) + " MAUs");
  _odSetBar(g, "od-mb-b", mb.p);
  _odSetTier(g, "od-mb-t", mb.t, mb.p);
  st("od-mb-n", _odFmt(mapLoads));
  const mbC = g("od-mb-c");
  if (mbC) {
    mbC.textContent = "£" + Math.round(mb.cost);
    mbC.className = "uc " + (mb.cost > 0 ? "bad" : "ok");
  }
  _odSetBar(g, "od-em-b", em.p);
  _odSetTier(g, "od-em-t", em.t, em.p);
  st("od-em-n", _odFmt(emails));
  const emC = g("od-em-c");
  if (emC) {
    emC.textContent = "£" + em.cost;
    emC.className = "uc " + (em.cost > 0 ? "bad" : "ok");
  }
  _odSetBar(g, "od-vc-b", vc.p);
  _odSetTier(g, "od-vc-t", vc.t, vc.p);
  st("od-vc-n", _odFmt(inv));
  const vcC = g("od-vc-c");
  if (vcC) {
    vcC.textContent = "£" + vc.cost;
    vcC.className = "uc " + (vc.cost > 0 ? "bad" : "ok");
  }
  const totalInfra = sb.cost + Math.round(mb.cost) + em.cost + vc.cost;
  st("od-infra-tot", "£" + totalInfra.toLocaleString());
  st("od-shv-infra", "£" + totalInfra + "/mo");
  const plSb = g("od-pl-sb");
  if (plSb) {
    plSb.textContent = sb.cost > 0 ? "-£" + sb.cost : "£0";
    plSb.className = "plv " + (sb.cost > 0 ? "am" : "dim");
  }
  const sbPl = g("od-sb-pl");
  if (sbPl) sbPl.textContent = sb.cost > 0 ? "Pro" : "Free";
  const plMb = g("od-pl-mb");
  if (plMb) {
    plMb.textContent = mb.cost > 0 ? "-£" + Math.round(mb.cost) : "£0";
    plMb.className = "plv " + (mb.cost > 0 ? "am" : "dim");
  }
  const mbPl = g("od-mb-pl");
  if (mbPl) mbPl.textContent = mb.t;
  const plEm = g("od-pl-em");
  if (plEm) {
    plEm.textContent = em.cost > 0 ? "-£" + em.cost : "£0";
    plEm.className = "plv " + (em.cost > 0 ? "am" : "dim");
  }
  const emPl = g("od-em-pl");
  if (emPl) emPl.textContent = em.t;
  const plVc = g("od-pl-vc");
  if (plVc) {
    plVc.textContent = vc.cost > 0 ? "-£" + vc.cost : "£0";
    plVc.className = "plv " + (vc.cost > 0 ? "am" : "dim");
  }
  const vcPl = g("od-vc-pl");
  if (vcPl) vcPl.textContent = vc.t;

  // Staffing
  const p = OD_PRESETS[_odCur];
  const csC = p.cs.cost,
    engC = p.eng.cost,
    totalStaff = csC + engC,
    totalOpex = totalInfra + totalStaff;
  const plCs = g("od-pl-cs");
  if (plCs) {
    plCs.textContent = csC > 0 ? "-" + _odGbp(csC) : "£0";
    plCs.className = "plv " + (csC > 0 ? "pu" : "dim");
  }
  const csN = g("od-cs-n");
  if (csN) csN.textContent = p.cs.l;
  const plEng = g("od-pl-eng");
  if (plEng) {
    plEng.textContent = engC > 0 ? "-" + _odGbp(engC) : "£0";
    plEng.className = "plv " + (engC > 0 ? "pu" : "dim");
  }
  const engN = g("od-eng-n");
  if (engN) engN.textContent = p.eng.l;
  st("od-pl-opex", "-" + _odGbp(totalOpex));

  // Tax + founder draw
  const pre = gp - totalOpex,
    ann = pre * 12,
    tr = pre > 0 ? (ann > 50000 ? 0.25 : 0.19) : 0,
    tax = pre > 0 ? pre * tr : 0,
    netAfterTax = pre - tax;
  const DRAW_TARGET = 10000,
    DRAW_CAP = 20000;
  let actualDraw, drawLabel, reinvest;
  if (netAfterTax <= 0) {
    actualDraw = 0;
    drawLabel = "Business not yet profitable";
    reinvest = 0;
  } else if (netAfterTax < DRAW_TARGET) {
    actualDraw = netAfterTax;
    drawLabel = "Below £10k — taking all profit as draw";
    reinvest = 0;
  } else if (netAfterTax < DRAW_CAP) {
    actualDraw = DRAW_TARGET;
    drawLabel = "£10k/mo draw · surplus reinvested";
    reinvest = netAfterTax - actualDraw;
  } else {
    actualDraw = DRAW_CAP;
    drawLabel = "£20k/mo hard cap reached · everything above reinvests";
    reinvest = netAfterTax - actualDraw;
  }

  st("od-pl-pre", _odGbp(pre));
  const taxL = g("od-tax-l");
  if (taxL) taxL.textContent = "UK corp tax · " + tr * 100 + "% effective rate";
  st("od-pl-tax", "-" + _odGbp(tax));
  const plDraw = g("od-pl-draw");
  if (plDraw)
    plDraw.textContent = actualDraw > 0 ? "-" + _odGbp(actualDraw) : "£0";
  const drawNote = g("od-draw-note");
  if (drawNote) drawNote.textContent = drawLabel;
  const drawDisplay = g("od-draw-display");
  if (drawDisplay) drawDisplay.textContent = _odGbp(actualDraw) + "/mo";
  const neEl = g("od-pl-net");
  if (neEl) {
    neEl.textContent = _odGbp(reinvest);
    neEl.className =
      "od-thv " + (reinvest > 0 ? "pos" : netAfterTax <= 0 ? "neg" : "pos");
  }

  // Status pills
  const pillTier = g("od-pill-tier");
  if (pillTier) {
    pillTier.textContent = label + " · £" + fee.toFixed(2) + "/ticket";
    pillTier.className =
      "status-pill " +
      (tier === 1
        ? "sp-blue"
        : tier === 2
          ? "sp-green"
          : tier === 3
            ? "sp-amber"
            : "sp-purple");
  }
  const pillVat = g("od-pill-vat");
  if (pillVat) {
    pillVat.textContent = vatReg
      ? "VAT Registered"
      : "Pre-VAT (£" + Math.round(annFeeRev / 1000) + "k/£90k)";
    pillVat.className = "status-pill " + (vatReg ? "sp-red" : "sp-green");
  }
  const pillStripe = g("od-pill-stripe");
  if (pillStripe) {
    pillStripe.textContent = "Stripe · £" + stripePerTx.toFixed(2) + "/txn";
    pillStripe.className = "status-pill sp-blue";
  }
  const pillNet = g("od-pill-net");
  if (pillNet) {
    pillNet.textContent = "Net £" + netFeePerTix.toFixed(2) + "/ticket";
    pillNet.className =
      "status-pill " +
      (netFeePerTix < 0.2
        ? "sp-red"
        : netFeePerTix < 0.6
          ? "sp-amber"
          : "sp-green");
  }

  // Vetting highlight
  ["od-vc1", "od-vc2", "od-vc3", "od-vc4"].forEach((id) => {
    const el = g(id);
    if (el) el.className = "vet-card";
  });
  if (pr < 20) {
    const el = g("od-vc1");
    if (el) el.className = "vet-card active";
  } else if (pr < 50) {
    const el = g("od-vc2");
    if (el) el.className = "vet-card active";
  } else {
    const el = g("od-vc3");
    if (el) el.className = "vet-card active";
  }

  // Alerts
  const stripePct = netFeeRev > 0 ? (totalStripe / netFeeRev) * 100 : 0;
  const aVat = g("od-alert-vat");
  if (aVat) aVat.className = "pitfall-alert " + (vatReg ? "info show" : "");
  const aCb = g("od-alert-cb");
  if (aCb) aCb.className = "pitfall-alert " + (cbCost > 500 ? "warn show" : "");
  const aStr = g("od-alert-stripe");
  if (aStr)
    aStr.className = "pitfall-alert " + (stripePct > 40 ? "warn show" : "");
  const aMar = g("od-alert-margin");
  if (aMar) aMar.className = "pitfall-alert " + (pre < 0 ? "danger show" : "");
  const aRat = g("od-alert-ratio");
  if (aRat)
    aRat.className = "pitfall-alert " + (freeRatio > 0.6 ? "warn show" : "");

  // Risk list
  const risks = [
    {
      n: "Net margin per ticket",
      d: "After Stripe + VAT (ex-infra/staff)",
      v: "£" + netFeePerTix.toFixed(2),
      cls: netFeePerTix < 0.2 ? "bad" : netFeePerTix < 0.5 ? "warn" : "ok",
      note: netFeePerTix < 0.2 ? "Below safety floor" : "Healthy",
    },
    {
      n: "VAT status",
      d: vatReg
        ? "Registered · 20% absorbed from fee"
        : "Pre-threshold — build reserves",
      v: vatReg ? _odGbp(totalVat) + "/mo withheld" : "Pre-VAT",
      cls: vatReg ? "warn" : "ok",
      note: vatReg
        ? "Checkout price unchanged"
        : "Cross £90k annualised fee revenue to trigger",
    },
    {
      n: "Stripe fee drag",
      d: "Processing as % of net fee revenue",
      v: Math.round(stripePct) + "%",
      cls: stripePct > 40 ? "bad" : stripePct > 25 ? "warn" : "ok",
      note:
        stripePct > 40 ? "Raise ticket price to Tier 2 range" : "Acceptable",
    },
    {
      n: "Chargeback exposure",
      d: cbCount + " disputes · £15 each",
      v: _odGbp(cbCost) + "/mo",
      cls: cbCost > 2000 ? "bad" : cbCost > 500 ? "warn" : "ok",
      note: "In-app refund UX deflects most",
    },
    {
      n: "Free load ratio",
      d: Math.round(freeRatio * 100) + "% of RSVPs are free",
      v: Math.round(freeRatio * 100) + "%",
      cls: freeRatio > 0.8 ? "bad" : freeRatio > 0.6 ? "warn" : "ok",
      note: "Private cap (10) + vetting keeps this manageable",
    },
    {
      n: "Staffing vs gross profit",
      d: "Staff cost as % of gross profit",
      v: gp > 0 ? Math.round((totalStaff / gp) * 100) + "%" : "N/A",
      cls:
        gp > 0 && totalStaff > gp
          ? "bad"
          : gp > 0 && totalStaff / gp > 0.6
            ? "warn"
            : "ok",
      note: "Hire too early = margin squeeze",
    },
  ];
  const rl = g("od-risk-list");
  if (!rl) return;
  rl.innerHTML = "";
  let score = 0;
  risks.forEach((r) => {
    if (r.cls === "bad") score += 2;
    else if (r.cls === "warn") score += 1;
    const el = document.createElement("div");
    el.className = "risk-row";
    el.innerHTML =
      '<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:500;color:#C5C6CB">' +
      r.n +
      '</div><div style="font-size:10px;color:#5F5E5A;margin-top:2px">' +
      r.d +
      '</div><div style="font-size:10px;color:#5B9FD9;margin-top:2px">' +
      r.note +
      '</div></div><div style="text-align:right;flex-shrink:0;margin-left:8px"><div class="rc ' +
      r.cls +
      '">' +
      r.v +
      "</div></div>";
    rl.appendChild(el);
  });
  st(
    "od-shv-risks",
    score === 0
      ? "All clear"
      : score <= 2
        ? "Low risk"
        : score <= 4
          ? "Watch"
          : score <= 6
            ? "High risk"
            : "Critical",
  );
  st(
    "od-shv-risk",
    gv("od-sl-cb").toFixed(1) + "% CB · " + gv("od-sl-drop") + "% drop",
  );
}

function initOwnerDash() {
  const wrap = document.getElementById("od-wrap");
  if (!wrap) return;
  const g = (id) => wrap.querySelector("#" + id);
  const sv2 = (id, v) => {
    const el = g(id);
    if (el) el.value = v;
  };

  [
    "od-sl-ev",
    "od-sl-tx",
    "od-sl-pr",
    "od-sl-fe-p",
    "od-sl-fr-p",
    "od-sl-fe-v",
    "od-sl-fr-v",
    "od-sl-cb",
    "od-sl-drop",
  ].forEach((id) => {
    const el = g(id);
    if (!el) return;
    el.addEventListener("input", () => {
      _odCur = "Custom";
      wrap.querySelectorAll("[data-odp]").forEach((b) => {
        b.classList.remove("a");
        if (b.dataset.odp === "Custom") b.classList.add("a");
      });
      const ctx = g("od-ctx");
      if (ctx) ctx.innerHTML = OD_PRESETS.Custom.ctx;
      od_renderStaff();
      od_recalc();
    });
  });

  const presetsEl = g("od-presets");
  if (presetsEl) {
    presetsEl.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-odp]");
      if (!btn) return;
      const n = btn.dataset.odp;
      _odCur = n;
      wrap.querySelectorAll("[data-odp]").forEach((b) => {
        b.classList.remove("a");
        if (b.classList.contains("hype")) b.classList.remove("a");
      });
      btn.classList.add("a");
      const p = OD_PRESETS[n];
      sv2("od-sl-ev", p.ev);
      sv2("od-sl-tx", p.tx);
      sv2("od-sl-pr", p.pr);
      sv2("od-sl-fe-p", p.fep);
      sv2("od-sl-fr-p", p.frp);
      sv2("od-sl-fe-v", p.fev);
      sv2("od-sl-fr-v", p.frv);
      sv2("od-sl-cb", p.cb);
      sv2("od-sl-drop", p.drop);
      const ctx = g("od-ctx");
      if (ctx) ctx.innerHTML = p.ctx;
      od_renderStaff();
      od_recalc();
    });
  }

  const ctx = g("od-ctx");
  if (ctx) ctx.innerHTML = OD_PRESETS[_odCur].ctx;
  od_renderStaff();
  od_recalc();
  // Kick off live Supabase data load
  loadOwnerLiveData();
}

// ── LIVE FINANCIAL DATA ──────────────────────────────────────────────
let ownerLiveData = null;
let _ownerLiveLoading = false;

async function loadOwnerLiveData() {
  if (_ownerLiveLoading) return;
  _ownerLiveLoading = true;
  const btn = document.getElementById("od-live-refresh");
  if (btn) {
    btn.textContent = "↻ Loading…";
    btn.disabled = true;
  }
  try {
    const [tkRes, evRes, usRes, rvRes] = await Promise.all([
      sb.from("tickets").select("price_per_ticket, total, purchased_at"),
      sb.from("events").select("id, price, start_time"),
      sb.from("users").select("id, created_at"),
      sb.from("rsvps").select("id, created_at"),
    ]);
    const tix = tkRes.data || [];
    const evs = evRes.data || [];
    const users = usRes.data || [];
    const rsvps = rvRes.data || [];

    const paid = tix.filter((t) => (t.price_per_ticket || 0) > 0);
    const free = tix.filter((t) => !((t.price_per_ticket || 0) > 0));
    const grossRev = tix.reduce((s, t) => s + (t.total || 0), 0);
    const feeRev = paid.reduce(
      (s, t) => s + getCumulusFee(t.price_per_ticket || 0),
      0,
    );
    const stripeCosts = paid.reduce((s, t) => {
      const fee = getCumulusFee(t.price_per_ticket || 0);
      return s + ((t.price_per_ticket || 0) + fee) * 0.015 + 0.2;
    }, 0);

    const now = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mTix = tix.filter(
      (t) => t.purchased_at && new Date(t.purchased_at) >= mStart,
    );
    const mPaid = mTix.filter((t) => (t.price_per_ticket || 0) > 0);
    const mGross = mTix.reduce((s, t) => s + (t.total || 0), 0);
    const mFeeRev = mPaid.reduce(
      (s, t) => s + getCumulusFee(t.price_per_ticket || 0),
      0,
    );

    ownerLiveData = {
      totalTickets: tix.length,
      paidTickets: paid.length,
      freeTickets: free.length,
      grossRev,
      feeRev,
      stripeCosts,
      netFeeRev: feeRev - stripeCosts,
      totalEvents: evs.length,
      paidEvents: evs.filter((e) => (e.price || 0) > 0).length,
      totalUsers: users.length,
      totalRsvps: rsvps.length,
      mTickets: mTix.length,
      mGross,
      mFeeRev,
      updatedAt: new Date(),
    };
    _renderOwnerLivePanel();
  } catch (err) {
    const p = document.getElementById("od-live-panel");
    if (p)
      p.querySelector(".od-live-loading").textContent =
        "Could not load data — check console.";
  } finally {
    _ownerLiveLoading = false;
    const btn2 = document.getElementById("od-live-refresh");
    if (btn2) {
      btn2.textContent = "↻ Refresh";
      btn2.disabled = false;
    }
  }
}

function _renderOwnerLivePanel() {
  const panel = document.getElementById("od-live-panel");
  if (!panel || !ownerLiveData) return;
  const d = ownerLiveData;
  const fmt = (n) =>
    n >= 1000000
      ? (n / 1000000).toFixed(1) + "M"
      : n >= 1000
        ? (n / 1000).toFixed(1) + "k"
        : String(n);
  const fmtGbp = (n) => {
    const abs = Math.abs(n);
    const s =
      abs >= 1000 ? "£" + (abs / 1000).toFixed(1) + "k" : "£" + abs.toFixed(2);
    return n < 0 ? "-" + s : s;
  };
  const ts = d.updatedAt.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const pct = (a, b) => (b > 0 ? " (" + Math.round((a / b) * 100) + "%)" : "");

  panel.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;">
      <div>
        <div style="font-size:12px;font-weight:700;color:var(--text);">Live Platform Data</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:1px;">Updated ${ts} · from Supabase</div>
      </div>
      <button id="od-live-refresh" onclick="loadOwnerLiveData()" style="background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;color:var(--text-muted);cursor:pointer;font-family:var(--font-sans);">↻ Refresh</button>
    </div>

    <div class="od-live-stat-grid">
      <div class="od-live-stat">
        <div class="od-live-stat-label">Tickets Sold</div>
        <div class="od-live-stat-value" style="color:var(--accent);">${fmt(d.totalTickets)}</div>
        <div class="od-live-stat-sub">${d.paidTickets} paid · ${d.freeTickets} free</div>
      </div>
      <div class="od-live-stat">
        <div class="od-live-stat-label">Users</div>
        <div class="od-live-stat-value">${fmt(d.totalUsers)}</div>
        <div class="od-live-stat-sub">registered</div>
      </div>
      <div class="od-live-stat">
        <div class="od-live-stat-label">RSVPs</div>
        <div class="od-live-stat-value">${fmt(d.totalRsvps)}</div>
        <div class="od-live-stat-sub">${d.totalEvents} events</div>
      </div>
    </div>

    <div style="background:var(--surface-2);border:1px solid var(--line);border-radius:12px;padding:12px 14px;margin-bottom:8px;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--text-muted);margin-bottom:10px;">Revenue — All Time</div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label">Gross Ticket Revenue</div><div class="od-live-rev-sub">sum of buyer checkout totals</div></div>
        <div class="od-live-rev-val" style="color:var(--text);">${fmtGbp(d.grossRev)}</div>
      </div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label">Cumulus Fee Revenue</div><div class="od-live-rev-sub">${d.paidTickets} paid tickets × tiered fee</div></div>
        <div class="od-live-rev-val" style="color:#22C55E;">${fmtGbp(d.feeRev)}</div>
      </div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label">Stripe Processing Costs</div><div class="od-live-rev-sub">1.5% + 20p per transaction${pct(d.stripeCosts, d.feeRev)}</div></div>
        <div class="od-live-rev-val" style="color:#E24B4A;">-${fmtGbp(d.stripeCosts)}</div>
      </div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label" style="font-weight:700;color:var(--text);">Net Fee Revenue</div><div class="od-live-rev-sub">after processing costs</div></div>
        <div class="od-live-rev-val" style="color:${d.netFeeRev >= 0 ? "#22C55E" : "#E24B4A"};font-size:16px;">${fmtGbp(d.netFeeRev)}</div>
      </div>
    </div>

    ${
      d.mTickets > 0 || d.mGross > 0
        ? `
    <div class="od-live-month">
      <div class="od-live-month-label">This Month</div>
      <div class="od-live-month-stats">
        <div><div class="od-live-mstat-val">${d.mTickets}</div><div class="od-live-mstat-key">tickets</div></div>
        <div><div class="od-live-mstat-val" style="color:#22C55E;">${fmtGbp(d.mFeeRev)}</div><div class="od-live-mstat-key">fee revenue</div></div>
        <div><div class="od-live-mstat-val" style="color:var(--text-soft);">${fmtGbp(d.mGross)}</div><div class="od-live-mstat-key">gross</div></div>
      </div>
    </div>`
        : `
    <div style="text-align:center;padding:10px;font-size:12px;color:var(--text-muted);">No transactions this month yet</div>`
    }
  `;
}
// ─────────────────────────────────────────────────────────────────────

function renderOwnerDash() {
  const isOwner = state.profileEmail === "gondoxml@gmail.com";
  if (!isOwner)
    return `<div class="empty-state" style="padding:40px 20px;text-align:center;"><div style="margin-bottom:12px;color:var(--text-muted);">${lockIconSvg(32)}</div><div style="font-weight:700;margin-bottom:6px;">Restricted</div><div style="color:var(--text-muted);font-size:13px;">Owner access only.</div></div>`;

  const p = OD_PRESETS[_odCur];
  return `
  <button class="back-btn" onclick="goBack()">←</button>
  <div class="connect-header" style="padding-top:8px;">
    <h2>Finances</h2>
    <p>Live data · P&amp;L projections · Risk analysis</p>
  </div>

  <!-- Live Supabase data panel -->
  <div class="od-live-panel" id="od-live-panel">
    <div class="od-live-loading">
      <div style="font-size:13px;color:var(--text-muted);">Loading live data…</div>
      <button id="od-live-refresh" onclick="loadOwnerLiveData()" style="margin-top:8px;background:var(--surface-2);border:1px solid var(--line);border-radius:8px;padding:6px 12px;font-size:11px;font-weight:600;color:var(--text-muted);cursor:pointer;font-family:var(--font-sans);">↻ Refresh</button>
    </div>
  </div>

  <!-- P&L Projection Model -->
  <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:var(--text-muted);margin-bottom:10px;padding:2px 0;">P&amp;L Projection Model</div>
  <div id="od-wrap">
    <div class="pb" id="od-presets">
      <button data-odp="Launch">Launch</button>
      <button data-odp="Traction" class="a">Traction</button>
      <button data-odp="Scaling">Scaling</button>
      <button data-odp="Dominance">Dominance</button>
      <button class="hype" data-odp="CityLeader">City Leader</button>
      <button class="hype" data-odp="London1">London #1</button>
      <button data-odp="Custom">Custom</button>
    </div>
    <div class="ctx" id="od-ctx"></div>

    <div class="status-bar">
      <div class="status-pill sp-blue" id="od-pill-tier">—</div>
      <div class="status-pill sp-green" id="od-pill-vat">Pre-VAT</div>
      <div class="status-pill sp-blue" id="od-pill-stripe">Stripe</div>
      <div class="status-pill sp-green" id="od-pill-net">—</div>
    </div>

    <div class="pitfall-alert info" id="od-alert-vat">ℹ VAT threshold crossed — 20% absorbed from platform fee. Checkout price unchanged. Net margin per ticket reduces.</div>
    <div class="pitfall-alert warn" id="od-alert-cb">⚠ Chargeback fees exceeding £500/mo — ensure in-app refund UX is prominent to deflect bank disputes.</div>
    <div class="pitfall-alert warn" id="od-alert-stripe">⚠ Stripe fees over 40% of fee revenue — consider raising average ticket price above £15 to unlock Tier 2.</div>
    <div class="pitfall-alert danger" id="od-alert-margin">⚠ Pre-tax margin negative — costs outpacing revenue. Review staffing timing.</div>
    <div class="pitfall-alert warn" id="od-alert-ratio">⚠ Free event load above 60% of total RSVPs — tighten vetted organiser criteria.</div>

    <!-- PAID EVENTS -->
    <div class="section-h open" id="od-sh-paid" onclick="od_tog('paid')" role="button" tabindex="0" aria-expanded="true" aria-controls="od-sb-paid">
      <span class="sh-t"><span class="od-dot" style="background:#5B9FD9"></span> Paid events</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-paid">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b open" id="od-sb-paid">
      <div class="od-card">
        <div class="od-sr"><div class="od-st"><span>Monthly paid events</span><span class="od-vb" id="od-lev">—</span></div><input type="range" id="od-sl-ev" min="1" max="10000" step="1" value="${p.ev}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. tickets per event</span><span class="od-vb" id="od-ltx">—</span></div><input type="range" id="od-sl-tx" min="5" max="500" step="1" value="${p.tx}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. ticket price (host cut)</span><span class="od-vb" id="od-lpr">—</span></div><input type="range" id="od-sl-pr" min="1" max="200" step="1" value="${p.pr}"></div>
        <div class="tier-box">
          <div class="tb-row" id="od-tbr-t1"><span class="tb-label">£0–£15 <span class="tb-badge badge-t1">Tier 1</span></span><span class="tb-val" style="color:#5B9FD9">£1.50 fee</span></div>
          <div class="tb-row" id="od-tbr-t2"><span class="tb-label">£16–£40 <span class="tb-badge badge-t2">Tier 2</span></span><span class="tb-val" style="color:#22C55E">£2.50 fee</span></div>
          <div class="tb-row" id="od-tbr-t3"><span class="tb-label">£41–£71 <span class="tb-badge badge-t3">Tier 3</span></span><span class="tb-val" style="color:#E0B23C">£3.50 fee</span></div>
          <div class="tb-row" id="od-tbr-t4"><span class="tb-label">£72+ <span class="tb-badge badge-t4">Tier 4</span></span><span class="tb-val" style="color:#AFA9EC">£4.50 fee</span></div>
          <div class="tb-div"></div>
          <div class="tb-row"><span class="tb-label">Host sets price</span><span class="tb-val" id="od-tb-host">—</span></div>
          <div class="tb-row"><span class="tb-label">Cumulus fee (Tier <span id="od-tb-tiern">—</span>)</span><span class="tb-val" style="color:#22C55E" id="od-tb-fee">—</span></div>
          <div class="tb-row"><span class="tb-label">Stripe on total (1.5%+20p)</span><span class="tb-val" style="color:#E24B4A" id="od-tb-stripe">—</span></div>
          <div class="tb-row"><span class="tb-label">VAT from fee (if >£90k/yr)</span><span class="tb-val" style="color:#E24B4A" id="od-tb-vat">—</span></div>
          <div class="tb-div"></div>
          <div class="tb-total"><span style="color:#C5C6CB">Attendee pays</span><span style="color:#F1F1EF" id="od-tb-checkout">—</span></div>
          <div class="tb-total" style="margin-top:4px"><span style="color:#C5C6CB">Cumulus nets/ticket</span><span id="od-tb-net" style="color:#22C55E">—</span></div>
        </div>
      </div>
    </div>

    <!-- FREE EVENTS -->
    <div class="section-h" id="od-sh-free" onclick="od_tog('free')" style="margin-top:4px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-free">
      <span class="sh-t"><span class="od-dot" style="background:#D4537E"></span> Free events</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-free">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-free">
      <div class="od-card">
        <div class="od-sr"><div class="od-st"><span>Private events/mo (friends, cap 10)</span><span class="od-vp" id="od-lfe-p">—</span></div><input type="range" id="od-sl-fe-p" min="0" max="5000" step="1" value="${p.fep}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. RSVPs (max 10)</span><span class="od-vp" id="od-lfr-p">—</span></div><input type="range" id="od-sl-fr-p" min="2" max="10" step="1" value="${p.frp}"></div>
        <div style="height:1px;background:#2A2B32;margin:8px 0"></div>
        <div class="od-sr"><div class="od-st"><span>Vetted organiser free events/mo</span><span class="od-vp" id="od-lfe-v">—</span></div><input type="range" id="od-sl-fe-v" min="0" max="3000" step="1" value="${p.fev}"></div>
        <div class="od-sr"><div class="od-st"><span>Avg. RSVPs per vetted event</span><span class="od-vp" id="od-lfr-v">—</span></div><input type="range" id="od-sl-fr-v" min="5" max="200" step="1" value="${p.frv}"></div>
        <div style="margin-top:10px;padding:10px 12px;background:#1E1F24;border-radius:10px;">
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px"><span style="color:#868C96">Total free RSVPs/mo</span><span style="font-family:'SF Mono',monospace;color:#D4537E" id="od-total-free">—</span></div>
          <div style="display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px"><span style="color:#868C96">Free vs total load</span><span style="font-family:'SF Mono',monospace" id="od-load-ratio">—</span></div>
          <div style="height:5px;background:#0F1117;border-radius:3px;overflow:hidden"><div id="od-load-bar" style="height:100%;border-radius:3px;background:#D4537E;width:0%"></div></div>
          <div style="font-size:10px;color:#5F5E5A;margin-top:5px">Private events capped at 10 RSVPs · vetted requires 3 successful paid events</div>
        </div>
      </div>
    </div>

    <!-- HOST VETTING -->
    <div class="section-h" id="od-sh-vet" onclick="od_tog('vet')" style="margin-top:4px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-vet">
      <span class="sh-t"><span class="od-dot" style="background:#E0B23C"></span> Host vetting tiers</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-vet">Active</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-vet">
      <div class="od-card">
        <div style="font-size:11px;color:#868C96;margin-bottom:8px;line-height:1.5">Vetting scales with financial risk. Graduated hosts (3+ paid events, zero disputes) bypass all gates.</div>
        <div class="vetting-grid">
          <div class="vet-card" id="od-vc1"><div class="vc-tier" style="color:#5B9FD9">Tier 1 · Under £20</div><div class="vc-rule">Instant publish. 48hr escrow hold is security buffer.</div></div>
          <div class="vet-card" id="od-vc2"><div class="vc-tier" style="color:#22C55E">Tier 2 · £20–£49</div><div class="vc-rule">Requires social graph verification or community website.</div></div>
          <div class="vet-card" id="od-vc3"><div class="vc-tier" style="color:#E0B23C">Tier 3 · £50+</div><div class="vc-rule">Queue pause. Host submits justification or venue docs. 4hr review target.</div></div>
          <div class="vet-card" id="od-vc4"><div class="vc-tier" style="color:#AFA9EC">Graduated</div><div class="vc-rule">3 successful paid events, zero dispute flags — all gates removed permanently.</div></div>
        </div>
      </div>
    </div>

    <!-- RISK INPUTS -->
    <div class="section-h" id="od-sh-risk" onclick="od_tog('risk')" style="margin-top:4px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-risk">
      <span class="sh-t"><span class="od-dot" style="background:#E24B4A"></span> Risk inputs</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-risk">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-risk">
      <div class="od-card">
        <div class="od-sr"><div class="od-st"><span>Chargeback rate (% paid tickets)</span><span class="od-vr" id="od-lcb">—</span></div><input type="range" id="od-sl-cb" min="0" max="2" step="0.1" value="${p.cb}"></div>
        <div style="font-size:10px;color:#5F5E5A;margin-top:-4px;margin-bottom:10px">CNP industry avg 0.6–1.0% · in-app refund UX deflects to ~0.3–0.5% · £15 fee per dispute</div>
        <div class="od-sr"><div class="od-st"><span>Fee drop-off at checkout (%)</span><span class="od-vr" id="od-ldrop">—</span></div><input type="range" id="od-sl-drop" min="0" max="20" step="1" value="${p.drop}"></div>
        <div style="font-size:10px;color:#5F5E5A;margin-top:-4px">Tickets lost due to visible fee — lower with DICE-style upfront pricing (3% realistic)</div>
      </div>
    </div>

    <!-- STAFFING -->
    <div class="section-h" id="od-sh-staff" onclick="od_tog('staff')" style="margin-top:4px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-staff">
      <span class="sh-t"><span class="od-dot" style="background:#7F77DD"></span> Staffing</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-staff">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-staff">
      <div class="od-card">
        <div id="od-staff-list"></div>
        <div style="margin-top:10px;padding:9px 12px;background:#1E1F24;border-radius:10px;display:flex;justify-content:space-between">
          <span style="font-size:12px;color:#868C96">Total team staffing/mo</span>
          <span style="font-family:'SF Mono',monospace;font-size:14px;font-weight:600;color:#7F77DD" id="od-staff-total">£0</span>
        </div>
        <div style="height:1px;background:#2A2B32;margin:12px 0"></div>
        <div class="od-lbl"><span class="od-dot" style="background:#22C55E"></span> Founder draw (automatic)</div>
        <div class="founder-box">
          <div class="founder-row"><span>Below £10k profit</span><span style="font-family:'SF Mono',monospace;color:#C5C6CB">Take all of it</span></div>
          <div class="founder-row"><span>£10k – £20k profit</span><span style="font-family:'SF Mono',monospace;color:#22C55E">Draw £10k · rest reinvests</span></div>
          <div class="founder-row" style="margin-bottom:0"><span>Above £20k profit</span><span style="font-family:'SF Mono',monospace;color:#22C55E">Hard cap £20k · rest reinvests</span></div>
        </div>
      </div>
    </div>

    <!-- P&L -->
    <div style="margin-top:10px">
      <div class="od-card">
        <div class="od-stats3">
          <div class="od-sc"><div class="od-sl">Paid tickets</div><div class="od-sv bl" id="od-st-ptx">—</div></div>
          <div class="od-sc"><div class="od-sl">Platform fee</div><div class="od-sv gn" id="od-st-fee">—</div></div>
          <div class="od-sc"><div class="od-sl">Buyer pays</div><div class="od-sv" id="od-st-checkout" style="color:#F1F1EF">—</div></div>
        </div>

        <div class="od-stag">Revenue</div>
        <div class="plr"><div class="pll">Platform fees collected<small id="od-pf-note">—</small></div><div class="plv gn" id="od-pl-pf">—</div></div>
        <div class="plr"><div class="pll">UK VAT withheld (if applicable)<small id="od-vat-note">—</small></div><div class="plv rd" id="od-pl-vat">—</div></div>
        <div class="plr"><div class="pll s">Net fee revenue (ex-VAT)</div><div class="plv" id="od-pl-netrev">—</div></div>

        <div class="od-div"></div>
        <div class="od-stag">Payment costs (Connect Standard)</div>
        <div class="plr"><div class="pll">Stripe processing (1.5% + 20p)<small id="od-str-note">—</small></div><div class="plv str" id="od-pl-str">—</div></div>
        <div class="plr"><div class="pll">Chargebacks<small id="od-cb-note">—</small></div><div class="plv rd" id="od-pl-cb">—</div></div>
        <div class="plr"><div class="pll s">Gross profit after payments</div><div class="plv" id="od-pl-gp">—</div></div>

        <div class="od-div"></div>
        <div class="od-stag">Infrastructure</div>
        <div class="plr"><div class="pll">Supabase<small id="od-sb-pl">—</small></div><div class="plv am" id="od-pl-sb">£0</div></div>
        <div class="plr"><div class="pll">Mapbox<small id="od-mb-pl">—</small></div><div class="plv am" id="od-pl-mb">£0</div></div>
        <div class="plr"><div class="pll">Resend<small id="od-em-pl">—</small></div><div class="plv am" id="od-pl-em">£0</div></div>
        <div class="plr"><div class="pll">Vercel<small id="od-vc-pl">—</small></div><div class="plv am" id="od-pl-vc">£0</div></div>

        <div class="od-div"></div>
        <div class="od-stag">Staffing</div>
        <div class="plr"><div class="pll">CS team<small id="od-cs-n">—</small></div><div class="plv pu" id="od-pl-cs">—</div></div>
        <div class="plr"><div class="pll">Engineering<small id="od-eng-n">—</small></div><div class="plv pu" id="od-pl-eng">—</div></div>

        <div class="od-div"></div>
        <div class="plr"><div class="pll s">Total OpEx</div><div class="plv am" id="od-pl-opex">—</div></div>
        <div class="plr"><div class="pll s">Pre-tax net margin</div><div class="plv" id="od-pl-pre">—</div></div>
        <div class="plr"><div class="pll">UK corp tax<small id="od-tax-l">—</small></div><div class="plv rd" id="od-pl-tax">—</div></div>
        <div class="plr"><div class="pll">Founder draw<small id="od-draw-note">—</small></div><div class="plv gn" id="od-pl-draw">—</div></div>

        <div class="od-th">
          <div><div class="od-t1">Reinvestment pool</div><div class="od-t2">Profit returned to business after your draw</div></div>
          <div style="text-align:right">
            <div class="od-thv pos" id="od-pl-net">—</div>
            <div style="font-size:11px;margin-top:4px;font-family:'SF Mono',monospace;color:#868C96">your draw: <span id="od-draw-display" style="color:#22C55E">—</span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- PITFALL ANALYSIS -->
    <div class="section-h" id="od-sh-risks" onclick="od_tog('risks')" style="margin-top:10px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-risks">
      <span class="sh-t"><span class="od-dot" style="background:#E24B4A"></span> Pitfall analysis</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-risks">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-risks">
      <div class="od-card" style="margin-top:4px"><div id="od-risk-list"></div></div>
    </div>

    <!-- INFRASTRUCTURE -->
    <div class="section-h" id="od-sh-infra" onclick="od_tog('infra')" style="margin-top:4px" role="button" tabindex="0" aria-expanded="false" aria-controls="od-sb-infra">
      <span class="sh-t"><span class="od-dot" style="background:#1D9E75"></span> Infrastructure headroom</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-infra">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-infra">
      <div class="od-card" style="margin-top:4px">
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Supabase rows <span class="tbadge tok" id="od-sb-t">Free</span></span><span class="ibar-nums" id="od-sb-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-sb-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 500k → Pro £20</span><span class="uc ok" id="od-sb-c">£0</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Supabase MAUs <span class="tbadge tok" id="od-mau-t">Free</span></span><span class="ibar-nums" id="od-mau-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-mau-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 50k → Pro 100k</span><span class="uc ok" id="od-mau-c">incl.</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Mapbox <span class="tbadge tok" id="od-mb-t">Free</span></span><span class="ibar-nums" id="od-mb-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-mb-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 50k → £0.40/1k</span><span class="uc ok" id="od-mb-c">£0</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Resend <span class="tbadge tok" id="od-em-t">Free</span></span><span class="ibar-nums" id="od-em-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-em-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 3k → Starter £15 → Pro £35</span><span class="uc ok" id="od-em-c">£0</span></div>
        </div>
        <div class="ibar-row">
          <div class="ibar-top"><span class="ibar-name">Vercel <span class="tbadge tok" id="od-vc-t">Free</span></span><span class="ibar-nums" id="od-vc-n">—</span></div>
          <div class="ibar-track"><div class="ibar-fill" id="od-vc-b" style="width:0%"></div></div>
          <div class="ibar-det"><span>Free 1M → Pro £18</span><span class="uc ok" id="od-vc-c">£0</span></div>
        </div>
        <div style="margin-top:10px;padding:9px 12px;background:#1E1F24;border-radius:10px;display:flex;justify-content:space-between">
          <span style="font-size:12px;color:#868C96">Total infra/mo</span>
          <span style="font-family:'SF Mono',monospace;font-size:13px;font-weight:600;color:#F1F1EF" id="od-infra-tot">£0</span>
        </div>
      </div>
    </div>

    <!-- DEV TOOLS -->
    <div style="margin-top:24px;padding-top:16px;border-top:1px solid #2A2B32;">
      <div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#5F5E5A;margin-bottom:10px;">Developer tools</div>
      <button onclick="clearAllTestData()" style="width:100%;padding:11px;background:transparent;border:1px solid #E24B4A44;border-radius:10px;color:#E24B4A;font-size:12px;font-weight:600;cursor:pointer;font-family:-apple-system,sans-serif;letter-spacing:0.01em;">🗑 Wipe all Supabase test data &amp; sign out</button>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════
// HOST PAYOUTS PANEL
// ═══════════════════════════════════════════════════════
// state.hostPayouts is a lazy cache: undefined = not yet fetched (kicks off
// fetchHostPayouts() and re-renders when it lands), array = fetched (empty
// array included). fetchHostPayouts() also lazily flips any row past its
// scheduled_release_at to 'released' server-side before returning.
function renderHostPayoutsPanel() {
  if (state.hostPayouts === undefined) {
    state.hostPayouts = null; // guard against a double-fetch while in flight
    fetchHostPayouts().then((rows) => {
      state.hostPayouts = rows;
      renderView();
    });
  }

  const rows = state.hostPayouts;
  const statusLabel = { pending: "Held", released: "Released", disputed: "Disputed" };
  const statusColor = { pending: "var(--text-muted)", released: "#147136", disputed: "#b3261e" };
  const payoutRows = (rows || [])
    .map((p) => {
      const ev = EVENTS.find((e) => e.id === p.event_id);
      const when =
        p.status === "released"
          ? `Released ${new Date(p.released_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
          : `Releases ${new Date(p.scheduled_release_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
      return `<div class="hp-tier-row">
        <span class="hp-tier-label">${escapeHtml(ev ? ev.title : "Event")} · £${Number(p.net_amount).toFixed(2)}</span>
        <span class="hp-tier-fee" style="color:${statusColor[p.status] || "var(--text-muted)"}">${statusLabel[p.status] || p.status} · ${when}</span>
      </div>`;
    })
    .join("");

  // Bookkeeping only — no payment processor is wired up in this codebase yet,
  // so this tracks WHEN/WHOM a payout would go to, but never moves real money.
  return `
  <div class="hp-panel">
    <div class="hp-title">💸 Your payouts explained</div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">You set the ticket price and <strong style="color:var(--text);">keep 100% of it</strong> — always. Buyers pay a small platform fee at checkout that covers card processing and running Cumulus. It's added on top of your price, so it never comes out of your earnings.</div>
    <div class="hp-tier-row">
      <span class="hp-tier-label">Your ticket price</span>
      <span class="hp-tier-fee" style="color:#147136">You keep 100%</span>
    </div>
    <div class="hp-tier-row">
      <span class="hp-tier-label">Platform fee</span>
      <span class="hp-tier-fee" style="color:var(--text-muted)">Added at checkout · paid by the buyer</span>
    </div>
    <div style="margin-top:12px;padding:10px 12px;background:var(--surface-2);border-radius:10px;font-size:11px;color:var(--text-muted);line-height:1.6;">
      <strong style="color:var(--text);">Payout timeline:</strong> Funds release 24 hours after your event ends once you've hosted 3+ dispute-free events — 48 hours before that, as a fraud-protection buffer.
    </div>
    ${
      rows === null
        ? `<div style="margin-top:12px;font-size:12px;color:var(--text-muted);">Loading your payouts…</div>`
        : rows && rows.length
          ? `<div style="margin-top:12px;">${payoutRows}</div>`
          : `<div style="margin-top:12px;font-size:12px;color:var(--text-muted);">No ticket sales yet — payouts appear here once your event starts selling.</div>`
    }
  </div>`;
}

function openOwnerDash() {
  pushNav();
  state.view = "owner-dash";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

/* ══════════════════════════════════════════════════
   HOST REVIEW — admin only
   ══════════════════════════════════════════════════ */
function openReview() {
  pushNav();
  state.view = "review";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderReview() {
  const container = document.getElementById("view-container");
  container.innerHTML = `
    <button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header">
      <h2>Host Review</h2>
      <p>Applications to host public events on Cumulus</p>
    </div>
    <div id="review-content">
      <div class="review-empty">
        <div class="review-empty-icon">📋</div>
        <div>Loading applications…</div>
      </div>
    </div>`;
  setTimeout(loadAndRenderReview, 0);
}

async function loadAndRenderReview() {
  const content = document.getElementById("review-content");
  if (!content) return;

  let apps = [];
  // Supabase
  try {
    const { data, error } = await sb
      .from("host_applications")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) apps = [...apps, ...data];
  } catch (e) {}
  // localStorage fallback
  try {
    const local = JSON.parse(
      localStorage.getItem("host_applications_local") || "[]",
    );
    // Deduplicate by email+created_at
    const existingKeys = new Set(apps.map((a) => a.email + "|" + a.created_at));
    apps = [
      ...apps,
      ...local.filter((a) => !existingKeys.has(a.email + "|" + a.created_at)),
    ];
  } catch (e) {}

  if (!apps.length) {
    content.innerHTML = `<div class="review-empty"><div class="review-empty-icon">✅</div><div style="font-weight:700;margin-bottom:4px;">All clear</div><div>No host applications yet.</div></div>`;
    return;
  }

  const pending = apps.filter((a) => a.status === "pending");
  const reviewed = apps.filter((a) => a.status !== "pending");

  content.innerHTML = `
    ${pending.length ? `<div class="review-section-hd">Pending (${pending.length})</div>${pending.map(_buildReviewCard).join("")}` : ""}
    ${reviewed.length ? `<div class="review-section-hd" style="margin-top:${pending.length ? "20px" : "0"};">Reviewed (${reviewed.length})</div>${reviewed.map(_buildReviewCard).join("")}` : ""}
  `;
}

function _buildReviewCard(app) {
  let date = "";
  if (app.created_at) {
    const d = new Date(app.created_at);
    if (!isNaN(d)) {
      date = d.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } else {
      date = escapeHtml(app.created_at);
    }
  }
  const isPending = app.status === "pending";
  const id = escapeHtml(app.id || app.email);
  const email = escapeHtml(app.email);
  return `<div class="review-card list-item-stagger">
    <div class="review-card-top">
      <div>
        <div class="review-card-name">${escapeHtml(app.name)}</div>
        <div class="review-card-email">${email}</div>
      </div>
      <span class="review-status-badge ${app.status}">${app.status}</span>
    </div>
    ${app.business_name ? `<div class="review-detail"><div class="review-detail-lbl">Venue / Business</div><div class="review-detail-val">${escapeHtml(app.business_name)}</div></div>` : ""}
    ${app.event_types ? `<div class="review-detail"><div class="review-detail-lbl">Event types</div><div class="review-detail-val">${escapeHtml(app.event_types)}</div></div>` : ""}
    ${app.description ? `<div class="review-detail"><div class="review-detail-lbl">About their events</div><div class="review-detail-val">${escapeHtml(app.description)}</div></div>` : ""}
    ${app.why_host ? `<div class="review-detail"><div class="review-detail-lbl">Why they want to host</div><div class="review-detail-val">${escapeHtml(app.why_host)}</div></div>` : ""}
    ${date ? `<div style="font-size:10px;color:var(--text-muted);margin-top:8px;">Applied ${date}</div>` : ""}
    ${
      isPending
        ? `<div class="review-actions">
      <button class="btn btn-small review-approve-btn" style="flex:1;" onclick="reviewHost('${id}','${email}','approved')">Approve</button>
      <button class="btn btn-outline btn-small review-reject-btn"  style="flex:1;" onclick="reviewHost('${id}','${email}','rejected')">Reject</button>
    </div>`
        : ""
    }
  </div>`;
}

async function reviewHost(appId, email, decision) {
  // Update Supabase
  try {
    await sb
      .from("host_applications")
      .update({ status: decision })
      .eq("id", appId);
  } catch (e) {}
  // Update localStorage fallback
  try {
    let apps = JSON.parse(
      localStorage.getItem("host_applications_local") || "[]",
    );
    apps = apps.map((a) =>
      a.email === email || a.id === appId ? { ...a, status: decision } : a,
    );
    localStorage.setItem("host_applications_local", JSON.stringify(apps));
  } catch (e) {}
  // If approved: add verified-host badge to the user
  if (decision === "approved") {
    try {
      const { data: u } = await sb
        .from("users")
        .select("id,special_badges")
        .eq("email", email)
        .single();
      if (u) {
        const badges = [...(u.special_badges || [])];
        if (!badges.includes("verified-host")) badges.push("verified-host");
        await sb
          .from("users")
          .update({ special_badges: badges })
          .eq("id", u.id);
      }
    } catch (e) {}
  }
  showToast(
    decision === "approved"
      ? `${email} approved as host`
      : `Application rejected`,
    "success",
  );
  await loadAndRenderReview();
}

/* ══════════════════════════════════════════════════
   EVENT APPROVALS — admin only. Public events submitted by hosts
   queue here for review before they are published to the map.
   ══════════════════════════════════════════════════ */
function openEventApprovals() {
  pushNav();
  state.view = "event-approvals";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Admin sign-in via Supabase Auth OTP — reuses the same 6-digit email code
// flow as normal login so there is no separate credential to remember.
// The flow: enter email → receive 6-digit OTP → verify → is_admin() checked.
//
// This runs as an in-page modal rather than window.prompt(). Native prompt()
// dialogs get auto-dismissed by the browser/OS when the tab loses focus —
// which is exactly what happens the moment you switch to your email app to
// read the code, wiping out the pending prompt and forcing a restart. A
// regular DOM modal has no such issue: switching tabs to grab the code and
// coming back leaves it exactly as you left it.
let _adminPendingEmail = null;

function promptAdminSignIn() {
  const old = document.getElementById("admin-auth-overlay");
  if (old) old.remove();

  const html = `<div class="card-xl-overlay open" id="admin-auth-overlay" onclick="if(event.target===this)closeAdminSignIn()">
    <div class="admin-auth-modal">
      <button class="card-xl-close" onclick="closeAdminSignIn()" aria-label="Close">✕</button>
      <div id="admin-auth-panel"></div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  renderAdminEmailStep(state.profileEmail || "");
}

function closeAdminSignIn() {
  const ov = document.getElementById("admin-auth-overlay");
  if (ov) ov.remove();
  _adminPendingEmail = null;
}

function renderAdminEmailStep(prefill) {
  const panel = document.getElementById("admin-auth-panel");
  if (!panel) return;
  panel.innerHTML = `
    <div class="lp-form-eyebrow">Admin access</div>
    <h3 class="lp-form-title">Sign in as admin</h3>
    <p class="lp-form-sub">Enter your admin email — we'll send a 6-digit code.</p>
    <div class="gate-field">
      <label class="gate-label" for="admin-auth-email">Email</label>
      <input id="admin-auth-email" class="gate-input" type="email" autocomplete="email" placeholder="you@example.com" value="${escapeHtml(prefill)}" aria-describedby="admin-auth-error"/>
    </div>
    <p id="admin-auth-error" class="gate-field-error" role="alert"></p>
    <button id="admin-auth-send" class="lp-claim-btn" onclick="adminSendCode()">
      <span class="lp-claim-btn-text">Send code</span>
    </button>`;
  const inp = document.getElementById("admin-auth-email");
  if (inp) {
    setTimeout(() => inp.focus(), 50);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") adminSendCode();
    });
  }
}

function adminAuthErr(msg) {
  const e = document.getElementById("admin-auth-error");
  if (e) {
    e.textContent = msg;
    e.classList.add("show");
  }
}

async function adminSendCode() {
  const email = (
    document.getElementById("admin-auth-email")?.value || ""
  ).trim();
  const errEl = document.getElementById("admin-auth-error");
  if (errEl) errEl.classList.remove("show");
  if (!EMAIL_PATTERN.test(email)) {
    adminAuthErr("Please enter a valid email address.");
    return;
  }

  const btn = document.getElementById("admin-auth-send");
  const label = () => btn && btn.querySelector(".lp-claim-btn-text");
  if (btn) {
    btn.disabled = true;
    if (label()) label().textContent = "Sending…";
  }

  // Use the same authSendCode helper as normal login — sends the Supabase
  // magic-link / OTP email. Admin email just needs to be in public.admins.
  const sent = await authSendCode(email, {});
  if (btn) {
    btn.disabled = false;
    if (label()) label().textContent = "Send code";
  }
  if (!sent.ok) {
    adminAuthErr(authErrMsg(sent.error));
    return;
  }

  _adminPendingEmail = email;
  const sub = document.getElementById("admin-auth-sub");
  if (sub) sub.textContent = "Code sent — check your email";
  renderAdminOtpStep(email);
}

function renderAdminOtpStep(email) {
  const panel = document.getElementById("admin-auth-panel");
  if (!panel) return;
  panel.innerHTML = `
    <button class="gate-otp-back" onclick="renderAdminEmailStep('${escapeHtml(email)}')" aria-label="Back">←</button>
    <div class="lp-form-eyebrow">Check your inbox</div>
    <h3 class="lp-form-title">Enter your code</h3>
    <p class="lp-form-sub">We emailed a 6-digit code to <strong>${escapeHtml(email)}</strong>. Switch to your email app and come back — this stays open.</p>
    <div class="gate-field">
      <label class="gate-label" for="admin-otp-input">6-digit code</label>
      <input id="admin-otp-input" class="gate-input gate-otp-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" aria-describedby="admin-auth-error" oninput="this.value=this.value.replace(/\\D/g,'')"/>
    </div>
    <p id="admin-auth-error" class="gate-field-error" role="alert"></p>
    <button id="admin-auth-verify" class="lp-claim-btn" onclick="adminVerifyCode()">
      <span class="lp-claim-btn-text">Verify &amp; sign in</span>
    </button>
    <button class="gate-otp-resend" onclick="adminResendCode()">Didn't get it? Resend code</button>`;
  const inp = document.getElementById("admin-otp-input");
  if (inp) {
    setTimeout(() => inp.focus(), 50);
    inp.addEventListener("keydown", (e) => {
      if (e.key === "Enter") adminVerifyCode();
    });
  }
}

async function adminResendCode() {
  if (!_adminPendingEmail) return;
  const b = document.querySelector(".gate-otp-resend");
  if (b) {
    b.disabled = true;
    b.textContent = "Sending…";
  }
  const res = await authSendCode(_adminPendingEmail, {});
  if (b) {
    b.disabled = false;
    b.textContent = res.ok ? "Code re-sent ✓" : "Resend failed — try again";
  }
}

async function adminVerifyCode() {
  const email = _adminPendingEmail;
  if (!email) return;
  const code = (document.getElementById("admin-otp-input")?.value || "").trim();
  const errEl = document.getElementById("admin-auth-error");
  if (errEl) errEl.classList.remove("show");
  if (!/^\d{6}$/.test(code)) {
    adminAuthErr("Enter the 6-digit code from your email.");
    return;
  }

  const btn = document.getElementById("admin-auth-verify");
  const label = () => btn && btn.querySelector(".lp-claim-btn-text");
  if (btn) {
    btn.disabled = true;
    if (label()) label().textContent = "Verifying…";
  }

  // authVerifyCode is the shared OTP verifier — it returns the Supabase session
  const res = await authVerifyCode(email, code);
  if (!res.ok) {
    if (btn) {
      btn.disabled = false;
      if (label()) label().textContent = "Verify & sign in";
    }
    adminAuthErr("That code didn't match. Check it and try again.");
    return;
  }

  _adminPendingEmail = null;
  const sub = document.getElementById("admin-auth-sub");

  // Check is_admin() server-side — prevents non-admin accounts from gaining access
  const isAdmin = await isAdminSession();
  if (isAdmin) {
    state.isAdmin = true; // unlocks all hosting gates client-side
    // Marks that THIS session passed the real server-side is_admin() check,
    // so the TEMP admin-preview toggle below is only ever offered to a
    // confirmed admin — never to an arbitrary logged-in user.
    state._verifiedAdmin = true;
    showToast("Admin verified — all gates bypassed", "success");
    if (sub) sub.textContent = "Admin session active — full access";
    closeAdminSignIn();
  } else {
    showToast(
      "Signed in, but this account is not in the admins table",
      "error",
    );
    if (sub) sub.textContent = "Not an admin account";
    closeAdminSignIn();
  }
}

function renderEventApprovals() {
  const container = document.getElementById("view-container");
  container.innerHTML = `
    <button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header">
      <h2>Event Approvals</h2>
      <p>Public events awaiting review before they go live</p>
    </div>
    <div id="evapp-content">
      <div class="review-empty"><div class="review-empty-icon">📋</div><div>Loading events…</div></div>
    </div>`;
  setTimeout(loadAndRenderEventApprovals, 0);
}

function _pendingEventKey(e) {
  return e.id != null
    ? String(e.id)
    : (e.title || "") + "|" + (e.created_at || "");
}

async function loadAndRenderEventApprovals() {
  const content = document.getElementById("evapp-content");
  if (!content) return;
  try {
    let evs = [];
    try {
      const { data, error } = await sb
        .from("pending_events")
        .select("*")
        .order("created_at", { ascending: false });
      if (error)
      if (!error && data) evs = [...evs, ...data];
    } catch (e) {
    }
    try {
      const local = JSON.parse(
        localStorage.getItem("pending_events_local") || "[]",
      ).filter((e) => e != null);
      const keys = new Set(evs.filter((e) => e != null).map(_pendingEventKey));
      evs = [
        ...evs,
        ...local.filter((e) => e != null && !keys.has(_pendingEventKey(e))),
      ];
    } catch (e) {
    }

    evs = evs.filter((e) => e != null);

    if (!evs.length) {
      content.innerHTML = `<div class="review-empty"><div class="review-empty-icon">✅</div><div style="font-weight:700;margin-bottom:4px;">All clear</div><div>No public events awaiting approval.</div></div>`;
      return;
    }
    const pending = evs.filter((e) => e.status === "pending");
    const reviewed = evs.filter((e) => e.status !== "pending");
    content.innerHTML = `
      ${pending.length ? `<div class="review-section-hd">Pending (${pending.length})</div>${pending.map(_buildEventApprovalCard).join("")}` : ""}
      ${reviewed.length ? `<div class="review-section-hd" style="margin-top:${pending.length ? "20px" : "0"};">Reviewed (${reviewed.length})</div>${reviewed.map(_buildEventApprovalCard).join("")}` : ""}`;
  } catch (err) {
    content.innerHTML = `<div class="review-empty"><div class="review-empty-icon">⚠️</div><div style="font-weight:700;margin-bottom:4px;">Error Loading Panel</div><div>${escapeHtml(err.message)}</div></div>`;
  }
}

function _buildEventApprovalCard(ev) {
  const id = escapeHtml(String(ev.id != null ? ev.id : ""));
  let when = "";
  if (ev.start_time) {
    const d = new Date(ev.start_time);
    if (!isNaN(d)) {
      when = d.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      when = escapeHtml(ev.start_time);
    }
  }
  const isPending = ev.status === "pending";
  const priceLbl =
    Number(ev.price) > 0 ? `£${Number(ev.price).toFixed(2)}` : "Free";
  return `<div class="review-card list-item-stagger">
    <div class="review-card-top">
      <div>
        <div class="review-card-name">${escapeHtml(ev.title || "Untitled event")}</div>
        <div class="review-card-email">${escapeHtml(ev.host_name || "Unknown host")}${ev.host_email ? " · " + escapeHtml(ev.host_email) : ""}</div>
      </div>
      <span class="review-status-badge ${escapeHtml(ev.status || "pending")}">${escapeHtml(ev.status || "pending")}</span>
    </div>
    ${ev.category ? `<div class="review-detail"><div class="review-detail-lbl">Category</div><div class="review-detail-val">${escapeHtml(ev.category)}</div></div>` : ""}
    ${when ? `<div class="review-detail"><div class="review-detail-lbl">When</div><div class="review-detail-val">${when}</div></div>` : ""}
    ${ev.venue ? `<div class="review-detail"><div class="review-detail-lbl">Venue</div><div class="review-detail-val">${escapeHtml(ev.venue)}${ev.area ? ", " + escapeHtml(ev.area) : ""}</div></div>` : ""}
    <div class="review-detail"><div class="review-detail-lbl">Capacity · Ticket price</div><div class="review-detail-val">${ev.capacity != null ? escapeHtml(String(ev.capacity)) : "—"} · ${priceLbl}</div></div>
    ${ev.description ? `<div class="review-detail"><div class="review-detail-lbl">Description</div><div class="review-detail-val">${escapeHtml(ev.description)}</div></div>` : ""}
    ${
      isPending
        ? `<div class="review-actions">
      <button class="btn btn-small review-approve-btn" style="flex:1;" onclick="decideEvent('${id}','approved')">Approve &amp; publish</button>
      <button class="btn btn-outline btn-small review-reject-btn" style="flex:1;" onclick="decideEvent('${id}','rejected')">Reject</button>
    </div>`
        : ""
    }
  </div>`;
}

async function decideEvent(pendingId, decision) {
  // Locate the pending record — Supabase first, then the local fallback store.
  let rec = null;
  try {
    const { data } = await sb
      .from("pending_events")
      .select("*")
      .eq("id", pendingId)
      .single();
    rec = data;
  } catch (e) {}
  if (!rec) {
    try {
      const arr = JSON.parse(
        localStorage.getItem("pending_events_local") || "[]",
      );
      rec = arr.find((e) => String(e.id) === String(pendingId)) || null;
    } catch (e) {}
  }
  if (decision === "approved" && rec) {
    const ok = await _publishApprovedEvent(rec);
    if (!ok) return; // Halt if publication failed
  }
  // Record the decision (both stores, whichever exists)
  try {
    await sb
      .from("pending_events")
      .update({ status: decision })
      .eq("id", pendingId);
  } catch (e) {}
  try {
    let arr = JSON.parse(localStorage.getItem("pending_events_local") || "[]");
    arr = arr.map((e) =>
      String(e.id) === String(pendingId) ? { ...e, status: decision } : e,
    );
    localStorage.setItem("pending_events_local", JSON.stringify(arr));
  } catch (e) {}
  showToast(
    decision === "approved" ? "Event approved & published" : "Event rejected",
    "success",
  );
  await loadAndRenderEventApprovals();
}

async function _publishApprovedEvent(rec) {
  let inserted = null;
  try {
    let { data, error } = await sb
      .from("events")
      .insert({
        title: rec.title,
        category: rec.category,
        host_id: rec.host_id,
        host_name: rec.host_name,
        venue: rec.venue,
        area: rec.area || "London",
        address: rec.address || "",
        lat: rec.lat,
        lon: rec.lon,
        start_time: rec.start_time,
        end_time: rec.end_time,
        description: rec.description,
        capacity: rec.capacity,
        price: rec.price || 0,
      })
      .select()
      .single();
    if (error) {
      if (error.message && error.message.includes("events_host_id_fkey")) {
        const retryRes = await sb
          .from("events")
          .insert({
            title: rec.title,
            category: rec.category,
            host_id: null,
            host_name: rec.host_name,
            venue: rec.venue,
            area: rec.area || "London",
            address: rec.address || "",
            lat: rec.lat,
            lon: rec.lon,
            start_time: rec.start_time,
            end_time: rec.end_time,
            description: rec.description,
            capacity: rec.capacity,
            price: rec.price || 0,
          })
          .select()
          .single();
        if (retryRes.error) {
          showToast(
            "Failed to publish event: " + retryRes.error.message,
            "error",
          );
          return false;
        }
        data = retryRes.data;
      } else {
        showToast("Failed to publish event: " + error.message, "error");
        return false;
      }
    }
    inserted = data;
  } catch (e) {
    showToast("Failed to publish event: " + e.message, "error");
    return false;
  }
  const src = inserted || rec;
  const newEvent = {
    id: inserted ? inserted.id : "local_ev_" + Date.now(),
    title: src.title,
    category: src.category,
    host: src.host_name,
    hostId: src.host_id,
    venue: src.venue,
    area: src.area || "London",
    address: src.address || "",
    lat: src.lat,
    lon: src.lon,
    startTime: src.start_time,
    endTime: src.end_time,
    desc: src.description,
    capacity: src.capacity,
    price: src.price || 0,
  };
  computeEventDates(newEvent);
  if (!EVENTS.some((e) => String(e.id) === String(newEvent.id)))
    EVENTS.push(newEvent);
  return true;
}

function renderView() {
  const app = document.getElementById("app");
  const container = document.getElementById("view-container");
  // Lets CSS scope per-view chrome (e.g. the ambient tab backdrops)
  // without touching the render functions themselves. Lives on #app, not
  // #view-container: the container's will-change:transform makes it a
  // fixed-position containing block, which would clip a viewport layer.
  app.dataset.view = state.view;
  if (state.view !== "host") destroyHostMap();

  if (state.view === "browse") {
    app.classList.add("map-home");
    document.body.classList.add("no-scroll");
    container.innerHTML = "";
    showMapLayer(true);
    initLeaflet();
    refreshFilters();
    refreshMarkers();
    setTimeout(() => {
      if (lmap) lmap.resize();
    }, 60);
    return;
  }

  showMapLayer(false);
  stopLivePulse(); // halt the live-pin rAF while the map isn't on screen
  app.classList.remove("map-home");
  document.body.classList.remove("no-scroll");
  if (state.view === "detail")
    container.innerHTML = renderDetail(state.selectedEventId);
  else if (state.view === "profile") container.innerHTML = renderProfile();
  else if (state.view === "achievements")
    container.innerHTML = renderAchievements();
  else if (state.view === "calendar") container.innerHTML = renderCalendar();
  else if (state.view === "host") {
    container.innerHTML = renderHostView();
    if (mapboxConfigured()) setTimeout(initHostMap, 0);
  } else if (state.view === "book") container.innerHTML = renderBook();
  else if (state.view === "checkout") container.innerHTML = renderCheckout();
  else if (state.view === "confirmed") {
    container.innerHTML = renderConfirmed();
    setTimeout(afterRenderConfirmed, 60);
  } else if (state.view === "my-tickets")
    container.innerHTML = renderMyTickets();
  else if (state.view === "calendar-day")
    container.innerHTML = renderCalendarDay();
  else if (state.view === "tickets") container.innerHTML = renderTicketsTab();
  else if (state.view === "owner-dash") {
    container.innerHTML = renderOwnerDash();
    setTimeout(initOwnerDash, 0);
  } else if (state.view === "review") {
    renderReview();
    return;
  } else if (state.view === "event-approvals") {
    renderEventApprovals();
    return;
  }
  const cm = document.getElementById("chat-messages");
  if (cm) cm.scrollTop = cm.scrollHeight;
}

function getFilteredEvents() {
  const q = (
    document.getElementById("search-input")?.value || ""
  ).toLowerCase();
  let list = EVENTS.filter((ev) => {
    const hasLocation = ev.lat != null && ev.lon != null;
    const mc =
      state.selectedCategory === "all" ||
      ev.category === state.selectedCategory;
    const mq =
      !q ||
      (ev.title + ev.venue + ev.area + ev.category + ev.host)
        .toLowerCase()
        .includes(q);
    return hasLocation && mc && mq;
  });
  if (state.liveOnly) list = list.filter((ev) => eventStatus(ev) === "live");
  if (state.hotOnly) list = list.filter((ev) => isHotEvent(ev));
  if (state.dateFilter && state.dateFilter !== "all")
    list = list.filter((ev) => eventInDateRange(ev, state.dateFilter));
  return list;
}
// Shared by the map's Today/This weekend chips and the Calendar List quick
// filters — one definition of "today" and "this weekend" for the whole app.
function eventInDateRange(ev, range) {
  if (ev.startsAt == null) return false;
  const d = new Date(ev.startsAt);
  const now = new Date();
  const startOfDay = (date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  if (range === "today") {
    return startOfDay(d) === startOfDay(now);
  }
  if (range === "weekend") {
    const day = now.getDay(); // 0 Sun .. 6 Sat
    const satOffset = (6 - day + 7) % 7;
    const sat = startOfDay(
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + satOffset),
    );
    const sunEnd = sat + 2 * 86400000; // through end of Sunday
    const t = startOfDay(d);
    return t >= sat && t < sunEnd;
  }
  return true;
}
function setDateFilter(mode) {
  state.dateFilter = state.dateFilter === mode ? "all" : mode;
  renderView();
}
function toggleLiveOnly() {
  state.liveOnly = !state.liveOnly;
  if (state.liveOnly) state.hotOnly = false;
  renderView();
}
function toggleHotOnly() {
  state.hotOnly = !state.hotOnly;
  if (state.hotOnly) state.liveOnly = false;
  renderView();
}
function refreshFilters() {
  const el = document.getElementById("map-filters");
  if (!el) return;
  const aa = state.selectedCategory === "all";
  let html = `<button class="mchip ${aa ? "active" : ""}" style="${aa ? "background:var(--accent);color:#fff;border-color:transparent;" : ""}" onclick="setCategory('all')">All</button>`;
  html += Object.entries(CATS)
    .map(([cat, c]) => {
      const a = state.selectedCategory === cat;
      return `<button class="mchip ${a ? "active" : ""}" style="${a ? `background:${c.color};color:#fff;border-color:transparent;` : ""}" onclick="setCategory('${cat}')"><span style="color:${a ? "#fff" : c.color};display:inline-flex;">${categoryChipIconSvg(cat)}</span>${cat}</button>`;
    })
    .join("");
  html += `<button class="mchip ${state.liveOnly ? "active" : ""}" style="${state.liveOnly ? "background:#E23B3B;color:#fff;border-color:transparent;" : ""}" onclick="toggleLiveOnly()"><span style="width:6px;height:6px;border-radius:50%;background:${state.liveOnly ? "#fff" : "#E23B3B"};display:inline-block;margin-right:2px;animation:${state.liveOnly ? "blink 1.3s ease-in-out infinite" : "none"}"></span>Live</button>`;
  html += `<button class="mchip ${state.hotOnly ? "active" : ""}" style="${state.hotOnly ? "background:#F97316;color:#fff;border-color:transparent;" : ""}" onclick="toggleHotOnly()"><span style="display:inline-flex;color:#F97316;"><svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2c2 3 5 6 5 10a5 5 0 0 1-10 0c0-1.8.7-3 1.6-4.1.2 1.3.9 2 1.8 2.3-.4-2.7.4-5.3 1.6-8.2Z"/></svg></span> Hot</button>`;
  html += `<button class="mchip ${state.dateFilter === "today" ? "active" : ""}" style="${state.dateFilter === "today" ? "background:var(--accent);color:#fff;border-color:transparent;" : ""}" onclick="setDateFilter('today')">Today</button>`;
  html += `<button class="mchip ${state.dateFilter === "weekend" ? "active" : ""}" style="${state.dateFilter === "weekend" ? "background:var(--accent);color:#fff;border-color:transparent;" : ""}" onclick="setDateFilter('weekend')">This weekend</button>`;
  el.innerHTML = html;
  // Finances now live in Profile → Admin & Finances (no floating map button)
  const fab = document.getElementById("owner-fin-fab");
  if (fab) fab.innerHTML = "";
}

function pinTooltipHtml(ev) {
  const status = eventStatus(ev);
  const c = CATS[ev.category];
  const att = attendeesFor(ev.id);
  const friendsGoing = att.filter(isFriend);
  const statusBadge =
    status === "live"
      ? `<span class="tip-live"><span class="d"></span>LIVE NOW</span>`
      : `<span class="tip-up">${status === "past" ? "Ended" : "Upcoming"}</span>`;
  let goingLine;
  if (att.length === 0) {
    goingLine = `<div class="tip-going none">No one yet — be the first!</div>`;
  } else {
    const names = att
      .slice(0, 3)
      .map((n) =>
        isFriend(n)
          ? `<span class="star">★</span> ${escapeHtml(n)}`
          : escapeHtml(n),
      );
    const extra = att.length > 3 ? ` +${att.length - 3}` : "";
    goingLine = `<div class="tip-going"><strong>${att.length} going</strong> — ${names.join(", ")}${extra}</div>`;
  }
  const friendLine = friendsGoing.length
    ? `<div class="tip-friend">★ ${friendsGoing.map(escapeHtml).join(", ")} ${friendsGoing.length > 1 ? "are" : "is"} going</div>`
    : "";
  const capLine = ev.capacity
    ? `<div class="tip-going" style="margin-top:2px;"><strong>${Math.max(0, ev.capacity - att.length)} spaces left</strong></div>`
    : "";
  return `<div class="evtip-inner" style="--c:${c.color}">
    <div class="tip-top">${statusBadge}<span class="tip-cat" style="background:${c.color}">${ev.category}</span></div>
    <div class="tip-title">${escapeHtml(ev.title)}</div>
    <div class="tip-meta">${ev.date} · ${ev.time}</div>
    <div class="tip-meta">${escapeHtml(ev.venue)}${ev.area ? ` · ${escapeHtml(ev.area)}` : ""}</div>
    ${goingLine}${capLine}${friendLine}
    <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between;font-size:10.5px;font-weight:700;color:${c.color};letter-spacing:0.04em;">
      <span>Open &amp; RSVP</span>
      <span style="font-size:13px;opacity:0.85;">→</span>
    </div>
  </div>`;
}

function shareEvent(id) {
  const ev = EVENTS.find((e) => e.id === id);
  if (!ev) return;
  const text = `${ev.title} — ${ev.date}, ${ev.venue}${ev.area ? ", " + ev.area : ""}. Find it on Cumulus.`;
  const url = "https://cumulusapp.co/";
  if (navigator.share) {
    navigator.share({ title: ev.title, text, url }).catch(() => {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(`${text} ${url}`).then(
      () => showToast("Copied to clipboard", "success"),
      () => showToast("Couldn't copy — try again"),
    );
  } else {
    showToast("Share not supported on this browser");
  }
}

// Squad ticketing: a share link for one unclaimed ticket from a multi-ticket
// purchase. Opening it (see checkSquadClaim() at boot) calls claim_ticket(),
// which race-safely reassigns that specific ticket to whoever claims it.
function shareSquadTicket(code, eventTitle) {
  const url = `${location.origin}${location.pathname}?claim=${code}`;
  const text = `You're on my squad for ${eventTitle} on Cumulus — tap to claim your ticket:`;
  if (navigator.share) {
    navigator.share({ title: "Claim your Cumulus ticket", text, url }).catch(() => {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(`${text} ${url}`).then(
      () => showToast("Claim link copied", "success"),
      () => showToast("Couldn't copy — try again"),
    );
  } else {
    showToast("Share not supported on this browser");
  }
}

// Runs once at boot: if the URL carries a Squad claim link (?claim=CODE),
// claim it for whoever is signed in and strip the param from the URL.
async function checkSquadClaim() {
  const params = new URLSearchParams(location.search);
  const code = params.get("claim");
  if (!code) return;
  history.replaceState(null, "", location.pathname);
  if (!state.userId) return; // claimed after sign-in isn't wired up — keep simple for now
  const res = await claimTicket(code);
  if (res && res.ok) {
    showToast("Ticket claimed — welcome to the squad!", "success");
    await loadMyTickets();
    renderView();
  } else {
    showToast("That claim link isn't valid or was already used.", "error");
  }
}

// Host credibility + follow, shown inline in the event byline. The events-
// hosted count is computed from EVENTS actually loaded this session (real
// data, not a fabricated backend stat) and only shown once it's meaningful.
function renderHostByline(ev) {
  const hostKey = ev.hostId || ev.host;
  const hostCount = EVENTS.filter((e) => e.host === ev.host).length;
  const following = isFollowingHost(hostKey);
  const safeKey = escapeHtml(String(hostKey)).replace(/'/g, "&#39;");
  const safeName = escapeHtml(ev.host).replace(/'/g, "&#39;");
  // Only claim "reviewed" for a real DB-backed host (went through the actual
  // approval flow) — never shown for hostId-less fixture/test data, so this
  // is never a fabricated trust signal.
  const reviewed = ev.hostId != null;
  return `<span class="detail-host-byline">
    <span>By ${escapeHtml(ev.host)}${hostCount >= 2 ? ` · ${hostCount} events hosted` : ""}${reviewed ? ` <span class="host-reviewed-badge" title="Host reviewed by Cumulus">${checkIconSvg(11)} Reviewed</span>` : ""}</span>
    <button class="btn-follow-host${following ? " following" : ""}" onclick="toggleFollowHost('${safeKey}','${safeName}')">${following ? "Following" : "Follow"}</button>
  </span>`;
}

function renderDetail(id) {
  const ev = EVENTS.find((e) => e.id === id);
  if (!ev) return `<div class="empty-state">Event not found.</div>`;
  const c = CATS[ev.category];
  const attendees = attendeesFor(id);
  const status = eventStatus(ev);
  const ticket = getTicketForEvent(id);
  const price = eventPrice(ev);
  const spacesLeft = ev.capacity
    ? Math.max(0, ev.capacity - attendees.length)
    : null;
  const isFull = spacesLeft !== null && spacesLeft <= 0 && !ticket;
  const statusChip =
    status === "live"
      ? `<button class="live-chip" style="border:none;background:none;cursor:pointer;padding:0;" onclick="document.getElementById('going-section')?.scrollIntoView({behavior:'smooth'})"><span class="dot"></span>Live now</button>`
      : `<span class="upcoming-chip">${status === "past" ? "Ended" : "Upcoming"}</span>`;
  const capBadge = ev.capacity
    ? `<span class="event-badge" style="background:var(--surface-2);color:var(--text) !important;border:1px solid var(--line);margin-left:6px;font-size:10px;">${spacesLeft} spaces left</span>`
    : "";
  const priceBadge = price
    ? `<span class="event-badge" style="background:var(--surface-2);color:var(--text) !important;border:1px solid var(--line);margin-left:6px;font-size:10px;">From £${price}</span>`
    : `<span class="event-badge" style="background:#14713622;color:#147136 !important;border:1px solid #14713644;margin-left:6px;font-size:10px;">Free</span>`;
  let bookBtn = "";
  if (ticket) {
    bookBtn = `<button class="btn" style="background:transparent;border:2px solid #147136;color:#147136;box-shadow:none;width:100%;" onclick="openViewTicket(${id})">${checkIconSvg(15)} You have a ticket — View it</button>`;
  } else if (isFull) {
    bookBtn = `<button class="btn" style="background:var(--surface-2);color:var(--text-muted);cursor:not-allowed;width:100%;">Sold Out</button>`;
  } else {
    bookBtn = `<button class="btn" style="background:${c.color};color:#fff;width:100%;font-size:15px;" onclick="openBook(${id})">${price ? `Book Now · From £${price}` : "Register Free"} →</button>`;
  }
  const friendsGoing = attendees.filter(isFriend);
  const going = attendees.includes(state.profileName);
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="panel detail-card" style="--corner:${c.color};">
      <div class="detail-hero" style="background-image:url('${catImg(ev.category)}');">
        <button class="detail-share-btn" onclick="shareEvent(${ev.id})" aria-label="Share event"><svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="M8.2 10.7l7.6-4.4M8.2 13.3l7.6 4.4"/></svg></button>
      </div>
      <span class="event-badge" style="--cat:${c.color};--cat-text:${c.textColor};">${ev.category}</span>${statusChip}${capBadge}${priceBadge}
      <h2 class="detail-title">${ev.title}</h2>
      <div style="display:flex;align-items:center;gap:8px;margin:10px 0 6px;flex-wrap:wrap;">
        <span style="font-size:14px;font-weight:700;color:${c.textColor};">📅 ${ev.date}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text);">· ${ev.time}</span>
      </div>
      <div class="detail-meta-row"><span>${ev.venue}${ev.area ? `, ${ev.area}` : ""}</span>${renderHostByline(ev)}</div>
      <div class="detail-desc">${ev.desc}</div>
      ${bookBtn}
      <div class="attendee-section">
        <h3>${attendees.length} going${ev.capacity ? ` (Limit ${ev.capacity})` : ""}${friendsGoing.length ? ` · <span class="star">★</span> ${friendsGoing.length} friend${friendsGoing.length > 1 ? "s" : ""}` : ""}</h3>
        <div class="attendee-list">${
          attendees.length
            ? attendees
                .map((n) => {
                  const fr = isFriend(n);
                  return `<div class="attendee-chip ${fr ? "friend" : ""}"><div class="avatar" style="margin-left:0">${initials(n)}</div><span>${fr ? '<span class="star">★</span> ' : ""}${escapeHtml(n)}</span></div>`;
                })
                .join("")
            : `<span style="color:var(--text-muted);font-size:13px;">No bookings yet.</span>`
        }</div>
      </div>
      ${state.isAdmin || ev.hostId === state.userId ? `<div style="margin-top:10px;"><button class="btn btn-outline" style="color:#E23B3B;border-color:#E23B3B;width:100%;" onclick="if(confirm('Delete this event permanently?')) deleteEvent('${id}')">Delete Event</button></div>` : ""}
    </div>`;
}

async function deleteEvent(id) {
  const { error } = await sb.from("events").delete().eq("id", id);
  if (error) {
    showToast("Error deleting event: " + error.message, "error");
    return;
  }
  showToast("Event deleted", "success");
  EVENTS = EVENTS.filter((e) => String(e.id) !== String(id));
  goBack();
}



// Follow a host to flag interest in their future events. Stored locally per
// profile (same pattern as profile_about:/profile_interests:) rather than a
// new backend table — lightweight preference, not core transactional data.
function getFollowedHosts() {
  try {
    const r = localStorage.getItem("followed_hosts:" + state.profileName);
    return r ? JSON.parse(r) : [];
  } catch (e) {
    return [];
  }
}
function isFollowingHost(hostKey) {
  return getFollowedHosts().includes(hostKey);
}
function toggleFollowHost(hostKey, hostName) {
  const list = getFollowedHosts();
  const idx = list.indexOf(hostKey);
  if (idx === -1) {
    list.push(hostKey);
    showToast(`Following ${hostName}`, "success");
  } else {
    list.splice(idx, 1);
    showToast(`Unfollowed ${hostName}`, "success");
  }
  try {
    localStorage.setItem(
      "followed_hosts:" + state.profileName,
      JSON.stringify(list),
    );
  } catch (e) {}
  renderView();
}

let _sheenHandler = null,
  _sheenMouseHandler = null,
  _sheenCard = null;

function initCardSheen() {
  const sheen = document.getElementById("card-xl-sheen");
  if (!sheen) return;
  const card = document.querySelector(".cpass-card");
  if (!card) return;
  _sheenCard = card;
  function applySheen(sx, sy) {
    sheen.style.transform = `translate(${sx}px,${sy}px)`;
  }
  _sheenHandler = (e) => {
    const g = Math.max(-50, Math.min(50, e.gamma || 0));
    const b = Math.max(-40, Math.min(40, (e.beta || 15) - 15));
    applySheen((g / 50) * 65, (b / 40) * 50);
  };
  _sheenMouseHandler = (e) => {
    const r = card.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 2;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    applySheen(x * 65, y * 50);
  };
  window.addEventListener("deviceorientation", _sheenHandler);
  card.addEventListener("mousemove", _sheenMouseHandler);
}

// ── Badges: unified list + earned status + chosen "featured" set ──────────
function getAllBadges() {
  const myEvents = getMyEvents();
  const myCats = getMyCategories();
  const list = [];
  MILESTONE_BADGES.forEach((b) =>
    list.push({
      id: b.id,
      name: b.name,
      glyph: b.glyph,
      desc: b.desc,
      color: b.metal,
      earned: myEvents.length >= b.need,
      kind: "Milestone",
    }),
  );
  CATEGORY_BADGES.forEach((b) =>
    list.push({
      id: b.id,
      name: b.name,
      glyph: b.glyph,
      desc: b.desc,
      color: (CATS[b.cat] || { color: "#FFCF33" }).color,
      earned: myCats.has(b.cat),
      kind: "Category",
    }),
  );
  SPECIAL_BADGES.forEach((b) =>
    list.push({
      id: b.id,
      name: b.name,
      glyph: b.glyph,
      desc: b.desc,
      color: "#FFCF33",
      earned: state.specialBadges.includes(b.id),
      kind: "Special",
    }),
  );
  return list;
}
function getBadgeById(id) {
  return getAllBadges().find((b) => b.id === id);
}
function getCardExt() {
  let ext = {
    motto: "",
    pattern: "lines",
    areas: [],
    accentColor: "#FFCF33",
    bgStyle: "obsidian",
    badges: [],
  };
  try {
    const r = localStorage.getItem("card_ext:" + state.profileName);
    if (r) ext = { ...ext, ...JSON.parse(r) };
  } catch (e) {}
  if (!Array.isArray(ext.badges)) ext.badges = [];
  return ext;
}
function saveCardExt(ext) {
  try {
    localStorage.setItem("card_ext:" + state.profileName, JSON.stringify(ext));
  } catch (e) {}
}
// Chosen badges that are actually earned (max 3), in the user's chosen order
function getFeaturedBadges() {
  const ext = getCardExt();
  const all = getAllBadges();
  return ext.badges
    .map((id) => all.find((b) => b.id === id && b.earned))
    .filter(Boolean)
    .slice(0, 3);
}

function openExpandedCard() {
  const old = document.getElementById("card-xl-overlay");
  if (old) old.remove();
  const card = state.myCard;
  let cardExt = {
    motto: "",
    pattern: "lines",
    areas: [],
    accentColor: "#FFCF33",
    bgStyle: "obsidian",
  };
  try {
    const r = localStorage.getItem("card_ext:" + state.profileName);
    if (r) cardExt = { ...cardExt, ...JSON.parse(r) };
  } catch (e) {}
  let cardPhoto = "";
  try {
    cardPhoto = localStorage.getItem("card_photo:" + state.profileName) || "";
  } catch (e) {}

  const accent = cardExt.accentColor || card?.accentColor || "#FFCF33";
  const accentAlpha = (a, op) => {
    const m = a.match(/^#([0-9a-f]{6})$/i);
    if (!m) return `rgba(255,255,255,${op})`;
    const r2 = parseInt(m[1].slice(0, 2), 16),
      g2 = parseInt(m[1].slice(2, 4), 16),
      b2 = parseInt(m[1].slice(4, 6), 16);
    return `rgba(${r2},${g2},${b2},${op})`;
  };

  const myEvents = getMyEvents();
  const myCats = getMyCategories();
  const earnedTotal = getAllBadges().filter((b) => b.earned).length;
  const lv = getLevel(earnedTotal);

  const uid =
    "CU·" +
    btoa(state.profileName || "anon")
      .replace(/[^A-Z0-9]/gi, "")
      .substring(0, 8)
      .toUpperCase();
  const areas =
    cardExt.areas && cardExt.areas.length ? cardExt.areas.join(" · ") : "";
  const motto = cardExt.motto
    ? `${escapeHtml(cardExt.motto)}`
    : escapeHtml(card && card.bio ? card.bio : "");
  const initStr = ((card ? card.name : state.profileName) || "?")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const avatar = cardPhoto
    ? `<div class="cpass-avatar" style="border-color:${accent};"><img src="${cardPhoto}" alt=""/></div>`
    : `<div class="cpass-avatar cpass-avatar-mono" style="border-color:${accentAlpha(accent, 0.55)};background:${accentAlpha(accent, 0.16)};color:${accent};">${initStr}</div>`;

  // Featured badges — the hero. 3 slots: chosen earned badge, or an "add" placeholder.
  const featured = getFeaturedBadges();
  const slotsHtml = [0, 1, 2]
    .map((i) => {
      const b = featured[i];
      if (b) {
        return `<button class="cpass-badge" onclick="openBadgePicker()" title="${escapeHtml(b.name)}" style="--bc:${b.color};--bcg:${accentAlpha(b.color, 0.55)};">
        <span class="cpass-coin"><span class="cpass-coin-shine"></span><span class="cpass-coin-glyph">${b.glyph}</span></span>
        <span class="cpass-badge-name">${escapeHtml(b.name)}</span>
      </button>`;
      }
      return `<button class="cpass-badge cpass-badge-empty" onclick="openBadgePicker()" title="Add a badge">
      <span class="cpass-coin-empty">+</span>
      <span class="cpass-badge-name">Add</span>
    </button>`;
    })
    .join("");

  const html = `<div class="card-xl-overlay" id="card-xl-overlay" onclick="if(event.target===this)closeExpandedCard()">
    <div class="card-xl-outer">
      <button class="card-xl-close" onclick="closeExpandedCard()" aria-label="Close">✕</button>
      <div class="cpass-card" id="cpass-card" style="--acc:${accent};--acc-glow:${accentAlpha(accent, 0.3)};--acc-soft:${accentAlpha(accent, 0.14)};">
        <div class="cpass-ambient"></div>

        <!-- Header: wordmark + tier -->
        <div class="cpass-head">
          <div class="cpass-logo">
            <span class="cpass-logo-mark" style="background:${accent};"><svg viewBox="0 0 10 10"><circle cx="5" cy="4" r="2.5"/><ellipse cx="5" cy="7.5" rx="3.5" ry="1.5"/></svg></span>
            <span class="cpass-logo-text">Cumulus</span>
          </div>
          <div class="cpass-tier" style="border-color:${accentAlpha(accent, 0.45)};background:${accentAlpha(accent, 0.14)};color:${accent};">
            <span class="cpass-tier-dot" style="background:${accent};"></span>${lv.title}
          </div>
        </div>

        <!-- Identity -->
        <div class="cpass-id">
          ${avatar}
          <div class="cpass-id-text">
            <div class="cpass-name">${escapeHtml(card ? card.name : state.profileName)}</div>
            <div class="cpass-sub">${motto ? escapeHtml(cardExt.motto || (card && card.bio) || "") : "London Community Member"}</div>
          </div>
        </div>

        <!-- FEATURED BADGES — the hero -->
        <div class="cpass-badges-section">
          <div class="cpass-section-head">
            <span class="cpass-section-label">Featured badges</span>
            <button class="cpass-edit" onclick="openBadgePicker()">Edit</button>
          </div>
          <div class="cpass-badges">${slotsHtml}</div>
        </div>

        <!-- Stats -->
        <div class="cpass-stats">
          <div class="cpass-stat"><span class="cpass-stat-num">${myEvents.length}</span><span class="cpass-stat-label">Events</span></div>
          <div class="cpass-stat"><span class="cpass-stat-num">${earnedTotal}</span><span class="cpass-stat-label">Badges</span></div>
        </div>

        <!-- Footer pass band -->
        <div class="cpass-foot">
          <div>
            <div class="cpass-foot-label">Cumulus Pass</div>
            <div class="cpass-foot-uid">${uid}${areas ? ` · ${escapeHtml(areas)}` : ""}</div>
          </div>
          <div class="cpass-foot-mark" style="background:${accentAlpha(accent, 0.2)};color:${accent};">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="5"/><ellipse cx="12" cy="19" rx="8" ry="4"/></svg>
          </div>
        </div>

        <div class="cpass-sheen" id="card-xl-sheen"></div>
        <div class="cpass-edge" style="background:linear-gradient(90deg,${accentAlpha(accent, 0.6)},${accent},${accentAlpha(accent, 0.6)});"></div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML("beforeend", html);
  requestAnimationFrame(() => {
    const ov = document.getElementById("card-xl-overlay");
    if (ov)
      requestAnimationFrame(() => {
        ov.classList.add("open");
        const sheenCard = document.getElementById("cpass-card");
        if (sheenCard) {
          window.__cpassCard = sheenCard;
        }
        initCardSheen();
      });
  });
}

// ── Badge picker — choose up to 3 earned badges to feature on the pass ──────
function openBadgePicker() {
  const old = document.getElementById("cpass-picker-overlay");
  if (old) old.remove();
  const ext = getCardExt();
  const chosen = ext.badges.slice(0, 3);
  const all = getAllBadges();
  const earned = all.filter((b) => b.earned);
  const locked = all.filter((b) => !b.earned);
  const cell = (b, isChosen, isLocked) => `
    <button class="bpick-cell${isChosen ? " chosen" : ""}${isLocked ? " locked" : ""}" ${isLocked ? "disabled" : `onclick="toggleFeaturedBadge('${b.id}')"`} style="--bc:${b.color};">
      <span class="bpick-coin"><span class="bpick-coin-glyph">${b.glyph}</span></span>
      <span class="bpick-name">${escapeHtml(b.name)}</span>
      <span class="bpick-kind">${b.kind}</span>
      ${isChosen ? `<span class="bpick-check">${checkIconSvg(13)}</span>` : ""}
      ${isLocked ? `<span class="bpick-lock">${lockIconSvg(14)}</span>` : ""}
    </button>`;
  const earnedHtml = earned.length
    ? earned.map((b) => cell(b, chosen.includes(b.id), false)).join("")
    : `<div class="bpick-empty">No badges yet — RSVP to events to start earning them.</div>`;
  const lockedHtml = locked.map((b) => cell(b, false, true)).join("");
  const html = `<div class="cpass-picker-overlay" id="cpass-picker-overlay" onclick="if(event.target===this)closeBadgePicker()">
    <div class="cpass-picker">
      <div class="bpick-head">
        <div>
          <div class="bpick-title">Featured badges</div>
          <div class="bpick-help" id="bpick-help">Choose up to 3 to show on your pass · <b id="bpick-count">${chosen.length}</b>/3</div>
        </div>
        <button class="bpick-close" onclick="closeBadgePicker()" aria-label="Close">✕</button>
      </div>
      <div class="bpick-scroll">
        <div class="bpick-grid">${earnedHtml}</div>
        ${locked.length ? `<div class="bpick-locked-label">Locked</div><div class="bpick-grid">${lockedHtml}</div>` : ""}
      </div>
      <button class="btn bpick-done" onclick="closeBadgePicker()">Done</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  requestAnimationFrame(() => {
    const ov = document.getElementById("cpass-picker-overlay");
    if (ov) requestAnimationFrame(() => ov.classList.add("open"));
  });
}
function toggleFeaturedBadge(id) {
  const ext = getCardExt();
  let arr = ext.badges.filter((x) => getBadgeById(x)); // prune stale
  const i = arr.indexOf(id);
  if (i >= 0) {
    arr.splice(i, 1);
  } else {
    if (arr.length >= 3) {
      showToast("You can feature up to 3 badges", "info");
      return;
    }
    arr.push(id);
  }
  ext.badges = arr;
  saveCardExt(ext);
  // update cells + count without full re-render
  document.querySelectorAll(".bpick-cell").forEach((c) => {});
  const cnt = document.getElementById("bpick-count");
  if (cnt) cnt.textContent = arr.length;
  document.querySelectorAll(".bpick-cell").forEach((cell) => {
    const oc = cell.getAttribute("onclick") || "";
    const m = oc.match(/'([^']+)'/);
    if (!m) return;
    const chosen = arr.includes(m[1]);
    cell.classList.toggle("chosen", chosen);
    let chk = cell.querySelector(".bpick-check");
    if (chosen && !chk) {
      chk = document.createElement("span");
      chk.className = "bpick-check";
      chk.innerHTML = checkIconSvg(13);
      cell.appendChild(chk);
    } else if (!chosen && chk) {
      chk.remove();
    }
  });
}
function closeBadgePicker() {
  const ov = document.getElementById("cpass-picker-overlay");
  if (ov) {
    ov.classList.remove("open");
    setTimeout(() => ov.remove(), 220);
  }
  // rebuild the pass so featured badges reflect the new choice
  if (document.getElementById("card-xl-overlay")) openExpandedCard();
}

function closeExpandedCard() {
  const ov = document.getElementById("card-xl-overlay");
  if (!ov) return;
  if (_sheenHandler) {
    window.removeEventListener("deviceorientation", _sheenHandler);
    _sheenHandler = null;
  }
  if (_sheenMouseHandler && _sheenCard) {
    _sheenCard.removeEventListener("mousemove", _sheenMouseHandler);
    _sheenMouseHandler = null;
    _sheenCard = null;
  }
  ov.classList.remove("open");
  setTimeout(() => {
    if (ov.parentNode) ov.remove();
  }, 320);
}

const LOCK_SVG = `<svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/></svg>`;
function medallionHtml(glyph, color, earned) {
  const ring = earned ? color : "var(--line)";
  const fill = earned ? hexToRgba(color, 0.14) : "transparent";
  const gc = earned ? color : "var(--text-muted)";
  const lock = earned ? "" : `<span class="lock">${LOCK_SVG}</span>`;
  return `<div class="medallion" style="border-color:${ring};background:${fill};color:${gc};">${glyph}${lock}</div>`;
}
function badgeCellHtml(name, desc, glyph, color, earned, progressText) {
  return `<div class="panel badge-cell ${earned ? "earned" : "locked"}" style="--corner:${earned ? color : "var(--line)"};">${medallionHtml(glyph, color, earned)}<div class="badge-name">${name}</div><div class="badge-desc">${desc}</div>${!earned && progressText ? `<div class="badge-progress">${progressText}</div>` : ""}</div>`;
}
function trophyHtml(glyph, metal, glow, earned) {
  if (!earned)
    return `<div class="trophy-wrap"><div class="trophy-coin locked"><span>${glyph}</span><span class="trophy-lock">${LOCK_SVG}</span></div><div class="trophy-stand locked"></div></div>`;
  return `<div class="trophy-wrap"><div class="trophy-coin" style="background:radial-gradient(circle at 32% 28%,rgba(255,255,255,0.65),rgba(255,255,255,0) 40%),${metal};box-shadow:0 8px 18px rgba(0,0,0,0.3),0 0 14px ${hexToRgba(glow, 0.4)},inset 0 -5px 8px rgba(0,0,0,0.2),inset 0 3px 6px rgba(255,255,255,0.35);"><span class="trophy-shine"></span><span style="position:relative;color:#1B1D21;">${glyph}</span></div><div class="trophy-stand" style="background:${glow};filter:brightness(0.65);"></div></div>`;
}
function trophyCellHtml(
  name,
  desc,
  glyph,
  metal,
  glow,
  tier,
  earned,
  progressText,
) {
  return `<div class="panel badge-cell ${earned ? "earned" : "locked"}" style="--corner:${earned ? glow : "var(--line)"};">${trophyHtml(glyph, metal, glow, earned)}${tier ? `<div class="trophy-tier" style="color:${earned ? glow : "var(--text-muted)"};">${tier}</div>` : ""}<div class="badge-name">${name}</div><div class="badge-desc">${desc}</div>${!earned && progressText ? `<div class="badge-progress">${progressText}</div>` : ""}</div>`;
}

function renderProfile() {
  const myEvents = getMyEvents();
  const myCats = getMyCategories();
  const count = myEvents.length;
  const card = state.myCard;

  // Extended card fields
  let cardExt = {
    motto: "",
    pattern: "lines",
    areas: [],
    accentColor: "#FFCF33",
    bgStyle: "obsidian",
    patternOpacity: 0.18,
  };
  try {
    const r = localStorage.getItem("card_ext:" + state.profileName);
    if (r) cardExt = { ...cardExt, ...JSON.parse(r) };
  } catch (e) {}
  let profilePhoto = "";
  try {
    profilePhoto =
      localStorage.getItem("card_photo:" + state.profileName) || "";
  } catch (e) {}
  let profileAbout = "";
  try {
    profileAbout =
      localStorage.getItem("profile_about:" + state.profileName) || "";
  } catch (e) {}
  let profileInterests = [];
  try {
    const pi = localStorage.getItem("profile_interests:" + state.profileName);
    if (pi) profileInterests = JSON.parse(pi);
  } catch (e) {}

  // Level + badges
  let earnedCount = 0;
  MILESTONE_BADGES.forEach((b) => {
    if (count >= b.need) earnedCount++;
  });
  CATEGORY_BADGES.forEach((b) => {
    if (myCats.has(b.cat)) earnedCount++;
  });
  if (myCats.size >= TOTAL_CATEGORIES) earnedCount++;
  earnedCount += state.specialBadges.length;
  const lv = getLevel(earnedCount);
  const nextLvIdx = LEVELS.findIndex((l) => l === lv) + 1;
  const nextLv = LEVELS[nextLvIdx];

  const topAreas = cardExt.areas || [];

  // Card HTML (inline profile card)
  function profileCardHtml(c, ext) {
    const cols = resolveCardColors(
      ext.bgStyle || c?.theme || "obsidian",
      ext.accentColor || c?.accentColor || "#FFCF33",
    );
    const { bg, accent, text: textCol, textSoft } = cols;
    const pat = CARD_PATTERNS[ext.pattern || "lightning"] || "";
    const tagBg = cols.dark ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)";
    const tagBorder = cols.dark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.12)";
    const tags =
      c && c.interests
        ? c.interests
            .split(",")
            .slice(0, 5)
            .map(
              (s) =>
                `<span class="id-card-tag" style="background:${tagBg};border:1px solid ${tagBorder};color:${textCol};">${escapeHtml(s.trim())}</span>`,
            )
            .join("")
        : "";
    const borderStyle = lv.ring;
    const shadowStyle = `0 8px 28px rgba(0,0,0,0.22),0 0 0 1px rgba(0,0,0,0.08),0 0 18px ${lv.glow}`;
    const initStr = (c?.name || state.profileName)
      .split(" ")
      .map((w) => w[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
    const photoSticker = profilePhoto
      ? `<div style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:2px solid ${accent};flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><img src="${profilePhoto}" style="width:100%;height:100%;object-fit:cover;display:block;" alt="${escapeHtml(c?.name || state.profileName)}"/></div>`
      : `<div style="width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${accent}22;border:2px solid ${accent}55;flex-shrink:0;font-size:18px;font-weight:800;color:${accent};">${initStr}</div>`;
    return `<div class="id-card profile-id-card prof-avatar-float" style="background:${bg};border:${borderStyle};box-shadow:${shadowStyle};">
      <div style="position:absolute;inset:0;pointer-events:none;color:${accent};opacity:${ext.patternOpacity || 0.35};">${pat}</div>
      <div class="ce-card-shine"></div>
      <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;">
          <div>
            <div class="id-card-label" style="color:${textSoft};">// Cumulus Pass</div>
            <div style="width:24px;height:2px;background:${accent};border-radius:99px;margin-top:4px;"></div>
          </div>
          ${photoSticker}
        </div>
        <div class="id-card-name" style="color:${textCol};">${escapeHtml(c ? c.name : state.profileName)}</div>
        ${ext.motto ? `<div style="font-size:11px;font-style:italic;font-weight:700;color:${accent};margin-bottom:4px;">"${escapeHtml(ext.motto)}"</div>` : ""}
        ${c && c.bio ? `<div class="id-card-bio" style="color:${textSoft};">${escapeHtml(c.bio)}</div>` : ""}
        <div class="id-card-tags" style="margin-top:auto;">${tags}</div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:10px;">
          <div style="font-size:9px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;color:${textSoft};">London Member</div>
          <span class="level-badge" style="color:${textCol};border-color:${lv.color};background:${lv.color}33;font-size:8.5px;"><span class="level-dot" style="background:${lv.color};"></span>${lv.title}</span>
        </div>
      </div>
      <div class="id-card-watermark" style="color:${accent};">CU</div>
    </div>`;
  }

  // Night Shot memories — past events with a saved shot
  const memories = myEvents.filter(
    (ev) =>
      eventStatus(ev) === "past" &&
      (ev.nightShotUrl || localStorage.getItem("night_shot:" + ev.id)),
  );
  const memoriesHtml = memories
    .slice(0, 6)
    .map((ev) => {
      const shotUrl =
        ev.nightShotUrl || localStorage.getItem("night_shot:" + ev.id);
      const shortTitle =
        ev.title.length > 22 ? ev.title.substring(0, 20) + "…" : ev.title;
      return `<div class="ns-tile" onclick="openEvent(${ev.id})" role="button" tabindex="0" aria-label="Open ${escapeHtml(ev.title)}">
      <img src="${shotUrl}" alt="${escapeHtml(ev.title)}"/>
      <div class="ns-tile-label">${escapeHtml(shortTitle)}</div>
    </div>`;
    })
    .join("");

  // Recent events — last 4 only (not 12)
  const recentEvents = myEvents.slice(-4).reverse();
  const MUTED_CATS = {
    Creative: "rgba(232,184,75,0.10)",
    Gaming: "rgba(232,184,75,0.10)",
    "Movie Nights": "rgba(232,184,75,0.10)",
    "Board Games": "rgba(232,184,75,0.10)",
    Meetups: "rgba(232,184,75,0.10)",
    "Food & Drink": "rgba(232,184,75,0.10)",
    "Live Music": "rgba(232,184,75,0.10)",
    "Wellness & Outdoors": "rgba(232,184,75,0.10)",
    "Tech & Talks": "rgba(232,184,75,0.10)",
  };
  const recentEvHtml = recentEvents
    .map((ev) => {
      const c2 = CATS[ev.category] || { color: "#FFCF33" };
      const mutedBg = hexToRgba(c2.color, 0.09);
      const shortTitle =
        ev.title.length > 28 ? ev.title.substring(0, 26) + "…" : ev.title;
      const evDate = ev.startsAt
        ? new Date(ev.startsAt).toLocaleDateString("en-GB", {
            day: "numeric",
            month: "short",
          })
        : "";
      const status = eventStatus(ev);
      const statusDot =
        status === "live"
          ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:4px;box-shadow:0 0 5px #22c55e88;"></span>`
          : status === "upcoming"
            ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${c2.color};margin-right:4px;opacity:0.7;"></span>`
            : "";
      return `<div class="ev-plate" onclick="openEvent(${ev.id})" style="background:${mutedBg};border:1px solid ${c2.color}28;" title="${escapeHtml(ev.title)}" role="button" tabindex="0" aria-label="Open ${escapeHtml(ev.title)}">
      <div style="font-size:12px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:4px;">${escapeHtml(shortTitle)}</div>
      <div style="font-size:10px;color:var(--text-muted);display:flex;align-items:center;">${statusDot}${escapeHtml(ev.category)}</div>
      ${evDate ? `<div style="font-size:10px;color:${c2.color};font-weight:600;margin-top:4px;">${evDate}</div>` : ""}
    </div>`;
    })
    .join("");

  // Interests pills
  const interestPillsHtml = INTEREST_PRESETS.map((tag) => {
    const active = profileInterests.includes(tag);
    return `<button class="interest-pill${active ? " active" : ""}" onclick="toggleProfileInterest('${escapeHtml(tag)}')">${escapeHtml(tag)}</button>`;
  }).join("");

  const badgeHint = nextLv
    ? `${earnedCount} badge${earnedCount !== 1 ? "s" : ""} earned · ${nextLv.min - earnedCount} more to reach ${nextLv.title}`
    : "✦ Max rank achieved";

  return `
    <!-- Card -->
    <div class="prof-card-section">
      ${profileCardHtml(card, cardExt)}
      <div class="prof-card-btns">
        ${
          card
            ? `<button class="btn btn-small" onclick="openCardEditor(null)">Edit card</button>
             <button class="btn btn-outline btn-small" onclick="openExpandedCard()">View + QR</button>`
            : `<button class="btn btn-small" style="flex:1;" onclick="openCardEditor(null)">Create your card</button>`
        }
      </div>
    </div>

    <!-- Stats row -->
    <div class="prof-stats-row list-item-stagger">
      <div class="pstat"><div class="pstat-num">${count}</div><div class="pstat-lbl">Events</div></div>
      <div class="pstat"><div class="pstat-num">${state.friends.length}</div><div class="pstat-lbl">Friends</div></div>
      <div class="pstat"><div class="pstat-num">${myTickets.length}</div><div class="pstat-lbl">Tickets</div></div>
      <div class="pstat"><div class="pstat-num">${earnedCount}</div><div class="pstat-lbl">Badges</div></div>
    </div>

    <!-- Achievements card -->
    <div class="prof-achievements-card" onclick="openAchievements()" role="button" tabindex="0">
      <div class="prof-ach-header">
        <span class="prof-ach-title">Achievements</span>
        <span class="prof-ach-level" style="color:${lv.color};">${lv.title}</span>
      </div>
      <div class="prof-ach-sub">${earnedCount} badge${earnedCount !== 1 ? "s" : ""} earned${nextLv ? ` · ${nextLv.min - earnedCount} more to reach ${nextLv.title}` : " · Max rank"}</div>
      <div class="prof-ach-progress"><div class="prof-ach-fill" style="width:${nextLv ? Math.min(100, Math.round(((earnedCount - lv.min) / (nextLv.min - lv.min)) * 100)) : 100}%;background:${lv.color};"></div></div>
      <div class="prof-ach-cta">View badges &amp; history →</div>
    </div>

    <!-- Action list -->
    <div class="prof-action-list">
      <button class="prof-action-row" onclick="openMyTickets()">
        <span class="prof-action-label">My Tickets</span>
        <span class="prof-action-right">${myTickets.length > 0 ? myTickets.length + " " : ""}›</span>
      </button>
      <button class="prof-action-row" onclick="editProfile()">
        <span class="prof-action-label">Edit name &amp; email</span>
        <span class="prof-action-right">›</span>
      </button>
      <button class="prof-action-row" onclick="window.location.href='mailto:hello@cumulusapp.co'">
        <span class="prof-action-label">Help &amp; Support</span>
        <span class="prof-action-right">›</span>
      </button>
      <button class="prof-action-row prof-action-signout" onclick="signOut()">
        <span class="prof-action-label">Sign out</span>
        <span class="prof-action-right">›</span>
      </button>
    </div>
    ${
      state.profileEmail === "gondoxml@gmail.com"
        ? `
    <div class="prof-admin-section">
      <div class="prof-admin-label">Admin &amp; Finances</div>
      <div class="prof-action-list">
        <button class="prof-action-row" onclick="promptAdminSignIn()">
          <span class="prof-action-label">Admin sign-in<span class="prof-action-sub" id="admin-auth-sub">Verify with a one-time code to approve events</span></span>
          <span class="prof-action-right">›</span>
        </button>
        <button class="prof-action-row" onclick="openOwnerDash()">
          <span class="prof-action-label">Finances<span class="prof-action-sub">Live revenue &amp; payouts</span></span>
          <span class="prof-action-right">›</span>
        </button>
        <button class="prof-action-row" onclick="openReview()">
          <span class="prof-action-label">Host applications<span class="prof-action-sub">Review &amp; approve hosts</span></span>
          <span class="prof-action-right">›</span>
        </button>
        <button class="prof-action-row" onclick="openEventApprovals()">
          <span class="prof-action-label">Event approvals<span class="prof-action-sub">Review &amp; publish public events</span></span>
          <span class="prof-action-right">›</span>
        </button>
        <button class="prof-action-row prof-action-danger" onclick="clearAllUsers()">
          <span class="prof-action-label">Clear all users<span class="prof-action-sub">Delete every account &amp; email (keeps events)</span></span>
          <span class="prof-action-right">›</span>
        </button>
        <button class="prof-action-row prof-action-danger" onclick="if(confirm('Delete ALL rows in users, events, rsvps, tickets, chat_messages, friends? This cannot be undone.')){clearAllTestData(true)}">
          <span class="prof-action-label">Wipe all test data<span class="prof-action-sub">Users + events + everything</span></span>
          <span class="prof-action-right">›</span>
        </button>
      </div>
    </div>`
        : ""
    }


    <!-- About me + interests + spots (all in one card) -->
    <div class="prof-about-section">
      <div class="prof-about-label">About me</div>
      <div class="profile-about-wrap">
        <textarea class="profile-about-input" id="profile-about-input" maxlength="150"
          placeholder="Tell people a little about you…"
          oninput="updateAboutCounter(this)"
          onblur="saveProfileAbout(this.value)"
        >${escapeHtml(profileAbout)}</textarea>
        <div class="profile-about-counter" id="about-counter">${profileAbout.length}/150</div>
      </div>

      <div class="prof-divider"></div>
      <div class="prof-about-label">Interests</div>
      <div class="interests-grid" id="interests-grid">${interestPillsHtml}</div>

      ${
        topAreas.length
          ? `
      <div class="prof-divider"></div>
      <div class="prof-about-label">My London spots</div>
      <div class="area-chips">${topAreas.map((a) => `<div class="area-chip"><span>${escapeHtml(a)}</span></div>`).join("")}
        <button class="btn btn-text btn-small" style="font-size:11px;" onclick="openCardEditor(null)">Edit in card →</button>
      </div>`
          : `<div class="prof-divider"></div>
      <button class="btn btn-text btn-small" style="font-size:12px;padding:0;" onclick="openCardEditor(null)">+ Add your London spots in your card</button>`
      }
    </div>

    <!-- Night Shot memories -->
    ${
      memories.length
        ? `
    <div class="profile-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span class="profile-section-label" style="margin-bottom:0;color:#FCD34D;">📸 Memories</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">${memoriesHtml}</div>
    </div>`
        : ""
    }

    <!-- Recent events (only shown if user has any) -->
    ${
      recentEvents.length
        ? `
    <div class="profile-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span class="profile-section-label" style="margin-bottom:0;flex:0 0 auto;">Recent events</span>
        ${myEvents.length > 4 ? `<button class="btn btn-text btn-small" onclick="openAchievements()" style="font-size:11px;">See all ${myEvents.length} →</button>` : ""}
      </div>
      <div class="ev-plate-grid list-item-stagger">${recentEvHtml}</div>
    </div>`
        : ""
    }
  `;
}

function openAchievements() {
  pushNav();
  state.view = "achievements";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderAchievements() {
  const myEvents = getMyEvents();
  const myCats = getMyCategories();
  const count = myEvents.length;
  let earnedCount = 0;
  MILESTONE_BADGES.forEach((b) => {
    if (count >= b.need) earnedCount++;
  });
  CATEGORY_BADGES.forEach((b) => {
    if (myCats.has(b.cat)) earnedCount++;
  });
  if (myCats.size >= TOTAL_CATEGORIES) earnedCount++;
  earnedCount += state.specialBadges.length;
  const lv = getLevel(earnedCount);
  const nextLvIdx = LEVELS.findIndex((l) => l === lv) + 1;
  const nextLv = LEVELS[nextLvIdx];
  const progressPct = nextLv
    ? Math.min(
        100,
        Math.round(((earnedCount - lv.min) / (nextLv.min - lv.min)) * 100),
      )
    : 100;

  const milestoneCells = MILESTONE_BADGES.map((b) => {
    const earned = count >= b.need;
    return trophyCellHtml(
      b.name,
      b.desc,
      b.glyph,
      b.metal,
      b.metal,
      b.tier,
      earned,
      earned ? "" : `${count} / ${b.need} events`,
    );
  }).join("");
  const allRounderEarned = myCats.size >= TOTAL_CATEGORIES;
  const allRounderCell = trophyCellHtml(
    ALLROUNDER_BADGE.name,
    ALLROUNDER_BADGE.desc,
    ALLROUNDER_BADGE.glyph,
    ALLROUNDER_BADGE.metal,
    ALLROUNDER_BADGE.glow,
    ALLROUNDER_BADGE.tier,
    allRounderEarned,
    allRounderEarned ? "" : `${myCats.size} / ${TOTAL_CATEGORIES} categories`,
  );
  const categoryCells = CATEGORY_BADGES.map((b) => {
    const earned = myCats.has(b.cat);
    return badgeCellHtml(
      b.name,
      b.desc,
      b.glyph,
      CATS[b.cat].color,
      earned,
      "",
    );
  }).join("");
  const specialEarned = SPECIAL_BADGES.filter((b) =>
    state.specialBadges.includes(b.id),
  );
  const specialCells = specialEarned
    .map((b) => badgeCellHtml(b.name, b.desc, b.glyph, "var(--gold)", true, ""))
    .join("");

  // Full event history (all events)
  const allEvents = myEvents.slice().reverse();
  const MUTED_CATS_A = {
    Creative: "rgba(232,184,75,0.10)",
    Gaming: "rgba(232,184,75,0.10)",
    "Movie Nights": "rgba(232,184,75,0.10)",
    "Board Games": "rgba(232,184,75,0.10)",
    Meetups: "rgba(232,184,75,0.10)",
    "Food & Drink": "rgba(232,184,75,0.10)",
    "Live Music": "rgba(232,184,75,0.10)",
    "Wellness & Outdoors": "rgba(232,184,75,0.10)",
    "Tech & Talks": "rgba(232,184,75,0.10)",
  };
  const evTilesHtml = allEvents.length
    ? allEvents
        .map((ev) => {
          const c2 = CATS[ev.category] || { color: "#FFCF33" };
          const shortTitle =
            ev.title.length > 28 ? ev.title.substring(0, 26) + "…" : ev.title;
          const evDate = ev.startsAt
            ? new Date(ev.startsAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
              })
            : "";
          const status = eventStatus(ev);
          const statusDot =
            status === "live"
              ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:4px;box-shadow:0 0 5px #22c55e88;"></span>`
              : status === "upcoming"
                ? `<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${c2.color};margin-right:4px;opacity:0.7;"></span>`
                : "";
          return `<div class="ev-plate" onclick="openEvent(${ev.id})" style="background:${hexToRgba(c2.color, 0.08)};border:1px solid ${c2.color}28;" role="button" tabindex="0" aria-label="Open ${escapeHtml(ev.title)}">
          <div style="font-size:12px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:4px;">${escapeHtml(shortTitle)}</div>
          <div style="font-size:10px;color:var(--text-muted);display:flex;align-items:center;">${statusDot}${escapeHtml(ev.category)}</div>
          ${evDate ? `<div style="font-size:10px;color:${c2.color};font-weight:600;margin-top:4px;">${evDate}</div>` : ""}
        </div>`;
        })
        .join("")
    : `<div style="color:var(--text-muted);font-size:13px;padding:4px 0;">No events yet — browse and RSVP to get started.</div>`;

  return `<button class="back-btn" onclick="goBack()">←</button>

    <!-- Level hero -->
    <div class="achieve-hero">
      <div class="achieve-badge-big" style="background:${lv.color}22;border-color:${lv.color};color:${lv.color};">${lv.title.substring(0, 2).toUpperCase()}</div>
      <div class="achieve-hero-text">
        <div class="achieve-hero-level" style="color:${lv.color};">${lv.title}</div>
        <div class="achieve-hero-sub">${earnedCount} badge${earnedCount !== 1 ? "s" : ""} earned${nextLv ? ` · ${nextLv.min - earnedCount} more to reach ${nextLv.title}` : " · Max rank!"}</div>
        <div class="achieve-progress-bar"><div class="achieve-progress-fill" style="width:${progressPct}%;background:${lv.color};"></div></div>
      </div>
    </div>

    <!-- Milestones -->
    <div class="profile-section">
      <div class="profile-section-label">Milestones</div>
      <div class="badge-grid list-item-stagger">${milestoneCells}${allRounderCell}</div>
    </div>

    <!-- Categories explored -->
    <div class="profile-section">
      <div class="profile-section-label">Categories explored</div>
      <div class="badge-grid list-item-stagger">${categoryCells}</div>
    </div>

    ${
      specialCells
        ? `
    <div class="profile-section">
      <div class="profile-section-label">Special &amp; community badges</div>
      <div class="badge-grid list-item-stagger">${specialCells}</div>
    </div>`
        : ""
    }

    <!-- Event history (all) -->
    ${
      allEvents.length
        ? `
    <div class="profile-section">
      <div class="profile-section-label">All events (${allEvents.length})</div>
      <div class="ev-plate-grid list-item-stagger">${evTilesHtml}</div>
    </div>`
        : ""
    }

    <!-- Redeem -->
    <div class="profile-section">
      <div class="profile-section-label">Badge codes</div>
      <div class="panel redeem-box" style="--corner:var(--gold);">
        <h4>Redeem a badge code</h4>
        <p>Promoters can issue collectible badges. Got a code from an event? Enter it here.</p>
        <div class="redeem-row"><input id="redeem-input" class="redeem-input" placeholder="ENTER CODE" onkeydown="if(event.key==='Enter')redeemBadge()"/><button class="btn" style="background:var(--gold);color:#1a1400;" onclick="redeemBadge()">Redeem</button></div>
        <div class="promoter-note">Running an event and want your own badge? Contact the Cumulus team.</div>
      </div>
    </div>`;
}

function editProfile() {
  state.editingProfile = true;
  renderNav();
  renderView();
}

function updateAboutCounter(el) {
  const ctr = document.getElementById("about-counter");
  if (!ctr) return;
  const n = el.value.length;
  ctr.textContent = n + "/150";
  ctr.classList.toggle("warn", n > 130);
}

function saveProfileAbout(val) {
  try {
    localStorage.setItem("profile_about:" + state.profileName, val.trim());
  } catch (e) {}
}

function toggleProfileInterest(tag) {
  let pi = [];
  try {
    const r = localStorage.getItem("profile_interests:" + state.profileName);
    if (r) pi = JSON.parse(r);
  } catch (e) {}
  const idx = pi.indexOf(tag);
  if (idx === -1) pi.push(tag);
  else pi.splice(idx, 1);
  try {
    localStorage.setItem(
      "profile_interests:" + state.profileName,
      JSON.stringify(pi),
    );
  } catch (e) {}
  // Toggle pill without full re-render
  document.querySelectorAll(".interest-pill").forEach((btn) => {
    if (btn.textContent === tag)
      btn.classList.toggle("active", pi.includes(tag));
  });
}

// Compact real-event preview card reused wherever a screen needs to show
// live events instead of empty space (Calendar agenda, Social teaser).
// Small urgency pill shown on card-style event rows when few spaces remain
// (<=15% of capacity) — reuses the exact spacesLeft calc from renderDetail().
function almostFullBadgeHtml(ev) {
  if (!ev.capacity) return "";
  const going = attendeesFor(ev.id).length;
  const spacesLeft = Math.max(0, ev.capacity - going);
  if (spacesLeft > 0 && spacesLeft <= Math.ceil(ev.capacity * 0.15)) {
    return `<span class="badge-almost-full">Almost full</span>`;
  }
  return "";
}

function miniEventCardHtml(ev) {
  const c = CATS[ev.category] || { color: "var(--accent)" };
  return `<div class="lp-comm-card mini-ev-card" onclick="openEvent(${ev.id})" role="button" tabindex="0">
    <span class="cal-agenda-dot" style="background:${c.color};"></span>
    <div class="lp-comm-text">
      <div class="lp-comm-title">${escapeHtml(ev.title)}</div>
      <div class="lp-comm-sub">${escapeHtml(ev.date)} · ${escapeHtml(ev.venue || ev.area || "")}</div>
    </div>
    ${almostFullBadgeHtml(ev)}
  </div>`;
}

function setCalendarViewMode(mode) {
  state.calendarViewMode = mode;
  renderView();
}

function renderCalendar() {
  const weeks = buildCalendarWeeks(CALENDAR_YEAR, CALENDAR_MONTH);
  const eventsByDay = {};
  const monthEvents = [];
  EVENTS.forEach((ev) => {
    const d = getEventDay(ev, CALENDAR_YEAR, CALENDAR_MONTH);
    if (d) {
      if (!eventsByDay[d]) eventsByDay[d] = [];
      eventsByDay[d].push(ev);
      monthEvents.push(ev);
    }
  });
  monthEvents.sort((a, b) => a.startsAt - b.startsAt);

  const header = `
    <div class="connect-header cal-header">
      <button class="cal-nav-btn" onclick="changeCalendarMonth(-1)" aria-label="Previous month">←</button>
      <div>
        <div class="prof-about-label" style="margin-bottom:2px;">Event Calendar</div>
        <h2>${MONTH_NAMES[CALENDAR_MONTH]} ${CALENDAR_YEAR}</h2>
        <p>What's on this month</p>
      </div>
      <button class="cal-nav-btn" onclick="changeCalendarMonth(1)" aria-label="Next month">→</button>
    </div>
    <div class="social-seg cal-mode-seg">
      <button class="social-seg-btn${state.calendarViewMode === "list" ? "" : " active"}" onclick="setCalendarViewMode('month')">Month</button>
      <button class="social-seg-btn${state.calendarViewMode === "list" ? " active" : ""}" onclick="setCalendarViewMode('list')">List</button>
    </div>`;

  if (state.calendarViewMode === "list") {
    return header + renderCalendarEventList(monthEvents);
  }

  const now = new Date();
  const todayDay =
    now.getFullYear() === CALENDAR_YEAR && now.getMonth() === CALENDAR_MONTH
      ? now.getDate()
      : null;
  const cellsHtml = weeks
    .map((week) =>
      week
        .map((day) => {
          if (!day) return `<div class="calendar-cell empty"></div>`;
          const dayEvents = eventsByDay[day] || [];
          const isToday = day === todayDay;
          const dotN = Math.min(dayEvents.length, 4);
          const dots = dayEvents.length
            ? `<div class="cal-dots">${dayEvents
                .slice(0, dotN)
                .map((ev) => {
                  const cc = (CATS[ev.category] || { color: "var(--accent)" })
                    .color;
                  return `<span class="cal-dot" style="background:${cc};"></span>`;
                })
                .join(
                  "",
                )}${dayEvents.length > 4 ? `<span class="cal-dot-more">+${dayEvents.length - 4}</span>` : ""}</div>`
            : "";
          return `<div class="calendar-cell ${isToday ? "today" : ""} ${dayEvents.length ? "has-events" : ""} pointer" onclick="openCalendarDay(${day})" style="cursor:pointer;" role="button" tabindex="0" aria-label="${day}${dayEvents.length ? `, ${dayEvents.length} event${dayEvents.length !== 1 ? "s" : ""}` : ""}"><div class="calendar-day-num">${day}</div>${dots}</div>`;
        })
        .join(""),
    )
    .join("");
  const agendaHtml = monthEvents.length
    ? `<div class="cal-agenda">
        ${monthEvents.slice(0, 6).map(miniEventCardHtml).join("")}
      </div>`
    : `<div class="cal-agenda cal-agenda-empty">
        <div class="map-empty-card" role="status" style="max-width:100%;">
          <div class="me-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3.5v3M16 3.5v3"/></svg></div>
          <div class="me-title">Nothing on the calendar yet</div>
          <div class="me-sub">Events you RSVP to or host will show up here automatically.</div>
          <button class="btn" onclick="goBrowse()">Browse events</button>
        </div>
      </div>`;
  return (
    header +
    `
    <div class="calendar-scroll"><div class="calendar-inner">
      <div class="calendar-header-row">${WEEKDAY_LABELS.map((d) => `<div class="calendar-weekday">${d}</div>`).join("")}</div>
      <div class="calendar-grid">${cellsHtml}</div>
    </div></div>
    ${agendaHtml}`
  );
}

// Searchable flat list of the currently-navigated month's events, grouped by
// date — the Dice/Eventbrite-style alternative to the month grid. The search
// box re-filters client-side (no full renderView()) so typing never loses
// focus; it's a local filter, separate from the global map #search-input.
function renderCalendarEventList(monthEvents) {
  const df = state.calListDateFilter || "all";
  return `<div class="cal-list">
    <div class="social-seg cal-mode-seg" style="max-width:280px;">
      <button class="social-seg-btn${df === "today" ? " active" : ""}" onclick="setCalListDateFilter('today')">Today</button>
      <button class="social-seg-btn${df === "weekend" ? " active" : ""}" onclick="setCalListDateFilter('weekend')">This weekend</button>
      <button class="social-seg-btn${df === "all" ? " active" : ""}" onclick="setCalListDateFilter('all')">All</button>
    </div>
    <input id="cal-list-search" class="search-input" style="width:100%;margin-bottom:16px;" placeholder="Search this month's events…" oninput="filterCalendarList()" autocomplete="off"/>
    <div id="cal-list-items">${calendarListItemsHtml(monthEvents, "")}</div>
  </div>`;
}
function setCalListDateFilter(mode) {
  state.calListDateFilter = state.calListDateFilter === mode ? "all" : mode;
  renderView();
}

function calendarListItemsHtml(events, query) {
  const q = (query || "").toLowerCase().trim();
  const df = state.calListDateFilter || "all";
  let filtered = q
    ? events.filter((ev) =>
        (ev.title + ev.venue + ev.area + ev.category + (ev.host || ""))
          .toLowerCase()
          .includes(q),
      )
    : events;
  if (df !== "all") filtered = filtered.filter((ev) => eventInDateRange(ev, df));
  if (!filtered.length) {
    return `<div class="map-empty-card" role="status" style="max-width:100%;margin:0 auto;">
      <div class="me-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg></div>
      <div class="me-title">${q ? "No events match" : "Nothing on the calendar yet"}</div>
      <div class="me-sub">${q ? "Try a different search term." : "Events posted for this month will show up here."}</div>
    </div>`;
  }
  const groups = [];
  let lastKey = null;
  filtered.forEach((ev) => {
    if (ev.date !== lastKey) {
      groups.push({ key: ev.date, items: [] });
      lastKey = ev.date;
    }
    groups[groups.length - 1].items.push(ev);
  });
  return groups
    .map(
      (g) => `<div class="cal-list-group">
        <div class="cal-list-date">${escapeHtml(g.key)}</div>
        ${g.items.map(calendarListRowHtml).join("")}
      </div>`,
    )
    .join("");
}

function calendarListRowHtml(ev) {
  const c = CATS[ev.category] || { color: "var(--accent)" };
  const att = attendeesFor(ev.id);
  return `<div class="panel cal-list-row" style="--corner:${c.color};" onclick="openEvent(${ev.id})" role="button" tabindex="0">
    <div class="cal-list-row-main">
      <div class="cal-list-row-title">${escapeHtml(ev.title)}</div>
      <div class="cal-list-row-sub">${ev.time} · ${escapeHtml(ev.venue)}${ev.area ? ` · ${escapeHtml(ev.area)}` : ""} · ${att.length} going</div>
    </div>
    ${almostFullBadgeHtml(ev)}
    <span class="event-badge" style="--cat:${c.color};--cat-text:${c.textColor};margin-bottom:0;flex-shrink:0;">${ev.category}</span>
  </div>`;
}

function filterCalendarList() {
  const input = document.getElementById("cal-list-search");
  const container = document.getElementById("cal-list-items");
  if (!input || !container) return;
  const monthEvents = [];
  EVENTS.forEach((ev) => {
    if (getEventDay(ev, CALENDAR_YEAR, CALENDAR_MONTH)) monthEvents.push(ev);
  });
  monthEvents.sort((a, b) => a.startsAt - b.startsAt);
  container.innerHTML = calendarListItemsHtml(monthEvents, input.value);
}

// ════════════════════════════════════════════════
// TICKET SYSTEM
// ════════════════════════════════════════════════
function eventPrice(ev) {
  return ev.price || 0;
}
function getCumulusFee(ticketPrice) {
  if (ticketPrice <= 0) return 0;
  if (ticketPrice <= 15) return 1.5;
  if (ticketPrice <= 40) return 2.5;
  if (ticketPrice <= 71) return 3.5;
  return 4.5;
}
function ticketTypes(ev) {
  const basePrice = eventPrice(ev);
  if (!basePrice)
    return [
      {
        id: "free",
        label: "Free Registration",
        price: 0,
        platformFee: 0,
        desc: "Claim your spot — no charge",
      },
    ];
  const platformFee = getCumulusFee(basePrice);
  return [
    {
      id: "general",
      label: "General Admission",
      price: basePrice,
      platformFee,
      desc: "Standard entry to the event",
    },
  ];
}
function generateTicketId() {
  return "CU-" + Math.random().toString(36).slice(2, 8).toUpperCase();
}
// Squad ticket-claim link code — separate namespace from ticket IDs so a
// leaked claim URL can't be confused with (or used as) a ticket lookup.
function generateClaimCode() {
  return Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 6);
}

let myTickets = [];
async function loadMyTickets() {
  if (!state.userId) {
    const r = await localGet(`tickets:${state.profileName}`);
    myTickets = r ? JSON.parse(r) : [];
    return;
  }
  const { data } = await sb
    .from("tickets")
    .select("*")
    .eq("user_id", state.userId)
    .order("purchased_at", { ascending: false });
  if (data)
    myTickets = data.map((t) => ({
      ticketId: t.ticket_id,
      bookingId: t.booking_id,
      seatNum: t.seat_num,
      totalSeats: t.total_seats,
      eventId: t.event_id,
      type: t.ticket_type,
      typeLabel: t.type_label,
      pricePerTicket: t.price_per_ticket,
      total: t.total,
      purchaserName: t.purchaser_name,
      purchasedAt: new Date(t.purchased_at).getTime(),
      squadId: t.squad_id,
      claimCode: t.claim_code,
    }));
}
async function _insertTickets(tickets) {
  if (!state.userId) return;
  const rows = tickets.map((t) => ({
    ticket_id: t.ticketId,
    booking_id: t.bookingId,
    seat_num: t.seatNum || null,
    total_seats: t.totalSeats || null,
    event_id: t.eventId,
    user_id: state.userId,
    ticket_type: t.type,
    type_label: t.typeLabel,
    price_per_ticket: t.pricePerTicket,
    platform_fee: t.platformFee || 0,
    total: t.total,
    purchaser_name: t.purchaserName,
    purchased_at: new Date(t.purchasedAt).toISOString(),
    squad_id: t.squadId || null,
    claim_code: t.claimCode || null,
  }));
  await sb.from("tickets").insert(rows);
}

// A Squad is created once per multi-ticket purchase; the buyer keeps the
// first ticket, every other ticket gets a claim_code for the "share with
// your squad" link (claimTicket() reassigns it once someone opens the link).
async function createSquadIfNeeded(eventId, qty) {
  if (qty <= 1 || !state.userId) return null;
  try {
    const { data, error } = await sb
      .from("event_squads")
      .insert({ event_id: eventId, buyer_user_id: state.userId })
      .select()
      .single();
    if (error || !data) return null;
    return data.id;
  } catch (e) {
    return null;
  }
}
function getTicketForEvent(evId) {
  return myTickets.find((t) => t.eventId === evId);
}

let bookingDraft = {
  eventId: null,
  type: "general",
  qty: 1,
  confirmedTicket: null,
};

function openBook(id) {
  pushNav();
  bookingDraft = { eventId: id, qty: 1, confirmedTicket: null };
  const ev = EVENTS.find((e) => e.id === id);
  bookingDraft.type = ev ? ticketTypes(ev)[0].id : "general";
  state.view = "book";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function setBookingType(type) {
  bookingDraft.type = type;
  renderView();
}
function setBookingQty(q) {
  bookingDraft.qty = Math.max(1, Math.min(10, q));
  renderView();
}
function proceedToCheckout() {
  pushNav();
  state.view = "checkout";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function openViewTicket(evId) {
  pushNav();
  const eventTickets = myTickets.filter((t) => t.eventId === evId);
  if (!eventTickets.length) {
    openBook(evId);
    return;
  }
  bookingDraft.confirmedTickets = eventTickets;
  state.view = "confirmed";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}
function openMyTickets() {
  pushNav();
  state.view = "my-tickets";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function registerFree(evId) {
  const ev = EVENTS.find((e) => e.id === evId);
  if (!ev) return;
  const baseId = generateTicketId();
  const nf = bookingDraft.qty || 1;
  const squadId = await createSquadIfNeeded(ev.id, nf);
  const freeTickets = Array.from({ length: nf }, (_, i) => ({
    ticketId: nf > 1 ? `${baseId}-${String(i + 1).padStart(2, "0")}` : baseId,
    seatNum: nf > 1 ? i + 1 : null,
    totalSeats: nf > 1 ? nf : null,
    bookingId: baseId,
    eventId: ev.id,
    type: "free",
    typeLabel: "Free Registration",
    pricePerTicket: 0,
    total: 0,
    purchaserName: state.profileName,
    purchasedAt: Date.now(),
    squadId,
    claimCode: i > 0 ? generateClaimCode() : null,
  }));
  myTickets.push(...freeTickets);
  await _insertTickets(freeTickets);
  // RSVP via Supabase
  const list = state.rsvps[ev.id] || [];
  if (!list.includes(state.profileName)) {
    await sb.from("rsvps").insert({
      event_id: ev.id,
      user_id: state.userId,
      user_name: state.profileName,
    });
    state.rsvps[ev.id] = [...list, state.profileName];
  }
  bookingDraft.confirmedTickets = freeTickets;
  navStack = [];
  state.view = "confirmed";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function processPayment() {
  const name = (document.getElementById("pay-name")?.value || "").trim();
  const card = (document.getElementById("pay-card")?.value || "").replace(
    /s/g,
    "",
  );
  const expiry = document.getElementById("pay-expiry")?.value || "";
  const cvv = (document.getElementById("pay-cvv")?.value || "").trim();
  if (!name || card.length < 15 || expiry.length < 4 || cvv.length < 3) {
    showToast("Please fill in all payment details correctly.", "error");
    return;
  }
  const btn = document.getElementById("pay-btn");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span style="opacity:.7">Processing…</span>';
  }
  await new Promise((r) => setTimeout(r, 1800));
  const ev = EVENTS.find((e) => e.id === bookingDraft.eventId);
  const sel =
    ticketTypes(ev).find((t) => t.id === bookingDraft.type) ||
    ticketTypes(ev)[0];
  const baseId = generateTicketId();
  const n = bookingDraft.qty;
  const platformFee = sel.platformFee || 0;
  const totalCharged = sel.price + platformFee;
  const squadId = await createSquadIfNeeded(ev.id, n);
  const newTickets = Array.from({ length: n }, (_, i) => ({
    ticketId: n > 1 ? `${baseId}-${String(i + 1).padStart(2, "0")}` : baseId,
    seatNum: n > 1 ? i + 1 : null,
    totalSeats: n > 1 ? n : null,
    bookingId: baseId,
    eventId: ev.id,
    type: sel.id,
    typeLabel: sel.label,
    pricePerTicket: sel.price,
    platformFee,
    total: totalCharged,
    purchaserName: state.profileName,
    purchasedAt: Date.now(),
    squadId,
    claimCode: i > 0 ? generateClaimCode() : null,
  }));
  myTickets.push(...newTickets);
  await _insertTickets(newTickets);
  const list = state.rsvps[ev.id] || [];
  if (!list.includes(state.profileName)) {
    await sb.from("rsvps").insert({
      event_id: ev.id,
      user_id: state.userId,
      user_name: state.profileName,
    });
    state.rsvps[ev.id] = [...list, state.profileName];
  }
  bookingDraft.confirmedTickets = newTickets;
  navStack = [];
  state.view = "confirmed";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function formatCardNumber(el) {
  let v = el.value.replace(/D/g, "").slice(0, 16);
  el.value = v.replace(/(.{4})/g, "$1 ").trim();
}
function formatExpiry(el) {
  let v = el.value.replace(/D/g, "").slice(0, 4);
  if (v.length > 2) v = v.slice(0, 2) + "/" + v.slice(2);
  el.value = v;
}

function afterRenderConfirmed() {
  const tickets = bookingDraft.confirmedTickets || [];
  if (!tickets.length) return;
  tickets.forEach((t, i) => {
    const el = document.getElementById(`ticket-qr-${i}`);
    if (!el) return;
    el.innerHTML = "";
    try {
      new QRCode(el, {
        text: t.ticketId,
        width: 120,
        height: 120,
        colorDark: "#000",
        colorLight: "#fff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      el.innerHTML = `<div style="font-size:10px;word-break:break-all;color:#333;">${t.ticketId}</div>`;
    }
  });
}

function downloadICS(evId) {
  const ev = EVENTS.find((e) => e.id === evId);
  if (!ev) return;
  const pad = (n) => String(n).padStart(2, "0");
  const fmtDT = (d) => {
    const u = new Date(d);
    return `${u.getUTCFullYear()}${pad(u.getUTCMonth() + 1)}${pad(u.getUTCDate())}T${pad(u.getUTCHours())}${pad(u.getUTCMinutes())}${pad(u.getUTCSeconds())}Z`;
  };
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cumulus Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:cumulus-${ev.id}-${Date.now()}@cumulus.app`,
    `DTSTART:${fmtDT(ev.startTime)}`,
    `DTEND:${fmtDT(ev.endTime)}`,
    `SUMMARY:${ev.title}`,
    `DESCRIPTION:${ev.desc.replace(/[;,]/g, "$&").replace(/n/g, "n")} — Hosted by ${ev.host}`,
    `LOCATION:${ev.venue}, ${ev.area}, London`,
    `ORGANIZER;CN="${ev.host}":mailto:events@cumulus.app`,
    "STATUS:CONFIRMED",
    "TRANSP:OPAQUE",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("rn");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download =
    ev.title.replace(/[^a-z0-9]/gi, "-").replace(/-+/g, "-") + ".ics";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 1000);
}

// ─── Render: Ticket selection ────────────────────────────────────────────
function renderBook() {
  const ev = EVENTS.find((e) => e.id === bookingDraft.eventId);
  if (!ev) return '<div class="empty-state">Event not found.</div>';
  const c = CATS[ev.category];
  const types = ticketTypes(ev);
  const sel = types.find((t) => t.id === bookingDraft.type) || types[0];
  const isFree = !eventPrice(ev);
  const qty = bookingDraft.qty;
  const baseTotal = sel.price * qty;
  const feeTotal = (sel.platformFee || 0) * qty;
  const finalTotal = baseTotal + feeTotal;
  const typeCards = types
    .map(
      (t) => `
    <div onclick="setBookingType('${t.id}')" style="border:2px solid ${bookingDraft.type === t.id ? c.color : "var(--line)"};border-radius:14px;padding:14px 16px;cursor:pointer;background:${bookingDraft.type === t.id ? hexToRgba(c.color, 0.07) : "var(--surface-2)"};transition:all .15s;margin-bottom:10px;" role="radio" tabindex="0" aria-checked="${bookingDraft.type === t.id ? "true" : "false"}" aria-label="${escapeHtml(t.label)}, ${t.price ? `£${t.price.toFixed(2)}` : "Free"}">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div><div style="font-weight:700;font-size:14px;color:var(--text);">${t.label}</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${t.desc}</div></div>
        <div style="font-size:18px;font-weight:800;color:${bookingDraft.type === t.id ? c.color : "var(--text)"};">${t.price ? `£${t.price.toFixed(2)}` : "Free"}</div>
      </div>
    </div>`,
    )
    .join("");
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><span class="event-badge" style="--cat:;">${ev.category}</span><h2>${escapeHtml(ev.title)}</h2><p>${ev.date} · ${escapeHtml(ev.venue)}</p></div>
    <div class="section-title">Choose your ticket</div>
    ${typeCards}
    ${
      !isFree
        ? `
    <div class="section-title">Quantity</div>
    <div class="panel" style="--corner:var(--accent);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <button class="btn btn-outline" style="width:42px;height:42px;padding:0;font-size:22px;border-radius:50%;flex-shrink:0;" onclick="setBookingQty(${qty - 1})">−</button>
      <div style="text-align:center;"><div style="font-size:30px;font-weight:800;color:var(--text);">${qty}</div><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">ticket${qty !== 1 ? "s" : ""}</div></div>
      <button class="btn btn-outline" style="width:42px;height:42px;padding:0;font-size:22px;border-radius:50%;flex-shrink:0;" onclick="setBookingQty(${qty + 1})">+</button>
    </div>`
        : ""
    }
    <div class="panel" style="--corner:${c.color};padding:16px 20px;background:${hexToRgba(c.color, 0.05)};margin-bottom:18px;">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:2px;">Order summary</div>
      <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:10px;">The price you see here is exactly what you'll pay — no surprise fees at checkout.</div>
      <div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--text-soft);margin-bottom:6px;"><span>${sel.label}${!isFree ? ` × ${qty}` : ""}</span><span>${sel.price ? `£${baseTotal.toFixed(2)}` : "Free"}</span></div>
      ${
        !isFree
          ? `
      <div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--text-soft);margin-bottom:4px;"><span>Cumulus platform fee</span><span>£${feeTotal.toFixed(2)}</span></div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;font-style:italic;">The host keeps 100% of their ticket price.</div>`
          : ""
      }
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:var(--text);padding-top:10px;border-top:1px solid var(--line);"><span>Total</span><span style="color:${c.color};">${finalTotal ? `£${finalTotal.toFixed(2)}` : "Free"}</span></div>
    </div>
    <button class="btn" style="width:100%;background:${c.color};padding:14px;font-size:15px;" onclick="${isFree ? `registerFree(${ev.id})` : `proceedToCheckout()`}">${isFree ? "Register Free →" : `Continue to Payment · £${finalTotal.toFixed(2)} →`}</button>
    <p style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:10px;">Free cancellation up to 24 hours before the event (Cumulus's standard policy, unless the host states otherwise) · <a href="terms.html" target="_blank" style="color:var(--gold-text);">See full policy</a></p>`;
}

// ─── Render: Mock payment ────────────────────────────────────────────────
function renderCheckout() {
  const ev = EVENTS.find((e) => e.id === bookingDraft.eventId);
  if (!ev) return "";
  const c = CATS[ev.category];
  const types = ticketTypes(ev);
  const sel = types.find((t) => t.id === bookingDraft.type) || types[0];
  const total = (
    (sel.price + (sel.platformFee || 0)) *
    bookingDraft.qty
  ).toFixed(2);
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>Payment</h2><p>${escapeHtml(ev.title)} · ${sel.label} × ${bookingDraft.qty}</p></div>
    <div style="background:var(--gold-tint);border:1px solid var(--gold);border-radius:14px;padding:13px 16px;margin-bottom:20px;font-size:13px;color:var(--text-soft);line-height:1.6;">
      <strong style="color:var(--text);">Test mode</strong> — use card <strong>4242 4242 4242 4242</strong>, any future expiry (e.g. 12/28), any 3-digit CVV.
    </div>
    <div class="panel intro-form" style="--corner:${c.color};">
      <label class="intro-field-label">Name on card</label>
      <input id="pay-name" class="gate-input" placeholder="Name on card" value="${escapeHtml(state.profileName)}" autocomplete="cc-name"/>
      <label class="intro-field-label">Card number</label>
      <input id="pay-card" class="gate-input" placeholder="1234 5678 9012 3456" maxlength="19" inputmode="numeric" oninput="formatCardNumber(this)" autocomplete="cc-number"/>
      <div style="display:flex;gap:12px;">
        <div style="flex:1;"><label class="intro-field-label">Expiry</label><input id="pay-expiry" class="gate-input" placeholder="MM/YY" maxlength="5" inputmode="numeric" oninput="formatExpiry(this)" autocomplete="cc-exp"/></div>
        <div style="flex:1;"><label class="intro-field-label">CVV</label><input id="pay-cvv" class="gate-input" placeholder="123" maxlength="4" inputmode="numeric" autocomplete="cc-csc"/></div>
      </div>
    </div>
    <button id="pay-btn" class="btn" style="width:100%;background:${c.color};padding:14px;font-size:15px;margin-top:4px;" onclick="processPayment()">Pay £${total} →</button>
    <div style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:10px;">Secure test payment — no real charge will occur.</div>`;
}

// ─── Render: Ticket confirmation ─────────────────────────────────────────
function renderConfirmed() {
  const tickets = bookingDraft.confirmedTickets || [];
  if (!tickets.length)
    return '<div class="empty-state">No tickets found.</div>';
  const t0 = tickets[0];
  const ev = EVENTS.find((e) => e.id === t0.eventId);
  if (!ev) return "";
  const c = CATS[ev.category];
  const purchased = new Date(t0.purchasedAt).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const totalPaid = tickets.reduce((s, t) => s + (t.total || 0), 0);
  const ticketCards = tickets
    .map(
      (t, i) => `
    <div class="panel" style="--corner:${c.color};overflow:visible;margin-bottom:${i < tickets.length - 1 ? "20" : "0"}px;border-radius:20px;">
      <div style="position:relative;padding:18px 18px 20px;border-bottom:2px dashed var(--line);">
        <div style="position:absolute;left:-13px;bottom:-14px;width:26px;height:26px;border-radius:50%;background:var(--bg);border:1px solid var(--line);z-index:2;"></div>
        <div style="position:absolute;right:-13px;bottom:-14px;width:26px;height:26px;border-radius:50%;background:var(--bg);border:1px solid var(--line);z-index:2;"></div>
        ${tickets.length > 1 ? `<div style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${c.color};margin-bottom:6px;">Ticket ${t.seatNum} of ${t.totalSeats}</div>` : ""}
        <span class="event-badge" style="--cat:;margin-bottom:6px;">${ev.category}</span>
        <div style="font-size:17px;font-weight:800;margin:6px 0 4px;line-height:1.2;color:var(--text);">${escapeHtml(ev.title)}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:1px;">${ev.date} · ${ev.time}</div>
        <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(ev.venue)}, ${escapeHtml(ev.area)}</div>
        <div style="margin-top:12px;display:flex;gap:8px;font-size:12px;">
          <div style="background:var(--surface-2);border-radius:9px;padding:7px 10px;flex:1;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Type</div><div style="font-weight:700;color:var(--text);margin-top:1px;">${t.typeLabel}</div></div>
          <div style="background:var(--surface-2);border-radius:9px;padding:7px 10px;flex:1;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Paid</div><div style="font-weight:700;color:${c.color};margin-top:1px;">${t.total ? `£${t.total.toFixed(2)}` : "Free"}</div></div>
        </div>
      </div>
      <div style="padding:18px;text-align:center;">
        <div id="ticket-qr-${i}" style="width:134px;height:134px;margin:0 auto 10px;background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:7px;"></div>
        <div style="font-family:ui-monospace,monospace;font-size:11.5px;font-weight:700;color:var(--text);letter-spacing:1.5px;">${t.ticketId}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Show at the door · Purchased ${purchased}</div>
      </div>
    </div>`,
    )
    .join("");
  // Squad ticketing: any ticket from this purchase still carrying a
  // claim_code (i.e. index > 0, not yet claimed by someone else) gets a
  // share link here — the buyer's own ticket (index 0) never has one.
  const unclaimed = tickets.filter((t) => t.claimCode);
  const squadSection = unclaimed.length
    ? `<div class="hp-panel" style="margin-top:20px;">
        <div class="hp-title">👥 Share with your squad</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">You bought ${tickets.length} tickets — send each link below to whoever's coming with you. Whoever opens it claims that ticket as their own.</div>
        ${unclaimed
          .map(
            (t) => `<div class="hp-tier-row">
              <span class="hp-tier-label">Ticket ${t.seatNum} of ${t.totalSeats}</span>
              <button class="btn btn-outline btn-small" style="min-height:32px;padding:0 12px;" onclick="shareSquadTicket('${t.claimCode}','${escapeHtml(ev.title).replace(/'/g, "&#39;")}')">Share link</button>
            </div>`,
          )
          .join("")}
      </div>`
    : "";

  return `<div style="text-align:center;padding:20px 0 16px;">
      <div style="width:58px;height:58px;border-radius:50%;background:#22C55E;color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;box-shadow:0 4px 18px rgba(34,197,94,0.3);">${checkIconSvg(28)}</div>
      <div style="font-size:21px;font-weight:800;color:var(--text);">${totalPaid ? "Payment confirmed!" : "You're registered!"}</div>
      <div style="font-size:12.5px;color:var(--text-muted);margin-top:3px;">${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} · ${totalPaid ? `£${totalPaid.toFixed(2)} total` : "Free"}</div>
    </div>
    ${ticketCards}
    ${squadSection}
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
      <button class="btn" style="background:${c.color};" onclick="downloadICS(${ev.id})">+ Add to Calendar</button>
      <button class="btn btn-text" onclick="openTicketsTab()">View all my tickets →</button>
    </div>
    <p style="text-align:center;font-size:11px;color:var(--text-muted);margin-top:14px;">Free cancellation up to 24 hours before the event · <a href="terms.html" target="_blank" style="color:var(--gold-text);">See full policy</a></p>`;
}

// ─── Render: My Tickets list ──────────────────────────────────────────────
function renderMyTickets() {
  if (!myTickets.length)
    return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>My Tickets</h2><p>All your event bookings</p></div>
    <div class="empty-state">No tickets yet — browse events and book your first one.<br><br><button class="btn" onclick="goBrowse()">Browse Events</button></div>`;
  const cards = [...myTickets]
    .reverse()
    .map((t) => {
      const ev = EVENTS.find((e) => e.id === t.eventId);
      if (!ev) return "";
      const c = CATS[ev.category];
      const status = eventStatus(ev);
      const d = new Date(t.purchasedAt).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      });
      return `<div class="panel" style="--corner:${c.color};padding:16px 18px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px;">
        <div style="flex:1;min-width:0;">
          <span class="event-badge" style="--cat:;font-size:10px;">${ev.category}</span>
          ${status === "live" ? `<span class="live-chip" style="margin-left:6px;"><span class="dot"></span>Live</span>` : ""}
          <div style="font-size:15px;font-weight:700;margin:6px 0 3px;line-height:1.2;">${escapeHtml(ev.title)}</div>
          <div style="font-size:12px;color:var(--text-muted);">${ev.date} · ${escapeHtml(ev.venue)}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">${t.qty} × ${t.typeLabel}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:16px;font-weight:800;color:${c.color};">${t.total ? `£${t.total.toFixed(2)}` : "Free"}</div>
          <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Booked ${d}</div>
        </div>
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--line);">
        <div style="font-family:ui-monospace,monospace;font-size:11px;font-weight:700;color:var(--text-muted);">${t.ticketId}</div>
        <div style="display:flex;gap:8px;">
          <button class="btn btn-outline btn-small" onclick="downloadICS(${ev.id})">+ Cal</button>
          <button class="btn btn-small" style="background:${c.color};" onclick="openViewTicket(${ev.id})">Ticket</button>
        </div>
      </div>
      ${
        status !== "past" && ev.startsAt - Date.now() >= 24 * 3600000
          ? `<button class="btn-text" style="width:100%;margin-top:8px;color:#E23B3B;font-size:12px;" onclick="cancelTicket('${t.ticketId}')">Cancel booking</button>`
          : ""
      }
    </div>`;
    })
    .join("");
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>My Tickets</h2><p>${myTickets.length} booking${myTickets.length !== 1 ? "s" : ""}</p></div>
    ${cards}`;
}

// Real self-serve cancellation, mirroring deleteEvent()'s Supabase-delete
// pattern. Gated to >=24h before the event, matching the policy copy shown
// at booking/confirmation (renderBook/renderConfirmed).
async function cancelTicket(ticketId) {
  const t = myTickets.find((x) => x.ticketId === ticketId);
  if (!t) return;
  const ev = EVENTS.find((e) => e.id === t.eventId);
  if (ev && ev.startsAt - Date.now() < 24 * 3600000) {
    showToast("Cancellations close 24 hours before the event.", "error");
    return;
  }
  if (!confirm("Cancel this booking? This can't be undone.")) return;
  myTickets = myTickets.filter((x) => x.ticketId !== ticketId);
  if (state.userId) {
    await sb
      .from("tickets")
      .delete()
      .eq("ticket_id", ticketId)
      .eq("user_id", state.userId);
  }
  showToast("Booking cancelled", "success");
  renderView();
}

// ════════════════════════════════════════════════
// CALENDAR DAY VIEW
// ════════════════════════════════════════════════
function openCalendarDay(day) {
  pushNav();
  state.calendarDay = day;
  state.view = "calendar-day";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderCalendarDay() {
  const day = state.calendarDay;
  const dateObj = new Date(CALENDAR_YEAR, CALENDAR_MONTH, day);
  const dayLabel = dateObj.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const eventsByDay = {};
  EVENTS.forEach((ev) => {
    const d = getEventDay(ev, CALENDAR_YEAR, CALENDAR_MONTH);
    if (d) {
      if (!eventsByDay[d]) eventsByDay[d] = [];
      eventsByDay[d].push(ev);
    }
  });
  const dayEvents = (eventsByDay[day] || []).sort(
    (a, b) => a.startsAt - b.startsAt,
  );
  if (!dayEvents.length)
    return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>${dayLabel}</h2><p>Nothing scheduled today</p></div>
    <div class="empty-state">Nothing on this day. <button class="btn-text" onclick="openHost()">Host one?</button></div>`;
  const cards = dayEvents
    .map((ev) => {
      const c = CATS[ev.category];
      const status = eventStatus(ev);
      const att = attendeesFor(ev.id);
      const ticket = getTicketForEvent(ev.id);
      const price = eventPrice(ev);
      const spacesLeft = ev.capacity
        ? Math.max(0, ev.capacity - att.length)
        : null;
      return `<div class="panel" style="--corner:${c.color};padding:18px 20px;margin-bottom:12px;">
      <div style="display:flex;align-items:flex-start;gap:12px;justify-content:space-between;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
            <span class="event-badge" style="--cat:;margin-bottom:0;">${ev.category}</span>
            ${status === "live" ? `<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live now</span>` : `<span class="upcoming-chip" style="margin-left:0;">Upcoming</span>`}
          </div>
          <div style="font-size:16px;font-weight:800;line-height:1.2;margin-bottom:5px;color:var(--text);">${escapeHtml(ev.title)}</div>
          <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:2px;">${ev.time}</div>
          <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:6px;">${escapeHtml(ev.venue)}, ${escapeHtml(ev.area)}</div>
          <div style="font-size:12px;color:var(--text-soft);">${att.length} going${spacesLeft !== null ? ` · ${spacesLeft} spaces left` : ""} · ${price ? `From £${price}` : "Free"}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
        ${
          ticket
            ? `<button class="btn btn-small" style="background:#22C55E;" onclick="openViewTicket(${ev.id})">${checkIconSvg(13)} View Ticket</button>`
            : `<button class="btn btn-small" style="background:${c.color};" onclick="openBook(${ev.id})">${price ? "Book Now" : "Register Free"}</button>`
        }
        <button class="btn btn-outline btn-small" onclick="downloadICS(${ev.id})">+ Add to Calendar</button>
        <button class="btn btn-text btn-small" onclick="openEvent(${ev.id})">Details</button>
      </div>
    </div>`;
    })
    .join("");
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>${dateObj.toLocaleDateString("en-GB", { weekday: "long" })}, ${dateObj.toLocaleDateString("en-GB", { day: "numeric", month: "long" })}</h2><p>${dayEvents.length} event${dayEvents.length !== 1 ? "s" : ""}</p></div>
    ${cards}`;
}

// ── Nav helpers ──────────────────────────────────────────────────────────
function openTicketsTab() {
  state.view = "tickets";
  renderNav();
  renderView();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ── Tickets tab ──────────────────────────────────────────────────────────
function renderTicketsTab() {
  const byEvent = {};
  myTickets.forEach((t) => {
    if (!byEvent[t.eventId]) byEvent[t.eventId] = [];
    byEvent[t.eventId].push(t);
  });
  const sortedIds = Object.keys(byEvent)
    .map(Number)
    .sort((a, b) => {
      const ea = EVENTS.find((e) => e.id === a),
        eb = EVENTS.find((e) => e.id === b);
      return (ea?.startsAt || 0) - (eb?.startsAt || 0);
    });
  const upcoming = sortedIds.filter((id) => {
    const ev = EVENTS.find((e) => e.id === id);
    return ev && eventStatus(ev) !== "past";
  });
  const past = sortedIds.filter((id) => {
    const ev = EVENTS.find((e) => e.id === id);
    return ev && eventStatus(ev) === "past";
  });

  const renderGroup = (ids, label) => {
    if (!ids.length) return "";
    const cards = ids
      .map((evId) => {
        const ev = EVENTS.find((e) => e.id === evId);
        if (!ev) return "";
        const c = CATS[ev.category];
        const tickets = byEvent[evId];
        const status = eventStatus(ev);
        const total = tickets.reduce((s, t) => s + (t.total || 0), 0);
        return `<div class="panel" style="--corner:${c.color};padding:16px 18px;margin-bottom:12px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px;">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:5px;">
              <span class="event-badge" style="--cat:;margin-bottom:0;">${ev.category}</span>
              ${status === "live" ? `<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live</span>` : ""}
            </div>
            <div style="font-size:15px;font-weight:700;line-height:1.2;margin-bottom:4px;">${escapeHtml(ev.title)}</div>
            <div style="font-size:12px;color:var(--text-muted);">${ev.date} · ${ev.time}</div>
            <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(ev.venue)}, ${escapeHtml(ev.area)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:15px;font-weight:800;color:${c.color};">${total ? `£${total.toFixed(2)}` : "Free"}</div>
            <div style="font-size:11px;color:var(--text-muted);">${tickets.length} ticket${tickets.length !== 1 ? "s" : ""}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-small" style="background:${c.color};" onclick="openViewTicket(${evId})">View Ticket${tickets.length > 1 ? "s" : ""}</button>
          <button class="btn btn-text btn-small" onclick="downloadICS(${evId})">+ Cal</button>
        </div>
      </div>`;
      })
      .join("");
    return `<div class="section-title">${label}</div>${cards}`;
  };

  if (!myTickets.length)
    return `
    <div class="connect-header" style="padding-top:16px;"><h2>My Tickets</h2><p>Your event bookings</p></div>
    <div class="empty-state">No tickets yet — browse events and book your first one.<br><br><button class="btn" onclick="goBrowse()">Browse Events</button></div>`;
  return `
    <div class="connect-header" style="padding-top:16px;"><h2>My Tickets</h2><p>${upcoming.length} upcoming · ${past.length} past</p></div>
    ${renderGroup(upcoming, "Upcoming")}
    ${renderGroup(past, "Past")}`;
}

// Hosting is frictionless — no eligibility checklist, no connections/check-in
// gate, no private/public split. Everyone can host; every event is public
// (instantly for admins, via a quick pending_events review for everyone else —
// see the notify-admin-new-event edge function, which emails on every
// submission).
function renderHostView() {
  return `
    <div class="connect-header" style="padding-top:16px;"><h2>Host an event</h2><p>Zero platform fee — you keep 100% of your ticket price.</p></div>
    <div id="host-type-notice" class="host-notice">${
      state.isAdmin
        ? "⚡ Admin — event publishes immediately to the live map."
        : "Your event goes live after a quick review, usually within a few hours."
    }</div>

    <div class="host-section">
      <div class="host-section-title">Event basics</div>
      <label class="intro-field-label">Title</label>
      <input id="host-title" class="gate-input" placeholder="e.g., Summer Park Picnic"/>
      <label class="intro-field-label">Category</label>
      <select id="host-cat" class="gate-input">${Object.keys(CATS)
        .map((c) => `<option value="${c}">${c}</option>`)
        .join("")}</select>
      <label class="intro-field-label">Description</label>
      <textarea id="host-desc" class="gate-input" rows="3" placeholder="What's the vibe? What should people expect?"></textarea>
    </div>

    <div class="host-section">
      <div class="host-section-title">Date &amp; time</div>
      <label class="intro-field-label">Start date</label>
      <input id="host-start-date" type="date" class="gate-input"/>
      <label class="intro-field-label">Start time</label>
      <input id="host-start-time" type="time" class="gate-input"/>
      <label class="intro-field-label" style="margin-top:14px;">End date</label>
      <input id="host-end-date" type="date" class="gate-input"/>
      <label class="intro-field-label">End time</label>
      <input id="host-end-time" type="time" class="gate-input"/>
    </div>

    <div class="host-section" style="overflow:visible;">
      <div class="host-section-title">Location</div>
      <label class="intro-field-label">Search address</label>
      <div style="position:relative;margin-bottom:10px;">
        <input id="host-address-search" class="gate-input" placeholder="Street name or postcode..." oninput="handleAddressAutocomplete()" autocomplete="off"/>
        <div id="autocomplete-results" style="position:absolute;top:100%;left:0;right:0;background:var(--surface);border:1px solid var(--line);border-radius:12px;max-height:200px;overflow-y:auto;z-index:2000;display:none;box-shadow:0 8px 20px var(--shadow);"></div>
      </div>
      <div id="host-map-picker"></div>
      <div id="host-lat-lon-text" style="font-size:11px;color:var(--text-muted);margin:6px 0 10px;font-weight:600;">Default: Central London — search above or tap map to pin exact location</div>
      <label class="intro-field-label">Venue name</label>
      <input id="host-venue" class="gate-input" placeholder="e.g., The Rooftop, Community Hall"/>
      <label class="intro-field-label">Area (optional)</label>
      <input id="host-area" class="gate-input" placeholder="e.g., Shoreditch"/>
    </div>

    <div class="host-section">
      <div class="host-section-title">Capacity</div>
      <label class="intro-field-label">Max attendees</label>
      <input id="host-capacity" type="number" min="1" class="gate-input" placeholder="e.g., 20"/>
    </div>

    <div class="host-section">
      <div class="host-section-title">Pricing</div>
      <label class="intro-field-label">Ticket Price (£) — You keep 100%</label>
      <input id="host-price" type="number" min="0" step="0.01" class="gate-input" placeholder="e.g. 10 (Leave blank for free)"/>
      <div class="host-notice">We add a flat, transparent platform fee to the buyer at checkout to cover processing. You keep every penny of your ticket price.</div>
    </div>

    <button id="host-submit-btn" class="btn" style="width:100%;margin-bottom:16px;font-size:15px;" onclick="submitHostEvent()">${state.isAdmin ? "Publish event →" : "Submit for review →"}</button>
    ${renderHostPayoutsPanel()}`;
}

// Boot. Never let an unexpected rejection leave the user on a blank screen.
start().catch((e) => {
  try {
    renderGate();
  } catch (_) {}
});

// ══════════════════════════════════════════════
// PROFESSIONAL POLISH — PHASE II JAVASCRIPT
// View transitions · Ripples · Scroll reveal · Stagger
// ══════════════════════════════════════════════

// --- View transition wrapper ---
const _origRenderView = renderView;
renderView = function () {
  _origRenderView.apply(this, arguments);
  const container = document.getElementById("view-container");
  if (container && state.view !== "browse") {
    container.classList.remove("view-enter");
    void container.offsetWidth; // force reflow
    container.classList.add("view-enter");
    // Stagger child panels
    const panels = container.querySelectorAll(
      ".panel, .friend-card, .intro-card, .badge-cell, .stat-box",
    );
    panels.forEach((el, i) => {
      el.style.animationDelay = `${i * 0.045}s`;
      el.classList.add("stagger-item");
    });
    // Scroll reveal observer
    requestAnimationFrame(() => setupReveal(container));
  }
};

// --- Scroll reveal via IntersectionObserver ---
function setupReveal(root) {
  if (!window.IntersectionObserver) return;
  const els = (root || document).querySelectorAll(
    ".panel, .section-title, .connect-header, .back-btn",
  );
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.08 },
  );
  els.forEach((el) => {
    el.classList.add("reveal");
    obs.observe(el);
  });
}

// --- Button ripple effect ---
document.addEventListener(
  "click",
  function (e) {
    const btn = e.target.closest(".btn:not(.btn-text)");
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement("span");
    ripple.className = "btn-ripple";
    ripple.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - rect.left - size / 2}px;top:${e.clientY - rect.top - size / 2}px;`;
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove());
  },
  { passive: true },
);

// --- Gate card: add stagger to form fields ---
const _origRenderGate = renderGate;
renderGate = function () {
  _origRenderGate.apply(this, arguments);
  requestAnimationFrame(() => {
    const fields = document.querySelectorAll(
      "#gate-root label, #gate-root input, #gate-root button, #gate-root p",
    );
    fields.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      setTimeout(
        () => {
          el.style.transition = "opacity 0.3s ease, transform 0.3s ease";
          el.style.opacity = "";
          el.style.transform = "";
        },
        220 + i * 60,
      );
    });
  });
};

// --- Card editor stagger ---
const _origRenderCardEditor = renderCardEditor;
renderCardEditor = function () {
  _origRenderCardEditor.apply(this, arguments);
  requestAnimationFrame(() => {
    // The card editor's swatch/pattern/tag pickers add up to 250+ elements
    // across its four tabs. Staggering by a flat per-element index (i * 50ms)
    // meant elements late in DOM order — e.g. the Pattern tab's buttons —
    // stayed invisible for 5-15+ seconds if a user switched to that tab
    // before its turn came up, since switching tabs doesn't re-trigger this
    // reveal. Cap the index so every field is visible within ~1s of the
    // editor opening, no matter how many fields exist across all tabs.
    const fields = document.querySelectorAll(
      "#card-editor-root label, #card-editor-root input, #card-editor-root textarea, #card-editor-root button",
    );
    fields.forEach((el, i) => {
      el.style.opacity = "0";
      setTimeout(
        () => {
          el.style.transition = "opacity 0.28s ease";
          el.style.opacity = "";
        },
        180 + Math.min(i, 14) * 50,
      );
    });
  });
};

// --- Smooth map caption on load ---
window.addEventListener("load", () => {
  setTimeout(() => setupReveal(document.getElementById("view-container")), 300);
});

// Keyboard support for div/span elements acting as buttons (role="button"/"radio"):
// activates on Enter/Space so mouse-only onclick handlers are reachable from a keyboard.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const el = e.target.closest('[role="button"],[role="radio"]');
  if (!el) return;
  e.preventDefault();
  el.click();
});

// Escape closes whichever overlay/modal/popup is currently open — each close
// function is a no-op if its overlay isn't present, so it's safe to call them all.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  try {
    closeLpSignup();
  } catch (err) {}
  try {
    closeAttendeePeek();
  } catch (err) {}
  try {
    closeActivePopup();
  } catch (err) {}
  try {
    closeBadgePicker();
  } catch (err) {}
  try {
    closeExpandedCard();
  } catch (err) {}
  try {
    if (document.getElementById("card-editor-root")?.innerHTML) closeCardEditor();
  } catch (err) {}
});
