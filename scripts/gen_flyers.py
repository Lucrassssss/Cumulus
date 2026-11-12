#!/usr/bin/env python3
"""Mock flyers for the stress-test events → assets/flyers/<slug>.svg (4:5).
One per event title used by _seed_stress_test(). Six print-style layouts,
palette per category. Re-run after changing titles: python3 scripts/gen_flyers.py"""
import os, re, hashlib
OUT = os.path.join(os.path.dirname(__file__), "..", "assets", "flyers")
T = {
 "Board Games": ["Strategy Night","Cosy Co-op Games","Big Box Sunday","Deduction Club","Monday Board Games"],
 "Creative": ["Life Drawing","Zine Workshop","Clay & Wine","Print Club"],
 "Food & Drink": ["Supper Club","Natural Wine Tasting","Dumpling Workshop","Street Food Social","Wednesday Supper Club"],
 "Gaming": ["Retro Arcade Night","Mario Kart Cup","Indie Games Showcase","Speedrun Social"],
 "Live Music": ["Late Night Jazz","Indie Showcase","Soul Sessions","Folk in the Round","Thursday Jazz Club"],
 "Meetups": ["Founders & Friends","New in London Social","Run & Brunch","Language Exchange"],
 "Movie Nights": ["Cult Classics","Rooftop Cinema","Double Bill","Short Film Night"],
 "Tech & Talks": ["AI After Hours","Design Crit","Lightning Talks","Hack Night"],
 "Wellness & Outdoors": ["Sunrise Yoga","Sound Bath","Park Run Social","Breathwork","Sunday Run Club"],
}
# (background, ink, accent, second accent)
P = {
 "Board Games": [("#1d3b8f","#f4efe2","#ff5a36","#ffd23f"),("#f4efe2","#1d3b8f","#ff5a36","#1d3b8f")],
 "Creative": [("#ff4f7b","#1a1020","#ffd23f","#f7f1e3"),("#f7f1e3","#1a1020","#ff4f7b","#2f6bff")],
 "Food & Drink": [("#e8402a","#fff3df","#ffd23f","#1b1b1b"),("#fff3df","#1b1b1b","#e8402a","#2e7d4f")],
 "Gaming": [("#12122b","#d4ff3f","#ff3d9a","#35e0ff"),("#35e0ff","#12122b","#ff3d9a","#12122b")],
 "Live Music": [("#0e0e10","#f5f0e6","#ff2e63","#f6c945"),("#f6c945","#0e0e10","#ff2e63","#0e0e10")],
 "Meetups": [("#ffb000","#201a12","#ff5fa8","#fff6e0"),("#fff6e0","#201a12","#ff5fa8","#ffb000")],
 "Movie Nights": [("#7a1022","#f3e6c8","#f6c945","#120a0c"),("#120a0c","#f3e6c8","#e23b3b","#f6c945")],
 "Tech & Talks": [("#101418","#e9eef2","#3fe0a5","#5b7cff"),("#5b7cff","#ffffff","#101418","#3fe0a5")],
 "Wellness & Outdoors": [("#1f6f54","#f2f6e9","#b8f23c","#ffcf70"),("#f2f6e9","#1f6f54","#ff8a4c","#1f6f54")],
}
FONT = "'Arial Black','Helvetica Neue',Helvetica,Arial,sans-serif"
MONO = "'Courier New',Courier,monospace"
W, H = 800, 1000
def slug(t): return re.sub(r"[^a-z0-9]+", "-", t.lower()).strip("-")
def esc(s): return s.replace("&", "&amp;")
def lines(title, maxlen):
    out, cur = [], ""
    for w in title.upper().split():
        if cur and len(cur) + 1 + len(w) > maxlen: out.append(cur); cur = w
        else: cur = (cur + " " + w).strip()
    out.append(cur); return out
def title_block(title, x, top, maxw, ink, maxlen=9, cap=150, anchor="start", avail=340):
    """Title set from `top` downward, sized to fit both width and `avail` height."""
    ls = lines(title, maxlen)
    size = min(cap, maxw / (0.72 * max(len(l) for l in ls)), avail / (0.92 * len(ls)))
    y = top + size * 0.82
    t = "".join(f'<text x="{x}" y="{y + i * size * 0.92:.0f}" font-family="{FONT}" font-weight="900" font-size="{size:.0f}" letter-spacing="-{size*0.035:.1f}" fill="{ink}" text-anchor="{anchor}">{esc(l)}</text>' for i, l in enumerate(ls))
    return t, y + (len(ls) - 1) * size * 0.92
def small(txt, x, y, ink, anchor="start", size=22):
    return f'<text x="{x}" y="{y}" font-family="{MONO}" font-weight="700" font-size="{size}" letter-spacing="3" fill="{ink}" text-anchor="{anchor}">{esc(txt.upper())}</text>'

def sun(t, c, p):
    bg, ink, a, b = p
    tb, _ = title_block(t, 56, 120, 690, ink, avail=270)
    stripes = "".join(f'<rect x="0" y="{640 + i*44}" width="{W}" height="{10 + i*5}" fill="{bg}"/>' for i in range(8))
    return f'<rect width="{W}" height="{H}" fill="{bg}"/><circle cx="400" cy="700" r="300" fill="{a}"/>{stripes}{tb}{small(c + " · London", 56, 70, ink)}<rect x="56" y="88" width="120" height="8" fill="{a}"/>'
def swiss(t, c, p):
    bg, ink, a, b = p
    tb, ye = title_block(t, 56, 150, 690, ink, maxlen=8, cap=170, avail=440)
    return f'<rect width="{W}" height="{H}" fill="{bg}"/><rect x="56" y="56" width="688" height="14" fill="{ink}"/>{small("Cumulus presents", 56, 110, ink)}{small("No. " + str(len(t) * 7 % 90 + 10), 744, 110, ink, "end")}{tb}<rect x="56" y="{ye + 40:.0f}" width="320" height="14" fill="{a}"/><circle cx="640" cy="830" r="120" fill="{a}"/><rect x="56" y="760" width="300" height="190" fill="{b}"/>'
def checker(t, c, p):
    bg, ink, a, b = p
    sq = "".join(f'<rect x="{x*100}" y="{600 + y*100}" width="100" height="100" fill="{a if (x+y)%2 else b}"/>' for x in range(8) for y in range(4))
    tb, _ = title_block(t, 400, 120, 690, ink, anchor="middle", avail=380)
    return f'<rect width="{W}" height="{H}" fill="{bg}"/>{sq}{tb}{small(c, 400, 80, ink, "middle")}<circle cx="400" cy="600" r="70" fill="{bg}" stroke="{ink}" stroke-width="10"/>'
def arcs(t, c, p):
    bg, ink, a, b = p
    rings = "".join(f'<circle cx="{W}" cy="{H}" r="{r}" fill="none" stroke="{[a, b, ink][i % 3]}" stroke-width="46"/>' for i, r in enumerate(range(140, 760, 92)))
    tb, _ = title_block(t, 56, 120, 600, ink, maxlen=8, avail=300)
    return f'<rect width="{W}" height="{H}" fill="{bg}"/>{rings}{tb}{small(c + " / Cumulus", 56, 80, ink)}'
def dots(t, c, p):
    bg, ink, a, b = p
    ds = "".join(f'<circle cx="{60 + x*62}" cy="{540 + y*62}" r="{4 + (x + y) * 1.7:.1f}" fill="{a if (x*y)%5 else b}"/>' for x in range(12) for y in range(8))
    tb, _ = title_block(t, 56, 120, 690, ink, avail=360)
    return f'<rect width="{W}" height="{H}" fill="{bg}"/>{ds}{tb}{small(c, 56, 80, ink)}{small("London", 744, 80, ink, "end")}'
def bars(t, c, p):
    bg, ink, a, b = p
    bs = "".join(f'<rect x="{-200 + i*130}" y="480" width="64" height="700" fill="{[a, b][i % 2]}" transform="rotate(24 {-200 + i*130} 480)"/>' for i in range(10))
    tb, _ = title_block(t, 56, 120, 690, ink, maxlen=10, avail=280)
    return f'<rect width="{W}" height="{H}" fill="{bg}"/>{bs}<rect x="0" y="0" width="{W}" height="470" fill="{bg}"/>{tb}{small(c + " · Cumulus", 56, 80, ink)}<rect x="56" y="420" width="688" height="10" fill="{ink}"/>'
LAYOUTS = [sun, swiss, checker, arcs, dots, bars]

os.makedirs(OUT, exist_ok=True)
n = 0
for cat, titles in T.items():
    for i, t in enumerate(titles):
        h = int(hashlib.md5(t.encode()).hexdigest(), 16)
        body = LAYOUTS[h % len(LAYOUTS)](t, cat, P[cat][(h >> 8) % 2])
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {H}" width="{W}" height="{H}" preserveAspectRatio="xMidYMid slice">{body}</svg>'
        open(os.path.join(OUT, slug(t) + ".svg"), "w").write(svg); n += 1
print(n, "flyers")
