/**
 * Screenshot Testing Script for VibeBadminton
 * 
 * This script tests all features and takes screenshots of each page.
 * Run with: node scripts/screenshot-test.js
 * 
 * Prerequisites:
 * - Dev server should be running on http://localhost:3000
 * - Playwright installed: npm install --save-dev playwright
 * - Playwright browsers installed: npx playwright install chromium
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const SCREENSHOT_DIR = path.join(__dirname, '../docs/screenshots/test-results');
const BASE_URL = 'http://localhost:3000';

// Ensure screenshot directory exists
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function takeScreenshot(page, filename, description) {
  console.log(`📸 Capturing: ${description}...`);
  const filepath = path.join(SCREENSHOT_DIR, filename);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`✅ Saved: ${filename}`);
  return filepath;
}

async function waitForPageLoad(page) {
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Wait for any animations/transitions
}

async function testAllFeatures() {
  console.log('🚀 Starting screenshot testing...\n');
  console.log(`📁 Screenshots will be saved to: ${SCREENSHOT_DIR}\n`);
  
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  try {
    // 1. Home Page
    console.log('\n1️⃣ Testing Home Page');
    await page.goto(BASE_URL);
    await waitForPageLoad(page);
    await takeScreenshot(page, '01-home-page.png', 'Home Page');

    // 2. Create Session Page - Empty
    console.log('\n2️⃣ Testing Create Session Page (Empty)');
    await page.goto(`${BASE_URL}/create-session`);
    await waitForPageLoad(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '02-create-session-empty.png', 'Create Session (Empty Form)');

    // 3. Create Session Page - Filled (without round robin)
    console.log('\n3️⃣ Testing Create Session Page (Filled)');
    await page.fill('input[type="text"][placeholder*="Session"]', 'Friday Night Session');
    
    // Fill player names (wait a bit for inputs to be ready)
    await page.waitForTimeout(300);
    const playerInputs = await page.locator('input[type="text"][placeholder*="Player"]').all();
    const players = ['Alice', 'Bob', 'Charlie', 'Diana'];
    for (let i = 0; i < Math.min(playerInputs.length, players.length); i++) {
      await playerInputs[i].fill(players[i]);
      await page.waitForTimeout(100);
    }

    // Select organizer (wait for dropdown to populate)
    await page.waitForTimeout(300);
    const organizerSelect = page.locator('select').first();
    await organizerSelect.selectOption({ index: 1 }); // Select first non-empty option

    // Fill financial info - find inputs by scrolling to them and using more specific selectors
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(500);
    
    // Court cost input (after the per person/total buttons)
    const courtCostInput = page.locator('input[type="number"]').nth(0); // First number input is court cost
    await courtCostInput.fill('14.40');
    await page.waitForTimeout(300);
    
    // Bird cost input (second number input)
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(300);
    const birdCostInput = page.locator('input[type="number"]').nth(1);
    await birdCostInput.fill('3.00');
    await page.waitForTimeout(300);
    
    // Bet per player input (third number input)
    await page.evaluate(() => window.scrollTo(0, 1000));
    await page.waitForTimeout(300);
    const betInput = page.locator('input[type="number"]').nth(2);
    await betInput.fill('2.00');

    await waitForPageLoad(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '02-create-session-filled.png', 'Create Session (Filled Form)');

    // 4. Create Session Page - With Round Robin
    console.log('\n4️⃣ Testing Create Session Page (Round Robin Enabled)');
    const checkbox = page.locator('input[type="checkbox"]').first();
    await checkbox.check();
    await page.waitForTimeout(500); // Wait for round robin UI to appear
    
    // Fill in round robin game count
    const roundRobinInput = page.locator('input[placeholder="Auto"]').first();
    if (await roundRobinInput.isVisible()) {
      await roundRobinInput.fill('5');
      await page.waitForTimeout(300);
    }
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '02-create-session-round-robin.png', 'Create Session (Round Robin Enabled)');

    // Submit form to create session
    console.log('\n5️⃣ Creating session...');
    await page.click('button[type="submit"]:not([disabled])');
    await page.waitForURL(/\/session\/.*/, { timeout: 10000 });
    await waitForPageLoad(page);

    // 6. Session Page - Stats Tab (empty)
    console.log('\n6️⃣ Testing Session Page - Stats Tab (No Games)');
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '03-session-stats-empty.png', 'Session Stats Tab (No Games)');

    // 7. Session Page - Record Tab
    console.log('\n7️⃣ Testing Session Page - Record Tab');
    const recordTab = page.locator('button').filter({ hasText: /Record/i }).first();
    await recordTab.click();
    await waitForPageLoad(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '04-session-record-empty.png', 'Session Record Tab (Empty)');

    // 8. Record a game - Select Team A
    console.log('\n8️⃣ Testing Record Tab - Selecting Teams');
    // Find and click player buttons for Team A
    const aliceButton = page.locator('button').filter({ hasText: 'Alice' }).first();
    const bobButton = page.locator('button').filter({ hasText: 'Bob' }).first();
    
    // Click Alice for Team A Position 1
    await aliceButton.click();
    await page.waitForTimeout(200);
    
    // Scroll to see Team A Position 2
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(300);
    
    // Click Bob for Team A Position 2 (find the second instance)
    const bobButtons = await page.locator('button').filter({ hasText: 'Bob' }).all();
    if (bobButtons.length > 1) {
      await bobButtons[1].click();
    } else {
      await bobButton.click();
    }
    await page.waitForTimeout(300);

    // Scroll to Team B section
    await page.evaluate(() => window.scrollTo(0, 400));
    await page.waitForTimeout(300);
    
    // Select Team B players
    const charlieButton = page.locator('button').filter({ hasText: 'Charlie' }).first();
    const dianaButton = page.locator('button').filter({ hasText: 'Diana' }).first();
    
    await charlieButton.click();
    await page.waitForTimeout(200);
    
    const dianaButtons = await page.locator('button').filter({ hasText: 'Diana' }).all();
    if (dianaButtons.length > 1) {
      await dianaButtons[1].click();
    } else {
      await dianaButton.click();
    }
    
    await page.waitForTimeout(1000);
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '04-session-record-teams-selected.png', 'Record Tab (Teams Selected)');

    // Select winner - scroll down to find winner buttons
    await page.evaluate(() => window.scrollTo(0, 600));
    await page.waitForTimeout(1000);
    
    // Try to find and click Team A winner button
    try {
      const winnerSection = page.locator('h3').filter({ hasText: /Winner/i });
      await winnerSection.waitFor({ timeout: 3000 });
      const teamAButton = page.locator('button').filter({ hasText: /^Team A$/i }).first();
      await teamAButton.click({ timeout: 5000 });
      await page.waitForTimeout(500);
      await page.evaluate(() => window.scrollTo(0, 0));
      await takeScreenshot(page, '04-session-record-ready.png', 'Record Tab (Ready to Save)');
      
      // Save the game
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(500);
      const saveButton = page.locator('button').filter({ hasText: /Save Game/i }).first();
      await saveButton.click({ timeout: 5000 });
      await page.waitForTimeout(1500);
      await waitForPageLoad(page);
    } catch (error) {
      console.log('⚠️  Could not complete game recording automatically:', error.message);
      console.log('⚠️  Continuing with remaining screenshots...');
    }

    // Save the game
    const saveButton = page.locator('button').filter({ hasText: /Save Game/i }).first();
    await saveButton.click();
    await page.waitForTimeout(1000);
    await waitForPageLoad(page);

    // 9. Session Page - Stats Tab (with games)
    console.log('\n9️⃣ Testing Session Page - Stats Tab (With Games)');
    const statsTab = page.locator('button').filter({ hasText: /Stats/i }).first();
    await statsTab.click();
    await waitForPageLoad(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '03-session-stats-with-games.png', 'Session Stats Tab (With Games)');

    // 10. Session Page - History Tab
    console.log('\n🔟 Testing Session Page - History Tab');
    const historyTab = page.locator('button').filter({ hasText: /History/i }).first();
    await historyTab.click();
    await waitForPageLoad(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '05-session-history.png', 'Session History Tab');

    // 11. Summary Page
    console.log('\n1️⃣1️⃣ Testing Summary Page');
    const summaryLink = page.locator('a').filter({ hasText: /View Summary|Summary/i }).first();
    await summaryLink.click();
    await page.waitForURL(/\/session\/.*\/summary/, { timeout: 10000 });
    await waitForPageLoad(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    await takeScreenshot(page, '06-summary-page.png', 'Summary Page');

    console.log('\n✅ All screenshots captured successfully!');
    console.log(`\n📁 Screenshots saved to: ${SCREENSHOT_DIR}`);
    console.log(`\n📋 Summary:`);
    console.log(`   - Home Page`);
    console.log(`   - Create Session (Empty, Filled, Round Robin)`);
    console.log(`   - Session Stats (Empty, With Games)`);
    console.log(`   - Session Record (Empty, Teams Selected, Ready)`);
    console.log(`   - Session History`);
    console.log(`   - Summary Page`);

  } catch (error) {
    console.error('\n❌ Error during testing:', error);
    console.error('\n💡 Make sure the dev server is running on http://localhost:3000');
    throw error;
  } finally {
    await browser.close();
  }
}

// Check if dev server is running
async function checkServer() {
  const http = require('http');
  return new Promise((resolve) => {
    const req = http.get(BASE_URL, (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Run the test
(async () => {
  console.log('🔍 Checking if dev server is running...');
  const serverRunning = await checkServer().catch(() => false);
  
  if (!serverRunning) {
    console.error('\n❌ Dev server is not running!');
    console.error('💡 Please start the dev server first: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Dev server is running\n');
  await testAllFeatures();
})().catch(console.error);
