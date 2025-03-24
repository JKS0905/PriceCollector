import axios from 'axios';
import { load } from 'cheerio';
import { chromium } from 'playwright';

// Known stores with special methods
const spanPowerNo = 'span[_ngcontent-ng-c3913698638]'; // Warning: Dynamic, may change

export async function fetchPriceAndAssignMethod(link) {
    try {
        // Try static methods first for speed
        const res = await axios.get(link, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = res.data;

        // Method 1: JSON-LD
        let price = await fetchPriceMethod1(html);
        if (price !== null) return { price, method: 'json-ld' };

        // Method 2: Generic HTML patterns
        price = await fetchPriceMethod2(html);
        if (price !== null) return { price, method: 'html-pattern' };

        // Method 3: Known site with headless browser (slower, last resort)
        if (link.includes('https://www.power.no')) {
            price = await fetchPriceMethodHeadlessBrowser(link, spanPowerNo);
            if (price !== null) return { price, method: 'browser' };
        }

        console.log('No price found with any method');
        return null;
    } catch (error) {
        console.error('Error:', error.message);
        return null;
    }
};

export async function fetchPriceMethod1(html) {
    const jsonMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    for (const match of jsonMatches) {
        try {
            const jsonData = JSON.parse(match[1]);
            if (jsonData['@type'] === 'Product' && jsonData.offers) {
                const offer = Array.isArray(jsonData.offers) ? jsonData.offers[0] : jsonData.offers;
                return parseFloat(offer.price);
            }
        } catch (error) {
            console.log('JSON parse error:', error.message);
        }
    }
    return null;
};

export async function fetchPriceMethod2(html) {
    const $ = load(html);
    // Broader price patterns
    const priceSelectors = [
        'span.product-price-now', // Your original
        '[itemprop="price"]',     // Schema.org
        '.price',                 // Common class
        'span:contains("kr")'     // Currency hint
    ];

    for (const selector of priceSelectors) {
        const priceText = $(selector).text().trim();
        if (priceText) {
            const price = parseFloat(priceText.replace(/[^\d.,]/g, '').replace(',', '.'));
            if (!isNaN(price)) return price;
        }
    }

    // Fallback: Generic price in scripts
    const scriptPrice = html.match(/"price":\s*"(\d+(?:\.\d+)?)"/);
    if (scriptPrice) return parseFloat(scriptPrice[1]);

    return null;
};

export async function fetchPriceMethodHeadlessBrowser(link, element) {
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        // Optimize: Block non-essential resources
        await page.route('**/*', (route) => {
            const type = route.request().resourceType();
            if (['image', 'stylesheet', 'font'].includes(type)) route.abort();
            else route.continue();
        });

        await page.goto(link, { waitUntil: 'domcontentloaded' });
        await page.waitForSelector(element, { timeout: 5000 });
        const spanText = await page.$eval(element, el => el.textContent.trim());
        await browser.close();

        return spanText ? parseFloat(spanText.replace(/\D/g, '')) : null;
    } catch (error) {
        console.error('Browser error:', error.message);
        return null;
    }
};

export async function fetchPriceWithKnownMethod(link, method) {
  try {
      if (method === 'json-ld' || method === 'html-pattern') {
          const res = await axios.get(link, {
              headers: {
                  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
              }
          });
          const html = res.data;
          return method === 'json-ld' ? await fetchPriceMethod1(html) : await fetchPriceMethod2(html);
      } else if (method === 'browser') {
          return await fetchPriceMethodHeadlessBrowser(link, spanPowerNo);
      }
      return null;
  } catch (error) {
      console.error('Error in fetchPriceWithKnownMethod:', error.message);
      return null;
  }
}