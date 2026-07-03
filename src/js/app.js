import { G } from './globals.js';
import { EVENT_SEED, EVENTS, CATS, CAT_IMG, catImg, eventStatus, isHotEvent, generateUniqueId, codeFor, DEMO_PEOPLE, personByName, CARD_BG_STYLES, CARD_ACCENT_COLORS, CARD_THEMES, CARD_PATTERNS, LONDON_AREAS, CATEGORY_KEYWORDS, MILESTONE_BADGES, CATEGORY_BADGES, ALLROUNDER_BADGE, TOTAL_CATEGORIES, SPECIAL_BADGES, LEVELS, getLevel, INTEREST_PRESETS, CALENDAR_YEAR, CALENDAR_MONTH, MONTH_NAMES, WEEKDAY_LABELS, BLOT_SVG, EMAIL_PATTERN } from './constants.js';
import { sb } from './config.js';
import { validateCuratorCode, adminSendCode, adminVerifyCode, isAdminSession, isPerkUnlocked, distanceMeters, canCheckInAt } from './services.js';
import * as Facade from './facade.js';

// Expose everything to window for inline HTML onclick handlers
window.G = G;
window.catImg = catImg;
window.eventStatus = eventStatus;
window.isHotEvent = isHotEvent;
window.generateUniqueId = generateUniqueId;
window.codeFor = codeFor;
window.personByName = personByName;
window.getLevel = getLevel;
window.renderGate = Facade.renderGate;
window.switchAuthMode = Facade.switchAuthMode;
window._updateCuratorVisibility = Facade._updateCuratorVisibility;
window.switchSignupType = Facade.switchSignupType;
window.showLpSignup = Facade.showLpSignup;
window.closeLpSignup = Facade.closeLpSignup;
window.lpUpdatePassName = Facade.lpUpdatePassName;
window._cacheSession = Facade._cacheSession;
window._restoreUserFromRow = Facade._restoreUserFromRow;
window.submitGate = Facade.submitGate;
window._submitHostApplication = Facade._submitHostApplication;
window.signOut = Facade.signOut;
window.enterApp = Facade.enterApp;
window.promptAdminSignIn = Facade.promptAdminSignIn;
window.persistProfile = Facade.persistProfile;
window.applyMapChrome = Facade.applyMapChrome;
window.resolveEventLocations = Facade.resolveEventLocations;
window.buildEventsGeoJSON = Facade.buildEventsGeoJSON;
window.updateClusterPaint = Facade.updateClusterPaint;
window.attachMapLayers = Facade.attachMapLayers;
window.syncHtmlMarkers = Facade.syncHtmlMarkers;
window.refreshMarkers = Facade.refreshMarkers;
window.initLeaflet = Facade.initLeaflet;
window.initHostMap = Facade.initHostMap;
window.handleAddressAutocomplete = Facade.handleAddressAutocomplete;
window.selectSearchSuggestion = Facade.selectSearchSuggestion;
window.selectAutocompleteAddress = Facade.selectAutocompleteAddress;
window.showMapLayer = Facade.showMapLayer;
window.persistGeocodeCache = Facade.persistGeocodeCache;
window.geocodeAddress = Facade.geocodeAddress;
window.openCardEditor = Facade.openCardEditor;
window.captureDraftFields = Facade.captureDraftFields;
window.handleCardPhoto = Facade.handleCardPhoto;
window.removeCardPhoto = Facade.removeCardPhoto;
window.selectCardTheme = Facade.selectCardTheme;
window.selectCardAccentColor = Facade.selectCardAccentColor;
window.selectCardPattern = Facade.selectCardPattern;
window.setPatternOpacity = Facade.setPatternOpacity;
window.toggleCardArea = Facade.toggleCardArea;
window.updateCardPreview = Facade.updateCardPreview;
window.renderCardEditor = Facade.renderCardEditor;
window.switchCeTab = Facade.switchCeTab;
window.saveCard = Facade.saveCard;
window.initCardSheen = Facade.initCardSheen;
window.getCardExt = Facade.getCardExt;
window.saveCardExt = Facade.saveCardExt;
window.openExpandedCard = Facade.openExpandedCard;
window.closeExpandedCard = Facade.closeExpandedCard;
window.renderProfile = Facade.renderProfile;
window.editProfile = Facade.editProfile;
window.updateAboutCounter = Facade.updateAboutCounter;
window.saveProfileAbout = Facade.saveProfileAbout;
window.toggleProfileInterest = Facade.toggleProfileInterest;
window.getAllBadges = Facade.getAllBadges;
window.getFeaturedBadges = Facade.getFeaturedBadges;
window.openBadgePicker = Facade.openBadgePicker;
window.toggleFeaturedBadge = Facade.toggleFeaturedBadge;
window.closeBadgePicker = Facade.closeBadgePicker;
window.renderAchievements = Facade.renderAchievements;
window.openAchievements = Facade.openAchievements;
window.renderDetail = Facade.renderDetail;
window.openEvent = Facade.openEvent;
window.checkInToEvent = Facade.checkInToEvent;
window.promptCuratorUnlock = Facade.promptCuratorUnlock;
window.uploadNightShot = Facade.uploadNightShot;
window.getFilteredEvents = Facade.getFilteredEvents;
window.toggleFriendsOnly = Facade.toggleFriendsOnly;
window.refreshFilters = Facade.refreshFilters;
window.pinTooltipHtml = Facade.pinTooltipHtml;
window.renderPerkPanel = Facade.renderPerkPanel;
window.renderCalendar = Facade.renderCalendar;
window.openCalendarDay = Facade.openCalendarDay;
window.renderCalendarDay = Facade.renderCalendarDay;
window.buildCalendarWeeks = Facade.buildCalendarWeeks;
window.openCalendar = Facade.openCalendar;
window.getMyEvents = Facade.getMyEvents;
window.getMyCategories = Facade.getMyCategories;
window.getEventDay = Facade.getEventDay;
window.toggleHotOnly = Facade.toggleHotOnly;
window.toggleLiveOnly = Facade.toggleLiveOnly;
window.computeEventDates = Facade.computeEventDates;
window.loadFriends = Facade.loadFriends;
window.addFriend = Facade.addFriend;
window.removeFriend = Facade.removeFriend;
window.renderConnect = Facade.renderConnect;
window.openFriends = Facade.openFriends;
window.openConnectGateway = Facade.openConnectGateway;
window.openConnect = Facade.openConnect;
window.peekAttendee = Facade.peekAttendee;
window.closeAttendeePeek = Facade.closeAttendeePeek;
window.toggleGoingSection = Facade.toggleGoingSection;
window._buildChatMsgHtml = Facade._buildChatMsgHtml;
window._appendChatMsg = Facade._appendChatMsg;
window.sendChat = Facade.sendChat;
window.renderSocialTab = Facade.renderSocialTab;
window.startChatCountdown = Facade.startChatCountdown;
window.getUnreadSocialCount = Facade.getUnreadSocialCount;
window.openSocialForEvent = Facade.openSocialForEvent;
window.openSocialTab = Facade.openSocialTab;
window.setHostType = Facade.setHostType;
window.ticketTypes = Facade.ticketTypes;
window.renderBook = Facade.renderBook;
window.renderCheckout = Facade.renderCheckout;
window.renderConfirmed = Facade.renderConfirmed;
window.renderMyTickets = Facade.renderMyTickets;
window.processPayment = Facade.processPayment;
window.loadMyTickets = Facade.loadMyTickets;
window._insertTickets = Facade._insertTickets;
window.openBook = Facade.openBook;
window.openViewTicket = Facade.openViewTicket;
window.registerFree = Facade.registerFree;
window.afterRenderConfirmed = Facade.afterRenderConfirmed;
window.downloadICS = Facade.downloadICS;
window.getCumulusFee = Facade.getCumulusFee;
window.formatCardNumber = Facade.formatCardNumber;
window.formatExpiry = Facade.formatExpiry;
window.openTicketsTab = Facade.openTicketsTab;
window.renderTicketsTab = Facade.renderTicketsTab;
window.generateTicketId = Facade.generateTicketId;
window.getTicketForEvent = Facade.getTicketForEvent;
window.setBookingType = Facade.setBookingType;
window.setBookingQty = Facade.setBookingQty;
window.proceedToCheckout = Facade.proceedToCheckout;
window.initOwnerDash = Facade.initOwnerDash;
window.renderOwnerDash = Facade.renderOwnerDash;
window.renderHostPayoutsPanel = Facade.renderHostPayoutsPanel;
window.renderReview = Facade.renderReview;
window.loadAndRenderReview = Facade.loadAndRenderReview;
window._buildReviewCard = Facade._buildReviewCard;
window.reviewHost = Facade.reviewHost;
window.renderEventApprovals = Facade.renderEventApprovals;
window.loadAndRenderEventApprovals = Facade.loadAndRenderEventApprovals;
window._buildEventApprovalCard = Facade._buildEventApprovalCard;
window.decideEvent = Facade.decideEvent;
window._publishApprovedEvent = Facade._publishApprovedEvent;
window.submitHostEvent = Facade.submitHostEvent;
window.od_tog = Facade.od_tog;
window._odPlatformFee = Facade._odPlatformFee;
window._odVatOnFee = Facade._odVatOnFee;
window._odStripeCost = Facade._odStripeCost;
window._odBarCol = Facade._odBarCol;
window._odTierCls = Facade._odTierCls;
window._odSetBar = Facade._odSetBar;
window._odSetTier = Facade._odSetTier;
window._odCalcSupa = Facade._odCalcSupa;
window._odCalcMb = Facade._odCalcMb;
window._odCalcEm = Facade._odCalcEm;
window._odCalcVc = Facade._odCalcVc;
window.od_renderStaff = Facade.od_renderStaff;
window.od_recalc = Facade.od_recalc;
window.loadOwnerLiveData = Facade.loadOwnerLiveData;
window._renderOwnerLivePanel = Facade._renderOwnerLivePanel;
window.openOwnerDash = Facade.openOwnerDash;
window.openReview = Facade.openReview;
window.openEventApprovals = Facade.openEventApprovals;
window._pendingEventKey = Facade._pendingEventKey;
window.clearAllTestData = Facade.clearAllTestData;
window.clearAllUsers = Facade.clearAllUsers;
window.toggleHostCat = Facade.toggleHostCat;
window.openHost = Facade.openHost;
window.showToast = Facade.showToast;
window.showConfirm = Facade.showConfirm;
window.setupReveal = Facade.setupReveal;
window.renderNav = Facade.renderNav;
window.pushNav = Facade.pushNav;
window.goBack = Facade.goBack;
window.renderView = Facade.renderView;
window.closeActivePopup = Facade.closeActivePopup;
window.goBrowse = Facade.goBrowse;
window.setCategory = Facade.setCategory;
window.chatIsOpen = Facade.chatIsOpen;
window.chatUnlockTime = Facade.chatUnlockTime;
window.pad2 = Facade.pad2;
window.markSocialSeen = Facade.markSocialSeen;
window.medallionHtml = Facade.medallionHtml;
window.badgeCellHtml = Facade.badgeCellHtml;
window.trophyHtml = Facade.trophyHtml;
window.trophyCellHtml = Facade.trophyCellHtml;
window.resetProfile = Facade.resetProfile;
window.getTheme = Facade.getTheme;
window.getBgStyle = Facade.getBgStyle;
window.resolveCardColors = Facade.resolveCardColors;
window.geocodeBannerHtml = Facade.geocodeBannerHtml;


// --- Entry Point Logic ---
export async function start(){
  // Theme: saved pref wins; if none, fall back to OS preference
  const _sysDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const prefsRaw=await localGet('prefs');
  if(prefsRaw){ try{ const p=JSON.parse(prefsRaw); if(p.theme) state.theme=p.theme; else state.theme=_sysDark?'dark':'light'; }catch(e){ state.theme=_sysDark?'dark':'light'; } }
  else { state.theme=_sysDark?'dark':'light'; }
  applyTheme();
  G.MAPBOX_TOKEN=DEFAULT_MAPBOX_TOKEN;

  // Check if we have a cached email to try loading from Supabase. Any failure
  // here (network blip, Supabase unreachable) must never blank the app — fall
  // through to the cached-session restore, then to the gate.
  const cachedEmail=await localGet('cumulus_email');
  if(cachedEmail){
    let profile=null;
    try{ const r=await sb.from('users').select('*').eq('email',cachedEmail).single(); profile=r.data; }
    catch(e){ profile=null; }
    if(profile&&profile.name){
      state.userId=profile.id;
      state.profileId=profile.profile_id||generateUniqueId();
      state.profileName=profile.name;
      state.profileEmail=profile.email;
      state.specialBadges=profile.special_badges||[];
      // Supabase-saved theme wins; if they never set one, respect OS pref
      state.theme=profile.theme||(prefsRaw&&JSON.parse(prefsRaw||'{}').theme)||(_sysDark?'dark':'light');
      applyTheme();
      // Restore card from profile columns
      if(profile.card_bio||profile.card_theme){
        state.myCard={
          name:profile.name,
          theme:profile.card_theme||'crimson',
          bio:profile.card_bio||'',
          interests:profile.card_interests||'',
          fact:profile.card_fact||''
        };
      }
      _cacheSession();
      enterApp();
      return;
    }
    // Supabase didn't answer but we have a cached snapshot — restore offline.
    // Fresh data loads in the background once initApp() reaches the network.
    try{
      const raw=await localGet('cumulus_session');
      if(raw){
        const s=JSON.parse(raw);
        if(s&&s.email===cachedEmail&&s.name){
          state.userId=s.userId;
          state.profileId=s.profileId||generateUniqueId();
          state.profileName=s.name;
          state.profileEmail=s.email;
          state.specialBadges=s.specialBadges||[];
          if(s.theme){ state.theme=s.theme; applyTheme(); }
          enterApp();
          return;
        }
      }
    }catch(e){}
  }
  // No cached session — show the gate
  renderGate();
}

export async function initApp(){
  // Background data load — enterApp() already rendered the UI with seed data.
  // This enriches it once Supabase responds without blocking the cloud animation.
  await loadRealEvents();

  await loadGeocodeCache();
  EVENTS.forEach(ev=>{ if(needsGeocode(ev)&&G.geocodeCache[ev.address]){ ev.lat=G.geocodeCache[ev.address].lat; ev.lon=G.geocodeCache[ev.address].lon; } });
  if(mapboxConfigured()) resolveEventLocations();

  await loadMyTickets();
  await loadAllRsvps();

  if(!state.myCard){
    const cardRaw=await localGet(`card:${state.profileName}`);
    if(cardRaw){ try{ state.myCard=JSON.parse(cardRaw); }catch(e){} }
  }

  await loadFriends();
  // Refresh view quietly once real data is in (still on map = update markers)
  if(state.view==='browse') renderView();
}

export async function loadRealEvents(){
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

export async function loadAllRsvps(){
  const {data}=await sb.from('rsvps').select('event_id,user_name');
  if(!data) return;
  data.forEach(r=>{
    if(!state.rsvps[r.event_id]) state.rsvps[r.event_id]=[];
    if(!state.rsvps[r.event_id].includes(r.user_name)) state.rsvps[r.event_id].push(r.user_name);
  });
}

export function generateSessionToken(){
  if(window.crypto&&window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{ const r=Math.random()*16|0,v=c==='x'?r:(r&0x3|0x8); return v.toString(16); });
}


start();
