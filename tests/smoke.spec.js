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

  test("enter app → Discover/Map/Tickets/You nav (Tickets after sign-in, Host/Admin until earned)", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    const navLabels = async () =>
      (await page.locator(".bottom-nav .nav-link").allInnerTexts()).map((s) => s.trim().toUpperCase());
    // Guests: no Tickets tab until they sign in with their email.
    expect((await navLabels()).some((l) => l.includes("TICKETS")), "Tickets hidden for guests").toBeFalsy();
    await page.evaluate(() => {
      state.userId = "00000000-0000-0000-0000-000000000005";
      renderNav();
    });
    const labels = await navLabels();
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
    await page.evaluate(() => (state.userId = "00000000-0000-0000-0000-000000000004"));
    await setView(page, "account");
    await expect(page.locator(".ac-page .v-kicker")).toHaveText("Account");
  });

  test("Account: details locked until Edit, then edited all at once", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      state.userId = "00000000-0000-0000-0000-000000000004";
      state.profileName = "Nova Rivers";
      state.profileEmail = "nova@example.com";
      state.memberSince = "2026-03-02T10:00:00Z";
      openAccount();
    });
    await expect(page.locator(".ac-name")).toHaveText("Nova Rivers");
    await expect(page.locator(".ac-since")).toHaveText("Member since March 2026");
    await expect(page.locator(".ac-stat")).toHaveCount(4);
    // Locked: values shown as text, no inputs to fat-finger.
    await expect(page.locator("#ac-details input")).toHaveCount(0);
    await expect(page.locator("#ac-details .ac-val").first()).toHaveText("Nova Rivers");
    // Edit unlocks all three at once.
    await page.locator(".ac-edit").click();
    await expect(page.locator("#ac-details input")).toHaveCount(3);
    await expect(page.locator("#account-details-email")).toHaveValue("nova@example.com");
    // Cancel throws edits away and locks again.
    await page.fill("#account-details-name", "Changed");
    await page.locator("#ac-save .v-btn.ghost").click();
    await expect(page.locator("#ac-details input")).toHaveCount(0);
    await expect(page.locator("#ac-details .ac-val").first()).toHaveText("Nova Rivers");
    // Invalid phone is rejected without touching the network, still editing.
    await page.locator(".ac-edit").click();
    await page.fill("#account-details-phone", "abc");
    await page.locator("#ac-save .v-btn:not(.ghost)").click();
    await expect(page.locator("#account-details-error")).toBeVisible();
    await expect(page.locator("#ac-details input")).toHaveCount(3);
  });

  test("Account: hosting only for verified hosts; emails, past events, delete confirm", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const ev = { id: "past-1", title: "Old Gig", category: "Live Music", host: "Past Host", hostId: "ph",
        venue: "V", area: "Soho", startTime: new Date(now - 72 * 3600000).toISOString(),
        endTime: new Date(now - 70 * 3600000).toISOString(), desc: "", capacity: 50, price: 5 };
      computeEventDates(ev);
      EVENTS.push(ev);
      myTickets.push({ eventId: "past-1", ticketId: "TK-P1", qty: 1, typeLabel: "GA", total: 6.5 });
      state.userId = "00000000-0000-0000-0000-000000000004";
      state.profileName = "Nova Rivers";
      openAccount();
    });
    // Regular user: no Hosting card at all.
    await expect(page.locator("#ac-host-h")).toHaveCount(0);
    await expect(page.locator(".account-cover-edit-zone")).toHaveCount(0);
    // Email preferences + past events with "Go again".
    await expect(page.locator('[data-pref="email_reminders"]')).toHaveAttribute("aria-checked", "true");
    await expect(page.locator('[data-pref="email_followed"]')).toBeVisible();
    await expect(page.locator(".ac-past-row")).toContainText("Old Gig");
    await expect(page.locator(".ac-past-row .ac-again")).toBeVisible();
    // Delete needs DELETE typed before the button unlocks.
    await page.locator(".ac-delete").click();
    await expect(page.locator("#del-go")).toBeDisabled();
    await page.fill("#del-input", "delete");
    await expect(page.locator("#del-go")).toBeEnabled();
    await page.evaluate(() => closeLocationSheet(true));
    // Verified host: Hosting card with the banner editor.
    await page.evaluate(() => {
      state.specialBadges = ["verified-host"];
      renderView();
    });
    await expect(page.locator("#ac-host-h")).toBeVisible();
    await expect(page.locator(".account-cover-edit-zone")).toBeVisible();
    await expect(page.locator("#account-cover-input")).toBeAttached();
  });

  test("shared plans page lists a friend's upcoming events", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const ev = { id: "pl-1", title: "Friend Gig", category: "Live Music", host: "H", hostId: "h",
        venue: "V", area: "Soho", startTime: new Date(now + 48 * 3600000).toISOString(),
        endTime: new Date(now + 50 * 3600000).toISOString(), desc: "", capacity: 50, price: 0 };
      computeEventDates(ev);
      EVENTS.push(ev);
      state.sharedPlans = { name: "Priya", eventIds: ["pl-1"] };
      state.view = "plans";
      renderNav();
      renderView();
    });
    await expect(page.locator(".v-h1")).toHaveText("Priya's going to…");
    await expect(page.locator(".fr-row", { hasText: "Friend Gig" })).toBeVisible();
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

  test("event location opens Google/Apple Maps on the exact coordinates", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const ev = {
        id: "loc-ev", title: "Loc Test", category: "Creative", host: "H",
        venue: "A Venue Google Has Never Heard Of", area: "Peckham",
        lat: 51.473456, lon: -0.069123,
        startTime: new Date(now + 86400000).toISOString(),
        endTime: new Date(now + 90000000).toISOString(),
        desc: "d", capacity: 20, price: 0,
      };
      computeEventDates(ev);
      EVENTS.push(ev);
      openEvent("loc-ev");
    });
    await page.click(".ev-loc");
    await expect(page.locator("#loc-sheet")).toBeVisible();
    const google = await page.locator("#loc-sheet .loc-opt.primary").getAttribute("href");
    expect(google).toBe("https://www.google.com/maps/search/?api=1&query=51.473456,-0.069123");
    const dirs = await page.locator('#loc-sheet a[href*="/maps/dir/"]').getAttribute("href");
    expect(dirs).toContain("destination=51.473456,-0.069123");
    await expect(page.locator('#loc-sheet a[href*="maps.apple.com"]')).toHaveCount(1);
    // Static preview is pinned on the same coordinates.
    const bg = await page.locator(".ev-minimap").evaluate((el) => el.style.backgroundImage);
    expect(bg).toContain("pin-l+d4ff3f(-0.069123,51.473456)");
    await page.keyboard.press("Escape");
    await expect(page.locator("#loc-sheet")).toHaveCount(0);

    // A real venue with a street address opens its own place card by name.
    await page.evaluate(() => {
      const now = Date.now();
      const ev = {
        id: "loc-real", title: "Jazz", category: "Live Music", host: "H",
        venue: "Village Underground", address: "54 Holywell Ln, London EC2A 3NT",
        area: "Shoreditch", lat: 51.523606, lon: -0.078529,
        startTime: new Date(now + 86400000).toISOString(),
        endTime: new Date(now + 90000000).toISOString(),
        desc: "d", capacity: 20, price: 0,
      };
      computeEventDates(ev);
      EVENTS.push(ev);
      openEvent("loc-real");
    });
    await page.click(".ev-loc");
    const named = await page.locator("#loc-sheet .loc-opt.primary").getAttribute("href");
    expect(decodeURIComponent(named)).toContain("query=Village Underground, 54 Holywell Ln, London EC2A 3NT");
    const apple = await page.locator('#loc-sheet a[href*="maps.apple.com"]').getAttribute("href");
    expect(apple).toContain("q=Village%20Underground");
    expect(apple).toContain("ll=51.523606,-0.078529");
  });

  test("UX pass: all-in prices, ♥ save + Saved list, keyboard cards, more-like-this", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const mk = (id, title, cat, price, h) => {
        const ev = {
          id, title, category: cat, host: "UX Host", venue: "V", area: "A",
          address: "1 Test St, London", lat: 51.5 + h / 1000, lon: -0.1,
          startTime: new Date(now + h * 3600000).toISOString(),
          endTime: new Date(now + (h + 2) * 3600000).toISOString(),
          desc: "d", capacity: 50, price,
        };
        computeEventDates(ev);
        EVENTS.push(ev);
      };
      mk("ux-1", "Paid Gig", "Live Music", 12, 3);
      mk("ux-2", "Second Gig", "Live Music", 0, 5);
      mk("ux-3", "Third Gig", "Live Music", 30, 7);
      state.eventsLoaded = true;
      goFeed();
    });
    // All-in: £12 ticket + £1.50 booking fee shown as £13.50 before checkout.
    const row = page.locator("#feed-results .fr-row", { hasText: "Paid Gig" });
    await expect(row.locator(".fr-price")).toHaveText("£13.50");

    // ♥ save from the feed → Saved chip appears with a count.
    await row.locator(".save-btn").click();
    await expect(row.locator(".save-btn")).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-range="saved"] b')).toHaveText("1");
    // Guests have no Tickets tab — their saves live behind the Saved chip.
    await expect(page.locator('.bottom-nav [data-nav="tickets"]')).toHaveCount(0);
    await page.locator('[data-range="saved"]').click();
    await expect(page.locator("#feed-results .fr-row")).toHaveCount(1);
    // Signing in reveals the Tickets tab, with the Saved list inside it.
    await page.evaluate(() => {
      state.userId = "00000000-0000-0000-0000-000000000007";
      state.profileName = "Ux User";
      renderNav();
      setFeedRange("all");
    });
    await expect(page.locator('.bottom-nav [data-nav="tickets"]')).toHaveCount(1);
    await page.evaluate(() => openTicketsTab());
    await expect(page.locator(".hp-list .fr-row", { hasText: "Paid Gig" })).toBeVisible();

    // Keyboard: Enter on a focused card opens it.
    await page.evaluate(() => goFeed());
    await page.locator("#feed-results .fr-row", { hasText: "Third Gig" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(".ev-title")).toHaveText("Third Gig");
    // Event page: all-in price + "incl. booking fee", and never a dead end.
    await expect(page.locator(".ev-buy-price b")).toHaveText("£32.50");
    await expect(page.locator(".ev-buy-incl")).toContainText("incl. booking fee");
    await expect(page.locator(".ev-more").first()).toContainText("More from UX Host");
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

  test("Retention: crew going, Up next, can't-go sheet, calendar sheet, promise strip", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const mk = (id, title, h) => {
        const ev = { id, title, category: "Live Music", host: "R Host", venue: "Venue", area: "Soho",
          address: "1 Test St, London", lat: 51.51, lon: -0.13,
          startTime: new Date(now + h * 3600000).toISOString(), endTime: new Date(now + (h + 2) * 3600000).toISOString(),
          desc: "d", capacity: 50, price: 10 };
        computeEventDates(ev);
        EVENTS.push(ev);
      };
      mk("rt-1", "Tomorrow Gig", 30);
      mk("rt-2", "Crew Gig", 50);
      state.eventsLoaded = true;
      goFeed();
    });
    // Guests see the three promises.
    await expect(page.locator(".promise-strip li")).toHaveCount(3);
    await page.evaluate(() => {
      state.userId = "00000000-0000-0000-0000-000000000009";
      state.profileName = "Test User";
      myTickets.push({ eventId: "rt-1", ticketId: "TK-RT1", qty: 1, typeLabel: "General", total: 11.5 });
      state.crewGoing = { "rt-2": [{ id: "x", name: "Priya" }, { id: "y", name: "Alex" }] };
      goFeed();
    });
    await expect(page.locator(".promise-strip")).toHaveCount(0);
    await expect(page.locator(".up-next .un-title")).toHaveText("Tomorrow Gig");
    await expect(page.locator(".crew-chip").first()).toContainText("Priya & Alex going");
    await page.evaluate(() => openEvent("rt-2"));
    await expect(page.locator(".crew-line")).toContainText("Priya & Alex are going");
    // Calendar sheet with a Google link carrying the right dates.
    await page.evaluate(() => openCalendarSheet("rt-1"));
    const g = await page.locator('#loc-sheet a[href*="calendar.google.com"]').getAttribute("href");
    expect(g).toContain("text=Tomorrow%20Gig");
    expect(g).toMatch(/dates=\d{8}T\d{6}Z\/\d{8}T\d{6}Z/);
    // Can't-go sheet: transfer always, return >24h out.
    await page.evaluate(() => { closeLocationSheet(true); openCantGoSheet("TK-RT1"); });
    await expect(page.locator("#loc-sheet")).toContainText("Send it to a friend");
    await expect(page.locator("#loc-sheet")).toContainText("Return it · £11.50 back");
  });

  test("home account dropdown: tickets, account page only on request, sign out stays home", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      state.userId = "00000000-0000-0000-0000-000000000003";
      state.profileName = "Menu User";
      state.profileEmail = "menu@example.com";
      renderNav();
      goFeed();
    });
    await page.locator("#feed-account-btn").click();
    await expect(page.locator("#feed-account")).toHaveClass(/open/);
    await expect(page.locator("#feed-account")).toContainText("menu@example.com");
    await expect(page.locator("#feed-account")).toContainText("Your tickets");
    expect(await page.evaluate(() => state.view)).toBe("feed");
    // Opening Settings closes the account menu (one dropdown at a time).
    await page.locator("#feed-settings-btn").click();
    await expect(page.locator("#feed-account")).not.toHaveClass(/open/);
    // Account page only when chosen from the menu.
    await page.locator("#feed-account-btn").click();
    await page.locator("#feed-account .set-opt", { hasText: "Account & settings" }).click();
    expect(await page.evaluate(() => state.view)).toBe("account");
    // Sign out from the menu lands back on Discover as a guest.
    await page.evaluate(() => goFeed());
    await page.locator("#feed-account-btn").click();
    await page.locator("#feed-account .set-opt.danger").click();
    await page.locator(".cu-confirm-actions .btn:not(.btn-cancel)").click();
    await expect(page.locator(".feed-head .icon-pill.solid")).toHaveText("Sign in");
    expect(await page.evaluate(() => [state.view, state.userId])).toEqual(["feed", null]);
  });

  test("purchase flow: steps + sticky total, on-screen pay result, You're in + ticket with receipt", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const ev = { id: "buy-1", title: "Buy Test", category: "Club Night", host: "H", hostId: "h", venue: "V", area: "Soho",
        startTime: new Date(now + 50 * 3600000).toISOString(), endTime: new Date(now + 53 * 3600000).toISOString(), desc: "", capacity: 100, price: 12 };
      computeEventDates(ev);
      EVENTS.push(ev);
      state.userId = "00000000-0000-0000-0000-000000000008";
      state.profileName = "Buyer";
      renderNav();
      openBook("buy-1");
      setBookingQty(2);
    });
    await expect(page.locator(".bk-steps li.on")).toContainText("Tickets");
    await expect(page.locator(".bk-cta-total b")).toHaveText("£27.00");
    await expect(page.locator(".bk-cta-btn")).toContainText("Continue to pay");
    await expect(page.locator(".bk-cta-total em")).toHaveText("incl. £3.00 fee");
    // Quantity lives inside the selected ticket; step 1 fits a phone screen.
    await expect(page.locator(".tt-card.on .bk-stepper output")).toHaveText("2");
    const vp = page.viewportSize();
    if (vp && vp.width < 500) {
      const overflow = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
      expect(overflow).toBeLessThanOrEqual(0);
    }
    // Tab bar hidden while buying.
    await expect(page.locator(".bottom-nav")).toBeHidden();
    // A failed payment is shown on screen, not as a toast, and is dismissable.
    await page.evaluate(() =>
      showPayResult("failed", { title: "Payment didn't go through", body: "Declined.", primary: { label: "Try again", onclick: "hidePayOverlay()" } }),
    );
    await expect(page.locator("#pay-overlay[role=alertdialog] .po-title")).toHaveText("Payment didn't go through");
    await page.locator("#pay-overlay .po-acts .v-btn").click();
    await expect(page.locator("#pay-overlay")).toHaveCount(0);
    expect(await page.evaluate(() => state.view)).toBe("book");
    // Success: You're in, then the ticket with an openable receipt.
    await page.evaluate(() => {
      bookingDraft.confirmedTickets = [1, 2].map((i) => ({ ticketId: "TK-B-0" + i, bookingId: "TK-B", seatNum: i, totalSeats: 2,
        eventId: "buy-1", typeLabel: "General", pricePerTicket: 12, total: 13.5, purchaserName: "Buyer", purchasedAt: Date.now() }));
      showConfirmedAfterPurchase();
    });
    await expect(page.locator(".yi-overlay .yi-title")).toHaveText("You're in!");
    await expect(page.locator(".tv-h1")).toHaveText("You're in.");
    await expect(page.locator(".tv-ticket")).toHaveCount(2);
    await page.locator(".tv-receipt summary").click({ force: true });
    await expect(page.locator(".tv-r-body")).toContainText("Order number");
    await expect(page.locator(".tv-r-body .bk-line.total")).toContainText("£27.00");
    await expect(page.locator(".tv-r-body")).toContainText("Booking fee");
  });

  test("transfers: refund rule shown before sending, on received tickets, and on return", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const ev = { id: "tf-1", title: "Transfer Test", category: "Live Music", host: "H", hostId: "h", venue: "V", area: "Soho",
        startTime: new Date(now + 72 * 3600000).toISOString(), endTime: new Date(now + 75 * 3600000).toISOString(), desc: "", capacity: 50, price: 12 };
      computeEventDates(ev);
      EVENTS.push(ev);
      state.userId = "00000000-0000-0000-0000-000000000006";
      myTickets.push({ ticketId: "TK-OWN", bookingId: "TK-OWN", eventId: "tf-1", typeLabel: "General", pricePerTicket: 12, total: 13.5, purchaserName: "Me", purchasedAt: now });
      openCantGoSheet("TK-OWN");
    });
    await page.locator("#loc-sheet .loc-opt.primary").click();
    await expect(page.locator("#loc-sheet .tf-list .key")).toContainText("Refunds stay with you");
    await expect(page.locator("#loc-sheet .tf-list .key")).toContainText("original card");
    // A ticket a friend sent you: refund goes back to them.
    await page.evaluate(() => {
      closeLocationSheet(true);
      myTickets.length = 0;
      myTickets.push({ ticketId: "TK-GIFT", bookingId: "TK-GIFT", eventId: "tf-1", typeLabel: "General", pricePerTicket: 12, total: 13.5,
        purchaserName: "Priya Shah", purchasedAt: Date.now(), claimedBy: "00000000-0000-0000-0000-000000000006", claimedAt: Date.now() });
      openViewTicket("tf-1");
    });
    await expect(page.locator(".tv-gift")).toHaveText("From Priya");
    await expect(page.locator(".v-sub")).toContainText("sent to you by Priya");
    await expect(page.locator(".tv-receipt")).toContainText("go to Priya's original card");
    await page.evaluate(() => openCantGoSheet("TK-GIFT"));
    await expect(page.locator("#loc-sheet")).toContainText("Refund goes to Priya Shah's original card, not yours");
  });

  test("background refresh repaints quietly: skipped when unchanged, no replayed animation, scroll kept", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      for (let i = 0; i < 14; i++) {
        const ev = { id: "q-" + i, title: "Quiet " + i, category: "Live Music", host: "H", hostId: "h", venue: "V", area: "Soho",
          startTime: new Date(now + (i + 2) * 3600000).toISOString(), endTime: new Date(now + (i + 4) * 3600000).toISOString(), desc: "", capacity: 50, price: 0 };
        computeEventDates(ev);
        EVENTS.push(ev);
      }
      state.eventsLoaded = true;
      goFeed();
    });
    const feed = await page.evaluateHandle(() => document.querySelector(".feed"));
    // Nothing changed → the DOM node survives (no repaint at all).
    await page.evaluate(() => renderViewQuiet());
    expect(await page.evaluate((el) => el.isConnected, feed)).toBe(true);
    // Something changed (a ticket for today arrived) → repaint in place.
    await page.evaluate(() => window.scrollTo(0, 400));
    const y0 = await page.evaluate(() => window.scrollY);
    await page.evaluate(() => {
      state.userId = "00000000-0000-0000-0000-000000000002";
      myTickets.push({ ticketId: "TK-Q", bookingId: "TK-Q", eventId: "q-0", typeLabel: "GA", total: 0, purchasedAt: Date.now() });
      renderViewQuiet();
    });
    await expect(page.locator(".up-next")).toBeVisible();
    expect(await page.evaluate(() => window.scrollY)).toBe(y0);
  });

  test("Don't miss wheel: equal cards, cards both sides from the start, spins round", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      EVENTS.length = 0;
      for (let i = 0; i < 4; i++) {
        const ev = { id: "wh-" + i, title: "Wheel " + i, category: "Live Music", host: "H", hostId: "h", venue: "V", area: "Soho",
          startTime: new Date(now + (i + 2) * 3600000).toISOString(), endTime: new Date(now + (i + 4) * 3600000).toISOString(), desc: "", capacity: 50, price: 0 };
        computeEventDates(ev);
        EVENTS.push(ev);
      }
      state.eventsLoaded = true;
      goFeed();
    });
    const widths = await page.$$eval("#fp-rail .fp-card", (els) => els.map((e) => Math.round(e.getBoundingClientRect().width)));
    expect(new Set(widths).size).toBe(1);
    // One real (focusable) card per event; the rest are visual copies.
    await expect(page.locator("#fp-rail .fp-card:not(.clone)")).toHaveCount(4);
    // No empty gap on the left: a card sits left of the centred one from the start.
    const leftOfCentre = await page.evaluate(() => {
      const rail = document.getElementById("fp-rail");
      const r = rail.getBoundingClientRect();
      const on = rail.querySelector(".fp-card.on").getBoundingClientRect();
      return [...rail.querySelectorAll(".fp-card")].some((c) => {
        const b = c.getBoundingClientRect();
        return b.right <= on.left + 1 && b.right > r.left + 10;
      });
    });
    expect(leftOfCentre).toBe(true);
    const dot = () => page.$$eval(".fw-dots button", (els) => els.findIndex((e) => e.classList.contains("on")));
    expect(await dot()).toBe(0);
    await page.locator(".fw-arrow.next").click();
    await expect.poll(dot).toBe(1);
    await page.locator(".fw-arrow.prev").click();
    await expect.poll(dot).toBe(0);
    // Going left from the first spins round to the last.
    await page.locator(".fw-arrow.prev").click();
    await expect.poll(dot).toBe(3);
    // ...and settles back onto the real set (a real card is centred).
    await expect.poll(() => page.evaluate(() => !document.querySelector("#fp-rail .fp-card.on").classList.contains("clone"))).toBe(true);
  });

  test("quiet repaint never replays the entrance animation (no double load)", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const ev = { id: "ql-1", title: "Quiet Load", category: "Live Music", host: "H", hostId: "h", venue: "V", area: "Soho",
        startTime: new Date(now + 3 * 3600000).toISOString(), endTime: new Date(now + 5 * 3600000).toISOString(), desc: "", capacity: 50, price: 0 };
      computeEventDates(ev);
      EVENTS.push(ev);
      state.eventsLoaded = true;
      renderViewQuiet();
    });
    const running = await page.evaluate(() =>
      document.getElementById("view-container").getAnimations({ subtree: true })
        .filter((a) => a.effect.getComputedTiming().iterations !== Infinity && a.playState === "running").length,
    );
    expect(running).toBe(0);
    await page.waitForTimeout(120);
    const after = await page.evaluate(() =>
      document.getElementById("view-container").getAnimations({ subtree: true })
        .filter((a) => a.effect.getComputedTiming().iterations !== Infinity && a.playState === "running").length,
    );
    expect(after).toBe(0);
  });

  test("booking counter counts paid tickets, and moves the moment you buy", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const ev = { id: "cnt-1", title: "Counter Test", category: "Live Music", host: "H", hostId: "h", venue: "V", area: "Soho",
        startTime: new Date(now + 48 * 3600000).toISOString(), endTime: new Date(now + 50 * 3600000).toISOString(), desc: "", capacity: 30, price: 10 };
      computeEventDates(ev);
      EVENTS.push(ev);
      state.ticketCounts = { "cnt-1": 3 }; // 3 paid tickets, no RSVP rows
      openEvent("cnt-1");
    });
    await expect(page.locator("#going-section .ev-h2")).toHaveText("3 going");
    await expect(page.locator("#going-section .ev-cap")).toHaveText("27 of 30 left");
    // Buying 2 updates it straight away.
    await page.evaluate(() => {
      state.userId = "00000000-0000-0000-0000-000000000001";
      bookingDraft.confirmedTickets = [1, 2].map((i) => ({ ticketId: "TK-C" + i, bookingId: "TK-C", eventId: "cnt-1", typeLabel: "GA", pricePerTicket: 10, total: 11.5, purchasedAt: Date.now() }));
      myTickets.push(...bookingDraft.confirmedTickets);
      showConfirmedAfterPurchase();
      openEvent("cnt-1");
    });
    await expect(page.locator("#going-section .ev-h2")).toHaveText("5 going");
    await expect(page.locator("#going-section .ev-cap")).toHaveText("25 of 30 left");
  });

  test("Admin tab has a stress-test wipe; events with a real host show Follow", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      state.isAdmin = true;
      state.userId = "00000000-0000-0000-0000-00000000000a";
      state.view = "admin";
      renderNav();
      renderView();
    });
    await expect(page.locator(".prof-action-row", { hasText: "Wipe stress test" })).toBeVisible();
    await page.evaluate(() => {
      const now = Date.now();
      const ev = { id: "fh-1", title: "Follow Me", category: "Live Music", host: "Velvet Rooms", hostId: "11111111-1111-1111-1111-111111111111",
        venue: "V", area: "Soho", startTime: new Date(now + 24 * 3600000).toISOString(), endTime: new Date(now + 27 * 3600000).toISOString(), desc: "", capacity: 50, price: 0 };
      computeEventDates(ev);
      EVENTS.push(ev);
      openEvent("fh-1");
    });
    await expect(page.locator(".btn-follow-host")).toHaveText("Follow");
  });

  test("pinned bars stay on screen: Pay bar is fixed to the viewport on a small phone", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const ev = { id: "pin-1", title: "Pin Test", category: "Live Music", host: "H", hostId: "h", venue: "V", area: "Soho",
        startTime: new Date(now + 50 * 3600000).toISOString(), endTime: new Date(now + 53 * 3600000).toISOString(), desc: "", capacity: 100, price: 12 };
      computeEventDates(ev);
      EVENTS.push(ev);
      state.userId = "00000000-0000-0000-0000-00000000000b";
      openBook("pin-1");
      state.view = "checkout";
      renderView();
      document.getElementById("checkout-status").style.display = "none";
      document.getElementById("payment-element").innerHTML = '<div style="height:520px"></div>';
      document.getElementById("checkout-cta-bar").style.display = "flex";
    });
    await page.waitForTimeout(900); // let entrance animations finish
    const bar = await page.locator("#checkout-cta-bar").boundingBox();
    expect(bar.y + bar.height).toBeLessThanOrEqual(568);
    expect(bar.y).toBeGreaterThan(400);
  });

  test("live ticket shows a red dot on Tickets; after buying, the ticket sits under Tickets and Done goes there", async ({ page }) => {
    await page.goto("/");
    await enterApp(page);
    await page.evaluate(() => {
      const now = Date.now();
      const ev = { id: "lv-1", title: "On Now", category: "Live Music", host: "H", hostId: "h", venue: "V", area: "Soho",
        startTime: new Date(now - 30 * 60000).toISOString(), endTime: new Date(now + 2 * 3600000).toISOString(), desc: "", capacity: 50, price: 10 };
      computeEventDates(ev);
      EVENTS.push(ev);
      state.userId = "00000000-0000-0000-0000-00000000000c";
      myTickets.push({ ticketId: "TK-LV", bookingId: "TK-LV", eventId: "lv-1", typeLabel: "GA", pricePerTicket: 10, total: 11.5, purchasedAt: now });
      renderNav();
    });
    await expect(page.locator('.bottom-nav [data-nav="tickets"] .nav-badge')).toHaveCount(1);
    await page.evaluate(() => openTicketsTab());
    await expect(page.locator(".tk.is-live .tk-live")).toContainText("Happening now");
    // Purchase confirmation lives under the Tickets tab, and Done opens Tickets.
    await page.evaluate(() => {
      bookingDraft.confirmedTickets = [myTickets[0]];
      showConfirmedAfterPurchase();
    });
    await expect(page.locator('.bottom-nav [data-nav="tickets"]')).toHaveClass(/active-cloud-tab/);
    await page.locator(".yi-overlay").click({ force: true }).catch(() => {});
    await page.waitForTimeout(600);
    await page.locator(".bk-done").click();
    expect(await page.evaluate(() => state.view)).toBe("my-tickets");
  });
});
