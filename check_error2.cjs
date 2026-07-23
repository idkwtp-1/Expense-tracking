const { chromium } = require('playwright');
const { spawn } = require('child_process');

(async () => {
  console.log('Starting dev server...');
  const server = spawn('npm', ['run', 'dev'], { shell: true });
  
  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('Launching browser...');
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
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle' });
    console.log('Page loaded successfully');
    
    // Wait a bit to ensure async errors are caught
    await page.waitForTimeout(3000);
  } catch (e) {
    console.error('PUPPETEER ERROR:', e);
  }

  await browser.close();
  server.kill();
})();
