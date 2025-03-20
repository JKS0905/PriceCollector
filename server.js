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


async function fetchPrice() {
    try {
      // Fetch the webpage
      const res = await axios.get("https://www.megaflis.no/bad/baderomsinnredning/baderomsinnredning/lind-unique-80-baderomsmobel-uspeil");
      const html = res.data;
      console.log(html);  
      
      
      


    } catch (error) {
      console.error('Error fetching or parsing data:', error.message);
    }
  }
  
  fetchPrice();



// Middleware to serve static files (HTML)
//app.use(express.static(path.join(__dirname, 'public')));

//server.listen(SERVER_PORT, () => {
//    console.log(`Server is running on port ${SERVER_PORT}`); 
//});
