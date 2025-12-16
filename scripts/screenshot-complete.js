/**
 * Complete remaining screenshots by manually navigating
 * This script helps complete screenshots that require manual interaction
 */

const { chromium } = require('playwright');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots/test-results');
const BASE_URL = 'http://localhost:3000';

async function takeScreenshot(page, filename, description) {
  console.log(`📸 Capturing: ${description}...`);
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`✅ Saved: ${filename}`);
}

async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);
}

async function completeScreenshots() {
  console.log('🚀 Completing remaining screenshots...\n');
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  const page = await context.newPage();

  try {
    // Navigate to session page (assumes session exists from previous run)
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
    
    // Try to find and click "Continue Session" or navigate to create new session
    const continueButton = page.locator('a, button').filter({ hasText: /Continue|Create New Session/i }).first();
    if (await continueButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await continueButton.click();
      await page.waitForURL(/\/session\/.*/, { timeout: 5000 });
      await waitForPageLoad(page);
    } else {
      // Create new session
      console.log('Creating new session...');
      await page.goto(`${BASE_URL}/create-session`);
      await waitForPageLoad(page);
      
      // Quick fill and submit
      await page.fill('input[type="text"][placeholder*="Session"]', 'Test Session');
      const playerInputs = await page.locator('input[type="text"][placeholder*="Player"]').all();
      const players = ['Alice', 'Bob', 'Charlie', 'Diana'];
      for (let i = 0; i < Math.min(playerInputs.length, players.length); i++) {
        await playerInputs[i].fill(players[i]);
      }
      await page.locator('select').first().selectOption({ index: 1 });
      await page.locator('input[type="number"]').nth(0).fill('14.40');
      await page.locator('input[type="number"]').nth(1).fill('3.00');
      await page.locator('input[type="number"]').nth(2).fill('2.00');
      await page.click('button[type="submit"]:not([disabled])');
      await page.waitForURL(/\/session\/.*/, { timeout: 10000 });
      await waitForPageLoad(page);
    }

    // Stats tab with games (if games exist)
    console.log('\n📊 Taking stats screenshot...');
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '03-session-stats-with-games.png', 'Session Stats (With Games)');

    // History tab
    console.log('\n📜 Taking history screenshot...');
    const historyTab = page.locator('button').filter({ hasText: /History/i }).first();
    await historyTab.click();
    await waitForPageLoad(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '05-session-history.png', 'Session History');

    // Summary page
    console.log('\n📈 Taking summary screenshot...');
    const summaryLink = page.locator('a').filter({ hasText: /View Summary|Summary/i }).first();
    await summaryLink.click();
    await page.waitForURL(/\/session\/.*\/summary/, { timeout: 10000 });
    await waitForPageLoad(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '06-summary-page.png', 'Summary Page');

    console.log('\n✅ All screenshots completed!');
    console.log(`📁 Screenshots saved to: ${SCREENSHOT_DIR}`);

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.log('\n💡 Some screenshots may require manual interaction.');
    console.log('💡 You can complete them using the manual guide: docs/screenshots/MANUAL_TEST_GUIDE.md');
  } finally {
    await browser.close();
  }
}

completeScreenshots().catch(console.error);

