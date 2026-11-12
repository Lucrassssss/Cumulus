// Account — one page, Dice/Eventbrite style: who you are up top (photo,
// name, member since, the numbers that matter), then your details — shown
// read-only and changed all at once behind an Edit button, so a stray tap
// can never alter an email address — then plans, privacy, emails, past
// events, hosts you follow, hosting (verified hosts only), help, sign out
// and delete. Tickets have their own tab; admin tools their own tab.
function renderAccount() {
  const editing = !!state.acEditing;
  // While editing, keep anything typed if the page redraws underneath you
  // (background data loads) — unsaved typing should never vanish.
  const draftOf = (id, fallback) => {
    const el = editing && document.getElementById(id);
    return el ? el.value : fallback || "";
  };
  const dName = draftOf("account-details-name", state.profileName);
  const dEmail = draftOf("account-details-email", state.profileEmail);
  const dPhone = draftOf("account-details-phone", state.profilePhone);
  const ic = (d) => `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const ticketEvents = myTickets.map((t) => EVENTS.find((e) => e.id === t.eventId)).filter(Boolean);
  const upcoming = ticketEvents.filter((ev) => eventStatus(ev) !== "past").length;
  const pastEvents = [...new Map(ticketEvents.filter((ev) => eventStatus(ev) === "past").map((ev) => [ev.id, ev])).values()].sort(
    (a, b) => b.startsAt - a.startsAt,
  );
  const saved = savedUpcoming().length;
  const following = state.followedHostIds || [];
  const showHosting = isApprovedHost() || canAccessScanner();
  const stat = (n, label, action) =>
    `<button type="button" class="ac-stat"${action ? ` onclick="${action}"` : " disabled"}><b>${n}</b><span>${label}</span></button>`;
  const row = (action, icon, title, sub, extra) =>
    `<button type="button" class="ac-row" onclick="${action}"><span class="set-ic">${icon}</span><span class="set-txt"><b>${title}</b>${sub ? `<span>${sub}</span>` : ""}</span>${extra || '<span class="ac-chev" aria-hidden="true">›</span>'}</button>`;
  const sw = (col, stateKey, title, sub) => {
    const on = state[stateKey] !== false;
    return `<button type="button" role="switch" class="set-opt set-switch${on ? " on" : ""}" data-pref="${col}" aria-checked="${on}" onclick="toggleUserPref('${col}','${stateKey}',this)">
        <span class="set-txt"><b>${title}</b><span>${sub}</span></span>
        <span class="set-toggle" aria-hidden="true"><i></i></span>
      </button>`;
  };
  const hostName = (id) => {
    const ev = EVENTS.find((e) => e.hostId === id);
    return ev ? ev.host : "";
  };
  const q = (v) => escapeHtml(String(v)).replace(/'/g, "&#39;");
  const followedRows = following
    .map((id) => [id, hostName(id)])
    .filter(([, n]) => n)
    .map(
      ([id, n]) => `<button type="button" class="ac-host" onclick="openHostProfile('${q(id)}','${q(n)}')">
        <span class="ac-host-av" aria-hidden="true">${escapeHtml(initials(n))}</span>
        <span class="ac-host-name">${escapeHtml(n)}</span>
        ${(state.notifyHostIds || []).includes(id) ? '<span class="ac-host-bell" title="Notifications on" aria-label="Notifications on"><svg class="ui-ic" viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 16V11a6 6 0 1 1 12 0v5l1.5 2h-15L6 16Z"/><path d="M10 20a2 2 0 0 0 4 0"/></svg></span>' : ""}
      </button>`,
    )
    .join("");
  const since = state.memberSince ? new Date(state.memberSince) : null;
  const sinceLabel = since && !isNaN(since) ? since.toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "";
  const field = (label, value, empty) =>
    `<div class="ac-field ro"><span>${label}</span><div class="ac-val${value ? "" : " empty"}">${value ? escapeHtml(value) : empty}</div></div>`;

  return `<div class="v-page ac-page">
    <header class="ac-hero">
      <input id="account-avatar-input" type="file" accept="image/*" style="display:none;" onchange="handleAccountAvatarChange(this)"/>
      <button type="button" class="ac-avatar" onclick="document.getElementById('account-avatar-input').click()" aria-label="${state.profileAvatarUrl ? "Change" : "Add"} profile photo">
        ${accountAvatarHtml(88)}
        <span class="ac-avatar-cam" aria-hidden="true">${ic('<path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/>')}</span>
      </button>
      <div class="ac-id">
        <div class="v-kicker">Account</div>
        <h1 class="ac-name">${escapeHtml(state.profileName || "You")}</h1>
        <div class="ac-email">${escapeHtml(state.profileEmail || "")}</div>
        ${sinceLabel ? `<div class="ac-since">Member since ${sinceLabel}</div>` : ""}
      </div>
      <div class="ac-stats">
        ${stat(upcoming, "Upcoming", "navStack=[];openTicketsTab()")}
        ${stat(saved, "Saved", saved ? "goFeed();setFeedRange('saved')" : "")}
        ${stat(following.length, "Following", following.length ? "document.getElementById('ac-following').scrollIntoView({behavior:'smooth',block:'start'})" : "")}
        ${stat(pastEvents.length, "Been to", pastEvents.length ? "document.getElementById('ac-past').scrollIntoView({behavior:'smooth',block:'start'})" : "")}
      </div>
    </header>

    <section class="ac-card${editing ? " editing" : ""}" id="ac-details" aria-labelledby="ac-details-h">
      <div class="ac-card-head"><h2 id="ac-details-h">Your details</h2>${
        editing ? `<span>Editing</span>` : `<button type="button" class="ac-edit" onclick="acStartEdit()" aria-label="Edit your details">${ic('<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>')}Edit</button>`
      }</div>
      ${
        editing
          ? `<label class="ac-field"><span>Name</span>
        <input id="account-details-name" value="${escapeHtml(dName)}" autocomplete="name" onkeydown="acKey(event)"/>
      </label>
      <label class="ac-field"><span>Email</span>
        <input id="account-details-email" type="email" value="${escapeHtml(dEmail)}" autocomplete="email" inputmode="email" onkeydown="acKey(event)"/>
      </label>
      <label class="ac-field"><span>Phone <em>optional</em></span>
        <input id="account-details-phone" type="tel" value="${escapeHtml(dPhone)}" autocomplete="tel" inputmode="tel" placeholder="For door issues on the night" onkeydown="acKey(event)"/>
      </label>
      <div id="account-details-error" class="ac-err" role="alert" style="${state._acErr ? "" : "display:none;"}">${escapeHtml(state._acErr || "")}</div>
      <div class="ac-save show" id="ac-save">
        <button type="button" class="v-btn ghost sm" onclick="acCancel()">Cancel</button>
        <button type="button" class="v-btn sm" onclick="saveAccountDetailsForm()">Save changes</button>
      </div>`
          : field("Name", state.profileName, "Not added") +
            field("Email", state.profileEmail, "Not added") +
            field("Phone", state.profilePhone, "Not added — handy if there's a problem at the door")
      }
    </section>

    <section class="ac-card" aria-labelledby="ac-plans-h">
      <div class="ac-card-head"><h2 id="ac-plans-h">Your plans</h2>${upcoming ? `<span>${upcoming} coming up</span>` : ""}</div>
      <p class="ac-empty">Send friends one link to everything you're going to — they can grab tickets and come too. Only people with the link can see it.</p>
      <div class="ac-plan-acts">
        <button type="button" class="v-btn sm" onclick="sharePlans()">${ic('<path d="M12 3v13M7 8l5-5 5 5"/><path d="M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6"/>')}Share my plans</button>
        ${state.plansToken ? `<button type="button" class="v-btn ghost sm" onclick="sharePlans(true)">Reset link</button>` : ""}
      </div>
    </section>

    <section class="ac-card" aria-labelledby="ac-prefs-h">
      <div class="ac-card-head"><h2 id="ac-prefs-h">Privacy</h2></div>
      ${privacyMenuHtml().replace('<div class="set-group-title">Privacy</div>', "")}
    </section>

    <section class="ac-card" aria-labelledby="ac-mail-h">
      <div class="ac-card-head"><h2 id="ac-mail-h">Emails</h2></div>
      <div class="set-list">
        ${sw("email_reminders", "emailReminders", "Reminder the day before", "Time, venue and your ticket, 24 hours out")}
        ${sw("email_followed", "emailFollowed", "New events from hosts I follow", "Only hosts where you've turned notifications on")}
      </div>
    </section>

    <section class="ac-card" id="ac-past" aria-labelledby="ac-past-h">
      <div class="ac-card-head"><h2 id="ac-past-h">Been to</h2><span>${pastEvents.length || ""}</span></div>
      ${
        pastEvents.length
          ? `<div class="ac-past">${pastEvents
              .slice(0, 6)
              .map(
                (ev) => `<div class="ac-past-row">
            <button type="button" class="ac-past-main" onclick="openEvent('${q(ev.id)}')">
              <span class="ac-past-art ${posterClass(ev)}" style="${posterStyle(ev)}" aria-hidden="true">${posterGlyph(ev)}</span>
              <span class="set-txt"><b>${escapeHtml(ev.title)}</b><span>${new Date(ev.startsAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · ${escapeHtml(ev.host || "")}</span></span>
            </button>
            ${ev.host ? `<button type="button" class="ac-again" onclick="openHostProfile('${q(ev.hostId || ev.host)}','${q(ev.host)}')">Go again</button>` : ""}
          </div>`,
              )
              .join("")}</div>`
          : `<p class="ac-empty">Events you've been to show up here — handy for finding that host again.</p>`
      }
    </section>

    <section class="ac-card" id="ac-following" aria-labelledby="ac-follow-h">
      <div class="ac-card-head"><h2 id="ac-follow-h">Following</h2><span>${following.length || ""}</span></div>
      ${
        followedRows
          ? `<div class="ac-hosts">${followedRows}</div>`
          : `<p class="ac-empty">Follow hosts from their page and their new events show up first on Discover.</p>`
      }
    </section>

    ${
      showHosting
        ? `<section class="ac-card" aria-labelledby="ac-host-h">
      <div class="ac-card-head"><h2 id="ac-host-h">Hosting</h2></div>
      ${
        isApprovedHost()
          ? row("navStack=[];openHost()", ic('<path d="M12 5v14M5 12h14"/>'), "Host an event", "Create, edit and track your events") +
            `<div class="ac-banner">
              <input id="account-cover-input" type="file" accept="image/*" style="display:none;" onchange="handleAccountCoverChange(this)"/>
              <div class="ac-banner-lbl"><b>Host page banner</b><span>Shown at the top of your public page</span></div>
              ${accountCoverHtml()}
            </div>`
          : ""
      }
      ${canAccessScanner() ? row("openScannerPicker()", ic('<path d="M4 7V5a1 1 0 0 1 1-1h2M17 4h2a1 1 0 0 1 1 1v2M20 17v2a1 1 0 0 1-1 1h-2M7 20H5a1 1 0 0 1-1-1v-2M7 12h10"/>'), "Scan tickets", "Check guests in at the door") : ""}
    </section>`
        : ""
    }

    <section class="ac-card" aria-labelledby="ac-help-h">
      <div class="ac-card-head"><h2 id="ac-help-h">Help</h2></div>
      ${row("window.location.href='mailto:hello@cumulusapp.co'", ic('<circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14M12 17h.01"/>'), "Help &amp; support", "We reply within a day", '<span class="ac-chev" aria-hidden="true">↗</span>')}
      ${row("window.location.href='privacy.html'", ic('<path d="M12 3 4 6v6c0 4.5 3.4 8 8 9 4.6-1 8-4.5 8-9V6l-8-3Z"/>'), "Privacy policy", "")}
      ${row("window.location.href='terms.html'", ic('<path d="M7 3h7l5 5v13H7Z"/><path d="M14 3v5h5"/>'), "Terms", "")}
    </section>

    <button type="button" class="ac-signout" onclick="signOut()">Sign out</button>
    <button type="button" class="ac-delete" onclick="openDeleteAccountSheet()">Delete my account</button>
  </div>`;
}

// ── Details: locked until Edit ────────────────────────────────────────────
function acStartEdit() {
  state.acEditing = true;
  state._acErr = "";
  renderView();
  const el = document.getElementById("account-details-name");
  if (el) {
    el.focus();
    el.setSelectionRange(el.value.length, el.value.length);
  }
}
function acCancel() {
  state.acEditing = false;
  state._acErr = "";
  renderView();
}
function acKey(e) {
  if (e.key === "Enter") saveAccountDetailsForm();
  else if (e.key === "Escape") acCancel();
}

// ── Email / privacy switches ──────────────────────────────────────────────
async function toggleUserPref(column, stateKey, btn) {
  const next = state[stateKey] === false;
  // Flip immediately; roll back if the save fails.
  const paint = (on) => {
    if (!btn) return;
    btn.classList.toggle("on", on);
    btn.setAttribute("aria-checked", on ? "true" : "false");
  };
  paint(next);
  const ok = await saveUserPref(column, next);
  if (!ok) {
    paint(!next);
    return showToast("Couldn't save that — try again", "error");
  }
  state[stateKey] = next;
  showToast(next ? "Turned on" : "Turned off", "info");
}

// ── Share my plans ────────────────────────────────────────────────────────
async function sharePlans(reset) {
  if (reset && !confirm("Reset your plans link? The old link will stop working.")) return;
  const tok = await getPlansToken(!!reset);
  if (!tok) return showToast("Couldn't make your link — try again", "error");
  const fresh = !state.plansToken;
  state.plansToken = tok;
  const url = `${location.origin}${location.pathname}?plans=${tok}`;
  if (reset) {
    showToast("New link made — the old one no longer works", "success");
  } else if (navigator.share) {
    navigator.share({ title: "My plans on Cumulus", text: "Here's what I'm going to — come along:", url }).catch(() => {});
  } else if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(
      () => showToast("Link copied — send it to your friends", "success"),
      () => showToast("Couldn't copy — try again"),
    );
  }
  if (fresh || reset) renderView();
}

// ── Delete my account ─────────────────────────────────────────────────────
// Type-to-confirm, like GitHub / Dice: one tap can't erase an account.
function openDeleteAccountSheet() {
  closeLocationSheet(true);
  const el = document.createElement("div");
  el.id = "loc-sheet";
  el.className = "loc-overlay";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Delete your account");
  el.innerHTML = `<div class="loc-sheet">
      <div class="loc-head">
        <div><b>Delete your account?</b><span>This can't be undone.</span></div>
        <button class="loc-x" onclick="closeLocationSheet()" aria-label="Close">✕</button>
      </div>
      <ul class="del-list">
        <li>Your profile, saved events, follows and settings are erased.</li>
        <li>Past ticket records stay with the host, with your name removed.</li>
        <li>Got tickets coming up? Cancel or transfer them first.</li>
      </ul>
      <label class="del-confirm"><span>Type <b>DELETE</b> to confirm</span>
        <input id="del-input" autocomplete="off" autocapitalize="characters" oninput="document.getElementById('del-go').disabled=this.value.trim().toUpperCase()!=='DELETE'"/>
      </label>
      <div id="del-err" class="ac-err" role="alert" style="display:none;"></div>
      <button id="del-go" class="v-btn wide del-go" disabled onclick="confirmDeleteAccount()">Delete my account</button>
    </div>`;
  el.addEventListener("click", (e) => {
    if (e.target === el) closeLocationSheet();
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  document.addEventListener("keydown", _locEsc);
  setTimeout(() => document.getElementById("del-input")?.focus(), 250);
}
async function confirmDeleteAccount() {
  const btn = document.getElementById("del-go");
  const err = document.getElementById("del-err");
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Deleting…";
  }
  const res = await deleteMyAccount();
  if (!res || res.ok !== true) {
    if (err) {
      err.textContent =
        res?.reason === "host"
          ? "Hosts close their account through support so payout records are kept — email hello@cumulusapp.co."
          : res?.error || "Couldn't delete your account — try again";
      err.style.display = "block";
    }
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Delete my account";
    }
    return;
  }
  closeLocationSheet(true);
  showToast("Your account has been deleted", "success");
  signOut(true);
}

// Shared avatar — a real photo (state.profileAvatarUrl) once uploaded, a
// plain initials monogram until then. Used in the Account header, the
// Account details page, and the nav-adjacent contexts that want a small
// identity marker.
function accountAvatarHtml(size) {
  const s = size || 40;
  if (state.profileAvatarUrl) {
    return `<div class="account-avatar" style="width:${s}px;height:${s}px;"><img src="${state.profileAvatarUrl}" alt="" width="${s}" height="${s}"/></div>`;
  }
  return `<div class="account-avatar account-avatar-mono" style="width:${s}px;height:${s}px;font-size:${Math.round(s * 0.38)}px;">${initials(state.profileName)}</div>`;
}

// ── Account details — its own full page (industry-standard "edit your
// profile" pattern: name/email/phone/photo, one page, one Save), replacing
// the old inline-swap row that used to live directly in the Settings list.
// Details are edited inline on Account now; old entry points land there
// with the name field focused.
function openAccountDetails() {
  if (state.view !== "account") openAccount();
  if (state.view !== "account") return; // guest → sign-in prompt instead
  acStartEdit();
  document.getElementById("ac-details")?.scrollIntoView({ behavior: "smooth", block: "center" });
}

// Banner shown on a host's own public profile page — a real uploaded
// photo once set, the same textured gold gradient as a fallback otherwise
// (matches .host-profile-cover exactly, so setting/clearing a banner never
// jumps the layout). Only shown here at all for approved hosts: a banner
// is meaningless for an account with no public host page to show it on.
function accountCoverHtml() {
  if (state.profileCoverUrl) {
    return `<div class="account-cover-edit-zone" onclick="document.getElementById('account-cover-input').click()" role="button" tabindex="0" aria-label="Change host banner" style="background-image:url('${state.profileCoverUrl}');">
      <span class="account-avatar-edit-badge account-cover-edit-badge" aria-hidden="true"><svg class="ui-ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg></span>
    </div>`;
  }
  return `<div class="account-cover-edit-zone account-cover-edit-empty" onclick="document.getElementById('account-cover-input').click()" role="button" tabindex="0" aria-label="Add a host banner">
    <span class="account-avatar-edit-badge account-cover-edit-badge" aria-hidden="true"><svg class="ui-ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg></span>
  </div>`;
}

function renderAccountDetails() {
  const showCover = isApprovedHost();
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>Account details</h2><p>Your name, contact info &amp; photo</p></div>

    ${
      showCover
        ? `<div class="section-title">Host banner</div>
    <input id="account-cover-input" type="file" accept="image/*" style="display:none;" onchange="handleAccountCoverChange(this)"/>
    ${accountCoverHtml()}
    <p class="account-cover-hint">Shown at the top of your public host page. Checked automatically — nothing unsuitable gets published.</p>`
        : ""
    }

    <div class="account-avatar-edit">
      <input id="account-avatar-input" type="file" accept="image/*" style="display:none;" onchange="handleAccountAvatarChange(this)"/>
      <div class="account-avatar-edit-zone" onclick="document.getElementById('account-avatar-input').click()" role="button" tabindex="0" aria-label="Change profile photo">
        ${accountAvatarHtml(84)}
        <span class="account-avatar-edit-badge" aria-hidden="true"><svg class="ui-ic" viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4Z"/><circle cx="12" cy="13" r="3.5"/></svg></span>
      </div>
      <button class="btn-text" style="font-size:12.5px;" onclick="document.getElementById('account-avatar-input').click()">${state.profileAvatarUrl ? "Change photo" : "Add a photo"}</button>
    </div>

    <div class="gate-field">
      <label class="gate-label" for="account-details-name">Name</label>
      <input id="account-details-name" class="gate-input" value="${escapeHtml(state.profileName)}" autocomplete="name"/>
    </div>
    <div class="gate-field">
      <label class="gate-label" for="account-details-email">Email</label>
      <input id="account-details-email" class="gate-input" type="email" value="${escapeHtml(state.profileEmail)}" autocomplete="email"/>
    </div>
    <div class="gate-field">
      <label class="gate-label" for="account-details-phone">Phone number <span class="gate-label-optional">(optional)</span></label>
      <input id="account-details-phone" class="gate-input" type="tel" value="${escapeHtml(state.profilePhone || "")}" autocomplete="tel" placeholder="+44 7700 900000"/>
    </div>
    <div id="account-details-error" style="display:none;color:var(--danger,#dc2626);font-size:12px;margin-bottom:8px;"></div>
    <button class="btn" style="width:100%;" onclick="saveAccountDetailsForm()">Save changes</button>`;
}

// Both handlers below route through services.js's direct-upload path
// (uploadAvatarPhoto/uploadCoverPhoto — straight to the caller's own
// storage folder, no moderation gate; see the migration that reverted the
// earlier Google Cloud Vision SafeSearch detour in favour of the
// event_reports community-report system).
async function handleAccountAvatarChange(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  showToast("Checking photo…");
  const { url, error } = await uploadAvatarPhoto(file);
  input.value = "";
  if (!url) {
    showToast(error || "Couldn't upload that photo — try again", "error");
    return;
  }
  state.profileAvatarUrl = url;
  try {
    await persistProfile();
  } catch (e) {}
  showToast("Photo updated", "success");
  renderView();
}

async function handleAccountCoverChange(input) {
  const file = input.files && input.files[0];
  if (!file) return;
  showToast("Checking photo…");
  const { url, error } = await uploadCoverPhoto(file);
  input.value = "";
  if (!url) {
    showToast(error || "Couldn't upload that photo — try again", "error");
    return;
  }
  state.profileCoverUrl = url;
  try {
    await persistProfile();
  } catch (e) {}
  showToast("Banner updated", "success");
  renderView();
}

// Real edit, unlike the old editProfile() this page replaces — that one
// just flipped state.editingProfile with no form ever consuming it, so the
// button silently did nothing. persistProfile() already knows how to
// upsert name/email/phone/avatar; this just points it at the edited values.
async function saveAccountDetailsForm() {
  const nameEl = document.getElementById("account-details-name");
  const emailEl = document.getElementById("account-details-email");
  const phoneEl = document.getElementById("account-details-phone");
  const errEl = document.getElementById("account-details-error");
  const name = (nameEl?.value || "").trim();
  const email = (emailEl?.value || "").trim();
  const phone = (phoneEl?.value || "").trim();
  const showErr = (msg) => {
    state._acErr = msg;
    if (errEl) {
      errEl.textContent = msg;
      errEl.style.display = "block";
    }
  };
  if (!name) return showErr("Name can't be empty.");
  if (!EMAIL_PATTERN.test(email)) return showErr("Enter a valid email.");
  if (phone && !PHONE_PATTERN.test(phone))
    return showErr("Enter a valid phone number, or leave it blank.");

  state._acErr = "";
  state.acEditing = false;
  state.profileName = name;
  state.profileEmail = email;
  state.profilePhone = phone;
  try {
    await persistProfile();
    showToast("Account updated", "success");
  } catch (e) {
    showToast("Couldn't reach the server — try again", "error");
  }
  // Inline on Account now: stay put and repaint (header name, menu, etc.).
  // The old standalone details page (hosts' banner editor) still goes back.
  if (state.view === "account-details") goBack();
  else renderView();
}

// Compact real-event preview card reused wherever a screen needs to show
// live events instead of empty space (Calendar agenda, Social teaser).
// Small urgency pill shown on card-style event rows when few spaces remain
// (<=15% of capacity) — reuses the exact spacesLeft calc from renderDetail().
function almostFullBadgeHtml(ev) {
  if (!ev.capacity) return "";
  const going = goingCount(ev.id);
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
  const ended = status === "past";
  return `<div class="panel event-list-card${ended ? " event-list-card-ended" : ""}" style="--corner:${c.color};" onclick="openEvent('${ev.id}')" role="button" tabindex="0" aria-label="Open ${escapeHtml(ev.title)}${ended ? ", event ended" : ""}">
    <div class="elc-img ${posterClass(ev)}" style="${posterStyle(ev)}">${posterGlyph(ev)}</div>
    <div class="elc-body">
      <div class="elc-top-row">
        <span class="event-badge" style="--cat:${c.color};--cat-text:${c.textColor};margin-bottom:0;">${ev.category}</span>
        ${status === "live" ? `<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live</span>` : ""}
        ${ended ? `<span class="event-badge" style="background:var(--surface-2);color:var(--text-muted) !important;border:1px solid var(--line);margin-bottom:0;">Event ended</span>` : ""}
        ${almostFullBadgeHtml(ev)}
      </div>
      <div class="elc-title">${escapeHtml(ev.title)}</div>
      <div class="elc-meta">${ELC_LOCATION_ICON}<span>${escapeHtml(ev.venue || "")}${ev.area ? `, ${escapeHtml(ev.area)}` : ""}</span></div>
      <div class="elc-meta">${escapeHtml(ev.date)} · ${escapeHtml(ev.time)}</div>
      <div class="elc-foot">
        ${ev.host ? `<span class="elc-host">Hosted by ${escapeHtml(ev.host)}</span>` : `<span></span>`}
        <span class="elc-price">${price ? feedPriceLabel(ev) : "Free"}</span>
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
// All-in price: ticket + the mandatory Cumulus booking fee. UK law (DMCC
// Act 2024, drip-pricing ban, in force Apr 2025) requires compulsory fees
// in the headline price — and it's what Dice does: one price, no surprises
// at checkout. Use this anywhere a price is shown before checkout.
function eventAllInPrice(ev) {
  const p = Number(eventPrice(ev)) || 0;
  return p ? p + getCumulusFee(p) : 0;
}
function fmtGBP(n) {
  return `£${Number(n) % 1 ? Number(n).toFixed(2) : Number(n)}`;
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
      platformFee: Number(t.platform_fee || 0),
      receiptSentAt: t.receipt_sent_at || null,
      claimedBy: t.claimed_by || null,
      claimedAt: t.claimed_at ? new Date(t.claimed_at).getTime() : null,
    }));
  if (data) {
    try {
      localStorage.setItem(`cumulus_tix_${state.userId}`, JSON.stringify(myTickets));
    } catch (e) {}
  }
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
  // Browsing is guest-friendly, but booking needs a real account (tickets
  // are tied to a user_id, and RLS requires auth.uid() to insert one) — a
  // guest tapping "Book Now" gets the sign-up prompt right here rather than
  // an insert that would silently fail RLS a few steps later.
  if (!state.userId) {
    showToast("Sign in to book a ticket", "info");
    showLpSignup();
    return;
  }
  pushNav();
  bookingDraft = { eventId: id, qty: 1, confirmedTicket: null };
  const ev = EVENTS.find((e) => e.id === id);
  bookingDraft.type = ev ? ticketTypes(ev)[0].id : "general";
  state.view = "book";
  renderNav();
  renderView();
  window.scrollTo(0, 0);
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
  const optEl = document.getElementById("book-marketing-optin");
  if (optEl) bookingDraft.marketingOptIn = !!optEl.checked;
  const promoEl = document.getElementById("book-promo-code");
  if (promoEl) bookingDraft.promoCode = (promoEl.value || "").trim();
  state.view = "checkout";
  renderNav();
  renderView();
  window.scrollTo(0, 0);
}
function openViewTicket(evId) {
  pushNav();
  const eventTickets = myTickets.filter((t) => t.eventId === evId);
  if (!eventTickets.length) {
    openBook(evId);
    return;
  }
  bookingDraft.confirmedTickets = eventTickets;
  bookingDraft.justPurchased = false;
  state.view = "confirmed";
  renderNav();
  renderView();
  window.scrollTo(0, 0);
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
  showConfirmedAfterPurchase();
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
// Apple Pay / Google Pay as one-tap buttons at the top of the pay screen —
// the fastest way through (Dice's default). Only shown when the device has
// one set up; confirms the same PaymentIntent, same outcomes as the card form.
function _mountExpressCheckout() {
  const wrap = document.getElementById("express-wrap");
  if (!wrap || !stripeElementsGroup) return;
  let ece;
  try {
    ece = stripeElementsGroup.create("expressCheckout", {
      buttonHeight: 50,
      buttonType: { applePay: "buy", googlePay: "buy" },
      buttonTheme: { applePay: document.documentElement.dataset.theme === "dark" ? "white" : "black", googlePay: document.documentElement.dataset.theme === "dark" ? "white" : "black" },
      paymentMethods: { applePay: "auto", googlePay: "auto", link: "never", paypal: "never", amazonPay: "never", klarna: "never" },
      layout: { maxColumns: 2, maxRows: 1, overflow: "never" },
    });
  } catch (e) {
    return;
  }
  ece.on("ready", ({ availablePaymentMethods }) => {
    if (availablePaymentMethods && Object.values(availablePaymentMethods).some(Boolean)) wrap.hidden = false;
  });
  ece.on("confirm", async () => {
    try {
      sessionStorage.setItem(
        PENDING_PAY_KEY,
        JSON.stringify({ eventId: bookingDraft.eventId, type: bookingDraft.type, qty: bookingDraft.qty, promoCode: bookingDraft.promoCode || "" }),
      );
    } catch (e) {}
    showPayOverlay("Talking to your bank…");
    const { error, paymentIntent } = await window.stripeInstance.confirmPayment({
      elements: stripeElementsGroup,
      confirmParams: { return_url: `${location.origin}${location.pathname}?checkout=return` },
      redirect: "if_required",
    });
    await _handlePayOutcome(error, paymentIntent, () => {});
  });
  try {
    ece.mount("#express-checkout");
  } catch (e) {}
}
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
      bookingDraft.promoCode,
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
    // again) just prefills the card form's billing email now — Link itself
    // is deliberately excluded from create-checkout-session's payment_method_
    // types allow-list (card + PayPal only, per product decision), so this
    // no longer triggers Link's own one-tap recognition, only the plain
    // autofill.
    const paymentElement = stripeElementsGroup.create("payment", {
      // Accordion, collapsed: the screen opens as compact "Card" / "PayPal"
      // rows and the card fields — with Stripe's optional "save my info"
      // section — only open when tapped. Keeps Pay and the order on one
      // screen. (That save section lives inside Stripe's iframe, so this is
      // the only way to fold it away without switching Link off.)
      layout: { type: "accordion", defaultCollapsed: true, radios: true, spacedAccordionItems: false },
      // Apple/Google Pay get their own one-tap buttons above (Express
      // Checkout) — don't repeat them inside the card form.
      wallets: { applePay: "never", googlePay: "never" },
      // Stripe's card-mandate paragraph — our own "By paying you agree to
      // the Terms" line under the form covers it, and it costs a screenful.
      terms: { card: "never" },
      defaultValues: state.profileEmail
        ? { billingDetails: { email: state.profileEmail } }
        : undefined,
    });
    _mountExpressCheckout();
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
    const raw = String(err && err.message ? err.message : "");
    // Sold out / promo / capacity messages from the server are useful as-is;
    // network-ish failures get plain words instead of "unavailable".
    const msg = /unavailable|fetch|network|load|stripe is not defined|failed to/i.test(raw) || !raw
      ? "We couldn't load the secure payment form. Check your connection and try again — you haven't been charged."
      : raw;
    setStatus(
      `<div class="bk-load-err" role="alert">
        <b>Payment form didn't load</b>
        <span>${escapeHtml(msg)}</span>
        <button class="v-btn sm" onclick="startStripeCheckout()">Try again</button>
      </div>`,
    );
  }
}

// Fired by the "Pay £X" button. The whole payment plays out on this
// screen in the pay overlay (processing → You're in / didn't go through /
// still confirming) — never a toast, never a jump to another page. Most
// cards never leave the page (redirect:"if_required"); PayPal and some
// banks do, and checkStripeCheckoutReturn() brings them back into the same
// overlay with the same outcomes.
const PENDING_PAY_KEY = "cumulus_pending_pay";
async function submitStripePayment() {
  if (!stripeElementsGroup || !window.stripeInstance) return;
  const btn = document.getElementById("pay-btn");
  const status = document.getElementById("checkout-status");
  if (btn) {
    btn.disabled = true;
    // The padlock clicks shut — then the ticket starts printing.
    btn.innerHTML =
      '<svg class="bk-lockanim" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path class="shk" d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>Securing…';
  }
  if (status) {
    status.style.display = "none";
    status.innerHTML = "";
  }
  await new Promise((r) => setTimeout(r, 320));
  showPayOverlay("Talking to your bank…");
  // Remember what was being bought, in case the payment method redirects.
  try {
    sessionStorage.setItem(
      PENDING_PAY_KEY,
      JSON.stringify({ eventId: bookingDraft.eventId, type: bookingDraft.type, qty: bookingDraft.qty, promoCode: bookingDraft.promoCode || "" }),
    );
  } catch (e) {}

  const { error, paymentIntent } = await window.stripeInstance.confirmPayment({
    elements: stripeElementsGroup,
    confirmParams: {
      return_url: `${location.origin}${location.pathname}?checkout=return`,
    },
    redirect: "if_required",
  });
  const resetBtn = () => {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = btn.dataset.label || "Pay";
    }
  };
  await _handlePayOutcome(error, paymentIntent, resetBtn);
}
// One set of on-screen outcomes for every way of paying (card form, Apple
// Pay, Google Pay, redirect methods).
async function _handlePayOutcome(error, paymentIntent, resetBtn) {
  if (error) {
    resetBtn();
    // Card declined / validation: say it plainly, right here, and let them
    // fix the card details underneath.
    showPayResult("failed", {
      title: "Payment didn't go through",
      body: `${escapeHtml(error.message || "Your bank declined the payment.")} You haven't been charged.`,
      primary: { label: "Try again", onclick: "hidePayOverlay()" },
    });
    return;
  }
  if (paymentIntent?.status === "succeeded") {
    await finalizeStripePayment(paymentIntent.id);
  } else if (paymentIntent?.status === "processing") {
    resetBtn();
    showPayResult("pending", {
      title: "Your bank is still confirming",
      body: "This can take a minute for some banks. Your tickets land in Tickets the moment it clears — we'll email your receipt too.",
      primary: { label: "Go to my tickets", onclick: "hidePayOverlay();clearPendingPay();navStack=[];openTicketsTab()" },
    });
  } else {
    resetBtn();
    showPayResult("failed", {
      title: "Payment wasn't completed",
      body: "Nothing was taken from your account. You can try again with the same or a different card.",
      primary: { label: "Try again", onclick: "hidePayOverlay()" },
    });
  }
}
function clearPendingPay() {
  try {
    sessionStorage.removeItem(PENDING_PAY_KEY);
  } catch (e) {}
}

// Polls for the ticket rows stripe-webhook writes once Stripe confirms the
// payment (usually a second or two), then plays You're in.
async function finalizeStripePayment(paymentIntentId) {
  showPayOverlay("Payment approved — securing your tickets…");
  for (let attempt = 0; attempt < 14; attempt++) {
    const rows = await fetchTicketsByPaymentIntent(paymentIntentId);
    if (rows && rows.length > 0) {
      clearPendingPay();
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
        platformFee: Number(t.platform_fee || 0),
        receiptSentAt: t.receipt_sent_at || null,
        claimedBy: t.claimed_by || null,
        claimedAt: t.claimed_at ? new Date(t.claimed_at).getTime() : null,
      claimedBy: t.claimed_by || null,
      claimedAt: t.claimed_at ? new Date(t.claimed_at).getTime() : null,
      }));
      showConfirmedAfterPurchase();
      return;
    }
    if (attempt === 4) showPayOverlay("Payment approved — writing your tickets…");
    await new Promise((r) => setTimeout(r, 1500));
  }
  // Paid, but the ticket rows are slower than usual. Be explicit: the money
  // went through and the ticket is coming — keep a way to check.
  clearPendingPay();
  showPayResult("pending", {
    title: "Payment received",
    body: "Your tickets are taking a little longer than usual to appear. They'll be in Tickets within a minute, and your receipt will be emailed.",
    primary: { label: "Check again", onclick: `finalizeStripePayment('${String(paymentIntentId).replace(/[^a-zA-Z0-9_]/g, "")}')` },
    secondary: { label: "Go to my tickets", onclick: "hidePayOverlay();navStack=[];openTicketsTab()" },
  });
}

// The browser coming back from a redirect-based payment method (PayPal,
// some bank flows). Re-open the purchase, then show the same on-screen
// outcome as an inline card payment — never the home page plus a toast.
async function checkStripeCheckoutReturn() {
  const params = new URLSearchParams(location.search);
  const paymentIntentId = params.get("payment_intent");
  const redirectStatus = params.get("redirect_status");
  if (!paymentIntentId || !redirectStatus) return;
  history.replaceState(null, "", location.pathname);
  let pending = null;
  try {
    pending = JSON.parse(sessionStorage.getItem(PENDING_PAY_KEY) || "null");
  } catch (e) {}
  const ev = pending && EVENTS.find((e) => e.id === pending.eventId);
  if (ev && state.userId) {
    bookingDraft = { eventId: ev.id, type: pending.type, qty: pending.qty || 1, promoCode: pending.promoCode || "", confirmedTicket: null };
    navStack = [];
    state.view = "book";
    renderNav();
    renderView();
  }

  if (redirectStatus === "succeeded" && state.userId) {
    await finalizeStripePayment(paymentIntentId);
    return;
  }
  if (redirectStatus === "processing") {
    showPayResult("pending", {
      title: "Your bank is still confirming",
      body: "Your tickets land in Tickets the moment it clears — we'll email your receipt too.",
      primary: { label: "Go to my tickets", onclick: "hidePayOverlay();clearPendingPay();navStack=[];openTicketsTab()" },
    });
    return;
  }
  showPayResult("failed", {
    title: "Payment wasn't completed",
    body: "Nothing was taken from your account.",
    primary: ev
      ? { label: "Try again", onclick: "hidePayOverlay();proceedToCheckout()" }
      : { label: "Back to Discover", onclick: "hidePayOverlay();goFeed()" },
  });
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
        width: 176,
        height: 176,
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
        width: 176,
        height: 176,
        colorDark: "#000",
        colorLight: "#fff",
        correctLevel: QRCode.CorrectLevel.M,
      });
    } catch (e) {
      el.innerHTML = `<div style="font-size:10px;word-break:break-all;color:#333;">${t.ticketId}</div>`;
    }
  });
}

// ── Add to calendar ───────────────────────────────────────────────────────
// (The old ICS builder had lost its backslashes — it joined lines with the
// letters "rn" — so every downloaded file was corrupt.)
function _icsDate(d) {
  return new Date(d).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}
function _icsEsc(s) {
  return String(s || "").replace(/\\/g, "\\\\").replace(/[;,]/g, (c) => "\\" + c).replace(/\r?\n/g, "\\n");
}
function _calTimes(ev) {
  const start = new Date(ev.startTime || ev.startsAt);
  let end = new Date(ev.endTime || ev.endsAt || 0);
  if (!(end > start)) end = new Date(start.getTime() + 3 * 3600000);
  return { start, end };
}
function _calWhere(ev) {
  return [ev.venue, ev.address, ev.area].filter(Boolean).join(", ") || "London";
}
function _calLink(ev) {
  return `${location.origin}${location.pathname}?event=${encodeURIComponent(ev.id)}`;
}
function downloadICS(evId) {
  const ev = EVENTS.find((e) => String(e.id) === String(evId));
  if (!ev) return;
  const { start, end } = _calTimes(ev);
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Cumulus//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:cumulus-${ev.id}@cumulus.app`,
    `DTSTAMP:${_icsDate(Date.now())}`,
    `DTSTART:${_icsDate(start)}`,
    `DTEND:${_icsDate(end)}`,
    `SUMMARY:${_icsEsc(ev.title)}`,
    `DESCRIPTION:${_icsEsc(`${ev.desc || ""}\n\nHosted by ${ev.host || "Cumulus"}\nYour ticket: ${_calLink(ev)}`)}`,
    `LOCATION:${_icsEsc(_calWhere(ev))}`,
    `URL:${_calLink(ev)}`,
    "BEGIN:VALARM",
    "TRIGGER:-PT3H",
    "ACTION:DISPLAY",
    `DESCRIPTION:${_icsEsc(ev.title)} starts in 3 hours`,
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = (ev.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "event") + ".ics";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    a.remove();
    URL.revokeObjectURL(url);
  }, 1000);
}
function eventCalendarLinks(ev) {
  const { start, end } = _calTimes(ev);
  const details = `${ev.desc ? ev.desc.slice(0, 600) + "\n\n" : ""}Your ticket: ${_calLink(ev)}`;
  const google =
    "https://calendar.google.com/calendar/render?action=TEMPLATE" +
    `&text=${encodeURIComponent(ev.title)}` +
    `&dates=${_icsDate(start)}/${_icsDate(end)}` +
    `&details=${encodeURIComponent(details)}` +
    `&location=${encodeURIComponent(_calWhere(ev))}`;
  const outlook =
    "https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent" +
    `&subject=${encodeURIComponent(ev.title)}` +
    `&startdt=${encodeURIComponent(start.toISOString())}&enddt=${encodeURIComponent(end.toISOString())}` +
    `&body=${encodeURIComponent(details)}&location=${encodeURIComponent(_calWhere(ev))}`;
  return { google, outlook };
}
// Same bottom-sheet pattern as "Open location" — one tap per calendar app.
function openCalendarSheet(evId) {
  const ev = EVENTS.find((e) => String(e.id) === String(evId));
  if (!ev) return;
  closeLocationSheet(true);
  const L = eventCalendarLinks(ev);
  const apple = isAppleDevice();
  const ic = (d) => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
  const calIc = ic('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>');
  const link = (href, title, sub, primary) =>
    `<a class="loc-opt${primary ? " primary" : ""}" href="${href}" target="_blank" rel="noopener" onclick="setTimeout(closeLocationSheet,150)">
      <span class="loc-ic">${calIc}</span><span class="loc-txt"><b>${title}</b><span>${sub}</span></span><span class="loc-go" aria-hidden="true">↗</span></a>`;
  const icsBtn = (primary) =>
    `<button class="loc-opt${primary ? " primary" : ""}" onclick="downloadICS('${ev.id}');setTimeout(closeLocationSheet,150)">
      <span class="loc-ic">${calIc}</span><span class="loc-txt"><b>Apple Calendar</b><span>${apple ? "Adds straight to your iPhone" : "Also works for any calendar app (.ics)"}</span></span></button>`;
  const opts = apple
    ? icsBtn(true) + link(L.google, "Google Calendar", "Opens calendar.google.com", false)
    : link(L.google, "Google Calendar", "Opens calendar.google.com", true) + icsBtn(false);
  const el = document.createElement("div");
  el.id = "loc-sheet";
  el.className = "loc-overlay";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-label", "Add to calendar");
  el.innerHTML = `<div class="loc-sheet">
      <div class="loc-head">
        <div><b>Add to calendar</b><span>${escapeHtml(ev.title)} · ${feedDateLabel(ev)} ${feedTimeLabel(ev)}</span></div>
        <button class="loc-x" onclick="closeLocationSheet()" aria-label="Close">✕</button>
      </div>
      ${opts}
      ${link(L.outlook, "Outlook", "Opens outlook.live.com", false)}
    </div>`;
  el.addEventListener("click", (e) => {
    if (e.target === el) closeLocationSheet();
  });
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add("in"));
  document.addEventListener("keydown", _locEsc);
}

