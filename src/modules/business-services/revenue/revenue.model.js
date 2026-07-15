import pool from '../../../shared/database/db.js';

class RevenueModel {
    // 1. Thống kê tổng quan (Summary)
    async getSummary(startDate, endDate) {
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
        const result = await pool.query(query, [startDate, endDate]);
        return result.rows[0];
    }

    // 2. Dữ liệu biểu đồ doanh thu theo thời gian (Time-Series Chart)
    async getRevenueTimeline(startDate, endDate, groupBy = 'day') {
        let dateTrunc = 'day';
        if (groupBy === 'month') dateTrunc = 'month';
        if (groupBy === 'year') dateTrunc = 'year';

        const query = `
            SELECT 
                DATE_TRUNC('${dateTrunc}', created_at) AS date_group,
                COALESCE(SUM(final_amount), 0) AS revenue,
                COUNT(id) AS bill_count
            FROM bill_payments
            WHERE created_at >= $1 AND created_at <= $2
            GROUP BY date_group
            ORDER BY date_group ASC
        `;
        const result = await pool.query(query, [startDate, endDate]);
        return result.rows;
    }

    // 3. Phân bổ phương thức thanh toán (Pie Chart)
    async getPaymentMethodsDist(startDate, endDate) {
        const query = `
            SELECT 
                payment_method,
                COALESCE(SUM(final_amount), 0) AS amount,
                COUNT(id) AS count
            FROM bill_payments
            WHERE created_at >= $1 AND created_at <= $2
            GROUP BY payment_method
            ORDER BY amount DESC
        `;
        const result = await pool.query(query, [startDate, endDate]);
        return result.rows;
    }

    // 4. (Tuỳ chọn) Top phòng mang lại doanh thu cao nhất
    async getTopRooms(startDate, endDate, limit = 5) {
        const query = `
            SELECT 
                room_number,
                COALESCE(SUM(final_amount), 0) AS total_revenue,
                COUNT(id) AS bookings_count
            FROM bill_payments
            WHERE created_at >= $1 AND created_at <= $2
            GROUP BY room_number
            ORDER BY total_revenue DESC
            LIMIT $3
        `;
        const result = await pool.query(query, [startDate, endDate, limit]);
        return result.rows;
    }
}

export default new RevenueModel();
