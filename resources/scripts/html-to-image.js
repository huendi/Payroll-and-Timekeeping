const puppeteer = require('puppeteer');
const fs = require('fs');

const htmlFile = process.argv[2];
const outputFile = process.argv[3];

(async () => {
  try {
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    const html = fs.readFileSync(htmlFile, 'utf8');
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const element = await page.$('#payslip-card');
    if (element) {
      await element.screenshot({ path: outputFile });
    }
    
    await browser.close();
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
})();