import { G } from './globals.js';
import { EVENT_SEED, EVENTS, CATS, CAT_IMG, catImg, eventStatus, isHotEvent, generateUniqueId, codeFor, DEMO_PEOPLE, personByName, CARD_BG_STYLES, CARD_ACCENT_COLORS, CARD_THEMES, CARD_PATTERNS, LONDON_AREAS, CATEGORY_KEYWORDS, MILESTONE_BADGES, CATEGORY_BADGES, ALLROUNDER_BADGE, TOTAL_CATEGORIES, SPECIAL_BADGES, LEVELS, getLevel, INTEREST_PRESETS, CALENDAR_YEAR, CALENDAR_MONTH, MONTH_NAMES, WEEKDAY_LABELS, BLOT_SVG, EMAIL_PATTERN } from './constants.js';
import { sb } from './config.js';
import { validateCuratorCode, adminSendCode, adminVerifyCode, isAdminSession, isPerkUnlocked, distanceMeters, canCheckInAt } from './services.js';
import { renderGate, switchAuthMode, _updateCuratorVisibility, switchSignupType, showLpSignup, closeLpSignup, lpUpdatePassName, _cacheSession, _restoreUserFromRow, submitGate, _submitHostApplication, signOut, enterApp, promptAdminSignIn, persistProfile, applyMapChrome, resolveEventLocations, buildEventsGeoJSON, updateClusterPaint, attachMapLayers, syncHtmlMarkers, refreshMarkers, initLeaflet, initHostMap, handleAddressAutocomplete, selectSearchSuggestion, selectAutocompleteAddress, showMapLayer, persistGeocodeCache, geocodeAddress, openCardEditor, captureDraftFields, handleCardPhoto, removeCardPhoto, selectCardTheme, selectCardAccentColor, selectCardPattern, setPatternOpacity, toggleCardArea, updateCardPreview, renderCardEditor, switchCeTab, saveCard, initCardSheen, getCardExt, saveCardExt, openExpandedCard, closeExpandedCard, renderProfile, editProfile, updateAboutCounter, saveProfileAbout, toggleProfileInterest, getAllBadges, getFeaturedBadges, openBadgePicker, toggleFeaturedBadge, closeBadgePicker, renderAchievements, openAchievements, loadFriends, addFriend, removeFriend, renderConnect, openFriends, openConnectGateway, openConnect, peekAttendee, closeAttendeePeek, toggleGoingSection, _buildChatMsgHtml, _appendChatMsg, sendChat, renderSocialTab, startChatCountdown, getUnreadSocialCount, openSocialForEvent, openSocialTab, setHostType, ticketTypes, renderBook, renderCheckout, renderConfirmed, renderMyTickets, processPayment, loadMyTickets, _insertTickets, openBook, openViewTicket, registerFree, afterRenderConfirmed, downloadICS, getCumulusFee, formatCardNumber, formatExpiry, openTicketsTab, renderTicketsTab, generateTicketId, getTicketForEvent, setBookingType, setBookingQty, proceedToCheckout, initOwnerDash, renderOwnerDash, renderHostPayoutsPanel, renderReview, loadAndRenderReview, _buildReviewCard, reviewHost, renderEventApprovals, loadAndRenderEventApprovals, _buildEventApprovalCard, decideEvent, _publishApprovedEvent, submitHostEvent, od_tog, _odPlatformFee, _odVatOnFee, _odStripeCost, _odBarCol, _odTierCls, _odSetBar, _odSetTier, _odCalcSupa, _odCalcMb, _odCalcEm, _odCalcVc, od_renderStaff, od_recalc, loadOwnerLiveData, _renderOwnerLivePanel, openOwnerDash, openReview, openEventApprovals, _pendingEventKey, clearAllTestData, clearAllUsers, toggleHostCat, openHost, showToast, showConfirm, setupReveal, renderNav, pushNav, goBack, renderView, closeActivePopup, goBrowse, setCategory, chatIsOpen, chatUnlockTime, pad2, markSocialSeen, medallionHtml, badgeCellHtml, trophyHtml, trophyCellHtml, resetProfile, getTheme, getBgStyle, resolveCardColors, geocodeBannerHtml } from './facade.js';


export function renderDetail(id){
  const ev=EVENTS.find(e=>e.id===id);
  if(!ev) return `<div class="empty-state">Event not found.</div>`;
  const c=CATS[ev.category]; const attendees=attendeesFor(id); const status=eventStatus(ev);
  const ticket=getTicketForEvent(id); const price=eventPrice(ev);
  const spacesLeft=ev.capacity?Math.max(0,ev.capacity-attendees.length):null;
  const isFull=spacesLeft!==null&&spacesLeft<=0&&!ticket;
  const statusChip=status==='live'?`<button class="live-chip" style="border:none;background:none;cursor:pointer;padding:0;" onclick="document.getElementById('going-section')?.scrollIntoView({behavior:'smooth'})"><span class="dot"></span>Live now</button>`:`<span class="upcoming-chip">${status==='past'?'Ended':'Upcoming'}</span>`;
  const capBadge=ev.capacity?`<span class="event-badge" style="background:var(--surface-2);color:var(--text);border:1px solid var(--line);margin-left:6px;font-size:10px;">${spacesLeft} spaces left</span>`:'';
  const priceBadge=price?`<span class="event-badge" style="background:var(--surface-2);color:var(--text);border:1px solid var(--line);margin-left:6px;font-size:10px;">From £${price}</span>`:`<span class="event-badge" style="background:#22C55E22;color:#22C55E;border:1px solid #22C55E44;margin-left:6px;font-size:10px;">Free</span>`;
  let bookBtn='';
  if(ticket){
    bookBtn=`<button class="btn" style="background:transparent;border:2px solid #22C55E;color:#22C55E;box-shadow:none;width:100%;" onclick="openViewTicket(${id})">✓ You have a ticket — View it</button>`;
  } else if(isFull){
    bookBtn=`<button class="btn" style="background:var(--surface-2);color:var(--text-muted);cursor:not-allowed;width:100%;">Sold Out</button>`;
  } else {
    bookBtn=`<button class="btn" style="background:${c.color};color:#fff;width:100%;font-size:15px;" onclick="openBook(${id})">${price?`Book Now · From £${price}`:'Register Free'} →</button>`;
  }
  const friendsGoing=attendees.filter(isFriend);
  const going=attendees.includes(state.profileName);
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="panel detail-card" style="--corner:${c.color};">
      <div class="detail-hero" style="background-image:url('${catImg(ev.category)}');"></div>
      <span class="event-badge" style="--cat:${c.color};">${ev.category}</span>${statusChip}${capBadge}${priceBadge}
      <h2 class="detail-title">${ev.title}</h2>
      <div style="display:flex;align-items:center;gap:8px;margin:10px 0 6px;flex-wrap:wrap;">
        <span style="font-size:14px;font-weight:700;color:${c.color};">📅 ${ev.date}</span>
        <span style="font-size:13px;font-weight:600;color:var(--text);">· ${ev.time}</span>
      </div>
      <div class="detail-meta-row"><span>${ev.venue}${ev.area?`, ${ev.area}`:''}</span><span>By ${escapeHtml(ev.host)}</span></div>
      <div class="detail-desc">${ev.desc}</div>
      ${bookBtn}
      ${renderPerkPanel(ev)}
      <div class="attendee-section">
        <h3>${attendees.length} going${ev.capacity?` (Limit ${ev.capacity})`:''}${friendsGoing.length?` · <span class="star">★</span> ${friendsGoing.length} friend${friendsGoing.length>1?'s':''}`:''}</h3>
        <div class="attendee-list">${attendees.length?attendees.map(n=>{ const fr=isFriend(n); return `<div class="attendee-chip ${fr?'friend':''}"><div class="avatar" style="margin-left:0">${initials(n)}</div><span>${fr?'<span class="star">★</span> ':''}${escapeHtml(n)}</span></div>`; }).join(''):`<span style="color:var(--text-muted);font-size:13px;">No bookings yet.</span>`}</div>
      </div>
      ${going?`<div style="margin-top:20px;"><button class="btn" style="background:${c.color};color:#fff;width:100%;" onclick="openConnectGateway(${id})">Open Connect Space →</button></div>`:`<div class="connect-note">Book a ticket to unlock the Connect Space — see who's going and chat before the event.</div>`}
    </div>`;
}

export function openEvent(id){ pushNav(); state.view='detail'; state.selectedEventId=id; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

export function checkInToEvent(id){
  const ev=EVENTS.find(e=>e.id===id); if(!ev) return;
  if(!navigator.geolocation){ showToast("Location isn't available on this device",'error'); return; }
  showToast('Checking you in…','info');
  navigator.geolocation.getCurrentPosition(
    pos=>{
      const here={lat:pos.coords.latitude, lon:pos.coords.longitude};
      if(ev.lat!=null && ev.lon!=null && canCheckInAt(here,{lat:ev.lat,lon:ev.lon},200)){
        state.checkedInEventId=id;
        showToast('Checked in — perks unlocked','success');
        renderView();
      } else {
        showToast('You need to be at the venue to check in','error');
      }
    },
    ()=>showToast("Couldn't get your location",'error'),
    {enableHighAccuracy:true, timeout:8000}
  );
}

export async function promptCuratorUnlock(){
  const code = prompt('Enter your curator code (CUR-XXXX-XXXX):');
  if(code===null) return;
  const res = await validateCuratorCode(code);
  if(res.valid){
    state.curatorVerified = true; state.curatorCode = res.code; state.curatorTier = res.tier||'standard';
    showToast('Curator code accepted — perks unlocked','success');
    renderView();
  } else {
    showToast(res.reason==='inactive' ? 'That code is no longer active'
      : res.reason==='unknown' ? "We don't recognise that code"
      : "That doesn't look like a valid curator code",'error');
  }
}

export async function uploadNightShot(evId,input){
  const file=input.files[0]; if(!file) return;
  const reader=new FileReader();
  reader.onload=async function(e){
    const raw=e.target.result;
    const img=new Image(); img.src=raw;
    await new Promise(r=>{ img.onload=r; });
    const canvas=document.createElement('canvas');
    const maxW=900; const scale=Math.min(1,maxW/img.naturalWidth);
    canvas.width=Math.round(img.naturalWidth*scale);
    canvas.height=Math.round(img.naturalHeight*scale);
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    const compressed=canvas.toDataURL('image/jpeg',0.82);
    localStorage.setItem('night_shot:'+evId,compressed);
    try{ await sb.from('events').update({night_shot_url:compressed}).eq('id',evId); }catch(_){}
    const ev=EVENTS.find(e=>e.id===evId); if(ev) ev.nightShotUrl=compressed;
    renderView();
  };
  reader.readAsDataURL(file);
}

export function getFilteredEvents(){
  const q=(document.getElementById('search-input')?.value||'').toLowerCase();
  let list=EVENTS.filter(ev=>{
    const hasLocation=ev.lat!=null&&ev.lon!=null;
    const mc=state.selectedCategory==='all'||ev.category===state.selectedCategory;
    const mq=!q||(ev.title+ev.venue+ev.area+ev.category+ev.host).toLowerCase().includes(q);
    return hasLocation&&mc&&mq;
  });
  if(state.friendsOnly) list=list.filter(ev=>attendeesFor(ev.id).some(isFriend));
  if(state.liveOnly) list=list.filter(ev=>eventStatus(ev)==='live');
  if(state.hotOnly) list=list.filter(ev=>isHotEvent(ev));
  return list;
}

export function toggleFriendsOnly(){
  state.friendsOnly=!state.friendsOnly;
  if(state.friendsOnly){ const any=EVENTS.some(ev=>attendeesFor(ev.id).some(isFriend)); if(!any) showToast("No friends going to events yet. Add friends in the Social tab."); }
  renderView();
}

export function refreshFilters(){
  const el=document.getElementById('map-filters'); if(!el) return;
  const aa=state.selectedCategory==='all';
  let html=`<button class="mchip ${aa?'active':''}" style="${aa?'background:var(--accent);color:#fff;border-color:transparent;':''}" onclick="setCategory('all')">All</button>`;
  html+=Object.entries(CATS).map(([cat,c])=>{ const a=state.selectedCategory===cat; return `<button class="mchip ${a?'active':''}" style="${a?`background:${c.color};color:#fff;border-color:transparent;`:''}" onclick="setCategory('${cat}')"><span class="mdot" style="background:${c.color}"></span>${cat}</button>`; }).join('');
  html+=`<button class="mchip ${state.friendsOnly?'active':''}" style="${state.friendsOnly?'background:var(--gold);color:#1a1400;border-color:transparent;':''}" onclick="toggleFriendsOnly()"><span class="star">★</span> Friends</button>`;
  html+=`<button class="mchip ${state.liveOnly?'active':''}" style="${state.liveOnly?'background:#E23B3B;color:#fff;border-color:transparent;':''}" onclick="toggleLiveOnly()"><span style="width:6px;height:6px;border-radius:50%;background:${state.liveOnly?'#fff':'#E23B3B'};display:inline-block;margin-right:2px;animation:${state.liveOnly?'blink 1.3s ease-in-out infinite':'none'}"></span>Live</button>`;
  html+=`<button class="mchip ${state.hotOnly?'active':''}" style="${state.hotOnly?'background:#F97316;color:#fff;border-color:transparent;':''}" onclick="toggleHotOnly()">🔥 Hot</button>`;
  el.innerHTML=html;
  // Finances now live in Profile → Admin & Finances (no floating map button)
  const fab=document.getElementById('owner-fin-fab');
  if(fab) fab.innerHTML='';
}

export function pinTooltipHtml(ev){
  const status=eventStatus(ev); const c=CATS[ev.category]; const att=attendeesFor(ev.id); const friendsGoing=att.filter(isFriend);
  const statusBadge=status==='live'?`<span class="tip-live"><span class="d"></span>LIVE NOW</span>`:`<span class="tip-up">${status==='past'?'Ended':'Upcoming'}</span>`;
  let goingLine;
  if(att.length===0){ goingLine=`<div class="tip-going none">No one yet — be the first!</div>`; }
  else{ const names=att.slice(0,3).map(n=>isFriend(n)?`<span class="star">★</span> ${escapeHtml(n)}`:escapeHtml(n)); const extra=att.length>3?` +${att.length-3}`:''; goingLine=`<div class="tip-going"><strong>${att.length} going</strong> — ${names.join(', ')}${extra}</div>`; }
  const friendLine=friendsGoing.length?`<div class="tip-friend">★ ${friendsGoing.map(escapeHtml).join(', ')} ${friendsGoing.length>1?'are':'is'} going</div>`:'';
  const capLine=ev.capacity?`<div class="tip-going" style="margin-top:2px;"><strong>${Math.max(0,ev.capacity-att.length)} spaces left</strong></div>`:'';
  return `<div class="evtip-inner" style="--c:${c.color}">
    <div class="tip-top">${statusBadge}<span class="tip-cat" style="background:${c.color}">${ev.category}</span></div>
    <div class="tip-title">${escapeHtml(ev.title)}</div>
    <div class="tip-meta">${ev.date} · ${ev.time}</div>
    <div class="tip-meta">${escapeHtml(ev.venue)}${ev.area?` · ${escapeHtml(ev.area)}`:''}</div>
    ${goingLine}${capLine}${friendLine}
    <div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.07);display:flex;align-items:center;justify-content:space-between;font-size:10.5px;font-weight:700;color:${c.color};letter-spacing:0.04em;">
      <span>Open &amp; RSVP</span>
      <span style="font-size:13px;opacity:0.85;">→</span>
    </div>
  </div>`;
}

export function renderPerkPanel(ev){
  if(isPerkUnlocked(state)){
    return `<div class="perk-panel unlocked">
      <div class="perk-head"><span class="perk-badge">✦ Members' perks</span><span class="perk-status ok">Unlocked</span></div>
      <div class="perk-list">${MEMBER_PERKS.map(p=>`<div class="perk-row"><span class="perk-ic">${p[0]}</span><div><div class="perk-name">${p[1]}</div><div class="perk-sub">${p[2]}</div></div></div>`).join('')}</div>
    </div>`;
  }
  return `<div class="perk-panel locked">
    <div class="perk-head"><span class="perk-badge">🔒 Members' perks</span><span class="perk-status">Locked</span></div>
    <div class="perk-blurb">This event carries members-only perks — guestlist, a welcome drink, and the back room. Unlock them with a curator code, or check in at the venue when you arrive.</div>
    <div class="perk-actions">
      <button class="btn perk-btn-primary" onclick="promptCuratorUnlock()">Enter curator code</button>
      <button class="btn btn-outline perk-btn-secondary" onclick="checkInToEvent(${ev.id})">Check in at the door</button>
    </div>
  </div>`;
}

export function renderCalendar(){
  const weeks=buildCalendarWeeks(CALENDAR_YEAR,CALENDAR_MONTH);
  const eventsByDay={};
  EVENTS.forEach(ev=>{ const d=getEventDay(ev); if(d){ if(!eventsByDay[d]) eventsByDay[d]=[]; eventsByDay[d].push(ev); } });
  const now=new Date(); const todayDay=(now.getFullYear()===CALENDAR_YEAR&&now.getMonth()===CALENDAR_MONTH)?now.getDate():null;
  const cellsHtml=weeks.map(week=>week.map(day=>{
    if(!day) return `<div class="calendar-cell empty"></div>`;
    const dayEvents=eventsByDay[day]||[]; const isToday=day===todayDay;
    const dotN=Math.min(dayEvents.length,4);
    const dots=dayEvents.length?`<div class="cal-dots">${dayEvents.slice(0,dotN).map(ev=>{const cc=(CATS[ev.category]||{color:'var(--accent)'}).color;return `<span class="cal-dot" style="background:${cc};"></span>`;}).join('')}${dayEvents.length>4?`<span class="cal-dot-more">+${dayEvents.length-4}</span>`:''}</div>`:'';
    return `<div class="calendar-cell ${isToday?'today':''} ${dayEvents.length?'has-events':''} pointer" onclick="openCalendarDay(${day})" style="cursor:pointer;"><div class="calendar-day-num">${day}</div>${dots}</div>`;
  }).join('')).join('');
  return `
    <div class="connect-header"><h2>${MONTH_NAMES[CALENDAR_MONTH]} ${CALENDAR_YEAR}</h2><p>What's on this month</p></div>
    <div class="calendar-scroll"><div class="calendar-inner">
      <div class="calendar-header-row">${WEEKDAY_LABELS.map(d=>`<div class="calendar-weekday">${d}</div>`).join('')}</div>
      <div class="calendar-grid">${cellsHtml}</div>
    </div></div>`;
}

export function openCalendarDay(day){
  pushNav(); state.calendarDay=day; state.view='calendar-day';
  renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'});
}

export function renderCalendarDay(){
  const day=state.calendarDay;
  const dateObj=new Date(CALENDAR_YEAR,CALENDAR_MONTH,day);
  const dayLabel=dateObj.toLocaleDateString('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'});
  const eventsByDay={};
  EVENTS.forEach(ev=>{ const d=getEventDay(ev); if(d){ if(!eventsByDay[d]) eventsByDay[d]=[]; eventsByDay[d].push(ev); } });
  const dayEvents=(eventsByDay[day]||[]).sort((a,b)=>a.startsAt-b.startsAt);
  if(!dayEvents.length) return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>${dayLabel}</h2><p>Nothing scheduled today</p></div>
    <div class="empty-state">Nothing on this day. <button class="btn-text" onclick="openHost()">Host one?</button></div>`;
  const cards=dayEvents.map(ev=>{
    const c=CATS[ev.category]; const status=eventStatus(ev);
    const att=attendeesFor(ev.id); const ticket=getTicketForEvent(ev.id);
    const price=eventPrice(ev); const spacesLeft=ev.capacity?Math.max(0,ev.capacity-att.length):null;
    return `<div class="panel" style="--corner:${c.color};padding:18px 20px;margin-bottom:12px;">
      <div style="display:flex;align-items:flex-start;gap:12px;justify-content:space-between;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:6px;">
            <span class="event-badge" style="--cat:;margin-bottom:0;">${ev.category}</span>
            ${status==='live'?`<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live now</span>`:`<span class="upcoming-chip" style="margin-left:0;">Upcoming</span>`}
          </div>
          <div style="font-size:16px;font-weight:800;line-height:1.2;margin-bottom:5px;color:var(--text);">${escapeHtml(ev.title)}</div>
          <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:2px;">${ev.time}</div>
          <div style="font-size:12.5px;color:var(--text-muted);margin-bottom:6px;">${escapeHtml(ev.venue)}, ${escapeHtml(ev.area)}</div>
          <div style="font-size:12px;color:var(--text-soft);">${att.length} going${spacesLeft!==null?` · ${spacesLeft} spaces left`:''} · ${price?`From £${price}`:'Free'}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;">
        ${ticket
          ?`<button class="btn btn-small" style="background:#22C55E;" onclick="openViewTicket(${ev.id})">✓ View Ticket</button>`
          :`<button class="btn btn-small" style="background:${c.color};" onclick="openBook(${ev.id})">${price?'Book Now':'Register Free'}</button>`}
        <button class="btn btn-outline btn-small" onclick="downloadICS(${ev.id})">+ Add to Calendar</button>
        <button class="btn btn-text btn-small" onclick="openEvent(${ev.id})">Details</button>
      </div>
    </div>`;
  }).join('');
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>${dateObj.toLocaleDateString('en-GB',{weekday:'long'})}, ${dateObj.toLocaleDateString('en-GB',{day:'numeric',month:'long'})}</h2><p>${dayEvents.length} event${dayEvents.length!==1?'s':''}</p></div>
    ${cards}`;
}

export function buildCalendarWeeks(year,monthIdx){
  const firstDay=new Date(year,monthIdx,1); const daysInMonth=new Date(year,monthIdx+1,0).getDate();
  const startOffset=(firstDay.getDay()+6)%7; const cells=[];
  for(let i=0;i<startOffset;i++) cells.push(null);
  for(let d=1;d<=daysInMonth;d++) cells.push(d);
  while(cells.length%7!==0) cells.push(null);
  const weeks=[]; for(let i=0;i<cells.length;i+=7) weeks.push(cells.slice(i,i+7));
  return weeks;
}

export function openCalendar(){ pushNav(); state.editingProfile=false; state.view='calendar'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

export function getMyEvents(){ return EVENTS.filter(ev=>(state.rsvps[ev.id]||[]).includes(state.profileName)); }

export function getMyCategories(){ const s=new Set(); getMyEvents().forEach(ev=>s.add(ev.category)); return s; }

export function getEventDay(ev){ const m=ev.date.match(/(\d{1,2})/); return m?parseInt(m[1],10):null; }

export function toggleHotOnly(){ state.hotOnly=!state.hotOnly; if(state.hotOnly) state.liveOnly=false; renderView(); }

export function toggleLiveOnly(){ state.liveOnly=!state.liveOnly; if(state.liveOnly) state.hotOnly=false; renderView(); }

export function computeEventDates(ev){
  const st=new Date(ev.startTime),et=new Date(ev.endTime);
  ev.startsAt=st.getTime(); ev.endsAt=et.getTime();
  const df=new Intl.DateTimeFormat('en-GB',{weekday:'short',day:'numeric',month:'short'});
  const tf=new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit',hour12:true});
  ev.date=df.format(st); ev.time=`${tf.format(st)} - ${tf.format(et)}`;
}