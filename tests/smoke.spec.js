const { test, expect } = require('@playwright/test');

/*
 * Smoke tests — assert the app SHELL renders and core flows wire up.
 * They intentionally do NOT depend on Supabase/Mapbox (those CDNs may be
 * blocked in CI/sandbox); the app tolerates their absence for rendering.
 * App logic lives in global functions (inline-onclick contract), so we drive
 * internal navigation via page.evaluate — the same surface the UI calls.
 */

async function enterApp(page) {
  await page.evaluate(() => {
    const gr = document.getElementById('gate-root');
    if (gr) gr.innerHTML = '';
    /* global enterApp */
    enterApp();
    const app = document.getElementById('app');
    if (app) { app.style.display = 'flex'; app.style.flexDirection = 'column'; }
  });
  await page.waitForTimeout(300);
}

async function setView(page, view) {
  await page.evaluate((v) => {
    /* global state, EVENTS, renderNav, renderView */
    state.view = v;
    if (v === 'detail' || v === 'connect') state.selectedEventId = EVENTS[0].id;
    renderNav();
    renderView();
  }, view);
  await page.waitForTimeout(250);
}

test.describe('Cumulus smoke', () => {

  test('landing renders with hero + separate nav auth (Log in / Request Access)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.lp-hero-title')).toContainText('Find your people');
    const nav = page.locator('.lp-nav');
    await expect(nav.getByRole('button', { name: 'Log in', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Request Access', exact: true })).toBeVisible();
    await expect(page.locator('.lp-nav-auth button')).toHaveCount(2);
    await expect(page.locator('.lp-hero-actions .lp-hero-btn-primary')).toBeVisible();
  });

  test('local assets load (css / js / cloud) with no failures', async ({ page }) => {
    const failed = [];
    page.on('requestfailed', r => { if (r.url().includes('localhost')) failed.push(r.url()); });
    await page.goto('/');
    await page.waitForTimeout(400);
    expect(failed, 'no failed local requests').toEqual([]);
    // Deterministic: fetch each split asset directly.
    // (The skyline is an inline SVG diorama now — only cloud photos load as assets.)
    for (const path of ['/src/css/styles.css', '/src/js/app.js', '/src/js/config.js',
                         '/assets/clouds/cloud1.webp', '/assets/clouds/cloud3.webp', '/assets/img/discover.svg']) {
      const res = await page.request.get(path);
      expect(res.status(), `${path} served`).toBe(200);
    }
  });

  test('handler functions are global (inline-onclick contract holds)', async ({ page }) => {
    await page.goto('/');
    const types = await page.evaluate(() => [
      typeof renderGate, typeof enterApp, typeof showLpSignup,
      typeof renderView, typeof openExpandedCard, typeof openBadgePicker,
    ]);
    expect(types.every(t => t === 'function'), 'all core fns global').toBeTruthy();
  });

  test('signup modal: Sign up ↔ Log in toggle', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => showLpSignup());
    await expect(page.locator('#gate-name-field')).toBeVisible();
    await page.evaluate(() => switchAuthMode('login'));
    await expect(page.locator('#gate-name-field')).toBeHidden();
    await expect(page.locator('#gate-form-title')).toHaveText(/Log in/i);
    await page.evaluate(() => switchAuthMode('signup'));
    await expect(page.locator('#gate-name-field')).toBeVisible();
  });

  test('members-only: curator code gates new attendee sign-up', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => showLpSignup());
    // Curator field shows for attendee sign-up, hides on Log in / Host
    await expect(page.locator('#gate-curator-field')).toBeVisible();
    await page.evaluate(() => switchAuthMode('login'));
    await expect(page.locator('#gate-curator-field')).toBeHidden();
    await page.evaluate(() => { switchAuthMode('signup'); switchSignupType('host'); });
    await expect(page.locator('#gate-curator-field')).toBeHidden();
    await page.evaluate(() => switchSignupType('attendee'));
    await expect(page.locator('#gate-curator-field')).toBeVisible();
    // Bad / empty code is rejected with a curator error
    await page.fill('#gate-name', 'Nova');
    await page.fill('#gate-email', 'nova@example.com');
    await page.evaluate(() => submitGate());
    await expect(page.locator('#gate-field-error')).toContainText(/curator code/i);
    // A well-formed code passes FORMAT validation. Offline it is accepted
    // outright (lenient fallback); online the server may reject it as
    // unknown — either way it must never be a format rejection.
    const reason = await page.evaluate(async () => (await validateCuratorCode('CUR-AB12-CD34')).reason);
    expect(reason).not.toBe('format');
  });

  test('enter app → 4-tab bottom nav', async ({ page }) => {
    await page.goto('/');
    await enterApp(page);
    const labels = (await page.locator('.bottom-nav .nav-link').allInnerTexts())
      .map(s => s.trim().toUpperCase());
    for (const tab of ['EXPLORE', 'SOCIAL', 'CALENDAR', 'PROFILE']) {
      expect(labels.some(l => l.includes(tab)), `${tab} tab present`).toBeTruthy();
    }
  });

  test('core views render (social / calendar / profile)', async ({ page }) => {
    await page.goto('/');
    await enterApp(page);
    await setView(page, 'social');
    await expect(page.locator('.social-seg')).toBeVisible();
    await setView(page, 'calendar');
    await expect(page.locator('.calendar-scroll')).toBeVisible();
    await setView(page, 'profile');
    await expect(page.locator('.profile-id-card')).toBeVisible();
  });

  test('Cumulus Pass opens with featured badges + picker', async ({ page }) => {
    await page.goto('/');
    await enterApp(page);
    await page.evaluate(() => {
      state.profileName = 'Test User';
      state.myCard = { name: 'Test User', interests: '', bio: '' };
      openExpandedCard();
    });
    await expect(page.locator('.cpass-card')).toBeVisible();
    await expect(page.locator('.cpass-badges')).toBeVisible();
    await page.evaluate(() => openBadgePicker());
    await expect(page.locator('.cpass-picker')).toBeVisible();
  });

  test('perk gating: event visible, perks lock/unlock (WCAG-safe)', async ({ page }) => {
    await page.goto('/');
    await enterApp(page);
    await page.evaluate(() => {
      state.view = 'detail'; state.selectedEventId = EVENTS[0].id;
      state.curatorVerified = false; state.checkedInEventId = null;
      renderNav(); renderView();
    });
    // Event fully visible AND perks locked (content never hidden by the gate)
    await expect(page.locator('.detail-title')).toBeVisible();
    await expect(page.locator('.perk-panel.locked')).toBeVisible();
    await expect(page.getByRole('button', { name: /Enter curator code/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Check in at the door/i })).toBeVisible();
    // Once verified, perks unlock
    await page.evaluate(() => { state.curatorVerified = true; renderView(); });
    await expect(page.locator('.perk-panel.unlocked')).toBeVisible();
    await expect(page.locator('.perk-row')).toHaveCount(3);
  });

  test('day/night cycle sets a valid theme', async ({ page }) => {
    // Manual toggleTheme was removed in favour of the day/night cycle —
    // assert the cycle (or saved pref) resolves to a real theme value,
    // since the landing diorama and sky gradients key off this attribute.
    await page.goto('/');
    await enterApp(page);
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(['light', 'dark']).toContain(theme);
  });

});
