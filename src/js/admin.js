import { G } from './globals.js';
import { EVENT_SEED, EVENTS, CATS, CAT_IMG, catImg, eventStatus, isHotEvent, generateUniqueId, codeFor, DEMO_PEOPLE, personByName, CARD_BG_STYLES, CARD_ACCENT_COLORS, CARD_THEMES, CARD_PATTERNS, LONDON_AREAS, CATEGORY_KEYWORDS, MILESTONE_BADGES, CATEGORY_BADGES, ALLROUNDER_BADGE, TOTAL_CATEGORIES, SPECIAL_BADGES, LEVELS, getLevel, INTEREST_PRESETS, CALENDAR_YEAR, CALENDAR_MONTH, MONTH_NAMES, WEEKDAY_LABELS, BLOT_SVG, EMAIL_PATTERN } from './constants.js';
import { sb } from './config.js';
import { validateCuratorCode, adminSendCode, adminVerifyCode, isAdminSession, isPerkUnlocked, distanceMeters, canCheckInAt } from './services.js';
import { renderGate, switchAuthMode, _updateCuratorVisibility, switchSignupType, showLpSignup, closeLpSignup, lpUpdatePassName, _cacheSession, _restoreUserFromRow, submitGate, _submitHostApplication, signOut, enterApp, promptAdminSignIn, persistProfile, applyMapChrome, resolveEventLocations, buildEventsGeoJSON, updateClusterPaint, attachMapLayers, syncHtmlMarkers, refreshMarkers, initLeaflet, initHostMap, handleAddressAutocomplete, selectSearchSuggestion, selectAutocompleteAddress, showMapLayer, persistGeocodeCache, geocodeAddress, openCardEditor, captureDraftFields, handleCardPhoto, removeCardPhoto, selectCardTheme, selectCardAccentColor, selectCardPattern, setPatternOpacity, toggleCardArea, updateCardPreview, renderCardEditor, switchCeTab, saveCard, initCardSheen, getCardExt, saveCardExt, openExpandedCard, closeExpandedCard, renderProfile, editProfile, updateAboutCounter, saveProfileAbout, toggleProfileInterest, getAllBadges, getFeaturedBadges, openBadgePicker, toggleFeaturedBadge, closeBadgePicker, renderAchievements, openAchievements, renderDetail, openEvent, checkInToEvent, promptCuratorUnlock, uploadNightShot, getFilteredEvents, toggleFriendsOnly, refreshFilters, pinTooltipHtml, renderPerkPanel, renderCalendar, openCalendarDay, renderCalendarDay, buildCalendarWeeks, openCalendar, getMyEvents, getMyCategories, getEventDay, toggleHotOnly, toggleLiveOnly, computeEventDates, loadFriends, addFriend, removeFriend, renderConnect, openFriends, openConnectGateway, openConnect, peekAttendee, closeAttendeePeek, toggleGoingSection, _buildChatMsgHtml, _appendChatMsg, sendChat, renderSocialTab, startChatCountdown, getUnreadSocialCount, openSocialForEvent, openSocialTab, setHostType, ticketTypes, renderBook, renderCheckout, renderConfirmed, renderMyTickets, processPayment, loadMyTickets, _insertTickets, openBook, openViewTicket, registerFree, afterRenderConfirmed, downloadICS, getCumulusFee, formatCardNumber, formatExpiry, openTicketsTab, renderTicketsTab, generateTicketId, getTicketForEvent, setBookingType, setBookingQty, proceedToCheckout, showToast, showConfirm, setupReveal, renderNav, pushNav, goBack, renderView, closeActivePopup, goBrowse, setCategory, chatIsOpen, chatUnlockTime, pad2, markSocialSeen, medallionHtml, badgeCellHtml, trophyHtml, trophyCellHtml, resetProfile, getTheme, getBgStyle, resolveCardColors, geocodeBannerHtml } from './facade.js';


export function initOwnerDash(){
  const wrap=document.getElementById('od-wrap'); if(!wrap) return;
  const g=id=>wrap.querySelector('#'+id);
  const sv2=(id,v)=>{ const el=g(id); if(el) el.value=v; };

  ['od-sl-ev','od-sl-tx','od-sl-pr','od-sl-fe-p','od-sl-fr-p','od-sl-fe-v','od-sl-fr-v','od-sl-cb','od-sl-drop'].forEach(id=>{
    const el=g(id); if(!el) return;
    el.addEventListener('input',()=>{
      G._odCur='Custom';
      wrap.querySelectorAll('[data-odp]').forEach(b=>{ b.classList.remove('a'); if(b.dataset.odp==='Custom') b.classList.add('a'); });
      const ctx=g('od-ctx'); if(ctx) ctx.innerHTML=OD_PRESETS.Custom.ctx;
      od_renderStaff(); od_recalc();
    });
  });

  const presetsEl=g('od-presets');
  if(presetsEl){
    presetsEl.addEventListener('click',e=>{
      const btn=e.target.closest('[data-odp]'); if(!btn) return;
      const n=btn.dataset.odp; G._odCur=n;
      wrap.querySelectorAll('[data-odp]').forEach(b=>{ b.classList.remove('a'); if(b.classList.contains('hype')) b.classList.remove('a'); });
      btn.classList.add('a');
      const p=OD_PRESETS[n];
      sv2('od-sl-ev',p.ev); sv2('od-sl-tx',p.tx); sv2('od-sl-pr',p.pr);
      sv2('od-sl-fe-p',p.fep); sv2('od-sl-fr-p',p.frp); sv2('od-sl-fe-v',p.fev); sv2('od-sl-fr-v',p.frv);
      sv2('od-sl-cb',p.cb); sv2('od-sl-drop',p.drop);
      const ctx=g('od-ctx'); if(ctx) ctx.innerHTML=p.ctx;
      od_renderStaff(); od_recalc();
    });
  }

  const ctx=g('od-ctx'); if(ctx) ctx.innerHTML=OD_PRESETS[G._odCur].ctx;
  od_renderStaff(); od_recalc();
  // Kick off live Supabase data load
  loadOwnerLiveData();
}

export function renderOwnerDash(){
  const isOwner = state.profileEmail==='gondoxml@gmail.com';
  if(!isOwner) return `<div class="empty-state" style="padding:40px 20px;text-align:center;"><div style="font-size:32px;margin-bottom:12px;">🔒</div><div style="font-weight:700;margin-bottom:6px;">Restricted</div><div style="color:var(--text-muted);font-size:13px;">Owner access only.</div></div>`;

  const p=OD_PRESETS[G._odCur];
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
    <div class="section-h open" id="od-sh-paid" onclick="od_tog('paid')">
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
    <div class="section-h" id="od-sh-free" onclick="od_tog('free')" style="margin-top:4px">
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
    <div class="section-h" id="od-sh-vet" onclick="od_tog('vet')" style="margin-top:4px">
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
    <div class="section-h" id="od-sh-risk" onclick="od_tog('risk')" style="margin-top:4px">
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
    <div class="section-h" id="od-sh-staff" onclick="od_tog('staff')" style="margin-top:4px">
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
    <div class="section-h" id="od-sh-risks" onclick="od_tog('risks')" style="margin-top:10px">
      <span class="sh-t"><span class="od-dot" style="background:#E24B4A"></span> Pitfall analysis</span>
      <span style="display:flex;align-items:center;gap:8px"><span class="sh-v" id="od-shv-risks">—</span><span class="sh-arr">▾</span></span>
    </div>
    <div class="section-b" id="od-sb-risks">
      <div class="od-card" style="margin-top:4px"><div id="od-risk-list"></div></div>
    </div>

    <!-- INFRASTRUCTURE -->
    <div class="section-h" id="od-sh-infra" onclick="od_tog('infra')" style="margin-top:4px">
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

export function renderHostPayoutsPanel(){
  // Host-facing only. The per-ticket platform fee schedule is company-internal
  // (see the owner Finances dashboard) and is deliberately NOT shown here.
  return `
  <div class="hp-panel">
    <div class="hp-title">💸 Your payouts explained</div>
    <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;line-height:1.6;">You set the ticket price and <strong style="color:var(--text);">keep 100% of it</strong> — always. Buyers pay a small platform fee at checkout that covers card processing and running Cumulus. It's added on top of your price, so it never comes out of your earnings.</div>
    <div class="hp-tier-row">
      <span class="hp-tier-label">Your ticket price</span>
      <span class="hp-tier-fee" style="color:#22C55E">You keep 100%</span>
    </div>
    <div class="hp-tier-row">
      <span class="hp-tier-label">Platform fee</span>
      <span class="hp-tier-fee" style="color:var(--text-muted)">Added at checkout · paid by the buyer</span>
    </div>
    <div style="margin-top:12px;padding:10px 12px;background:var(--surface-2);border-radius:10px;font-size:11px;color:var(--text-muted);line-height:1.6;">
      <strong style="color:var(--text);">Payout timeline:</strong> Funds are held in escrow until 48 hours after your event ends, then released directly to your Stripe account. Graduated hosts (3+ events, zero disputes) get all friction removed.
    </div>
  </div>`;
}

export function renderReview(){
  const container=document.getElementById('view-container');
  container.innerHTML=`
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

export async function loadAndRenderReview(){
  const content=document.getElementById('review-content');
  if(!content) return;

  let apps=[];
  // Supabase
  try{
    const {data,error}=await sb.from('host_applications').select('*').order('created_at',{ascending:false});
    if(!error&&data) apps=[...apps,...data];
  }catch(e){}
  // localStorage fallback
  try{
    const local=JSON.parse(localStorage.getItem('host_applications_local')||'[]');
    // Deduplicate by email+created_at
    const existingKeys=new Set(apps.map(a=>a.email+'|'+a.created_at));
    apps=[...apps,...local.filter(a=>!existingKeys.has(a.email+'|'+a.created_at))];
  }catch(e){}

  if(!apps.length){
    content.innerHTML=`<div class="review-empty"><div class="review-empty-icon">✅</div><div style="font-weight:700;margin-bottom:4px;">All clear</div><div>No host applications yet.</div></div>`;
    return;
  }

  const pending=apps.filter(a=>a.status==='pending');
  const reviewed=apps.filter(a=>a.status!=='pending');

  content.innerHTML=`
    ${pending.length?`<div class="review-section-hd">Pending (${pending.length})</div>${pending.map(_buildReviewCard).join('')}`:''}
    ${reviewed.length?`<div class="review-section-hd" style="margin-top:${pending.length?'20px':'0'};">Reviewed (${reviewed.length})</div>${reviewed.map(_buildReviewCard).join('')}`:''}
  `;
}

export function _buildReviewCard(app){
  const date=app.created_at?new Date(app.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'';
  const isPending=app.status==='pending';
  const id=escapeHtml(app.id||app.email);
  const email=escapeHtml(app.email);
  return `<div class="review-card list-item-stagger">
    <div class="review-card-top">
      <div>
        <div class="review-card-name">${escapeHtml(app.name)}</div>
        <div class="review-card-email">${email}</div>
      </div>
      <span class="review-status-badge ${app.status}">${app.status}</span>
    </div>
    ${app.business_name?`<div class="review-detail"><div class="review-detail-lbl">Venue / Business</div><div class="review-detail-val">${escapeHtml(app.business_name)}</div></div>`:''}
    ${app.event_types?`<div class="review-detail"><div class="review-detail-lbl">Event types</div><div class="review-detail-val">${escapeHtml(app.event_types)}</div></div>`:''}
    ${app.description?`<div class="review-detail"><div class="review-detail-lbl">About their events</div><div class="review-detail-val">${escapeHtml(app.description)}</div></div>`:''}
    ${app.why_host?`<div class="review-detail"><div class="review-detail-lbl">Why they want to host</div><div class="review-detail-val">${escapeHtml(app.why_host)}</div></div>`:''}
    ${date?`<div style="font-size:10px;color:var(--text-muted);margin-top:8px;">Applied ${date}</div>`:''}
    ${isPending?`<div class="review-actions">
      <button class="btn btn-small review-approve-btn" style="flex:1;" onclick="reviewHost('${id}','${email}','approved')">Approve</button>
      <button class="btn btn-outline btn-small review-reject-btn"  style="flex:1;" onclick="reviewHost('${id}','${email}','rejected')">Reject</button>
    </div>`:''}
  </div>`;
}

export async function reviewHost(appId, email, decision){
  // Update Supabase
  try{ await sb.from('host_applications').update({status:decision}).eq('id',appId); }catch(e){}
  // Update localStorage fallback
  try{
    let apps=JSON.parse(localStorage.getItem('host_applications_local')||'[]');
    apps=apps.map(a=>(a.email===email||a.id===appId)?{...a,status:decision}:a);
    localStorage.setItem('host_applications_local',JSON.stringify(apps));
  }catch(e){}
  // If approved: add verified-host badge to the user
  if(decision==='approved'){
    try{
      const {data:u}=await sb.from('users').select('id,special_badges').eq('email',email).single();
      if(u){
        const badges=[...(u.special_badges||[])];
        if(!badges.includes('verified-host')) badges.push('verified-host');
        await sb.from('users').update({special_badges:badges}).eq('id',u.id);
      }
    }catch(e){}
  }
  showToast(decision==='approved'?`${email} approved as host`:`Application rejected`,'success');
  await loadAndRenderReview();
}

export function renderEventApprovals(){
  const container=document.getElementById('view-container');
  container.innerHTML=`
    <button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header">
      <h2>Event Approvals</h2>
      <p>Public events awaiting review before they go live</p>
    </div>
    <div id="evapp-content">
      <div class="review-empty"><div class="review-empty-icon">📋</div><div>Loading events…</div></div>
    </div>`;
  setTimeout(loadAndRenderEventApprovals,0);
}

export async function loadAndRenderEventApprovals(){
  const content=document.getElementById('evapp-content');
  if(!content) return;
  let evs=[];
  try{
    const {data,error}=await sb.from('pending_events').select('*').order('created_at',{ascending:false});
    if(!error&&data) evs=[...evs,...data];
  }catch(e){}
  try{
    const local=JSON.parse(localStorage.getItem('pending_events_local')||'[]');
    const keys=new Set(evs.map(_pendingEventKey));
    evs=[...evs,...local.filter(e=>!keys.has(_pendingEventKey(e)))];
  }catch(e){}

  if(!evs.length){
    content.innerHTML=`<div class="review-empty"><div class="review-empty-icon">✅</div><div style="font-weight:700;margin-bottom:4px;">All clear</div><div>No public events awaiting approval.</div></div>`;
    return;
  }
  const pending=evs.filter(e=>e.status==='pending');
  const reviewed=evs.filter(e=>e.status!=='pending');
  content.innerHTML=`
    ${pending.length?`<div class="review-section-hd">Pending (${pending.length})</div>${pending.map(_buildEventApprovalCard).join('')}`:''}
    ${reviewed.length?`<div class="review-section-hd" style="margin-top:${pending.length?'20px':'0'};">Reviewed (${reviewed.length})</div>${reviewed.map(_buildEventApprovalCard).join('')}`:''}`;
}

export function _buildEventApprovalCard(ev){
  const id=escapeHtml(String(ev.id!=null?ev.id:''));
  const when=ev.start_time?new Date(ev.start_time).toLocaleString('en-GB',{weekday:'short',day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}):'';
  const isPending=ev.status==='pending';
  const priceLbl=Number(ev.price)>0?`£${Number(ev.price).toFixed(2)}`:'Free';
  return `<div class="review-card list-item-stagger">
    <div class="review-card-top">
      <div>
        <div class="review-card-name">${escapeHtml(ev.title||'Untitled event')}</div>
        <div class="review-card-email">${escapeHtml(ev.host_name||'Unknown host')}${ev.host_email?' · '+escapeHtml(ev.host_email):''}</div>
      </div>
      <span class="review-status-badge ${escapeHtml(ev.status||'pending')}">${escapeHtml(ev.status||'pending')}</span>
    </div>
    ${ev.category?`<div class="review-detail"><div class="review-detail-lbl">Category</div><div class="review-detail-val">${escapeHtml(ev.category)}</div></div>`:''}
    ${when?`<div class="review-detail"><div class="review-detail-lbl">When</div><div class="review-detail-val">${when}</div></div>`:''}
    ${ev.venue?`<div class="review-detail"><div class="review-detail-lbl">Venue</div><div class="review-detail-val">${escapeHtml(ev.venue)}${ev.area?', '+escapeHtml(ev.area):''}</div></div>`:''}
    <div class="review-detail"><div class="review-detail-lbl">Capacity · Ticket price</div><div class="review-detail-val">${ev.capacity!=null?escapeHtml(String(ev.capacity)):'—'} · ${priceLbl}</div></div>
    ${ev.description?`<div class="review-detail"><div class="review-detail-lbl">Description</div><div class="review-detail-val">${escapeHtml(ev.description)}</div></div>`:''}
    ${isPending?`<div class="review-actions">
      <button class="btn btn-small review-approve-btn" style="flex:1;" onclick="decideEvent('${id}','approved')">Approve &amp; publish</button>
      <button class="btn btn-outline btn-small review-reject-btn" style="flex:1;" onclick="decideEvent('${id}','rejected')">Reject</button>
    </div>`:''}
  </div>`;
}

export async function decideEvent(pendingId, decision){
  // Locate the pending record — Supabase first, then the local fallback store.
  let rec=null;
  try{ const {data}=await sb.from('pending_events').select('*').eq('id',pendingId).single(); rec=data; }catch(e){}
  if(!rec){
    try{ const arr=JSON.parse(localStorage.getItem('pending_events_local')||'[]'); rec=arr.find(e=>String(e.id)===String(pendingId))||null; }catch(e){}
  }
  if(decision==='approved' && rec) await _publishApprovedEvent(rec);
  // Record the decision (both stores, whichever exists)
  try{ await sb.from('pending_events').update({status:decision}).eq('id',pendingId); }catch(e){}
  try{
    let arr=JSON.parse(localStorage.getItem('pending_events_local')||'[]');
    arr=arr.map(e=>String(e.id)===String(pendingId)?{...e,status:decision}:e);
    localStorage.setItem('pending_events_local',JSON.stringify(arr));
  }catch(e){}
  showToast(decision==='approved'?'Event approved & published':'Event rejected','success');
  await loadAndRenderEventApprovals();
}

export async function _publishApprovedEvent(rec){
  let inserted=null;
  try{
    const {data,error}=await sb.from('events').insert({
      title:rec.title, category:rec.category,
      host_id:rec.host_id, host_name:rec.host_name,
      venue:rec.venue, area:rec.area||'London', address:rec.address||'',
      lat:rec.lat, lon:rec.lon,
      start_time:rec.start_time, end_time:rec.end_time,
      description:rec.description, capacity:rec.capacity, price:rec.price||0
    }).select().single();
    if(!error) inserted=data;
  }catch(e){}
  const src=inserted||rec;
  const newEvent={
    id: inserted?inserted.id : ('local_ev_'+Date.now()),
    title:src.title, category:src.category,
    host:src.host_name, hostId:src.host_id,
    venue:src.venue, area:src.area||'London', address:src.address||'',
    lat:src.lat, lon:src.lon,
    startTime:src.start_time, endTime:src.end_time,
    desc:src.description, capacity:src.capacity, price:src.price||0
  };
  computeEventDates(newEvent);
  if(!EVENTS.some(e=>String(e.id)===String(newEvent.id))) EVENTS.push(newEvent);
}

export async function submitHostEvent(){
  const title=(document.getElementById('host-title')?.value||'').trim();
  const cat=document.getElementById('host-cat')?.value;
  const startDate=document.getElementById('host-start-date')?.value;
  const startTime=document.getElementById('host-start-time')?.value;
  const endDate=document.getElementById('host-end-date')?.value;
  const endTime=document.getElementById('host-end-time')?.value;
  const startVal=startDate&&startTime?`${startDate}T${startTime}`:'';
  const endVal=endDate&&endTime?`${endDate}T${endTime}`:'';
  const areaName=(document.getElementById('host-area')?.value||'').trim();
  const venue=(document.getElementById('host-venue')?.value||'').trim();
  const capStr=document.getElementById('host-capacity')?.value;
  const priceStr=document.getElementById('host-price')?.value;
  const priceVal=priceStr?parseFloat(priceStr):0;
  const desc=(document.getElementById('host-desc')?.value||'').trim();
  if(!title||!startVal||!endVal||!venue||!capStr){ showToast('Please fill in title, date & time, venue, and capacity.','error'); return; }
  const stDate=new Date(startVal),enDate=new Date(endVal);
  if(stDate>=enDate){ showToast('End time must be after start time.','error'); return; }

  if(G._hostType==='public'){
    // Public events don't go live immediately — they queue for owner approval.
    const pubAddress=document.getElementById('host-address-search')?.value||'';
    const pending={
      title, category:cat,
      host_id:state.userId||null, host_name:state.profileName||'', host_email:state.profileEmail||'',
      venue, area:areaName||'London', address:pubAddress,
      lat:G.newEventLat, lon:newEventLon,
      start_time:stDate.toISOString(), end_time:enDate.toISOString(),
      description:desc, capacity:parseInt(capStr,10), price:priceVal,
      status:'pending', created_at:new Date().toISOString()
    };
    const pbtn=document.getElementById('host-submit-btn');
    if(pbtn){ pbtn.disabled=true; pbtn.textContent='Submitting…'; }
    let saved=false;
    try{ const {error}=await sb.from('pending_events').insert(pending); if(!error) saved=true; }catch(e){}
    if(!saved){
      try{
        const arr=JSON.parse(localStorage.getItem('pending_events_local')||'[]');
        arr.push({...pending, id:'local_'+Date.now()});
        localStorage.setItem('pending_events_local',JSON.stringify(arr));
        saved=true;
      }catch(e){}
    }
    if(pbtn){ pbtn.disabled=false; pbtn.textContent='Submit for review →'; }
    showToast(saved?'Submitted for review — we\'ll approve it shortly.':'Could not submit — please try again.', saved?'success':'error');
    if(saved){ state.view='browse'; renderNav(); renderView(); }
    return;
  }

  const address=document.getElementById('host-address-search')?.value||'';

  const btn=document.getElementById('host-submit-btn');
  if(btn){ btn.disabled=true; btn.textContent='Creating…'; }

  const {data,error}=await sb.from('events').insert({
    title, category:cat,
    host_id:state.userId, host_name:state.profileName,
    venue, area:areaName||'London', address,
    lat:G.newEventLat, lon:newEventLon,
    start_time:stDate.toISOString(), end_time:enDate.toISOString(),
    description:desc, capacity:parseInt(capStr,10), price:priceVal
  }).select().single();

  if(btn){ btn.disabled=false; btn.textContent='Create private event →'; }
  if(error){ showToast('Failed to create event. Please try again.','error'); console.error(error); return; }

  // Add to local EVENTS array so map updates immediately without a page reload
  const newEvent={
    id:data.id, title:data.title, category:data.category,
    host:data.host_name, hostId:data.host_id,
    venue:data.venue, area:data.area, address:data.address,
    lat:data.lat, lon:data.lon,
    startTime:data.start_time, endTime:data.end_time,
    desc:data.description, capacity:data.capacity, price:priceVal
  };
  computeEventDates(newEvent);
  EVENTS.push(newEvent);

  // Auto-RSVP the host
  await sb.from('rsvps').insert({event_id:data.id,user_id:state.userId,user_name:state.profileName});
  state.rsvps[data.id]=[state.profileName];

  showToast('Event created and pinned to the map!','success');
  openEvent(data.id);
}

export function od_tog(id){
  const wrap=document.getElementById('od-wrap'); if(!wrap) return;
  const h=wrap.querySelector('#od-sh-'+id), b=wrap.querySelector('#od-sb-'+id);
  if(!h||!b) return;
  const o=b.classList.contains('open');
  b.classList.toggle('open',!o); h.classList.toggle('open',!o);
}

export function _odPlatformFee(pr){
  if(pr<=15) return {fee:1.50,tier:1,label:'Tier 1',badge:'badge-t1'};
  if(pr<=40) return {fee:2.50,tier:2,label:'Tier 2',badge:'badge-t2'};
  if(pr<=71) return {fee:3.50,tier:3,label:'Tier 3',badge:'badge-t3'};
  return {fee:4.50,tier:4,label:'Tier 4',badge:'badge-t4'};
}

export function _odVatOnFee(fee,vatReg){ return vatReg?fee/6:0; }

export function _odStripeCost(total){ return total*0.015+0.20; }

export function _odBarCol(p){ return p<60?'#22C55E':p<85?'#E0B23C':'#E24B4A'; }

export function _odTierCls(p){ return p<60?'tbadge tok':p<85?'tbadge twarn':'tbadge tdanger'; }

export function _odSetBar(g,id,p){ const el=g(id); if(el){el.style.width=Math.min(p,100)+'%';el.style.background=_odBarCol(Math.min(p,100));} }

export function _odSetTier(g,id,l,p){ const el=g(id); if(el){el.className=_odTierCls(Math.min(p,100));el.textContent=l;} }

export function _odCalcSupa(r,m){ const o=r>500000||m>50000; return {cost:o?20:0,rp:Math.min(r/500000*100,100),mp:Math.min(m/50000*100,100),over:o}; }

export function _odCalcMb(l){ if(l<=50000) return {cost:0,p:l/50000*100,t:'Free'}; return {cost:Math.round((l-50000)/1000*0.4*100)/100,p:100,t:'Paid'}; }

export function _odCalcEm(e){ if(e<=3000) return {cost:0,p:e/3000*100,t:'Free'}; if(e<=50000) return {cost:15,p:e/50000*100,t:'Starter'}; return {cost:35,p:e/100000*100,t:'Pro'}; }

export function _odCalcVc(i){ if(i<=1e6) return {cost:0,p:i/1e6*100,t:'Free'}; return {cost:18,p:100,t:'Pro'}; }

export function od_renderStaff(){
  const wrap=document.getElementById('od-wrap'); if(!wrap) return;
  const g=id=>wrap.querySelector('#'+id);
  const st=(id,v)=>{ const el=g(id); if(el) el.textContent=v; };
  const p=OD_PRESETS[G._odCur]; const list=g('od-staff-list'); if(!list) return;
  list.innerHTML='';
  [{name:'CS team',data:p.cs},{name:'Engineering',data:p.eng}].forEach(r=>{
    const el=document.createElement('div');
    el.style.cssText='display:flex;justify-content:space-between;align-items:center;padding:8px 10px;background:#1E1F24;border-radius:10px;margin-bottom:6px;';
    const z=r.data.cost===0;
    el.innerHTML='<div><div style="font-size:12px;font-weight:500;color:#C5C6CB">'+r.name+'</div><div style="font-size:10px;color:#5F5E5A;margin-top:2px">'+r.data.l+'</div></div><div><div style="font-family:\'SF Mono\',monospace;font-size:13px;font-weight:600;color:'+(z?'#5F5E5A':'#E24B4A')+'">'+_odGbp(r.data.cost)+'/mo</div></div>';
    list.appendChild(el);
  });
  const tot=p.cs.cost+p.eng.cost;
  st('od-staff-total',_odGbp(tot)); st('od-shv-staff',_odGbp(tot)+'/mo');
}

export function od_recalc(){
  const wrap=document.getElementById('od-wrap'); if(!wrap) return;
  const g=id=>wrap.querySelector('#'+id);
  const gv=id=>{ const el=g(id); return el?Number(el.value):0; };
  const st=(id,v)=>{ const el=g(id); if(el) el.textContent=v; };

  const ev=gv('od-sl-ev'),tx=gv('od-sl-tx'),pr=gv('od-sl-pr');
  const fep=gv('od-sl-fe-p'),frp=gv('od-sl-fr-p'),fev=gv('od-sl-fe-v'),frv=gv('od-sl-fr-v');
  const cbRate=gv('od-sl-cb')/100, dropRate=gv('od-sl-drop')/100;

  st('od-lev',ev.toLocaleString()); st('od-ltx',tx.toLocaleString()); st('od-lpr','£'+pr);
  st('od-lfe-p',fep.toLocaleString()); st('od-lfr-p',Math.min(frp,10));
  st('od-lfe-v',fev.toLocaleString()); st('od-lfr-v',frv);
  st('od-lcb',gv('od-sl-cb').toFixed(1)+'%'); st('od-ldrop',gv('od-sl-drop')+'%');
  st('od-shv-paid',ev.toLocaleString()+' events · £'+pr);

  const {fee,tier,label}=_odPlatformFee(pr);
  const checkoutPrice=pr+fee;
  const stripePerTx=_odStripeCost(checkoutPrice);
  const grossTix=ev*tx;
  const annFeeRev=grossTix*fee*12;
  const vatReg=annFeeRev>=90000;
  const vatPerTix=_odVatOnFee(fee,vatReg);
  const netFeePerTix=fee-vatPerTix-stripePerTx;
  const dropTix=Math.round(grossTix*dropRate);
  const paidTix=Math.max(0,grossTix-dropTix);

  // Tier box
  ['t1','t2','t3','t4'].forEach((t,i)=>{
    const el=g('od-tbr-'+t); if(el) el.className='tb-row'+(tier===i+1?' active':'');
  });
  st('od-tb-tiern',tier);
  st('od-tb-host','£'+pr.toFixed(2));
  const elFee=g('od-tb-fee'); if(elFee) elFee.textContent='£'+fee.toFixed(2);
  const elStr=g('od-tb-stripe'); if(elStr) elStr.textContent='-£'+stripePerTx.toFixed(2);
  const elVat=g('od-tb-vat'); if(elVat) elVat.textContent=vatReg?('-£'+vatPerTix.toFixed(2)):'£0.00 (pre-threshold)';
  st('od-tb-checkout','£'+checkoutPrice.toFixed(2));
  const elNet=g('od-tb-net'); if(elNet){ elNet.textContent=(netFeePerTix<0?'-':'')+'£'+Math.abs(netFeePerTix).toFixed(2); elNet.style.color=netFeePerTix<0.20?'#E24B4A':netFeePerTix<0.50?'#E0B23C':'#22C55E'; }

  st('od-st-ptx',_odFmt(paidTix)); st('od-st-fee','£'+fee.toFixed(2)); st('od-st-checkout','£'+checkoutPrice.toFixed(2));

  // Revenue
  const grossFeeRev=paidTix*fee;
  const totalVat=paidTix*vatPerTix;
  const netFeeRev=grossFeeRev-totalVat;
  const totalStripe=paidTix*stripePerTx;
  const cbCount=Math.round(paidTix*cbRate);
  const cbCost=cbCount*15;
  const gp=netFeeRev-totalStripe-cbCost;

  st('od-pl-pf',_odGbp(grossFeeRev));
  const pfNote=g('od-pf-note'); if(pfNote) pfNote.textContent=_odFmt(paidTix)+' tickets × £'+fee.toFixed(2)+' ('+label+')';
  const plVat=g('od-pl-vat'); if(plVat){ plVat.textContent=vatReg?('-'+_odGbp(totalVat)):'£0'; plVat.className='plv '+(vatReg?'rd':'dim'); }
  const vatNote=g('od-vat-note'); if(vatNote) vatNote.textContent=vatReg?('Registered · annualised £'+Math.round(annFeeRev/1000)+'k > £90k threshold'):'Pre-threshold · annualised £'+Math.round(annFeeRev/1000)+'k / £90k';
  st('od-pl-netrev',_odGbp(netFeeRev));
  const plStr=g('od-pl-str'); if(plStr){ plStr.textContent='-'+_odGbp(totalStripe); plStr.className='plv str'; }
  const strNote=g('od-str-note'); if(strNote) strNote.textContent='1.5%+20p on £'+checkoutPrice.toFixed(2)+' × '+_odFmt(paidTix)+' txns';
  const plCb=g('od-pl-cb'); if(plCb){ plCb.textContent=cbCount>0?('-'+_odGbp(cbCost)):'£0'; plCb.className='plv '+(cbCount>0?'rd':'dim'); }
  const cbNote=g('od-cb-note'); if(cbNote) cbNote.textContent=cbCount>0?(cbCount+' disputes × £15'):('No disputes modelled');
  st('od-pl-gp',_odGbp(gp));

  // Infra
  const privRsvp=fep*Math.min(frp,10), vetRsvp=fev*frv, totalFree=privRsvp+vetRsvp;
  const totalLoad=paidTix+totalFree;
  const freeRatio=totalLoad>0?totalFree/totalLoad:0;
  st('od-total-free',_odFmt(totalFree));
  st('od-load-ratio',Math.round(freeRatio*100)+'% free');
  const lb=g('od-load-bar'); if(lb){ lb.style.width=Math.min(freeRatio*100,100)+'%'; lb.style.background=_odBarCol(Math.min(freeRatio/0.6*100,100)); }
  st('od-shv-free',_odFmt(totalFree)+' free RSVPs/mo');

  const dbRows=totalLoad*5, maus=Math.round(totalLoad*0.6), mapLoads=paidTix*2, emails=totalLoad*1.5, inv=totalLoad*8;
  const sb=_odCalcSupa(dbRows,maus), mb=_odCalcMb(mapLoads), em=_odCalcEm(emails), vc=_odCalcVc(inv);
  _odSetBar(g,'od-sb-b',sb.rp); _odSetTier(g,'od-sb-t',sb.over?'Over free':sb.rp>60?'Near limit':'Free',sb.rp); st('od-sb-n',_odFmt(dbRows));
  const sbC=g('od-sb-c'); if(sbC){ sbC.textContent='£'+sb.cost; sbC.className='uc '+(sb.cost>0?'bad':'ok'); }
  _odSetBar(g,'od-mau-b',sb.mp); _odSetTier(g,'od-mau-t',sb.over?'Over free':sb.mp>60?'Near limit':'Free',sb.mp); st('od-mau-n',_odFmt(maus)+' MAUs');
  _odSetBar(g,'od-mb-b',mb.p); _odSetTier(g,'od-mb-t',mb.t,mb.p); st('od-mb-n',_odFmt(mapLoads));
  const mbC=g('od-mb-c'); if(mbC){ mbC.textContent='£'+Math.round(mb.cost); mbC.className='uc '+(mb.cost>0?'bad':'ok'); }
  _odSetBar(g,'od-em-b',em.p); _odSetTier(g,'od-em-t',em.t,em.p); st('od-em-n',_odFmt(emails));
  const emC=g('od-em-c'); if(emC){ emC.textContent='£'+em.cost; emC.className='uc '+(em.cost>0?'bad':'ok'); }
  _odSetBar(g,'od-vc-b',vc.p); _odSetTier(g,'od-vc-t',vc.t,vc.p); st('od-vc-n',_odFmt(inv));
  const vcC=g('od-vc-c'); if(vcC){ vcC.textContent='£'+vc.cost; vcC.className='uc '+(vc.cost>0?'bad':'ok'); }
  const totalInfra=sb.cost+Math.round(mb.cost)+em.cost+vc.cost;
  st('od-infra-tot','£'+totalInfra.toLocaleString()); st('od-shv-infra','£'+totalInfra+'/mo');
  const plSb=g('od-pl-sb'); if(plSb){ plSb.textContent=sb.cost>0?'-£'+sb.cost:'£0'; plSb.className='plv '+(sb.cost>0?'am':'dim'); }
  const sbPl=g('od-sb-pl'); if(sbPl) sbPl.textContent=sb.cost>0?'Pro':'Free';
  const plMb=g('od-pl-mb'); if(plMb){ plMb.textContent=mb.cost>0?'-£'+Math.round(mb.cost):'£0'; plMb.className='plv '+(mb.cost>0?'am':'dim'); }
  const mbPl=g('od-mb-pl'); if(mbPl) mbPl.textContent=mb.t;
  const plEm=g('od-pl-em'); if(plEm){ plEm.textContent=em.cost>0?'-£'+em.cost:'£0'; plEm.className='plv '+(em.cost>0?'am':'dim'); }
  const emPl=g('od-em-pl'); if(emPl) emPl.textContent=em.t;
  const plVc=g('od-pl-vc'); if(plVc){ plVc.textContent=vc.cost>0?'-£'+vc.cost:'£0'; plVc.className='plv '+(vc.cost>0?'am':'dim'); }
  const vcPl=g('od-vc-pl'); if(vcPl) vcPl.textContent=vc.t;

  // Staffing
  const p=OD_PRESETS[G._odCur];
  const csC=p.cs.cost, engC=p.eng.cost, totalStaff=csC+engC, totalOpex=totalInfra+totalStaff;
  const plCs=g('od-pl-cs'); if(plCs){ plCs.textContent=csC>0?'-'+_odGbp(csC):'£0'; plCs.className='plv '+(csC>0?'pu':'dim'); }
  const csN=g('od-cs-n'); if(csN) csN.textContent=p.cs.l;
  const plEng=g('od-pl-eng'); if(plEng){ plEng.textContent=engC>0?'-'+_odGbp(engC):'£0'; plEng.className='plv '+(engC>0?'pu':'dim'); }
  const engN=g('od-eng-n'); if(engN) engN.textContent=p.eng.l;
  st('od-pl-opex','-'+_odGbp(totalOpex));

  // Tax + founder draw
  const pre=gp-totalOpex, ann=pre*12, tr=pre>0?(ann>50000?0.25:0.19):0, tax=pre>0?pre*tr:0, netAfterTax=pre-tax;
  const DRAW_TARGET=10000, DRAW_CAP=20000;
  let actualDraw, drawLabel, reinvest;
  if(netAfterTax<=0){ actualDraw=0; drawLabel='Business not yet profitable'; reinvest=0; }
  else if(netAfterTax<DRAW_TARGET){ actualDraw=netAfterTax; drawLabel='Below £10k — taking all profit as draw'; reinvest=0; }
  else if(netAfterTax<DRAW_CAP){ actualDraw=DRAW_TARGET; drawLabel='£10k/mo draw · surplus reinvested'; reinvest=netAfterTax-actualDraw; }
  else { actualDraw=DRAW_CAP; drawLabel='£20k/mo hard cap reached · everything above reinvests'; reinvest=netAfterTax-actualDraw; }

  st('od-pl-pre',_odGbp(pre));
  const taxL=g('od-tax-l'); if(taxL) taxL.textContent='UK corp tax · '+(tr*100)+'% effective rate';
  st('od-pl-tax','-'+_odGbp(tax));
  const plDraw=g('od-pl-draw'); if(plDraw) plDraw.textContent=actualDraw>0?('-'+_odGbp(actualDraw)):'£0';
  const drawNote=g('od-draw-note'); if(drawNote) drawNote.textContent=drawLabel;
  const drawDisplay=g('od-draw-display'); if(drawDisplay) drawDisplay.textContent=_odGbp(actualDraw)+'/mo';
  const neEl=g('od-pl-net'); if(neEl){ neEl.textContent=_odGbp(reinvest); neEl.className='od-thv '+(reinvest>0?'pos':netAfterTax<=0?'neg':'pos'); }

  // Status pills
  const pillTier=g('od-pill-tier'); if(pillTier){ pillTier.textContent=label+' · £'+fee.toFixed(2)+'/ticket'; pillTier.className='status-pill '+(tier===1?'sp-blue':tier===2?'sp-green':tier===3?'sp-amber':'sp-purple'); }
  const pillVat=g('od-pill-vat'); if(pillVat){ pillVat.textContent=vatReg?'VAT Registered':'Pre-VAT (£'+Math.round(annFeeRev/1000)+'k/£90k)'; pillVat.className='status-pill '+(vatReg?'sp-red':'sp-green'); }
  const pillStripe=g('od-pill-stripe'); if(pillStripe){ pillStripe.textContent='Stripe · £'+stripePerTx.toFixed(2)+'/txn'; pillStripe.className='status-pill sp-blue'; }
  const pillNet=g('od-pill-net'); if(pillNet){ pillNet.textContent='Net £'+netFeePerTix.toFixed(2)+'/ticket'; pillNet.className='status-pill '+(netFeePerTix<0.20?'sp-red':netFeePerTix<0.60?'sp-amber':'sp-green'); }

  // Vetting highlight
  ['od-vc1','od-vc2','od-vc3','od-vc4'].forEach(id=>{ const el=g(id); if(el) el.className='vet-card'; });
  if(pr<20){ const el=g('od-vc1'); if(el) el.className='vet-card active'; }
  else if(pr<50){ const el=g('od-vc2'); if(el) el.className='vet-card active'; }
  else { const el=g('od-vc3'); if(el) el.className='vet-card active'; }

  // Alerts
  const stripePct=netFeeRev>0?totalStripe/netFeeRev*100:0;
  const aVat=g('od-alert-vat'); if(aVat) aVat.className='pitfall-alert '+(vatReg?'info show':'');
  const aCb=g('od-alert-cb'); if(aCb) aCb.className='pitfall-alert '+(cbCost>500?'warn show':'');
  const aStr=g('od-alert-stripe'); if(aStr) aStr.className='pitfall-alert '+(stripePct>40?'warn show':'');
  const aMar=g('od-alert-margin'); if(aMar) aMar.className='pitfall-alert '+(pre<0?'danger show':'');
  const aRat=g('od-alert-ratio'); if(aRat) aRat.className='pitfall-alert '+(freeRatio>0.6?'warn show':'');

  // Risk list
  const risks=[
    {n:'Net margin per ticket',d:'After Stripe + VAT (ex-infra/staff)',v:'£'+netFeePerTix.toFixed(2),cls:netFeePerTix<0.20?'bad':netFeePerTix<0.50?'warn':'ok',note:netFeePerTix<0.20?'Below safety floor':'Healthy'},
    {n:'VAT status',d:vatReg?'Registered · 20% absorbed from fee':'Pre-threshold — build reserves',v:vatReg?_odGbp(totalVat)+'/mo withheld':'Pre-VAT',cls:vatReg?'warn':'ok',note:vatReg?'Checkout price unchanged':'Cross £90k annualised fee revenue to trigger'},
    {n:'Stripe fee drag',d:'Processing as % of net fee revenue',v:Math.round(stripePct)+'%',cls:stripePct>40?'bad':stripePct>25?'warn':'ok',note:stripePct>40?'Raise ticket price to Tier 2 range':'Acceptable'},
    {n:'Chargeback exposure',d:cbCount+' disputes · £15 each',v:_odGbp(cbCost)+'/mo',cls:cbCost>2000?'bad':cbCost>500?'warn':'ok',note:'In-app refund UX deflects most'},
    {n:'Free load ratio',d:Math.round(freeRatio*100)+'% of RSVPs are free',v:Math.round(freeRatio*100)+'%',cls:freeRatio>0.8?'bad':freeRatio>0.6?'warn':'ok',note:'Private cap (10) + vetting keeps this manageable'},
    {n:'Staffing vs gross profit',d:'Staff cost as % of gross profit',v:gp>0?Math.round(totalStaff/gp*100)+'%':'N/A',cls:gp>0&&totalStaff>gp?'bad':gp>0&&totalStaff/gp>0.6?'warn':'ok',note:'Hire too early = margin squeeze'},
  ];
  const rl=g('od-risk-list'); if(!rl) return;
  rl.innerHTML=''; let score=0;
  risks.forEach(r=>{
    if(r.cls==='bad') score+=2; else if(r.cls==='warn') score+=1;
    const el=document.createElement('div'); el.className='risk-row';
    el.innerHTML='<div style="flex:1;min-width:0"><div style="font-size:12px;font-weight:500;color:#C5C6CB">'+r.n+'</div><div style="font-size:10px;color:#5F5E5A;margin-top:2px">'+r.d+'</div><div style="font-size:10px;color:#5B9FD9;margin-top:2px">'+r.note+'</div></div><div style="text-align:right;flex-shrink:0;margin-left:8px"><div class="rc '+r.cls+'">'+r.v+'</div></div>';
    rl.appendChild(el);
  });
  st('od-shv-risks',score===0?'All clear':score<=2?'Low risk':score<=4?'Watch':score<=6?'High risk':'Critical');
  st('od-shv-risk',gv('od-sl-cb').toFixed(1)+'% CB · '+gv('od-sl-drop')+'% drop');
}

export async function loadOwnerLiveData(){
  if(G._ownerLiveLoading) return;
  G._ownerLiveLoading = true;
  const btn = document.getElementById('od-live-refresh');
  if(btn){ btn.textContent='↻ Loading…'; btn.disabled=true; }
  try{
    const [tkRes, evRes, usRes, rvRes] = await Promise.all([
      sb.from('tickets').select('price_per_ticket, total, purchased_at'),
      sb.from('events').select('id, price, start_time'),
      sb.from('users').select('id, created_at'),
      sb.from('rsvps').select('id, created_at'),
    ]);
    const tix   = tkRes.data || [];
    const evs   = evRes.data || [];
    const users = usRes.data || [];
    const rsvps = rvRes.data || [];

    const paid = tix.filter(t=>(t.price_per_ticket||0)>0);
    const free = tix.filter(t=>!((t.price_per_ticket||0)>0));
    const grossRev     = tix.reduce((s,t)=>s+(t.total||0),0);
    const feeRev       = paid.reduce((s,t)=>s+getCumulusFee(t.price_per_ticket||0),0);
    const stripeCosts  = paid.reduce((s,t)=>{
      const fee = getCumulusFee(t.price_per_ticket||0);
      return s + ((t.price_per_ticket||0) + fee)*0.015 + 0.20;
    },0);

    const now = new Date();
    const mStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const mTix  = tix.filter(t=>t.purchased_at && new Date(t.purchased_at)>=mStart);
    const mPaid = mTix.filter(t=>(t.price_per_ticket||0)>0);
    const mGross   = mTix.reduce((s,t)=>s+(t.total||0),0);
    const mFeeRev  = mPaid.reduce((s,t)=>s+getCumulusFee(t.price_per_ticket||0),0);

    G.ownerLiveData = {
      totalTickets: tix.length, paidTickets: paid.length, freeTickets: free.length,
      grossRev, feeRev, stripeCosts, netFeeRev: feeRev - stripeCosts,
      totalEvents: evs.length, paidEvents: evs.filter(e=>(e.price||0)>0).length,
      totalUsers: users.length, totalRsvps: rsvps.length,
      mTickets: mTix.length, mGross, mFeeRev,
      updatedAt: new Date(),
    };
    _renderOwnerLivePanel();
  }catch(err){
    console.error('Live data error:',err);
    const p=document.getElementById('od-live-panel');
    if(p) p.querySelector('.od-live-loading').textContent='Could not load data — check console.';
  }finally{
    G._ownerLiveLoading=false;
    const btn2=document.getElementById('od-live-refresh');
    if(btn2){ btn2.textContent='↻ Refresh'; btn2.disabled=false; }
  }
}

export function _renderOwnerLivePanel(){
  const panel = document.getElementById('od-live-panel');
  if(!panel || !G.ownerLiveData) return;
  const d = G.ownerLiveData;
  const fmt = n => n>=1000000?(n/1000000).toFixed(1)+'M':n>=1000?(n/1000).toFixed(1)+'k':String(n);
  const fmtGbp = n => { const abs=Math.abs(n); const s=abs>=1000?'£'+(abs/1000).toFixed(1)+'k':'£'+abs.toFixed(2); return n<0?'-'+s:s; };
  const ts = d.updatedAt.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'});
  const pct = (a,b) => b>0?(' ('+Math.round(a/b*100)+'%)'):'';

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
        <div><div class="od-live-rev-label">Stripe Processing Costs</div><div class="od-live-rev-sub">1.5% + 20p per transaction${pct(d.stripeCosts,d.feeRev)}</div></div>
        <div class="od-live-rev-val" style="color:#E24B4A;">-${fmtGbp(d.stripeCosts)}</div>
      </div>
      <div class="od-live-rev-row">
        <div><div class="od-live-rev-label" style="font-weight:700;color:var(--text);">Net Fee Revenue</div><div class="od-live-rev-sub">after processing costs</div></div>
        <div class="od-live-rev-val" style="color:${d.netFeeRev>=0?'#22C55E':'#E24B4A'};font-size:16px;">${fmtGbp(d.netFeeRev)}</div>
      </div>
    </div>

    ${d.mTickets>0||d.mGross>0?`
    <div class="od-live-month">
      <div class="od-live-month-label">This Month</div>
      <div class="od-live-month-stats">
        <div><div class="od-live-mstat-val">${d.mTickets}</div><div class="od-live-mstat-key">tickets</div></div>
        <div><div class="od-live-mstat-val" style="color:#22C55E;">${fmtGbp(d.mFeeRev)}</div><div class="od-live-mstat-key">fee revenue</div></div>
        <div><div class="od-live-mstat-val" style="color:var(--text-soft);">${fmtGbp(d.mGross)}</div><div class="od-live-mstat-key">gross</div></div>
      </div>
    </div>`:`
    <div style="text-align:center;padding:10px;font-size:12px;color:var(--text-muted);">No transactions this month yet</div>`}
  `;
}

export function openOwnerDash(){ pushNav(); state.view='owner-dash'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

export function openReview(){ pushNav(); state.view='review'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

export function openEventApprovals(){ pushNav(); state.view='event-approvals'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

export function _pendingEventKey(e){ return e.id!=null ? String(e.id) : (e.title||'')+'|'+(e.created_at||''); }

export async function clearAllTestData(confirmed){
  if(!confirmed){
    showConfirm(
      'Wipe all test data?',
      'This deletes every row in users, events, rsvps, tickets, chat_messages, and friends in Supabase. Seed events in the app are unaffected (they\'re hardcoded). Cannot be undone.',
      'Wipe everything',
      'clearAllTestData'
    );
    return;
  }
  showToast('Wiping…','info');
  try{
    await Promise.all([
      sb.from('chat_messages').delete().not('id','is',null),
      sb.from('rsvps').delete().not('id','is',null),
      sb.from('tickets').delete().not('id','is',null),
      sb.from('friends').delete().not('id','is',null),
    ]);
    await sb.from('events').delete().not('id','is',null);
    await sb.from('users').delete().not('id','is',null);
    showToast('All test data wiped. Signing out…','success');
    setTimeout(()=>resetProfile(true),1200);
  }catch(err){
    console.error('Wipe failed:',err);
    showToast('Wipe failed — check console','error');
  }
}

export async function clearAllUsers(confirmed){
  if(state.profileEmail!=='gondoxml@gmail.com'){ showToast('Owner only','error'); return; }
  if(!confirmed){
    if(!confirm('Delete ALL user accounts (every email) from the users table? Events and other data are kept. This cannot be undone.')) return;
  }
  showToast('Clearing user accounts…','info');
  try{
    const {error}=await sb.from('users').delete().not('id','is',null);
    if(error) throw error;
    showToast('All user accounts cleared. Signing out…','success');
    setTimeout(()=>resetProfile(true),1200);
  }catch(err){
    console.error('Clear users failed:',err);
    showToast('Clear failed — check console','error');
  }
}

export function toggleHostCat(cat) {
  const btn = document.querySelector(`[data-hostcat="${CSS.escape(cat)}"]`);
  if (G._hostCats.includes(cat)) {
    G._hostCats = G._hostCats.filter(c => c !== cat);
    if (btn) btn.classList.remove('active');
  } else {
    G._hostCats.push(cat);
    if (btn) btn.classList.add('active');
  }
}

export function openHost(){ state.view='host'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }