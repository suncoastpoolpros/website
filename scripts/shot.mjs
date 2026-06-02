// Quick mobile screenshot of a URL at iPhone 16 Pro viewport.
import puppeteer from 'puppeteer-core';
const URL = process.argv[2] || 'http://localhost:4173/';
const OUT = process.argv[3] || '/tmp/hero-shot.png';
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 393, height: 852, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
await page.goto(URL, { waitUntil: 'networkidle0' });
await new Promise((r) => setTimeout(r, 700));
await page.screenshot({ path: OUT });
await browser.close();
console.log('saved', OUT);
