const { Pool } = require('pg');
require('dotenv').config({ path: 'D:/Hotel-management-system/Hotel-system-backend/.env' });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const start = new Date();
start.setDate(start.getDate() - 6);
const startDate = start.toISOString();
const endDate = new Date().toISOString();

console.log('Testing query with:', {startDate, endDate});

const query = `
    SELECT 
        COALESCE(SUM(final_amount), 0) AS total_revenue,
        COALESCE(SUM(room_price), 0) AS total_room_revenue,
        COALESCE(SUM(service_price), 0) AS total_service_revenue,
        COUNT(id) AS total_bills,
        COALESCE(AVG(final_amount), 0) AS avg_revenue_per_bill
    FROM bill_payments
    WHERE created_at >= $1 AND created_at <= $2
`;

pool.query(query, [startDate, endDate])
  .then(res => console.log('Result:', res.rows[0]))
  .catch(console.error)
  .finally(() => pool.end());
