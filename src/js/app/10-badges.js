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
      return `<div class="ns-tile" onclick="openEvent('${ev.id}')" role="button" tabindex="0" aria-label="Open ${escapeHtml(ev.title)}">
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
      return `<div class="ev-plate" onclick="openEvent('${ev.id}')" style="background:${mutedBg};border:1px solid ${c2.color}28;" title="${escapeHtml(ev.title)}" role="button" tabindex="0" aria-label="Open ${escapeHtml(ev.title)}">
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
      ${
        canAccessScanner()
          ? `<button class="prof-action-row" onclick="openScannerPicker()">
        <span class="prof-action-label">Scan tickets<span class="prof-action-sub">Check guests in at the door</span></span>
        <span class="prof-action-right">›</span>
      </button>`
          : ""
      }
      ${
        isApprovedHost()
          ? ""
          : state.hostApplicationStatus === "pending"
            ? `<div class="prof-action-row" style="opacity:.6;">
        <span class="prof-action-label">Host application<span class="prof-action-sub">Pending review — usually within 48 hours</span></span>
      </div>`
            : `<button class="prof-action-row" onclick="openHostApply()">
        <span class="prof-action-label">Become a host<span class="prof-action-sub">Apply to host events on Cumulus</span></span>
        <span class="prof-action-right">›</span>
      </button>`
      }
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
        <button class="prof-action-row prof-action-danger" onclick="if(confirm('Delete ALL rows in users, events, rsvps, tickets? This cannot be undone.')){clearAllTestData(true)}">
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
          return `<div class="ev-plate" onclick="openEvent('${ev.id}')" style="background:${hexToRgba(c2.color, 0.08)};border:1px solid ${c2.color}28;" role="button" tabindex="0" aria-label="Open ${escapeHtml(ev.title)}">
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

const ELC_LOCATION_ICON = `<svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><path d="M12 21s7-7.58 7-12A7 7 0 0 0 5 9c0 4.42 7 12 7 12Z"/><circle cx="12" cy="9" r="2.3"/></svg>`;

// Shared event row used everywhere the app needs a bigger, richer synopsis
// card rather than a bare title — calendar List mode and Day view. A square
// image (a real photo if one exists — currently only ev.nightShotUrl, a
// past-event memory shot — else a category stock photo via catImg(), same
// source the detail page's own hero already uses) plus title/location/host,
// nothing else: no inline "Book"/"Add to calendar" actions, since the point
// is a synopsis, not a duplicate purchase flow — the whole card opens the
// real detail page, where buying actually happens.
function eventListCardHtml(ev) {
  const c = CATS[ev.category] || { color: "var(--accent)", textColor: "#fff" };
  const status = eventStatus(ev);
  const price = eventPrice(ev);
  const img = ev.photoUrl || ev.nightShotUrl || catImg(ev.category);
  return `<div class="panel event-list-card" style="--corner:${c.color};" onclick="openEvent('${ev.id}')" role="button" tabindex="0" aria-label="Open ${escapeHtml(ev.title)}">
    <div class="elc-img" style="background-image:url('${img}');"></div>
    <div class="elc-body">
      <div class="elc-top-row">
        <span class="event-badge" style="--cat:${c.color};--cat-text:${c.textColor};margin-bottom:0;">${ev.category}</span>
        ${status === "live" ? `<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live</span>` : ""}
        ${almostFullBadgeHtml(ev)}
      </div>
      <div class="elc-title">${escapeHtml(ev.title)}</div>
      <div class="elc-meta">${ELC_LOCATION_ICON}<span>${escapeHtml(ev.venue || "")}${ev.area ? `, ${escapeHtml(ev.area)}` : ""}</span></div>
      <div class="elc-meta">${escapeHtml(ev.date)} · ${escapeHtml(ev.time)}</div>
      <div class="elc-foot">
        ${ev.host ? `<span class="elc-host">Hosted by ${escapeHtml(ev.host)}</span>` : `<span></span>`}
        <span class="elc-price">${price ? `From £${price}` : "Free"}</span>
      </div>
    </div>
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
  // Month view is the grid alone — no card list duplicated underneath it
  // (that's what List mode is for). The one exception is an empty month,
  // where a bare grid of dot-less cells reads as broken rather than "there's
  // just nothing on yet", so that case still gets a prompt.
  const agendaHtml = monthEvents.length
    ? ""
    : `<div class="cal-agenda-empty">
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
        ${g.items.map(eventListCardHtml).join("")}
      </div>`,
    )
    .join("");
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
// Blueprint table-stakes: tiered ticketing that "flips automatically" —
// implemented here as a time-cutoff schedule (events.price_tiers, e.g.
// Early Bird -> General -> Final). Capacity-based flipping is deliberately
// NOT implemented (would need a live attendee-count trigger; documented as
// deferred in ARCHITECTURE.md rather than half-built). Tiers are ordered by
// cutoff ascending; the active tier is the first whose cutoff hasn't
// passed, falling back to the last (final) tier once every cutoff has
// passed. This same selection logic is duplicated server-side in
// create-checkout-session (never trust the client for the actual charge).
function activeTicketTier(ev) {
  const tiers = Array.isArray(ev.priceTiers) ? ev.priceTiers : null;
  if (!tiers || !tiers.length) return null;
  const now = Date.now();
  const sorted = [...tiers].sort(
    (a, b) => new Date(a.cutoff || 0) - new Date(b.cutoff || 0),
  );
  const active = sorted.find((t) => !t.cutoff || new Date(t.cutoff) > now);
  return active || sorted[sorted.length - 1];
}
function eventPrice(ev) {
  const tier = activeTicketTier(ev);
  if (tier) return Number(tier.price) || 0;
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
  const tier = activeTicketTier(ev);
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
  if (tier) {
    return [
      {
        id: "tier",
        label: tier.label || "General",
        price: basePrice,
        platformFee,
        desc: tier.cutoff
          ? `${tier.label} pricing — rises after ${new Date(tier.cutoff).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
          : "Final price — this is it",
      },
    ];
  }
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
    marketing_opt_in: t.marketingOptIn || false,
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
  // Read before the book screen's DOM goes away — startStripeCheckout()
  // (fired from the checkout screen) needs this value later.
  bookingDraft.marketingOptIn = !!document.getElementById("book-marketing-optin")?.checked;
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
  const marketingOptIn = !!document.getElementById("book-marketing-optin")?.checked;
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
    marketingOptIn,
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

// Maps Cumulus's current light/dark palette onto Stripe's Elements
// Appearance API (theme + variables + fonts) so the payment form reads as
// part of the same page instead of a foreign white card dropped into a
// themed UI. Genuinely applies here — this is the raw Elements API
// (stripe.elements({appearance, fonts}), not the pre-built Checkout
// Session form's initEmbeddedCheckout()/createEmbeddedCheckoutPage(),
// which rejects an appearance option outright and, even where a
// server-side branding_settings equivalent exists, still can't theme its
// own input card (a fixed-light-surface product constraint, not a missing
// parameter — see ARCHITECTURE.md). Reads live computed CSS custom
// properties rather than duplicating hex values here, so it can never
// drift out of sync with styles.css.
function stripeAppearanceForCurrentTheme() {
  const isDark = document.documentElement.dataset.theme === "dark";
  const cs = getComputedStyle(document.documentElement);
  const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
  return {
    appearance: {
      theme: isDark ? "night" : "stripe",
      variables: {
        colorPrimary: v("--accent", isDark ? "#ffcf33" : "#c08a00"),
        // The app's own .btn convention pairs the gold/yellow accent with
        // near-black text (styles.css), not white — Stripe's own default
        // guess would likely pick white, which is barely readable against
        // the dark theme's bright #ffcf33. Match the real convention
        // instead of trusting a default here.
        colorPrimaryText: "#0a0a0a",
        colorBackground: v("--surface", isDark ? "#16181b" : "#f7f6f2"),
        colorText: v("--text", isDark ? "#ece9e1" : "#191a1c"),
        colorDanger: v("--danger", isDark ? "#f87171" : "#b91c1c"),
        fontFamily: v(
          "--font-sans",
          "Inter, -apple-system, BlinkMacSystemFont, sans-serif",
        ),
        borderRadius: "12px",
        spacingUnit: "4px",
      },
    },
    // Best-effort: the Appearance API's fontFamily only names a font, it
    // doesn't load one — Stripe's Elements render in their own isolated
    // context and won't inherit index.html's Google Fonts <link>. Pointing
    // it at the same Inter weights the rest of the app uses means the
    // payment form actually renders in Inter rather than falling back to a
    // generic system sans if this key isn't honored, worst case is
    // silently ignored, not a functional break.
    fonts: [
      {
        cssSrc:
          "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  };
}

// Holds the mounted Elements group + Payment Element between
// startStripeCheckout() (creates + mounts them) and submitStripePayment()
// (reads them back on click) — module-scope state, same pattern as
// window.stripeInstance below.
let stripeElementsGroup = null;

// Mobile-only collapse/expand for the order-recap card rendered by
// renderCheckout() — desktop forces it open via CSS (styles.css, the
// checkout view's own >=860px breakpoint) and hides the chevron, so this
// only ever fires from a real tap on narrower viewports.
function toggleCheckoutSummary() {
  const el = document.getElementById("checkout-summary");
  if (!el) return;
  const expanded = el.classList.toggle("expanded");
  const btn = el.querySelector(".checkout-summary-toggle");
  if (btn) btn.setAttribute("aria-expanded", expanded ? "true" : "false");
}

// Starts a real Stripe payment against a PaymentIntent — auto-triggered by
// afterRenderCheckout() the instant the payment screen renders, so
// "Continue to Payment" reads as one action, not two. Ticket rows are
// created ONLY by stripe-webhook once Stripe confirms payment — this
// function never writes to the tickets table itself. finalizeStripePayment()
// (below) picks the tickets up once payment actually succeeds, whether
// that happens inline (most cards — no redirect at all) or after the
// browser comes back from a redirect-based method (some banks/wallets),
// via checkStripeCheckoutReturn() at boot.
async function startStripeCheckout() {
  const ev = EVENTS.find((e) => e.id === bookingDraft.eventId);
  if (!ev) return;
  const status = document.getElementById("checkout-status");
  const setStatus = (html) => {
    if (status) {
      status.style.display = "flex";
      status.innerHTML = html;
    }
  };

  try {
    const res = await createCheckoutSession(
      ev.id,
      bookingDraft.qty,
      bookingDraft.marketingOptIn,
    );
    if (!res || res.error || !res.clientSecret) {
      throw new Error(res?.error || "Could not start checkout");
    }

    if (!window.stripeInstance) {
      window.stripeInstance = Stripe(window.CUMULUS_CONFIG.STRIPE_PUBLISHABLE_KEY);
    }
    const { appearance, fonts } = stripeAppearanceForCurrentTheme();
    stripeElementsGroup = window.stripeInstance.elements({
      clientSecret: res.clientSecret,
      appearance,
      fonts,
    });
    // Passing the already-known email as a default (rather than via a
    // separate Link Authentication Element the buyer would have to fill in
    // again) lets Stripe Link still recognize a returning buyer and offer
    // one-tap autofill — without it, Link has no email to match against and
    // silently degrades to a plain card form for repeat buyers.
    const paymentElement = stripeElementsGroup.create("payment", {
      defaultValues: state.profileEmail
        ? { billingDetails: { email: state.profileEmail } }
        : undefined,
    });
    paymentElement.mount("#payment-element");
    paymentElement.on("ready", () => {
      if (status) status.style.display = "none";
      // The Pay button lives inside the floating total+CTA bar now (see
      // renderCheckout()) — reveal the whole bar together, not just the
      // button, so the total appears at the same moment as the form.
      const ctaBar = document.getElementById("checkout-cta-bar");
      if (ctaBar) ctaBar.style.display = "flex";
    });
  } catch (err) {
    setStatus(
      `<div style="text-align:center;width:100%;">
        <div style="color:var(--danger);font-size:13px;margin-bottom:10px;">${escapeHtml(err.message || "Could not start checkout")}</div>
        <button class="btn btn-outline" onclick="startStripeCheckout()">Try again</button>
      </div>`,
    );
  }
}

// Fired by the "Pay £X" button rendered in renderCheckout(). Most card
// payments never leave the page at all — redirect:"if_required" only
// navigates away for payment methods that genuinely need it (some bank
// redirects/wallets), in which case checkStripeCheckoutReturn() (boot)
// picks it back up from the return_url's query params.
async function submitStripePayment() {
  if (!stripeElementsGroup || !window.stripeInstance) return;
  const btn = document.getElementById("pay-btn");
  const status = document.getElementById("checkout-status");
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span style="opacity:.7">Processing…</span>';
  }
  if (status) {
    status.style.display = "none";
    status.innerHTML = "";
  }

  const { error, paymentIntent } = await window.stripeInstance.confirmPayment({
    elements: stripeElementsGroup,
    confirmParams: {
      return_url: `${location.origin}/?checkout=return`,
    },
    redirect: "if_required",
  });

  if (error) {
    if (status) {
      status.style.display = "flex";
      status.innerHTML = `<div style="text-align:center;width:100%;"><div style="color:var(--danger);font-size:13px;">${escapeHtml(error.message || "Payment failed — try again")}</div></div>`;
      // #checkout-status sits above the Payment Element, at the top of the
      // scrollable checkout column — a buyer who scrolled down to reach a
      // tall Payment Element (card + wallets + Link) can tap the fixed Pay
      // bar without this ever entering view. Scroll it into view so the
      // reason for the failure isn't silently missed above the fold.
      status.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.label || "Pay →";
    }
    return;
  }

  // No redirect happened (the common case for cards) — Stripe already
  // confirmed the PaymentIntent synchronously, so finalize right here
  // instead of waiting on a return_url that's never coming.
  if (paymentIntent?.status === "succeeded") {
    await finalizeStripePayment(paymentIntent.id);
  } else {
    // "processing" (rare — some bank debits settle asynchronously) or an
    // unexpected status. stripe-webhook will create the ticket once Stripe
    // actually confirms it; tell the buyer rather than leave them staring
    // at a disabled button.
    showToast(
      "Payment is processing — your ticket will appear in My Tickets shortly.",
      "info",
    );
  }
}

// Shared by submitStripePayment() (inline, no-redirect completion) and
// checkStripeCheckoutReturn() (redirect-based completion) — polls for the
// ticket rows stripe-webhook creates asynchronously once it receives
// payment_intent.succeeded, then shows the confirmation screen.
async function finalizeStripePayment(paymentIntentId) {
  showToast("Confirming your payment…", "info");
  for (let attempt = 0; attempt < 6; attempt++) {
    const rows = await fetchTicketsByPaymentIntent(paymentIntentId);
    if (rows && rows.length > 0) {
      await loadMyTickets();
      bookingDraft.confirmedTickets = rows.map((t) => ({
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
      navStack = [];
      state.view = "confirmed";
      renderNav();
      renderView();
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  showToast(
    "Payment confirmed — your ticket is finishing up. Check My Tickets in a moment.",
    "info",
  );
}

// Boot-time handler for the browser coming back from a redirect-based
// payment method (some bank debits/wallets — most cards never leave the
// page, see submitStripePayment()). Stripe appends its own query params to
// the return_url passed to confirmPayment(): payment_intent,
// payment_intent_client_secret, redirect_status. Mirrors
// checkSquadClaim()'s URL-param pattern (read, strip, act).
async function checkStripeCheckoutReturn() {
  const params = new URLSearchParams(location.search);
  const paymentIntentId = params.get("payment_intent");
  const redirectStatus = params.get("redirect_status");
  if (!paymentIntentId || !redirectStatus) return;
  history.replaceState(null, "", location.pathname);

  if (redirectStatus !== "succeeded") {
    showToast(
      redirectStatus === "processing"
        ? "Payment is processing — your ticket will appear in My Tickets shortly."
        : "Payment was not completed — no charge was made.",
      "info",
    );
    return;
  }
  if (!state.userId) return; // returning signed-out isn't wired up — keep simple for now

  await finalizeStripePayment(paymentIntentId);
}

function afterRenderConfirmed() {
  const tickets = bookingDraft.confirmedTickets || [];
  if (!tickets.length) return;
  const t0 = tickets[0];
  const masterEl = document.getElementById("squad-master-qr");
  if (masterEl && tickets.length > 1 && t0.squadId) {
    masterEl.innerHTML = "";
    try {
      new QRCode(masterEl, {
        text: `SQUAD:${t0.squadId}`,
        width: 134,
        height: 134,
        colorDark: "#000",
        colorLight: "#fff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      masterEl.innerHTML = `<div style="font-size:10px;word-break:break-all;color:#333;">SQUAD:${t0.squadId}</div>`;
    }
  }
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

