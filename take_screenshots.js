/**
 * take_screenshots.js
 * Captures all CampusCloud screenshots using Playwright (Chromium).
 * Run: node take_screenshots.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = 'C:\\Users\\ujjwal khatri\\.gemini\\antigravity\\brain\\9b743e5f-0cb5-4603-8730-58cdde444cbd\\screenshots';
const BASE_URL = 'http://localhost:5173';

function ss(name) {
  return path.join(SCREENSHOTS_DIR, name);
}

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  // Ensure screenshots directory exists
  if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await context.newPage();

  try {
    // 1. Dashboard
    console.log('1. Dashboard...');
    await page.goto(BASE_URL, { waitUntil: 'networkidle' });
    await wait(2000);
    await page.screenshot({ path: ss('ss01_dashboard.png'), fullPage: false });
    console.log('   saved ss01_dashboard.png');

    // 2. Open Register modal
    console.log('2. Register modal...');
    await page.click('button:has-text("Register Student")');
    await wait(800);
    await page.screenshot({ path: ss('ss02_modal_open.png') });
    console.log('   saved ss02_modal_open.png');

    // 3. Fill form
    console.log('3. Fill form...');
    await page.fill('input[name="name"]', 'Meera Joshi');
    await page.fill('input[name="student_id"]', 'DS2024005');
    await page.fill('input[name="email"]', 'meera@university.edu');
    await page.selectOption('select[name="course"]', 'Data Science');
    await wait(500);
    await page.screenshot({ path: ss('ss03_form_filled.png') });
    console.log('   saved ss03_form_filled.png');

    // 4. Submit and see success
    console.log('4. Submit student...');
    await page.click('button[type="submit"]');
    await wait(1500);
    await page.screenshot({ path: ss('ss04_student_added.png') });
    console.log('   saved ss04_student_added.png');

    // 5. Students table
    console.log('5. Students table...');
    await page.click('button:has-text("Students")');
    await wait(1000);
    await page.screenshot({ path: ss('ss06_students_table.png') });
    console.log('   saved ss06_students_table.png');

    // 6. Edit modal
    console.log('6. Edit modal...');
    const editBtns = page.locator('button').filter({ has: page.locator('svg') }).first();
    // Click first edit button (smaller icon button in action column)
    const rows = page.locator('tbody tr');
    const rowCount = await rows.count();
    console.log(`   Found ${rowCount} rows`);
    if (rowCount > 0) {
      // Get all small icon buttons (action buttons)
      const actionBtns = page.locator('td button');
      const btnCount = await actionBtns.count();
      console.log(`   Found ${btnCount} action buttons`);
      if (btnCount >= 1) {
        await actionBtns.first().click();
        await wait(800);
        await page.screenshot({ path: ss('ss07_edit_modal.png') });
        console.log('   saved ss07_edit_modal.png');
        // Close modal
        await page.keyboard.press('Escape');
        await wait(500);
      }
    }

    // 7. Cloud & AWS page
    console.log('7. Cloud & AWS page...');
    await page.click('button:has-text("Cloud & AWS")');
    await wait(1000);
    await page.screenshot({ path: ss('ss09_cloud_page.png') });
    console.log('   saved ss09_cloud_page.png');

    // 8. Delete modal
    console.log('8. Delete modal...');
    await page.click('button:has-text("Students")');
    await wait(800);
    const delBtns = page.locator('td button');
    const delCount = await delBtns.count();
    if (delCount >= 2) {
      await delBtns.nth(1).click(); // second button = delete
      await wait(800);
      await page.screenshot({ path: ss('ss11_delete_modal.png') });
      console.log('   saved ss11_delete_modal.png');
      await page.keyboard.press('Escape');
    }

    // 9. Final dashboard
    console.log('9. Final dashboard...');
    await page.click('button:has-text("Dashboard")');
    await wait(1000);
    await page.screenshot({ path: ss('ss10_final_dashboard.png') });
    console.log('   saved ss10_final_dashboard.png');

    console.log('\nAll screenshots saved to:', SCREENSHOTS_DIR);
    const files = fs.readdirSync(SCREENSHOTS_DIR);
    console.log('Files:', files.join(', '));

  } catch (err) {
    console.error('ERROR:', err.message);
  } finally {
    await browser.close();
  }
})();
