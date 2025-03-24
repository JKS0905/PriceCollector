// server.js
import dotenv from 'dotenv';
import express from 'express';
import {
  fetchPriceAndAssignMethod,
  fetchPriceWithKnownMethod
} from './fetchPrices.js';
import {
  savePriceEntry,
  getPriceEntry,
  checkPriceUpdate,
  initializeDatabase
} from './db.js';

const server = express();

// ENV Variables
const SERVER_PORT = process.env.SERVER_PORT;

const link = "https://www.power.no/mobil-og-foto/mobiltelefon/samsung-galaxy-s25-ultra-256-gb-titanium-gray/p-3832130/";

//initializeDatabase();

console.log("Starting");
let entry = await fetchPriceAndAssignMethod(link)
await savePriceEntry(link, entry);


// Middleware to serve static files (HTML)
//app.use(express.static(path.join(__dirname, 'public')));

//server.listen(SERVER_PORT, () => {
//    console.log(`Server is running on port ${SERVER_PORT}`); 
//});
