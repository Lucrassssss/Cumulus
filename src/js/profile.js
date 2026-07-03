import { G } from './globals.js';
import { EVENT_SEED, EVENTS, CATS, CAT_IMG, catImg, eventStatus, isHotEvent, generateUniqueId, codeFor, DEMO_PEOPLE, personByName, CARD_BG_STYLES, CARD_ACCENT_COLORS, CARD_THEMES, CARD_PATTERNS, LONDON_AREAS, CATEGORY_KEYWORDS, MILESTONE_BADGES, CATEGORY_BADGES, ALLROUNDER_BADGE, TOTAL_CATEGORIES, SPECIAL_BADGES, LEVELS, getLevel, INTEREST_PRESETS, CALENDAR_YEAR, CALENDAR_MONTH, MONTH_NAMES, WEEKDAY_LABELS, BLOT_SVG, EMAIL_PATTERN } from './constants.js';
import { sb } from './config.js';
import { validateCuratorCode, adminSendCode, adminVerifyCode, isAdminSession, isPerkUnlocked, distanceMeters, canCheckInAt } from './services.js';
import { renderGate, switchAuthMode, _updateCuratorVisibility, switchSignupType, showLpSignup, closeLpSignup, lpUpdatePassName, _cacheSession, _restoreUserFromRow, submitGate, _submitHostApplication, signOut, enterApp, promptAdminSignIn, persistProfile, applyMapChrome, resolveEventLocations, buildEventsGeoJSON, updateClusterPaint, attachMapLayers, syncHtmlMarkers, refreshMarkers, initLeaflet, initHostMap, handleAddressAutocomplete, selectSearchSuggestion, selectAutocompleteAddress, showMapLayer, persistGeocodeCache, geocodeAddress, renderDetail, openEvent, checkInToEvent, promptCuratorUnlock, uploadNightShot, getFilteredEvents, toggleFriendsOnly, refreshFilters, pinTooltipHtml, renderPerkPanel, renderCalendar, openCalendarDay, renderCalendarDay, buildCalendarWeeks, openCalendar, getMyEvents, getMyCategories, getEventDay, toggleHotOnly, toggleLiveOnly, computeEventDates, loadFriends, addFriend, removeFriend, renderConnect, openFriends, openConnectGateway, openConnect, peekAttendee, closeAttendeePeek, toggleGoingSection, _buildChatMsgHtml, _appendChatMsg, sendChat, renderSocialTab, startChatCountdown, getUnreadSocialCount, openSocialForEvent, openSocialTab, setHostType, ticketTypes, renderBook, renderCheckout, renderConfirmed, renderMyTickets, processPayment, loadMyTickets, _insertTickets, openBook, openViewTicket, registerFree, afterRenderConfirmed, downloadICS, getCumulusFee, formatCardNumber, formatExpiry, openTicketsTab, renderTicketsTab, generateTicketId, getTicketForEvent, setBookingType, setBookingQty, proceedToCheckout, initOwnerDash, renderOwnerDash, renderHostPayoutsPanel, renderReview, loadAndRenderReview, _buildReviewCard, reviewHost, renderEventApprovals, loadAndRenderEventApprovals, _buildEventApprovalCard, decideEvent, _publishApprovedEvent, submitHostEvent, od_tog, _odPlatformFee, _odVatOnFee, _odStripeCost, _odBarCol, _odTierCls, _odSetBar, _odSetTier, _odCalcSupa, _odCalcMb, _odCalcEm, _odCalcVc, od_renderStaff, od_recalc, loadOwnerLiveData, _renderOwnerLivePanel, openOwnerDash, openReview, openEventApprovals, _pendingEventKey, clearAllTestData, clearAllUsers, toggleHostCat, openHost, showToast, showConfirm, setupReveal, renderNav, pushNav, goBack, renderView, closeActivePopup, goBrowse, setCategory, chatIsOpen, chatUnlockTime, pad2, markSocialSeen, medallionHtml, badgeCellHtml, trophyHtml, trophyCellHtml, resetProfile, getTheme, getBgStyle, resolveCardColors, geocodeBannerHtml } from './facade.js';


export function openCardEditor(eventId){
  G.cardEditorEventId=eventId??null;
  const ex=state.myCard;
  // Load extended fields from localStorage
  let ext={};
  try{ const r=localStorage.getItem('card_ext:'+state.profileName); if(r) ext=JSON.parse(r); }catch(e){}
  let savedPhoto='';
  try{ savedPhoto=localStorage.getItem('card_photo:'+state.profileName)||''; }catch(e){}
  const savedBg=ext.bgStyle||ex?.theme||'obsidian';
  const savedAccent=ext.accentColor||ex?.accentColor||'#CBA43A';
  const savedOpacity=ext.patternOpacity!=null?ext.patternOpacity:0.35;
  G.cardDraft=ex
    ?{theme:savedBg,bgStyle:savedBg,accentColor:savedAccent,pattern:ext.pattern||'lightning',patternOpacity:savedOpacity,bio:ex.bio||'',interests:ex.interests||'',fact:ex.fact||'',motto:ext.motto||'',photo:savedPhoto,areas:ext.areas||[]}
    :{theme:'obsidian',bgStyle:'obsidian',accentColor:'#CBA43A',pattern:'constellation',patternOpacity:0.35,bio:'',interests:'',fact:'',motto:'',photo:savedPhoto,areas:ext.areas||[]};
  renderCardEditor();
}

export function captureDraftFields(){
  const b=document.getElementById('card-bio'); if(b) G.cardDraft.bio=b.value;
  const i=document.getElementById('card-interests'); if(i) G.cardDraft.interests=i.value;
  const f=document.getElementById('card-fact'); if(f) G.cardDraft.fact=f.value;
  const m=document.getElementById('card-motto'); if(m) G.cardDraft.motto=m.value;
}

export function handleCardPhoto(input){
  const file=input.files&&input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=function(e){
    // Resize to max 480px to keep localStorage size manageable
    const img=new Image();
    img.onload=function(){
      const MAX=480;
      let w=img.width, h=img.height;
      if(w>h){ if(w>MAX){h=Math.round(h*MAX/w);w=MAX;} } else { if(h>MAX){w=Math.round(w*MAX/h);h=MAX;} }
      const canvas=document.createElement('canvas'); canvas.width=w; canvas.height=h;
      canvas.getContext('2d').drawImage(img,0,0,w,h);
      G.cardDraft.photo=canvas.toDataURL('image/jpeg',0.78);
      // Update zone UI without full re-render
      const zone=document.getElementById('ce-photo-zone');
      if(zone) zone.innerHTML=`<input type="file" id="ce-photo-input" accept="image/*" onchange="handleCardPhoto(this)"/>
        <img src="${G.cardDraft.photo}" class="ce-photo-about-img" id="ce-photo-img" alt=""/>
        <div class="ce-photo-about-lbl">Tap to change<span>Shows in your card corner</span></div>
        <button class="ce-photo-remove" style="margin-left:auto;font-size:10px;" onclick="event.stopPropagation();removeCardPhoto()">Remove</button>`;
    };
    img.src=e.target.result;
  };
  reader.readAsDataURL(file);
}

export function removeCardPhoto(){
  G.cardDraft.photo='';
  try{ localStorage.removeItem('card_photo:'+state.profileName); }catch(e){}
  const zone=document.getElementById('ce-photo-zone');
  if(zone) zone.innerHTML=`<input type="file" id="ce-photo-input" accept="image/*" onchange="handleCardPhoto(this)"/>
    <div style="width:48px;height:48px;border-radius:50%;background:var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="opacity:0.45;"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
    </div>
    <div class="ce-photo-about-lbl">Add photo<span>Shows in your card corner</span></div>`;
}

export function selectCardTheme(id){
  captureDraftFields();
  G.cardDraft.theme=id; G.cardDraft.bgStyle=id;
  updateCardPreview();
  document.querySelectorAll('.cc-style-btn').forEach(b=>b.classList.toggle('active',b.dataset.id===id));
}

export function selectCardAccentColor(hex, id){
  captureDraftFields();
  G.cardDraft.accentColor=hex;
  updateCardPreview();
  document.querySelectorAll('.cc-swatch').forEach(b=>b.classList.toggle('active',b.dataset.id===id));
}

export function selectCardPattern(pat){
  captureDraftFields();
  G.cardDraft.pattern=pat;
  updateCardPreview();
  document.querySelectorAll('.cc-pattern-btn').forEach(b=>b.classList.toggle('active',b.dataset.pat===pat));
}

export function setPatternOpacity(val){
  G.cardDraft.patternOpacity=parseFloat(val);
  const pat=document.getElementById('ce-pattern');
  if(pat) pat.style.opacity=G.cardDraft.patternOpacity;
  const lbl=document.getElementById('ce-opacity-val');
  if(lbl) lbl.textContent=Math.round(G.cardDraft.patternOpacity*100)+'%';
}

export function toggleCardArea(area){
  const idx=G.cardDraft.areas.indexOf(area);
  if(idx!==-1){ G.cardDraft.areas.splice(idx,1); }
  else if(G.cardDraft.areas.length<3){ G.cardDraft.areas.push(area); }
  // Patch pills without re-render
  document.querySelectorAll('.ce-area-pill').forEach(btn=>{
    const a=btn.dataset.area;
    const sel=G.cardDraft.areas.includes(a);
    btn.classList.toggle('active',sel);
    btn.disabled=!sel&&G.cardDraft.areas.length>=3;
  });
  const hint=document.getElementById('ce-area-hint');
  if(hint) hint.textContent=`${G.cardDraft.areas.length}/3 selected${G.cardDraft.areas.length===3?' · tap to deselect':''}`;
  const det=document.getElementById('ce-preview-detail');
  if(det) det.textContent=G.cardDraft.areas.length?G.cardDraft.areas.join(' · '):'London Community Member';
}

export function updateCardPreview(){
  const t=resolveCardColors(G.cardDraft.bgStyle||G.cardDraft.theme, G.cardDraft.accentColor);
  const el=document.getElementById('ce-live-card');
  if(!el) return;
  el.style.background=t.bg;
  el.style.color=t.text;
  el.style.borderColor=t.border;
  const pat=document.getElementById('ce-pattern');
  if(pat){ pat.style.color=t.accent; pat.style.opacity=G.cardDraft.patternOpacity||0.18; pat.innerHTML=CARD_PATTERNS[G.cardDraft.pattern]||''; }
  const nm=document.getElementById('ce-preview-name');
  if(nm) nm.style.color=t.text;
  const ac=document.getElementById('ce-preview-accent');
  if(ac) ac.style.background=t.accent;
  const bio=document.getElementById('card-bio');
  const pbio=document.getElementById('ce-preview-bio');
  if(pbio&&bio){ pbio.textContent=bio.value||'Tell your story…'; pbio.style.color=t.textSoft; }
  const motto=document.getElementById('card-motto');
  const pmotto=document.getElementById('ce-preview-motto');
  if(pmotto&&motto){ pmotto.textContent=motto.value?`"${motto.value}"`:''; pmotto.style.color=t.accent; }
  const tags=document.getElementById('ce-preview-tags');
  const int=document.getElementById('card-interests');
  if(tags&&int){
    const items=(int.value||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,5);
    tags.innerHTML=items.map(s=>`<span class="ce-preview-tag" style="border-color:${t.accent};color:${t.text};">${escapeHtml(s)}</span>`).join('');
  }
  const lbl=document.getElementById('ce-preview-label');
  if(lbl) lbl.style.color=t.textSoft;
  const det=document.getElementById('ce-preview-detail');
  if(det){ det.style.color=t.textSoft; det.textContent=G.cardDraft.areas.length?G.cardDraft.areas.join(' · '):'London Community Member'; }
  const wm=document.getElementById('ce-preview-wm');
  if(wm) wm.style.color=t.accent;
  const ph=document.getElementById('ce-preview-photo');
  if(ph&&ph.tagName==='IMG'){ ph.style.borderColor=t.accent; }
}

export function renderCardEditor(){
  const allowSkip=G.cardEditorEventId!==null;
  const t=resolveCardColors(G.cardDraft.bgStyle||G.cardDraft.theme, G.cardDraft.accentColor);

  // Build color swatch grid by color family
  const colorFamilies=[
    {label:'Blues',           ids:['sky','blue','cobalt-ac','sapphire','navy','ice','periwinkle','cerulean','steel','powder','azure','denim-ac','ocean-ac','cobalt-light','powder-deep']},
    {label:'Purples',         ids:['violet','purple','lavender','indigo','grape','mauve','lilac','heather','amethyst-ac','byzantium','wisteria','aubergine-ac','orchid-ac']},
    {label:'Pinks & Reds',    ids:['hot-pink','rose-ac','crimson-ac','coral','blush-ac','magenta','scarlet','flamingo','salmon','ruby','candy','cherry-ac','bubblegum','cerise','carnation']},
    {label:'Oranges & Yellows',ids:['amber','gold','tangerine','peach','copper-ac','honey','sunshine','butter','saffron','apricot','mustard','burnt-orange','lemon','goldenrod']},
    {label:'Greens',          ids:['emerald','mint','jade-ac','sage-ac','lime','teal','seafoam','moss','forest-ac','olive','lime-green','pine-green','viridian','sage-green','hunter']},
    {label:'Warm Tones',      ids:['terracotta','brick','rust','bronze','hazel','maple','cinnamon']},
    {label:'Cool Tones',      ids:['slate-blue-ac','arctic-ac','powder-blue','muted-teal','seafoam-deep','mint-fresh','glacier']},
    {label:'Neutrals',        ids:['white','silver','platinum','champagne','sand','slate-ac','warm-white','oyster','stone','pewter','graphite-ac']},
    {label:'Metallics',       ids:['gold-foil','rose-gold-ac','neon-cyan']},
  ];
  const colorSwatchesHtml=colorFamilies.map(fam=>`
    <div class="cc-family-label">${fam.label}</div>
    <div class="cc-color-grid">
      ${fam.ids.map(cid=>{
        const c=CARD_ACCENT_COLORS.find(x=>x.id===cid); if(!c) return '';
        const isActive=G.cardDraft.accentColor===c.hex;
        return `<button class="cc-swatch${isActive?' active':''}" data-id="${c.id}" title="${c.name}"
          style="background:${c.hex};"
          onclick="selectCardAccentColor('${c.hex}','${c.id}')">
          <span class="cc-swatch-label">${c.name}</span>
        </button>`;
      }).join('')}
    </div>`).join('');

  // Build background style grid
  const styleFamilies=[
    {label:'Dark Tones',    ids:['midnight','obsidian','charcoal','slate','ink','abyss','noir','volcanic','cosmos','carbon','graphite','pitch','nightfall','anthracite','void']},
    {label:'Light Tones',   ids:['cloud','pearl','cream','cotton','frost','linen-bg','chalk','mist','blush','sage-light','snow','ivory','eggshell','lilac-mist','peach-mist']},
    {label:'Rich & Deep',   ids:['ocean','forest','cherry','cobalt','jade','amber-dark','plum','crimson','denim','copper-bg','burgundy','pine','aubergine','mahogany','steel-dark']},
    {label:'Gradient Moods',ids:['aurora','sunset','twilight','deepspace','summer','arctic','jungle','lagoon','fire','violet-storm','ember','northern-lights','galaxy','bloom','citrus','rose-gold','forest-floor','prism','vapor','mango-glow','midnight-ocean','magma','royal-purple','deep-teal','spring','arctic-dawn','amethyst','deep-rose','peach-glow','forest-night']},
    {label:'Cloud Classics',ids:['storm','nimbus','electric','thunder','cirrus','dusk','overcast','haze','squall','altitude']},
    {label:'Vintage & Warm',ids:['sepia','warm-stone','terracotta-bg','parchment','antique','washed-denim','dusty-rose','harvest','cedar','tobacco','wheat','clay','bourbon','sand-dune','amber-cream']},
  ];
  const styleGridHtml=styleFamilies.map(fam=>`
    <div class="cc-family-label">${fam.label}</div>
    <div class="cc-style-grid">
      ${fam.ids.map(sid=>{
        const s=CARD_BG_STYLES.find(x=>x.id===sid); if(!s) return '';
        const isActive=(G.cardDraft.bgStyle||G.cardDraft.theme)===s.id;
        const nameColor=s.dark?'rgba(255,255,255,0.85)':'rgba(0,0,0,0.72)';
        return `<button class="cc-style-btn${isActive?' active':''}" data-id="${s.id}"
          onclick="selectCardTheme('${s.id}')" title="${s.name}">
          <div class="cc-style-preview" style="background:${s.bg};">
            <span class="cc-style-name" style="color:${nameColor};">${s.name}</span>
          </div>
        </button>`;
      }).join('')}
    </div>`).join('');

  // Pattern grid — vibrant (opacity controlled by slider)
  const patternOptions=[
    {id:'none',          label:'✕  None'},
    {id:'lines',         label:'// Lines'},
    {id:'mesh',          label:'⊞ Mesh'},
    {id:'dots',          label:'· Dots'},
    {id:'grid',          label:'⊟ Grid'},
    {id:'diagonal',      label:'⟋ Diagonal'},
    {id:'zigzag',        label:'⟨⟩ Zigzag'},
    {id:'dashes',        label:'— Dashes'},
    {id:'halftone',      label:'⠿ Halftone'},
    {id:'hexgrid',       label:'⬡ Hex'},
    {id:'topo',          label:'⌇ Topo'},
    {id:'triangles',     label:'△ Triangles'},
    {id:'constellation', label:'✦ Stars'},
    {id:'blueprint',     label:'⊕ Blueprint'},
    {id:'waves',         label:'∿ Waves'},
    {id:'marble',        label:'⌁ Marble'},
    {id:'sparkle',       label:'✴ Sparkle'},
    {id:'circuits',      label:'⊛ Circuit'},
    {id:'plus',          label:'+ Plus'},
    {id:'rings',         label:'◎ Rings'},
    {id:'sunburst',      label:'☀ Rays'},
    {id:'petals',        label:'❀ Petals'},
    {id:'cobweb',        label:'⊙ Cobweb'},
    {id:'linen',         label:'▦ Weave'},
  ];
  const patternTabHtml=`<div class="cc-pattern-grid">
    ${patternOptions.map(p=>`<button class="cc-pattern-btn${G.cardDraft.pattern===p.id?' active':''}" data-pat="${p.id}" onclick="selectCardPattern('${p.id}')">${p.label}</button>`).join('')}
  </div>`;

  const areaPillsHtml=LONDON_AREAS.map(a=>{
    const sel=G.cardDraft.areas.includes(a);
    const disabled=!sel&&G.cardDraft.areas.length>=3;
    return `<button class="ce-area-pill${sel?' active':''}" data-area="${escapeHtml(a)}" onclick="toggleCardArea('${escapeHtml(a)}')" ${disabled?'disabled':''}>${escapeHtml(a)}</button>`;
  }).join('');

  const liveCardHtml=`<div class="ce-live-card" id="ce-live-card" style="background:${t.bg};border-color:${t.border};">
    <div class="ce-pattern" id="ce-pattern" style="color:${t.accent};opacity:${G.cardDraft.patternOpacity||0.35};">${CARD_PATTERNS[G.cardDraft.pattern]||''}</div>
    ${G.cardDraft.photo?`<img src="${G.cardDraft.photo}" id="ce-preview-photo" style="position:absolute;top:0;right:0;width:56px;height:56px;object-fit:cover;border-radius:0 6px 0 10px;border-left:1.5px solid ${t.accent};border-bottom:1.5px solid ${t.accent};z-index:3;" alt=""/>`:
      `<div id="ce-preview-photo"></div>`}
    <div class="ce-card-shine"></div>
    <div class="ce-card-body">
      <div class="ce-card-top-row">
        <div>
          <div class="ce-preview-label" id="ce-preview-label" style="color:${t.textSoft};">// Cumulus Pass</div>
          <div class="ce-preview-accent" id="ce-preview-accent" style="background:${t.accent};"></div>
        </div>
      </div>
      <div class="ce-preview-name" id="ce-preview-name" style="color:${t.text};">${escapeHtml(state.profileName||'Your Name')}</div>
      <div class="ce-preview-motto" id="ce-preview-motto" style="color:${t.accent};">${G.cardDraft.motto?`"${escapeHtml(G.cardDraft.motto)}"`:''}</div>
      <div class="ce-preview-bio" id="ce-preview-bio" style="color:${t.textSoft};">${G.cardDraft.bio||'Tell your story…'}</div>
      <div class="ce-preview-tags" id="ce-preview-tags">
        ${(G.cardDraft.interests||'').split(',').map(s=>s.trim()).filter(Boolean).slice(0,5).map(s=>`<span class="ce-preview-tag" style="border-color:${t.accent};color:${t.text};">${escapeHtml(s)}</span>`).join('')}
      </div>
      <div class="ce-preview-detail" id="ce-preview-detail" style="color:${t.textSoft};">${G.cardDraft.areas.length?G.cardDraft.areas.join(' · '):'London Community Member'}</div>
    </div>
    <div class="ce-preview-wm" id="ce-preview-wm" style="color:${t.accent};">CU</div>
  </div>`;

  document.getElementById('card-editor-root').innerHTML=`
  <div class="ce-overlay">

    <!-- Top bar -->
    <div class="ce-topbar">
      <button class="ce-topbar-back" onclick="closeCardEditor()">←</button>
      <div class="ce-topbar-title">Card builder</div>
      <div style="display:flex;gap:6px;align-items:center;">
        ${allowSkip?`<button class="ce-topbar-skip" onclick="skipCard()">Skip</button>`:''}
        <button class="ce-topbar-save" onclick="saveCard()">Save</button>
      </div>
    </div>

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
          ${allowSkip
            ?`<button class="btn btn-outline" onclick="skipCard()">Skip</button>`
            :`<button class="btn btn-outline" onclick="closeCardEditor()">Cancel</button>`}
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
                value="${G.cardDraft.patternOpacity||0.35}"
                style="flex:1;accent-color:var(--accent);cursor:pointer;"
                oninput="setPatternOpacity(this.value)"/>
              <span class="ce-intensity-pct" id="ce-opacity-val">${Math.round((G.cardDraft.patternOpacity||0.35)*100)}%</span>
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
              ${G.cardDraft.photo
                ?`<img src="${G.cardDraft.photo}" class="ce-photo-about-img" id="ce-photo-img" alt=""/>
                  <div class="ce-photo-about-lbl">Tap to change<span>Shows in your card corner</span></div>
                  <button class="ce-photo-remove" style="margin-left:auto;font-size:10px;" onclick="event.stopPropagation();removeCardPhoto()">Remove</button>`
                :`<div style="width:48px;height:48px;border-radius:50%;background:var(--line);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" style="opacity:0.45;"><path d="M12 15.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4z"/><path d="M9 2L7.17 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2h-3.17L15 2H9zm3 15c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z"/></svg>
                  </div>
                  <div class="ce-photo-about-lbl">Add photo<span>Shows in your card corner</span></div>`}
            </div>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Your motto <span class="ce-optional">optional · 60 chars</span></div>
            <input id="card-motto" class="ce-input" placeholder="e.g. Always up for something new" value="${escapeHtml(G.cardDraft.motto)}" oninput="updateCardPreview()" autocomplete="off" maxlength="60"/>
            <div class="ce-char-hint">Shown in italic under your name</div>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">About you <span class="ce-optional">optional</span></div>
            <textarea id="card-bio" class="ce-input ce-textarea" rows="3" placeholder="What brings you to events like these?" oninput="updateCardPreview()">${escapeHtml(G.cardDraft.bio)}</textarea>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Interests <span class="ce-optional">comma separated</span></div>
            <input id="card-interests" class="ce-input" placeholder="e.g. live music, board games, hiking" value="${escapeHtml(G.cardDraft.interests)}" oninput="updateCardPreview()" autocomplete="off"/>
            <div class="ce-char-hint">Shown as tags on your card</div>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Fun fact <span class="ce-optional">optional</span></div>
            <input id="card-fact" class="ce-input" placeholder="e.g. once got lost in IKEA for 3 hours" value="${escapeHtml(G.cardDraft.fact)}" oninput="updateCardPreview()" autocomplete="off"/>
          </div>

          <div class="ce-section">
            <div class="ce-section-label">Your local spots <span class="ce-optional">pick up to 3</span></div>
            <div class="ce-char-hint" id="ce-area-hint" style="margin-bottom:14px;">${G.cardDraft.areas.length}/3 selected${G.cardDraft.areas.length===3?' — tap any to deselect':''}</div>
            <div class="ce-area-grid" id="ce-area-grid">${areaPillsHtml}</div>
          </div>

          <div class="ce-save-row">
            <button class="btn" style="flex:1;" onclick="saveCard()">Save card</button>
            ${allowSkip?`<button class="btn btn-outline" onclick="skipCard()">Skip</button>`:`<button class="btn btn-outline" onclick="closeCardEditor()">Cancel</button>`}
          </div>

        </div>

      </div><!-- /ce-right -->
    </div><!-- /ce-shell -->
  </div>`;
  // 3D drag-to-spin with spring return
  const liveCard=document.getElementById('ce-live-card');
  liveCard.style.cursor='grab';
  let _ceSpin=false,_ceStartX=0,_ceStartY=0,_cePrevX=0,_cePrevY=0;
  let _ceRotY=0,_ceRotX=0,_ceVelY=0,_ceVelX=0,_ceRaf=0;
  function _ceSetT(ry,rx){ liveCard.style.transform=`perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`; }
  function _ceSpring(){
    _ceVelY=_ceVelY*0.82-_ceRotY*0.12;
    _ceVelX=_ceVelX*0.82-_ceRotX*0.12;
    _ceRotY+=_ceVelY; _ceRotX+=_ceVelX;
    _ceSetT(_ceRotY,_ceRotX);
    if(Math.abs(_ceRotY)<0.1&&Math.abs(_ceRotX)<0.1&&Math.abs(_ceVelY)<0.1&&Math.abs(_ceVelX)<0.1){
      _ceRotY=0;_ceRotX=0;_ceVelY=0;_ceVelX=0;_ceSetT(0,0);
    } else { _ceRaf=requestAnimationFrame(_ceSpring); }
  }
  liveCard.addEventListener('pointerdown',e=>{
    _ceSpin=true;_ceStartX=_cePrevX=e.clientX;_ceStartY=_cePrevY=e.clientY;
    _ceRotY=0;_ceRotX=0;_ceVelY=0;_ceVelX=0;
    cancelAnimationFrame(_ceRaf);
    liveCard.setPointerCapture(e.pointerId);
    liveCard.style.cursor='grabbing';
    e.preventDefault();
  });
  liveCard.addEventListener('pointermove',e=>{
    if(!_ceSpin) return;
    const dx=e.clientX-_ceStartX, dy=e.clientY-_ceStartY;
    _ceVelY=(e.clientX-_cePrevX)*0.18; _ceVelX=-(e.clientY-_cePrevY)*0.12;
    _cePrevX=e.clientX; _cePrevY=e.clientY;
    _ceRotY=dx*0.18; _ceRotX=-dy*0.12;
    _ceSetT(_ceRotY,_ceRotX);
  });
  const _ceEnd=()=>{ if(!_ceSpin)return; _ceSpin=false; liveCard.style.cursor='grab'; _ceRaf=requestAnimationFrame(_ceSpring); };
  liveCard.addEventListener('pointerup',_ceEnd);
  liveCard.addEventListener('pointercancel',_ceEnd);
}

export function switchCeTab(tab){
  captureDraftFields();
  document.querySelectorAll('.ce-tab-btn').forEach(b=>
    b.classList.toggle('active', b.dataset.tab===tab)
  );
  document.querySelectorAll('.ce-tab-panel').forEach(p=>
    p.classList.toggle('active', p.dataset.tab===tab)
  );
}

export async function saveCard(){
  captureDraftFields();
  const card={name:state.profileName,theme:G.cardDraft.bgStyle||G.cardDraft.theme,bgStyle:G.cardDraft.bgStyle||G.cardDraft.theme,accentColor:G.cardDraft.accentColor||'#CBA43A',bio:G.cardDraft.bio.trim(),interests:G.cardDraft.interests.trim(),fact:G.cardDraft.fact.trim()};
  state.myCard=card;
  // Save extended fields to localStorage
  try{ localStorage.setItem('card_ext:'+state.profileName, JSON.stringify({pattern:G.cardDraft.pattern,patternOpacity:G.cardDraft.patternOpacity,motto:G.cardDraft.motto,areas:G.cardDraft.areas,accentColor:G.cardDraft.accentColor,bgStyle:G.cardDraft.bgStyle})); }catch(e){}
  // Save photo separately (can be large)
  try{ if(G.cardDraft.photo) localStorage.setItem('card_photo:'+state.profileName, G.cardDraft.photo);
       else localStorage.removeItem('card_photo:'+state.profileName); }catch(e){}
  if(state.userId){
    await sb.from('users').update({
      card_theme:card.theme,card_bio:card.bio,card_interests:card.interests,card_fact:card.fact
    }).eq('id',state.userId);
  }
  document.getElementById('card-editor-root').innerHTML='';
  renderNav();
  if(G.cardEditorEventId!==null){ openConnect(G.cardEditorEventId); } else { renderView(); }
}

export function initCardSheen(){
  const sheen=document.getElementById('card-xl-sheen');
  if(!sheen) return;
  const card=document.querySelector('.cpass-card');
  if(!card) return;
  _sheenCard=card;
  function applySheen(sx,sy){ sheen.style.transform=`translate(${sx}px,${sy}px)`; }
  G._sheenHandler=(e)=>{
    const g=Math.max(-50,Math.min(50,e.gamma||0));
    const b=Math.max(-40,Math.min(40,(e.beta||15)-15));
    applySheen((g/50)*65,(b/40)*50);
  };
  _sheenMouseHandler=(e)=>{
    const r=card.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width-0.5)*2;
    const y=((e.clientY-r.top)/r.height-0.5)*2;
    applySheen(x*65,y*50);
  };
  window.addEventListener('deviceorientation',G._sheenHandler);
  card.addEventListener('mousemove',_sheenMouseHandler);
}

export function getCardExt(){
  let ext={motto:'',pattern:'lines',areas:[],accentColor:'#CBA43A',bgStyle:'obsidian',badges:[]};
  try{ const r=localStorage.getItem('card_ext:'+state.profileName); if(r) ext={...ext,...JSON.parse(r)}; }catch(e){}
  if(!Array.isArray(ext.badges)) ext.badges=[];
  return ext;
}

export function saveCardExt(ext){ try{ localStorage.setItem('card_ext:'+state.profileName, JSON.stringify(ext)); }catch(e){} }

export function openExpandedCard(){
  const old=document.getElementById('card-xl-overlay'); if(old) old.remove();
  const card=state.myCard;
  let cardExt={motto:'',pattern:'lines',areas:[],accentColor:'#CBA43A',bgStyle:'obsidian'};
  try{ const r=localStorage.getItem('card_ext:'+state.profileName); if(r) cardExt={...cardExt,...JSON.parse(r)}; }catch(e){}
  let cardPhoto='';
  try{ cardPhoto=localStorage.getItem('card_photo:'+state.profileName)||''; }catch(e){}

  const accent=cardExt.accentColor||card?.accentColor||'#CBA43A';
  const accentAlpha=(a,op)=>{ const m=a.match(/^#([0-9a-f]{6})$/i); if(!m) return `rgba(255,255,255,${op})`; const r2=parseInt(m[1].slice(0,2),16),g2=parseInt(m[1].slice(2,4),16),b2=parseInt(m[1].slice(4,6),16); return `rgba(${r2},${g2},${b2},${op})`; };

  const myEvents=getMyEvents(); const myCats=getMyCategories();
  const earnedTotal=getAllBadges().filter(b=>b.earned).length;
  const lv=getLevel(earnedTotal);

  const uid='CU·'+btoa(state.profileName||'anon').replace(/[^A-Z0-9]/gi,'').substring(0,8).toUpperCase();
  const areas=cardExt.areas&&cardExt.areas.length?cardExt.areas.join(' · '):'';
  const motto=cardExt.motto?`${escapeHtml(cardExt.motto)}`:escapeHtml(card&&card.bio?card.bio:'');
  const initStr=((card?card.name:state.profileName)||'?').split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();

  const avatar = cardPhoto
    ? `<div class="cpass-avatar" style="border-color:${accent};"><img src="${cardPhoto}" alt=""/></div>`
    : `<div class="cpass-avatar cpass-avatar-mono" style="border-color:${accentAlpha(accent,0.55)};background:${accentAlpha(accent,0.16)};color:${accent};">${initStr}</div>`;

  // Featured badges — the hero. 3 slots: chosen earned badge, or an "add" placeholder.
  const featured=getFeaturedBadges();
  const slotsHtml=[0,1,2].map(i=>{
    const b=featured[i];
    if(b){
      return `<button class="cpass-badge" onclick="openBadgePicker()" title="${escapeHtml(b.name)}" style="--bc:${b.color};--bcg:${accentAlpha(b.color,0.55)};">
        <span class="cpass-coin"><span class="cpass-coin-shine"></span><span class="cpass-coin-glyph">${b.glyph}</span></span>
        <span class="cpass-badge-name">${escapeHtml(b.name)}</span>
      </button>`;
    }
    return `<button class="cpass-badge cpass-badge-empty" onclick="openBadgePicker()" title="Add a badge">
      <span class="cpass-coin-empty">+</span>
      <span class="cpass-badge-name">Add</span>
    </button>`;
  }).join('');

  const html=`<div class="card-xl-overlay" id="card-xl-overlay" onclick="if(event.target===this)closeExpandedCard()">
    <div class="card-xl-outer">
      <button class="card-xl-close" onclick="closeExpandedCard()" aria-label="Close">✕</button>
      <div class="cpass-card" id="cpass-card" style="--acc:${accent};--acc-glow:${accentAlpha(accent,0.30)};--acc-soft:${accentAlpha(accent,0.14)};">
        <div class="cpass-ambient"></div>

        <!-- Header: wordmark + tier -->
        <div class="cpass-head">
          <div class="cpass-logo">
            <span class="cpass-logo-mark" style="background:${accent};"><svg viewBox="0 0 10 10"><circle cx="5" cy="4" r="2.5"/><ellipse cx="5" cy="7.5" rx="3.5" ry="1.5"/></svg></span>
            <span class="cpass-logo-text">Cumulus</span>
          </div>
          <div class="cpass-tier" style="border-color:${accentAlpha(accent,0.45)};background:${accentAlpha(accent,0.14)};color:${accent};">
            <span class="cpass-tier-dot" style="background:${accent};"></span>${lv.title}
          </div>
        </div>

        <!-- Identity -->
        <div class="cpass-id">
          ${avatar}
          <div class="cpass-id-text">
            <div class="cpass-name">${escapeHtml(card?card.name:state.profileName)}</div>
            <div class="cpass-sub">${motto?escapeHtml(cardExt.motto||(card&&card.bio)||''):'London Community Member'}</div>
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
          <div class="cpass-stat"><span class="cpass-stat-num">${state.friends.length}</span><span class="cpass-stat-label">Friends</span></div>
          <div class="cpass-stat"><span class="cpass-stat-num">${earnedTotal}</span><span class="cpass-stat-label">Badges</span></div>
        </div>

        <!-- QR to add friend -->
        <div class="cpass-qr-block">
          <div class="cpass-qr-frame">
            <div class="cpass-qr" id="cpass-qr-el"></div>
          </div>
          <div class="cpass-qr-label">Scan to add me on Cumulus</div>
        </div>

        <!-- Footer pass band -->
        <div class="cpass-foot">
          <div>
            <div class="cpass-foot-label">Cumulus Pass</div>
            <div class="cpass-foot-uid">${uid}${areas?` · ${escapeHtml(areas)}`:''}</div>
          </div>
          <div class="cpass-foot-mark" style="background:${accentAlpha(accent,0.20)};color:${accent};">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="10" r="5"/><ellipse cx="12" cy="19" rx="8" ry="4"/></svg>
          </div>
        </div>

        <div class="cpass-sheen" id="card-xl-sheen"></div>
        <div class="cpass-edge" style="background:linear-gradient(90deg,${accentAlpha(accent,0.6)},${accent},${accentAlpha(accent,0.6)});"></div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', html);
  requestAnimationFrame(()=>{
    const ov=document.getElementById('card-xl-overlay');
    if(ov) requestAnimationFrame(()=>{
      ov.classList.add('open');
      const qrEl=document.getElementById('cpass-qr-el');
      if(qrEl){
        try{ new QRCode(qrEl,{text:myFriendCode(),width:150,height:150,colorDark:'#0A0A0A',colorLight:'#ffffff',correctLevel:QRCode.CorrectLevel.M}); }
        catch(e){ qrEl.innerHTML=`<div style="font-size:7px;padding:4px;word-break:break-all;color:#000;">${myFriendCode()}</div>`; }
      }
      const sheenCard=document.getElementById('cpass-card');
      if(sheenCard){ window.__cpassCard=sheenCard; }
      initCardSheen();
    });
  });
}

export function closeExpandedCard(){
  const ov=document.getElementById('card-xl-overlay');
  if(!ov) return;
  if(G._sheenHandler){ window.removeEventListener('deviceorientation',G._sheenHandler); G._sheenHandler=null; }
  if(_sheenMouseHandler&&_sheenCard){ _sheenCard.removeEventListener('mousemove',_sheenMouseHandler); _sheenMouseHandler=null; _sheenCard=null; }
  ov.classList.remove('open');
  setTimeout(()=>{ if(ov.parentNode) ov.remove(); }, 320);
}

export function renderProfile(){
  const myEvents=getMyEvents(); const myCats=getMyCategories(); const count=myEvents.length;
  const card=state.myCard;

  // Extended card fields
  let cardExt={motto:'',pattern:'lines',areas:[],accentColor:'#CBA43A',bgStyle:'obsidian',patternOpacity:0.18};
  try{ const r=localStorage.getItem('card_ext:'+state.profileName); if(r) cardExt={...cardExt,...JSON.parse(r)}; }catch(e){}
  let profilePhoto='';
  try{ profilePhoto=localStorage.getItem('card_photo:'+state.profileName)||''; }catch(e){}
  let profileAbout='';
  try{ profileAbout=localStorage.getItem('profile_about:'+state.profileName)||''; }catch(e){}
  let profileInterests=[];
  try{ const pi=localStorage.getItem('profile_interests:'+state.profileName); if(pi) profileInterests=JSON.parse(pi); }catch(e){}

  // Level + badges
  let earnedCount=0;
  MILESTONE_BADGES.forEach(b=>{ if(count>=b.need) earnedCount++; });
  CATEGORY_BADGES.forEach(b=>{ if(myCats.has(b.cat)) earnedCount++; });
  if(myCats.size>=TOTAL_CATEGORIES) earnedCount++;
  earnedCount+=state.specialBadges.length;
  const lv=getLevel(earnedCount);
  const nextLvIdx=LEVELS.findIndex(l=>l===lv)+1;
  const nextLv=LEVELS[nextLvIdx];

  const topAreas=cardExt.areas||[];

  // Card HTML (inline profile card)
  function profileCardHtml(c,ext){
    const cols=resolveCardColors(ext.bgStyle||c?.theme||'obsidian', ext.accentColor||c?.accentColor||'#CBA43A');
    const {bg,accent,text:textCol,textSoft}=cols;
    const pat=CARD_PATTERNS[ext.pattern||'lightning']||'';
    const tagBg=cols.dark?'rgba(255,255,255,0.14)':'rgba(0,0,0,0.08)';
    const tagBorder=cols.dark?'rgba(255,255,255,0.2)':'rgba(0,0,0,0.12)';
    const tags=c&&c.interests?c.interests.split(',').slice(0,5).map(s=>`<span class="id-card-tag" style="background:${tagBg};border:1px solid ${tagBorder};color:${textCol};">${escapeHtml(s.trim())}</span>`).join(''):'';
    const borderStyle=lv.ring;
    const shadowStyle=`0 8px 28px rgba(0,0,0,0.22),0 0 0 1px rgba(0,0,0,0.08),0 0 18px ${lv.glow}`;
    const initStr=(c?.name||state.profileName).split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase();
    const photoSticker=profilePhoto
      ?`<div style="width:52px;height:52px;border-radius:50%;overflow:hidden;border:2px solid ${accent};flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,0.3);"><img src="${profilePhoto}" style="width:100%;height:100%;object-fit:cover;display:block;"/></div>`
      :`<div style="width:52px;height:52px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:${accent}22;border:2px solid ${accent}55;flex-shrink:0;font-size:18px;font-weight:800;color:${accent};">${initStr}</div>`;
    return `<div class="id-card profile-id-card prof-avatar-float" style="background:${bg};border:${borderStyle};box-shadow:${shadowStyle};">
      <div style="position:absolute;inset:0;pointer-events:none;color:${accent};opacity:${ext.patternOpacity||0.35};">${pat}</div>
      <div class="ce-card-shine"></div>
      <div style="position:relative;z-index:2;display:flex;flex-direction:column;height:100%;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;">
          <div>
            <div class="id-card-label" style="color:${textSoft};">// Cumulus Pass</div>
            <div style="width:24px;height:2px;background:${accent};border-radius:99px;margin-top:4px;"></div>
          </div>
          ${photoSticker}
        </div>
        <div class="id-card-name" style="color:${textCol};">${escapeHtml(c?c.name:state.profileName)}</div>
        ${ext.motto?`<div style="font-size:11px;font-style:italic;font-weight:700;color:${accent};margin-bottom:4px;">"${escapeHtml(ext.motto)}"</div>`:''}
        ${c&&c.bio?`<div class="id-card-bio" style="color:${textSoft};">${escapeHtml(c.bio)}</div>`:''}
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
  const memories=myEvents.filter(ev=>eventStatus(ev)==='past'&&(ev.nightShotUrl||localStorage.getItem('night_shot:'+ev.id)));
  const memoriesHtml=memories.slice(0,6).map(ev=>{
    const shotUrl=ev.nightShotUrl||localStorage.getItem('night_shot:'+ev.id);
    const shortTitle=ev.title.length>22?ev.title.substring(0,20)+'…':ev.title;
    return `<div class="ns-tile" onclick="openEvent(${ev.id})">
      <img src="${shotUrl}" alt="${escapeHtml(ev.title)}"/>
      <div class="ns-tile-label">${escapeHtml(shortTitle)}</div>
    </div>`;
  }).join('');

  // Recent events — last 4 only (not 12)
  const recentEvents=myEvents.slice(-4).reverse();
  const MUTED_CATS={'Creative':'rgba(232,184,75,0.10)','Gaming':'rgba(232,184,75,0.10)','Movie Nights':'rgba(232,184,75,0.10)','Board Games':'rgba(232,184,75,0.10)','Meetups':'rgba(232,184,75,0.10)','Food & Drink':'rgba(232,184,75,0.10)','Live Music':'rgba(232,184,75,0.10)','Wellness & Outdoors':'rgba(232,184,75,0.10)','Tech & Talks':'rgba(232,184,75,0.10)'};
  const recentEvHtml=recentEvents.map(ev=>{
    const c2=CATS[ev.category]||{color:'#CBA43A'};
    const mutedBg=hexToRgba(c2.color,0.09);
    const shortTitle=ev.title.length>28?ev.title.substring(0,26)+'…':ev.title;
    const evDate=ev.startsAt?new Date(ev.startsAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'';
    const status=eventStatus(ev);
    const statusDot=status==='live'?`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:4px;box-shadow:0 0 5px #22c55e88;"></span>`:status==='upcoming'?`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${c2.color};margin-right:4px;opacity:0.7;"></span>`:'';
    return `<div class="ev-plate" onclick="openEvent(${ev.id})" style="background:${mutedBg};border:1px solid ${c2.color}28;" title="${escapeHtml(ev.title)}">
      <div style="font-size:12px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:4px;">${escapeHtml(shortTitle)}</div>
      <div style="font-size:10px;color:var(--text-muted);display:flex;align-items:center;">${statusDot}${escapeHtml(ev.category)}</div>
      ${evDate?`<div style="font-size:10px;color:${c2.color};font-weight:600;margin-top:4px;">${evDate}</div>`:''}
    </div>`;
  }).join('');

  // Interests pills
  const interestPillsHtml=INTEREST_PRESETS.map(tag=>{
    const active=profileInterests.includes(tag);
    return `<button class="interest-pill${active?' active':''}" onclick="toggleProfileInterest('${escapeHtml(tag)}')">${escapeHtml(tag)}</button>`;
  }).join('');

  const badgeHint=nextLv
    ? `${earnedCount} badge${earnedCount!==1?'s':''} earned · ${nextLv.min-earnedCount} more to reach ${nextLv.title}`
    : '✦ Max rank achieved';

  return `
    <!-- Card -->
    <div class="prof-card-section">
      ${profileCardHtml(card,cardExt)}
      <div class="prof-card-btns">
        ${card
          ?`<button class="btn btn-small" onclick="openCardEditor(null)">Edit card</button>
             <button class="btn btn-outline btn-small" onclick="openExpandedCard()">View + QR</button>`
          :`<button class="btn btn-small" style="flex:1;" onclick="openCardEditor(null)">Create your card</button>`}
      </div>
    </div>

    <!-- Stats row -->
    <div class="prof-stats-row">
      <div class="pstat"><div class="pstat-num">${count}</div><div class="pstat-lbl">Events</div></div>
      <div class="pstat"><div class="pstat-num">${state.friends.length}</div><div class="pstat-lbl">Friends</div></div>
      <div class="pstat"><div class="pstat-num">${G.myTickets.length}</div><div class="pstat-lbl">Tickets</div></div>
      <div class="pstat"><div class="pstat-num">${earnedCount}</div><div class="pstat-lbl">Badges</div></div>
    </div>

    <!-- Achievements card -->
    <div class="prof-achievements-card" onclick="openAchievements()">
      <div class="prof-ach-header">
        <span class="prof-ach-title">Achievements</span>
        <span class="prof-ach-level" style="color:${lv.color};">${lv.title}</span>
      </div>
      <div class="prof-ach-sub">${earnedCount} badge${earnedCount!==1?'s':''} earned${nextLv?` · ${nextLv.min-earnedCount} more to reach ${nextLv.title}`:' · Max rank'}</div>
      <div class="prof-ach-progress"><div class="prof-ach-fill" style="width:${nextLv?Math.min(100,Math.round(((earnedCount-lv.min)/(nextLv.min-lv.min))*100)):100}%;background:${lv.color};"></div></div>
      <div class="prof-ach-cta">View badges &amp; history →</div>
    </div>

    <!-- Action list -->
    <div class="prof-action-list">
      <button class="prof-action-row" onclick="openMyTickets()">
        <span class="prof-action-label">My Tickets</span>
        <span class="prof-action-right">${G.myTickets.length>0?G.myTickets.length+' ':''}›</span>
      </button>
      <button class="prof-action-row" onclick="editProfile()">
        <span class="prof-action-label">Edit name &amp; email</span>
        <span class="prof-action-right">›</span>
      </button>
      <button class="prof-action-row prof-action-signout" onclick="signOut()">
        <span class="prof-action-label">Sign out</span>
        <span class="prof-action-right">›</span>
      </button>
    </div>
    ${state.profileEmail==='gondoxml@gmail.com'?`
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
    </div>`:''}


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

      ${topAreas.length?`
      <div class="prof-divider"></div>
      <div class="prof-about-label">My London spots</div>
      <div class="area-chips">${topAreas.map(a=>`<div class="area-chip"><span>${escapeHtml(a)}</span></div>`).join('')}
        <button class="btn btn-text btn-small" style="font-size:11px;" onclick="openCardEditor(null)">Edit in card →</button>
      </div>`:
      `<div class="prof-divider"></div>
      <button class="btn btn-text btn-small" style="font-size:12px;padding:0;" onclick="openCardEditor(null)">+ Add your London spots in your card</button>`}
    </div>

    <!-- Night Shot memories -->
    ${memories.length?`
    <div class="profile-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span class="profile-section-label" style="margin-bottom:0;color:#FCD34D;">📸 Memories</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;">${memoriesHtml}</div>
    </div>`:''}

    <!-- Recent events (only shown if user has any) -->
    ${recentEvents.length?`
    <div class="profile-section">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <span class="profile-section-label" style="margin-bottom:0;flex:0 0 auto;">Recent events</span>
        ${myEvents.length>4?`<button class="btn btn-text btn-small" onclick="openAchievements()" style="font-size:11px;">See all ${myEvents.length} →</button>`:''}
      </div>
      <div class="ev-plate-grid list-item-stagger">${recentEvHtml}</div>
    </div>`:''}
  `;
}

export function editProfile(){
  state.editingProfile=true; renderNav(); renderView();
}

export function updateAboutCounter(el){
  const ctr=document.getElementById('about-counter');
  if(!ctr) return;
  const n=el.value.length;
  ctr.textContent=n+'/150';
  ctr.classList.toggle('warn', n>130);
}

export function saveProfileAbout(val){
  try{ localStorage.setItem('profile_about:'+state.profileName, val.trim()); }catch(e){}
}

export function toggleProfileInterest(tag){
  let pi=[];
  try{ const r=localStorage.getItem('profile_interests:'+state.profileName); if(r) pi=JSON.parse(r); }catch(e){}
  const idx=pi.indexOf(tag);
  if(idx===-1) pi.push(tag); else pi.splice(idx,1);
  try{ localStorage.setItem('profile_interests:'+state.profileName, JSON.stringify(pi)); }catch(e){}
  // Toggle pill without full re-render
  document.querySelectorAll('.interest-pill').forEach(btn=>{
    if(btn.textContent===tag) btn.classList.toggle('active', pi.includes(tag));
  });
}

export function getAllBadges(){
  const myEvents=getMyEvents(); const myCats=getMyCategories();
  const list=[];
  MILESTONE_BADGES.forEach(b=>list.push({id:b.id,name:b.name,glyph:b.glyph,desc:b.desc,color:b.metal,earned:myEvents.length>=b.need,kind:'Milestone'}));
  CATEGORY_BADGES.forEach(b=>list.push({id:b.id,name:b.name,glyph:b.glyph,desc:b.desc,color:(CATS[b.cat]||{color:'#CBA43A'}).color,earned:myCats.has(b.cat),kind:'Category'}));
  SPECIAL_BADGES.forEach(b=>list.push({id:b.id,name:b.name,glyph:b.glyph,desc:b.desc,color:'#CBA43A',earned:state.specialBadges.includes(b.id),kind:'Special'}));
  return list;
}

export function getFeaturedBadges(){
  const ext=getCardExt();
  const all=getAllBadges();
  return ext.badges.map(id=>all.find(b=>b.id===id&&b.earned)).filter(Boolean).slice(0,3);
}

export function openBadgePicker(){
  const old=document.getElementById('cpass-picker-overlay'); if(old) old.remove();
  const ext=getCardExt();
  const chosen=ext.badges.slice(0,3);
  const all=getAllBadges();
  const earned=all.filter(b=>b.earned);
  const locked=all.filter(b=>!b.earned);
  const cell=(b,isChosen,isLocked)=>`
    <button class="bpick-cell${isChosen?' chosen':''}${isLocked?' locked':''}" ${isLocked?'disabled':`onclick="toggleFeaturedBadge('${b.id}')"`} style="--bc:${b.color};">
      <span class="bpick-coin"><span class="bpick-coin-glyph">${b.glyph}</span></span>
      <span class="bpick-name">${escapeHtml(b.name)}</span>
      <span class="bpick-kind">${b.kind}</span>
      ${isChosen?`<span class="bpick-check">✓</span>`:''}
      ${isLocked?`<span class="bpick-lock">🔒</span>`:''}
    </button>`;
  const earnedHtml=earned.length?earned.map(b=>cell(b,chosen.includes(b.id),false)).join(''):`<div class="bpick-empty">No badges yet — RSVP to events to start earning them.</div>`;
  const lockedHtml=locked.map(b=>cell(b,false,true)).join('');
  const html=`<div class="cpass-picker-overlay" id="cpass-picker-overlay" onclick="if(event.target===this)closeBadgePicker()">
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
        ${locked.length?`<div class="bpick-locked-label">Locked</div><div class="bpick-grid">${lockedHtml}</div>`:''}
      </div>
      <button class="btn bpick-done" onclick="closeBadgePicker()">Done</button>
    </div>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', html);
  requestAnimationFrame(()=>{ const ov=document.getElementById('cpass-picker-overlay'); if(ov) requestAnimationFrame(()=>ov.classList.add('open')); });
}

export function toggleFeaturedBadge(id){
  const ext=getCardExt();
  let arr=ext.badges.filter(x=>getBadgeById(x)); // prune stale
  const i=arr.indexOf(id);
  if(i>=0){ arr.splice(i,1); }
  else { if(arr.length>=3){ showToast('You can feature up to 3 badges','info'); return; } arr.push(id); }
  ext.badges=arr; saveCardExt(ext);
  // update cells + count without full re-render
  document.querySelectorAll('.bpick-cell').forEach(c=>{});
  const cnt=document.getElementById('bpick-count'); if(cnt) cnt.textContent=arr.length;
  document.querySelectorAll('.bpick-cell').forEach(cell=>{
    const oc=cell.getAttribute('onclick')||''; const m=oc.match(/'([^']+)'/); if(!m) return;
    const chosen=arr.includes(m[1]);
    cell.classList.toggle('chosen',chosen);
    let chk=cell.querySelector('.bpick-check');
    if(chosen&&!chk){ chk=document.createElement('span'); chk.className='bpick-check'; chk.textContent='✓'; cell.appendChild(chk); }
    else if(!chosen&&chk){ chk.remove(); }
  });
}

export function closeBadgePicker(){
  const ov=document.getElementById('cpass-picker-overlay');
  if(ov){ ov.classList.remove('open'); setTimeout(()=>ov.remove(),220); }
  // rebuild the pass so featured badges reflect the new choice
  if(document.getElementById('card-xl-overlay')) openExpandedCard();
}

export function renderAchievements(){
  const myEvents=getMyEvents(); const myCats=getMyCategories(); const count=myEvents.length;
  let earnedCount=0;
  MILESTONE_BADGES.forEach(b=>{ if(count>=b.need) earnedCount++; });
  CATEGORY_BADGES.forEach(b=>{ if(myCats.has(b.cat)) earnedCount++; });
  if(myCats.size>=TOTAL_CATEGORIES) earnedCount++;
  earnedCount+=state.specialBadges.length;
  const lv=getLevel(earnedCount);
  const nextLvIdx=LEVELS.findIndex(l=>l===lv)+1;
  const nextLv=LEVELS[nextLvIdx];
  const progressPct=nextLv?Math.min(100,Math.round(((earnedCount-lv.min)/(nextLv.min-lv.min))*100)):100;

  const milestoneCells=MILESTONE_BADGES.map(b=>{ const earned=count>=b.need; return trophyCellHtml(b.name,b.desc,b.glyph,b.metal,b.metal,b.tier,earned,earned?'':`${count} / ${b.need} events`); }).join('');
  const allRounderEarned=myCats.size>=TOTAL_CATEGORIES;
  const allRounderCell=trophyCellHtml(ALLROUNDER_BADGE.name,ALLROUNDER_BADGE.desc,ALLROUNDER_BADGE.glyph,ALLROUNDER_BADGE.metal,ALLROUNDER_BADGE.glow,ALLROUNDER_BADGE.tier,allRounderEarned,allRounderEarned?'':`${myCats.size} / ${TOTAL_CATEGORIES} categories`);
  const categoryCells=CATEGORY_BADGES.map(b=>{ const earned=myCats.has(b.cat); return badgeCellHtml(b.name,b.desc,b.glyph,CATS[b.cat].color,earned,''); }).join('');
  const specialEarned=SPECIAL_BADGES.filter(b=>state.specialBadges.includes(b.id));
  const specialCells=specialEarned.map(b=>badgeCellHtml(b.name,b.desc,b.glyph,'var(--gold)',true,'')).join('');

  // Full event history (all events)
  const allEvents=myEvents.slice().reverse();
  const MUTED_CATS_A={'Creative':'rgba(232,184,75,0.10)','Gaming':'rgba(232,184,75,0.10)','Movie Nights':'rgba(232,184,75,0.10)','Board Games':'rgba(232,184,75,0.10)','Meetups':'rgba(232,184,75,0.10)','Food & Drink':'rgba(232,184,75,0.10)','Live Music':'rgba(232,184,75,0.10)','Wellness & Outdoors':'rgba(232,184,75,0.10)','Tech & Talks':'rgba(232,184,75,0.10)'};
  const evTilesHtml=allEvents.length
    ? allEvents.map(ev=>{
        const c2=CATS[ev.category]||{color:'#CBA43A'};
        const shortTitle=ev.title.length>28?ev.title.substring(0,26)+'…':ev.title;
        const evDate=ev.startsAt?new Date(ev.startsAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'}):'';
        const status=eventStatus(ev);
        const statusDot=status==='live'?`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;margin-right:4px;box-shadow:0 0 5px #22c55e88;"></span>`:status==='upcoming'?`<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:${c2.color};margin-right:4px;opacity:0.7;"></span>`:'';
        return `<div class="ev-plate" onclick="openEvent(${ev.id})" style="background:${hexToRgba(c2.color,0.08)};border:1px solid var(--line);border-left:2px solid ${c2.color};">
          <div style="font-size:12px;font-weight:700;color:var(--text);line-height:1.3;margin-bottom:4px;">${escapeHtml(shortTitle)}</div>
          <div style="font-size:10px;color:var(--text-muted);display:flex;align-items:center;">${statusDot}${escapeHtml(ev.category)}</div>
          ${evDate?`<div style="font-size:10px;color:${c2.color};font-weight:600;margin-top:4px;">${evDate}</div>`:''}
        </div>`;
      }).join('')
    : `<div style="color:var(--text-muted);font-size:13px;padding:4px 0;">No events yet — browse and RSVP to get started.</div>`;

  return `<button class="back-btn" onclick="goBack()">←</button>

    <!-- Level hero -->
    <div class="achieve-hero">
      <div class="achieve-badge-big" style="background:${lv.color}22;border-color:${lv.color};color:${lv.color};">${lv.title.substring(0,2).toUpperCase()}</div>
      <div class="achieve-hero-text">
        <div class="achieve-hero-level" style="color:${lv.color};">${lv.title}</div>
        <div class="achieve-hero-sub">${earnedCount} badge${earnedCount!==1?'s':''} earned${nextLv?` · ${nextLv.min-earnedCount} more to reach ${nextLv.title}`:' · Max rank!'}</div>
        <div class="achieve-progress-bar"><div class="achieve-progress-fill" style="width:${progressPct}%;background:${lv.color};"></div></div>
      </div>
    </div>

    <!-- Milestones -->
    <div class="profile-section">
      <div class="profile-section-label">Milestones</div>
      <div class="badge-grid">${milestoneCells}${allRounderCell}</div>
    </div>

    <!-- Categories explored -->
    <div class="profile-section">
      <div class="profile-section-label">Categories explored</div>
      <div class="badge-grid">${categoryCells}</div>
    </div>

    ${specialCells?`
    <div class="profile-section">
      <div class="profile-section-label">Special &amp; community badges</div>
      <div class="badge-grid">${specialCells}</div>
    </div>`:''}

    <!-- Event history (all) -->
    ${allEvents.length?`
    <div class="profile-section">
      <div class="profile-section-label">All events (${allEvents.length})</div>
      <div class="ev-plate-grid list-item-stagger">${evTilesHtml}</div>
    </div>`:''}

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

export function openAchievements(){ pushNav(); state.view='achievements'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }