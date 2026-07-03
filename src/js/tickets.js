import { G } from './globals.js';
import { EVENT_SEED, EVENTS, CATS, CAT_IMG, catImg, eventStatus, isHotEvent, generateUniqueId, codeFor, DEMO_PEOPLE, personByName, CARD_BG_STYLES, CARD_ACCENT_COLORS, CARD_THEMES, CARD_PATTERNS, LONDON_AREAS, CATEGORY_KEYWORDS, MILESTONE_BADGES, CATEGORY_BADGES, ALLROUNDER_BADGE, TOTAL_CATEGORIES, SPECIAL_BADGES, LEVELS, getLevel, INTEREST_PRESETS, CALENDAR_YEAR, CALENDAR_MONTH, MONTH_NAMES, WEEKDAY_LABELS, BLOT_SVG, EMAIL_PATTERN } from './constants.js';
import { sb } from './config.js';
import { validateCuratorCode, adminSendCode, adminVerifyCode, isAdminSession, isPerkUnlocked, distanceMeters, canCheckInAt } from './services.js';
import { renderGate, switchAuthMode, _updateCuratorVisibility, switchSignupType, showLpSignup, closeLpSignup, lpUpdatePassName, _cacheSession, _restoreUserFromRow, submitGate, _submitHostApplication, signOut, enterApp, promptAdminSignIn, persistProfile, applyMapChrome, resolveEventLocations, buildEventsGeoJSON, updateClusterPaint, attachMapLayers, syncHtmlMarkers, refreshMarkers, initLeaflet, initHostMap, handleAddressAutocomplete, selectSearchSuggestion, selectAutocompleteAddress, showMapLayer, persistGeocodeCache, geocodeAddress, openCardEditor, captureDraftFields, handleCardPhoto, removeCardPhoto, selectCardTheme, selectCardAccentColor, selectCardPattern, setPatternOpacity, toggleCardArea, updateCardPreview, renderCardEditor, switchCeTab, saveCard, initCardSheen, getCardExt, saveCardExt, openExpandedCard, closeExpandedCard, renderProfile, editProfile, updateAboutCounter, saveProfileAbout, toggleProfileInterest, getAllBadges, getFeaturedBadges, openBadgePicker, toggleFeaturedBadge, closeBadgePicker, renderAchievements, openAchievements, renderDetail, openEvent, checkInToEvent, promptCuratorUnlock, uploadNightShot, getFilteredEvents, toggleFriendsOnly, refreshFilters, pinTooltipHtml, renderPerkPanel, renderCalendar, openCalendarDay, renderCalendarDay, buildCalendarWeeks, openCalendar, getMyEvents, getMyCategories, getEventDay, toggleHotOnly, toggleLiveOnly, computeEventDates, loadFriends, addFriend, removeFriend, renderConnect, openFriends, openConnectGateway, openConnect, peekAttendee, closeAttendeePeek, toggleGoingSection, _buildChatMsgHtml, _appendChatMsg, sendChat, renderSocialTab, startChatCountdown, getUnreadSocialCount, openSocialForEvent, openSocialTab, setHostType, initOwnerDash, renderOwnerDash, renderHostPayoutsPanel, renderReview, loadAndRenderReview, _buildReviewCard, reviewHost, renderEventApprovals, loadAndRenderEventApprovals, _buildEventApprovalCard, decideEvent, _publishApprovedEvent, submitHostEvent, od_tog, _odPlatformFee, _odVatOnFee, _odStripeCost, _odBarCol, _odTierCls, _odSetBar, _odSetTier, _odCalcSupa, _odCalcMb, _odCalcEm, _odCalcVc, od_renderStaff, od_recalc, loadOwnerLiveData, _renderOwnerLivePanel, openOwnerDash, openReview, openEventApprovals, _pendingEventKey, clearAllTestData, clearAllUsers, toggleHostCat, openHost, showToast, showConfirm, setupReveal, renderNav, pushNav, goBack, renderView, closeActivePopup, goBrowse, setCategory, chatIsOpen, chatUnlockTime, pad2, markSocialSeen, medallionHtml, badgeCellHtml, trophyHtml, trophyCellHtml, resetProfile, getTheme, getBgStyle, resolveCardColors, geocodeBannerHtml } from './facade.js';


export function ticketTypes(ev){
  const basePrice=eventPrice(ev);
  if(!basePrice) return [{id:'free',label:'Free Registration',price:0,platformFee:0,desc:'Claim your spot — no charge'}];
  const platformFee=getCumulusFee(basePrice);
  return [{id:'general',label:'General Admission',price:basePrice,platformFee,desc:'Standard entry to the event'}];
}

export function renderBook(){
  const ev=EVENTS.find(e=>e.id===G.bookingDraft.eventId); if(!ev) return '<div class="empty-state">Event not found.</div>';
  const c=CATS[ev.category]; const types=ticketTypes(ev);
  const sel=types.find(t=>t.id===G.bookingDraft.type)||types[0];
  const isFree=!eventPrice(ev); const qty=G.bookingDraft.qty;
  const baseTotal=sel.price*qty; const feeTotal=(sel.platformFee||0)*qty; const finalTotal=baseTotal+feeTotal;
  const typeCards=types.map(t=>`
    <div onclick="setBookingType('${t.id}')" style="border:2px solid ${G.bookingDraft.type===t.id?c.color:'var(--line)'};border-radius:14px;padding:14px 16px;cursor:pointer;background:${G.bookingDraft.type===t.id?hexToRgba(c.color,0.07):'var(--surface-2)'};transition:all .15s;margin-bottom:10px;">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
        <div><div style="font-weight:700;font-size:14px;color:var(--text);">${t.label}</div><div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${t.desc}</div></div>
        <div style="font-size:18px;font-weight:800;color:${G.bookingDraft.type===t.id?c.color:'var(--text)'};">${t.price?`£${t.price.toFixed(2)}`:'Free'}</div>
      </div>
    </div>`).join('');
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><span class="event-badge" style="--cat:;">${ev.category}</span><h2>${escapeHtml(ev.title)}</h2><p>${ev.date} · ${escapeHtml(ev.venue)}</p></div>
    <div class="section-title">Choose your ticket</div>
    ${typeCards}
    ${!isFree?`
    <div class="section-title">Quantity</div>
    <div class="panel" style="--corner:var(--accent);padding:16px 20px;display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <button class="btn btn-outline" style="width:42px;height:42px;padding:0;font-size:22px;border-radius:50%;flex-shrink:0;" onclick="setBookingQty(${qty-1})">−</button>
      <div style="text-align:center;"><div style="font-size:30px;font-weight:800;color:var(--text);">${qty}</div><div style="font-size:11px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.5px;">ticket${qty!==1?'s':''}</div></div>
      <button class="btn btn-outline" style="width:42px;height:42px;padding:0;font-size:22px;border-radius:50%;flex-shrink:0;" onclick="setBookingQty(${qty+1})">+</button>
    </div>`:''}
    <div class="panel" style="--corner:${c.color};padding:16px 20px;background:${hexToRgba(c.color,0.05)};margin-bottom:18px;">
      <div style="font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.7px;margin-bottom:10px;">Order summary</div>
      <div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--text-soft);margin-bottom:6px;"><span>${sel.label}${!isFree?` × ${qty}`:''}</span><span>${sel.price?`£${baseTotal.toFixed(2)}`:'Free'}</span></div>
      ${!isFree?`
      <div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--text-soft);margin-bottom:4px;"><span>Cumulus platform fee</span><span>£${feeTotal.toFixed(2)}</span></div>
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px;font-style:italic;">The host keeps 100% of their ticket price.</div>`:''}
      <div style="display:flex;justify-content:space-between;font-size:16px;font-weight:800;color:var(--text);padding-top:10px;border-top:1px solid var(--line);"><span>Total</span><span style="color:${c.color};">${finalTotal?`£${finalTotal.toFixed(2)}`:'Free'}</span></div>
    </div>
    <button class="btn" style="width:100%;background:${c.color};padding:14px;font-size:15px;" onclick="${isFree?`registerFree(${ev.id})`:`proceedToCheckout()`}">${isFree?'Register Free →':`Continue to Payment · £${finalTotal.toFixed(2)} →`}</button>`;
}

export function renderCheckout(){
  const ev=EVENTS.find(e=>e.id===G.bookingDraft.eventId); if(!ev) return '';
  const c=CATS[ev.category]; const types=ticketTypes(ev);
  const sel=types.find(t=>t.id===G.bookingDraft.type)||types[0];
  const total=((sel.price+(sel.platformFee||0))*G.bookingDraft.qty).toFixed(2);
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>Payment</h2><p>${escapeHtml(ev.title)} · ${sel.label} × ${G.bookingDraft.qty}</p></div>
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

export function renderConfirmed(){
  const tickets=G.bookingDraft.confirmedTickets||[]; if(!tickets.length) return '<div class="empty-state">No tickets found.</div>';
  const t0=tickets[0]; const ev=EVENTS.find(e=>e.id===t0.eventId); if(!ev) return '';
  const c=CATS[ev.category]; const purchased=new Date(t0.purchasedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'});
  const totalPaid=tickets.reduce((s,t)=>s+(t.total||0),0);
  const ticketCards=tickets.map((t,i)=>`
    <div class="panel" style="--corner:${c.color};overflow:visible;margin-bottom:${i<tickets.length-1?'20':'0'}px;border-radius:20px;">
      <div style="position:relative;padding:18px 18px 20px;border-bottom:2px dashed var(--line);">
        <div style="position:absolute;left:-13px;bottom:-14px;width:26px;height:26px;border-radius:50%;background:var(--bg);border:1px solid var(--line);z-index:2;"></div>
        <div style="position:absolute;right:-13px;bottom:-14px;width:26px;height:26px;border-radius:50%;background:var(--bg);border:1px solid var(--line);z-index:2;"></div>
        ${tickets.length>1?`<div style="font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:1px;color:${c.color};margin-bottom:6px;">Ticket ${t.seatNum} of ${t.totalSeats}</div>`:''}
        <span class="event-badge" style="--cat:;margin-bottom:6px;">${ev.category}</span>
        <div style="font-size:17px;font-weight:800;margin:6px 0 4px;line-height:1.2;color:var(--text);">${escapeHtml(ev.title)}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:1px;">${ev.date} · ${ev.time}</div>
        <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(ev.venue)}, ${escapeHtml(ev.area)}</div>
        <div style="margin-top:12px;display:flex;gap:8px;font-size:12px;">
          <div style="background:var(--surface-2);border-radius:9px;padding:7px 10px;flex:1;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Type</div><div style="font-weight:700;color:var(--text);margin-top:1px;">${t.typeLabel}</div></div>
          <div style="background:var(--surface-2);border-radius:9px;padding:7px 10px;flex:1;"><div style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-muted);">Paid</div><div style="font-weight:700;color:${c.color};margin-top:1px;">${t.total?`£${t.total.toFixed(2)}`:'Free'}</div></div>
        </div>
      </div>
      <div style="padding:18px;text-align:center;">
        <div id="ticket-qr-${i}" style="width:134px;height:134px;margin:0 auto 10px;background:#fff;border-radius:12px;display:flex;align-items:center;justify-content:center;padding:7px;"></div>
        <div style="font-family:ui-monospace,monospace;font-size:11.5px;font-weight:700;color:var(--text);letter-spacing:1.5px;">${t.ticketId}</div>
        <div style="font-size:10px;color:var(--text-muted);margin-top:2px;">Show at the door · Purchased ${purchased}</div>
      </div>
    </div>`).join('');
  return `<div style="text-align:center;padding:20px 0 16px;">
      <div style="width:58px;height:58px;border-radius:50%;background:#22C55E;display:flex;align-items:center;justify-content:center;margin:0 auto 10px;font-size:24px;box-shadow:0 4px 18px rgba(34,197,94,0.3);">✓</div>
      <div style="font-size:21px;font-weight:800;color:var(--text);">${totalPaid?'Payment confirmed!':'You\'re registered!'}</div>
      <div style="font-size:12.5px;color:var(--text-muted);margin-top:3px;">${tickets.length} ticket${tickets.length!==1?'s':''} · ${totalPaid?`£${totalPaid.toFixed(2)} total`:'Free'}</div>
    </div>
    ${ticketCards}
    <div style="display:flex;flex-direction:column;gap:10px;margin-top:20px;">
      <button class="btn" style="background:${c.color};" onclick="downloadICS(${ev.id})">+ Add to Calendar</button>
      <button class="btn btn-outline" onclick="openSocialForEvent(${ev.id})">Join Group Chat</button>
      <button class="btn btn-text" onclick="openTicketsTab()">View all my tickets →</button>
    </div>`;
}

export function renderMyTickets(){
  if(!G.myTickets.length) return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>My Tickets</h2><p>All your event bookings</p></div>
    <div class="empty-state">No tickets yet — browse events and book your first one.</div>`;
  const cards=[...myTickets].reverse().map(t=>{
    const ev=EVENTS.find(e=>e.id===t.eventId); if(!ev) return '';
    const c=CATS[ev.category]; const status=eventStatus(ev);
    const d=new Date(t.purchasedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'});
    return `<div class="panel" style="--corner:${c.color};padding:16px 18px;margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:12px;">
        <div style="flex:1;min-width:0;">
          <span class="event-badge" style="--cat:;font-size:10px;">${ev.category}</span>
          ${status==='live'?`<span class="live-chip" style="margin-left:6px;"><span class="dot"></span>Live</span>`:''}
          <div style="font-size:15px;font-weight:700;margin:6px 0 3px;line-height:1.2;">${escapeHtml(ev.title)}</div>
          <div style="font-size:12px;color:var(--text-muted);">${ev.date} · ${escapeHtml(ev.venue)}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-top:2px;">${t.qty} × ${t.typeLabel}</div>
        </div>
        <div style="text-align:right;flex-shrink:0;">
          <div style="font-size:16px;font-weight:800;color:${c.color};">${t.total?`£${t.total.toFixed(2)}`:'Free'}</div>
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
    </div>`;
  }).join('');
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header"><h2>My Tickets</h2><p>${G.myTickets.length} booking${G.myTickets.length!==1?'s':''}</p></div>
    ${cards}`;
}

export async function processPayment(){
  const name=(document.getElementById('pay-name')?.value||'').trim();
  const card=(document.getElementById('pay-card')?.value||'').replace(/\s/g,'');
  const expiry=document.getElementById('pay-expiry')?.value||'';
  const cvv=(document.getElementById('pay-cvv')?.value||'').trim();
  if(!name||card.length<15||expiry.length<4||cvv.length<3){ showToast('Please fill in all payment details correctly.','error'); return; }
  const btn=document.getElementById('pay-btn');
  if(btn){btn.disabled=true;btn.innerHTML='<span style="opacity:.7">Processing…</span>';}
  await new Promise(r=>setTimeout(r,1800));
  const ev=EVENTS.find(e=>e.id===G.bookingDraft.eventId);
  const sel=ticketTypes(ev).find(t=>t.id===G.bookingDraft.type)||ticketTypes(ev)[0];
  const baseId=generateTicketId(); const n=G.bookingDraft.qty;
  const platformFee=sel.platformFee||0;
  const totalCharged=sel.price+platformFee;
  const newTickets=Array.from({length:n},(_,i)=>({
    ticketId:n>1?`${baseId}-${String(i+1).padStart(2,'0')}`:baseId,
    seatNum:n>1?i+1:null, totalSeats:n>1?n:null, bookingId:baseId,
    eventId:ev.id, type:sel.id, typeLabel:sel.label,
    pricePerTicket:sel.price, platformFee,
    total:totalCharged,
    purchaserName:state.profileName, purchasedAt:Date.now()
  }));
  G.myTickets.push(...newTickets);
  await _insertTickets(newTickets);
  const list=state.rsvps[ev.id]||[];
  if(!list.includes(state.profileName)){
    await sb.from('rsvps').insert({event_id:ev.id,user_id:state.userId,user_name:state.profileName});
    state.rsvps[ev.id]=[...list,state.profileName];
  }
  G.bookingDraft.confirmedTickets=newTickets; G.navStack=[];
  state.view='confirmed'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'});
}

export async function loadMyTickets(){
  if(!state.userId){ const r=await localGet(`tickets:${state.profileName}`); G.myTickets=r?JSON.parse(r):[]; return; }
  const {data}=await sb.from('tickets').select('*').eq('user_id',state.userId).order('purchased_at',{ascending:false});
  if(data) G.myTickets=data.map(t=>({
    ticketId:t.ticket_id, bookingId:t.booking_id, seatNum:t.seat_num, totalSeats:t.total_seats,
    eventId:t.event_id, type:t.ticket_type, typeLabel:t.type_label,
    pricePerTicket:t.price_per_ticket, total:t.total,
    purchaserName:t.purchaser_name, purchasedAt:new Date(t.purchased_at).getTime()
  }));
}

export async function _insertTickets(tickets){
  if(!state.userId) return;
  const rows=tickets.map(t=>({
    ticket_id:t.ticketId, booking_id:t.bookingId, seat_num:t.seatNum||null, total_seats:t.totalSeats||null,
    event_id:t.eventId, user_id:state.userId, ticket_type:t.type, type_label:t.typeLabel,
    price_per_ticket:t.pricePerTicket, total:t.total,
    purchaser_name:t.purchaserName, purchased_at:new Date(t.purchasedAt).toISOString()
  }));
  await sb.from('tickets').insert(rows);
}

export function openBook(id){
  pushNav(); G.bookingDraft={eventId:id,qty:1,confirmedTicket:null};
  const ev=EVENTS.find(e=>e.id===id);
  G.bookingDraft.type=ev?ticketTypes(ev)[0].id:'general';
  state.view='book'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'});
}

export function openViewTicket(evId){
  pushNav();
  const eventTickets=G.myTickets.filter(t=>t.eventId===evId);
  if(!eventTickets.length){openBook(evId);return;}
  G.bookingDraft.confirmedTickets=eventTickets; state.view='confirmed'; renderNav(); renderView();
  window.scrollTo({top:0,behavior:'smooth'});
}

export async function registerFree(evId){
  const ev=EVENTS.find(e=>e.id===evId); if(!ev) return;
  const baseId=generateTicketId(); const nf=G.bookingDraft.qty||1;
  const freeTickets=Array.from({length:nf},(_,i)=>({
    ticketId:nf>1?`${baseId}-${String(i+1).padStart(2,'0')}`:baseId,
    seatNum:nf>1?i+1:null, totalSeats:nf>1?nf:null, bookingId:baseId,
    eventId:ev.id,type:'free',typeLabel:'Free Registration',pricePerTicket:0,total:0,
    purchaserName:state.profileName,purchasedAt:Date.now()
  }));
  G.myTickets.push(...freeTickets);
  await _insertTickets(freeTickets);
  // RSVP via Supabase
  const list=state.rsvps[ev.id]||[];
  if(!list.includes(state.profileName)){
    await sb.from('rsvps').insert({event_id:ev.id,user_id:state.userId,user_name:state.profileName});
    state.rsvps[ev.id]=[...list,state.profileName];
  }
  G.bookingDraft.confirmedTickets=freeTickets; G.navStack=[];
  state.view='confirmed'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'});
}

export function afterRenderConfirmed(){
  const tickets=G.bookingDraft.confirmedTickets||[]; if(!tickets.length) return;
  tickets.forEach((t,i)=>{
    const el=document.getElementById(`ticket-qr-${i}`); if(!el) return;
    el.innerHTML='';
    try{ new QRCode(el,{text:t.ticketId,width:120,height:120,colorDark:'#000',colorLight:'#fff',correctLevel:QRCode.CorrectLevel.M}); }
    catch(e){ el.innerHTML=`<div style="font-size:10px;word-break:break-all;color:#333;">${t.ticketId}</div>`; }
  });
}

export function downloadICS(evId){
  const ev=EVENTS.find(e=>e.id===evId); if(!ev) return;
  const pad=n=>String(n).padStart(2,'0');
  const fmtDT=d=>{ const u=new Date(d); return `${u.getUTCFullYear()}${pad(u.getUTCMonth()+1)}${pad(u.getUTCDate())}T${pad(u.getUTCHours())}${pad(u.getUTCMinutes())}${pad(u.getUTCSeconds())}Z`; };
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Cumulus Events//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','BEGIN:VEVENT',
    `UID:cumulus-${ev.id}-${Date.now()}@cumulus.app`,`DTSTART:${fmtDT(ev.startTime)}`,`DTEND:${fmtDT(ev.endTime)}`,
    `SUMMARY:${ev.title}`,`DESCRIPTION:${ev.desc.replace(/[\\;,]/g,'\\$&').replace(/\n/g,'\\n')} — Hosted by ${ev.host}`,
    `LOCATION:${ev.venue}\\, ${ev.area}\\, London`,`ORGANIZER;CN="${ev.host}":mailto:events@cumulus.app`,
    'STATUS:CONFIRMED','TRANSP:OPAQUE','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const blob=new Blob([ics],{type:'text/calendar;charset=utf-8'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url; a.download=ev.title.replace(/[^a-z0-9]/gi,'-').replace(/-+/g,'-')+'.ics';
  document.body.appendChild(a); a.click(); setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); },1000);
}

export function getCumulusFee(ticketPrice){
  if(ticketPrice<=0) return 0;
  if(ticketPrice<=15) return 1.50;
  if(ticketPrice<=40) return 2.50;
  if(ticketPrice<=71) return 3.50;
  return 4.50;
}

export function formatCardNumber(el){ let v=el.value.replace(/\D/g,'').slice(0,16); el.value=v.replace(/(.{4})/g,'$1 ').trim(); }

export function formatExpiry(el){ let v=el.value.replace(/\D/g,'').slice(0,4); if(v.length>2) v=v.slice(0,2)+'/'+v.slice(2); el.value=v; }

export function openTicketsTab(){ state.view='tickets'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

export function renderTicketsTab(){
  const byEvent={};
  G.myTickets.forEach(t=>{ if(!byEvent[t.eventId]) byEvent[t.eventId]=[]; byEvent[t.eventId].push(t); });
  const sortedIds=Object.keys(byEvent).map(Number).sort((a,b)=>{
    const ea=EVENTS.find(e=>e.id===a), eb=EVENTS.find(e=>e.id===b);
    return (ea?.startsAt||0)-(eb?.startsAt||0);
  });
  const upcoming=sortedIds.filter(id=>{ const ev=EVENTS.find(e=>e.id===id); return ev&&eventStatus(ev)!=='past'; });
  const past=sortedIds.filter(id=>{ const ev=EVENTS.find(e=>e.id===id); return ev&&eventStatus(ev)==='past'; });

  const renderGroup=(ids,label)=>{
    if(!ids.length) return '';
    const cards=ids.map(evId=>{
      const ev=EVENTS.find(e=>e.id===evId); if(!ev) return '';
      const c=CATS[ev.category]; const tickets=byEvent[evId];
      const status=eventStatus(ev); const chatOpen=chatIsOpen(ev);
      const total=tickets.reduce((s,t)=>s+(t.total||0),0);
      return `<div class="panel" style="--corner:${c.color};padding:16px 18px;margin-bottom:12px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:12px;">
          <div style="flex:1;min-width:0;">
            <div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin-bottom:5px;">
              <span class="event-badge" style="--cat:;margin-bottom:0;">${ev.category}</span>
              ${status==='live'?`<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live</span>`:''}
              ${chatOpen&&status!=='past'?`<span style="font-size:9.5px;font-weight:700;color:var(--accent);background:rgba(232,184,75,0.12);padding:2px 7px;border-radius:999px;border:1px solid var(--accent);">Chat open</span>`:''}
            </div>
            <div style="font-size:15px;font-weight:700;line-height:1.2;margin-bottom:4px;">${escapeHtml(ev.title)}</div>
            <div style="font-size:12px;color:var(--text-muted);">${ev.date} · ${ev.time}</div>
            <div style="font-size:12px;color:var(--text-muted);">${escapeHtml(ev.venue)}, ${escapeHtml(ev.area)}</div>
          </div>
          <div style="text-align:right;flex-shrink:0;">
            <div style="font-size:15px;font-weight:800;color:${c.color};">${total?`£${total.toFixed(2)}`:'Free'}</div>
            <div style="font-size:11px;color:var(--text-muted);">${tickets.length} ticket${tickets.length!==1?'s':''}</div>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button class="btn btn-small" style="background:${c.color};" onclick="openViewTicket(${evId})">View Ticket${tickets.length>1?'s':''}</button>
          ${chatOpen&&status!=='past'?`<button class="btn btn-outline btn-small" onclick="openSocialForEvent(${evId})">Join Chat</button>`:''}
          <button class="btn btn-text btn-small" onclick="downloadICS(${evId})">+ Cal</button>
        </div>
      </div>`;
    }).join('');
    return `<div class="section-title">${label}</div>${cards}`;
  };

  if(!G.myTickets.length) return `
    <div class="connect-header" style="padding-top:16px;"><h2>My Tickets</h2><p>Your event bookings</p></div>
    <div class="empty-state">No tickets yet — browse events and book your first one.<br><br><button class="btn" onclick="goBrowse()">Browse Events</button></div>`;
  return `
    <div class="connect-header" style="padding-top:16px;"><h2>My Tickets</h2><p>${upcoming.length} upcoming · ${past.length} past</p></div>
    ${renderGroup(upcoming,'Upcoming')}
    ${renderGroup(past,'Past')}`;
}

export function generateTicketId(){ return 'CU-'+Math.random().toString(36).slice(2,8).toUpperCase(); }

export function getTicketForEvent(evId){ return G.myTickets.find(t=>t.eventId===evId); }

export function setBookingType(type){ G.bookingDraft.type=type; renderView(); }

export function setBookingQty(q){ G.bookingDraft.qty=Math.max(1,Math.min(10,q)); renderView(); }

export function proceedToCheckout(){ pushNav(); state.view='checkout'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }