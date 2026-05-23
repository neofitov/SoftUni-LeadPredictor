const { test, expect } = require('@playwright/test');

test.describe('LeadPredictor', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ─── Smoke ─────────────────────────────────────────────────────────────────

  test('page loads with title and main sections', async ({ page }) => {
    await expect(page).toHaveTitle('LeadPredictor');
    await expect(page.locator('.logo-text')).toContainText('LeadPredictor');
    await expect(page.locator('.sidebar')).toBeVisible();
    await expect(page.locator('#chart')).toBeVisible();
    await expect(page.locator('.stats')).toBeVisible();
  });

  test('stat cards are visible with initial values', async ({ page }) => {
    await expect(page.locator('#valProspects')).toBeVisible();
    await expect(page.locator('#valLeads')).toBeVisible();
    await expect(page.locator('#valCustomers')).toBeVisible();
  });

  test('campaign meta header is rendered on load', async ({ page }) => {
    const meta = page.locator('#campaignMeta');
    await expect(meta).not.toContainText('loading…');
    await expect(meta).toContainText('Campaign:');
  });

  // ─── Core formula ──────────────────────────────────────────────────────────

  test('defaults produce correct funnel values', async ({ page }) => {
    // Defaults: revenue=10000, avgOrder=1000, leadRate=40, prospectRate=20
    // customers = 10000 / 1000 = 10
    // leads     = 10 * 100 / 40 = 25
    // prospects = 25 * 100 / 20 = 125
    await expect(page.locator('#valCustomers')).toHaveText('10');
    await expect(page.locator('#valLeads')).toHaveText('25');
    await expect(page.locator('#valProspects')).toHaveText('125');
  });

  test('changing revenue recalculates all stat cards', async ({ page }) => {
    await page.locator('#totalRevenue').fill('20000');
    await page.locator('#totalRevenue').dispatchEvent('input');
    // customers = 20000/1000 = 20, leads = 50, prospects = 250
    await expect(page.locator('#valCustomers')).toHaveText('20');
    await expect(page.locator('#valLeads')).toHaveText('50');
    await expect(page.locator('#valProspects')).toHaveText('250');
  });

  test('changing avg order value recalculates all stat cards', async ({ page }) => {
    await page.locator('#avgOrderValue').fill('500');
    await page.locator('#avgOrderValue').dispatchEvent('input');
    // customers = 10000/500 = 20, leads = 50, prospects = 250
    await expect(page.locator('#valCustomers')).toHaveText('20');
    await expect(page.locator('#valLeads')).toHaveText('50');
    await expect(page.locator('#valProspects')).toHaveText('250');
  });

  test('zero revenue shows 0 for all stats', async ({ page }) => {
    await page.locator('#totalRevenue').fill('0');
    await page.locator('#totalRevenue').dispatchEvent('input');
    await expect(page.locator('#valCustomers')).toHaveText('0');
    await expect(page.locator('#valLeads')).toHaveText('0');
    await expect(page.locator('#valProspects')).toHaveText('0');
    await expect(page.locator('#pctProspects')).toHaveText('0%');
  });

  // ─── Stat card percentages ─────────────────────────────────────────────────

  test('prospects percentage is always 100% when non-zero', async ({ page }) => {
    await expect(page.locator('#pctProspects')).toHaveText('100%');
  });

  test('leads percentage reflects lead rate', async ({ page }) => {
    // With defaults: leads/prospects = 25/125 = 20%
    await expect(page.locator('#pctLeads')).toHaveText('20.0%');
  });

  test('customers percentage reflects combined rates', async ({ page }) => {
    // customers/prospects = 10/125 = 8%
    await expect(page.locator('#pctCustomers')).toHaveText('8.0%');
  });

  // ─── Sliders ───────────────────────────────────────────────────────────────

  test('lead rate slider label updates live', async ({ page }) => {
    await page.locator('#leadRate').fill('60');
    await page.locator('#leadRate').dispatchEvent('input');
    await expect(page.locator('#leadRateVal')).toHaveText('60.00%');
  });

  test('prospect rate slider label updates live', async ({ page }) => {
    await page.locator('#prospectRate').fill('50');
    await page.locator('#prospectRate').dispatchEvent('input');
    await expect(page.locator('#prospectRateVal')).toHaveText('50.00%');
  });

  test('changing lead rate slider recalculates funnel', async ({ page }) => {
    await page.locator('#leadRate').fill('50');
    await page.locator('#leadRate').dispatchEvent('input');
    // customers=10, leads=10*100/50=20, prospects=20*100/20=100
    await expect(page.locator('#valCustomers')).toHaveText('10');
    await expect(page.locator('#valLeads')).toHaveText('20');
    await expect(page.locator('#valProspects')).toHaveText('100');
  });

  test('changing prospect rate slider recalculates funnel', async ({ page }) => {
    await page.locator('#prospectRate').fill('50');
    await page.locator('#prospectRate').dispatchEvent('input');
    // customers=10, leads=25, prospects=25*100/50=50
    await expect(page.locator('#valCustomers')).toHaveText('10');
    await expect(page.locator('#valLeads')).toHaveText('25');
    await expect(page.locator('#valProspects')).toHaveText('50');
  });

  // ─── Currency ──────────────────────────────────────────────────────────────

  test('default currency symbol is $', async ({ page }) => {
    await expect(page.locator('#currencySymbol')).toHaveText('$');
    await expect(page.locator('#currencySymbol2')).toHaveText('$');
  });

  test('switching currency updates both symbols to €', async ({ page }) => {
    await page.locator('#currency').selectOption('EUR');
    await page.locator('#currency').dispatchEvent('change');
    await expect(page.locator('#currencySymbol')).toHaveText('€');
    await expect(page.locator('#currencySymbol2')).toHaveText('€');
  });

  test('switching currency to BGN shows лв symbol', async ({ page }) => {
    await page.locator('#currency').selectOption('BGN');
    await page.locator('#currency').dispatchEvent('change');
    await expect(page.locator('#currencySymbol')).toHaveText('лв');
    await expect(page.locator('#currencySymbol2')).toHaveText('лв');
  });

  // ─── Campaign dates ────────────────────────────────────────────────────────

  test('campaign meta updates when dates change', async ({ page }) => {
    await page.locator('#campaignStart').fill('2026-01-01');
    await page.locator('#campaignStart').dispatchEvent('change');
    await page.locator('#campaignEnd').fill('2026-06-30');
    await page.locator('#campaignEnd').dispatchEvent('change');
    await expect(page.locator('#campaignMeta')).toContainText('Jan');
    await expect(page.locator('#campaignMeta')).toContainText('Jun');
  });

  test('reversed dates (end before start) fall back to 1 month', async ({ page }) => {
    await page.locator('#campaignStart').fill('2026-12-01');
    await page.locator('#campaignStart').dispatchEvent('change');
    await page.locator('#campaignEnd').fill('2026-01-01');
    await page.locator('#campaignEnd').dispatchEvent('change');
    // Should not crash — still shows valid numbers
    await expect(page.locator('#valCustomers')).toBeVisible();
    await expect(page.locator('#valLeads')).toBeVisible();
  });

  // ─── Chart ─────────────────────────────────────────────────────────────────

  test('canvas chart element is present and accessible', async ({ page }) => {
    const canvas = page.locator('#chart');
    await expect(canvas).toBeVisible();
    await expect(canvas).toHaveAttribute('role', 'img');
    await expect(canvas).toHaveAttribute('aria-label', /chart/i);
  });

  test('chart canvas has non-zero dimensions after load', async ({ page }) => {
    const size = await page.locator('#chart').boundingBox();
    expect(size.width).toBeGreaterThan(0);
    expect(size.height).toBeGreaterThan(0);
  });
});
