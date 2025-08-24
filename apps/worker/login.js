require('dotenv/config');
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

const { ensureDir, emailToSlug, randomDelay, humanMouseMove, humanType } = require('../../packages/shared/utils');

const COOKIES_DIR = path.join(__dirname, '..', 'data', 'cookies');
ensureDir(COOKIES_DIR);

// Re-usable stealth patches
async function applyStealthPatches(page) {
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => false });
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function (type) {
      if (type === 'image/png') return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAEklEQVR42mP8/vYtDwMUMCJzAGRcB+4mB+AAAAABJRU5ErkJggg==';
      return originalToDataURL.apply(this, arguments);
    };
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function (parameter) {
      if (parameter === 37445) return 'Intel Open Source Technology Center';
      if (parameter === 37446) return 'Mesa DRI Intel(R) HD Graphics';
      return getParameter.apply(this, arguments);
    };
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
  });
}

async function connectOrLaunch({ wsEndpoint, executablePath }) {
  if (wsEndpoint) {
    return puppeteer.connect({ browserWSEndpoint: wsEndpoint });
  }
  // fallback: launch your own Chrome (optional)
  return puppeteer.launch({
    headless: false,
    executablePath: executablePath || undefined,
    args: [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-blink-features=AutomationControlled',
    ],
  });
}

/**
 * Perform login to kleinanzeigen.de.
 * - Bricht NICHT mehr mit Error ab, wenn Credentials fehlen.
 * - Stattdessen: { ok:false, error:{ code:'MISSING_CREDENTIALS', message:'...' } }
 */
async function performLogin({
  email = process.env.KLEINANZEIGEN_EMAIL,
  password = process.env.KLEINANZEIGEN_PASSWORD,
  wsEndpoint = process.env.CHROME_WS_ENDPOINT,
  executablePath = process.env.CHROME_EXECUTABLE_PATH,
  saveAs = null,
}) {
  // --- NEU: graceful handling statt throw ---
  if (!email || !password) {
    return {
      ok: false,
      loggedIn: false,
      didSubmit: false,
      cookieFile: null,
      error: {
        code: 'MISSING_CREDENTIALS',
        message: 'Email and password must be provided via payload or env.',
      },
    };
  }
  // -----------------------------------------

  const cookieFileName = `cookies-${emailToSlug(email)}.json`;
  const cookiePath = path.join(COOKIES_DIR, saveAs || cookieFileName);

  const browser = await connectOrLaunch({ wsEndpoint, executablePath });
  const page = await browser.newPage();

  // Random UA; block heavy resources
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  ];
  await page.setUserAgent(userAgents[Math.floor(Math.random() * userAgents.length)]);
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    if (['image', 'font', 'media'].includes(req.resourceType())) req.abort();
    else req.continue();
  });

  await applyStealthPatches(page);

  // Load cookies if exist
  if (fs.existsSync(cookiePath)) {
    const cookies = JSON.parse(fs.readFileSync(cookiePath, 'utf8'));
    if (Array.isArray(cookies) && cookies.length) {
      await page.setCookie(...cookies);
      console.log('Cookies geladen – evtl. Login geskippt.');
    }
  }

  // Go to login
  await page.goto('https://www.kleinanzeigen.de/m-einloggen.html', { waitUntil: 'networkidle2', timeout: 90_000 });
  await randomDelay();
  await page.evaluate(() => window.scrollBy(0, Math.random() * 100 + 50));

  // GDPR banner (best-effort)
  try {
    await page.waitForSelector('#gdpr-banner-accept', { timeout: 5000 });
    await humanMouseMove(page, '#gdpr-banner-accept');
    await page.click('#gdpr-banner-accept');
    await randomDelay();
  } catch { /* ignore */ }

  // If login form present, perform login
  let didSubmit = false;
  try {
    await page.waitForSelector('input[name="loginMail"]', { timeout: 10_000 });
    await humanMouseMove(page, 'input[name="loginMail"]');
    await humanType(page, 'input[name="loginMail"]', email);
    await randomDelay();
    await humanMouseMove(page, 'input[name="password"]');
    await humanType(page, 'input[name="password"]', password);
    await randomDelay();
    await humanMouseMove(page, '#login-submit');
    await page.click('#login-submit');
    didSubmit = true;
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60_000 });
  } catch (e) {
    // Form nicht gefunden – evtl. bereits eingeloggt
  }

  // Heuristik: prüfe, ob "Mein Konto" o.ä. sichtbar ist
  let loggedIn = false;
  try {
    loggedIn = await page.evaluate(() => {
      const bodyText = document.body.innerText || '';
      const markers = ['Mein Konto', 'Meine Anzeigen', 'Abmelden', 'Nachrichten'];
      return markers.some(m => bodyText.includes(m));
    });
  } catch { }

  // Save cookies
  const cookies = await page.cookies();
  fs.writeFileSync(cookiePath, JSON.stringify(cookies, null, 2));

  // Bei connect() Browser offen lassen; Seite schließen:
  await page.close();

  return {
    ok: loggedIn || didSubmit, // best-effort
    loggedIn,
    didSubmit,
    cookieFile: cookiePath,
  };
}

module.exports = { performLogin };
