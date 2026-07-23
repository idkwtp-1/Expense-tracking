const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('BROWSER CONSOLE ERROR:', msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log('BROWSER PAGE ERROR:', error.message);
  });

  try {
    // Open the local file directly, just like the user is likely doing
    await page.goto(`file:///${__dirname.replace(/\\/g, '/')}/dist/index.html`, { waitUntil: 'networkidle' });
    console.log('Page loaded successfully');
    
    // Wait a bit just in case
    await page.waitForTimeout(2000);
  } catch (e) {
    console.error('PUPPETEER ERROR:', e);
  }

  await browser.close();
})();
