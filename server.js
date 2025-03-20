// server.jsssssssssssss
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import axios from 'axios';
import { load } from 'cheerio';

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

const link1 = "https://www.komplett.no/product/1308342/pc-nettbrett/pc-baerbar-laptop/lenovo-ideapad-slim-3-chrome-14-fhd"


  async function fetchPrice2(link) {
    try {
      const res = await axios.get(
        link,
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
            console.log('Availability:', offer.availability);
            foundPrice = true;
            break;
          }
        } catch (e) {
          console.log('JSON parse error:', e.message);
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
            return parseFloat(genericPriceMatch[1]);
          } else {
            console.log("No Price data was found")
          }
        }
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  }
  const a = await fetchPrice2(link1);
  console.log(a);


// Middleware to serve static files (HTML)
//app.use(express.static(path.join(__dirname, 'public')));

//server.listen(SERVER_PORT, () => {
//    console.log(`Server is running on port ${SERVER_PORT}`); 
//});
