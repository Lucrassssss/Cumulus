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
  test("landing renders with hero + separate nav auth (Log in / Join Cumulus)", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.locator(".lp-hero-title")).toContainText(
      "Find what's on",
    );
    const nav = page.locator(".lp-nav");
    await expect(
      nav.getByRole("button", { name: "Log in", exact: true }),
    ).toBeVisible();
    await expect(
      nav.getByRole("button", { name: "Join Cumulus", exact: true }),
    ).toBeVisible();
    await expect(page.locator(".lp-nav-auth button")).toHaveCount(2);
    await expect(
      page.locator(".lp-hero-actions .lp-hero-btn-primary"),
    ).toBeVisible();
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
      typeof renderGate,
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

  test("enter app → 3-tab bottom nav (Host/Admin hidden until earned)", async ({
    page,
  }) => {
    await page.goto("/");
    await enterApp(page);
    const labels = (
      await page.locator(".bottom-nav .nav-link").allInnerTexts()
    ).map((s) => s.trim().toUpperCase());
    for (const tab of ["EXPLORE", "CALENDAR", "ACCOUNT"]) {
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
    await expect(page.locator(".detail-title")).toBeVisible();
    await expect(page.locator(".attendee-section")).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Register Free|Book Now/i }),
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
