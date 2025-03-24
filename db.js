import dotenv from 'dotenv';
dotenv.config(); // Load environment variables from .env file
import pkg from 'pg';
const { Pool } = pkg;


const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
  
  });

  export async function initializeDatabase() {
    try {
        pool.on('connect', () => console.log('Connected to DB'));
        pool.on('error', (err) => console.error('DB error:', err.message));

        const schemaCheck = await pool.query('SELECT current_schema()');
        console.log('Current schema:', schemaCheck.rows[0].current_schema);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS prices (
                url VARCHAR(255) PRIMARY KEY,
                price FLOAT NOT NULL,
                method VARCHAR(50) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Prices table ensured');
    } catch (error) {
        console.error('Error initializing database:', error.message);
        throw error;
    }
}
  
export async function savePriceEntry(url, priceData) {
    try {
        const query = `
            INSERT INTO prices (url, price, method, timestamp)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (url) DO UPDATE
            SET price = EXCLUDED.price,
                method = EXCLUDED.method,
                timestamp = EXCLUDED.timestamp
            RETURNING *
        `;
        const values = [
            url,
            priceData.price,
            priceData.method,
            new Date().toISOString()
        ];
        const res = await pool.query(query, values);
        console.log(`Saved to DB: ${res.rows[0]}`);
        return res.row
    } catch (error) {
        console.error('Error saving to DB:', error.message);
        throw error;
    }
};

export async function getPriceEntry(url) {
    try {
        const res = await pool.query('SELECT * FROM prices WHERE url = $1', [url]);
            if (res.rows.lenght === 0) {
                console.log(`No entry found for ${url}`);
                return null;
            }
            console.log('Retrieved from DB:', res.rows[0]);
            return res.rows[0];
    } catch (error) {
        console.error('Error retrieving from DB:', error.message);
        throw error;
    }
}

export async function checkPriceUpdate(url, fetchPriceWithKnownMethod) {
        try {
            const storedEntry = await getPriceEntry(url);
            if (!storedEntry) {
                console.log(`No stored entry for ${url}`);
                return null;
            }

            const { method } = storedEntry;
            const newResult = await fetchPriceWithKnownMethod(url, method);

            if (!newResult) {
                console.log(`Failed to fetch new price for ${url} with method ${method}`);
                return { url, changed: false, oldPrice: storedEntry.price, newPrice: null };
            }

            const newPrice = newResult.price;
            const changed = newPrice !== storedEntry.price;

            if (changed) {
                console.log(`Price changed for ${url}: ${storedEntry.price} -> ${newPrice}`);
                const updateEntry = await savePriceEntry(url, newResult);
                return { url, changed: true, oldPrice: storedEntry.price, newPrice };
            } else {
                console.log(`Price unchanged for ${url}: ${storedEntry.price}`);
                return { url, changed: false, oldPrice: storedEntry.price, newPrice };
            }



        } catch (error) {
            console.error('Error checking price update:', error.message);
            throw error;
        }

}
  