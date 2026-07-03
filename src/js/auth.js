import { G } from './globals.js';
import { EVENT_SEED, EVENTS, CATS, CAT_IMG, catImg, eventStatus, isHotEvent, generateUniqueId, codeFor, DEMO_PEOPLE, personByName, CARD_BG_STYLES, CARD_ACCENT_COLORS, CARD_THEMES, CARD_PATTERNS, LONDON_AREAS, CATEGORY_KEYWORDS, MILESTONE_BADGES, CATEGORY_BADGES, ALLROUNDER_BADGE, TOTAL_CATEGORIES, SPECIAL_BADGES, LEVELS, getLevel, INTEREST_PRESETS, CALENDAR_YEAR, CALENDAR_MONTH, MONTH_NAMES, WEEKDAY_LABELS, BLOT_SVG, EMAIL_PATTERN } from './constants.js';
import { sb } from './config.js';
import { validateCuratorCode, adminSendCode, adminVerifyCode, isAdminSession, isPerkUnlocked, distanceMeters, canCheckInAt } from './services.js';
import { applyMapChrome, resolveEventLocations, buildEventsGeoJSON, updateClusterPaint, attachMapLayers, syncHtmlMarkers, refreshMarkers, initLeaflet, initHostMap, handleAddressAutocomplete, selectSearchSuggestion, selectAutocompleteAddress, showMapLayer, persistGeocodeCache, geocodeAddress, openCardEditor, captureDraftFields, handleCardPhoto, removeCardPhoto, selectCardTheme, selectCardAccentColor, selectCardPattern, setPatternOpacity, toggleCardArea, updateCardPreview, renderCardEditor, switchCeTab, saveCard, initCardSheen, getCardExt, saveCardExt, openExpandedCard, closeExpandedCard, renderProfile, editProfile, updateAboutCounter, saveProfileAbout, toggleProfileInterest, getAllBadges, getFeaturedBadges, openBadgePicker, toggleFeaturedBadge, closeBadgePicker, renderAchievements, openAchievements, renderDetail, openEvent, checkInToEvent, promptCuratorUnlock, uploadNightShot, getFilteredEvents, toggleFriendsOnly, refreshFilters, pinTooltipHtml, renderPerkPanel, renderCalendar, openCalendarDay, renderCalendarDay, buildCalendarWeeks, openCalendar, getMyEvents, getMyCategories, getEventDay, toggleHotOnly, toggleLiveOnly, computeEventDates, loadFriends, addFriend, removeFriend, renderConnect, openFriends, openConnectGateway, openConnect, peekAttendee, closeAttendeePeek, toggleGoingSection, _buildChatMsgHtml, _appendChatMsg, sendChat, renderSocialTab, startChatCountdown, getUnreadSocialCount, openSocialForEvent, openSocialTab, setHostType, ticketTypes, renderBook, renderCheckout, renderConfirmed, renderMyTickets, processPayment, loadMyTickets, _insertTickets, openBook, openViewTicket, registerFree, afterRenderConfirmed, downloadICS, getCumulusFee, formatCardNumber, formatExpiry, openTicketsTab, renderTicketsTab, generateTicketId, getTicketForEvent, setBookingType, setBookingQty, proceedToCheckout, initOwnerDash, renderOwnerDash, renderHostPayoutsPanel, renderReview, loadAndRenderReview, _buildReviewCard, reviewHost, renderEventApprovals, loadAndRenderEventApprovals, _buildEventApprovalCard, decideEvent, _publishApprovedEvent, submitHostEvent, od_tog, _odPlatformFee, _odVatOnFee, _odStripeCost, _odBarCol, _odTierCls, _odSetBar, _odSetTier, _odCalcSupa, _odCalcMb, _odCalcEm, _odCalcVc, od_renderStaff, od_recalc, loadOwnerLiveData, _renderOwnerLivePanel, openOwnerDash, openReview, openEventApprovals, _pendingEventKey, clearAllTestData, clearAllUsers, toggleHostCat, openHost, showToast, showConfirm, setupReveal, renderNav, pushNav, goBack, renderView, closeActivePopup, goBrowse, setCategory, chatIsOpen, chatUnlockTime, pad2, markSocialSeen, medallionHtml, badgeCellHtml, trophyHtml, trophyCellHtml, resetProfile, getTheme, getBgStyle, resolveCardColors, geocodeBannerHtml } from './facade.js';


export function renderGate(prefillName,prefillEmail){
  document.getElementById('gate-root').innerHTML=`
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
      <div class="lp-cloud-layer" aria-hidden="true">
        <!-- Real cumulus photos drifting across the sky at staggered speeds/heights.
             Slow durations = calm, natural movement. Behind the skyline (z-order). -->
        <div class="lp-cld" style="top:6%; width:58vw;opacity:0.92;--dur:158s;--dly:-20s; --ar:2019/447; background-image:url('assets/clouds/cloud2.webp')"></div>
        <div class="lp-cld" style="top:19%;width:46vw;opacity:0.80;--dur:196s;--dly:-120s;--ar:1951/583; background-image:url('assets/clouds/cloud1.webp')"></div>
        <div class="lp-cld" style="top:11%;width:72vw;opacity:0.96;--dur:126s;--dly:-72s; --ar:2049/815; background-image:url('assets/clouds/cloud5.webp')"></div>
        <div class="lp-cld" style="top:33%;width:60vw;opacity:0.88;--dur:170s;--dly:-42s; --ar:2049/701; background-image:url('assets/clouds/cloud4.webp')"></div>
        <div class="lp-cld" style="top:45%;width:52vw;opacity:0.70;--dur:214s;--dly:-150s;--ar:2049/1152;background-image:url('assets/clouds/cloud3.webp')"></div>
        <div class="lp-cld" style="top:27%;width:80vw;opacity:0.90;--dur:138s;--dly:-98s; --ar:2019/447; background-image:url('assets/clouds/cloud2.webp')"></div>
        <div class="lp-cld" style="top:55%;width:68vw;opacity:0.82;--dur:182s;--dly:-14s; --ar:2049/815; background-image:url('assets/clouds/cloud5.webp')"></div>
      </div>
      <div class="lp-skyline" aria-hidden="true"></div>
      <div class="lp-hero-scrim" aria-hidden="true"></div>
      <div class="lp-hero-blobs">
        <div class="lp-blob lp-blob-a"></div>
        <div class="lp-blob lp-blob-b"></div>
        <div class="lp-blob lp-blob-c"></div>
      </div>
      <div class="lp-hero-content">
        <div class="lp-hero-kicker">
          <span class="lp-live-dot"></span>
          London · Invite-only social club
        </div>
        <h1 class="lp-hero-title">Find your people.<br><span class="lp-hero-gradient">Unlock the city.</span></h1>
        <p class="lp-hero-sub">Cumulus is London's members-only social club — a live map of the city's best-kept events. Every pin is visible; the perks behind them (guestlists, complimentary drinks, secret rooms) unlock with a curator code or a check-in at the door.</p>
        <div class="lp-hero-actions">
          <button class="btn lp-hero-btn-primary" onclick="showLpSignup()">Unlock the Map →</button>
          <button class="btn btn-outline lp-hero-btn-secondary" onclick="document.getElementById('lp-features-anchor').scrollIntoView({behavior:'smooth'})">How it works ↓</button>
        </div>
        <div class="lp-trust-strip">
          <span>Invite only</span>
          <span>Curator codes</span>
          <span>Secret guestlists</span>
          <span>Members' perks</span>
        </div>
      </div>
      <div class="lp-hero-scroll-hint" onclick="document.getElementById('lp-features-anchor').scrollIntoView({behavior:'smooth'})">
        <span>Scroll to explore</span>
        <div class="lp-scroll-arrow"></div>
      </div>
    </section>

    <!-- ── FEATURES ── -->
    <section class="lp-features" id="lp-features-anchor">
      <div style="text-align:center;margin-bottom:52px;">
        <div class="lp-section-kicker">Everything you need</div>
        <h2 class="lp-section-title">One pass. Your whole city.</h2>
      </div>
      <div class="lp-features-grid">
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/discover.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg></div>
          <div class="lp-feat-card-title">Discover locally</div>
          <div class="lp-feat-card-desc">Browse events happening in your neighbourhood — from jazz nights and gallery openings to supper clubs and community walks.</div>
        </div>
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/pass.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M20 4H4c-1.11 0-2 .89-2 2v12c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z"/></svg></div>
          <div class="lp-feat-card-title">Your digital pass</div>
          <div class="lp-feat-card-desc">A personalised card you carry to every event. Share your QR code to connect instantly with people you meet in person.</div>
        </div>
        <div class="lp-feat-card">
          <div class="lp-feat-photo" style="background-image:url('assets/img/connect.svg')"></div>
          <div class="lp-feat-card-icon"><svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg></div>
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
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg></div><div><div class="lp-feat-title">Map-first discovery</div><div class="lp-feat-desc">Your venue pinned and filterable across London's live event map.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 12c0-1.1.9-2 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2zm-6 3.5h-4v-2h4v2zm0-5h-4v-2h4v2z"/></svg></div><div><div class="lp-feat-title">Zero-fee ticketing</div><div class="lp-feat-desc">Hosts keep 100% of their price. Cumulus adds only a flat platform fee to the buyer — no percentage cuts, ever.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg></div><div><div class="lp-feat-title">Pre-event community</div><div class="lp-feat-desc">Attendees connect before they arrive — higher show rates, better energy.</div></div></div>
            <div class="lp-venue-feat"><div class="lp-feat-icon"><svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg></div><div><div class="lp-feat-title">Featured placement</div><div class="lp-feat-desc">Major events get priority placement across the Cumulus platform.</div></div></div>
          </div>
          <button class="btn lp-venues-cta" onclick="showLpSignup()">Get started — it's free →</button>
        </div>
        <div class="lp-venues-stats">
          <div class="lp-vstat"><div class="lp-vstat-num">100+</div><div class="lp-vstat-label">Active events</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">9</div><div class="lp-vstat-label">Categories</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">32</div><div class="lp-vstat-label">London boroughs</div></div>
          <div class="lp-vstat"><div class="lp-vstat-num">∞</div><div class="lp-vstat-label">Connections made</div></div>
        </div>
      </div>
    </section>

    <!-- ── COMMUNITY PROOF ── -->
    <section style="padding:80px 24px;background:var(--bg);position:relative;overflow:hidden;">
      <div style="max-width:860px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:52px;align-items:center;">
        <div>
          <div class="lp-join-eyebrow">Your community pass</div>
          <h2 class="lp-join-headline">This isn't about events.<br>It's about <em>your people.</em></h2>
          <p class="lp-join-body">Cumulus was built on one belief — the best things happen when people who live near each other actually meet. Not online. In the same room, at the same table, under the same open sky.</p>
          <div class="lp-join-proof" style="margin-top:24px;">
            <div class="lp-proof-avs">
              <div class="lp-proof-av" style="background:#6366F1;">A</div>
              <div class="lp-proof-av" style="background:#10B981;">P</div>
              <div class="lp-proof-av" style="background:#F97316;">T</div>
              <div class="lp-proof-av" style="background:#EC4899;">M</div>
              <div class="lp-proof-av" style="background:#8B5CF6;">J</div>
            </div>
            <span class="lp-proof-text">Londoners already building their community on Cumulus</span>
          </div>
          <button class="btn lp-hero-btn-primary" style="margin-top:28px;" onclick="showLpSignup()">Join them →</button>
        </div>
        <div class="lp-community-stack">
          <div class="lp-comm-card lp-comm-c1">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av" style="background:#6366F1;">AR</div>
              <div class="lp-comm-av" style="background:#10B981;">PS</div>
              <div class="lp-comm-av" style="background:#F97316;">TB</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Jazz in the Park</div>
              <div class="lp-comm-sub">Herne Hill · 40 going</div>
            </div>
            <div class="lp-comm-dot" style="background:#10B981;"></div>
          </div>
          <div class="lp-comm-card lp-comm-c2">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av" style="background:#EC4899;">ML</div>
              <div class="lp-comm-av" style="background:#8B5CF6;">JC</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Ceramics &amp; Chill</div>
              <div class="lp-comm-sub">Bermondsey · 25 going</div>
            </div>
            <div class="lp-comm-dot" style="background:#8B5CF6;"></div>
          </div>
          <div class="lp-comm-card lp-comm-c3">
            <div class="lp-comm-avatars">
              <div class="lp-comm-av" style="background:#EF4444;">SO</div>
              <div class="lp-comm-av" style="background:#D9A52E;">OW</div>
              <div class="lp-comm-av" style="background:#3B82F6;">CD</div>
              <div class="lp-comm-av lp-comm-av-more">+12</div>
            </div>
            <div class="lp-comm-text">
              <div class="lp-comm-title">Supper Club — Fulham</div>
              <div class="lp-comm-sub">Fulham · 26 going</div>
            </div>
            <div class="lp-comm-dot" style="background:#EF4444;"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── FOOTER ── -->
    <footer class="lp-footer">
      <div class="lp-nav-logo" style="margin-bottom:10px;">${BLOT_SVG}<span style="font-size:16px;font-weight:800;color:var(--text-muted);">Cumulus</span></div>
      <p style="font-size:12px;color:var(--text-muted);margin:0 0 10px;">London Community Events · ${new Date().getFullYear()}</p>
      <div style="display:flex;gap:18px;justify-content:center;flex-wrap:wrap;">
        <a href="/privacy" style="font-size:11px;color:var(--text-muted);text-decoration:none;opacity:0.65;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'">Privacy</a>
        <a href="/terms" style="font-size:11px;color:var(--text-muted);text-decoration:none;opacity:0.65;transition:opacity .15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.65'">Terms</a>
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
          <div class="lp-pass-card" id="lp-pass-preview-card" style="background:linear-gradient(140deg,var(--accent),var(--accent-deep));">
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

        <div class="lp-form-eyebrow" id="gate-form-eyebrow">Invite only · Takes 20 seconds</div>
        <h3 class="lp-form-title" id="gate-form-title">Request your access</h3>
        <p class="lp-form-sub" id="gate-form-sub">Cumulus is members-only. Enter your curator code to unlock the map — or check in at any venue to earn one.</p>

        <div class="gate-field" id="gate-name-field">
          <label class="gate-label" for="gate-name">Full name</label>
          <input id="gate-name" class="gate-input" placeholder="e.g. Alex Rivera" value="${escapeHtml(prefillName||'')}" autocomplete="name" oninput="lpUpdatePassName(this.value)"/>
        </div>
        <div class="gate-field">
          <label class="gate-label" for="gate-email">Email address</label>
          <input id="gate-email" class="gate-input" type="email" placeholder="you@email.com" value="${escapeHtml(prefillEmail||'')}" autocomplete="email"/>
        </div>
        <div class="gate-field" id="gate-curator-field">
          <label class="gate-label" for="gate-curator">Curator code</label>
          <input id="gate-curator" class="gate-input gate-curator-input" placeholder="CUR-XXXX-XXXX" autocomplete="off" spellcheck="false" oninput="this.value=this.value.toUpperCase()"/>
          <p class="gate-fineprint">A code from a Cumulus curator or venue host. No code yet? Check in at any listed venue to receive one.</p>
        </div>

        <!-- Host-only extra fields -->
        <div id="gate-host-fields" style="display:none;" class="gate-host-extra">
          <div class="gate-field">
            <label class="gate-label" for="gate-biz-name">Venue or business name</label>
            <input id="gate-biz-name" class="gate-input" placeholder="e.g. The Sketch House" autocomplete="organization"/>
          </div>
          <div class="gate-field-group-label">Event types you'd host</div>
          <div class="host-cat-grid" id="host-cat-grid">
            ${['Creative','Gaming','Movie Nights','Board Games','Meetups','Food &amp; Drink','Live Music','Wellness &amp; Outdoors','Tech &amp; Talks'].map(c=>`<button class="host-cat-chip" data-hostcat="${escapeHtml(c.replace(/&amp;/g,'&'))}" onclick="toggleHostCat('${escapeHtml(c.replace(/&amp;/g,'&'))}')">${c}</button>`).join('')}
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
  if(prefillName||prefillEmail) showLpSignup();

  document.getElementById('gate-name').addEventListener('keydown',e=>{ if(e.key==='Enter') document.getElementById('gate-email').focus(); });
  document.getElementById('gate-email').addEventListener('keydown',e=>{ if(e.key==='Enter') submitGate(); });

  requestAnimationFrame(()=>{
    document.querySelectorAll('.lp-venue-feat').forEach((el,i)=>{
      el.style.opacity='0'; el.style.transform='translateX(-12px)';
      const obs=new IntersectionObserver(entries=>{
        entries.forEach(e=>{ if(e.isIntersecting){ e.target.style.transition=`opacity 0.4s ease ${i*0.09}s, transform 0.4s ease ${i*0.09}s`; e.target.style.opacity='1'; e.target.style.transform='translateX(0)'; obs.unobserve(e.target); } });
      },{threshold:0.2});
      obs.observe(el);
    });
    document.querySelectorAll('.lp-feat-card').forEach((el,i)=>{
      el.style.opacity='0'; el.style.transform='translateY(20px)';
      const obs=new IntersectionObserver(entries=>{
        entries.forEach(e=>{ if(e.isIntersecting){ e.target.style.transition=`opacity 0.45s ease ${i*0.1}s, transform 0.45s cubic-bezier(0.22,1,0.36,1) ${i*0.1}s`; e.target.style.opacity='1'; e.target.style.transform='translateY(0)'; obs.unobserve(e.target); } });
      },{threshold:0.15});
      obs.observe(el);
    });
  });
}

export function switchAuthMode(mode) {
  G._authMode = mode;
  const isLogin = mode === 'login';
  document.getElementById('am-signup')?.classList.toggle('active', !isLogin);
  document.getElementById('am-login')?.classList.toggle('active', isLogin);
  // Sign-up-only sections (class beats CSS !important display via source order)
  const hide = (id, cond) => { const el = document.getElementById(id); if (el) el.classList.toggle('auth-hidden', cond); };
  hide('gate-type-sel', isLogin);
  hide('gate-name-field', isLogin);
  hide('gate-attendee-preview', isLogin || G._signupType === 'host');
  hide('gate-host-preview', isLogin || G._signupType !== 'host');
  hide('gate-host-fields', isLogin || G._signupType !== 'host');
  _updateCuratorVisibility();
  const eyebrow = document.getElementById('gate-form-eyebrow');
  const title   = document.getElementById('gate-form-title');
  const sub     = document.getElementById('gate-form-sub');
  const label   = document.getElementById('gate-claim-label');
  const trust   = document.getElementById('gate-trust-strip');
  if (isLogin) {
    if (eyebrow) eyebrow.textContent = 'Welcome back';
    if (title)   title.textContent   = 'Log in';
    if (sub)     sub.textContent     = 'Enter your email to pick up right where you left off.';
    if (label)   label.textContent   = 'Log in →';
    if (trust)   trust.innerHTML     = '<span>No password needed</span><span>·</span><span>Just your email</span>';
  } else {
    // Restore sign-up copy for the current attendee/host type
    switchSignupType(G._signupType);
  }
}

export function _updateCuratorVisibility() {
  const el = document.getElementById('gate-curator-field');
  if (el) el.style.display = (G._authMode === 'signup' && G._signupType === 'attendee') ? '' : 'none';
}

export function switchSignupType(type) {
  G._signupType = type;
  G._hostCats = [];
  document.getElementById('gt-attendee').classList.toggle('active', type === 'attendee');
  document.getElementById('gt-host').classList.toggle('active', type === 'host');
  document.getElementById('gate-attendee-preview').style.display = type === 'attendee' ? '' : 'none';
  document.getElementById('gate-host-preview').style.display = type === 'host' ? '' : 'none';
  document.getElementById('gate-host-fields').style.display = type === 'host' ? '' : 'none';
  _updateCuratorVisibility();
  const eyebrow = document.getElementById('gate-form-eyebrow');
  const title   = document.getElementById('gate-form-title');
  const sub     = document.getElementById('gate-form-sub');
  const label   = document.getElementById('gate-claim-label');
  const trust   = document.getElementById('gate-trust-strip');
  if (type === 'host') {
    if (eyebrow) eyebrow.textContent = 'Subject to review · Free to apply';
    if (title)   title.textContent   = 'Apply to host';
    if (sub)     sub.textContent     = 'Tell us about your events. Our team reviews every application to keep quality high on Cumulus.';
    if (label)   label.textContent   = 'Submit application →';
    if (trust)   trust.innerHTML     = '<span>Free to apply</span><span>·</span><span>Reviewed within 48 hrs</span><span>·</span><span>No lock-in</span>';
  } else {
    if (eyebrow) eyebrow.textContent = 'Invite only · Takes 20 seconds';
    if (title)   title.textContent   = 'Request your access';
    if (sub)     sub.textContent     = 'Cumulus is members-only. Enter your curator code to unlock the map — or check in at any venue to earn one.';
    if (label)   label.textContent   = 'Unlock the map →';
    if (trust)   trust.innerHTML     = '<span>Discreet, always</span><span>·</span><span>Members keep 100%</span><span>·</span><span>Leave anytime</span>';
  }
  // Reset chip selections
  document.querySelectorAll('.host-cat-chip').forEach(c => c.classList.remove('active'));
}

export function showLpSignup(mode){
  const ov=document.getElementById('lp-signup-overlay');
  if(ov){ ov.classList.add('open'); document.body.style.overflow='hidden'; }
  switchAuthMode(mode==='login'?'login':'signup');
}

export function closeLpSignup(){
  const ov=document.getElementById('lp-signup-overlay');
  if(ov){ ov.classList.remove('open'); document.body.style.overflow=''; }
}

export function lpUpdatePassName(val){
  const el=document.getElementById('lp-pass-name-preview');
  if(el) el.textContent=val.trim()||'Your name here';
}

export function _cacheSession(){
  try{
    localStorage.setItem('cumulus_session', JSON.stringify({
      userId: state.userId, profileId: state.profileId,
      name: state.profileName, email: state.profileEmail,
      specialBadges: state.specialBadges||[], theme: state.theme
    }));
  }catch(e){}
}

export function _restoreUserFromRow(existing){
  state.userId=existing.id;
  state.profileId=existing.profile_id||generateUniqueId();
  state.profileName=existing.name;
  state.profileEmail=existing.email;
  state.specialBadges=existing.special_badges||[];
  state.theme=existing.theme||'light';
  applyTheme();
  if(existing.card_bio||existing.card_theme){
    state.myCard={name:existing.name,theme:existing.card_theme||'crimson',bio:existing.card_bio||'',interests:existing.card_interests||'',fact:existing.card_fact||''};
  }
}

export async function submitGate(){
  const isLogin = G._authMode === 'login';
  const email=(document.getElementById('gate-email').value||'').trim();
  const name=isLogin ? '' : (document.getElementById('gate-name').value||'').trim();
  const errEl=document.getElementById('gate-field-error');
  if(errEl) errEl.classList.remove('show');
  if(!isLogin && !name){ gateErr('Please add your name.'); return; }
  if(!EMAIL_PATTERN.test(email)){ gateErr('Please enter a valid email address.'); return; }

  // Host-specific validation (sign up only)
  let bizName='', hostDesc='', whyHost='';
  if(!isLogin && G._signupType==='host'){
    bizName=(document.getElementById('gate-biz-name')?.value||'').trim();
    hostDesc=(document.getElementById('gate-host-desc')?.value||'').trim();
    whyHost=(document.getElementById('gate-why-host')?.value||'').trim();
    if(!bizName){ gateErr('Please enter your venue or business name.'); return; }
    if(G._hostCats.length===0){ gateErr('Please select at least one event type.'); return; }
    if(!hostDesc){ gateErr('Please add a brief description of your events.'); return; }
  }

  // Curator code — read here, validated below only once we know this is a
  // brand-new attendee (existing members logging back in don't need one).
  const curatorCode = (!isLogin && G._signupType==='attendee')
    ? (document.getElementById('gate-curator')?.value||'').trim() : '';

  // Show loading state
  const btn=document.querySelector('.lp-claim-btn');
  const resetBtn=(labelText)=>{ if(btn){ btn.disabled=false; btn.querySelector('#gate-claim-label').textContent=labelText; } };
  if(btn){ btn.disabled=true; btn.querySelector('#gate-claim-label').textContent=isLogin?'Logging in…':'Setting up…'; }

  // Look up the account by email
  let existing=null;
  try{ const r=await sb.from('users').select('*').eq('email',email).single(); existing=r.data; }
  catch(e){ existing=null; }

  if(isLogin){
    // LOGIN — account must already exist
    if(!(existing&&existing.name)){
      resetBtn('Log in →');
      gateErr('No account found for that email. Switch to Sign up to create one.');
      return;
    }
    _restoreUserFromRow(existing);
  } else if(existing&&existing.name){
    // SIGN UP with an email that already has an account — just log them back in
    _restoreUserFromRow(existing);
    showToast('Welcome back — you already have an account','info');
  } else {
    // NEW member — members-only gate: a new attendee needs a valid curator
    // code (a venue check-in is the alternative way in, handled in-app).
    if(G._signupType==='attendee'){
      const cur = await validateCuratorCode(curatorCode);
      if(!cur.valid){
        resetBtn('Unlock the map →');
        gateErr(cur.reason==='inactive' ? 'That curator code is no longer active — ask your host for a current one.'
          : cur.reason==='unknown' ? "We don't recognise that curator code. Check it, or check in at a venue to receive one."
          : 'Enter a valid curator code (CUR-XXXX-XXXX), or check in at a venue to receive one.');
        return;
      }
      state.curatorVerified = true;
      state.curatorCode = cur.code;
      state.curatorTier = cur.tier || 'standard';
    }
    // NEW user — create in Supabase
    state.profileName=name;
    state.profileEmail=email;
    state.specialBadges=[];
    state.profileId=generateUniqueId();
    try{
      const {data:created,error}=await sb.from('users').insert({
        name,email,profile_id:state.profileId,special_badges:[],theme:'light'
      }).select().single();
      if(error) throw error;
      if(created) state.userId=created.id;
    }catch(e){
      console.error('Sign up failed:',e);
      resetBtn('Unlock the map →');
      gateErr('Could not create your account — please try again.');
      return;
    }
  }

  // Cache session locally (email + lightweight snapshot for offline restore)
  await localSet('cumulus_email',email);
  await localSet('prefs',JSON.stringify({theme:state.theme}));
  _cacheSession();

  // Host application flow (sign up only)
  if(!isLogin && G._signupType==='host'){
    await _submitHostApplication({name,email,bizName,hostDesc,whyHost});
    return;
  }

  document.body.style.overflow='';
  document.getElementById('gate-root').innerHTML='';
  enterApp();
}

export async function _submitHostApplication(args){ const {name,email,bizName,hostDesc,whyHost} = args;
  const appPayload={
    name, email,
    user_id: state.userId||null,
    business_name: bizName,
    event_types: G._hostCats.join(','),
    description: hostDesc,
    why_host: whyHost,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  // Try Supabase first; fall back to localStorage
  let savedToDb=false;
  try{
    const {error}=await sb.from('host_applications').insert(appPayload);
    if(!error) savedToDb=true;
  }catch(e){}

  if(!savedToDb){
    try{
      const apps=JSON.parse(localStorage.getItem('host_applications_local')||'[]');
      apps.push({...appPayload, id: 'local_'+Date.now()});
      localStorage.setItem('host_applications_local',JSON.stringify(apps));
    }catch(e){}
  }

  // Show success screen inside modal
  const modal=document.querySelector('.lp-signup-modal');
  if(modal){
    modal.innerHTML=`
      <div class="gate-host-success">
        <div class="gate-host-success-icon">🎉</div>
        <div class="gate-host-success-title">Application submitted!</div>
        <div class="gate-host-success-sub">Thanks ${escapeHtml(name)} — we'll review your application and get back to you within 48 hours. In the meantime, you can explore Cumulus as an attendee.</div>
        <button class="btn" style="width:100%;margin-top:24px;" onclick="document.body.style.overflow='';document.getElementById('gate-root').innerHTML='';enterApp();">Explore Cumulus →</button>
      </div>`;
  }
}

export async function signOut(confirmed){
  if(!confirmed){ showConfirm('Sign out?','You\'ll return to the welcome screen. Your data is saved.','Sign out','signOut'); return; }
  // Clear any Supabase auth session (defensive — harmless if none is active,
  // and future-proofs a move to real sb.auth without leaving a token behind).
  try{ await sb.auth.signOut(); }catch(e){}
  // Clear local session cache
  try{ localStorage.removeItem('cumulus_email'); }catch(e){}
  try{ localStorage.removeItem('cumulus_session'); }catch(e){}
  try{ localStorage.removeItem('prefs'); }catch(e){}
  // Unsubscribe from all realtime channels
  Object.values(G.chatSubscriptions).forEach(sub=>{ try{ sb.removeChannel(sub); }catch(e){} });
  Object.keys(G.chatSubscriptions).forEach(k=>delete G.chatSubscriptions[k]);
  // Reset in-memory state
  state.userId=null; state.profileName=''; state.profileEmail=''; state.profileId=null;
  state.specialBadges=[]; state.myCard=null; state.friends=[]; state.editingProfile=false;
  state.view='browse'; state.rsvps={}; state.chats={}; G.myTickets=[];
  destroyMainMap(); destroyHostMap();
  document.getElementById('app').style.display='none';
  document.getElementById('nav-container').innerHTML=''; document.getElementById('view-container').innerHTML='';
  renderGate();
}

export function enterApp() {
  const app = document.getElementById('app');
  app.style.display = '';
  // Always boot to the map — never restore a stale tab from memory
  state.view = 'browse';
  EVENTS.forEach(ev => computeEventDates(ev));
  renderNav();
  renderView();
  // Load real data in the background without blocking
  initApp();
}

export async function promptAdminSignIn(){
  const email = (prompt('Admin email (owner):', state.profileEmail||'')||'').trim();
  if(!email) return;
  showToast('Sending a one-time code…','info');
  const sent = await adminSendCode(email);
  if(!sent.ok){ showToast(sent.error==='unavailable'?'Auth unavailable right now':('Could not send code — '+(sent.error||'error')),'error'); return; }
  const code = (prompt('Enter the 6-digit code sent to '+email+':')||'').trim();
  if(!code) return;
  const res = await adminVerifyCode(email, code);
  const sub=document.getElementById('admin-auth-sub');
  if(res.ok && res.isAdmin){ showToast('Admin verified — approvals unlocked','success'); if(sub) sub.textContent='Verified admin session active'; }
  else if(res.ok){ showToast('Signed in, but this account is not an admin','error'); }
  else { showToast('Verification failed — '+(res.error||'error'),'error'); }
}

export async function persistProfile(){
  if(!state.profileId) state.profileId=generateUniqueId();
  const payload={
    name: state.profileName,
    email: state.profileEmail,
    profile_id: state.profileId,
    special_badges: state.specialBadges,
    theme: state.theme,
    card_theme: state.myCard?.theme||'crimson',
    card_bio: state.myCard?.bio||'',
    card_interests: state.myCard?.interests||'',
    card_fact: state.myCard?.fact||''
  };
  if(state.userId) payload.id=state.userId;
  const {data,error}=await sb.from('users').upsert(payload,{onConflict:'email'}).select().single();
  if(data&&data.id) state.userId=data.id;
}