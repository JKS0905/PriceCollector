// server.jsssssssssssss
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { chromium } from 'playwright';
import { fetchPriceAndAssignMethod } from "./fetchPrices.js";


const server = express();

// ENV Variables
const SERVER_PORT = process.env.SERVER_PORT;

//const pool = new Pool({
//    user: "",
//    host: "",
//    database: "",
//    password: "",
//    port: "",
//
//});

const spanPowerNo = "span[_ngcontent-ng-c3913698638]"
const link1 = "https://buddy.no/butikk/katt/kattesand/total-cover-kattesand/"

fetchPriceAndAssignMethod(link1);

async function fetchPrice(link) {
  try {

    if (link.includes("https://www.power.no")) {
      getSpanValue(link, spanPowerNo);
      return;
    }

    const res = await axios.get(link,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      }
    );
    const html = res.data;
    console.log('HTML fetched, length:', html.length);
    
    console.log(html);

    // Try JSON-LD
    const jsonMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
    let foundPrice = false;
    for (const match of jsonMatches) {
      const jsonString = match[1];
      console.log('JSON-LD snippet:', jsonString.substring(0, 200)); // Debug
      try {
        const jsonData = JSON.parse(jsonString);
        if (jsonData["@type"] === "Product" && jsonData.offers) {
          const offer = Array.isArray(jsonData.offers) ? jsonData.offers[0] : jsonData.offers;
          const price = parseFloat(offer.price);
          console.log('Price from JSON-LD:', price);
          console.log('Name:', jsonData.name);
          foundPrice = true;
          break;
        }
      } catch (error) {
        console.log('JSON parse error:', error.message);
      }
    }

    if (!foundPrice) {
      // Fallback to HTML
      const priceMatch = html.match(/<span class="product-price-now">\s*kr\s*([\d\s]+)(?:,-\s*)?<\/span>/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/\s/g, ''));
        console.log('Price from HTML:', price);
      } else {
        console.log('No price found in JSON-LD or HTML');
        // Extra debug: Search for any price-like pattern
        const genericPriceMatch = html.match(/"price":\s*"(\d+(?:\.\d+)?)"/);
        if (genericPriceMatch) {
          console.log('Generic price found:', genericPriceMatch[1]);
          foundPrice = true;
          //return parseFloat(genericPriceMatch[1]);
        } else {
          console.log("No Price data was found")
        }
      }
    }

    if (!foundPrice) {
      // Load HTML into cheerio
      const $ = cheerio.load(html);
      // Look for the price element
      const priceText = $('span.price').text().trim();
      if (priceText) {
          const priceClean = priceText.replace(/\D/g, ''); // Remove non-digits
          console.log('Price:', priceClean);
          foundPrice = true;
      } else {
          console.log('Price not found in static HTML. Likely loaded via JS.');
      }
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Extract value from directly from span
async function getSpanValue(link, span) {
  try {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      // Use your URL
      await page.goto(link, {
          waitUntil: 'domcontentloaded' // Faster than full network idle
      });

      // Wait for and extract the span by attribute
      await page.waitForSelector(span, { timeout: 5000 });
      const spanText = await page.$eval(span, el => el.textContent.trim());
      console.log('Span value:', spanText); // Should output the Price
      await browser.close();
  } catch (error) {
      console.error('Error:', error.message);
  }
}

//const a = await fetchPrice(link1);
//console.log(a)


// Middleware to serve static files (HTML)
//app.use(express.static(path.join(__dirname, 'public')));

//server.listen(SERVER_PORT, () => {
//    console.log(`Server is running on port ${SERVER_PORT}`); 
//});
