const { test, expect } = require("@playwright/test");

/*
 * Smoke tests — assert the app SHELL renders and core flows wire up.
 * They intentionally do NOT depend on Supabase/Mapbox (those CDNs may be
 * blocked in CI/sandbox); the app tolerates their absence for rendering.
 * App logic lives in global functions (inline-onclick contract), so we drive
 * internal navigation via page.evaluate — the same surface the UI calls.
 */

async function enterApp(page) {
  await page.evaluate(() => {
    const gr = document.getElementById("gate-root");
    if (gr) gr.innerHTML = "";
    /* global enterApp */
    enterApp();
    const app = document.getElementById("app");
    if (app) {
      app.style.display = "flex";
      app.style.flexDirection = "column";
    }
  });
  await page.waitForTimeout(300);
}

async function setView(page, view) {
  await page.evaluate((v) => {
    /* global state, EVENTS, renderNav, renderView */
    state.view = v;
    if (v === "detail" && EVENTS[0]) state.selectedEventId = EVENTS[0].id;
    renderNav();
    renderView();
  }, view);
  await page.waitForTimeout(250);
}

/*
 * Inject a self-contained fixture event. The app no longer ships seed events
 * (real data comes from Supabase, which is offline in CI), so any test that
 * needs an event on screen builds its own here rather than relying on seed rows.
 */
async function seedFixtureEvent(page) {
  return await page.evaluate(() => {
    /* global EVENTS, computeEventDates */
    const now = Date.now();
    const ev = {
      id: "fixture-1",
      title: "Fixture Test Event",
      category: "Creative",
      host: "Test Host",
      hostId: "test-host",
      venue: "Test Venue",
      area: "Soho",
      address: "Soho, London W1D",
      lat: 51.5136,
      lon: -0.1365,
      startTime: new Date(now + 3600000).toISOString(),
      endTime: new Date(now + 7200000).toISOString(),
      desc: "A fixture event for smoke tests.",
      capacity: 20,
      price: 0,
      nightShotUrl: null,
    };
    if (typeof computeEventDates === "function") computeEventDates(ev);
    if (!EVENTS.some((e) => e.id === ev.id)) EVENTS.push(ev);
    return ev.id;
  });
}

test.describe("Cumulus smoke", () => {
  test("boots straight into the Discover feed with a sign-in entry point", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".feed-h1")).toBeVisible();
    await expect(page.locator(".feed-search input")).toBeVisible();
    await expect(
      page.locator(".feed-head").getByRole("button", { name: "Sign in" }),
    ).toBeVisible();
    // The map is one tap away, not the front door.
    await expect(page.locator("#main-map")).toBeHidden();
  });

  test("local assets load (css / js / cloud) with no failures", async ({
    page,
  }) => {
    const failed = [];
    page.on("requestfailed", (r) => {
      if (r.url().includes("localhost")) failed.push(r.url());
    });
    await page.goto("/");
    await page.waitForTimeout(400);
    expect(failed, "no failed local requests").toEqual([]);
    // Deterministic: fetch each split asset directly.
    // (The skyline is an inline SVG diorama now — only cloud photos load as assets.)
    for (const path of [
      "/src/css/styles.css",
      "/src/js/config.js",
      "/src/js/app/01-core-constants.js",
      "/src/js/app/11-event-checkout.js",
      "/assets/clouds/cloud1.webp",
      "/assets/clouds/cloud3.webp",
      "/assets/img/discover.svg",
    ]) {
      const res = await page.request.get(path);
      expect(res.status(), `${path} served`).toBe(200);
    }
  });

  test("handler functions are global (inline-onclick contract holds)", async ({
    page,
  }) => {
    await page.goto("/");
    const types = await page.evaluate(() => [
      typeof renderFeed,
      typeof goFeed,
      typeof enterApp,
      typeof showLpSignup,
      typeof renderView,
      typeof renderAccount,
      typeof renderAdmin,
    ]);
    expect(
      types.every((t) => t === "function"),
      "all core fns global",
    ).toBeTruthy();
  });

  test("signup modal: Sign up ↔ Log in toggle", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => showLpSignup());
    await expect(page.locator("#gate-name-field")).toBeVisible();
    await page.evaluate(() => switchAuthMode("login"));
    await expect(page.locator("#gate-name-field")).toBeHidden();
    await expect(page.locator("#gate-form-title")).toHaveText(/Log in/i);
    await page.evaluate(() => switchAuthMode("signup"));
    await expect(page.locator("#gate-name-field")).toBeVisible();
  });

  test("sign-up form: frictionless, no gating fields", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => showLpSignup());
    // Attendee sign-up asks only for name + email — no curator/invite code
    // field exists anywhere in the gate markup (removed with the pivot).
    await expect(page.locator("#gate-name-field")).toBeVisible();
    await expect(page.locator("#gate-email")).toBeVisible();
    await expect(page.locator('[id*="curator"]')).toHaveCount(0);

    // Step-1 wiring: submitting emails a code. With the backend offline here it
    // must fail GRACEFULLY (surface an error, never crash) rather than sign the
    // user in without verification.
    await page.fill("#gate-name", "Nova");
    await page.fill("#gate-email", "nova@example.com");
    await page.evaluate(() => submitGate());
    await expect(page.locator("#gate-field-error")).toBeVisible();
  });

  test("enter app → Discover/Map/Tickets/You nav (Host/Admin hidden until earned)", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    const labels = (
      await page.locator(".bottom-nav .nav-link").allInnerTexts()
    ).map((s) => s.trim().toUpperCase());
    for (const tab of ["DISCOVER", "MAP", "TICKETS", "YOU"]) {
      expect(
        labels.some((l) => l.includes(tab)),
        `${tab} tab present`,
      ).toBeTruthy();
    }
    // Host tab is gated behind approved-host status (verified-host special
    // badge or admin) — a freshly signed-up account has neither, so it must
    // not be able to spam the event-creation form. Admin tab is likewise
    // hidden for every non-admin account.
    expect(
      labels.some((l) => l.includes("HOST")),
      "Host tab hidden for a non-approved account",
    ).toBeFalsy();
    expect(
      labels.some((l) => l.includes("ADMIN")),
      "Admin tab hidden for a non-admin account",
    ).toBeFalsy();
  });

  test("Host tab appears once an account is an approved host", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      /* global state, renderNav */
      state.specialBadges = ["verified-host"];
      renderNav();
    });
    const labels = (
      await page.locator(".bottom-nav .nav-link").allInnerTexts()
    ).map((s) => s.trim().toUpperCase());
    expect(
      labels.some((l) => l.includes("HOST")),
      "Host tab present for an approved host",
    ).toBeTruthy();
  });

  test("Admin tab appears only for an admin account", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      /* global state, renderNav */
      state.isAdmin = true;
      renderNav();
    });
    const labels = (
      await page.locator(".bottom-nav .nav-link").allInnerTexts()
    ).map((s) => s.trim().toUpperCase());
    expect(
      labels.some((l) => l.includes("ADMIN")),
      "Admin tab present for an admin account",
    ).toBeTruthy();
  });

  test("Admin status auto-verifies at boot — no manual re-sign-in needed for a real admin account", async ({
    page,
  }) => {
    await page.goto("/");
    // A real admins-table account should get the Admin tab automatically
    // the moment it signs in — initApp() calls the server-verified
    // isAdminSession() check itself now. Stub it (network is offline in
    // this harness) to exercise that auto-verify path without a live
    // Supabase session, the same way other tests inject fixture data.
    await page.evaluate(() => {
      /* global window */
      window.isAdminSession = async () => true;
    });
    await page.evaluate(() => {
      /* global state */
      state.userId = "test-admin-uuid";
    });
    await enterApp(page);
    await page.waitForTimeout(300);
    const labels = (
      await page.locator(".bottom-nav .nav-link").allInnerTexts()
    ).map((s) => s.trim().toUpperCase());
    expect(
      labels.some((l) => l.includes("ADMIN")),
      "Admin tab present automatically, no manual step taken",
    ).toBeTruthy();
    await page.evaluate(() => {
      /* global openAdmin */
      openAdmin();
    });
    // The manual "Admin sign-in" re-verify row is redundant once the
    // automatic check already confirmed the session — hidden so it
    // doesn't read as "you're not actually signed in as admin".
    await expect(
      page.getByRole("button", { name: /Admin sign-in/i }),
    ).toHaveCount(0);
  });

  test("map filters: collapsed by default, opens as a dropdown from the top-bar button", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => goBrowse());
    // Filters should not float open on their own on the map; only
    // #filter-toggle-btn opens them.
    await expect(page.locator("#map-filters")).not.toHaveClass(/open/);
    await expect(page.locator("#map-filters")).toBeHidden();

    await page.click("#filter-toggle-btn");
    await expect(page.locator("#map-filters")).toHaveClass(/open/);
    await expect(page.locator("#map-filters")).toBeVisible();
    await expect(page.locator("#map-filters .mchip").first()).toBeVisible();
    // Labelled pill + footer make it unmistakably a filter.
    await expect(page.locator("#filter-toggle-btn")).toContainText("Filters");
    await expect(page.locator("#map-filters .flt-show")).toContainText(/Show \d+ events?/);
    // Grouped into labelled sections (Category / Happening now / When)
    // rather than one flat cluster of a dozen chips.
    const groupLabels = await page
      .locator("#map-filters .filter-group-title")
      .allInnerTexts();
    // .filter-group-title is CSS text-transform:uppercase — allInnerTexts()
    // reflects the rendered case, not the raw DOM text.
    expect(groupLabels).toEqual(["CATEGORY", "HAPPENING NOW", "WHEN"]);

    // Selecting a category keeps the panel open (multi-adjust) and updates
    // the underlying filter state.
    await page.locator("#map-filters .mchip", { hasText: "Creative" }).click();
    const cat = await page.evaluate(() => state.selectedCategory);
    expect(cat).toBe("Creative");
    await expect(page.locator("#filter-count-badge")).toHaveText("1");
    await expect(page.locator("#map-filters")).toHaveClass(/open/);

    // Toggling the button again closes it.
    await page.click("#filter-toggle-btn");
    await expect(page.locator("#map-filters")).not.toHaveClass(/open/);

    // Leaving the map view force-closes the panel even if it were left open.
    await page.click("#filter-toggle-btn");
    await expect(page.locator("#map-filters")).toHaveClass(/open/);
    await setView(page, "account");
    await expect(page.locator("#map-filters")).not.toHaveClass(/open/);
  });

  test("live caption pill: real count, hides its dot when nothing is live, survives a map pan", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      goBrowse();
      updateMapCaptionBar();
    });
    await expect(page.locator("#map-caption-copy")).toHaveText(
      "Nothing live right now",
    );
    await expect(page.locator("#map-caption-bar .cap-live")).toBeHidden();

    await page.evaluate(() => {
      const now = Date.now();
      const ev = {
        id: "live-fixture-1",
        title: "Live Fixture",
        category: "Creative",
        host: "Test Host",
        hostId: "test-host",
        venue: "Test Venue",
        area: "Soho",
        address: "Soho, London",
        lat: 51.5136,
        lon: -0.1365,
        startTime: new Date(now - 600000).toISOString(),
        endTime: new Date(now + 3600000).toISOString(),
        desc: "desc",
        capacity: 20,
        price: 0,
      };
      if (typeof computeEventDates === "function") computeEventDates(ev);
      if (!EVENTS.some((e) => e.id === ev.id)) EVENTS.push(ev);
      updateMapCaptionBar();
    });
    await expect(page.locator("#map-caption-bar")).toHaveClass(/has-live/);
    await expect(page.locator("#map-caption-copy")).toContainText(
      "1 pulsing live now",
    );
    await expect(page.locator("#map-caption-bar .cap-live")).toBeVisible();

    // Regression check: the dot used to vanish (display:none) the instant
    // the map started panning — .map-caption .dot was previously in the
    // "pause expensive animations while moving" rule.
    await page.evaluate(() => document.body.classList.add("map-moving"));
    await expect(page.locator("#map-caption-bar .cap-live .dot")).toBeVisible();
  });

  test("core views render (host / calendar / account)", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await setView(page, "host");
    await expect(page.locator(".host-section").first()).toBeVisible();
    await setView(page, "calendar");
    await expect(page.locator(".calendar-scroll")).toBeVisible();
    await setView(page, "account");
    await expect(page.locator(".connect-header h2")).toHaveText("Account");
  });

  test("Account details opens as its own page with name/email/phone/avatar", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      state.profileName = "Nova Rivers";
      state.profileEmail = "nova@example.com";
      openAccountDetails();
    });
    await expect(page.locator("h2")).toHaveText("Account details");
    await expect(page.locator("#account-details-name")).toHaveValue(
      "Nova Rivers",
    );
    await expect(page.locator("#account-details-email")).toHaveValue(
      "nova@example.com",
    );
    await expect(page.locator("#account-details-phone")).toBeVisible();
    await expect(page.locator(".account-avatar")).toBeVisible();
    // Invalid phone is rejected without touching the network.
    await page.fill("#account-details-phone", "abc");
    await page.evaluate(() => saveAccountDetailsForm());
    await expect(page.locator("#account-details-error")).toBeVisible();
  });

  test("Account details: host banner editor only shown to approved hosts", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      state.profileName = "Nova Rivers";
      state.profileEmail = "nova@example.com";
      openAccountDetails();
    });
    // A regular (non-host) account gets the avatar editor only — no banner
    // upload zone, since there's no host profile page for it to appear on.
    await expect(page.locator(".account-cover-edit-zone")).toHaveCount(0);
    await expect(page.locator(".account-avatar-edit-zone")).toBeVisible();

    await page.evaluate(() => {
      state.specialBadges = ["verified-host"];
      openAccountDetails();
    });
    await expect(page.locator(".account-cover-edit-zone")).toBeVisible();
    await expect(
      page.locator("#account-cover-input"),
    ).toBeAttached();
  });

  test("host profile page: real follower stat, Follow gated to reviewed hosts", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const ev = {
        id: "host-fixture-1",
        title: "Host Fixture Event",
        category: "Creative",
        host: "Nova Collective",
        hostId: "host-uuid-123",
        venue: "Test Venue",
        area: "Soho",
        address: "Soho, London",
        lat: 51.5136,
        lon: -0.1365,
        startTime: new Date(now + 3600000).toISOString(),
        endTime: new Date(now + 7200000).toISOString(),
        desc: "desc",
        capacity: 20,
        price: 0,
      };
      if (typeof computeEventDates === "function") computeEventDates(ev);
      if (!EVENTS.some((e) => e.id === ev.id)) EVENTS.push(ev);
      openHostProfile("host-uuid-123", "Nova Collective");
    });
    await expect(page.locator(".host-profile-identity h2")).toContainText(
      "Nova Collective",
    );
    await expect(page.locator(".host-reviewed-badge")).toBeVisible();
    await expect(page.locator(".btn-follow-host")).toBeVisible();
    const statLabels = await page
      .locator(".host-stat-label")
      .allInnerTexts();
    expect(statLabels.some((l) => /Follower/i.test(l))).toBeTruthy();
    // Legacy, unreviewed hosts (no linked account) never get a Follow
    // button — host_follows has a real FK to auth.users, so there's
    // nothing valid to follow.
    await page.evaluate(() => {
      openHostProfile("Legacy Host Name", "Legacy Host Name");
    });
    await expect(page.locator(".btn-follow-host")).toHaveCount(0);
  });

  test("host profile: upcoming + past-year events as vertical blocks, weekly series tagged", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now(), D = 86400000;
      const mk = (id, title, startMs) => {
        const ev = {
          id, title, category: "Live Music", host: "Series Host", hostId: "series-host",
          venue: "V", area: "A", lat: 51.5, lon: -0.1,
          startTime: new Date(startMs).toISOString(),
          endTime: new Date(startMs + 2 * 3600000).toISOString(),
          desc: "d", capacity: 20, price: 5,
        };
        computeEventDates(ev);
        EVENTS.push(ev);
      };
      [1, 8, 15].forEach((d, i) => mk("wk-" + i, "Weekly Jazz", now + d * D));
      mk("one-off", "One Off Gig", now + 3 * D);
      for (let i = 1; i <= 8; i++) mk("past-" + i, "Old Gig " + i, now - i * 20 * D);
      mk("ancient", "Too Old", now - 400 * D); // older than 12 months → excluded
      openHostProfile("series-host", "Series Host");
    });
    // Vertical blocks, not a horizontal swipe row.
    await expect(page.locator(".host-event-row")).toHaveCount(0);
    await expect(page.locator(".hp-list:not(.hp-past) .fr-row")).toHaveCount(4);
    await expect(page.locator(".fr-chip.tag", { hasText: "Weekly" })).toHaveCount(3);
    // Past: 8 within the year (6 shown + "Show all"), the 400-day-old one excluded.
    await expect(page.locator(".hp-past .fr-row:visible")).toHaveCount(6);
    await expect(page.locator(".hp-more")).toHaveText("Show all 8 past events");
    await page.click(".hp-more");
    await expect(page.locator(".hp-past .fr-row:visible")).toHaveCount(8);
    await expect(page.locator(".hp-past", { hasText: "Too Old" })).toHaveCount(0);
  });

  test("host card on event page opens the profile; notify toggle + Discover strip", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const ev = {
        id: "notify-ev", title: "Fresh Gig", category: "Live Music",
        host: "Bell Host", hostId: "bell-host", venue: "V", area: "A",
        lat: 51.5, lon: -0.1,
        startTime: new Date(now + 86400000).toISOString(),
        endTime: new Date(now + 90000000).toISOString(),
        desc: "d", capacity: 20, price: 5, createdAt: now - 3600000,
      };
      computeEventDates(ev);
      EVENTS.push(ev);
      openEvent("notify-ev");
    });
    // Hosted-by is a tappable card that says where it goes.
    const card = page.locator(".host-card-main");
    await expect(card).toContainText("Hosted by");
    await expect(card).toContainText("View profile");
    await card.click();
    await expect(page.locator(".host-profile-identity h2")).toContainText("Bell Host");

    // Guest: the notify toggle asks to sign in instead of silently failing.
    await page.locator(".hp-notify-row").click();
    await expect(page.locator("#lp-signup-overlay")).toBeVisible();
    await page.evaluate(() => closeLpSignup());

    // Signed in with notify on → Discover shows the new event, Clear dismisses it.
    await page.evaluate(() => {
      state.userId = "test-user-uuid";
      state.profileName = "Test";
      state.notifyHostIds = ["bell-host"];
      state.eventsLoaded = true;
      goFeed();
    });
    await expect(page.locator("#feed-followed")).toContainText("Fresh Gig");
    await page.locator("#feed-followed .link-btn").click();
    await expect(page.locator("#feed-followed")).toHaveCount(0);
    await page.evaluate(() => goFeed());
    await expect(page.locator("#feed-followed")).toHaveCount(0);
  });

  test("Discover is compact: day groups, 12 at a time, organiser box up front", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      for (let i = 0; i < 20; i++) {
        const ev = {
          id: "page-" + i, title: "Paged " + i, category: "Creative", host: "H",
          venue: "V", area: "A", lat: 51.5, lon: -0.1,
          startTime: new Date(now + (i + 1) * 5 * 3600000).toISOString(),
          endTime: new Date(now + (i + 1) * 5 * 3600000 + 3600000).toISOString(),
          desc: "d", capacity: 20, price: 0,
        };
        computeEventDates(ev);
        EVENTS.push(ev);
      }
      state.eventsLoaded = true;
      goFeed();
    });
    // Organiser box is up front — above the event list, before any scrolling.
    const ctaY = await page.locator(".feed-host-cta").evaluate((el) => el.getBoundingClientRect().top);
    const resultsY = await page.locator("#feed-results").evaluate((el) => el.getBoundingClientRect().top);
    expect(ctaY).toBeLessThan(resultsY);
    await expect(page.locator("#feed-results .fr-row")).toHaveCount(12);
    await expect(page.locator("#feed-results .fr-day").first()).toBeVisible();
    // No stray index chips ("1", "2"…) on plain rows.
    await expect(page.locator("#feed-results .fr-chip.tag")).toHaveCount(0);
    await expect(page.locator(".feed-more")).toContainText("Show 8 more");
    await page.click(".feed-more");
    await expect(page.locator("#feed-results .fr-row")).toHaveCount(20);
    await expect(page.locator(".feed-more")).toHaveCount(0);
  });

  test("event detail: fully visible and bookable, no gating", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    const evId = await seedFixtureEvent(page);
    await page.evaluate((id) => {
      state.view = "detail";
      state.selectedEventId = id;
      renderNav();
      renderView();
    }, evId);
    // Every event is public — content is never hidden behind a gate, and
    // booking is a single, ungated action (no curator code, no perk unlock).
    await expect(page.locator(".ev-title")).toHaveText("Fixture Test Event");
    await expect(page.locator("#going-section")).toBeVisible();
    await expect(
      page.locator(".ev-buybar").getByRole("button", { name: /Get in free|Get tickets/i }),
    ).toBeVisible();
  });

  test("event detail: report button opens a reason-picker modal, signed-out is blocked", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    const evId = await seedFixtureEvent(page);
    await page.evaluate((id) => {
      state.view = "detail";
      state.selectedEventId = id;
      renderNav();
      renderView();
    }, evId);
    await expect(page.locator(".ev-report-btn")).toBeVisible();
    // Signed out: no report — window.prompt()-free feedback, just a toast.
    await page.evaluate(() => {
      state.userId = null;
    });
    await page.click(".ev-report-btn");
    await expect(page.locator("#report-event-overlay")).toHaveCount(0);
    // Signed in: opens the reason-picker modal (not window.prompt(), which
    // gets silently dismissed on a tab switch — see the modal's own comment).
    await page.evaluate(() => {
      state.userId = "test-user-uuid";
    });
    await page.click(".ev-report-btn");
    await expect(page.locator("#report-event-overlay")).toBeVisible();
    await expect(page.locator(".report-reason-option")).toHaveCount(4);
  });

  test("map pins: same-venue events merge into one poster pin with a count", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    const res = await page.evaluate(() => {
      const now = Date.now();
      const mk = (id, cat, lat, lon, startH) => {
        const ev = {
          id, title: "Pin " + id, category: cat, host: "H", venue: "V", area: "A",
          lat, lon, startTime: new Date(now + startH * 3600000).toISOString(),
          endTime: new Date(now + (startH + 2) * 3600000).toISOString(),
          desc: "d", capacity: 10, price: 5,
        };
        computeEventDates(ev);
        EVENTS.push(ev);
      };
      mk("pin-a", "Live Music", 51.52, -0.08, -1); // live
      mk("pin-b", "Creative", 51.52, -0.08, 5); // same venue
      mk("pin-c", "Gaming", 51.5, -0.12, 3); // elsewhere
      const geo = buildEventsGeoJSON();
      const venue = geo.features.find((f) => f.properties.count === 2);
      const el = _buildPinEl(venue.properties);
      return {
        features: geo.features.length,
        live: venue.properties.live,
        hasTile: !!el.querySelector(".mp-tile"),
        count: el.querySelector(".mp-count")?.textContent,
        isLive: el.querySelector(".mp").classList.contains("is-live"),
      };
    });
    expect(res.features).toBe(2);
    expect(res.live).toBe(1);
    expect(res.hasTile).toBeTruthy();
    expect(res.count).toBe("2");
    expect(res.isLive).toBeTruthy();

    // Multi-event venue sheet: panel with count, arrows + n/N, date tabs.
    await page.evaluate(() => {
      const evs = EVENTS.filter((e) => e.id === "pin-a" || e.id === "pin-b");
      let host = document.getElementById("main-map");
      host.style.display = "block";
      showMapCards(evs);
    });
    await expect(page.locator("#map-cards .mcard-count")).toHaveText("2");
    await expect(page.locator("#map-cards .mcard-pos")).toHaveText("1 / 2");
    await expect(page.locator("#map-cards .mcard-date")).toHaveCount(2);
    await page.locator('#map-cards .mcard-arrow[data-dir="1"]').click();
    await expect(page.locator("#map-cards .mcard-pos")).toHaveText("2 / 2");
    await expect(page.locator("#map-cards .mcard-date.on")).toHaveAttribute("data-i", "1");
  });

  test("appearance: light / dark / system preference applies, persists and follows the OS", async ({
    page,
  }) => {
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("/");
    await enterApp(page);
    const theme = () => page.evaluate(() => document.documentElement.getAttribute("data-theme"));

    // Settings dropdown on the home header — closed until the button is tapped.
    await expect(page.locator("#feed-settings")).toBeHidden();
    await page.click("#feed-settings-btn");
    await expect(page.locator("#feed-settings")).toBeVisible();
    await expect(page.locator("#feed-settings .set-opt")).toHaveCount(4);
    await page.locator('#feed-settings [data-theme-pref="dark"]').click();
    // Stays open while adjusting; closes on outside tap.
    await expect(page.locator("#feed-settings")).toBeVisible();
    await page.mouse.click(4, 700);
    await expect(page.locator("#feed-settings")).toBeHidden();

    await page.evaluate(() => setThemePref("dark"));
    expect(await theme()).toBe("dark");
    // Survives a reload and is applied before the app boots (head script).
    await page.reload();
    expect(await theme()).toBe("dark");

    await page.evaluate(() => setThemePref("light"));
    expect(await theme()).toBe("light");

    // System: follows the OS, live.
    await page.evaluate(() => setThemePref("system"));
    expect(await theme()).toBe("light");
    await page.emulateMedia({ colorScheme: "dark" });
    await expect.poll(theme).toBe("dark");

    // Only on the home header — not duplicated in Account.
    await page.evaluate(() => goFeed());
    await expect(page.locator('#feed-settings .set-opt.on')).toHaveAttribute("data-theme-pref", "system");
    await page.evaluate(() => {
      state.userId = "test-user-uuid";
      state.profileName = "Test User";
      openAccount();
    });
    await expect(page.locator("#view-container [data-theme-pref]")).toHaveCount(0);
  });

  test("map lighting follows the Appearance setting; host CTA opens the host info page", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    const preset = () => page.evaluate(() => mapLightPreset());
    await page.evaluate(() => setThemePref("dark"));
    expect(await preset()).toBe("night");
    await page.evaluate(() => setThemePref("light"));
    expect(await preset()).toBe("day");

    // Feed's "For organisers" box → host info page, whose CTA leads to the
    // application (sign-in gated for guests).
    await page.evaluate(() => goFeed());
    await page.click(".feed-host-cta");
    await expect(page.locator(".hx-h1")).toBeVisible();
    await expect(page.locator(".hx-bar")).toContainText("Apply to host");
    await page.evaluate(() => {
      state.userId = "test-user-uuid";
      state.profileName = "Test User";
    });
    await page.locator(".hx-bar .v-btn").click();
    await expect(page.locator(".host-cat-chip").first()).toBeVisible();
  });

  test("Admin panel: Reported events entry present", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      state.isAdmin = true;
      openAdmin();
    });
    await expect(
      page.getByRole("button", { name: /Reported events/i }),
    ).toBeVisible();
  });

  test("day/night cycle sets a valid theme", async ({ page }) => {
    // Manual toggleTheme was removed in favour of the day/night cycle —
    // assert the cycle (or saved pref) resolves to a real theme value,
    // since the landing diorama and sky gradients key off this attribute.
    await page.goto("/");
    await enterApp(page);
    const theme = await page.evaluate(() =>
      document.documentElement.getAttribute("data-theme"),
    );
    expect(["light", "dark"]).toContain(theme);
  });
});
