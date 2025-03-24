import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import puppeteer from 'puppeteer';
import { chromium } from 'playwright';


// Known stores with spesial Methods
const spanPowerNo = "span[_ngcontent-ng-c3913698638]" // Element that contains the price



// Main function to find price and method frist time.
export async function fetchPriceAndAssignMethod(link) {
    try {
      if (link.includes("https://www.power.no")) {
        const fetchPriceMethodHeadlessBrowser = await fetchPriceMethodHeadlessBrowser(link, spanPowerNo);
      if (method1 !== null) { return method1 }
      }

      const res = await axios.get(link, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
      const html = res.data;    // Page Content
      console.log('HTML fetched, length:', html.length);
      console.log(html);

      const method1 = await fetchPriceMethod1(html);
      if (method1 !== null) { return method1 }

      const method2 = await fetchPriceMethod2(html);
      if (method2 !== null) { return method2 }
      

    } catch (error) {
        console.error('Error:', error.message);
    }
  };


async function fetchPriceMethod1(html) {
    // Try JSON-LD
    const jsonMatches = html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g);
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
          return parseFloat(price, 1); // 1 = Method 1
        } else {
          console.log('No Price Extracted from JSON-LD');
          return null;
        }
      } catch (error) {
        console.log('JSON parse error:', error.message);
      }
    }
};

async function fetchPriceMethod2(html) {
  const priceMatch = html.match(/<span class="product-price-now">\s*kr\s*([\d\s]+)(?:,-\s*)?<\/span>/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/\s/g, ''));
        console.log('Price from HTML:', price);
        return parseFloat(priceMatch);
      } else {
        console.log('No price found in JSON-LD or HTML');

        // Extra debug: Search for any price-like pattern
        const genericPriceMatch = html.match(/"price":\s*"(\d+(?:\.\d+)?)"/);
        if (genericPriceMatch) {
          console.log('Generic price found:', genericPriceMatch[1]);
          return parseFloat(genericPriceMatch); //return parseFloat(genericPriceMatch[1]);
        } else {
          console.log("No Price data was found")
          return null;
        }
      }
}

async function fetchPriceMethodHeadlessBrowser(link, element) {
  try {
      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      // Use your URL
      await page.goto(link, {
          waitUntil: 'domcontentloaded' // Faster than full network idle
      });

      // Wait for and extract the span by attribute
      await page.waitForSelector(element, { timeout: 5000 });
      const spanText = await page.$eval(element, el => el.textContent.trim());
      await browser.close();
      
      if (spanText) {
        console.log('Span value:', spanText); // Should output the Price
        return parseFloat(spanText);
      } else {
        console.log("No Span Value found")
        return null;
      }
      
  } catch (error) {
      console.error('Error:', error.message);
  }
}



