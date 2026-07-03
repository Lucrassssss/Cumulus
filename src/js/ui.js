import { G } from './globals.js';
import { EVENT_SEED, EVENTS, CATS, CAT_IMG, catImg, eventStatus, isHotEvent, generateUniqueId, codeFor, DEMO_PEOPLE, personByName, CARD_BG_STYLES, CARD_ACCENT_COLORS, CARD_THEMES, CARD_PATTERNS, LONDON_AREAS, CATEGORY_KEYWORDS, MILESTONE_BADGES, CATEGORY_BADGES, ALLROUNDER_BADGE, TOTAL_CATEGORIES, SPECIAL_BADGES, LEVELS, getLevel, INTEREST_PRESETS, CALENDAR_YEAR, CALENDAR_MONTH, MONTH_NAMES, WEEKDAY_LABELS, BLOT_SVG, EMAIL_PATTERN } from './constants.js';
import { sb } from './config.js';
import { validateCuratorCode, adminSendCode, adminVerifyCode, isAdminSession, isPerkUnlocked, distanceMeters, canCheckInAt } from './services.js';
import { renderGate, switchAuthMode, _updateCuratorVisibility, switchSignupType, showLpSignup, closeLpSignup, lpUpdatePassName, _cacheSession, _restoreUserFromRow, submitGate, _submitHostApplication, signOut, enterApp, promptAdminSignIn, persistProfile, applyMapChrome, resolveEventLocations, buildEventsGeoJSON, updateClusterPaint, attachMapLayers, syncHtmlMarkers, refreshMarkers, initLeaflet, initHostMap, handleAddressAutocomplete, selectSearchSuggestion, selectAutocompleteAddress, showMapLayer, persistGeocodeCache, geocodeAddress, openCardEditor, captureDraftFields, handleCardPhoto, removeCardPhoto, selectCardTheme, selectCardAccentColor, selectCardPattern, setPatternOpacity, toggleCardArea, updateCardPreview, renderCardEditor, switchCeTab, saveCard, initCardSheen, getCardExt, saveCardExt, openExpandedCard, closeExpandedCard, renderProfile, editProfile, updateAboutCounter, saveProfileAbout, toggleProfileInterest, getAllBadges, getFeaturedBadges, openBadgePicker, toggleFeaturedBadge, closeBadgePicker, renderAchievements, openAchievements, renderDetail, openEvent, checkInToEvent, promptCuratorUnlock, uploadNightShot, getFilteredEvents, toggleFriendsOnly, refreshFilters, pinTooltipHtml, renderPerkPanel, renderCalendar, openCalendarDay, renderCalendarDay, buildCalendarWeeks, openCalendar, getMyEvents, getMyCategories, getEventDay, toggleHotOnly, toggleLiveOnly, computeEventDates, loadFriends, addFriend, removeFriend, renderConnect, openFriends, openConnectGateway, openConnect, peekAttendee, closeAttendeePeek, toggleGoingSection, _buildChatMsgHtml, _appendChatMsg, sendChat, renderSocialTab, startChatCountdown, getUnreadSocialCount, openSocialForEvent, openSocialTab, setHostType, ticketTypes, renderBook, renderCheckout, renderConfirmed, renderMyTickets, processPayment, loadMyTickets, _insertTickets, openBook, openViewTicket, registerFree, afterRenderConfirmed, downloadICS, getCumulusFee, formatCardNumber, formatExpiry, openTicketsTab, renderTicketsTab, generateTicketId, getTicketForEvent, setBookingType, setBookingQty, proceedToCheckout, initOwnerDash, renderOwnerDash, renderHostPayoutsPanel, renderReview, loadAndRenderReview, _buildReviewCard, reviewHost, renderEventApprovals, loadAndRenderEventApprovals, _buildEventApprovalCard, decideEvent, _publishApprovedEvent, submitHostEvent, od_tog, _odPlatformFee, _odVatOnFee, _odStripeCost, _odBarCol, _odTierCls, _odSetBar, _odSetTier, _odCalcSupa, _odCalcMb, _odCalcEm, _odCalcVc, od_renderStaff, od_recalc, loadOwnerLiveData, _renderOwnerLivePanel, openOwnerDash, openReview, openEventApprovals, _pendingEventKey, clearAllTestData, clearAllUsers, toggleHostCat, openHost } from './facade.js';


export function showToast(msg, type='info'){
  let wrap=document.getElementById('cu-toast-wrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.id='cu-toast-wrap'; wrap.className='cu-toast-wrap'; document.body.appendChild(wrap); }
  const t=document.createElement('div');
  t.className='cu-toast'+(type==='error'?' error':type==='success'?' success':'');
  t.textContent=msg;
  wrap.appendChild(t);
  setTimeout(()=>{ t.classList.add('hiding'); t.addEventListener('animationend',()=>t.remove(),{once:true}); },3200);
}

export function showConfirm(title, body, confirmLabel, dangerFnName){
  const ov=document.createElement('div');
  ov.className='cu-confirm-overlay';
  ov.setAttribute('id','cu-confirm-overlay');
  ov.innerHTML=`<div class="cu-confirm-sheet" role="dialog" aria-modal="true"><div class="cu-confirm-title">${escapeHtml(title)}</div><div class="cu-confirm-body">${escapeHtml(body)}</div><div class="cu-confirm-actions"><button class="btn btn-cancel" onclick="document.getElementById('cu-confirm-overlay')?.remove()">Cancel</button><button class="btn" onclick="document.getElementById('cu-confirm-overlay')?.remove();window['${dangerFnName}'](true)">${escapeHtml(confirmLabel)}</button></div></div>`;
  document.body.appendChild(ov);
}

export function setupReveal(root) {
  if (!window.IntersectionObserver) return;
  const els = (root || document).querySelectorAll('.panel, .section-title, .connect-header, .back-btn');
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
  }, { threshold: 0.08 });
  els.forEach(el => { el.classList.add('reveal'); obs.observe(el); });
}

export function renderNav(){
  const activeTab = ['tickets','my-tickets','book','checkout','confirmed','owner-dash','review','achievements'].includes(state.view)?'profile'
    :['social','friends','host'].includes(state.view)?'social'
    :['calendar','calendar-day'].includes(state.view)?'calendar'
    :state.view;
  const unread = getUnreadSocialCount();
  const navContainer = document.getElementById('nav-container');

  // First render: build the full DOM once
  if(!navContainer.querySelector('.bottom-nav')){
    const icons={
      browse:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L9 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/></svg>`,
      tickets:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M20 12c0-1.1.9-2 2-2V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4c1.1 0 2 .9 2 2s-.9 2-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c-1.1 0-2-.9-2-2zm-6 3.5h-4v-2h4v2zm0-5h-4v-2h4v2z"/></svg>`,
      social:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>`,
      calendar:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z"/></svg>`,
      host:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>`,
      profile:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>`,
      review:`<svg class="nav-icon" viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3c1.93 0 3.5 1.57 3.5 3.5S13.93 13 12 13s-3.5-1.57-3.5-3.5S10.07 6 12 6zm7 13H5v-.23c0-.62.28-1.2.76-1.58C7.47 15.82 9.64 15 12 15s4.53.82 6.24 2.19c.48.38.76.97.76 1.58V19z"/></svg>`
    };
    const NAV_TABS=[
      {label:'Explore', v:'browse',   action:'goBrowse()'},
      {label:'Social',  v:'social',   action:'G.navStack=[];openSocialTab()'},
      {label:'Calendar',v:'calendar', action:'G.navStack=[];openCalendar()'},
      {label:'Profile', v:'profile',  action:'G.navStack=[];openProfile()'},
    ];
    navContainer.innerHTML=`
      <div class="top-bar">
        <div class="logo-wrap" onclick="goBrowse()">${BLOT_SVG}<span class="logo hide-mobile">Cumulus</span></div>
        <input id="search-input" class="search-input" placeholder="Search events..." oninput="onSearchInput()" autocomplete="off"/>
        
      </div>
      <div class="bottom-nav">
        ${NAV_TABS.map(({label,v,action})=>`
          <button class="nav-link" data-nav="${v}" onclick="${action}" style="position:relative;">
            ${icons[v]||''}
            <span class="nav-social-badge" style="display:none;position:absolute;top:4px;right:calc(50% - 22px);background:#E23B3B;color:#fff;font-size:9px;font-weight:800;min-width:16px;height:16px;border-radius:8px;align-items:center;justify-content:center;padding:0 3px;border:1.5px solid var(--surface);"></span>
            <span>${label}</span>
          </button>`).join('')}
      </div>`;
  }

  // Every call: patch active state and theme toggle — no DOM destruction
  navContainer.querySelectorAll('.nav-link').forEach(btn=>{
    btn.classList.toggle('active-cloud-tab', btn.dataset.nav===activeTab);
  });
  const themBtn=navContainer.querySelector('.theme-toggle');
  if(themBtn) themBtn.textContent=state.theme==='light'?'◑':'◐';

  // Patch social badge without touching other buttons
  const socialBadge=navContainer.querySelector('[data-nav="social"] .nav-social-badge');
  if(socialBadge){
    if(unread>0){ socialBadge.textContent=unread; socialBadge.style.display='flex'; }
    else { socialBadge.style.display='none'; }
  }
}

export function pushNav(){ G.navStack.push({view:state.view, selectedEventId:state.selectedEventId}); }

export function goBack(){
  if(G.navStack.length>0){
    const p=G.navStack.pop();
    state.view=p.view; state.selectedEventId=p.selectedEventId;
    renderNav(); renderView();
    if(state.view!=='browse') window.scrollTo({top:0,behavior:'smooth'});
  } else { goBrowse(); }
}

export function renderView(){
  const app=document.getElementById('app'); const container=document.getElementById('view-container');
  if(state.view!=='host') destroyHostMap();

  if(state.view==='browse'){
    app.classList.add('map-home'); document.body.classList.add('no-scroll');
    container.innerHTML='';
    showMapLayer(true);
    initLeaflet(); refreshFilters(); refreshMarkers();
    setTimeout(()=>{ if(G.lmap) G.lmap.resize(); },60);
    return;
  }

  showMapLayer(false);
  app.classList.remove('map-home'); document.body.classList.remove('no-scroll');
  if(state.view==='detail') container.innerHTML=renderDetail(state.selectedEventId);
  else if(state.view==='connect'){container.innerHTML=renderConnect(state.selectedEventId);const _cdEv=EVENTS.find(e=>e.id===state.selectedEventId);if(_cdEv&&!chatIsOpen(_cdEv)&&eventStatus(_cdEv)!=='past')setTimeout(()=>startChatCountdown(_cdEv.id,chatUnlockTime(_cdEv)),0);}
  else if(state.view==='profile') container.innerHTML=renderProfile();
  else if(state.view==='achievements') container.innerHTML=renderAchievements();
  else if(state.view==='friends'){ container.innerHTML=renderSocialTab(); }
  else if(state.view==='calendar') container.innerHTML=renderCalendar();
  else if(state.view==='host'){ container.innerHTML=renderSocialTab(); if(mapboxConfigured()) setTimeout(initHostMap,0); }
  else if(state.view==='book') container.innerHTML=renderBook();
  else if(state.view==='checkout') container.innerHTML=renderCheckout();
  else if(state.view==='confirmed'){ container.innerHTML=renderConfirmed(); setTimeout(afterRenderConfirmed,60); }
  else if(state.view==='my-tickets') container.innerHTML=renderMyTickets();
  else if(state.view==='calendar-day') container.innerHTML=renderCalendarDay();
  else if(state.view==='tickets') container.innerHTML=renderTicketsTab();
  else if(state.view==='social'){ container.innerHTML=renderSocialTab(); }
  else if(state.view==='owner-dash'){ container.innerHTML=renderOwnerDash(); setTimeout(initOwnerDash,0); }
  else if(state.view==='review'){ renderReview(); return; }
  else if(state.view==='event-approvals'){ renderEventApprovals(); return; }
  const cm=document.getElementById('chat-messages'); if(cm) cm.scrollTop=cm.scrollHeight;
}

export function closeActivePopup(){
  if(G.activePopup){ try{ G.activePopup.remove(); }catch(e){} G.activePopup=null; activePopupEventId=null; }
  document.querySelectorAll('.evpin.open').forEach(el=>el.classList.remove('open'));
}

export function goBrowse(){ G.navStack=[]; state.view='browse'; state.selectedEventId=null; renderNav(); renderView(); }

export function setCategory(cat){ state.selectedCategory=cat; renderView(); }

export function chatIsOpen(ev){
  const st=eventStatus(ev);
  if(st==='past') return false; // Close when ended
  if(st==='live') return true;
  return Date.now()>=chatUnlockTime(ev);
}

export function chatUnlockTime(ev){ return ev.startsAt - 7*24*60*60*1000; }

export function pad2(n){return String(n).padStart(2,'0');}

export function markSocialSeen(evId){ G._socialSeenCount[evId]=(state.chats[evId]||[]).length; }

export function medallionHtml(glyph,color,earned){ const ring=earned?color:'var(--line)'; const fill=earned?hexToRgba(color,0.14):'transparent'; const gc=earned?color:'var(--text-muted)'; const lock=earned?'':`<span class="lock">${LOCK_SVG}</span>`; return `<div class="medallion" style="border-color:${ring};background:${fill};color:${gc};">${glyph}${lock}</div>`; }

export function badgeCellHtml(name,desc,glyph,color,earned,progressText){ return `<div class="panel badge-cell ${earned?'earned':'locked'}" style="--corner:${earned?color:'var(--line)'};">${medallionHtml(glyph,color,earned)}<div class="badge-name">${name}</div><div class="badge-desc">${desc}</div>${(!earned&&progressText)?`<div class="badge-progress">${progressText}</div>`:''}</div>`; }

export function trophyHtml(glyph,metal,glow,earned){ if(!earned) return `<div class="trophy-wrap"><div class="trophy-coin locked"><span>${glyph}</span><span class="trophy-lock">${LOCK_SVG}</span></div><div class="trophy-stand locked"></div></div>`; return `<div class="trophy-wrap"><div class="trophy-coin" style="background:radial-gradient(circle at 32% 28%,rgba(255,255,255,0.65),rgba(255,255,255,0) 40%),${metal};box-shadow:0 8px 18px rgba(0,0,0,0.3),0 0 14px ${hexToRgba(glow,0.4)},inset 0 -5px 8px rgba(0,0,0,0.2),inset 0 3px 6px rgba(255,255,255,0.35);"><span class="trophy-shine"></span><span style="position:relative;color:#1B1D21;">${glyph}</span></div><div class="trophy-stand" style="background:${glow};filter:brightness(0.65);"></div></div>`; }

export function trophyCellHtml(name,desc,glyph,metal,glow,tier,earned,progressText){ return `<div class="panel badge-cell ${earned?'earned':'locked'}" style="--corner:${earned?glow:'var(--line)'};">${trophyHtml(glyph,metal,glow,earned)}${tier?`<div class="trophy-tier" style="color:${earned?glow:'var(--text-muted)'};">${tier}</div>`:''}<div class="badge-name">${name}</div><div class="badge-desc">${desc}</div>${(!earned&&progressText)?`<div class="badge-progress">${progressText}</div>`:''}</div>`; }

export function resetProfile(confirmed){ return signOut(confirmed); }

export function getTheme(id){ return CARD_THEMES.find(t=>t.id===id)||CARD_THEMES[0]; }

export function getBgStyle(id){ return CARD_BG_STYLES.find(s=>s.id===id)||CARD_BG_STYLES[0]; }

export function resolveCardColors(bgStyleId, accentHex){
  const style = getBgStyle(bgStyleId);
  const acc = accentHex || '#CBA43A';
  const isDark = style.dark;
  return {
    bg: style.bg,
    accent: acc,
    text: isDark ? '#fff' : '#1e293b',
    textSoft: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(30,41,59,0.58)',
    border: `${acc}40`,
    dark: isDark
  };
}

export function geocodeBannerHtml(){
  if(!geocodingInProgress) return '';
  return `<div class="map-caption" style="bottom:auto;top:calc(var(--top-h) + 10px);right:12px;left:auto;transform:none;font-size:10.5px;">${geocodeProgress.done}/${geocodeProgress.total} placed</div>`;
}
