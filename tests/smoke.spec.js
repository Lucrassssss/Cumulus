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

  test('landing renders with hero + separate nav auth (Log in / Sign up)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.lp-hero-title')).toContainText('Find your people');
    const nav = page.locator('.lp-nav');
    await expect(nav.getByRole('button', { name: 'Log in', exact: true })).toBeVisible();
    await expect(nav.getByRole('button', { name: 'Sign up', exact: true })).toBeVisible();
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
    for (const path of ['/src/css/styles.css', '/src/js/app.js', '/src/js/config.js',
                         '/assets/clouds/cloud1.webp', '/assets/skyline/skyline-dark.svg', '/assets/skyline/skyline-light.svg']) {
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

  test('theme toggle flips data-theme', async ({ page }) => {
    await page.goto('/');
    await enterApp(page);
    const before = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    await page.evaluate(() => toggleTheme());
    const after = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(after).not.toEqual(before);
  });

});
