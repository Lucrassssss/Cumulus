import { G } from './globals.js';
import { EVENT_SEED, EVENTS, CATS, CAT_IMG, catImg, eventStatus, isHotEvent, generateUniqueId, codeFor, DEMO_PEOPLE, personByName, CARD_BG_STYLES, CARD_ACCENT_COLORS, CARD_THEMES, CARD_PATTERNS, LONDON_AREAS, CATEGORY_KEYWORDS, MILESTONE_BADGES, CATEGORY_BADGES, ALLROUNDER_BADGE, TOTAL_CATEGORIES, SPECIAL_BADGES, LEVELS, getLevel, INTEREST_PRESETS, CALENDAR_YEAR, CALENDAR_MONTH, MONTH_NAMES, WEEKDAY_LABELS, BLOT_SVG, EMAIL_PATTERN } from './constants.js';
import { sb } from './config.js';
import { validateCuratorCode, adminSendCode, adminVerifyCode, isAdminSession, isPerkUnlocked, distanceMeters, canCheckInAt } from './services.js';
import { renderGate, switchAuthMode, _updateCuratorVisibility, switchSignupType, showLpSignup, closeLpSignup, lpUpdatePassName, _cacheSession, _restoreUserFromRow, submitGate, _submitHostApplication, signOut, enterApp, promptAdminSignIn, persistProfile, openCardEditor, captureDraftFields, handleCardPhoto, removeCardPhoto, selectCardTheme, selectCardAccentColor, selectCardPattern, setPatternOpacity, toggleCardArea, updateCardPreview, renderCardEditor, switchCeTab, saveCard, initCardSheen, getCardExt, saveCardExt, openExpandedCard, closeExpandedCard, renderProfile, editProfile, updateAboutCounter, saveProfileAbout, toggleProfileInterest, getAllBadges, getFeaturedBadges, openBadgePicker, toggleFeaturedBadge, closeBadgePicker, renderAchievements, openAchievements, renderDetail, openEvent, checkInToEvent, promptCuratorUnlock, uploadNightShot, getFilteredEvents, toggleFriendsOnly, refreshFilters, pinTooltipHtml, renderPerkPanel, renderCalendar, openCalendarDay, renderCalendarDay, buildCalendarWeeks, openCalendar, getMyEvents, getMyCategories, getEventDay, toggleHotOnly, toggleLiveOnly, computeEventDates, loadFriends, addFriend, removeFriend, renderConnect, openFriends, openConnectGateway, openConnect, peekAttendee, closeAttendeePeek, toggleGoingSection, _buildChatMsgHtml, _appendChatMsg, sendChat, renderSocialTab, startChatCountdown, getUnreadSocialCount, openSocialForEvent, openSocialTab, setHostType, ticketTypes, renderBook, renderCheckout, renderConfirmed, renderMyTickets, processPayment, loadMyTickets, _insertTickets, openBook, openViewTicket, registerFree, afterRenderConfirmed, downloadICS, getCumulusFee, formatCardNumber, formatExpiry, openTicketsTab, renderTicketsTab, generateTicketId, getTicketForEvent, setBookingType, setBookingQty, proceedToCheckout, initOwnerDash, renderOwnerDash, renderHostPayoutsPanel, renderReview, loadAndRenderReview, _buildReviewCard, reviewHost, renderEventApprovals, loadAndRenderEventApprovals, _buildEventApprovalCard, decideEvent, _publishApprovedEvent, submitHostEvent, od_tog, _odPlatformFee, _odVatOnFee, _odStripeCost, _odBarCol, _odTierCls, _odSetBar, _odSetTier, _odCalcSupa, _odCalcMb, _odCalcEm, _odCalcVc, od_renderStaff, od_recalc, loadOwnerLiveData, _renderOwnerLivePanel, openOwnerDash, openReview, openEventApprovals, _pendingEventKey, clearAllTestData, clearAllUsers, toggleHostCat, openHost, showToast, showConfirm, setupReveal, renderNav, pushNav, goBack, renderView, closeActivePopup, goBrowse, setCategory, chatIsOpen, chatUnlockTime, pad2, markSocialSeen, medallionHtml, badgeCellHtml, trophyHtml, trophyCellHtml, resetProfile, getTheme, getBgStyle, resolveCardColors, geocodeBannerHtml } from './facade.js';


export function applyMapChrome(map, declutter){
  if(!map) return;
  try{
    map.setConfigProperty('basemap','lightPreset', state.theme==='dark' ? 'night' : 'day');
    if(declutter){
      map.setConfigProperty('basemap','showPointOfInterestLabels', false);
      map.setConfigProperty('basemap','showTransitLabels', false);
    }
  }catch(e){}
}

export async function resolveEventLocations(){
  if(geocodingInProgress||!mapboxConfigured()) return;
  const pending=EVENTS.filter(needsGeocode);
  if(!pending.length) return;
  geocodingInProgress=true; geocodeProgress={done:0,total:pending.length};
  updateGeocodeBanner();
  const concurrency=6; let idx=0;
  async function worker(){
    while(idx<pending.length){
      const ev=pending[idx++];
      try{ const c=await geocodeAddress(ev.address); ev.lat=c.lat; ev.lon=c.lon; }
      catch(e){ const f=AREA_FALLBACK_CENTER; ev.lat=f.lat+(Math.random()-0.5)*0.06; ev.lon=f.lon+(Math.random()-0.5)*0.10; }
      geocodeProgress.done++;
      updateGeocodeBanner();
      if(state.view==='browse') refreshMarkers();
    }
  }
  await Promise.all(Array.from({length:concurrency},worker));
  await persistGeocodeCache();
  geocodingInProgress=false; updateGeocodeBanner();
}

export function buildEventsGeoJSON(){
  return {
    type:'FeatureCollection',
    features: getFilteredEvents()
      .filter(ev=>typeof ev.lon==='number'&&typeof ev.lat==='number'&&isFinite(ev.lon)&&isFinite(ev.lat))
      .map(ev=>({
        type:'Feature',
        geometry:{type:'Point',coordinates:[ev.lon,ev.lat]},
        properties:{id:ev.id,color:CATS[ev.category].color,status:eventStatus(ev),friend:attendeesFor(ev.id).some(isFriend)?1:0,category:ev.category}
      }))
  };
}

export function updateClusterPaint(){
  if(!G.lmap||!G.lmap.getLayer('clusters')) return;
  const dk=state.theme==='dark';
  const c0=dk?'#CBA43A':'#A8841F';
  const c1=dk?'#A8841F':'#7E6210';
  const c2=dk?'#7E6210':'#8A5C0A';
  G.lmap.setPaintProperty('clusters','circle-color',['step',['get','point_count'],c0,10,c1,30,c2]);
  G.lmap.setPaintProperty('clusters','circle-stroke-color',dk?'rgba(232,184,75,0.55)':'rgba(255,255,255,0.85)');
}

export function attachMapLayers(){
  if(!G.lmap||G.lmap.getSource('events')) return;
  G.lmap.addSource('events',{
    type:'geojson', data:{type:'FeatureCollection',features:[]},
    cluster:true, clusterMaxZoom:13, clusterRadius:42
  });

  // Native Mapbox GL cluster layers — palette matches light/dark via updateClusterPaint()
  G.lmap.addLayer({
    id:'clusters',
    type:'circle',
    source:'events',
    filter:['has','point_count'],
    paint:{
      'circle-color':['step',['get','point_count'],'#CBA43A',10,'#A8841F',30,'#7E6210'],
      'circle-radius':['step',['get','point_count'],20,10,24,30,28],
      'circle-stroke-width':2,
      'circle-stroke-color':'rgba(255,255,255,0.85)',
      'circle-opacity':0.95
    }
  });
  G.lmap.addLayer({
    id:'cluster-count',
    type:'symbol',
    source:'events',
    filter:['has','point_count'],
    layout:{
      'text-field':['get','point_count_abbreviated'],
      'text-font':['DIN Offc Pro Bold','Arial Unicode MS Bold'],
      'text-size':12,
      'text-allow-overlap':true
    },
    paint:{'text-color':'#ffffff','text-halo-color':'rgba(0,0,0,0.15)','text-halo-width':1}
  });
  updateClusterPaint();

  // Invisible hitbox for unclustered points (used to show/hide HTML event pins)
  G.lmap.addLayer({ id:'event-hitbox', type:'circle', source:'events',
    filter:['!',['has','point_count']],
    paint:{'circle-radius':1,'circle-opacity':0}
  });

  // Cluster click → zoom in
  G.lmap.on('click','clusters',(e)=>{
    const features=G.lmap.queryRenderedFeatures(e.point,{layers:['clusters']});
    if(!features.length) return;
    G.lmap.getSource('events').getClusterExpansionZoom(features[0].properties.cluster_id,(err,zoom)=>{
      if(!err) G.lmap.easeTo({center:features[0].geometry.coordinates,zoom:zoom+0.8});
    });
  });
  G.lmap.on('mouseenter','clusters',()=>{ G.lmap.getCanvas().style.cursor='pointer'; });
  G.lmap.on('mouseleave','clusters',()=>{ G.lmap.getCanvas().style.cursor=''; });

  G.lmap.on('click',(e)=>{
    const hits=G.lmap.queryRenderedFeatures(e.point,{layers:['clusters','event-hitbox']});
    if(!hits.length) closeActivePopup();
  });

  G.lmap.on('render', syncHtmlMarkers);

  if(state.view==='browse') setTimeout(refreshMarkers, 0);
}

export function syncHtmlMarkers(){
  if(!G.lmap||!G.lmap.getSource('events')) return;
  // Show/hide HTML event pin markers based on whether the unclustered point is rendered
  const visible = G.lmap.queryRenderedFeatures({layers:['event-hitbox']});
  const visibleIds = new Set(visible.map(f=>String(f.properties.id)));
  Object.entries(G.htmlMarkerRefs).forEach(([evId,ref])=>{
    const show=visibleIds.has(evId);
    if(show&&!ref.added){ ref.marker.addTo(G.lmap); if(ref.bubbleMarker) ref.bubbleMarker.addTo(G.lmap); ref.added=true; }
    else if(!show&&ref.added){ ref.marker.remove(); if(ref.bubbleMarker) ref.bubbleMarker.remove(); ref.added=false; if(String(activePopupEventId)===evId) closeActivePopup(); }
  });
}

export function refreshMarkers(){
  if(!G.lmap||typeof mapboxgl==='undefined') return;
  const src=G.lmap.getSource('events');
  if(!src){ G.lmap.once('load',refreshMarkers); return; }

  Object.values(G.htmlMarkerRefs).forEach(ref=>{ if(ref.added){ ref.marker.remove(); if(ref.bubbleMarker) ref.bubbleMarker.remove(); } });
  G.htmlMarkerRefs={};

  
  closeActivePopup();

  const geo=buildEventsGeoJSON();
  src.setData(geo);

  getFilteredEvents().forEach(ev=>{
    const color=CATS[ev.category].color;
    const status=eventStatus(ev);
    const att=attendeesFor(ev.id);
    const friendGoing=att.some(isFriend);

    const el=document.createElement('div');
    el.className='evpin-wrap';
    const hot=isHotEvent(ev);
    const chatOpen=chatIsOpen(ev)&&status!=='past';
    const chatBadge=chatOpen?'<span class="pin-chat"><svg viewBox="0 0 20 20" width="7" height="7" fill="#fff"><path d="M18 2H2C.9 2 0 2.9 0 4v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/></svg></span>':'';
    el.innerHTML=`<div class="evpin ${status}${hot?' hot':''}" style="--c:${color}">
      ${status==='live'?'<span class="pulse-ring"></span><span class="pulse-ring r2"></span>':''}
      <div class="pin"><span class="pin-dot"></span></div>
      ${friendGoing?'<span class="pin-star">★</span>':''}
      ${chatBadge}
    </div>`;

    // Separate bubble marker — own Mapbox Marker so it never affects the pin's anchor
    let bubbleMarker=null;
    if(status!=='past'&&(hot||chatOpen)){
      const bEl=document.createElement('div');
      bEl.className='pin-bubble-wrap';
      const t=ev.title.length>18?ev.title.slice(0,17)+'…':ev.title;
      const statusHtml=status==='live'
        ?`<div class="pbc-status"><span class="pbc-dot"></span>Live now</div>`
        :chatOpen?`<div class="pbc-status"><span class="pbc-dot"></span>Chat open</div>`:'';
      bEl.innerHTML=`<div class="pin-bubble-card" style="--c:${color}">
        <div class="pbc-title">${escapeHtml(t)}</div>
        ${ev.area?`<div class="pbc-sub">${escapeHtml(ev.area)}</div>`:''}
        ${statusHtml}
      </div>`;
      bubbleMarker=new mapboxgl.Marker({element:bEl,anchor:'bottom',offset:[0,-15]}).setLngLat([ev.lon,ev.lat]);
    }

    const marker=new mapboxgl.Marker({element:el,anchor:'center'}).setLngLat([ev.lon,ev.lat]);

    let closeTimer=null;

    const openPopup=()=>{
      if(activePopupEventId===ev.id) return;
      closeActivePopup();
      const popup=new mapboxgl.Popup({
        offset:{top:[0,8],bottom:[0,-14],left:[14,0],right:[-14,0]},
        closeButton:false, closeOnClick:false, className:'evtip-popup', anchor:'bottom', maxWidth:'240px'
      }).setLngLat([ev.lon,ev.lat]).setHTML(pinTooltipHtml(ev)).addTo(G.lmap);
      G.activePopup=popup; activePopupEventId=ev.id;
      el.querySelector('.evpin')?.classList.add('open');
      const popupEl=popup.getElement();
      if(popupEl){
        popupEl.addEventListener('mouseenter',()=>{ clearTimeout(closeTimer); closeTimer=null; });
        popupEl.addEventListener('mouseleave',()=>{ clearTimeout(closeTimer); closeTimer=setTimeout(dismissPopup,150); });
        popupEl.addEventListener('click',e=>{ e.stopPropagation(); closeActivePopup(); openEvent(ev.id); });
        popupEl.addEventListener('touchend',e=>{ e.preventDefault(); e.stopPropagation(); closeActivePopup(); openEvent(ev.id); },{passive:false});
      }
    };

    const dismissPopup=()=>{
      if(activePopupEventId===ev.id){ closeActivePopup(); el.querySelector('.evpin')?.classList.remove('open'); }
    };

    el.addEventListener('mouseenter',()=>{ clearTimeout(closeTimer); closeTimer=null; openPopup(); });
    el.addEventListener('mouseleave',()=>{ clearTimeout(closeTimer); closeTimer=setTimeout(dismissPopup,200); });
    el.addEventListener('click',e=>{
      e.stopPropagation();
      if(activePopupEventId===ev.id){ closeActivePopup(); openEvent(ev.id); } 
      else { openPopup(); }
    });

    G.htmlMarkerRefs[String(ev.id)]={marker,bubbleMarker,el,added:false};
  });

  if(!lmapFitted&&geo.features.length>0){
    const coords=geo.features.map(f=>f.geometry.coordinates);
    const bounds=coords.reduce((b,c)=>b.extend(c),new mapboxgl.LngLatBounds(coords[0],coords[0]));
    G.lmap.fitBounds(bounds,{padding:{top:120,bottom:140,left:40,right:40},maxZoom:12});
    lmapFitted=true;
  }
}

export function initLeaflet(){
  if(G.lmap||typeof mapboxgl==='undefined'||!mapboxConfigured()) return;
  const host=document.getElementById('main-map'); if(!host) return;
  mapboxgl.accessToken=G.MAPBOX_TOKEN;
  G.lmap=new mapboxgl.Map({
    container:host, style:mapboxStyleUrl(),
    center:[-0.1276,51.5072], zoom:12,
    fadeDuration:300,
    attributionControl:false,
    maxPitch:0, pitch:0, dragPitch:false, touchPitch:false, pitchWithRotate:false
  });
  G.lmap.addControl(new mapboxgl.NavigationControl({showCompass:true,showZoom:true}),'top-right');
  G.lmap.on('style.load', () => {
    applyMapChrome(G.lmap, true);
    attachMapLayers();
  });
}

export function initHostMap(){
  if(G.hostMap){ G.hostMap.remove(); G.hostMap=null; hostMarker=null; }
  const el=document.getElementById('host-map-picker');
  if(!el||typeof mapboxgl==='undefined'||!mapboxConfigured()) return;
  mapboxgl.accessToken=G.MAPBOX_TOKEN;
  G.hostMap=new mapboxgl.Map({
    container:el, style:mapboxStyleUrl(),
    center:[newEventLon,G.newEventLat], zoom:13,
    fadeDuration:300,
    attributionControl:false,
    maxPitch:0, pitch:0, dragPitch:false, touchPitch:false, pitchWithRotate:false
  });
  G.hostMap.addControl(new mapboxgl.NavigationControl({showCompass:true}),'top-right');
  G.hostMap.on('style.load', () => {
    applyMapChrome(G.hostMap, false);
  });
  const hostEl=document.createElement('div');
  hostEl.className='evpin-wrap';
  hostEl.innerHTML=`<div style="width:22px;height:22px;border-radius:50%;background:var(--accent);border:2.5px solid #fff;box-shadow:0 0 0 1.5px rgba(0,0,0,0.5),0 2px 8px rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;"><span style="width:6px;height:6px;border-radius:50%;background:#fff;display:block;"></span></div>`;
  hostMarker=new mapboxgl.Marker({element:hostEl}).setLngLat([newEventLon,G.newEventLat]).addTo(G.hostMap);
  G.hostMap.on('click',function(e){
    G.newEventLat=e.lngLat.lat; newEventLon=e.lngLat.lng;
    hostMarker.setLngLat([newEventLon,G.newEventLat]);
    const el=document.getElementById('host-lat-lon-text');
    if(el) el.innerText=`Location Pinned: (${G.newEventLat.toFixed(4)}, ${newEventLon.toFixed(4)})`;
  });
  setTimeout(()=>G.hostMap.resize(),50);
}

export function handleAddressAutocomplete(){
  const query=(document.getElementById('host-address-search')?.value||'').trim();
  const resultsDiv=document.getElementById('autocomplete-results');
  clearTimeout(G.autocompleteTimeout);
  if(query.length<3){ resultsDiv.innerHTML=''; resultsDiv.style.display='none'; return; }
  if(!mapboxConfigured()){ resultsDiv.innerHTML=`<div style="padding:10px 16px;font-size:13.5px;color:#E23B3B;">A Mapbox token is required.</div>`; resultsDiv.style.display='block'; return; }
  G.autocompleteTimeout=setTimeout(async()=>{
    resultsDiv.innerHTML='<div style="padding:10px 16px;font-size:13.5px;color:var(--text-muted);">Searching…</div>';
    resultsDiv.style.display='block';
    try{
      const url=`https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${G.MAPBOX_TOKEN}&session_token=${G.searchSessionToken}&country=gb&language=en&limit=6&types=address,poi,place,locality,neighborhood,postcode`;
      const res=await fetch(url);
      if(!res.ok){ let r=`Error (${res.status}).`; if(res.status===401||res.status===403) r='Token rejected.'; else if(res.status===429) r='Rate limit hit.'; resultsDiv.innerHTML=`<div style="padding:10px 16px;font-size:13.5px;color:#E23B3B;">${r}</div>`; return; }
      const data=await res.json();
      if(data&&data.suggestions&&data.suggestions.length>0){
        resultsDiv.innerHTML=data.suggestions.map(s=>{
          const fullAddress=s.full_address||s.place_formatted||s.name;
          const placeText=s.name||fullAddress;
          const mapboxId=(s.mapbox_id||'').replace(/'/g,"\\'");
          return `<div style="padding:10px 14px;cursor:pointer;font-size:13.5px;border-bottom:1px solid var(--line-soft);color:var(--text);" onclick="selectSearchSuggestion('${mapboxId}','${escapeHtml(fullAddress).replace(/'/g,"\\'")}','${escapeHtml(placeText).replace(/'/g,"\\'")}')">
            <div style="font-weight:600;">${escapeHtml(placeText)}</div>
            ${s.place_formatted?`<div style="font-size:11px;color:var(--text-muted);margin-top:2px;">${escapeHtml(s.place_formatted)}</div>`:''}
          </div>`;
        }).join('');
      } else { resultsDiv.innerHTML='<div style="padding:10px 14px;font-size:13.5px;color:var(--text-muted);">No matches found</div>'; }
    }catch(e){ resultsDiv.innerHTML=`<div style="padding:10px 14px;font-size:13.5px;color:#E23B3B;">Network error. <button onclick="handleAddressAutocomplete()" style="border:1px solid #E23B3B;background:transparent;color:#E23B3B;border-radius:8px;padding:2px 8px;font-size:11px;cursor:pointer;">Retry</button></div>`; }
  },350);
}

export async function selectSearchSuggestion(mapboxId,fullAddress,placeText){
  const resultsDiv=document.getElementById('autocomplete-results');
  document.getElementById('host-address-search').value=fullAddress;
  resultsDiv.innerHTML='<div style="padding:10px 14px;font-size:13.5px;color:var(--text-muted);">Pinpointing…</div>';
  try{
    const res=await fetch(`https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?access_token=${G.MAPBOX_TOKEN}&session_token=${G.searchSessionToken}`);
    if(!res.ok) throw new Error(`retrieve ${res.status}`);
    const data=await res.json();
    const f=data&&data.features&&data.features[0];
    if(!f) throw new Error('no feature');
    const [lon,lat]=f.geometry.coordinates;
    selectAutocompleteAddress(lat,lon,fullAddress,placeText);
    resultsDiv.style.display='none';
  }catch(e){ resultsDiv.innerHTML=`<div style="padding:10px 14px;font-size:13.5px;color:#E23B3B;">Couldn't pinpoint. <button onclick="handleAddressAutocomplete()" style="border:1px solid #E23B3B;background:transparent;color:#E23B3B;border-radius:8px;padding:2px 8px;cursor:pointer;font-size:11px;">Retry</button></div>`; }
  finally{ G.searchSessionToken=generateSessionToken(); }
}

export function selectAutocompleteAddress(lat,lon,fullAddress,name){
  G.newEventLat=lat; newEventLon=lon;
  document.getElementById('host-address-search').value=fullAddress;
  document.getElementById('autocomplete-results').style.display='none';
  if(G.hostMap&&hostMarker){ hostMarker.setLngLat([lon,lat]); G.hostMap.flyTo({center:[lon,lat],zoom:15}); }
  const el=document.getElementById('host-lat-lon-text');
  if(el) el.innerText=`Location Pinned: (${lat.toFixed(4)}, ${lon.toFixed(4)})`;
  const venueInput=document.getElementById('host-venue');
  if(name&&venueInput&&!venueInput.value&&isNaN(name)) venueInput.value=name.trim();
}

export function showMapLayer(visible){
  ['main-map','map-filters','map-caption-bar'].forEach(id=>{
    const el=document.getElementById(id);
    if(el) el.style.display=visible?'':'none';
  });
  const fab=document.getElementById('owner-fin-fab');
  if(fab) fab.style.display=visible&&state.profileEmail==='gondoxml@gmail.com'?'block':'none';
}

export async function persistGeocodeCache(){
  try{
    const keys=Object.keys(G.geocodeCache);
    if(keys.length>300){ keys.slice(0,keys.length-300).forEach(k=>delete G.geocodeCache[k]); }
    await storageSet('geocode_cache',JSON.stringify(G.geocodeCache));
  }catch(e){}
}

export async function geocodeAddress(address){
  if(G.geocodeCache[address]) return G.geocodeCache[address];
  const url=`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${G.MAPBOX_TOKEN}&country=gb&limit=1&proximity=-0.1276,51.5072`;
  const res=await fetch(url);
  if(!res.ok) throw new Error(`geocode ${res.status}`);
  const data=await res.json();
  const f=data.features&&data.features[0];
  if(!f) throw new Error(`no match: ${address}`);
  const coords={lat:f.center[1],lon:f.center[0]};
  G.geocodeCache[address]=coords;
  return coords;
}