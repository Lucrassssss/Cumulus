import { G } from './globals.js';
import { EVENT_SEED, EVENTS, CATS, CAT_IMG, catImg, eventStatus, isHotEvent, generateUniqueId, codeFor, DEMO_PEOPLE, personByName, CARD_BG_STYLES, CARD_ACCENT_COLORS, CARD_THEMES, CARD_PATTERNS, LONDON_AREAS, CATEGORY_KEYWORDS, MILESTONE_BADGES, CATEGORY_BADGES, ALLROUNDER_BADGE, TOTAL_CATEGORIES, SPECIAL_BADGES, LEVELS, getLevel, INTEREST_PRESETS, CALENDAR_YEAR, CALENDAR_MONTH, MONTH_NAMES, WEEKDAY_LABELS, BLOT_SVG, EMAIL_PATTERN } from './constants.js';
import { sb } from './config.js';
import { validateCuratorCode, adminSendCode, adminVerifyCode, isAdminSession, isPerkUnlocked, distanceMeters, canCheckInAt } from './services.js';
import { renderGate, switchAuthMode, _updateCuratorVisibility, switchSignupType, showLpSignup, closeLpSignup, lpUpdatePassName, _cacheSession, _restoreUserFromRow, submitGate, _submitHostApplication, signOut, enterApp, promptAdminSignIn, persistProfile, applyMapChrome, resolveEventLocations, buildEventsGeoJSON, updateClusterPaint, attachMapLayers, syncHtmlMarkers, refreshMarkers, initLeaflet, initHostMap, handleAddressAutocomplete, selectSearchSuggestion, selectAutocompleteAddress, showMapLayer, persistGeocodeCache, geocodeAddress, openCardEditor, captureDraftFields, handleCardPhoto, removeCardPhoto, selectCardTheme, selectCardAccentColor, selectCardPattern, setPatternOpacity, toggleCardArea, updateCardPreview, renderCardEditor, switchCeTab, saveCard, initCardSheen, getCardExt, saveCardExt, openExpandedCard, closeExpandedCard, renderProfile, editProfile, updateAboutCounter, saveProfileAbout, toggleProfileInterest, getAllBadges, getFeaturedBadges, openBadgePicker, toggleFeaturedBadge, closeBadgePicker, renderAchievements, openAchievements, renderDetail, openEvent, checkInToEvent, promptCuratorUnlock, uploadNightShot, getFilteredEvents, toggleFriendsOnly, refreshFilters, pinTooltipHtml, renderPerkPanel, renderCalendar, openCalendarDay, renderCalendarDay, buildCalendarWeeks, openCalendar, getMyEvents, getMyCategories, getEventDay, toggleHotOnly, toggleLiveOnly, computeEventDates, ticketTypes, renderBook, renderCheckout, renderConfirmed, renderMyTickets, processPayment, loadMyTickets, _insertTickets, openBook, openViewTicket, registerFree, afterRenderConfirmed, downloadICS, getCumulusFee, formatCardNumber, formatExpiry, openTicketsTab, renderTicketsTab, generateTicketId, getTicketForEvent, setBookingType, setBookingQty, proceedToCheckout, initOwnerDash, renderOwnerDash, renderHostPayoutsPanel, renderReview, loadAndRenderReview, _buildReviewCard, reviewHost, renderEventApprovals, loadAndRenderEventApprovals, _buildEventApprovalCard, decideEvent, _publishApprovedEvent, submitHostEvent, od_tog, _odPlatformFee, _odVatOnFee, _odStripeCost, _odBarCol, _odTierCls, _odSetBar, _odSetTier, _odCalcSupa, _odCalcMb, _odCalcEm, _odCalcVc, od_renderStaff, od_recalc, loadOwnerLiveData, _renderOwnerLivePanel, openOwnerDash, openReview, openEventApprovals, _pendingEventKey, clearAllTestData, clearAllUsers, toggleHostCat, openHost, showToast, showConfirm, setupReveal, renderNav, pushNav, goBack, renderView, closeActivePopup, goBrowse, setCategory, chatIsOpen, chatUnlockTime, pad2, markSocialSeen, medallionHtml, badgeCellHtml, trophyHtml, trophyCellHtml, resetProfile, getTheme, getBgStyle, resolveCardColors, geocodeBannerHtml } from './facade.js';


export async function loadFriends(){
  if(!state.userId) return;
  const {data}=await sb.from('friends').select('friend_name').eq('user_id',state.userId);
  if(data){
    const fromDb=data.map(f=>f.friend_name);
    // Merge: keep in-session additions not yet in DB, avoid duplicates
    const merged=[...new Set([...fromDb,...state.friends])];
    state.friends=merged;
  }
}

export async function addFriend(friendName,friendUserId){
  if(state.friends.includes(friendName)) return;
  await sb.from('friends').insert({user_id:state.userId,friend_id:friendUserId,friend_name:friendName});
  state.friends.push(friendName);
  renderView();
}

export async function removeFriend(name){
  state.friends=state.friends.filter(f=>f!==name);
  if(state.userId){
    await sb.from('friends').delete().eq('user_id',state.userId).eq('friend_name',name);
  }
  renderView();
}

export function renderConnect(id){
  const ev=EVENTS.find(e=>e.id===id);
  if(!ev) return `<div class="empty-state">Event not found.</div>`;
  const c=CATS[ev.category]; const attendees=attendeesFor(id); const cardsMap=state.attendeeCards[id]||{}; const chat=state.chats[id]||[]; const myCard=state.myCard;
  let _myExt={motto:'',pattern:'lines',areas:[],accentColor:'#CBA43A',bgStyle:'obsidian'};
  try{ const _r=localStorage.getItem('card_ext:'+state.profileName); if(_r) _myExt={..._myExt,...JSON.parse(_r)}; }catch(e){}
  const _myCols=resolveCardColors(_myExt.bgStyle||myCard?.theme||'obsidian',_myExt.accentColor||myCard?.accentColor||'#CBA43A');
  const _myAccent=_myCols.accent;
  const yourCardHtml=myCard
    ?`<div class="panel intro-card" style="--corner:${_myAccent};background:${_myCols.bg};border-color:${_myAccent}33;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;">
          <div class="intro-name" style="color:${_myCols.text};">${escapeHtml(myCard.name)}</div>
        </div>
        ${_myExt.motto?`<div style="font-size:11px;font-style:italic;font-weight:700;color:${_myAccent};margin-bottom:6px;">"${escapeHtml(_myExt.motto)}"</div>`:''}
        ${myCard.bio?`<div class="intro-field-label" style="color:${_myCols.textSoft};">About</div><div class="intro-field-val" style="color:${_myCols.textSoft};">${escapeHtml(myCard.bio)}</div>`:''}
        ${myCard.interests?`<div class="intro-field-label" style="color:${_myCols.textSoft};">Interests</div><div class="interest-tags">${myCard.interests.split(',').map(t=>`<span class="interest-tag" style="border-color:${_myAccent};color:${_myCols.text};">${escapeHtml(t.trim())}</span>`).join('')}</div>`:''}
        <div style="margin-top:12px;"><button class="btn btn-outline btn-small" style="width:100%;border-color:${_myAccent};color:${_myCols.text};" onclick="openCardEditor(null)">Edit your card</button></div>
      </div>`
    :`<div class="panel intro-form"><div style="font-weight:700;font-size:15px;margin-bottom:5px;color:var(--text);">No card yet</div><div style="font-size:13px;color:var(--text-muted);margin-bottom:12px;">Create one and it'll show up here and at every future event automatically.</div><button class="btn btn-small" style="width:100%;" onclick="openCardEditor(${id})">Create your card</button></div>`;
  const others=attendees.filter(n=>n!==state.profileName);
  const goingOpen=!!(state.goingOpen&&state.goingOpen[id]);
  // Preview avatars (collapsed state)
  const previewAvas=others.slice(0,5).map(name=>{
    const card=cardsMap[name]; const ct=card?getTheme(card.theme):null;
    const avaColor=ct?ct.accent:'var(--accent)';
    return `<div class="going-preview-ava" style="background:${avaColor};">${initials(name)}</div>`;
  }).join('');
  // Full grid cards (expanded state)
  const goingGridHtml=others.length?others.map(name=>{
    const card=cardsMap[name]; const fr=isFriend(name); const person=personByName(name);
    const ct=card?getTheme(card.theme):null;
    const avaColor=ct?ct.accent:'var(--accent)';
    const cbg=ct?ct.bg:'var(--surface)'; const cborder=ct?ct.border:'var(--line)';
    const ctext=ct?ct.text:'var(--text)'; const ctextSoft=ct?ct.textSoft:'var(--text-muted)';
    const bioSnippet=card?card.bio:person?person.blurb:'';
    const interests=card&&card.interests?card.interests.split(',').map(s=>s.trim()).filter(Boolean).slice(0,2):[];
    const tagsHtml=interests.map(t=>`<span class="going-card-tag" style="border-color:${avaColor}55;color:${ctext};background:${avaColor}18;">${escapeHtml(t)}</span>`).join('');
    const safeName=escapeHtml(name).replace(/'/g,"\\'");
    return `<div class="going-card" style="background:${cbg};border-color:${cborder};" onclick="peekAttendee(${id},'${safeName}')">
      <div class="going-card-ava" style="background:${avaColor};">${initials(name)}</div>
      <div class="going-card-name" style="color:${ctext};">${escapeHtml(name)}${fr?` <span style="color:var(--gold);font-size:10px;">★</span>`:''}</div>
      ${bioSnippet?`<div class="going-card-bio" style="color:${ctextSoft};">${escapeHtml(bioSnippet)}</div>`:''}
      ${tagsHtml?`<div class="going-card-tags">${tagsHtml}</div>`:''}
    </div>`;
  }).join(''):`<div style="color:var(--text-muted);font-size:13px;padding:12px 0;text-align:center;grid-column:1/-1;">No one else has RSVP'd yet.</div>`;
  const ownTheme=_myCols;
  // Night Shot
  const _nsUrl=ev.nightShotUrl||localStorage.getItem('night_shot:'+id);
  const _isAttendee=attendees.includes(state.profileName);
  const nightShotSection=(eventStatus(ev)==='past'&&_isAttendee)?`
    <div class="section-title" style="color:#FCD34D;">The Night Shot</div>
    <div class="night-shot-panel">
      <div class="night-shot-glow"></div>
      ${_nsUrl
        ?`<div class="night-shot-hd">The memory's in.</div>
           <div class="night-shot-desc">${escapeHtml(ev.title)} · ${ev.date}</div>
           <div class="night-shot-img-frame">
             <img src="${_nsUrl}" class="night-shot-img" alt="Night Shot"/>
             <div class="night-shot-watermark">
               <div class="night-shot-watermark-badge">📸 ${escapeHtml(ev.title)}</div>
               <div class="night-shot-watermark-badge">${ev.date}</div>
             </div>
           </div>`
        :`<div class="night-shot-hd">Drop the Night Shot.</div>
           <div class="night-shot-desc">One photo from the night. The memory lives here — and on every attendee's profile.</div>
           <label class="night-shot-upload-zone">
             <input type="file" accept="image/*" onchange="uploadNightShot(${id},this)"/>
             <div style="font-size:30px;margin-bottom:8px;">📸</div>
             <div style="font-size:14px;font-weight:700;color:#FCD34D;">Upload the Night Shot</div>
             <div style="font-size:11.5px;color:#D4A843;margin-top:5px;opacity:0.85;">One upload, full stop.</div>
           </label>`
      }
    </div>`:'';
  // Chat open countdown
  const daysUntil=Math.ceil((chatUnlockTime(ev)-Date.now())/(24*60*60*1000));
  return `<button class="back-btn" onclick="goBack()">←</button>
    <div class="connect-header">
      <span class="event-badge" style="--cat:;">${ev.category}</span>
      <h2>${ev.title}</h2>
      <p style="margin-top:4px;"><span style="font-size:13px;font-weight:600;color:var(--text);">${ev.date} · ${ev.time}</span></p>
      <p>${attendees.length} going · ${escapeHtml(ev.venue)}</p>
    </div>
    <div class="section-title">Your card</div>${yourCardHtml}
    <div class="section-title">Who's going (${others.length})</div>
    <div class="going-section-hdr" id="going-section" onclick="toggleGoingSection(${id})">
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="going-previews">${previewAvas||'<span style="font-size:12px;color:var(--text-muted);">None yet</span>'}</div>
        <span style="font-size:13.5px;font-weight:700;color:var(--text);">${others.length} attendee${others.length!==1?'s':''}</span>
      </div>
      <span style="font-size:13px;font-weight:600;color:var(--accent);">${goingOpen?'Hide ↑':'View all ↓'}</span>
    </div>
    ${goingOpen?`<div class="going-grid">${goingGridHtml}</div>`:''}
    ${nightShotSection}
    <div class="section-title">Group Chat</div>
    ${chatIsOpen(ev)?`<div class="panel chat-box">
      <div style="font-size:11px;color:var(--text-muted);margin-bottom:12px;padding:0 2px;">${attendees.length} member${attendees.length!==1?'s':''} · Chat active for this event</div>
      <div class="chat-messages" id="chat-messages">${chat.length?chat.map(m=>{
        const isOwn=m.name===state.profileName;
        const nameCol=isOwn?_myAccent:'var(--text-muted)';
        return `<div class="msg-row ${isOwn?'own':''}"><div class="msg-col ${isOwn?'own':''}">
          <div class="msg-sender" style="color:${nameCol};">${escapeHtml(m.name.split(' ')[0])}</div>
          <div class="msg-bubble ${isOwn?'own':'other'}" style="${isOwn?`background:${ownTheme.bg};color:${ownTheme.text};`:''}">${escapeHtml(m.text)}</div>
        </div></div>`;
      }).join(''):`<div class="chat-empty-state" style="color:var(--text-muted);font-size:13px;text-align:center;padding:28px 16px;">No messages yet — be the first to say something.</div>`}</div>
      <div class="chat-input-row"><input id="chat-input" class="chat-input" placeholder="Say something to the group…" onkeydown="handleChatKey(event,${id})"/><button class="btn" style="background:${c.color};color:#fff;" onclick="sendChat(${id})">Send</button></div>
    </div>`:`<div class="panel" style="padding:22px 20px;text-align:center;">
      ${eventStatus(ev)==='past'?
        `<div style="font-size:22px;margin-bottom:8px;">🔒</div>
         <div style="font-weight:700;font-size:14px;color:var(--text);margin-bottom:5px;">Chat archived</div>
         <div style="font-size:12.5px;color:var(--text-muted);line-height:1.6;">This event has ended and the chat is now read-only.</div>`
      :
        `<div style="font-size:28px;margin-bottom:8px;">🔒</div>
         <div style="font-weight:700;font-size:15px;color:var(--text);margin-bottom:4px;">Chat opens in</div>
         <div class="chat-countdown-wrap">
           <div class="chat-cd-seg"><span class="chat-cd-num" id="chat-cd-d-${id}">--</span><span class="chat-cd-unit">days</span></div>
           <span class="chat-cd-sep">:</span>
           <div class="chat-cd-seg"><span class="chat-cd-num" id="chat-cd-h-${id}">--</span><span class="chat-cd-unit">hrs</span></div>
           <span class="chat-cd-sep">:</span>
           <div class="chat-cd-seg"><span class="chat-cd-num" id="chat-cd-m-${id}">--</span><span class="chat-cd-unit">min</span></div>
           <span class="chat-cd-sep">:</span>
           <div class="chat-cd-seg"><span class="chat-cd-num" id="chat-cd-s-${id}">--</span><span class="chat-cd-unit">sec</span></div>
         </div>
         <div style="font-size:13px;color:var(--text-muted);line-height:1.6;">The group chat unlocks 7 days before the event so you can meet your fellow attendees beforehand.</div>
         <div class="chat-cd-date">${ev.date} · ${ev.time}</div>`
      }
    </div>`}
  `;
}

export function openFriends(){ state.view='friends'; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

export function openConnectGateway(id){ if(state.myCard) openConnect(id); else openCardEditor(id); }

export function openConnect(id){ pushNav(); state.view='connect'; state.selectedEventId=id; loadConnectData(id).then(()=>{ renderNav(); renderView(); }); }

export function peekAttendee(evId, name){
  const cardsMap=state.attendeeCards[evId]||{};
  const card=cardsMap[name]; const person=personByName(name); const fr=isFriend(name);
  let ca='var(--accent)',cbg='var(--surface)',cborder='var(--line)',ctext='var(--text)',ctextSoft='var(--text-muted)';
  if(card){ const ct=getTheme(card.theme); if(ct){ ca=ct.accent; cbg=ct.bg; cborder=ct.border; ctext=ct.text; ctextSoft=ct.textSoft||ct.text; } }
  const ava=initials(name);
  const bio=card?.bio||(person?.blurb||'');
  const interests=card?.interests?card.interests.split(',').map(s=>s.trim()).filter(Boolean):[];
  const fact=card?.fact||'';
  const tagsHtml=interests.map(t=>`<span class="attendee-full-tag" style="background:${ca}22;border-color:${ca}55;color:${ctext};">${escapeHtml(t)}</span>`).join('');
  let photo='';
  try{ if(name===state.profileName) photo=localStorage.getItem('card_photo:'+name)||''; }catch(e){}
  const avatarHtml=photo
    ?`<div class="attendee-full-ava" style="background:${ca};overflow:hidden;"><img src="${photo}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;"/></div>`
    :`<div class="attendee-full-ava" style="background:${ca};">${ava}</div>`;
  const cardHtml=`<div class="attendee-full-card" style="background:${cbg};border:1px solid ${cborder};">
    <div class="attendee-full-card-header">
      ${avatarHtml}
      <div style="flex:1;min-width:0;">
        <div class="attendee-full-name" style="color:${ctext};">${escapeHtml(name)}${fr?' <span style="color:var(--gold);">★</span>':''}</div>
        ${fact?`<div class="attendee-full-sub" style="color:${ctextSoft};">${escapeHtml(fact)}</div>`:''}
      </div>
    </div>
    ${bio?`<div class="attendee-full-bio" style="color:${ctextSoft};">${escapeHtml(bio)}</div>`:''}
    ${tagsHtml?`<div class="attendee-full-tags">${tagsHtml}</div>`:''}
    <div class="attendee-card-wm" style="color:${ca};">${ava}</div>
  </div>`;
  let ov=document.getElementById('attendee-peek-overlay');
  if(!ov){
    ov=document.createElement('div');
    ov.id='attendee-peek-overlay';
    ov.className='attendee-peek-ov';
    ov.innerHTML=`<div class="attendee-peek-sheet"><div class="attendee-peek-handle"></div><div class="attendee-peek-body"><div class="attendee-peek-close-row"><span class="attendee-peek-label">Attendee Profile</span><button class="attendee-peek-close" onclick="closeAttendeePeek()" aria-label="Close">✕</button></div><div id="attendee-peek-content"></div></div></div>`;
    ov.addEventListener('click',e=>{ if(e.target===ov) closeAttendeePeek(); });
    document.body.appendChild(ov);
  }
  document.getElementById('attendee-peek-content').innerHTML=cardHtml;
  requestAnimationFrame(()=>{ ov.classList.add('open'); });
}

export function closeAttendeePeek(){
  const ov=document.getElementById('attendee-peek-overlay');
  if(ov) ov.classList.remove('open');
}

export function toggleGoingSection(id){
  if(!state.goingOpen) state.goingOpen={};
  state.goingOpen[id]=!state.goingOpen[id];
  renderView();
}

export function _buildChatMsgHtml(msg){
  const myCard=state.myCard;
  let _myExt={bgStyle:'obsidian',accentColor:'#CBA43A'};
  try{ const r=localStorage.getItem('card_ext:'+state.profileName); if(r) _myExt={..._myExt,...JSON.parse(r)}; }catch(e){}
  const _myCols=resolveCardColors(_myExt.bgStyle||myCard?.theme||'obsidian',_myExt.accentColor||myCard?.accentColor||'#CBA43A');
  const isOwn=msg.name===state.profileName;
  const nameCol=isOwn?_myCols.accent:'var(--text-muted)';
  return `<div class="msg-row ${isOwn?'own':''}"><div class="msg-col ${isOwn?'own':''}">
    <div class="msg-sender" style="color:${nameCol};">${escapeHtml(msg.name.split(' ')[0])}</div>
    <div class="msg-bubble ${isOwn?'own':'other'}" style="${isOwn?`background:${_myCols.bg};color:${_myCols.text};`:''}">${escapeHtml(msg.text)}</div>
  </div></div>`;
}

export function _appendChatMsg(msg){
  const cm=document.getElementById('chat-messages'); if(!cm) return;
  const empty=cm.querySelector('.chat-empty-state'); if(empty) empty.remove();
  const wrap=document.createElement('div');
  wrap.innerHTML=_buildChatMsgHtml(msg);
  const node=wrap.firstElementChild;
  node.classList.add('msg-row-new');
  cm.appendChild(node);
  cm.scrollTo({top:cm.scrollHeight,behavior:'smooth'});
}

export async function sendChat(id){
  const input=document.getElementById('chat-input'); const text=input.value.trim();
  if(!text) return;
  input.value='';
  const msg={name:state.profileName,text,ts:Date.now(),_opt:true};
  if(!state.chats[id]) state.chats[id]=[];
  state.chats[id].push(msg);
  _appendChatMsg(msg);
  await sb.from('chat_messages').insert({event_id:id,user_id:state.userId,user_name:state.profileName,text});
}

export function renderSocialTab(){
  const view=state.view;
  const isOwner=state.profileEmail==='gondoxml@gmail.com';

  const seg=`<div class="social-seg">
    <button class="social-seg-btn${view==='social'?' active':''}" onclick="openSocialTab()">Events</button>
    <button class="social-seg-btn${view==='friends'?' active':''}" onclick="openFriends()">Friends${state.friends.length?` (${state.friends.length})`:''}</button>
    <button class="social-seg-btn${view==='host'?' active':''}" onclick="openHost()">Host</button>
  </div>`;

  // ── HOST content ──────────────────────────────────────────────────────
  if(view==='host'){
    return `
      <div class="connect-header" style="padding-top:16px;"><h2>Social</h2><p>Host an event for your community</p></div>
      ${seg}
      <div class="host-type-seg">
        <button class="host-type-btn${G._hostType==='private'?' active':''}" data-type="private" onclick="setHostType('private')">Private</button>
        <button class="host-type-btn${G._hostType==='public'?' active':''}" data-type="public" onclick="setHostType('public')">Public</button>
      </div>
      <div id="host-type-notice" class="host-notice">${G._hostType==='private'?'Visible to your friends only — no approval needed.':'Your event will go live after a short verification review.'}</div>

      <div class="host-section">
        <div class="host-section-title">Event basics</div>
        <label class="intro-field-label">Title</label>
        <input id="host-title" class="gate-input" placeholder="e.g., Summer Park Picnic"/>
        <label class="intro-field-label">Category</label>
        <select id="host-cat" class="gate-input">${Object.keys(CATS).map(c=>`<option value="${c}">${c}</option>`).join('')}</select>
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

      <button id="host-submit-btn" class="btn" style="width:100%;margin-bottom:16px;font-size:15px;" onclick="submitHostEvent()">${G._hostType==='private'?'Create private event →':'Submit for review →'}</button>
      ${renderHostPayoutsPanel()}`;
  }

  // ── FRIENDS content ───────────────────────────────────────────────────
  if(view==='friends'){
    const friendCards=state.friends.length
      ? state.friends.map(n=>{
          const p=personByName(n);
          const evs=p?p.events.map(id=>EVENTS.find(e=>e.id===id)).filter(Boolean):[];
          return `<div class="panel friend-card" style="--corner:var(--gold);">
            <div class="fname"><span class="star">★</span> ${escapeHtml(n)}</div>
            ${p?`<div class="fblurb">${escapeHtml(p.blurb)}</div>`:''}
            <div class="fgoing">${evs.length?`Going to: ${evs.map(e=>escapeHtml(e.title)).join(', ')}`:'No events listed'}</div>
            <button class="btn btn-outline btn-small" style="width:100%;margin-top:4px;" onclick="removeFriend('${escapeHtml(n).replace(/'/g,"\\'")}')">Remove</button>
          </div>`;
        }).join('')
      : `<div class="panel" style="padding:20px;text-align:center;color:var(--text-muted);font-size:13px;line-height:1.6;">No friends yet.<br>Scan someone's QR code at an event to add them.</div>`;

    return `
      <div class="connect-header" style="padding-top:16px;"><h2>Social</h2><p>Your friends &amp; connections</p></div>
      ${seg}
      <div class="section-title" style="margin-top:0;">Your friends (${state.friends.length})</div>
      <div class="friends-grid">${friendCards}</div>`;
  }

  // ── EVENTS content ────────────────────────────────────────────────────
  const myEvIds=new Set([
    ...myTickets.map(t=>t.eventId),
    ...Object.keys(state.rsvps).filter(id=>(state.rsvps[id]||[]).includes(state.profileName)).map(Number)
  ]);
  const evList=[...myEvIds].map(id=>EVENTS.find(e=>e.id===id)).filter(Boolean)
    .sort((a,b)=>a.startsAt-b.startsAt);
  const upcoming=evList.filter(e=>eventStatus(e)!=='past');
  const past=evList.filter(e=>eventStatus(e)==='past');

  const renderEvCard=(ev)=>{
    const c=CATS[ev.category]; const chat=state.chats[ev.id]||[];
    const open=chatIsOpen(ev); const status=eventStatus(ev);
    const att=attendeesFor(ev.id);
    const lastMsg=chat.length?chat[chat.length-1]:null;
    const seen=G._socialSeenCount[ev.id];
    const isNewOpen=seen===undefined;
    const hasUnread=isNewOpen||(chat.length>seen&&lastMsg?.name!==state.profileName);
    return `<div class="panel" onclick="openSocialForEvent(${ev.id})" style="--corner:${open&&status!=='past'?c.color:'var(--line)'};padding:16px 18px;margin-bottom:10px;cursor:pointer;transition:transform .12s ease;" onmouseenter="this.style.transform='translateY(-2px)'" onmouseleave="this.style.transform=''">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
        <div style="flex:1;min-width:0;">
          <div style="display:flex;gap:6px;align-items:center;margin-bottom:4px;flex-wrap:wrap;">
            <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:999px;background:${c.color};color:#fff;">${ev.category}</span>
            ${status==='live'?`<span class="live-chip" style="margin-left:0;"><span class="dot"></span>Live</span>`:''}
            ${hasUnread?`<span style="font-size:9px;font-weight:800;background:#E23B3B;color:#fff;padding:1px 6px;border-radius:999px;">${isNewOpen&&chat.length===0?'Chat Open':'New'}</span>`:''}
          </div>
          <div style="font-size:14.5px;font-weight:700;line-height:1.2;margin-bottom:3px;">${escapeHtml(ev.title)}</div>
          <div style="font-size:11.5px;color:var(--text-muted);margin-bottom:2px;">${ev.date} · ${ev.time}</div>
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:5px;">${escapeHtml(ev.venue)}${ev.area?` · ${escapeHtml(ev.area)}`:''} · ${att.length} going</div>
          ${open&&status!=='past'
            ? lastMsg
              ? `<div style="font-size:12.5px;color:var(--text-soft);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"><strong style="color:var(--text);">${escapeHtml(lastMsg.name.split(' ')[0])}:</strong> ${escapeHtml(lastMsg.text)}</div>`
              : `<div style="font-size:12px;color:var(--text-muted);font-style:italic;">No messages yet — be the first to say hi</div>`
            : status==='past'
              ? `<div style="font-size:12px;color:var(--text-muted);">Event ended — chat closed</div>`
              : (()=>{ const d=Math.ceil((chatUnlockTime(ev)-Date.now())/(86400000)); return `<div style="font-size:12px;color:var(--accent);font-weight:600;">🔒 Chat opens in ${d>0?`${d} day${d!==1?'s':''}`:'less than a day'}</div>`; })()
          }
        </div>
        <div style="flex-shrink:0;color:var(--text-muted);font-size:18px;align-self:center;">›</div>
      </div>
    </div>`;
  };

  const myCardBanner=state.myCard
    ?`<div class="panel" style="--corner:var(--accent);display:flex;align-items:center;gap:14px;padding:14px 16px;margin-bottom:4px;cursor:pointer;" onclick="openExpandedCard()">
        <div style="width:46px;height:46px;border-radius:10px;background:var(--accent);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:20px;font-weight:900;color:#fff;letter-spacing:-1px;">CU</div>
        <div style="flex:1;min-width:0;">
          <div style="font-size:14px;font-weight:700;color:var(--text);">My Card &amp; QR Code</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:1px;">Show this to connect with people at events</div>
        </div>
        <div style="font-size:20px;color:var(--text-muted);">›</div>
      </div>`
    :`<div class="panel" style="--corner:var(--accent);padding:14px 16px;margin-bottom:4px;">
        <div style="font-size:13px;font-weight:600;color:var(--text);margin-bottom:6px;">Set up your card to share at events</div>
        <button class="btn btn-small" style="width:100%;" onclick="openCardEditor(null)">Create my card</button>
      </div>`;

  if(!evList.length) return `
    <div class="connect-header" style="padding-top:16px;"><h2>Social</h2><p>Connect with people at events</p></div>
    ${seg}
    <div class="section-title" style="margin-top:0;">Your card</div>
    ${myCardBanner}
    <div class="empty-state" style="margin-top:16px;">
      <div style="font-weight:700;margin-bottom:6px;">No events yet</div>
      <div style="font-size:13px;color:var(--text-muted);margin-bottom:18px;">RSVP to events to join their group chats and meet other attendees.</div>
      <button class="btn" onclick="goBrowse()">Browse events</button>
    </div>`;

  return `
    <div class="connect-header" style="padding-top:16px;"><h2>Social</h2><p>${upcoming.length} upcoming · ${past.length} past</p></div>
    ${seg}
    <div class="section-title" style="margin-top:0;">Your card</div>
    ${myCardBanner}
    ${upcoming.length?`<div class="section-title">Upcoming</div>${upcoming.map(renderEvCard).join('')}`:''}
    ${past.length?`<div class="section-title">Past</div>${past.map(renderEvCard).join('')}`:''}`;
}

export function startChatCountdown(evId,unlockTs){
  if(_chatTimers[evId]){clearInterval(_chatTimers[evId]);delete _chatTimers[evId];}
  function tick(){
    const dEl=document.getElementById('chat-cd-d-'+evId);
    if(!dEl){clearInterval(_chatTimers[evId]);delete _chatTimers[evId];return;}
    const rem=unlockTs-Date.now();
    if(rem<=0){clearInterval(_chatTimers[evId]);delete _chatTimers[evId];renderView();return;}
    const ts=Math.floor(rem/1000);
    const d=Math.floor(ts/86400);
    const h=Math.floor((ts%86400)/3600);
    const m=Math.floor((ts%3600)/60);
    const s=ts%60;
    dEl.textContent=d;
    document.getElementById('chat-cd-h-'+evId).textContent=pad2(h);
    document.getElementById('chat-cd-m-'+evId).textContent=pad2(m);
    document.getElementById('chat-cd-s-'+evId).textContent=pad2(s);
  }
  tick();
  _chatTimers[evId]=setInterval(tick,1000);
}

export function getUnreadSocialCount(){
  const myEvIds=new Set([
    ...myTickets.map(t=>t.eventId),
    ...Object.keys(state.rsvps).filter(id=>(state.rsvps[id]||[]).includes(state.profileName)).map(Number)
  ]);
  let count=0;
  myEvIds.forEach(eid=>{
    const ev=EVENTS.find(e=>e.id===eid); if(!ev||!chatIsOpen(ev)) return;
    const chat=state.chats[eid]||[];
    const seen=G._socialSeenCount[eid];
    if (seen === undefined) {
      count++; // newly opened chat
    } else if (chat.length > seen && chat[chat.length-1].name !== state.profileName) {
      count++; // new messages
    }
  });
  return count;
}

export function openSocialForEvent(id){
  pushNav(); loadConnectData(id).then(()=>{ markSocialSeen(id); state.view='connect'; state.selectedEventId=id; renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); });
}

export function openSocialTab(){  state.view='social';  renderNav(); renderView(); window.scrollTo({top:0,behavior:'smooth'}); }

export function setHostType(t){
  G._hostType=t;
  document.querySelectorAll('.host-type-btn').forEach(b=>b.classList.toggle('active',b.dataset.type===t));
  const notice=document.getElementById('host-type-notice');
  if(notice) notice.textContent=t==='private'
    ?'Visible to your friends only — no approval needed.'
    :'Your event will go live after a short verification review.';
  const btn=document.getElementById('host-submit-btn');
  if(btn) btn.textContent=t==='private'?'Create private event →':'Submit for review →';
}