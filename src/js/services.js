/* ===========================================================================
   CUMULUS - services.js  (data layer)
   Owns the Supabase client and all data I/O: loaders, persistence, geocoding,
   ticketing storage, host applications, owner analytics.
   Reads CONFIG from config.js (loaded first). UI functions referenced here
   (renderView, computeEventDates, ...) are defined in app.js and exist by
   the time any of these run - services never call them at parse time.
   =========================================================================== */

// -- Supabase client ---------------------------------------------------------
// When env credentials are absent, `sb` becomes a chainable no-op stub whose
// awaited result is always { data:null, error:{...} } — every existing
// `await sb.from(...)...` call site degrades safely instead of null-crashing.
function makeOfflineDb(){
  const result = { data: null, error: { message: 'offline: no backend configured' }, count: null };
  const builder = new Proxy(function(){}, {
    get(_, prop){
      if (prop === 'then') return (resolve) => resolve(result);
      return () => builder;
    },
    apply(){ return builder; }
  });
  return { from(){ return builder; }, storage: { from(){ return builder; } } };
}

let _sbLive = false;
let sb = null;
(function initSupabaseClient(){
  if (CONFIG.supabaseUrl && CONFIG.supabaseAnonKey && typeof supabase !== 'undefined') {
    sb = supabase.createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey);
    _sbLive = true;
    return;
  }
  if (typeof supabase === 'undefined' && CONFIG.supabaseUrl) {
    console.error('[Cumulus] supabase-js failed to load from CDN.');
  } else {
    console.warn('[Cumulus] Supabase env missing - running in local demo mode. See README, Environment setup.');
  }
  sb = makeOfflineDb();
})();
function supabaseReady(){ return _sbLive; }

// -- Local storage primitives ------------------------------------
// ── Storage helpers ──────────────────────────────────────────────────────
// localStorage kept only for geocode cache (perf optimisation, not user data)
async function localGet(key){ try{ return localStorage.getItem(key); }catch(e){ return null; } }
async function localSet(key,value){ try{ localStorage.setItem(key,value); }catch(e){} }
// Legacy aliases so any remaining calls still work during transition
async function storageGet(key){ return localGet(key); }
async function storageSet(key,value){ return localSet(key,value); }

// -- Geocoding (Mapbox) + cache ----------------------------------
// ---- GEOCODING ----
let geocodeCache={},geocodingInProgress=false,geocodeProgress={done:0,total:0};
async function loadGeocodeCache(){ try{ const r=await storageGet('geocode_cache'); geocodeCache=r?JSON.parse(r):{}; }catch(e){ geocodeCache={}; } }
async function persistGeocodeCache(){
  try{
    const keys=Object.keys(geocodeCache);
    if(keys.length>300){ keys.slice(0,keys.length-300).forEach(k=>delete geocodeCache[k]); }
    await storageSet('geocode_cache',JSON.stringify(geocodeCache));
  }catch(e){}
}
function needsGeocode(ev){ return (ev.lat==null||ev.lon==null)&&ev.address; }
async function geocodeAddress(address){
  if(geocodeCache[address]) return geocodeCache[address];
  const url=`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${MAPBOX_TOKEN}&country=gb&limit=1&proximity=-0.1276,51.5072`;
  const res=await fetch(url);
  if(!res.ok) throw new Error(`geocode ${res.status}`);
  const data=await res.json();
  const f=data.features&&data.features[0];
  if(!f) throw new Error(`no match: ${address}`);
  const coords={lat:f.center[1],lon:f.center[0]};
  geocodeCache[address]=coords;
  return coords;
}

// Mapbox Search Box API — suggest & retrieve (host address picker)
function mapboxSuggest(query,sessionToken){
  const url=`https://api.mapbox.com/search/searchbox/v1/suggest?q=${encodeURIComponent(query)}&access_token=${MAPBOX_TOKEN}&session_token=${sessionToken}&country=gb&language=en&limit=6&types=address,poi,place,locality,neighborhood,postcode`;
  return fetch(url);
}
function mapboxRetrieve(mapboxId,sessionToken){
  return fetch(`https://api.mapbox.com/search/searchbox/v1/retrieve/${encodeURIComponent(mapboxId)}?access_token=${MAPBOX_TOKEN}&session_token=${sessionToken}`);
}

// -- Profile persistence -----------------------------------------
async function persistProfile(){
  if(!supabaseReady()) return; // demo mode: profile lives in localStorage only
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
async function persistFriends(){
  // Friends are written individually via addFriend() — this is a no-op kept for compatibility
}

// -- Supabase data loaders ---------------------------------------
// ── Supabase data loaders ─────────────────────────────────────────────────

async function loadRealEvents(){
  if(!supabaseReady()) return;
  const {data}=await sb.from('events').select('*').order('start_time',{ascending:true});
  if(!data) return;
  data.forEach(ev=>{
    // Don't duplicate seed events (they use numeric IDs 1-100)
    if(EVENTS.find(e=>e.id===ev.id)) return;
    const mapped={
      id:ev.id, title:ev.title, category:ev.category,
      host:ev.host_name, hostId:ev.host_id,
      venue:ev.venue, area:ev.area, address:ev.address,
      lat:ev.lat, lon:ev.lon,
      startTime:ev.start_time, endTime:ev.end_time,
      desc:ev.description, capacity:ev.capacity, price:ev.price||0,
      nightShotUrl:ev.night_shot_url||null
    };
    computeEventDates(mapped);
    EVENTS.push(mapped);
  });
}

async function loadAllRsvps(){
  if(!supabaseReady()) return;
  const {data}=await sb.from('rsvps').select('event_id,user_name');
  if(!data) return;
  data.forEach(r=>{
    if(!state.rsvps[r.event_id]) state.rsvps[r.event_id]=[];
    if(!state.rsvps[r.event_id].includes(r.user_name)) state.rsvps[r.event_id].push(r.user_name);
  });
}

async function loadFriends(){
  if(!supabaseReady()||!state.userId) return;
  const {data}=await sb.from('friends').select('friend_name').eq('user_id',state.userId);
  if(data){
    const fromDb=data.map(f=>f.friend_name);
    // Merge: keep in-session additions not yet in DB, avoid duplicates
    const merged=[...new Set([...fromDb,...state.friends])];
    state.friends=merged;
  }
}

async function addFriend(friendName,friendUserId){
  if(state.friends.includes(friendName)) return;
  if(supabaseReady()&&state.userId) await sb.from('friends').insert({user_id:state.userId,friend_id:friendUserId,friend_name:friendName});
  state.friends.push(friendName);
  renderView();
}

// -- Tickets -----------------------------------------------------
let myTickets=[];
async function loadMyTickets(){
  if(!supabaseReady()||!state.userId){ const r=await localGet(`tickets:${state.profileName}`); myTickets=r?JSON.parse(r):[]; return; }
  const {data}=await sb.from('tickets').select('*').eq('user_id',state.userId).order('purchased_at',{ascending:false});
  if(data) myTickets=data.map(t=>({
    ticketId:t.ticket_id, bookingId:t.booking_id, seatNum:t.seat_num, totalSeats:t.total_seats,
    eventId:t.event_id, type:t.ticket_type, typeLabel:t.type_label,
    pricePerTicket:t.price_per_ticket, total:t.total,
    purchaserName:t.purchaser_name, purchasedAt:new Date(t.purchased_at).getTime()
  }));
}
async function saveMyTickets(){
  // Tickets are written individually in registerFree() and processPayment()
  // This stub is kept so any legacy calls don't error
}
async function _insertTickets(tickets){
  if(!supabaseReady()||!state.userId){ try{ await localSet(`tickets:${state.profileName}`,JSON.stringify(myTickets)); }catch(e){} return; }
  const rows=tickets.map(t=>({
    ticket_id:t.ticketId, booking_id:t.bookingId, seat_num:t.seatNum||null, total_seats:t.totalSeats||null,
    event_id:t.eventId, user_id:state.userId, ticket_type:t.type, type_label:t.typeLabel,
    price_per_ticket:t.pricePerTicket, total:t.total,
    purchaser_name:t.purchaserName, purchased_at:new Date(t.purchasedAt).toISOString()
  }));
  await sb.from('tickets').insert(rows);
}

// -- Host applications -------------------------------------------
async function submitHostApplication({name,email,bizName,hostDesc,whyHost}){
  const appPayload={
    name, email,
    user_id: state.userId||null,
    business_name: bizName,
    event_types: _hostCats.join(','),
    description: hostDesc,
    why_host: whyHost,
    status: 'pending',
    created_at: new Date().toISOString()
  };

  // Try Supabase first; fall back to localStorage
  let savedToDb=false;
  if(sb){
    try{
      const {error}=await sb.from('host_applications').insert(appPayload);
      if(!error) savedToDb=true;
    }catch(e){}
  }

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
        <div class="gate-host-success-sub">Thanks ${escapeHtml(name)} — our team reviews every application to keep the network curated. Expect an answer within 48 hours. In the meantime, you're welcome inside as a member.</div>
        <button class="btn" style="width:100%;margin-top:24px;" onclick="document.body.style.overflow='';document.getElementById('gate-root').innerHTML='';enterApp();">Explore Cumulus →</button>
      </div>`;
  }
}

// -- Owner analytics (live financial data) -----------------------
// ── LIVE FINANCIAL DATA ──────────────────────────────────────────────
let ownerLiveData = null;
let _ownerLiveLoading = false;

async function loadOwnerLiveData(){
  if(!supabaseReady()||_ownerLiveLoading) return;
  _ownerLiveLoading = true;
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

    ownerLiveData = {
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
    _ownerLiveLoading=false;
    const btn2=document.getElementById('od-live-refresh');
    if(btn2){ btn2.textContent='↻ Refresh'; btn2.disabled=false; }
  }
}

